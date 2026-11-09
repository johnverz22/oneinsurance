'use client'

import { Tab, TabNavigation } from '@/components/ui/tab-navigation'
import { PageHeader } from '@/components/ui/page-header'
import { SearchIcon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/use-debounce'

export default function TeamLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const TABS = [
    { value: '/applicants', label: 'Applicants' },
    { value: '/interviews', label: 'Interviews' },
  ] satisfies Tab[]

  return (
    <div className="relative h-full w-full space-y-6">
      <PageHeader
        title="Applicants & Interviews"
        subTitle="Manage applicants and schedule interviews"
      />
      <div className="flex items-center justify-between">
        <TabNavigation tabs={TABS} />
        
      </div>

      {children}
    </div>
  )
}
