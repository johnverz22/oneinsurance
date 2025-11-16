import { format } from 'date-fns'
import { Dot } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAgentAuthStore } from '@/store/agent-auth-store'
import { formatPHPAmount } from '@/utils/formatter'
import { cn } from '@/lib/utils'

type Amount =
  | 'TOTAL_SALES'
  | 'GROSS_COMMISSION'
  | 'OVERRIDER_DEDUCTIONS'
  | 'NET_COMMISSION'

export const ProfileOverview = () => {
  const { user } = useAgentAuthStore()

  const AMOUNTS = {
    TOTAL_SALES: 2_450_000,
    GROSS_COMMISSION: 735_000,
    OVERRIDER_DEDUCTIONS: -60_000,
    NET_COMMISSION: 675_000,
  } as Record<Amount, number>

  const STYLES = {
    OVERRIDER_DEDUCTIONS: 'text-destructive',
    NET_COMMISSION: 'text-blue-500',
  } as Record<Amount, string>

  return (
    <Card>
      <CardContent className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Avatar className="size-20">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-bold md:text-xl lg:text-2xl">
              {user?.name}
            </h2>
            <div className="flex items-center gap-1.5 text-blue-500">
              <p>Senior Agent </p>
              <Dot />
              <p>Metro Manila</p>
            </div>
            <p>Member since {format(new Date(), 'P')}</p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          {Object.entries(AMOUNTS).map(([key, value]) => (
            <div key={key} className="min-w-40 space-y-0.5 text-right">
              <p className={cn('text-lg font-bold', STYLES[key as Amount])}>
                {formatPHPAmount(value)}
              </p>
              <span className="text-muted-foreground capitalize">
                {key.replace('_', ' ').toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
