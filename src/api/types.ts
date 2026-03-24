export interface TokenStat {
  apiKeyId: string
  apiKeyName: string
  inputTokens: number
  outputTokens: number
  cachedTokens: number
  reasoningTokens: number
  totalTokens: number
}

export interface CostStat {
  apiKeyId: string
  apiKeyName: string
  cost: number
}

export interface TokenBreakdown {
  inputTokens: number
  outputTokens: number
  cachedTokens: number
  reasoningTokens: number
  totalTokens: number
}

export interface ScopedWindow {
  start: string
  end: string
  timezone: string
}

export interface ScopedTokenStats extends TokenBreakdown {
  cacheRate: number
  window: ScopedWindow
}

export interface TokenChartPoint extends TokenBreakdown {
  date: string
  label: string
  cacheRate: number
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
  tokenStat: TokenStat | null
  costStat: CostStat | null
  quotaUsages: ApiKeyQuotaUsage[]
  cacheRate: number
  scoped: {
    today: ScopedTokenStats
    week: ScopedTokenStats
  }
  chart: {
    dailyTokens: TokenChartPoint[]
  }
  fetchedAt: number
}

export interface ConnectionConfig {
  apiKey: string
}
