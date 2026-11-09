import { format } from 'date-fns'
import { Dot } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAgentAuthStore } from '@/store/agent-auth-store'
import { formatPHPAmount } from '@/utils/formatter'
import { cn } from '@/lib/utils'
import { useGetAgentStatistics } from '@/app/data/queries/statistics'
import { Skeleton } from '@/components/ui/skeleton'

type Amount =
  | 'TOTAL_SALES'
  | 'GROSS_COMMISSION'
  | 'NUMBER_OF_SALES'
  | 'NET_COMMISSION'

export const ProfileOverview = () => {
  const { user, getInitials } = useAgentAuthStore()
  const { data: statistics, isSuccess: isStatisticsFetched } =
    useGetAgentStatistics()

  const STYLES = {
    NUMBER_OF_SALES: 'text-[#B8960C]',
    NET_COMMISSION: 'text-green-600',
  } as Record<Amount, string>

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  return (
    <Card>
      <CardContent className="flex w-full flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex w-full min-w-1/3 items-center gap-5 xl:w-1/3">
          <Avatar className="size-20">
            {user?.profile_photo_url && <AvatarImage src={user.profile_photo_url} />}
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-bold md:text-xl lg:text-2xl">
              {user?.name}
            </h2>
            <div className="flex items-center gap-1.5 text-[#B8960C]">
              <p>Senior Agent </p>
              <Dot />
              <p>Metro Manila</p>
            </div>
            <p>Member since {format(new Date(), 'P')}</p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-x-5 gap-y-3 lg:flex-row lg:items-center lg:justify-between">
          {isStatisticsFetched && statistics ? (
            <>
              <div>
                <div className="border-muted-foreground/10 min-w-40 space-y-0.5 rounded-2xl p-4 max-lg:w-full max-lg:border lg:text-right">
                  <p className={cn('text-lg font-bold')}>
                    PHP {formatCurrency(statistics.total_sales)}
                  </p>
                  <span className="text-muted-foreground capitalize">
                    Total Sales
                  </span>
                </div>
              </div>
              <div>
                <div className="border-muted-foreground/10 min-w-40 space-y-0.5 rounded-2xl p-4 max-lg:w-full max-lg:border lg:text-right">
                  <p
                    className={cn(
                      'text-lg font-bold',
                      STYLES['NUMBER_OF_SALES']
                    )}
                  >
                    {statistics.number_of_sales}
                  </p>
                  <span className="text-muted-foreground capitalize">
                    Cases
                  </span>
                </div>
              </div>
              <div>
                <div className="border-muted-foreground/10 min-w-40 space-y-0.5 rounded-2xl p-4 max-lg:w-full max-lg:border lg:text-right">
                  <p className={cn('text-lg font-bold')}>
                    PHP {formatCurrency(statistics.gross_commissions)}
                  </p>
                  <span className="text-muted-foreground capitalize">
                    Gross Commissions
                  </span>
                </div>
              </div>
              <div>
                <div className="border-muted-foreground/10 min-w-40 space-y-0.5 rounded-2xl p-4 max-lg:w-full max-lg:border lg:text-right">
                  <p
                    className={cn(
                      'text-lg font-bold',
                      STYLES['NET_COMMISSION']
                    )}
                  >
                    PHP {formatCurrency(statistics.net_commissions)}
                  </p>
                  <span className="text-muted-foreground capitalize">
                    Net Commissions
                  </span>
                </div>
              </div>
            </>
          ) : (
            [...Array(4)].map((_, index) => (
              <Skeleton
                key={index}
                className="border-muted-foreground/10 h-20 min-w-40 space-y-0.5 rounded-2xl p-4 max-lg:w-full max-lg:border lg:text-right"
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
