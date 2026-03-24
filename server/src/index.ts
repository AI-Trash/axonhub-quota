import fs from "node:fs"
import path from "node:path"

import cors from "cors"
import express, { type Request, type Response } from "express"

import { AxonHubAdminClient } from "./axonhubClient"
import { loadConfig } from "./config"
import { HttpError, isHttpError } from "./errors"
import type { DashboardMetrics, ErrorResponse, HealthResponse, MetricsRequestBody } from "./types"

const config = loadConfig()
const client = new AxonHubAdminClient(config)
const app = express()
const hasFrontendBuild = fs.existsSync(config.frontendIndexPath)
const isProduction = config.nodeEnv === "production"

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
