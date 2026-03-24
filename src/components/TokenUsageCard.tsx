import { Coins } from "lucide-react"

import type { UsageSummary } from "@/api/types"
import { MetricCard } from "@/components/MetricCard"
import { formatCompactNumber, formatCost } from "@/lib/format"
import { useLanguage } from "@/lib/i18n"

interface TokenUsageCardProps {
  usage: UsageSummary
}

export function TokenUsageCard({ usage }: TokenUsageCardProps) {
  const { locale, t } = useLanguage()
  const totalCostLabel = usage.costAvailable && usage.cost !== null ? formatCost(usage.cost, locale) : "—"

  return (
    <MetricCard
      title={t.tokenUsage.title}
      description={t.dashboard.totalsDescription}
      value={`${formatCompactNumber(usage.totalTokens, locale)} / ${totalCostLabel}`}
      icon={<Coins className="size-4 text-muted-foreground" />}
    />
  )
}
