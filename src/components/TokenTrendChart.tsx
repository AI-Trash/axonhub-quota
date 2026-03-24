import type { UsageChartPoint } from "@/api/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCompactNumber, formatCost, formatNumber } from "@/lib/format"
import { useLanguage } from "@/lib/i18n"
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { TooltipContentProps } from "recharts/types/component/Tooltip"
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent"

interface TokenTrendChartProps {
  data: UsageChartPoint[]
}

interface ChartTooltipComponentProps extends TooltipContentProps<ValueType, NameType> {
  locale: "zh" | "en"
  t: ReturnType<typeof useLanguage>["t"]
}

function isUsageChartPoint(value: unknown): value is UsageChartPoint {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Partial<UsageChartPoint>

  return (
    typeof candidate.label === "string" &&
    typeof candidate.totalTokens === "number" &&
    (candidate.cost === null || typeof candidate.cost === "number") &&
    typeof candidate.costAvailable === "boolean"
  )
}

function ChartTooltip({ active, label, payload, locale, t }: ChartTooltipComponentProps) {
  if (!active || !payload?.length) {
    return null
  }

  const point = payload[0]?.payload

  if (!isUsageChartPoint(point)) {
    return null
  }

  return (
    <div
      className="space-y-1 rounded-md border bg-card px-3 py-2 text-xs shadow-sm"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--card)",
      }}
    >
      <div className="font-medium text-foreground">
        {t.chart.dayLabel}: {label}
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">{t.chart.usageSeries}</span>
        <span className="font-medium tabular-nums">{formatNumber(point.totalTokens, locale)}</span>
      </div>
      {point.costAvailable && point.cost !== null ? (
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">{t.chart.costLabel}</span>
          <span className="font-medium tabular-nums">{formatCost(point.cost, locale)}</span>
        </div>
      ) : null}
    </div>
  )
}

export function TokenTrendChart({ data }: TokenTrendChartProps) {
  const { locale, t } = useLanguage()

  return (
    <Card className="border-border/70 md:col-span-2 xl:col-span-4">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{t.chart.title}</CardTitle>
        <p className="text-xs text-muted-foreground">{t.chart.description}</p>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" minTickGap={24} tickLine={false} axisLine={false} />
              <YAxis
                tickFormatter={(value: number) => formatCompactNumber(value, locale)}
                tickLine={false}
                axisLine={false}
                width={56}
              />
              <Tooltip
                content={(props) => <ChartTooltip {...props} locale={locale} t={t} />}
                contentStyle={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--card)",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
              <Bar
                dataKey="totalTokens"
                name={t.chart.usageSeries}
                fill="var(--chart-1)"
                radius={[4, 4, 0, 0]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
