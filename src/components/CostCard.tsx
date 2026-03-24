import { DollarSign } from "lucide-react"

import type { UsageSummary } from "@/api/types"
import { MetricCard } from "@/components/MetricCard"
import { formatCost } from "@/lib/format"
import { useLanguage } from "@/lib/i18n"

interface CostCardProps {
  usage: UsageSummary
}

export function CostCard({ usage }: CostCardProps) {
  const { locale, t } = useLanguage()
  return (
    <MetricCard
      title={t.cost.title}
      description={t.cost.description}
      value={usage.costAvailable && usage.cost !== null ? formatCost(usage.cost, locale) : "—"}
      icon={<DollarSign className="size-4 text-muted-foreground" />}
    />
  )
}
