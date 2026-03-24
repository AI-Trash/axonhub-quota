import { DollarSign } from "lucide-react"

import type { CostStat } from "@/api/types"
import { MetricCard } from "@/components/MetricCard"
import { formatCost } from "@/lib/format"

interface CostCardProps {
  costStat: CostStat | null
}

export function CostCard({ costStat }: CostCardProps) {
  return (
    <MetricCard
      title="Total cost"
      description="Billed usage for this API key"
      value={formatCost(costStat?.cost ?? 0)}
      icon={<DollarSign className="size-4 text-muted-foreground" />}
    />
  )
}
