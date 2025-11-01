import React, { FC } from 'react'

import { PolicySummary } from '@/components/dashboard/policy-summary'
import { PerformanceChart } from '@/components/dashboard/performance-chart'
import { CommissionOverview } from '@/components/dashboard/comission-overview'
import { ClientActivity } from '@/components/dashboard/client-activity'
import { QuickActions } from '@/components/dashboard/quick-actions'

// MAIN APP COMPONENT /////////////////////////////////////////////////////////
const App: FC = () => {
  return (
    <div className="font-san min-h-screen">
      {/* Main Content */}
      <main className="w-full">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            <PolicySummary />
            <PerformanceChart />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <QuickActions />
            <CommissionOverview />
            <ClientActivity />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
