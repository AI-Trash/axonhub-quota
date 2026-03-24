import type { DashboardMetrics } from "@/api/types"

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

  const data = (await response.json()) as DashboardMetrics
  return data
}
