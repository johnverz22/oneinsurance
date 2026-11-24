'use client'

import { useState } from 'react'
import { UserCheck, Users, Handshake } from 'lucide-react'
import { PortalContentHeader } from '@/components/layout/portal-content-header'
import { PillTabs } from '@/components/ui/pill-tabs'
import { AgentsTab } from './agents-tab'
import { ReferralPartnersTab } from './referral-partners-tab'
import { ApplicantsTab } from './applicants-tab'

const TABS = [
  { id: 'agents', label: 'Agents', icon: Users },
  { id: 'referral-partners', label: 'Referral Partners', icon: Handshake },
  { id: 'applicants', label: 'Applicants', icon: UserCheck },
]

const TAB_LABELS: Record<string, string> = {
  agents: 'Registered agents',
  'referral-partners': 'Referral partners',
  applicants: 'Applicants',
}

export function AgentsClient() {
  const [activeTab, setActiveTab] = useState('agents')

  return (
    <>
      <PortalContentHeader
        title="Agents & applicants"
        description="Review registered agents, referral partners, and incoming applications."
      />
      <>
        <PillTabs
          tabs={TABS}
          active={activeTab}
          onChange={setActiveTab}
          className="mt-7"
        />
        <section
          className="mt-6"
          aria-label={TAB_LABELS[activeTab] ?? activeTab}
        >
          {activeTab === 'agents' && <AgentsTab />}
          {activeTab === 'referral-partners' && <ReferralPartnersTab />}
          {activeTab === 'applicants' && <ApplicantsTab />}
        </section>
      </>
    </>
  )
}
