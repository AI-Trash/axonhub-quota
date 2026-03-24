import { useState } from "react"
import { KeyRound } from "lucide-react"

import type { ConnectInput } from "@/hooks/useAuth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
          <Badge variant="outline" className="w-fit">AxonHub dashboard</Badge>
          <CardTitle className="text-2xl tracking-tight">Connect your AxonHub instance</CardTitle>
          <CardDescription>
            Enter your AxonHub API key to view usage metrics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="api-key">API key</Label>
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
                  placeholder="ahk_live_..."
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
              {isConnecting ? "Connecting..." : "Connect"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
