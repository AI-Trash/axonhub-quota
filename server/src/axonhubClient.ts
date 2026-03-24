import { HttpError } from "./errors"
import {
  API_KEYS_QUERY,
  API_KEY_QUOTA_USAGES_QUERY,
  COST_STATS_BY_API_KEY_QUERY,
  TOKEN_STATS_BY_API_KEY_QUERY,
} from "./queries"
import type {
  ApiKeyNode,
  ApiKeyQuotaUsagesQueryData,
  ApiKeysQueryData,
  ApiKeysQueryVariables,
  AppConfig,
  CostStatsByApiKeyQueryData,
  DashboardMetrics,
  GraphQLError,
  GraphQLRequest,
  GraphQLResponse,
  SignInRequest,
  SignInResponse,
  TokenStatsByApiKeyQueryData,
} from "./types"

interface JwtCache {
  token: string
  expiresAt: number | null
}

interface QuotaVariables {
  apiKeyId: string
}

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null
}

function getErrorMessage(errors: GraphQLError[] | undefined): string {
  if (!errors || errors.length === 0) {
    return "AxonHub GraphQL request failed"
  }

  return errors.map((error) => error.message).join("; ")
}

function decodeJwtExpiration(token: string): number | null {
  const segments = token.split(".")

  if (segments.length < 2) {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(segments[1], "base64url").toString("utf8")) as unknown

    if (!isRecord(payload) || typeof payload.exp !== "number") {
      return null
    }

    return payload.exp * 1000
  } catch {
    return null
  }
}

function calculateCacheRate(inputTokens: number, cachedTokens: number): number {
  if (inputTokens <= 0) {
    return 0
  }

  return (cachedTokens / inputTokens) * 100
}

function isSignInResponse(value: unknown): value is SignInResponse {
  if (!isRecord(value) || typeof value.token !== "string" || !isRecord(value.user)) {
    return false
  }

  return (
    isRecord(value.user.id) &&
    typeof value.user.id.type === "string" &&
    (typeof value.user.id.id === "string" || typeof value.user.id.id === "number") &&
    typeof value.user.email === "string" &&
    typeof value.user.firstName === "string" &&
    typeof value.user.lastName === "string"
  )
}

export class AxonHubAdminClient {
  private cachedJwt: JwtCache | null = null
  private authRequest: Promise<string> | null = null

  constructor(private readonly config: AppConfig) {}

  async fetchDashboardMetrics(apiKey: string): Promise<DashboardMetrics> {
    const apiKeysData = await this.graphqlRequest<ApiKeysQueryData, ApiKeysQueryVariables>(API_KEYS_QUERY, {
      first: 500,
    })
    const apiKeyNode = apiKeysData.apiKeys.edges.find((edge) => edge.node.key === apiKey)?.node ?? null

    if (!apiKeyNode) {
      throw new HttpError(404, "API key not found")
    }

    const [tokenStatsData, costStatsData, quotaUsagesData] = await Promise.all([
      this.graphqlRequest<TokenStatsByApiKeyQueryData, Record<string, never>>(TOKEN_STATS_BY_API_KEY_QUERY),
      this.graphqlRequest<CostStatsByApiKeyQueryData, Record<string, never>>(COST_STATS_BY_API_KEY_QUERY),
      this.graphqlRequest<ApiKeyQuotaUsagesQueryData, QuotaVariables>(API_KEY_QUOTA_USAGES_QUERY, {
        apiKeyId: apiKeyNode.id,
      }),
    ])

    const tokenStat = tokenStatsData.tokenStatsByAPIKey.find((item) => item.apiKeyId === apiKeyNode.id) ?? null
    const costStat = costStatsData.costStatsByAPIKey.find((item) => item.apiKeyId === apiKeyNode.id) ?? null

    return {
      tokenStat,
      costStat,
      quotaUsages: quotaUsagesData.apiKeyQuotaUsages,
      cacheRate: calculateCacheRate(tokenStat?.inputTokens ?? 0, tokenStat?.cachedTokens ?? 0),
      fetchedAt: Date.now(),
    }
  }

  private async graphqlRequest<TData, TVariables extends object>(
    query: string,
    variables?: TVariables,
  ): Promise<TData> {
    return this.graphqlRequestWithRetry<TData, TVariables>(query, variables, false)
  }

  private async graphqlRequestWithRetry<TData, TVariables extends object>(
    query: string,
    variables: TVariables | undefined,
    hasRetried: boolean,
  ): Promise<TData> {
    const token = hasRetried ? await this.authenticate(true) : await this.authenticate(false)
    const requestBody: GraphQLRequest<TVariables> = { query }

    if (variables) {
      requestBody.variables = variables
    }

    const response = await this.fetchFromAxonHub(`${this.config.axonhubUrl}/admin/graphql`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (response.status === 401) {
      this.cachedJwt = null

      if (!hasRetried) {
        return this.graphqlRequestWithRetry<TData, TVariables>(query, variables, true)
      }

      throw new HttpError(503, "Failed to authenticate with AxonHub admin API")
    }

    if (!response.ok) {
      throw new HttpError(502, `AxonHub GraphQL request failed with status ${response.status}`)
    }

    const payload = (await this.readJson(response)) as GraphQLResponse<TData>

    if (payload.errors && payload.errors.length > 0) {
      throw new HttpError(502, getErrorMessage(payload.errors))
    }

    if (payload.data === undefined) {
      throw new HttpError(502, "AxonHub GraphQL response did not include data")
    }

    return payload.data
  }

  private async authenticate(forceRefresh: boolean): Promise<string> {
    if (!forceRefresh && this.cachedJwt && !this.isJwtExpired(this.cachedJwt)) {
      return this.cachedJwt.token
    }

    if (this.authRequest) {
      return this.authRequest
    }

    this.authRequest = this.requestAuthentication()

    try {
      return await this.authRequest
    } finally {
      this.authRequest = null
    }
  }

  private async requestAuthentication(): Promise<string> {
    const requestBody: SignInRequest = {
      email: this.config.adminEmail,
      password: this.config.adminPassword,
    }

    const response = await this.fetchFromAxonHub(`${this.config.axonhubUrl}/admin/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new HttpError(503, "Failed to authenticate with AxonHub admin API")
    }

    const payload = await this.readJson(response)

    if (!isSignInResponse(payload)) {
      throw new HttpError(503, "AxonHub auth response was invalid")
    }

    this.cachedJwt = {
      token: payload.token,
      expiresAt: decodeJwtExpiration(payload.token),
    }

    return payload.token
  }

  private isJwtExpired(cache: JwtCache): boolean {
    if (cache.expiresAt === null) {
      return false
    }

    return cache.expiresAt <= Date.now() + 30_000
  }

  private async fetchFromAxonHub(url: string, init: RequestInit): Promise<Response> {
    try {
      return await fetch(url, init)
    } catch {
      throw new HttpError(502, "AxonHub is unreachable")
    }
  }

  private async readJson(response: Response): Promise<unknown> {
    try {
      return (await response.json()) as unknown
    } catch {
      throw new HttpError(502, "AxonHub returned invalid JSON")
    }
  }
}
