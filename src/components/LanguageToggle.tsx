import type { AppLocale } from "@/lib/locale"
import { useLanguage } from "@/lib/i18n"
import { Button } from "@/components/ui/button"

const OPTIONS: AppLocale[] = ["zh", "en"]

export function LanguageToggle() {
  const { locale, setLocale, t } = useLanguage()

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-background/80 p-1">
      <span className="px-2 text-xs text-muted-foreground">{t.language.switcherLabel}</span>
      {OPTIONS.map((option) => (
        <Button
          key={option}
          type="button"
          size="sm"
          variant={locale === option ? "default" : "ghost"}
          className="h-7 px-2 text-xs"
          onClick={() => setLocale(option)}
        >
          {t.language[option]}
        </Button>
      ))}
    </div>
  )
}
