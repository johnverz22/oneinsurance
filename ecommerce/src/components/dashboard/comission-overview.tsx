import { Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { FC } from 'react'

interface CommissionData {
  totalThisMonth: number
  pending: number
  released: number
  upcomingPayout: number
}

const commissionData: CommissionData = {
  totalThisMonth: 12450.75,
  pending: 4200.5,
  released: 8250.25,
  upcomingPayout: 6300.0,
}

export const CommissionOverview: FC = () => {
  const { totalThisMonth, pending, released, upcomingPayout } = commissionData
  const releasedPercentage =
    totalThisMonth > 0 ? (released / (pending + released)) * 100 : 0

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
            {totalThisMonth.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total this Month
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
