import type { DashboardMetrics } from "@/api/types"

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isDashboardMetrics(value: unknown): value is DashboardMetrics {
  if (!isObject(value)) {
    return false
  }

  const { tokenStat, costStat, quotaUsages, cacheRate, scoped, chart, fetchedAt } = value

  const hasNullableObject =
    tokenStat === null || isObject(tokenStat)

  const hasNullableCostObject =
    costStat === null || isObject(costStat)

  const hasScopedMetrics =
    isObject(scoped) &&
    isObject(scoped.today) &&
    isObject(scoped.week) &&
    isObject(scoped.today.window) &&
    isObject(scoped.week.window)

  const hasChartMetrics =
    isObject(chart) &&
    Array.isArray(chart.dailyTokens)

  return (
    hasNullableObject &&
    hasNullableCostObject &&
    Array.isArray(quotaUsages) &&
    typeof cacheRate === "number" &&
    hasScopedMetrics &&
    hasChartMetrics &&
    typeof fetchedAt === "number"
  )
}

export async function fetchMetrics(apiKey: string): Promise<DashboardMetrics> {
  const response = await fetch('/api/metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || `Request failed (${response.status})`)
  }

  const data: unknown = await response.json()

  if (!isDashboardMetrics(data)) {
    throw new Error("Invalid metrics response")
  }

  return data
}
