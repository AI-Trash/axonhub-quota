import { CalendarRange } from "lucide-react"

import type { ScopedTokenStats } from "@/api/types"
import { MetricCard } from "@/components/MetricCard"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatCompactNumber, formatNumber, formatPercent } from "@/lib/format"
import { useLanguage } from "@/lib/i18n"

interface ScopedStatsCardProps {
  scopeLabel: string
  stats: ScopedTokenStats
}

export function ScopedStatsCard({ scopeLabel, stats }: ScopedStatsCardProps) {
  const { locale, t } = useLanguage()

  return (
    <MetricCard
      title={scopeLabel}
      description={t.dashboard.scopedDescription}
      value={formatCompactNumber(stats.totalTokens, locale)}
      icon={<CalendarRange className="size-4 text-muted-foreground" />}
      footer={
        <div className="space-y-3 text-xs text-muted-foreground">
          <div className="grid grid-cols-2 gap-2">
            <Badge variant="outline" className="justify-between rounded-md px-2 py-1">
              <span>{t.tokenUsage.input}</span>
              <span className="tabular-nums">{formatCompactNumber(stats.inputTokens, locale)}</span>
            </Badge>
            <Badge variant="outline" className="justify-between rounded-md px-2 py-1">
              <span>{t.tokenUsage.output}</span>
              <span className="tabular-nums">{formatCompactNumber(stats.outputTokens, locale)}</span>
            </Badge>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-2">
            <Badge variant="secondary" className="justify-between rounded-md px-2 py-1">
              <span>{t.tokenUsage.cached}</span>
              <span className="tabular-nums">{formatCompactNumber(stats.cachedTokens, locale)}</span>
            </Badge>
            <Badge variant="secondary" className="justify-between rounded-md px-2 py-1">
              <span>{t.cacheRate.title}</span>
              <span className="tabular-nums">{formatPercent(stats.cacheRate)}</span>
            </Badge>
          </div>
          <p>
            {t.dashboard.window(
              new Date(stats.window.start).toLocaleString(locale === "zh" ? "zh-CN" : "en-US"),
              new Date(stats.window.end).toLocaleString(locale === "zh" ? "zh-CN" : "en-US"),
            )}
          </p>
          <p>{t.dashboard.exactTotal(formatNumber(stats.totalTokens, locale))}</p>
        </div>
      }
    />
  )
}
