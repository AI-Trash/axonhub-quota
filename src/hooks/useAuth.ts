import { useCallback, useEffect, useMemo, useState } from "react"

import type { ConnectionConfig } from "@/api/types"
import { fetchMetrics } from "@/api/client"

const STORAGE_KEY = "axonhub-dashboard-api-key"

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
  const [state, setState] = useState<UseAuthState>({
    connection: null,
    isConnecting: false,
    isRestoring: true,
    error: null,
  })

  const setError = useCallback((error: string | null) => {
    setState((currentState) => ({
      ...currentState,
      error,
    }))
  }, [])

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
      setError("Please enter your API key")
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
        error: error instanceof Error ? error.message : "Failed to connect",
      }))

      return false
    }
  }, [setError])

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
            ? `Stored session expired: ${error.message}`
            : "Stored session expired",
      })
    }
  }, [])

  useEffect(() => {
    void restore()
  }, [restore])

  const isConnected = useMemo(() => Boolean(state.connection), [state.connection])

  return {
    connection: state.connection,
    isConnected,
    isConnecting: state.isConnecting,
    isRestoring: state.isRestoring,
    error: state.error,
    connect,
    disconnect,
    clearError: () => setError(null),
  }
}
