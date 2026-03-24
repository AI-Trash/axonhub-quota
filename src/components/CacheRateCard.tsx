import { Gauge } from "lucide-react"

import type { TokenStat } from "@/api/types"
import { MetricCard } from "@/components/MetricCard"
import { Progress } from "@/components/ui/progress"
import { formatCompactNumber, formatPercent } from "@/lib/format"
import { useLanguage } from "@/lib/i18n"

interface CacheRateCardProps {
  cacheRate: number
  tokenStat: TokenStat | null
}

export function CacheRateCard({ cacheRate, tokenStat }: CacheRateCardProps) {
  const { locale, t } = useLanguage()
  return (
    <MetricCard
      title={t.cacheRate.title}
      description={t.cacheRate.description}
      value={formatPercent(cacheRate)}
      icon={<Gauge className="size-4 text-muted-foreground" />}
      footer={
        <div className="space-y-2">
          <Progress value={Math.min(100, cacheRate)} />
          <p className="text-xs text-muted-foreground">
            {t.cacheRate.summary(
              formatCompactNumber(tokenStat?.cachedTokens ?? 0, locale),
              formatCompactNumber(tokenStat?.inputTokens ?? 0, locale),
            )}
          </p>
        </div>
      }
    />
  )
}
