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
  adminKey: string
  externalProjectId: string
  port: number
  nodeEnv: string
  frontendDistPath: string
  frontendIndexPath: string
  redeemDbPath: string
  redeemTokenTtlSeconds: number
}

export type SessionRole = "admin" | "user"

export interface SessionLoginRequestBody {
  apiKey: string
}

export interface SessionLoginResponse {
  role: SessionRole
}

export interface CreateRedeemRequestBody {
  amount: number
}

export interface CreateRedeemResponse {
  redeem: RedeemRecord
  token: string
}

export interface RedeemRecord {
  jti: string
  amount: number
  issuedAt: number
  expiresAt: number
  usedAt: number | null
  usedByApiKey: string | null
}

export interface RedeemSummaryRequestBody {
  apiKey: string
  limit?: number
}

export interface RedeemSummaryResponse {
  redeems: RedeemRecord[]
  usedCount: number
  totalCount: number
}

export interface RedeemCardRequestBody {
  apiKey: string
  redeem: string
}

export interface RedeemCardResponse {
  amount: number
  balance: number
  redeemedAt: number
}

export interface RedeemBalanceResponse {
  balance: number
}

export interface RedeemBalanceRequestBody {
  apiKey: string
}

export type CreateSessionApiKeyRequestBody = Record<string, never>

export interface CreatedApiKey {
  id: string
  key: string
  name: string
  projectId: string
  totalQuota: number
}

export interface CreateSessionApiKeyResponse {
  id: string
  apiKey: string
  name: string
  projectId: string
  totalQuota: number
}

export interface CreateApiKeyMutationData {
  createAPIKey: {
    id: string
    key: string
    name: string
  }
}

export interface CreateApiKeyMutationVariables {
  input: {
    name: string
    projectID: string
    type: "service_account"
    scopes: string[]
  }
}

export interface UpdateApiKeyProfilesMutationData {
  updateAPIKeyProfiles: {
    id: string
  }
}

export interface UpdateApiKeyProfilesMutationVariables {
  id: string
  input: {
    activeProfile: string
    profiles: Array<{
      name: string
      modelMappings: unknown[]
      channelIDs: number[]
      channelTags: string[]
      channelTagsMatchMode: "any"
      modelIDs: string[]
      quota: {
        totalTokens: number
        period: {
          type: "all_time"
        }
      }
    }>
  }
}
