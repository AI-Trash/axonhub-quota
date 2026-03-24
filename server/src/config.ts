import path from "node:path"

import dotenv from "dotenv"

import type { AppConfig } from "./types"

dotenv.config({ path: path.resolve(__dirname, "../../.env") })

function getRequiredEnv(name: "AXONHUB_URL" | "ADMIN_EMAIL" | "ADMIN_PASSWORD"): string {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function getPort(): number {
  const rawPort = process.env.PORT?.trim()

  if (!rawPort) {
    return 3001
  }

  const parsedPort = Number(rawPort)

  if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
    throw new Error("PORT must be a positive integer")
  }

  return parsedPort
}

function normalizeUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url
}

function getNodeEnv(): string {
  return process.env.NODE_ENV?.trim() || "development"
}

export function loadConfig(): AppConfig {
  const frontendDistPath = path.resolve(__dirname, "../../dist")

  return {
    axonhubUrl: normalizeUrl(getRequiredEnv("AXONHUB_URL")),
    adminEmail: getRequiredEnv("ADMIN_EMAIL"),
    adminPassword: getRequiredEnv("ADMIN_PASSWORD"),
    port: getPort(),
    nodeEnv: getNodeEnv(),
    frontendDistPath,
    frontendIndexPath: path.join(frontendDistPath, "index.html"),
  }
}
