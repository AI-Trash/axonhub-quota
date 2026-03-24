import { BarChart3 } from "lucide-react"

import type { ApiKeyQuotaUsage } from "@/api/types"
import { MetricCard } from "@/components/MetricCard"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCost, formatNumber } from "@/lib/format"

interface QuotaCardProps {
  quotaUsages: ApiKeyQuotaUsage[]
}

function toPercent(usage: number, limit: number | null) {
  if (!limit || limit <= 0) {
    return 0
  }

  return Math.min(100, (usage / limit) * 100)
}

function getProgressIndicatorClass(percent: number) {
  if (percent > 80) {
    return "[&_[data-slot=progress-indicator]]:bg-destructive"
  }

  if (percent > 60) {
    return "[&_[data-slot=progress-indicator]]:bg-amber-500"
  }

  return "[&_[data-slot=progress-indicator]]:bg-emerald-500"
}

function QuotaProgressRow({
  label,
  usage,
  limit,
  formatter,
}: {
  label: string
  usage: number
  limit: number | null
  formatter: (value: number) => string
}) {
  const percent = toPercent(usage, limit)
  const progressColorClass = getProgressIndicatorClass(percent)
  const hasLimit = typeof limit === "number" && limit > 0

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">
          {hasLimit ? `${formatter(usage)} / ${formatter(limit)}` : `${formatter(usage)} / Unlimited`}
        </span>
      </div>
      <Progress value={percent} className={progressColorClass} />
    </div>
  )
}

export function QuotaCard({ quotaUsages }: QuotaCardProps) {
  const primaryQuota = quotaUsages[0] ?? null

  return (
    <MetricCard
      title="Quota limit"
      description={primaryQuota ? `${primaryQuota.profileName} · ${primaryQuota.quota.period.type}` : "No quota profile found"}
      value={primaryQuota ? `${quotaUsages.length} active profile${quotaUsages.length > 1 ? "s" : ""}` : "No data"}
      icon={<BarChart3 className="size-4 text-muted-foreground" />}
      footer={
        primaryQuota ? (
          <Tabs defaultValue={primaryQuota.profileName}>
            <TabsList variant="line" className="w-full justify-start overflow-x-auto">
              {quotaUsages.map((quotaUsage) => (
                <TabsTrigger key={quotaUsage.profileName} value={quotaUsage.profileName}>
                  {quotaUsage.profileName}
                </TabsTrigger>
              ))}
            </TabsList>

            {quotaUsages.map((quotaUsage) => (
              <TabsContent
                key={quotaUsage.profileName}
                value={quotaUsage.profileName}
                className="space-y-3"
              >
                <QuotaProgressRow
                  label="Requests"
                  usage={quotaUsage.usage.requestCount}
                  limit={quotaUsage.quota.requests}
                  formatter={formatNumber}
                />
                <QuotaProgressRow
                  label="Tokens"
                  usage={quotaUsage.usage.totalTokens}
                  limit={quotaUsage.quota.totalTokens}
                  formatter={formatNumber}
                />
                <QuotaProgressRow
                  label="Cost"
                  usage={quotaUsage.usage.totalCost}
                  limit={quotaUsage.quota.cost}
                  formatter={formatCost}
                />
                <p className="text-xs text-muted-foreground">
                  Window: {new Date(quotaUsage.window.start).toLocaleString()} — {new Date(quotaUsage.window.end).toLocaleString()}
                </p>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <p className="text-xs text-muted-foreground">Quota usage is not available for this API key yet.</p>
        )
      }
    />
  )
}
