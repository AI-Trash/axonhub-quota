import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"

import Database from "better-sqlite3"

import { HttpError } from "./errors"
import type { RedeemRecord } from "./types"

interface RedeemRow {
  jti: string
  amount: number
  token_hash: string
  issued_at: number
  expires_at: number
  used_at: number | null
  used_by_api_key: string | null
}

interface CreditRow {
  api_key: string
  balance: number
}

function toRedeemRecord(row: RedeemRow): RedeemRecord {
  return {
    jti: row.jti,
    amount: row.amount,
    issuedAt: row.issued_at,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    usedByApiKey: row.used_by_api_key,
  }
}

function hashRedeemToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export class RedeemStore {
  private readonly db: Database.Database

  constructor(dbPath: string) {
    const normalizedDbPath = path.resolve(dbPath)
    const parentDir = path.dirname(normalizedDbPath)

    fs.mkdirSync(parentDir, { recursive: true })

    this.db = new Database(normalizedDbPath)
    this.db.pragma("journal_mode = WAL")
    this.db.pragma("foreign_keys = ON")

    this.initializeSchema()
  }

  private initializeSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS redeems (
        jti TEXT PRIMARY KEY,
        amount INTEGER NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        issued_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        used_at INTEGER,
        used_by_api_key TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_redeems_used_at ON redeems(used_at);

      CREATE TABLE IF NOT EXISTS credits (
        api_key TEXT PRIMARY KEY,
        balance INTEGER NOT NULL DEFAULT 0
      );
    `)

    const columns = this.db
      .prepare<[], { name: string }>("PRAGMA table_info(redeems)")
      .all()
    const hasTokenHashColumn = columns.some((column) => column.name === "token_hash")

    if (!hasTokenHashColumn) {
      this.db.exec("ALTER TABLE redeems ADD COLUMN token_hash TEXT")

      const rows = this.db
        .prepare<[], { jti: string; token: string | null }>("SELECT jti, token FROM redeems")
        .all()

      const updateStatement = this.db.prepare("UPDATE redeems SET token_hash = ? WHERE jti = ?")

      for (const row of rows) {
        if (!row.token) {
          continue
        }

        updateStatement.run(hashRedeemToken(row.token), row.jti)
      }

      this.db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_redeems_token_hash ON redeems(token_hash)")
    }
  }

  insertRedeem(record: RedeemRecord, token: string): RedeemRecord {
    const statement = this.db.prepare(
      `
        INSERT INTO redeems (jti, amount, token_hash, issued_at, expires_at, used_at, used_by_api_key)
        VALUES (@jti, @amount, @token_hash, @issued_at, @expires_at, @used_at, @used_by_api_key)
      `,
    )

    try {
      statement.run({
        jti: record.jti,
        amount: record.amount,
        token_hash: hashRedeemToken(token),
        issued_at: record.issuedAt,
        expires_at: record.expiresAt,
        used_at: record.usedAt,
        used_by_api_key: record.usedByApiKey,
      })
    } catch {
      throw new HttpError(500, "Failed to persist redeem token")
    }

    return record
  }

  listRedeems(limit: number): RedeemRecord[] {
    const cappedLimit = Math.max(1, Math.min(limit, 200))
    const statement = this.db.prepare<[number], RedeemRow>(
      `
        SELECT jti, amount, token_hash, issued_at, expires_at, used_at, used_by_api_key
        FROM redeems
        ORDER BY issued_at DESC
        LIMIT ?
      `,
    )
    const rows = statement.all(cappedLimit)

    return rows.map(toRedeemRecord)
  }

  getRedeemSummaryCounts() {
    const totalRow = this.db.prepare<[], { count: number }>("SELECT COUNT(*) AS count FROM redeems").get()
    const usedRow = this.db
      .prepare<[], { count: number }>("SELECT COUNT(*) AS count FROM redeems WHERE used_at IS NOT NULL")
      .get()

    return {
      totalCount: totalRow?.count ?? 0,
      usedCount: usedRow?.count ?? 0,
    }
  }

  redeemToken(token: string, apiKey: string, expectedJti: string, amount: number, nowMs: number): {
    redeemedAt: number
    balance: number
  } {
    const tokenHash = hashRedeemToken(token)
    const redeemTransaction = this.db.transaction(() => {
      const redeemRow = this.db
        .prepare<[string], RedeemRow>(
          `
            SELECT jti, amount, token_hash, issued_at, expires_at, used_at, used_by_api_key
            FROM redeems
            WHERE token_hash = ?
          `,
        )
        .get(tokenHash)

      if (!redeemRow) {
        throw new HttpError(404, "Redeem token not found")
      }

      if (redeemRow.jti !== expectedJti) {
        throw new HttpError(401, "Redeem token claims do not match stored record")
      }

      if (redeemRow.amount !== amount) {
        throw new HttpError(401, "Redeem token amount does not match stored record")
      }

      if (redeemRow.expires_at <= nowMs) {
        throw new HttpError(410, "Redeem token expired")
      }

      if (redeemRow.used_at !== null) {
        throw new HttpError(409, "Redeem token has already been used")
      }

      const markUsedResult = this.db
        .prepare(
          `
            UPDATE redeems
            SET used_at = ?, used_by_api_key = ?
            WHERE token_hash = ? AND used_at IS NULL
          `,
        )
        .run(nowMs, apiKey, tokenHash)

      if (markUsedResult.changes !== 1) {
        throw new HttpError(409, "Redeem token has already been used")
      }

      this.db
        .prepare(
          `
            INSERT INTO credits (api_key, balance)
            VALUES (?, ?)
            ON CONFLICT(api_key) DO UPDATE SET balance = balance + excluded.balance
          `,
        )
        .run(apiKey, amount)

      const credit = this.db
        .prepare<[string], CreditRow>("SELECT api_key, balance FROM credits WHERE api_key = ?")
        .get(apiKey)

      return {
        redeemedAt: nowMs,
        balance: credit?.balance ?? 0,
      }
    })

    return redeemTransaction()
  }

  getBalance(apiKey: string): number {
    const row = this.db
      .prepare<[string], CreditRow>("SELECT api_key, balance FROM credits WHERE api_key = ?")
      .get(apiKey)
    return row?.balance ?? 0
  }
}
