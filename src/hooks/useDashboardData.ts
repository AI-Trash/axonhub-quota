import { useCallback, useEffect, useRef, useState } from "react"

import { fetchMetrics } from "@/api/client"
import type { ConnectionConfig, DashboardMetrics } from "@/api/types"
import { useLanguage } from "@/lib/i18n"

const REFRESH_INTERVAL_MS = 60_000

interface DashboardDataState {
  metrics: DashboardMetrics | null
  isLoading: boolean
  error: string | null
}

export function useDashboardData(connection: ConnectionConfig | null) {
  const { t } = useLanguage()
  const [state, setState] = useState<DashboardDataState>({
    metrics: null,
    isLoading: true,
    error: null,
  })
  const intervalRef = useRef<number | null>(null)

  const refresh = useCallback(async () => {
    if (!connection) {
      setState({
        metrics: null,
        isLoading: false,
        error: null,
      })
      return
    }

    setState((currentState) => ({
      ...currentState,
      isLoading: currentState.metrics === null,
      error: null,
    }))

    try {
      const metrics = await fetchMetrics(connection.apiKey)

      setState({
        metrics,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      setState((currentState) => ({
        ...currentState,
        isLoading: false,
        error: error instanceof Error ? error.message : t.errors.failedToFetchDashboardData,
      }))
    }
  }, [connection, t.errors.failedToFetchDashboardData])

  useEffect(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    void refresh()

    if (connection) {
      intervalRef.current = window.setInterval(() => {
        void refresh()
      }, REFRESH_INTERVAL_MS)
    }

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
      }
    }
  }, [connection, refresh])

  return {
    metrics: state.metrics,
    isLoading: state.isLoading,
    error: state.error,
    refreshIntervalMs: REFRESH_INTERVAL_MS,
  }
}
