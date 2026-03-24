import { resolveIntlLocale, type AppLocale } from "@/lib/locale"

export function formatNumber(value: number, locale: AppLocale = "en") {
  return new Intl.NumberFormat(resolveIntlLocale(locale)).format(value)
}

export function formatCost(value: number, locale: AppLocale = "en") {
  return `$${value.toLocaleString(resolveIntlLocale(locale), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}
