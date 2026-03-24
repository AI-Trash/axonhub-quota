import { CalendarRange } from "lucide-react"

import type { ScopedUsageSummary } from "@/api/types"
import { MetricCard } from "@/components/MetricCard"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatCompactNumber, formatCost, formatNumber } from "@/lib/format"
import { useLanguage } from "@/lib/i18n"

interface ScopedStatsCardProps {
  scopeLabel: string
  stats: ScopedUsageSummary
}

export function ScopedStatsCard({ scopeLabel, stats }: ScopedStatsCardProps) {
  const { locale, t } = useLanguage()

  return (
    <MetricCard
      title={scopeLabel}
      description={t.dashboard.usageDescription}
      value={formatCompactNumber(stats.totalTokens, locale)}
      icon={<CalendarRange className="size-4 text-muted-foreground" />}
      footer={
        <div className="space-y-3 text-xs text-muted-foreground">
          <div className="grid grid-cols-2 gap-2">
            <Badge variant="outline" className="justify-between rounded-md px-2 py-1">
              <span>{t.tokenUsage.totalLabel}</span>
              <span className="tabular-nums">{formatNumber(stats.totalTokens, locale)}</span>
            </Badge>
            <Badge variant="outline" className="justify-between rounded-md px-2 py-1">
              <span>{t.tokenUsage.totalCost}</span>
              <span className="tabular-nums">
                {stats.costAvailable && stats.cost !== null
                  ? formatCost(stats.cost, locale)
                  : t.dashboard.costUnavailable}
              </span>
            </Badge>
          </div>
          <Separator />
          <p>
            {t.dashboard.window(
              new Date(stats.window.start).toLocaleString(locale === "zh" ? "zh-CN" : "en-US"),
              new Date(stats.window.end).toLocaleString(locale === "zh" ? "zh-CN" : "en-US"),
            )}
          </p>
          <p>{t.dashboard.exactTotal(formatNumber(stats.totalTokens, locale))}</p>
          <p>
            {stats.costAvailable && stats.cost !== null
              ? t.dashboard.exactCost(formatCost(stats.cost, locale))
              : t.dashboard.costUnavailable}
          </p>
        </div>
      }
    />
  )
}
