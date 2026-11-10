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
        <PillTabs
          tabs={TABS}
          active={activeTab}
          onChange={setActiveTab}
          className="mt-7"
        />
        <section
          className="mt-6"
          aria-label={
            activeTab === 'agents' ? 'Registered agents' : 'Applicants'
          }
        >
          {activeTab === 'agents' ? <AgentsTab /> : <ApplicantsTab />}
        </section>
      </div>
    </>
  )
}
