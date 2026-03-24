import { DollarSign } from "lucide-react"

import type { CostStat } from "@/api/types"
import { MetricCard } from "@/components/MetricCard"
import { formatCost } from "@/lib/format"
import { useLanguage } from "@/lib/i18n"

interface CostCardProps {
  costStat: CostStat | null
}

export function CostCard({ costStat }: CostCardProps) {
  const { locale, t } = useLanguage()
  return (
    <MetricCard
      title={t.cost.title}
      description={t.cost.description}
      value={formatCost(costStat?.cost ?? 0, locale)}
      icon={<DollarSign className="size-4 text-muted-foreground" />}
    />
  )
}
