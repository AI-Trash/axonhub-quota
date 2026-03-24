import { useCallback, useEffect, useState } from "react"

import type { ConnectionConfig } from "@/api/types"
import { fetchMetrics } from "@/api/client"
import { useLanguage } from "@/lib/i18n"

const STORAGE_KEY = "axonhub-quota-api-key"

export interface ConnectInput {
  apiKey: string
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
    const apiKey = input.apiKey.trim()

    if (!apiKey) {
      setState((currentState) => ({
        ...currentState,
        error: t.errors.enterApiKey,
      }))
      return false
    }

    setState((currentState) => ({
      ...currentState,
      isConnecting: true,
      error: null,
    }))

    try {
      await fetchMetrics(apiKey)

      const connection: ConnectionConfig = {
        apiKey,
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
  }, [t.errors.enterApiKey, t.errors.failedToConnect])

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
      await fetchMetrics(storedApiKey)

      setState({
        connection: {
          apiKey: storedApiKey,
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
