import { Gauge } from "lucide-react"

import type { TokenStat } from "@/api/types"
import { MetricCard } from "@/components/MetricCard"
import { Progress } from "@/components/ui/progress"
import { formatNumber, formatPercent } from "@/lib/format"

interface CacheRateCardProps {
  cacheRate: number
  tokenStat: TokenStat | null
}

export function CacheRateCard({ cacheRate, tokenStat }: CacheRateCardProps) {
  return (
    <MetricCard
      title="Cache rate"
      description="Cached tokens compared to total tokens"
      value={formatPercent(cacheRate)}
      icon={<Gauge className="size-4 text-muted-foreground" />}
      footer={
        <div className="space-y-2">
          <Progress value={Math.min(100, cacheRate)} />
          <p className="text-xs text-muted-foreground">
            {`${formatNumber(tokenStat?.cachedTokens ?? 0)} cached of ${formatNumber(tokenStat?.totalTokens ?? 0)} total`}
          </p>
        </div>
      }
    />
  )
}
