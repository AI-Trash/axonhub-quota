import type { ReactNode } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  description?: string
  value: string
  icon?: ReactNode
  footer?: ReactNode
  className?: string
}

export function MetricCard({
  title,
  description,
  value,
  icon,
  footer,
  className,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        "hover-card border-border/70",
        className
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon ? (
            <div className="rounded-lg bg-primary/10 p-1.5 text-primary dark:bg-primary/20">
              {icon}
            </div>
          ) : null}
        </div>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="font-mono text-3xl font-bold tracking-tight">{value}</p>
        {footer}
      </CardContent>
    </Card>
  )
}
