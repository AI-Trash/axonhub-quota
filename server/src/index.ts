import fs from "node:fs"
import path from "node:path"

import cors from "cors"
import express, { type Request, type Response } from "express"

import { AxonHubAdminClient } from "./axonhubClient"
import { loadConfig } from "./config"
import { HttpError, isHttpError } from "./errors"
import { RedeemStore } from "./redeemStore"
import { deriveRedeemSigningKey, signRedeemToken, verifyRedeemToken } from "./redeemToken"
import type {
  CreateSessionApiKeyRequestBody,
  CreateSessionApiKeyResponse,
  CreateRedeemRequestBody,
  CreateRedeemResponse,
  RedeemControlRequestBody,
  RedeemControlResponse,
  DashboardMetrics,
  ErrorResponse,
  HealthResponse,
  MetricsRequestBody,
  RedeemBalanceRequestBody,
  RedeemBalanceResponse,
  RedeemCardRequestBody,
  RedeemSummaryRequestBody,
  RedeemCardResponse,
  RedeemSummaryResponse,
  SessionLoginRequestBody,
  SessionLoginResponse,
} from "./types"

const config = loadConfig()
const client = new AxonHubAdminClient(config)
const redeemStore = new RedeemStore(config.redeemDbPath)
const redeemSigningKey = deriveRedeemSigningKey(config.adminKey)
const app = express()
const hasFrontendBuild = fs.existsSync(config.frontendIndexPath)
const isProduction = config.nodeEnv === "production"
const REDEEM_ISSUER = "axonhub-quota"
const REDEEM_AUDIENCE = "axonhub-redeem"
const CREATE_KEY_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const createKeyRateLimitByIp = new Map<string, number>()

function getRequestIp(request: Request): string {
  const forwardedFor = request.header("x-forwarded-for")

  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim()
    if (firstIp) {
      return firstIp
    }
  }

  return request.ip || request.socket.remoteAddress || "unknown"
}

function readApiKey(value: unknown): string {
  if (typeof value !== "string") {
    throw new HttpError(400, "apiKey is required")
  }

  const apiKey = value.trim()

  if (!apiKey) {
    throw new HttpError(400, "apiKey is required")
  }

  return apiKey
}

function assertAdmin(apiKey: string) {
  if (apiKey !== config.adminKey) {
    throw new HttpError(403, "Admin privileges required")
  }
}

async function validateUserApiKey(clientApiKey: string): Promise<void> {
  if (clientApiKey === config.adminKey) {
    return
  }

  await client.fetchDashboardMetrics(clientApiKey)
}

if (!isProduction) {
  app.use(cors())
}

app.use(express.json())

app.get(
  "/api/health",
  (_request: Request, response: Response<HealthResponse>) => {
    response.json({ status: "ok" })
  },
)

app.post(
  "/api/session/login",
  async (
    request: Request<Record<string, never>, SessionLoginResponse | ErrorResponse, SessionLoginRequestBody>,
    response: Response<SessionLoginResponse | ErrorResponse>,
  ) => {
    try {
      const apiKey = readApiKey(request.body.apiKey)

      if (apiKey === config.adminKey) {
        response.json({ role: "admin" })
        return
      }

      await client.fetchDashboardMetrics(apiKey)
      response.json({ role: "user" })
    } catch (error) {
      if (isHttpError(error)) {
        response.status(error.statusCode).json({ error: error.message })
        return
      }

      console.error("Unexpected server error", error)
      response.status(500).json({ error: "Internal server error" })
    }
  },
)

app.post(
  "/api/session/create-key",
  async (
    request: Request<Record<string, never>, CreateSessionApiKeyResponse | ErrorResponse, CreateSessionApiKeyRequestBody>,
    response: Response<CreateSessionApiKeyResponse | ErrorResponse>,
  ) => {
    try {
      const now = Date.now()

      for (const [ip, timestamp] of createKeyRateLimitByIp) {
        if (now - timestamp >= CREATE_KEY_RATE_LIMIT_WINDOW_MS) {
          createKeyRateLimitByIp.delete(ip)
        }
      }

      const requestIp = getRequestIp(request)
      const lastCreatedAt = createKeyRateLimitByIp.get(requestIp)

      if (typeof lastCreatedAt === "number" && now - lastCreatedAt < CREATE_KEY_RATE_LIMIT_WINDOW_MS) {
        throw new HttpError(429, "Too many create requests from this IP; try again in 10 minutes")
      }

      const created = await client.createExternalApiKey(0)
      createKeyRateLimitByIp.set(requestIp, now)

      response.setHeader("Cache-Control", "no-store")
      response.status(201).json({
        id: created.id,
        apiKey: created.key,
        name: created.name,
        projectId: created.projectId,
        totalQuota: created.totalQuota,
      })
    } catch (error) {
      if (isHttpError(error)) {
        response.status(error.statusCode).json({ error: error.message })
        return
      }

      console.error("Unexpected server error", error)
      response.status(500).json({ error: "Internal server error" })
    }
  },
)

