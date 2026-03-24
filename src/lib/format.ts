export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}

export function formatCost(value: number) {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}
