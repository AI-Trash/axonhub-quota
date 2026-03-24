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
  fetchedAt: number
}

export interface ConnectionConfig {
  apiKey: string
}

export type MetricsResponse = DashboardMetrics
