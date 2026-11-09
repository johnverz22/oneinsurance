'use client'

import { useState } from 'react'
import { UserCheck, Users } from 'lucide-react'
import { PortalContentHeader } from '@/components/layout/portal-content-header'
import { PillTabs } from '@/components/ui/pill-tabs'
import { AgentsTab } from './agents-tab'
import { ApplicantsTab } from './applicants-tab'

const TABS = [
  { id: 'agents', label: 'Agents', icon: Users },
  { id: 'applicants', label: 'Applicants', icon: UserCheck },
]

export function AgentsClient() {
  const [activeTab, setActiveTab] = useState('agents')

  return (
    <>
      <PortalContentHeader
        title="Agents & applicants"
        description="Review registered agents and incoming applications."
      />
      <div className="mx-auto w-full max-w-7xl">
        <section className="mt-4 min-w-0 rounded-lg border border-[#dfe7df] bg-white p-5 dark:border-[#3d4140] dark:bg-[#171919] sm:p-6">
          <PillTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

          <div className="mt-5">
            {activeTab === 'agents' ? <AgentsTab /> : <ApplicantsTab />}
          </div>
        </section>
      </div>
    </>
  )
}
