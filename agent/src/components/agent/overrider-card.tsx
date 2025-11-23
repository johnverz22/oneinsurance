import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatPHPAmount } from '@/utils/formatter'
import { Overrider } from '@/types/agent/overrider'

type OverriderCardProps = {
  overrider: Overrider
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
}: OverriderCardProps) => {
  return (
    <div className="bg-background w-full space-y-4 rounded-2xl border p-10 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-200 font-bold text-white dark:text-black">
            {name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <div>
            <p className="text-base font-bold">{name}</p>
            <p className="text-muted-foreground text-sm">{code}</p>
          </div>
        </div>
        <Badge
          variant="secondary"
          className={cn(
            'px-3 py-1 text-sm',
            status === 'Active'
              ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
              : 'text-muted bg-muted-foreground'
          )}
        >
          {status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-y-2 pt-4 text-sm">
        <span className="text-muted-foreground">Rank:</span>
        <span className="text-right font-medium text-blue-600">{rank}</span>

        <span className="text-muted-foreground">Recruited:</span>
        <span className="text-right">{recruited}</span>

        <span className="text-muted-foreground">Last Sale:</span>
        <span className="text-right">{lastSale}</span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-green-600/10 p-3 text-center">
          <p className="text-lg font-bold text-blue-600 dark:text-blue-200">
            {formatPHPAmount(totalSales)}
          </p>
          <p className="text-muted-foreground text-xs">Total Sales</p>
        </div>
        <div className="rounded-lg bg-green-600/10 p-3 text-center">
          <p className="text-lg font-bold text-green-600 dark:text-green-200">
            {salesCount}
          </p>
          <p className="text-muted-foreground text-xs">Sales Count</p>
        </div>
      </div>

      <div className="text-muted-foreground bg-muted-foreground/5 mt-2 grid gap-0.5 rounded-md px-4 py-2.5 text-sm">
        <div className="flex justify-between">
          <p>Their Commission:</p>
          <p>{formatPHPAmount(overrider_commission)}</p>
        </div>
        <div className="flex justify-between">
          <p>Your Share:</p>
          <p className="text-red-600">{formatPHPAmount(upline_deduction)}</p>
        </div>
      </div>

      <div className="mt-2">
        <p className="text-sm font-medium">Authorized Products:</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {authorizedProducts.map((product) => (
            <Badge
              key={product}
              variant="outline"
              className="min-w-16 rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-600"
            >
              {product}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mt-4 flex gap-4">
        <Button className="flex-1 bg-blue-600 text-white hover:bg-blue-700">
          View Details
        </Button>
        <Button variant="outline" className="flex-1">
          Contact
        </Button>
      </div>
    </div>
  )
}
