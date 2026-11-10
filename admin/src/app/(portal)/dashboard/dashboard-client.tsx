'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  FileCheck2,
  CreditCard,
  Users,
  Wallet,
  TextSearch,
  ArrowUpRight,
  BarChart3,
  Coins,
  Banknote,
  UserCheck,
  PhilippinePeso,
} from 'lucide-react'
import { useAuthFetch } from '@/hooks/use-auth-fetch'
import { useHasHydrated, useIsAuthenticated } from '@/store/admin-auth-store'
import { useTopBarSearchStore } from '@/store/top-bar-search-store'
import { PortalContentHeader } from '@/components/layout/portal-content-header'
import { formatCurrency } from '@/lib/utils'
import type { AgentStatistics } from '@/types/admin/auth'

// ---- Overview metric card ----
type MetricProps = {
  label: string
  value: string
  icon: React.ReactNode
  loading?: boolean
}

function MetricCard({ label, value, icon, loading }: MetricProps) {
  return (
    <article className="min-w-0 rounded-lg border border-[#dfe7df] bg-white p-4 dark:border-[#3d4140] dark:bg-[#171919] sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium leading-5 text-[var(--text-sub)]">
          {label}
        </h3>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#eff6ef] text-[#006838] dark:bg-[#38483b] dark:text-[#d0e3c8]">
          {icon}
        </span>
      </div>
      {loading ? (
        <div className="skeleton mt-3 h-8 w-24 rounded-md" />
      ) : (
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-main)] sm:text-3xl">
          {value}
        </p>
      )}
    </article>
  )
}

// ---- Quick-action card (mockup: tall cards with gold hover border) ----
type ActionCardProps = {
  href: string
  title: string
  subtitle: string
  meta?: string
  icon: React.ReactNode
}

function ActionCard({ href, title, subtitle, meta, icon }: ActionCardProps) {
  return (
    <Link
      href={href}
      className="group flex min-h-44 w-full flex-col items-start rounded-md border border-[#dfe7df] bg-transparent p-4 text-left transition-colors hover:border-[#b88e28] hover:border-t-2 focus-visible:border-[#b88e28] focus-visible:border-t-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] dark:border-[#475049] dark:hover:border-[#b88e28] dark:focus-visible:border-[#b88e28]"
    >
      <span className="flex size-11 items-center justify-center rounded-md bg-[#e6f2e8] text-[#006838] transition-colors group-hover:bg-[#f8efd8] group-hover:text-[#805c0c] group-focus-visible:bg-[#f8efd8] group-focus-visible:text-[#805c0c] dark:bg-[#3d5242] dark:text-[#d0e3c8] dark:group-hover:bg-[#b88e28] dark:group-hover:text-[#183d2c] dark:group-focus-visible:bg-[#b88e28] dark:group-focus-visible:text-[#183d2c]">
        {icon}
      </span>
      <strong className="mt-4 block text-base leading-5 text-[var(--text-main)]">
        {title}
      </strong>
      <span className="mt-1 block text-sm leading-5 text-[var(--text-sub)]">
        {subtitle}
      </span>
      {meta && (
        <span className="mt-auto pt-4 text-[11px] font-semibold text-[#006838] dark:text-[#d0e3c8]">
          {meta}
        </span>
      )}
    </Link>
  )
}

