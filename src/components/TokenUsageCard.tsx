import { Coins } from "lucide-react"

import type { UsageSummary } from "@/api/types"
import { MetricCard } from "@/components/MetricCard"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatCompactNumber, formatCost, formatNumber } from "@/lib/format"
import { useLanguage } from "@/lib/i18n"

interface TokenUsageCardProps {
  usage: UsageSummary
}

export function TokenUsageCard({ usage }: TokenUsageCardProps) {
  const { locale, t } = useLanguage()

  return (
    <MetricCard
      title={t.tokenUsage.title}
      description={t.tokenUsage.description}
      value={formatCompactNumber(usage.totalTokens, locale)}
      icon={<Coins className="size-4 text-muted-foreground" />}
      footer={
        <div className="space-y-3 text-xs text-muted-foreground">
          <div className="grid grid-cols-2 gap-2">
            <Badge variant="outline" className="justify-between rounded-md px-2 py-1">
              <span>{t.tokenUsage.totalLabel}</span>
              <span className="tabular-nums">{formatNumber(usage.totalTokens, locale)}</span>
            </Badge>
            <Badge variant="outline" className="justify-between rounded-md px-2 py-1">
              <span>{t.tokenUsage.totalCost}</span>
              <span className="tabular-nums">{usage.costAvailable && usage.cost !== null ? formatCost(usage.cost, locale) : "—"}</span>
            </Badge>
          </div>
          <Separator />
          <p>{t.dashboard.exactTotal(formatNumber(usage.totalTokens, locale))}</p>
          {usage.costAvailable && usage.cost !== null ? <p>{t.dashboard.exactCost(formatCost(usage.cost, locale))}</p> : null}
        </div>
      }
    />
  )
}
