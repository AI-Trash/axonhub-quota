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

interface TokenTrendChartProps {
  data: UsageChartPoint[]
}

export function TokenTrendChart({ data }: TokenTrendChartProps) {
  const { locale, t } = useLanguage()

  const formatTooltipValue = (
    value: number | string | ReadonlyArray<number | string> | undefined,
  ) => {
    if (typeof value === "number") {
      return formatNumber(value, locale)
    }

    if (typeof value === "string") {
      const numericValue = Number(value)

      if (!Number.isNaN(numericValue)) {
        return formatNumber(numericValue, locale)
      }

      return value
    }

    if (Array.isArray(value)) {
      return value.join(", ")
    }

    return formatNumber(0, locale)
  }

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
                contentStyle={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--card)",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value, name, item) => {
                  const payload = item.payload as UsageChartPoint | undefined

                  if (name === t.chart.usageSeries) {
                    return [formatTooltipValue(value), name]
                  }

                  if (!payload?.costAvailable || payload.cost === null) {
                    return [t.chart.costUnavailable, t.chart.costLabel]
                  }

                  return [formatCost(payload.cost, locale), t.chart.costLabel]
                }}
                labelFormatter={(label) => `${t.chart.dayLabel}: ${label}`}
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
