import crypto from "node:crypto"

import { HttpError } from "./errors"

export interface RedeemTokenClaims {
  jti: string
  typ: "redeem"
  amount: number
  iat: number
  exp: number
  iss: string
  aud: string
}

interface SignRedeemTokenInput {
  amount: number
  ttlSeconds: number
  issuer: string
  audience: string
  signingKey: Buffer
}

const JWT_HEADER = {
  alg: "HS256",
  typ: "JWT",
} as const

function toBase64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url")
}

function parseJsonBase64Url(value: string): unknown {
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8")
    return JSON.parse(decoded) as unknown
  } catch {
    throw new HttpError(400, "Malformed redeem token")
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function createSignature(content: string, signingKey: Buffer): string {
  return crypto.createHmac("sha256", signingKey).update(content).digest("base64url")
}

function assertSafeAmount(amount: number) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new HttpError(400, "amount must be a positive integer")
  }
}

function assertValidTtl(ttlSeconds: number) {
  if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
    throw new HttpError(500, "Invalid redeem token TTL configuration")
  }
}

export function deriveRedeemSigningKey(adminKey: string): Buffer {
  const ikm = Buffer.from(adminKey, "utf8")
  const salt = Buffer.from("axonhub-quota/redeem/salt/v1", "utf8")
  const info = Buffer.from("axonhub-quota/redeem-jwt/v1", "utf8")
  const derived = crypto.hkdfSync("sha256", ikm, salt, info, 32)

  return Buffer.from(derived)
}

export function signRedeemToken(input: SignRedeemTokenInput): {
  token: string
  claims: RedeemTokenClaims
} {
  assertSafeAmount(input.amount)
  assertValidTtl(input.ttlSeconds)

  const nowSeconds = Math.floor(Date.now() / 1000)
  const claims: RedeemTokenClaims = {
    jti: crypto.randomUUID(),
    typ: "redeem",
    amount: input.amount,
    iat: nowSeconds,
    exp: nowSeconds + input.ttlSeconds,
    iss: input.issuer,
    aud: input.audience,
  }

  const encodedHeader = toBase64Url(JSON.stringify(JWT_HEADER))
  const encodedPayload = toBase64Url(JSON.stringify(claims))
  const unsigned = `${encodedHeader}.${encodedPayload}`
  const signature = createSignature(unsigned, input.signingKey)

  return {
    token: `${unsigned}.${signature}`,
    claims,
  }
}

export function verifyRedeemToken(
  token: string,
  signingKey: Buffer,
  issuer: string,
  audience: string,
): RedeemTokenClaims {
  const parts = token.split(".")

  if (parts.length !== 3) {
    throw new HttpError(400, "Malformed redeem token")
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts
  const unsigned = `${encodedHeader}.${encodedPayload}`

  const expectedSignature = createSignature(unsigned, signingKey)
  const providedSignatureBuffer = Buffer.from(encodedSignature, "base64url")
  const expectedSignatureBuffer = Buffer.from(expectedSignature, "base64url")

  if (
    providedSignatureBuffer.length !== expectedSignatureBuffer.length
    || !crypto.timingSafeEqual(providedSignatureBuffer, expectedSignatureBuffer)
  ) {
    throw new HttpError(401, "Invalid redeem token signature")
  }

  const header = parseJsonBase64Url(encodedHeader)

  if (!isRecord(header) || header.alg !== "HS256" || header.typ !== "JWT") {
    throw new HttpError(400, "Unsupported redeem token header")
  }

  const payload = parseJsonBase64Url(encodedPayload)

  if (!isRecord(payload)) {
    throw new HttpError(400, "Invalid redeem token payload")
  }

  const {
    jti,
    typ,
    amount,
    iat,
    exp,
    iss,
    aud,
  } = payload

  if (
    typeof jti !== "string"
    || typ !== "redeem"
    || typeof amount !== "number"
    || typeof iat !== "number"
    || typeof exp !== "number"
    || typeof iss !== "string"
    || typeof aud !== "string"
  ) {
    throw new HttpError(400, "Invalid redeem token payload")
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new HttpError(400, "Invalid redeem token amount")
  }

  const nowSeconds = Math.floor(Date.now() / 1000)

  if (exp <= nowSeconds) {
    throw new HttpError(410, "Redeem token expired")
  }

  if (iat > nowSeconds + 60) {
    throw new HttpError(400, "Redeem token iat is invalid")
  }

  if (iss !== issuer || aud !== audience) {
    throw new HttpError(401, "Invalid redeem token issuer or audience")
  }

  return {
    jti,
    typ,
    amount,
    iat,
    exp,
    iss,
    aud,
  }
}
