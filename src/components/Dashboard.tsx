import { useEffect, useState } from "react"
import { Circle, LogOut, RefreshCw } from "lucide-react"

import type { ConnectionConfig } from "@/api/types"
import { CacheRateCard } from "@/components/CacheRateCard"
import { CostCard } from "@/components/CostCard"
import { LanguageToggle } from "@/components/LanguageToggle"
import { QuotaCard } from "@/components/QuotaCard"
import { TokenUsageCard } from "@/components/TokenUsageCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardData } from "@/hooks/useDashboardData"
import { useLanguage } from "@/lib/i18n"

interface DashboardProps {
  connection: ConnectionConfig
  onDisconnect: () => void
}

function LoadingCard() {
  return (
    <Card className="border-border/70">
      <CardHeader className="space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-9 w-1/2" />
        <Skeleton className="h-2 w-full" />
      </CardContent>
    </Card>
  )
}

export function Dashboard({ connection, onDisconnect }: DashboardProps) {
  const { t } = useLanguage()
  const { metrics, isLoading, error, refresh, refreshIntervalMs } =
    useDashboardData(connection)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!metrics) {
      return
    }

    const interval = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [metrics])

  const liveElapsedSeconds = metrics
    ? Math.max(0, Math.floor((now - metrics.fetchedAt) / 1000))
    : 0

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border/70 bg-card/60 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Circle className="size-2 fill-emerald-500 text-emerald-500" />
              <Badge variant="outline">{t.actions.connected}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {t.dashboard.lastUpdated(liveElapsedSeconds, Math.floor(refreshIntervalMs / 1000))}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button variant="outline" onClick={() => void refresh()}>
              <RefreshCw className="size-4" />
              {t.actions.refresh}
            </Button>
            <Button variant="ghost" onClick={onDisconnect}>
              <LogOut className="size-4" />
              {t.actions.disconnect}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-6 md:grid-cols-2 xl:grid-cols-4">
        {isLoading && !metrics ? (
          <>
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
          </>
        ) : (
          <>
            <TokenUsageCard tokenStat={metrics?.tokenStat ?? null} />
            <CostCard costStat={metrics?.costStat ?? null} />
            <QuotaCard quotaUsages={metrics?.quotaUsages ?? []} />
            <CacheRateCard
              cacheRate={metrics?.cacheRate ?? 0}
              tokenStat={metrics?.tokenStat ?? null}
            />
          </>
        )}
      </main>

      {error ? (
        <div className="mx-auto w-full max-w-7xl px-4 pb-8">
          <Separator className="mb-4" />
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        </div>
      ) : null}
    </div>
  )
}
