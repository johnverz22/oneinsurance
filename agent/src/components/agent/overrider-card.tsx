import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatPHPAmount } from '@/utils/formatter'
import { Overrider } from '@/types/agent/overrider'
import { format } from 'date-fns'

type OverriderCardProps = {
  overrider: Overrider
  onViewDetails?: () => void
  onContact?: () => void
}

export const OverriderCard = ({
  overrider: {
    name,
    code,
    status,
    rank,
    recruited,
    lastSale,
    totalSales,
    salesCount,
    overrider_commission,
    upline_deduction,
    authorizedProducts,
  },
  onViewDetails,
  onContact,
}: OverriderCardProps) => {
  const getRankColor = (rank: string) => {
    const lowerRank = rank.toLowerCase()
    if (lowerRank.includes('junior')) return 'text-blue-600'
    if (lowerRank.includes('trainee')) return 'text-orange-600'
    if (lowerRank.includes('new')) return 'text-orange-600'
    if (lowerRank.includes('senior')) return 'text-purple-600'
    return 'text-blue-600'
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'M/d/yyyy')
    } catch {
      return dateString
    }
  }

  return (
    <div className="bg-background w-full space-y-4 rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 font-semibold text-white text-sm">
            {name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()}
          </div>
          <div>
            <p className="text-base font-bold">{name}</p>
            <p className="text-muted-foreground text-sm">{code}</p>
          </div>
        </div>
        <Badge
          variant="secondary"
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-md',
            status === 'Active'
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          )}
        >
          {status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-y-2 text-sm">
        <span className="text-muted-foreground">Rank:</span>
        <span className={cn('text-right font-semibold', getRankColor(rank))}>
          {rank}
        </span>

        <span className="text-muted-foreground">Recruited:</span>
        <span className="text-right">{formatDate(recruited)}</span>

        <span className="text-muted-foreground">Last Sale:</span>
        <span className="text-right">{formatDate(lastSale)}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 text-center">
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {formatPHPAmount(totalSales)}
          </p>
          <p className="text-muted-foreground text-xs mt-1">Total Sales</p>
        </div>
        <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-3 text-center">
          <p className="text-lg font-bold text-green-600 dark:text-green-400">
            {salesCount}
          </p>
          <p className="text-muted-foreground text-xs mt-1">Sales Count</p>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg px-4 py-3 space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Their Commission:</span>
          <span className="font-semibold text-green-600">
            {formatPHPAmount(overrider_commission)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Your Share:</span>
          <span className="font-semibold text-red-600">
            {formatPHPAmount(upline_deduction)}
          </span>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Authorized Products:</p>
        <div className="flex flex-wrap gap-2">
          {authorizedProducts.map((product) => (
            <Badge
              key={product}
              variant="outline"
              className="rounded-full bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 px-3 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300"
            >
              {product}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          onClick={onViewDetails}
          className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
        >
          View Details
        </Button>
        <Button onClick={onContact} variant="outline" className="flex-1">
          Contact
        </Button>
      </div>
    </div>
  )
}
