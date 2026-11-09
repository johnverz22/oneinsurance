'use client'

import { Card } from '@/components/ui/card'
import {
  LeaderboardDataTable,
  LeaderboardAgent,
  LeaderboardDataTableAction,
} from '@/app/(admin)/(team)/leaderboard/leaderboard-data-table'
import { exportToCSV } from '@/utils/export-to-csv'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

export default function LeaderboardPage() {
  const leaderboardData: LeaderboardAgent[] = [
    {
      rank: 1,
      name: 'Carlos Rodriguez',
      role: 'Team Manager',
      team: 'Metro Manila',
      totalSales: 3120000,
      commission: 936000,
      overriders: ['Victor Santos'],
    },
    {
      rank: 2,
      name: 'John Santos',
      role: 'Senior Agent',
      team: 'Davao',
      totalSales: 2450000,
      commission: 735000,
      overriders: [
        'Grace Cruz',
        'Carmen Diaz',
        'Carmen Diaz',
        'Carmen Diaz',
        'Carmen Diaz',
        'Carmen Diaz',
        'Carmen Diaz',
        'Carmen Diaz',
      ],
    },
    {
      rank: 3,
      name: 'Maria Gracia',
      role: 'Team Manager',
      team: 'Cebu',
      totalSales: 1890000,
      commission: 567000,
      overriders: ['Marco Dela Cruz'],
    },
    {
      rank: 4,
      name: 'Roberto Cruz',
      role: 'Agent',
      team: 'Iloilo',
      totalSales: 1560000,
      commission: 468000,
      overriders: ['Teresa Valdez'],
    },
    {
      rank: 5,
      name: 'Ana Reyes',
      role: 'Agent',
      team: 'Metro Manila',
      totalSales: 980000,
      commission: 294000,
      overriders: ['Jose Martinez'],
    },
  ]

  const actions: LeaderboardDataTableAction<LeaderboardAgent>[] = [
    {
      label: 'View Details',
      onClick: (agent) => {},
    },
    {
      label: 'View Hierarchy',
      onClick: (agent) => {},
    },
    {
      label: 'Contact Agent',
      onClick: (agent) => {},
    },
  ]

  function handleExportToCSV(): void {
    if (leaderboardData.length === 0) {
      toast.info('No data to export')
      return
    }
    exportToCSV(leaderboardData, 'leaderboard-export.csv')
    toast.success('Data exported successfully')
  }

  return (
    <Card className="w-full rounded-3xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between border-b pb-4">
        <h2 className="text-2xl font-bold">Agent Performance Leaderboard</h2>
        <p className="text-muted-foreground text-sm">
          Ranked by total sales and commission performance
        </p>
      </div>

      {/* Leaderboard Data Table */}
      <LeaderboardDataTable data={leaderboardData} actions={actions} />
    </Card>
  )
}
