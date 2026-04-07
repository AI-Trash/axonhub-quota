import { useCallback, useEffect, useState } from "react"

import type { ConnectionConfig } from "@/api/types"
import { createSessionApiKey, loginSession } from "@/api/client"
import { useLanguage } from "@/lib/i18n"

const STORAGE_KEY = "axonhub-quota-api-key"

export interface ConnectInput {
  apiKey: string
  createTotalQuota?: number
}

interface UseAuthState {
  connection: ConnectionConfig | null
  isConnecting: boolean
  isRestoring: boolean
  error: string | null
}

function loadStoredApiKey(): string | null {
  const apiKey = localStorage.getItem(STORAGE_KEY)
  return apiKey ? apiKey.trim() : null
}

function saveStoredApiKey(apiKey: string) {
  localStorage.setItem(STORAGE_KEY, apiKey)
}

function clearStoredApiKey() {
  localStorage.removeItem(STORAGE_KEY)
}

export function useAuth() {
  const { t } = useLanguage()
  const [state, setState] = useState<UseAuthState>({
    connection: null,
    isConnecting: false,
    isRestoring: true,
    error: null,
  })

  const disconnect = useCallback(() => {
    clearStoredApiKey()
    setState({
      connection: null,
      isConnecting: false,
      isRestoring: false,
      error: null,
    })
  }, [])

  const connect = useCallback(async (input: ConnectInput) => {
    const typedApiKey = input.apiKey.trim()

    setState((currentState) => ({
      ...currentState,
      isConnecting: true,
      error: null,
    }))

    try {
      let apiKey = typedApiKey

      if (!apiKey) {
        const totalQuota = Number.isInteger(input.createTotalQuota) && input.createTotalQuota !== undefined
          ? input.createTotalQuota
          : 0
        const created = await createSessionApiKey(totalQuota)
        apiKey = created.apiKey
      }

      const session = await loginSession(apiKey)

      const connection: ConnectionConfig = {
        apiKey,
        role: session.role,
      }

      saveStoredApiKey(apiKey)

      setState({
        connection,
        isConnecting: false,
        isRestoring: false,
        error: null,
      })

      return true
    } catch (error) {
      setState((currentState) => ({
        ...currentState,
        isConnecting: false,
        isRestoring: false,
        error: error instanceof Error ? error.message : t.errors.failedToConnect,
      }))

      return false
    }
  }, [t.errors.failedToConnect])

  const restore = useCallback(async () => {
    const storedApiKey = loadStoredApiKey()

    if (!storedApiKey) {
      setState((currentState) => ({
        ...currentState,
        isRestoring: false,
      }))
      return
    }

    try {
      const session = await loginSession(storedApiKey)

      setState({
        connection: {
          apiKey: storedApiKey,
          role: session.role,
        },
        isConnecting: false,
        isRestoring: false,
        error: null,
      })
    } catch (error) {
      clearStoredApiKey()
      setState({
        connection: null,
        isConnecting: false,
        isRestoring: false,
        error:
          error instanceof Error
            ? `${t.errors.storedSessionExpired}: ${error.message}`
            : t.errors.storedSessionExpired,
      })
    }
  }, [t.errors.storedSessionExpired])

  useEffect(() => {
    void restore()
  }, [restore])

  return {
    connection: state.connection,
    isConnected: Boolean(state.connection),
    isConnecting: state.isConnecting,
    isRestoring: state.isRestoring,
    error: state.error,
    connect,
    disconnect,
  }
}
