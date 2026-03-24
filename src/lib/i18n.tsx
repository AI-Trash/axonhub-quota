import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import { DEFAULT_LOCALE, resolveIntlLocale, type AppLocale } from "@/lib/locale"

const STORAGE_KEY = "axonhub-quota-language"

const translations = {
  zh: {
    appName: "AxonHub 配额面板",
    app: {
      restoringSession: "正在恢复上次的 AxonHub 会话…",
    },
    language: {
      zh: "中文",
      en: "English",
      switcherLabel: "语言",
    },
    actions: {
      connect: "连接",
      connecting: "连接中…",
      disconnect: "断开连接",
      connected: "已连接",
    },
    errors: {
      enterApiKey: "请输入 API Key",
      failedToConnect: "连接失败",
      storedSessionExpired: "已保存会话已失效",
      failedToFetchDashboardData: "获取仪表盘数据失败",
    },
    connection: {
      badge: "AxonHub 配额面板",
      title: "连接你的 AxonHub 实例",
      description: "输入你的 AxonHub API Key 以查看用量指标。",
      apiKeyLabel: "API Key",
      apiKeyPlaceholder: "ahk_live_...",
    },
    dashboard: {
      lastUpdated: (seconds: number, intervalSeconds: number) =>
        `上次更新：${seconds} 秒前 · 每 ${intervalSeconds} 秒自动刷新`,
      scopedDescription: "所选 API Key 的时间窗口统计",
      todayScope: "今日",
      weekScope: "近 7 天",
      window: (start: string, end: string) => `窗口：${start} — ${end}`,
      exactTotal: (total: string) => `精确总量：${total}`,
    },
    tokenUsage: {
      title: "总 Token 用量",
      description: "当前 API Key 的全部流量",
      input: "输入",
      output: "输出",
      cached: "缓存",
      reasoning: "推理",
    },
    cost: {
      title: "总费用",
      description: "该 API Key 的计费使用量",
    },
    quota: {
      title: "配额限制",
      noProfileFound: "未找到配额配置",
      noData: "暂无数据",
      noUsage: "该 API Key 暂时没有可用的配额使用记录。",
      activeProfiles: (count: number) => `${count} 个生效配置`,
      requests: "请求数",
      tokens: "Token",
      usageCost: "费用",
      unlimited: "无限制",
      window: "周期",
    },
    cacheRate: {
      title: "缓存命中率",
      description: "缓存 Token 占输入 Token 的比例",
      summary: (cached: string, input: string) => `已缓存 ${cached} / 输入 ${input}`,
    },
    chart: {
      title: "7 日 Token 趋势",
      description: "按日查看输入、输出与缓存 Token 变化",
      dayLabel: "日期",
    },
  },
  en: {
    appName: "AxonHub Quota Dashboard",
    app: {
      restoringSession: "Restoring previous AxonHub session…",
    },
    language: {
      zh: "中文",
      en: "English",
      switcherLabel: "Language",
    },
    actions: {
      connect: "Connect",
      connecting: "Connecting…",
      disconnect: "Disconnect",
      connected: "Connected",
    },
    errors: {
      enterApiKey: "Please enter your API key",
      failedToConnect: "Failed to connect",
      storedSessionExpired: "Stored session expired",
      failedToFetchDashboardData: "Failed to fetch dashboard data",
    },
    connection: {
      badge: "AxonHub Quota Dashboard",
      title: "Connect your AxonHub instance",
      description: "Enter your AxonHub API key to view usage metrics.",
      apiKeyLabel: "API key",
      apiKeyPlaceholder: "ahk_live_...",
    },
    dashboard: {
      lastUpdated: (seconds: number, intervalSeconds: number) =>
        `Last updated: ${seconds} seconds ago · Auto-refresh every ${intervalSeconds}s`,
      scopedDescription: "Time-window statistics for the selected API key",
      todayScope: "Today",
      weekScope: "Last 7 days",
      window: (start: string, end: string) => `Window: ${start} — ${end}`,
      exactTotal: (total: string) => `Exact total: ${total}`,
    },
    tokenUsage: {
      title: "Total token usage",
      description: "All traffic for the selected API key",
      input: "Input",
      output: "Output",
      cached: "Cached",
      reasoning: "Reasoning",
    },
    cost: {
      title: "Total cost",
      description: "Billed usage for this API key",
    },
    quota: {
      title: "Quota limit",
      noProfileFound: "No quota profile found",
      noData: "No data",
      noUsage: "Quota usage is not available for this API key yet.",
      activeProfiles: (count: number) => `${count} active profile${count > 1 ? "s" : ""}`,
      requests: "Requests",
      tokens: "Tokens",
      usageCost: "Cost",
      unlimited: "Unlimited",
      window: "Window",
    },
    cacheRate: {
      title: "Cache rate",
      description: "Cached tokens compared to input tokens",
      summary: (cached: string, input: string) => `${cached} cached of ${input} input`,
    },
    chart: {
      title: "7-day token trend",
      description: "Daily input, output, and cached token movement",
      dayLabel: "Date",
    },
  },
} as const

interface LanguageContextValue {
  locale: AppLocale
  intlLocale: string
  setLocale: (locale: AppLocale) => void
  t: (typeof translations)[AppLocale]
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function loadStoredLocale(): AppLocale {
  const storedLocale = localStorage.getItem(STORAGE_KEY)

  if (storedLocale === "zh" || storedLocale === "en") {
    return storedLocale
  }

  return DEFAULT_LOCALE
}

export function LanguageProvider({ children }: PropsWithChildren) {
  const [locale, setLocale] = useState<AppLocale>(() => loadStoredLocale())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale)
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en"
    document.title = translations[locale].appName
  }, [locale])

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      intlLocale: resolveIntlLocale(locale),
      setLocale,
      t: translations[locale],
    }),
    [locale],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider")
  }

  return context
}
