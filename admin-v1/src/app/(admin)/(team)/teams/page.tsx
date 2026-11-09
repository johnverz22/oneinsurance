'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'

interface TeamData {
  id: number
  location: string
  manager: string
  managerInitial: string
  agents: number
  totalSales: number
  commissions: number
  avatarColor: string
}

export default function TeamPage() {
  const teamsData: TeamData[] = [
    {
      id: 1,
      location: 'Metro Manila',
      manager: 'Carlos Rodriguez',
      managerInitial: 'M',
      agents: 12,
      totalSales: 4200000,
      commissions: 1260000,
      avatarColor: 'bg-blue-200 text-blue-600',
    },
    {
      id: 2,
      location: 'Cebu',
      manager: 'Maria Garcia',
      managerInitial: 'C',
      agents: 8,
      totalSales: 2800000,
      commissions: 840000,
      avatarColor: 'bg-green-200 text-green-600',
    },
    {
      id: 3,
      location: 'Davao',
      manager: 'John Santos',
      managerInitial: 'D',
      agents: 6,
      totalSales: 2100000,
      commissions: 630000,
      avatarColor: 'bg-purple-200 text-purple-600',
    },
    {
      id: 4,
      location: 'Iloilo',
      manager: 'Ana Reyes',
      managerInitial: 'I',
      agents: 4,
      totalSales: 1200000,
      commissions: 360000,
      avatarColor: 'bg-orange-200 text-orange-600',
    },
  ]

  const formatCurrency = (amount: number) => {
    return `₱ ${amount.toLocaleString()}`
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {teamsData.map((team) => (
        <Card
          key={team.id}
          className="rounded-3xl p-6 transition-shadow hover:shadow-lg"
        >
          {/* Header with Avatar and Location */}
          <div className="mb-6 flex items-center gap-4">
            <Avatar className={`h-16 w-16 ${team.avatarColor}`}>
              <AvatarFallback className="text-2xl font-bold">
                {team.managerInitial}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-bold">{team.location}</h3>
              <p className="text-muted-foreground text-sm">{team.manager}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-3">
            {/* Agents */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Agents</span>
              <span className="font-bold">{team.agents}</span>
            </div>

            {/* Total Sales */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Total Sales</span>
              <span className="font-bold">
                {formatCurrency(team.totalSales)}
              </span>
            </div>

            {/* Commissions */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Commissions</span>
              <span className="font-bold text-green-600">
                {formatCurrency(team.commissions)}
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
