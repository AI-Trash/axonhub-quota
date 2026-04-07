import type {
  CreateSessionApiKeyResponse,
  CreateRedeemResponse,
  DashboardMetrics,
  RedeemBalanceResponse,
  RedeemCardResponse,
  RedeemSummaryResponse,
  SessionLoginResponse,
} from "@/api/types"

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isDashboardMetrics(value: unknown): value is DashboardMetrics {
  if (!isObject(value)) {
    return false
  }

  const { quotaUsages, cacheRate, usage, chart, fetchedAt } = value

  const hasUsageMetrics =
    isObject(usage) &&
    isObject(usage.total) &&
    isObject(usage.today) &&
    isObject(usage.week) &&
    isObject(usage.today.window) &&
    isObject(usage.week.window)

  const hasChartMetrics =
    isObject(chart) &&
    Array.isArray(chart.dailyUsage)

  return (
    Array.isArray(quotaUsages) &&
    typeof cacheRate === "number" &&
    hasUsageMetrics &&
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

function isSessionLoginResponse(value: unknown): value is SessionLoginResponse {
  return isObject(value) && (value.role === "admin" || value.role === "user")
}

function isRedeemRecord(value: unknown) {
  if (!isObject(value)) {
    return false
  }

  return (
    typeof value.jti === "string"
    && typeof value.amount === "number"
    && typeof value.issuedAt === "number"
    && typeof value.expiresAt === "number"
    && (typeof value.usedAt === "number" || value.usedAt === null)
    && (typeof value.usedByApiKey === "string" || value.usedByApiKey === null)
  )
}

function isCreateRedeemResponse(value: unknown): value is CreateRedeemResponse {
  return isObject(value) && isRedeemRecord(value.redeem) && typeof value.token === "string"
}

function isRedeemSummaryResponse(value: unknown): value is RedeemSummaryResponse {
  return (
    isObject(value)
    && Array.isArray(value.redeems)
    && value.redeems.every(isRedeemRecord)
    && typeof value.usedCount === "number"
    && typeof value.totalCount === "number"
  )
}

function isRedeemCardResponse(value: unknown): value is RedeemCardResponse {
  return (
    isObject(value)
    && typeof value.amount === "number"
    && typeof value.balance === "number"
    && typeof value.redeemedAt === "number"
  )
}

function isRedeemBalanceResponse(value: unknown): value is RedeemBalanceResponse {
  return isObject(value) && typeof value.balance === "number"
}

function isCreateSessionApiKeyResponse(value: unknown): value is CreateSessionApiKeyResponse {
  return (
    isObject(value)
    && typeof value.id === "string"
    && typeof value.apiKey === "string"
    && typeof value.name === "string"
    && typeof value.projectId === "string"
    && typeof value.totalQuota === "number"
  )
}

async function parseError(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type")

  if (contentType?.includes("application/json")) {
    const payload = (await response.json()) as unknown
    if (isObject(payload) && typeof payload.error === "string") {
      return payload.error
    }
  }

  const text = await response.text()
  return text || `Request failed (${response.status})`
}

export async function loginSession(apiKey: string): Promise<SessionLoginResponse> {
  const response = await fetch('/api/session/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  const data: unknown = await response.json()

  if (!isSessionLoginResponse(data)) {
    throw new Error("Invalid session login response")
  }

  return data
}

export async function createRedeem(apiKey: string, amount: number): Promise<CreateRedeemResponse> {
  const response = await fetch('/api/admin/redeems', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, amount }),
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  const data: unknown = await response.json()

  if (!isCreateRedeemResponse(data)) {
    throw new Error("Invalid create redeem response")
  }

  return data
}

export async function fetchRedeems(apiKey: string): Promise<RedeemSummaryResponse> {
  const response = await fetch('/api/admin/redeems/list', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  const data: unknown = await response.json()

  if (!isRedeemSummaryResponse(data)) {
    throw new Error("Invalid redeem summary response")
  }

  return data
}

export async function redeemCard(apiKey: string, redeem: string): Promise<RedeemCardResponse> {
  const response = await fetch('/api/redeem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, redeem }),
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  const data: unknown = await response.json()

  if (!isRedeemCardResponse(data)) {
    throw new Error("Invalid redeem response")
  }

  return data
}

export async function fetchRedeemBalance(apiKey: string): Promise<RedeemBalanceResponse> {
  const response = await fetch('/api/redeem/balance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  const data: unknown = await response.json()

  if (!isRedeemBalanceResponse(data)) {
    throw new Error("Invalid redeem balance response")
  }

  return data
}

export async function createSessionApiKey(): Promise<CreateSessionApiKeyResponse> {
  const response = await fetch('/api/session/create-key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  const data: unknown = await response.json()

  if (!isCreateSessionApiKeyResponse(data)) {
    throw new Error("Invalid create session api key response")
  }

  return data
}