app.post(
  "/api/admin/redeems",
  (
    request: Request<Record<string, never>, CreateRedeemResponse | ErrorResponse, CreateRedeemRequestBody & { apiKey: string }>,
    response: Response<CreateRedeemResponse | ErrorResponse>,
  ) => {
    try {
      const apiKey = readApiKey(request.body.apiKey)
      assertAdmin(apiKey)

      const amount = Number(request.body.amount)
      const quantityValue = request.body.quantity ?? 1
      const quantity = Number(quantityValue)

      if (!Number.isInteger(amount) || amount <= 0) {
        throw new HttpError(400, "amount must be a positive integer")
      }

      if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 100) {
        throw new HttpError(400, "quantity must be an integer between 1 and 100")
      }

      const items: CreateRedeemResponse["items"] = []

      for (let index = 0; index < quantity; index += 1) {
        const signed = signRedeemToken({
          amount,
          ttlSeconds: config.redeemTokenTtlSeconds,
          issuer: REDEEM_ISSUER,
          audience: REDEEM_AUDIENCE,
          signingKey: redeemSigningKey,
        })

        const redeem = redeemStore.insertRedeem({
          jti: signed.claims.jti,
          amount: signed.claims.amount,
          issuedAt: signed.claims.iat * 1000,
          expiresAt: signed.claims.exp * 1000,
          usedAt: null,
          usedByApiKey: null,
          disabledAt: null,
          disabledByApiKey: null,
        }, signed.token)

        items.push({
          redeem,
          token: signed.token,
        })
      }

      response.setHeader("Cache-Control", "no-store")
      response.status(201).json({
        items,
        createdCount: items.length,
      })
    } catch (error) {
      if (isHttpError(error)) {
        response.status(error.statusCode).json({ error: error.message })
        return
      }

      console.error("Unexpected server error", error)
      response.status(500).json({ error: "Internal server error" })
    }
  },
)

app.post(
  "/api/admin/redeems/control",
  (
    request: Request<Record<string, never>, RedeemControlResponse | ErrorResponse, RedeemControlRequestBody>,
    response: Response<RedeemControlResponse | ErrorResponse>,
  ) => {
    try {
      const apiKey = readApiKey(request.body.apiKey)
      assertAdmin(apiKey)

      const jti = typeof request.body.jti === "string" ? request.body.jti.trim() : ""
      if (!jti) {
        throw new HttpError(400, "jti is required")
      }

      const action = request.body.action
      if (action !== "disable" && action !== "enable" && action !== "delete") {
        throw new HttpError(400, "action must be one of disable, enable, delete")
      }

      const redeem = redeemStore.updateRedeemControl(jti, action, apiKey, Date.now())

      response.setHeader("Cache-Control", "no-store")
      response.json({
        action,
        redeem,
      })
    } catch (error) {
      if (isHttpError(error)) {
        response.status(error.statusCode).json({ error: error.message })
        return
      }

      console.error("Unexpected server error", error)
      response.status(500).json({ error: "Internal server error" })
    }
  },
)

app.post(
  "/api/admin/redeems/list",
  (
    request: Request<Record<string, never>, RedeemSummaryResponse | ErrorResponse, RedeemSummaryRequestBody>,
    response: Response<RedeemSummaryResponse | ErrorResponse>,
  ) => {
    try {
      const apiKey = readApiKey(request.body.apiKey)
      assertAdmin(apiKey)

      const limitValue = Number(request.body.limit ?? 50)
      const limit = Number.isInteger(limitValue) && limitValue > 0 ? limitValue : 50

      const redeems = redeemStore.listRedeems(limit)
      const { totalCount, usedCount } = redeemStore.getRedeemSummaryCounts()

      response.setHeader("Cache-Control", "no-store")
      response.json({
        redeems,
        usedCount,
        totalCount,
      })
    } catch (error) {
      if (isHttpError(error)) {
        response.status(error.statusCode).json({ error: error.message })
        return
      }

      console.error("Unexpected server error", error)
      response.status(500).json({ error: "Internal server error" })
    }
  },
)

