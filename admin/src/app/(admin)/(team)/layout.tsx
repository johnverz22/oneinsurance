'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'

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
      
      {/* Tab Navigation */}
      <div className="flex items-end">
        <Link
          href="/agents"
          className={`relative z-30 rounded-t-xl border-x border-t px-4 py-2 text-sm font-semibold transition-all sm:rounded-t-2xl sm:px-6 sm:py-3 sm:text-base md:px-8 md:text-lg ${
            pathname === '/agents'
              ? 'border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white'
              : 'border-gray-200 bg-white text-gray-500 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Agents
        </Link>
        <Link
          href="/applicants"
          className={`relative z-30 rounded-t-xl border-x border-t px-4 py-2 text-sm font-semibold transition-all sm:rounded-t-2xl sm:px-6 sm:py-3 sm:text-base md:px-8 md:text-lg ${
            pathname === '/applicants'
              ? 'border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white'
              : 'border-gray-200 bg-white text-gray-500 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Applicants
        </Link>
      </div>

      {children}
    </div>
  )
}
