import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import { Copy, RefreshCw, ShieldCheck } from "lucide-react"

import type { ConnectionConfig, RedeemRecord } from "@/api/types"
import { createRedeem, fetchRedeems } from "@/api/client"
import { ApiKeySecret } from "@/components/ApiKeySecret"
import { LanguageToggle } from "@/components/LanguageToggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AdminPanelProps {
  connection: ConnectionConfig
  onDisconnect: () => void
}

export function AdminPanel({ connection, onDisconnect }: AdminPanelProps) {
  const [amount, setAmount] = useState("100")
  const [createdRedeem, setCreatedRedeem] = useState<RedeemRecord | null>(null)
  const [latestToken, setLatestToken] = useState<string | null>(null)
  const [redeems, setRedeems] = useState<RedeemRecord[]>([])
  const [usedCount, setUsedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadRedeems = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await fetchRedeems(connection.apiKey)
      setRedeems(data.redeems)
      setUsedCount(data.usedCount)
      setTotalCount(data.totalCount)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载发卡记录失败")
    } finally {
      setLoading(false)
    }
  }, [connection.apiKey])

  useEffect(() => {
    void loadRedeems()
  }, [loadRedeems])

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsedAmount = Number(amount)

    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      setError("额度必须是正整数")
      return
    }

    setSubmitting(true)
    setMessage(null)
    setError(null)

    try {
      const created = await createRedeem(connection.apiKey, parsedAmount)
      setCreatedRedeem(created.redeem)
      setLatestToken(created.token)

      try {
        await navigator.clipboard.writeText(created.token)
        setMessage("发卡成功，卡密已自动复制到剪贴板")
      } catch {
        setMessage("发卡成功，请手动复制下方卡密")
      }

      await loadRedeems()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "发卡失败")
    } finally {
      setSubmitting(false)
    }
  }

  const copyToken = async () => {
    if (!latestToken) {
      return
    }

    try {
      await navigator.clipboard.writeText(latestToken)
      setMessage("卡密已复制到剪贴板")
    } catch {
      setMessage("当前环境不支持自动复制，请手动复制")
    }
  }

  const usedPercentLabel = useMemo(() => {
    if (totalCount <= 0) {
      return "0%"
    }

    return `${Math.round((usedCount / totalCount) * 100)}%`
  }, [totalCount, usedCount])

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border/70 bg-card/60 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-500" />
              <Badge variant="outline">Admin 模式</Badge>
            </div>
            <ApiKeySecret apiKey={connection.apiKey} label="当前 Admin Key" />
          </div>

          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button variant="ghost" onClick={onDisconnect}>退出</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-6 md:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>发卡</CardTitle>
            <CardDescription>输入额度，生成一次性兑换卡密（签名 JWT）</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleCreate}>
              <div className="space-y-2">
                <Label htmlFor="redeem-amount">额度</Label>
                <Input
                  id="redeem-amount"
                  inputMode="numeric"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="例如 100"
                  required
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "生成中..." : "生成卡密"}
              </Button>
            </form>

            {createdRedeem && latestToken ? (
              <div className="mt-4 space-y-2 rounded-lg border border-border/70 p-3">
                <p className="text-xs text-muted-foreground">最新卡密（可复制发给用户）</p>
                <p className="break-all rounded bg-muted/60 p-2 font-mono text-xs">{latestToken}</p>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={copyToken}>
                    <Copy className="size-3.5" />复制
                  </Button>
                </div>
              </div>
            ) : null}

            {message ? (
              <p className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                {message}
              </p>
            ) : null}

            {error ? (
              <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>兑换使用记录</CardTitle>
                <CardDescription>
                  已使用 {usedCount} / {totalCount}（{usedPercentLabel}）
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => void loadRedeems()}>
                <RefreshCw className="size-3.5" />刷新
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">加载中...</p>
            ) : redeems.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无发卡记录</p>
            ) : (
              <div className="space-y-2">
                {redeems.map((record) => (
                  <div key={record.jti} className="rounded-lg border border-border/70 p-3">
                    <p className="font-mono text-xs">{record.jti}</p>
                    <p className="mt-1 text-sm">额度：{record.amount}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      发卡：{new Date(record.issuedAt).toLocaleString("zh-CN")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      过期：{new Date(record.expiresAt).toLocaleString("zh-CN")}
                    </p>
                    {record.usedAt ? (
                      <p className="mt-1 text-xs text-emerald-600">
                        已兑换：{new Date(record.usedAt).toLocaleString("zh-CN")} / {record.usedByApiKey ?? "未知"}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">状态：未使用</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
