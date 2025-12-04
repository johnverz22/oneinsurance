'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { useTeamSearchStore } from '../team-search-search'
import { useEffect } from 'react'

interface Overrider {
  id: number
  initials: string
  name: string
  role: string
  sales: number
  commission: number
  uplineDeduction: number
  avatarColor: string
}

interface TeamManager {
  initials: string
  name: string
  role: string
  totalSales: number
  grossCommission: number
  avatarColor: string
}

interface HierarchyData {
  manager: TeamManager
  overriders: Overrider[]
}

export default function HierarchyPage() {
  const { query } = useTeamSearchStore()

  const hierarchyData: HierarchyData[] = [
    {
      manager: {
        initials: 'CR',
        name: 'Carlos Rodriguez',
        role: 'Team Manager',
        totalSales: 3120000,
        grossCommission: 936000,
        avatarColor: 'bg-blue-200 text-blue-600',
      },
      overriders: [
        {
          id: 1,
          initials: 'MS',
          name: 'Maria Santos',
          role: 'Overrider',
          sales: 450000,
          commission: 67500,
          uplineDeduction: 45000,
          avatarColor: 'bg-green-200 text-green-600',
        },
        {
          id: 2,
          initials: 'JC',
          name: 'John Cruz',
          role: 'Overrider',
          sales: 320000,
          commission: 48000,
          uplineDeduction: 32000,
          avatarColor: 'bg-green-200 text-green-600',
        },
      ],
    },
    {
      manager: {
        initials: 'CR',
        name: 'Carlos Rodriguez',
        role: 'Team Manager',
        totalSales: 3120000,
        grossCommission: 936000,
        avatarColor: 'bg-blue-200 text-blue-600',
      },
      overriders: [
        {
          id: 1,
          initials: 'MS',
          name: 'Maria Santos',
          role: 'Overrider',
          sales: 450000,
          commission: 67500,
          uplineDeduction: 45000,
          avatarColor: 'bg-green-200 text-green-600',
        },
      ],
    },
  ]

  const formatCurrency = (amount: number) => {
    return `₱ ${amount.toLocaleString()}`
  }

  const calculateNetCommission = (data: HierarchyData) => {
    const totalDeductions = data.overriders.reduce(
      (sum, overrider) => sum + overrider.uplineDeduction,
      0
    )
    return data.manager.grossCommission - totalDeductions
  }

  return (
    <div className="w-full space-y-6">
      {hierarchyData.map((data, index) => (
        <Card key={index} className="w-full rounded-3xl p-6">
          {/* Team Manager Section */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className={`h-16 w-16 ${data.manager.avatarColor}`}>
                <AvatarFallback className="text-xl font-semibold">
                  {data.manager.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">{data.manager.name}</h2>
                <p className="text-sm text-blue-500">{data.manager.role}</p>
              </div>
            </div>
            <div className="flex gap-12">
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {formatCurrency(data.manager.totalSales)}
                </p>
                <p className="text-sm text-gray-500">Total Sales</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.manager.grossCommission)}
                </p>
                <p className="text-sm text-gray-500">Gross Commission</p>
              </div>
            </div>
          </div>

          {/* Overriders Section */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">
              Overriders ({data.overriders.length})
            </h3>
            <div className="space-y-4">
              {data.overriders.map((overrider) => (
                <div
                  key={overrider.id}
                  className="flex items-center justify-between rounded-2xl p-4"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className={`h-12 w-12 ${overrider.avatarColor}`}>
                      <AvatarFallback className="font-semibold">
                        {overrider.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold">{overrider.name}</h4>
                      <p className="text-sm text-blue-500">{overrider.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-8">
                    <div className="text-right">
                      <p className="font-bold">
                        {formatCurrency(overrider.sales)}
                      </p>
                      <p className="text-sm text-gray-500">Sales</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        {formatCurrency(overrider.commission)}
                      </p>
                      <p className="text-sm text-gray-500">Commission</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">
                        - {formatCurrency(overrider.uplineDeduction)}
                      </p>
                      <p className="text-sm text-gray-500">Upline Deduction</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Net Commission Summary */}
          <div className="flex items-center justify-between rounded-2xl border-t bg-gray-100 px-6 py-4 dark:bg-gray-800">
            <p className="text-lg font-semibold dark:text-gray-200">
              Net Commission for {data.manager.name}:
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(calculateNetCommission(data))}
            </p>
          </div>
        </Card>
      ))}
    </div>
  )
}