// ---- Secondary area row ----
function AreaRow({
  href,
  title,
  subtitle,
  icon,
}: {
  href: string
  title: string
  subtitle: string
  icon: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex min-h-22 w-full items-center gap-4 rounded-md border border-[#dfe7df] bg-[#fbfcfa] p-4 text-left transition-colors hover:border-[#9fbea6] focus-visible:outline-2 focus-visible:outline-[#006838] dark:border-[#475049] dark:bg-[#222725]"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#e6f2e8] text-[#006838] dark:bg-[#3d5242] dark:text-[#d0e3c8]">
        {icon}
      </span>
      <span>
        <strong className="block text-sm text-[var(--text-main)]">{title}</strong>
        <small className="mt-1 block text-base leading-5 text-[var(--text-sub)]">
          {subtitle}
        </small>
      </span>
      <ArrowUpRight className="ml-auto size-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
    </Link>
  )
}

// Search keyword strings — mirrors the mockup's per-area haystacks
const QUICK_ACTIONS = [
  {
    href: '/products',
    title: 'Product assignment',
    subtitle: 'Lines of business, products and agent assignments',
    icon: FileCheck2,
    keywords:
      'product assignment lines of business, products and agent assignments',
  },
  {
    href: '/commissions',
    title: 'Commission setup',
    subtitle: 'Configure product commission rates',
    icon: CreditCard,
    keywords: 'commission setup configure product commission rates',
  },
  {
    href: '/agents',
    title: 'Agent management',
    subtitle: 'Review applications, invitations and delivery',
    icon: Users,
    keywords: 'agent management review applications, invitations and delivery',
  },
  {
    href: '/reports',
    title: 'Analytics dashboard',
    subtitle: 'View performance and generate reports',
    icon: BarChart3,
    keywords: 'analytics dashboard view performance and generate reports',
  },
]

const OTHER_AREAS = [
  {
    href: '/payments',
    title: 'Payments',
    subtitle: 'Payment operations and payout processing',
    icon: Wallet,
    keywords: 'payments payment operations and payout processing',
  },
  {
    href: '/transactions',
    title: 'Transactions',
    subtitle: 'Completed transactions across admin and agent views',
    icon: TextSearch,
    keywords: 'transactions completed transactions across admin and agent views',
  },
]

export function DashboardClient() {
  const authFetch = useAuthFetch()
  const hasHydrated = useHasHydrated()
  const isAuthenticated = useIsAuthenticated()
  const enabled = hasHydrated && isAuthenticated
  const searchQuery = useTopBarSearchStore((s) => s.query)
  const q = searchQuery.trim().toLowerCase()
  const matches = (keywords: string) => !q || keywords.includes(q)

  const { data: stats, isLoading: statsLoading } = useQuery<AgentStatistics>({
    queryKey: ['admin-statistics'],
    queryFn: async () => {
      const res = await authFetch('/api/admin/statistics')
      if (!res.ok) throw new Error('Failed to load statistics')
      const json = await res.json()
      return (json?.data ?? json) as AgentStatistics
    },
    enabled,
  })

  const { data: activeAgents, isLoading: agentsLoading } = useQuery<number>({
    queryKey: ['admin-active-agents'],
    queryFn: async () => {
      const res = await authFetch('/api/admin/agents?status=active&per_page=1')
      if (!res.ok) throw new Error('Failed to load agents')
      const json = await res.json()
      return Number(json?.data?.total ?? 0)
    },
    enabled,
  })

  return (
    <>
      <PortalContentHeader
        title="Dashboard"
        description="Manage products, commissions, agents and platform activity from one place."
      />
      <div className="mx-auto w-full max-w-7xl">
        {/* Overview metrics */}
      <section aria-labelledby="admin-overview-title" className="mt-4">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 id="admin-overview-title" className="text-xl font-semibold tracking-tight text-[var(--text-main)]">
            Overview
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <MetricCard
            label="Total sales"
            value={formatCurrency(stats?.total_sales ?? 0)}
            icon={<PhilippinePeso className="size-5" aria-hidden="true" />}
            loading={statsLoading}
          />
          <MetricCard
            label="Gross commissions"
            value={formatCurrency(stats?.gross_commissions ?? 0)}
            icon={<Coins className="size-5" aria-hidden="true" />}
            loading={statsLoading}
          />
          <MetricCard
            label="Net commissions"
            value={formatCurrency(stats?.net_commissions ?? 0)}
            icon={<Banknote className="size-5" aria-hidden="true" />}
            loading={statsLoading}
          />
          <MetricCard
            label="Active agents"
            value={String(activeAgents ?? 0)}
            icon={<UserCheck className="size-5" aria-hidden="true" />}
            loading={agentsLoading}
          />
        </div>
      </section>

      {/* Quick actions */}
      <section aria-labelledby="admin-actions-title" className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 id="admin-actions-title" className="text-xl font-semibold tracking-tight text-[var(--text-main)]">
            Quick actions
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4">
          {QUICK_ACTIONS.filter((a) => matches(a.keywords)).map(
            ({ href, title, subtitle, icon: Icon }) => (
              <ActionCard
                key={href}
                href={href}
                title={title}
                subtitle={subtitle}
                icon={<Icon className="size-5" aria-hidden="true" />}
              />
            )
          )}
        </div>
      </section>

      {/* Other admin areas */}
      <section
        aria-labelledby="admin-more-title"
        className="mt-5 min-w-0 rounded-lg border border-[#dfe7df] bg-white p-5 dark:border-[#3d4140] dark:bg-[#171919] sm:p-6"
      >
        <h2 id="admin-more-title" className="text-xl font-semibold tracking-tight text-[var(--text-main)]">
          Other admin areas
        </h2>
        <p className="mt-1 text-sm text-[var(--text-sub)]">
          Additional workspace sections.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {OTHER_AREAS.filter((a) => matches(a.keywords)).map(
            ({ href, title, subtitle, icon: Icon }) => (
              <AreaRow
                key={href}
                href={href}
                title={title}
                subtitle={subtitle}
                icon={<Icon className="size-5" aria-hidden="true" />}
              />
            )
          )}
        </div>
      </section>
    </div>
    </>
  )
}
