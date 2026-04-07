import { useState } from "react"
import { Copy, Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"

interface ApiKeySecretProps {
  apiKey: string
  label: string
}

function maskApiKey(apiKey: string) {
  if (apiKey.length <= 12) {
    return apiKey
  }

  return `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`
}

export function ApiKeySecret({ apiKey, label }: ApiKeySecretProps) {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey)
      setMessage("已复制")
    } catch {
      setMessage("复制失败")
    }
  }

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <p className="max-w-[280px] truncate rounded bg-muted/60 px-2 py-1 font-mono text-xs">
          {visible ? apiKey : maskApiKey(apiKey)}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => setVisible((value) => !value)}
          title={visible ? "隐藏" : "查看"}
        >
          {visible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => void copy()}
          title="复制"
        >
          <Copy className="size-3.5" />
        </Button>
      </div>
      {message ? <p className="text-[11px] text-muted-foreground">{message}</p> : null}
    </div>
  )
}
