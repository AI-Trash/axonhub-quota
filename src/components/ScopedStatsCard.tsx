import { CalendarRange } from "lucide-react"

import type { ScopedUsageSummary } from "@/api/types"
import { MetricCard } from "@/components/MetricCard"
import { formatCompactNumber } from "@/lib/format"
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
    />
  )
}
