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
  role: "admin" | "user"
}

export interface SessionLoginResponse {
  role: "admin" | "user"
}

export interface RedeemRecord {
  jti: string
  amount: number
  issuedAt: number
  expiresAt: number
  usedAt: number | null
  usedByApiKey: string | null
  disabledAt: number | null
  disabledByApiKey: string | null
}

export interface CreatedRedeemToken {
  redeem: RedeemRecord
  token: string
}

export interface CreateRedeemResponse {
  items: CreatedRedeemToken[]
  createdCount: number
}

export type RedeemControlAction = "disable" | "enable" | "delete"

export interface RedeemControlResponse {
  action: RedeemControlAction
  redeem: RedeemRecord | null
}

export interface RedeemSummaryResponse {
  redeems: RedeemRecord[]
  usedCount: number
  totalCount: number
}

export interface RedeemCardResponse {
  amount: number
  balance: number
  redeemedAt: number
}

export interface RedeemBalanceResponse {
  balance: number
}

export interface CreateSessionApiKeyResponse {
  id: string
  apiKey: string
  name: string
  projectId: string
  totalQuota: number
}
