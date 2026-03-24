import { Coins } from "lucide-react"

import type { TokenStat } from "@/api/types"
import { MetricCard } from "@/components/MetricCard"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatNumber } from "@/lib/format"

interface TokenUsageCardProps {
  tokenStat: TokenStat | null
}

export function TokenUsageCard({ tokenStat }: TokenUsageCardProps) {
  const totalTokens = tokenStat?.totalTokens ?? 0

  return (
    <MetricCard
      title="Total token usage"
      description="All traffic for the selected API key"
      value={formatNumber(totalTokens)}
      icon={<Coins className="size-4 text-muted-foreground" />}
      footer={
        <div className="space-y-3 text-xs text-muted-foreground">
          <div className="grid grid-cols-2 gap-2">
            <Badge variant="outline" className="justify-between rounded-md px-2 py-1">
              <span>Input</span>
              <span className="tabular-nums">{formatNumber(tokenStat?.inputTokens ?? 0)}</span>
            </Badge>
            <Badge variant="outline" className="justify-between rounded-md px-2 py-1">
              <span>Output</span>
              <span className="tabular-nums">{formatNumber(tokenStat?.outputTokens ?? 0)}</span>
            </Badge>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-2">
            <Badge variant="secondary" className="justify-between rounded-md px-2 py-1">
              <span>Cached</span>
              <span className="tabular-nums">{formatNumber(tokenStat?.cachedTokens ?? 0)}</span>
            </Badge>
            <Badge variant="secondary" className="justify-between rounded-md px-2 py-1">
              <span>Reasoning</span>
              <span className="tabular-nums">{formatNumber(tokenStat?.reasoningTokens ?? 0)}</span>
            </Badge>
          </div>
        </div>
      }
    />
  )
}
