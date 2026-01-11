'use client'

import { Tab, TabNavigation } from '@/components/ui/tab-navigation'
import { PageHeader } from '@/components/ui/page-header'
import { Input } from '@/components/ui/input'
import { useTeamSearchStore } from './team-search-search'
import AddAgentDialog from './add-agent-dialog'
import { SearchIcon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/use-debounce'

export default function TeamLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const TABS = [
    // { value: '/hierarchy', label: 'Hierarchy' },
    // { value: '/leaderboard', label: 'Leaderboard' },
    // { value: '/teams', label: 'Teams' },
    { value: '/agents', label: 'Agents' },
    { value: '/applicants', label: 'Applicants' },
    { value: '/invitations', label: 'Invitations' },
  ] satisfies Tab[]

  const { query, setQuery } = useTeamSearchStore()
  const [inputValue, setInputValue] = useState(query)
  const debouncedValue = useDebounce(inputValue, 500)

  useEffect(() => {
    setQuery(debouncedValue)
  }, [debouncedValue, setQuery])

  return (
    <div className="relative h-full w-full space-y-6">
      <PageHeader
        title="Agents & Applicants Management"
        subTitle="Manage your agents and applicants efficiently"
      />
      <div className="flex items-center justify-between">
        <TabNavigation tabs={TABS} />
        <div className="flex items-center justify-end gap-4">
          <div className="flex h-11 w-80 items-center gap-2 rounded-full border-1 px-4">
            <SearchIcon className="text-muted-foreground h-6 w-6" />
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="h-full w-full"
              placeholder="Search agent"
            />
          </div>

          <AddAgentDialog />
        </div>
      </div>

      {children}
    </div>
  )
}
