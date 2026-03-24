import { CalendarRange } from "lucide-react"

import type { ScopedUsageSummary } from "@/api/types"
import { MetricCard } from "@/components/MetricCard"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatCompactNumber, formatNumber } from "@/lib/format"
import { useLanguage } from "@/lib/i18n"

interface ScopedStatsCardProps {
  today: ScopedUsageSummary
  week: ScopedUsageSummary
}

export function ScopedStatsCard({ today, week }: ScopedStatsCardProps) {
  const { locale, t } = useLanguage()
  const value = `${formatCompactNumber(today.totalTokens, locale)} / ${formatCompactNumber(week.totalTokens, locale)}`

  return (
    <MetricCard
      title={`${t.dashboard.todayScope} / ${t.dashboard.weekScope}`}
      description={t.dashboard.recentDescription}
      value={value}
      icon={<CalendarRange className="size-4 text-muted-foreground" />}
      className="xl:col-span-2"
      footer={
        <div className="space-y-3 text-xs text-muted-foreground">
          <div className="grid grid-cols-2 gap-2">
            <Badge variant="outline" className="justify-between rounded-md px-2 py-1">
              <span>{t.dashboard.todayScope}</span>
              <span className="tabular-nums">{formatNumber(today.totalTokens, locale)}</span>
            </Badge>
            <Badge variant="outline" className="justify-between rounded-md px-2 py-1">
              <span>{t.dashboard.weekScope}</span>
              <span className="tabular-nums">{formatNumber(week.totalTokens, locale)}</span>
            </Badge>
          </div>
          <Separator />
          <p>
            {t.dashboard.window(
              new Date(today.window.start).toLocaleString(locale === "zh" ? "zh-CN" : "en-US"),
              new Date(today.window.end).toLocaleString(locale === "zh" ? "zh-CN" : "en-US"),
            )}
          </p>
          <p>
            {t.dashboard.window(
              new Date(week.window.start).toLocaleString(locale === "zh" ? "zh-CN" : "en-US"),
              new Date(week.window.end).toLocaleString(locale === "zh" ? "zh-CN" : "en-US"),
            )}
          </p>
        </div>
      }
    />
  )
}
