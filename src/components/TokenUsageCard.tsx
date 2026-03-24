import { Coins } from "lucide-react"

import type { TokenStat } from "@/api/types"
import { MetricCard } from "@/components/MetricCard"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatCompactNumber } from "@/lib/format"
import { useLanguage } from "@/lib/i18n"

interface TokenUsageCardProps {
  tokenStat: TokenStat | null
}

export function TokenUsageCard({ tokenStat }: TokenUsageCardProps) {
  const { locale, t } = useLanguage()
  const totalTokens = tokenStat?.totalTokens ?? 0

  return (
    <MetricCard
      title={t.tokenUsage.title}
      description={t.tokenUsage.description}
      value={formatCompactNumber(totalTokens, locale)}
      icon={<Coins className="size-4 text-muted-foreground" />}
      footer={
        <div className="space-y-3 text-xs text-muted-foreground">
          <div className="grid grid-cols-2 gap-2">
            <Badge variant="outline" className="justify-between rounded-md px-2 py-1">
              <span>{t.tokenUsage.input}</span>
              <span className="tabular-nums">{formatCompactNumber(tokenStat?.inputTokens ?? 0, locale)}</span>
            </Badge>
            <Badge variant="outline" className="justify-between rounded-md px-2 py-1">
              <span>{t.tokenUsage.output}</span>
              <span className="tabular-nums">{formatCompactNumber(tokenStat?.outputTokens ?? 0, locale)}</span>
            </Badge>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-2">
            <Badge variant="secondary" className="justify-between rounded-md px-2 py-1">
              <span>{t.tokenUsage.cached}</span>
              <span className="tabular-nums">{formatCompactNumber(tokenStat?.cachedTokens ?? 0, locale)}</span>
            </Badge>
            <Badge variant="secondary" className="justify-between rounded-md px-2 py-1">
              <span>{t.tokenUsage.reasoning}</span>
              <span className="tabular-nums">{formatCompactNumber(tokenStat?.reasoningTokens ?? 0, locale)}</span>
            </Badge>
          </div>
        </div>
      }
    />
  )
}
