import { DEFAULT_LOCALE, resolveIntlLocale, type AppLocale } from "@/lib/locale"

export function formatNumber(value: number, locale: AppLocale = DEFAULT_LOCALE) {
  return new Intl.NumberFormat(resolveIntlLocale(locale)).format(value)
}

export function formatCompactNumber(value: number, locale: AppLocale = DEFAULT_LOCALE) {
  const absoluteValue = Math.abs(value)

  if (absoluteValue < 1_000) {
    return formatNumber(value, locale)
  }

  const units = [
    { threshold: 1_000_000_000, suffix: "B" },
    { threshold: 1_000_000, suffix: "M" },
    { threshold: 1_000, suffix: "K" },
  ]

  const unit = units.find(({ threshold }) => absoluteValue >= threshold)

  if (!unit) {
    return formatNumber(value, locale)
  }

  const compactValue = value / unit.threshold
  const maximumFractionDigits = Math.abs(compactValue) >= 100 ? 0 : 1
  const formattedValue = new Intl.NumberFormat(resolveIntlLocale(locale), {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(compactValue)

  return `${formattedValue}${unit.suffix}`
}

export function formatCost(value: number, locale: AppLocale = DEFAULT_LOCALE) {
  return `$${value.toLocaleString(resolveIntlLocale(locale), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}
