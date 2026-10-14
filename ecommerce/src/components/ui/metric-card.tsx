import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  icon?: LucideIcon
  /** Numeric changes are rendered as percentages with a sign. */
  change?: string | number
  /** Defaults to 'increase' when change > 0, 'decrease' when change < 0. */
  changeType?: 'increase' | 'decrease' | 'neutral'
  description?: string
  className?: string
}

function formatValue(value: string | number) {
  if (typeof value !== 'number') return value
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString()
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  change,
  changeType,
  description,
  className,
}: MetricCardProps) {
  const resolvedType =
    changeType ??
    (typeof change === 'number'
      ? change > 0
        ? 'increase'
        : change < 0
          ? 'decrease'
          : 'neutral'
      : 'neutral')

  const TrendIcon =
    resolvedType === 'increase'
      ? TrendingUp
      : resolvedType === 'decrease'
        ? TrendingDown
        : Minus

  const trendColor =
    resolvedType === 'increase'
      ? 'text-success'
      : resolvedType === 'decrease'
        ? 'text-destructive'
        : 'text-muted-foreground'

  const changeLabel =
    typeof change === 'number'
      ? `${change > 0 ? '+' : ''}${change}%`
      : change

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 shrink-0" />}
          {title}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value)}</div>
        {change !== undefined && (
          <div className="mt-2 flex items-center gap-2">
            <TrendIcon className={cn('h-4 w-4', trendColor)} />
            <span className={cn('text-xs font-medium', trendColor)}>
              {changeLabel}
            </span>
            <span className="text-muted-foreground text-xs">
              from last period
            </span>
          </div>
        )}
        {description && (
          <p className="text-muted-foreground mt-2 text-xs">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
