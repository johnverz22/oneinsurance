import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import {
  Icon,
  LucideIcon,
  ShoppingCartIcon,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'

type MetricsCardProps = {
  title: string
  icon: LucideIcon
  value: string
  change: string
  changeType: boolean
}

export default function MetricsCard({
  title,
  icon: Icon,
  value,
  change,
  changeType,
}: MetricsCardProps) {
  return (
    <Card className="h-32 flex-1 gap-2">
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <Icon className="shrink-0" /> {title}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-end gap-4">
        <p className="text-4xl font-bold tracking-wider">{value}</p>

        <p
          className={`flex items-center gap-2 text-lg ${changeType ? 'text-green-700' : 'text-red-700'}`}
        >
          {changeType ? <TrendingUp /> : <TrendingDown />}
          {change}
        </p>
      </CardContent>
    </Card>
  )
}
