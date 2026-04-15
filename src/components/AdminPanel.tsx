import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import { Copy, RefreshCw, ShieldCheck } from "lucide-react"

import type { ConnectionConfig, RedeemRecord } from "@/api/types"
import { controlRedeem, createRedeem, fetchRedeems } from "@/api/client"
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
  const [quantity, setQuantity] = useState("1")
  const [latestTokens, setLatestTokens] = useState<Array<{ jti: string; token: string }>>([])
  const [redeems, setRedeems] = useState<RedeemRecord[]>([])
  const [usedCount, setUsedCount] = useState(0)
  const [disabledCount, setDisabledCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [controlingJti, setControlingJti] = useState<string | null>(null)
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
      setDisabledCount(data.redeems.filter((record) => record.disabledAt !== null).length)
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
    const parsedQuantity = Number(quantity)

    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      setError("额度必须是正整数")
      return
    }

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0 || parsedQuantity > 100) {
      setError("发卡数量必须是 1 到 100 的整数")
      return
    }

    setSubmitting(true)
    setMessage(null)
    setError(null)

    try {
      const created = await createRedeem(connection.apiKey, parsedAmount, parsedQuantity)
      setLatestTokens(created.items.map((item) => ({ jti: item.redeem.jti, token: item.token })))
      const tokenPayload = created.items.map((item) => item.token).join("\n")

      try {
        await navigator.clipboard.writeText(tokenPayload)
        setMessage(`发卡成功，共 ${created.createdCount} 张，卡密已自动复制到剪贴板`)
      } catch {
        setMessage(`发卡成功，共 ${created.createdCount} 张，请手动复制下方卡密`)
      }

      await loadRedeems()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "发卡失败")
    } finally {
      setSubmitting(false)
    }
  }

  const copyAllTokens = async () => {
    if (latestTokens.length <= 0) {
      return
    }

    const content = latestTokens.map((item) => item.token).join("\n")

    try {
      await navigator.clipboard.writeText(content)
      setMessage("所有卡密已复制到剪贴板")
    } catch {
      setMessage("当前环境不支持自动复制，请手动复制")
    }
  }

  const copySingleToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token)
      setMessage("卡密已复制到剪贴板")
    } catch {
      setMessage("当前环境不支持自动复制，请手动复制")
    }
  }

  const handleControlRedeem = async (record: RedeemRecord, action: "disable" | "enable" | "delete") => {
    setError(null)
    setMessage(null)
    setControlingJti(record.jti)

    try {
      await controlRedeem(connection.apiKey, record.jti, action)
      if (action === "disable") {
        setMessage("卡密已禁用")
      } else if (action === "enable") {
        setMessage("卡密已启用")
      } else {
        setMessage("卡密记录已删除")
      }
      await loadRedeems()
    } catch (controlError) {
      setError(controlError instanceof Error ? controlError.message : "卡密控制操作失败")
    } finally {
      setControlingJti(null)
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
              <div className="space-y-2">
                <Label htmlFor="redeem-quantity">发卡数量</Label>
                <Input
                  id="redeem-quantity"
                  inputMode="numeric"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  placeholder="例如 10"
                  required
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "生成中..." : "生成卡密"}
              </Button>
            </form>

            {latestTokens.length > 0 ? (
              <div className="mt-4 space-y-2 rounded-lg border border-border/70 p-3">
                <p className="text-xs text-muted-foreground">最新生成卡密（每行一张）</p>
                <div className="max-h-56 space-y-2 overflow-auto pr-1">
                  {latestTokens.map((item) => (
                    <div key={item.jti} className="rounded bg-muted/60 p-2">
                      <p className="mb-1 font-mono text-[11px] text-muted-foreground">{item.jti}</p>
                      <p className="break-all font-mono text-xs">{item.token}</p>
                      <div className="mt-2 flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => void copySingleToken(item.token)}>
                          <Copy className="size-3.5" />复制此卡
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={copyAllTokens}>
                    <Copy className="size-3.5" />复制全部
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
                  已使用 {usedCount} / {totalCount}（{usedPercentLabel}），已禁用 {disabledCount}
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
                    {record.disabledAt ? (
                      <p className="mt-1 text-xs text-amber-600">
                        已禁用：{new Date(record.disabledAt).toLocaleString("zh-CN")} / {record.disabledByApiKey ?? "未知"}
                      </p>
                    ) : null}
                    {record.usedAt ? (
                      <p className="mt-1 text-xs text-emerald-600">
                        已兑换：{new Date(record.usedAt).toLocaleString("zh-CN")} / {record.usedByApiKey ?? "未知"}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">
                        状态：{record.disabledAt ? "已禁用" : "未使用"}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {record.usedAt === null && !record.disabledAt ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={controlingJti === record.jti}
                          onClick={() => void handleControlRedeem(record, "disable")}
                        >
                          禁用
                        </Button>
                      ) : null}
                      {record.usedAt === null && record.disabledAt ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={controlingJti === record.jti}
                          onClick={() => void handleControlRedeem(record, "enable")}
                        >
                          启用
                        </Button>
                      ) : null}
                      {!record.usedAt ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={controlingJti === record.jti}
                          onClick={() => void handleControlRedeem(record, "delete")}
                        >
                          删除
                        </Button>
                      ) : null}
                    </div>
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
