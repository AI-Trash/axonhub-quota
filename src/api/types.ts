export interface ScopedWindow {
  start: string
  end: string
  timezone: string
}

export interface UsageSummary {
  totalTokens: number
  cost: number | null
  costAvailable: boolean
}

export interface ScopedUsageSummary extends UsageSummary {
  window: ScopedWindow
}

export interface UsageChartPoint extends UsageSummary {
  date: string
  label: string
}

export interface QuotaPeriod {
  type: string
}

export interface QuotaConfig {
  requests: number | null
  totalTokens: number | null
  cost: number | null
  period: QuotaPeriod
}

export interface QuotaWindow {
  start: string
  end: string
}

export interface QuotaUsage {
  requestCount: number
  totalTokens: number
  totalCost: number
}

export interface ApiKeyQuotaUsage {
  profileName: string
  quota: QuotaConfig
  window: QuotaWindow
  usage: QuotaUsage
}

export interface DashboardMetrics {
  quotaUsages: ApiKeyQuotaUsage[]
  cacheRate: number
  usage: {
    total: UsageSummary
    today: ScopedUsageSummary
    week: ScopedUsageSummary
  }
  chart: {
    dailyUsage: UsageChartPoint[]
  }
  fetchedAt: number
}

export interface ConnectionConfig {
  apiKey: string
}
