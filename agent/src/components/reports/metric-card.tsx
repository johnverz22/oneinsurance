import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Users,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ReportMetric } from '@/types/report'

interface MetricCardProps {
  metric: ReportMetric
}

const iconMap = {
  dollar: DollarSign,
  users: Users,
  file: FileText,
  alert: AlertTriangle,
}

export function MetricCard({ metric }: MetricCardProps) {
  const Icon = iconMap[metric.icon as keyof typeof iconMap] || FileText

  const getTrendIcon = () => {
    switch (metric.changeType) {
      case 'increase':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'decrease':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = () => {
    switch (metric.changeType) {
      case 'increase':
        return 'text-green-600'
      case 'decrease':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const formatValue = (value: string | number) => {
    if (typeof value === 'number') {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`
      }
      return value.toLocaleString()
    }
    return value
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
        <Icon className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(metric.value)}</div>
        <div className="mt-2 flex items-center gap-2">
          {getTrendIcon()}
          <span className={`text-xs font-medium ${getTrendColor()}`}>
            {metric.change > 0 ? '+' : ''}
            {metric.change}%
          </span>
          <span className="text-muted-foreground text-xs">
            from last period
          </span>
        </div>
        {metric.description && (
          <p className="text-muted-foreground mt-2 text-xs">
            {metric.description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
