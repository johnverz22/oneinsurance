'use client'

import { usePathname } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { PillLinkTabs } from '@/components/ui/design-system'

const TEAM_TABS = [
  { href: '/agents',     label: 'Agents' },
  { href: '/applicants', label: 'Applicants' },
]

export default function TeamLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()

  return (
    <div className="relative h-full w-full">
      <div className="mb-6">
        <PageHeader
          title="Agents & Applicants Management"
          subTitle="Manage your agents and applicants efficiently"
        />
      </div>

      <PillLinkTabs tabs={TEAM_TABS} activePath={pathname} className="mb-4" />

      <div className="mt-4">
        {children}
      </div>
    </div>
  )
}
