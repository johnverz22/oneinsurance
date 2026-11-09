'use client'

import { Tab, TabNavigation } from '@/components/ui/tab-navigation'
import { PageHeader } from '@/components/ui/page-header'

export default function LineOfBusinessLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const TABS = [
    { value: '/lobs', label: 'Line of Business' },
    { value: '/agent-lobs', label: 'Agent Assignments' },
  ] satisfies Tab[]

  return (
    <div className="relative h-full w-full space-y-6">
      <PageHeader
        title="Line of Business"
        subTitle="Manage line of business and agent assignments"
      />
      <div className="flex items-center">
        <TabNavigation tabs={TABS} />
      </div>
      {children}
    </div>
  )
}
