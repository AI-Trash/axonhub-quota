export type AppLocale = "zh" | "en"

export const DEFAULT_LOCALE: AppLocale = "zh"

export function resolveIntlLocale(locale: AppLocale) {
  return locale === "zh" ? "zh-CN" : "en-US"
}
