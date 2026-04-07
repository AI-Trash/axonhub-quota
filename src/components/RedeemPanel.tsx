import { useEffect, useState, type FormEvent } from "react"
import { Gift } from "lucide-react"

import type { ConnectionConfig } from "@/api/types"
import { fetchRedeemBalance, redeemCard } from "@/api/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface RedeemPanelProps {
  connection: ConnectionConfig
}

export function RedeemPanel({ connection }: RedeemPanelProps) {
  const [redeem, setRedeem] = useState("")
  const [balance, setBalance] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadBalance = async () => {
      try {
        const response = await fetchRedeemBalance(connection.apiKey)
        setBalance(response.balance)
      } catch {
        setBalance(null)
      }
    }

    void loadBalance()
  }, [connection.apiKey])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setSubmitting(true)
    setMessage(null)
    setError(null)

    try {
      const response = await redeemCard(connection.apiKey, redeem)
      setRedeem("")
      setBalance(response.balance)
      setMessage(`兑换成功：+${response.amount}，当前余额 ${response.balance}`)
    } catch (redeemError) {
      setError(redeemError instanceof Error ? redeemError.message : "兑换失败")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="border-border/70 md:col-span-2 xl:col-span-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Gift className="size-4" />
          兑换额度
        </CardTitle>
        <CardDescription>
          输入管理员下发的卡密（redeem token）进行一次性兑换。{balance !== null ? `当前余额：${balance}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="redeem-token">卡密</Label>
            <Input
              id="redeem-token"
              value={redeem}
              onChange={(event) => setRedeem(event.target.value)}
              placeholder="eyJhbGciOi..."
              required
            />
          </div>

          <Button type="submit" disabled={submitting}>
            {submitting ? "兑换中..." : "立即兑换"}
          </Button>
        </form>

        {message ? (
          <p className="mt-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            {message}
          </p>
        ) : null}

        {error ? (
          <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
