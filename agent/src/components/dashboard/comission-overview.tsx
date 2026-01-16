import { Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { FC } from 'react'
import { useGetAgentStatistics } from '@/app/data/queries/statistics'
import { Skeleton } from '../ui/skeleton'

export const CommissionOverview: FC = () => {
  const { data: statistics, isLoading } = useGetAgentStatistics()

  if (isLoading) {
    return (
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Commission Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-2.5 w-full" />
        </CardContent>
      </Card>
    )
  }

  const totalCommission = statistics?.total_commission ?? 0
  const released = totalCommission * 0.66 // Example: 66% released
  const pending = totalCommission * 0.34 // Example: 34% pending
  const upcomingPayout = totalCommission * 0.5 // Example calculation

  const releasedPercentage =
    totalCommission > 0 ? (released / totalCommission) * 100 : 0

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Commission Overview</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between space-y-6">
        <div className="mb-1 flex flex-col gap-1.5 text-base">
          <div className="flex w-full gap-4 text-[#B4975A]">
            <p className="w-20">Released:</p>
            <span>
              PHP{' '}
              {released.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex w-full gap-4 text-gray-600 dark:text-gray-300">
            <p className="w-20">Upcoming:</p>
            <span>
              PHP{' '}
              {upcomingPayout.toLocaleString('en-US', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="flex w-full gap-4 text-red-600 dark:text-red-300">
            <p className="w-20">Pending:</p>
            <span>
              PHP{' '}
              {pending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        <div className="flex flex-col">
          <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            PHP
            {totalCommission.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Commission
          </p>
        </div>
      </CardContent>
      <CardContent>
        <div className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-2.5 rounded-full bg-green-500"
            style={{ width: `${releasedPercentage}%` }}
          />
        </div>
      </CardContent>
    </Card>
  )
}
