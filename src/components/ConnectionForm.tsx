import { useState, type FormEvent } from "react"
import { KeyRound } from "lucide-react"

import type { ConnectInput } from "@/hooks/useAuth"
import { LanguageToggle } from "@/components/LanguageToggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/lib/i18n"

interface ConnectionFormProps {
  isConnecting: boolean
  error: string | null
  onSubmit: (input: ConnectInput) => Promise<boolean>
}

type FormState = ConnectInput

const INITIAL_FORM_STATE: FormState = {
  apiKey: "",
}

export function ConnectionForm({ isConnecting, error, onSubmit }: ConnectionFormProps) {
  const { t } = useLanguage()
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const connected = await onSubmit(formState)

    if (connected) {
      setFormState(INITIAL_FORM_STATE)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl items-center px-4 py-10">
        <Card className="mx-auto w-full max-w-xl border-border/70 shadow-lg shadow-foreground/5">
          <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <Badge variant="outline" className="w-fit">{t.connection.badge}</Badge>
            <LanguageToggle />
          </div>
          <CardTitle className="text-2xl tracking-tight">{t.connection.title}</CardTitle>
          <CardDescription>
            {t.connection.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="api-key">{t.connection.apiKeyLabel}</Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                <Input
                  id="api-key"
                  value={formState.apiKey}
                  onChange={(event) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      apiKey: event.target.value,
                    }))
                  }
                  className="pl-9"
                  placeholder={t.connection.apiKeyPlaceholder}
                  required
                />
              </div>
            </div>

            {error ? (
              <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <Button disabled={isConnecting} type="submit" className="w-full">
              {isConnecting ? t.actions.connecting : t.actions.connect}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