app.post(
  "/api/redeem",
  async (
    request: Request<Record<string, never>, RedeemCardResponse | ErrorResponse, RedeemCardRequestBody>,
    response: Response<RedeemCardResponse | ErrorResponse>,
  ) => {
    try {
      const apiKey = readApiKey(request.body.apiKey)
      await validateUserApiKey(apiKey)
      const redeemToken = typeof request.body.redeem === "string" ? request.body.redeem.trim() : ""

      if (!redeemToken) {
        throw new HttpError(400, "redeem token is required")
      }

      const claims = verifyRedeemToken(redeemToken, redeemSigningKey, REDEEM_ISSUER, REDEEM_AUDIENCE)
      const redeemed = redeemStore.redeemToken(
        redeemToken,
        apiKey,
        claims.jti,
        claims.amount,
        Date.now(),
      )

      response.json({
        amount: claims.amount,
        balance: redeemed.balance,
        redeemedAt: redeemed.redeemedAt,
      })
    } catch (error) {
      if (isHttpError(error)) {
        response.status(error.statusCode).json({ error: error.message })
        return
      }

      console.error("Unexpected server error", error)
      response.status(500).json({ error: "Internal server error" })
    }
  },
)

app.post(
  "/api/redeem/balance",
  async (
    request: Request<Record<string, never>, RedeemBalanceResponse | ErrorResponse, RedeemBalanceRequestBody>,
    response: Response<RedeemBalanceResponse | ErrorResponse>,
  ) => {
    try {
      const apiKey = readApiKey(request.body.apiKey)
      await validateUserApiKey(apiKey)
      const balance = redeemStore.getBalance(apiKey)
      response.setHeader("Cache-Control", "no-store")
      response.json({ balance })
    } catch (error) {
      if (isHttpError(error)) {
        response.status(error.statusCode).json({ error: error.message })
        return
      }

      console.error("Unexpected server error", error)
      response.status(500).json({ error: "Internal server error" })
    }
  },
)

app.post(
  "/api/metrics",
  async (
    request: Request<Record<string, never>, DashboardMetrics | ErrorResponse, MetricsRequestBody>,
    response: Response<DashboardMetrics | ErrorResponse>,
  ) => {
    try {
      const apiKey = request.body.apiKey?.trim()

      if (!apiKey) {
        throw new HttpError(400, "Request body must include apiKey")
      }

      const metrics = await client.fetchDashboardMetrics(apiKey)
      response.json(metrics)
    } catch (error) {
      if (isHttpError(error)) {
        response.status(error.statusCode).json({ error: error.message })
        return
      }

      console.error("Unexpected server error", error)
      response.status(500).json({ error: "Internal server error" })
    }
  },
)

if (isProduction && !hasFrontendBuild) {
  throw new Error(
    `Frontend build not found at ${config.frontendIndexPath}. Run the frontend build before starting the production server.`,
  )
}

if (hasFrontendBuild) {
  app.use(
    express.static(config.frontendDistPath, {
      setHeaders: (response, filePath) => {
        if (path.basename(filePath) === "index.html") {
          response.setHeader("Cache-Control", "no-cache")
          return
        }

        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          response.setHeader("Cache-Control", "public, max-age=31536000, immutable")
        }
      },
    }),
  )

  app.get(/.*/, (request: Request, response: Response, next) => {
    if (request.path.startsWith("/api/")) {
      next()
      return
    }

    if (path.extname(request.path)) {
      next()
      return
    }

    response.sendFile(config.frontendIndexPath)
  })
} else {
  console.warn(
    `Frontend build not found at ${config.frontendIndexPath}. Server will run in API-only mode until the frontend is built.`,
  )
}

app.listen(config.port, () => {
  console.log(`AxonHub proxy server listening on port ${config.port}`)

  if (hasFrontendBuild) {
    console.log(`Serving frontend from ${config.frontendDistPath}`)
  } else {
    console.log("Frontend build not detected; API-only mode is active")
  }
})
