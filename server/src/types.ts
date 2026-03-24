export interface SignInRequest {
  email: string
  password: string
}

export interface SignInUser {
  id: {
    type: string
    id: number | string
  }
  email: string
  firstName: string
  lastName: string
}

export interface SignInResponse {
  user: SignInUser
  token: string
}

export interface GraphQLError {
  message: string
}

export interface GraphQLRequest<TVariables extends object> {
  query: string
  variables?: TVariables
}

export interface GraphQLResponse<TData> {
  data?: TData
  errors?: GraphQLError[]
}

export interface ApiKeyNode {
  id: string
  key: string
  name: string
  status: string
}

export interface ApiKeysQueryData {
  apiKeys: {
    edges: Array<{
      node: ApiKeyNode
    }>
  }
}

export interface ApiKeysQueryVariables {
  first: number
}

export interface TokenStat {
  apiKeyId: string
  apiKeyName: string
  inputTokens: number
  outputTokens: number
  cachedTokens: number
  reasoningTokens: number
  totalTokens: number
}

export interface TokenStatsByApiKeyQueryData {
  tokenStatsByAPIKey: TokenStat[]
}

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

export interface APIKeyTokenUsageStat {
  apiKeyId: string
  inputTokens: number
  outputTokens: number
  cachedTokens: number
  reasoningTokens: number
}

export interface APIKeyTokenUsageStatsQueryData {
  apiKeyTokenUsageStats: APIKeyTokenUsageStat[]
}

export interface APIKeyTokenUsageStatsInput {
  apiKeyIds: string[]
  createdAtGTE?: string
  createdAtLTE?: string
}

export interface CostStat {
  apiKeyId: string
  apiKeyName: string
  cost: number
}

export interface CostStatsByApiKeyQueryData {
  costStatsByAPIKey: CostStat[]
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

export interface ApiKeyQuotaUsagesQueryData {
  apiKeyQuotaUsages: ApiKeyQuotaUsage[]
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

export interface MetricsRequestBody {
  apiKey: string
}

export interface ErrorResponse {
  error: string
}

export interface HealthResponse {
  status: "ok"
}

export interface AppConfig {
  axonhubUrl: string
  adminEmail: string
  adminPassword: string
  port: number
  nodeEnv: string
  frontendDistPath: string
  frontendIndexPath: string
}
