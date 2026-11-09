'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Banknote,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  CreditCard,
  Eye,
  FileText,
  Landmark,
  Loader2,
  Mail,
  Phone,
  TrendingUp,
  User,
  Wallet,
} from 'lucide-react'
import { PortalContentHeader } from '@/components/layout/portal-content-header'
import { Modal } from '@/components/ui/modal'
import { StatusPill } from '@/components/ui/status-pill'
import { CardSkeleton, Skeleton } from '@/components/ui/skeleton'
import { useAuthFetch } from '@/hooks/use-auth-fetch'
import { useAuthenticatedImage } from '@/hooks/use-authenticated-image'
import { useHasHydrated, useIsAuthenticated } from '@/store/admin-auth-store'
import { btnOutlineGreenCls, sectionTitleCls } from '@/lib/ui-classes'
import {
  cn,
  formatCurrency,
  formatPersonName,
  formatPhone,
} from '@/lib/utils'
import type { Agent, AgentDocument } from '@/types/admin/people'

function agentDisplayName(agent?: Agent | null): string {
  if (!agent) return 'Agent'
  return (
    formatPersonName(
      agent.name ??
        [agent.first_name, agent.middle_name, agent.last_name]
          .filter(Boolean)
          .join(' ')
    ) || 'Agent'
  )
}

function initials(name: string): string {
  return (
    name
      .split(' ')
      .map((w) => w.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'A'
  )
}

function formatDate(value?: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!value) return 'N/A'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    ...opts,
  })
}

/**
 * Document slots — mirrors the verification checklist agents see under
 * Settings → Verification documents in the agent portal.
 */
type RequiredDoc = {
  type: string
  tag: string
  description: string
  required: boolean
}

const REQUIRED_DOCUMENTS: RequiredDoc[] = [
  {
    type: 'Valid government ID',
    tag: 'valid_id',
    description: 'Government-issued photo ID or passport',
    required: true,
  },
  {
    type: 'Insurance qualification — Tier 1',
    tag: 'insurance_qual_1',
    description: 'Training or professional proficiency certificate',
    required: true,
  },
  {
    type: 'Insurance qualification — Tier 2',
    tag: 'insurance_qual_2',
    description: 'Additional qualification certificate',
    required: true,
  },
  {
    type: 'Insurance qualification — Tier 3',
    tag: 'insurance_qual_3',
    description: 'Advanced specialization certificate',
    required: true,
  },
  {
    type: 'Agent license or registration',
    tag: 'agent_license',
    description:
      'Required for licensed agents. Current authority-issued proof.',
    required: false,
  },
]

const DOCUMENT_TAG_LABELS: Record<string, string> = {
  profile_photo: 'Profile photo',
  valid_id: 'Valid government ID',
  insurance_qual_1: 'Insurance qualification — Tier 1',
  insurance_qual_2: 'Insurance qualification — Tier 2',
  insurance_qual_3: 'Insurance qualification — Tier 3',
  agent_license: 'Agent license / registration',
}

/** Progress bar widths for 0–5 uploaded slots (avoids inline styles). */
const PROGRESS_WIDTHS = [
  'w-0',
  'w-1/5',
  'w-2/5',
  'w-3/5',
  'w-4/5',
  'w-full',
] as const

function RequiredTag({ required }: { required: boolean }) {
  return required ? (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-[#e2eddb] text-[#006838] dark:bg-[#1a2e1f] dark:text-[#d0e3c8]">
      Required
    </span>
  ) : (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-[var(--subtle)] text-[var(--text-muted)]">
      Optional
    </span>
  )
}

function DocStatusPill({ status }: { status?: string | null }) {
  if (status === 'approved')
    return (
      <span className="badge-success">
        <CheckCircle2 className="size-3" aria-hidden="true" /> Approved
      </span>
    )
  if (status === 'pending')
    return <span className="badge-pending">Pending review</span>
  if (status === 'rejected')
    return <span className="badge-rejected">Rejected</span>
  return null
}

function documentTagLabel(tag?: string | null): string {
  if (!tag || tag === 'document') return 'Document'
  return (
    DOCUMENT_TAG_LABELS[tag] ??
    tag.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

/**
 * Rewrites a stored profile photo URL for use in this portal.
 *
 * Agents upload photos via the agent portal, which persists a proxy path of
 * the form `/api/agent/files/{id}/serve` on the profile. That route only
 * exists on the agent app — here we swap it for the admin equivalent.
 * Non-proxy URLs (e.g. an external avatar) are returned unchanged.
 */
function toAdminFileServeUrl(url?: string | null): string | null {
  if (!url) return null
  const match = url.match(/\/api\/agent\/files\/([^/]+)\/serve/)
  if (match) return `/api/admin/files/${match[1]}/serve`
  return url
}

type AgentStatistics = {
  total_sales?: number | string | null
  number_of_sales?: number | null
  gross_commissions?: number | string | null
  net_commissions?: number | string | null
}

const cardCls =
  'rounded-lg border border-[#dfe7df] bg-white p-5 dark:border-[#3d4140] dark:bg-[#171919] sm:p-6'
const mutedTextCls = 'text-[#45564b] dark:text-[#b2b7b4]'
const labelCls = `mb-1 block text-xs font-medium ${mutedTextCls}`
const valueCls = 'font-medium text-[var(--text-main)]'
const iconBoxCls =
  'flex size-9 shrink-0 items-center justify-center rounded-md bg-[#eff6ef] text-[#006838] dark:bg-[#2b352d] dark:text-[#9fd4ae]'
const actionBtnCls =
  'flex size-9 items-center justify-center rounded-md border border-[#dfe7df] text-[#45564b] transition-colors hover:border-[#006838] hover:text-[#006838] dark:border-[#3d4140] dark:text-[#b2b7b4] dark:hover:text-[#9fd4ae]'
const linkValueCls =
  'font-medium text-[#006838] underline-offset-2 hover:underline dark:text-[#9fd4ae]'

export function AgentProfileClient({ agentId }: { agentId: number }) {
  const authFetch = useAuthFetch()
  const hasHydrated = useHasHydrated()
  const isAuthenticated = useIsAuthenticated()
  const enabled = hasHydrated && isAuthenticated && !!agentId

  const {
    data: agent,
    isLoading,
    isError,
  } = useQuery<Agent>({
    queryKey: ['admin-agent-detail', agentId],
    queryFn: async () => {
      const res = await authFetch(`/api/admin/agents/${agentId}`)
      if (!res.ok) throw new Error('Failed to load agent')
      const json = await res.json()
      return (json?.data ?? json) as Agent
    },
    enabled,
  })

  const {
    data: documents,
    isLoading: docsLoading,
    isError: docsError,
    refetch: refetchDocs,
  } = useQuery<AgentDocument[]>({
    queryKey: ['admin-agent-documents', agentId],
    queryFn: async () => {
      const res = await authFetch(`/api/admin/agents/${agentId}/documents`)
      if (!res.ok) throw new Error('Failed to load documents')
      const json = await res.json()
      const raw = Array.isArray(json?.data) ? json.data : json?.data?.data
      return (Array.isArray(raw) ? raw : []) as AgentDocument[]
    },
    enabled,
  })

  const { data: statistics } = useQuery<AgentStatistics | null>({
    queryKey: ['admin-agent-statistics', agentId],
    queryFn: async () => {
      const res = await authFetch(`/api/admin/statistics?agent_id=${agentId}`)
      if (res.status === 422) return null
      if (!res.ok) throw new Error('Failed to load agent statistics')
      const json = await res.json()
      return (json?.data ?? json) as AgentStatistics
    },
    enabled,
    retry: false,
  })

  const [copied, setCopied] = useState(false)
  const [viewing, setViewing] = useState<AgentDocument | null>(null)

  const name = agent ? agentDisplayName(agent) : `Agent #${agentId}`
  const code = (agent?.settings?.code ?? agent?.agent_code ?? '').toUpperCase()
  const bankDetails = agent?.bank_details ?? []
  const eWallets = agent?.ewallets ?? []
  const telHref = agent?.phone ? `tel:${agent.phone.replace(/[^\d+]/g, '')}` : null

  // Profile photos live on Google Drive behind an authenticated proxy. The
  // stored URL points at the agent app's serve route — rewrite it to ours.
  // Fall back to the profile_photo-tagged file in the documents list.
  const photoDoc = documents?.find((d) => d.tag === 'profile_photo')
  const photoServeUrl =
    toAdminFileServeUrl(agent?.profile_photo_url ?? agent?.avatar) ??
    (photoDoc ? `/api/admin/files/${photoDoc.id}/serve` : null)
  const photoUrl = useAuthenticatedImage(photoServeUrl)

  // Documents — same slot/checklist model the agent portal uses.
  const docs = documents ?? []
  const uploadedCount = REQUIRED_DOCUMENTS.filter((rd) =>
    docs.some((d) => d.tag?.toLowerCase() === rd.tag)
  ).length
  const requiredTags = REQUIRED_DOCUMENTS.filter((d) => d.required).map(
    (d) => d.tag
  )
  const uploadedRequired = docs.filter((d) =>
    requiredTags.includes(d.tag?.toLowerCase() ?? '')
  )
  const approvedRequired = uploadedRequired.filter(
    (d) => d.status === 'approved'
  )
  const overallStatus =
    approvedRequired.length === requiredTags.length
      ? { label: 'Verified', className: 'badge-success' }
      : uploadedRequired.length > 0
        ? { label: 'In review', className: 'badge-pending' }
        : {
            label: 'Incomplete',
            className:
              'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold bg-[var(--subtle)] text-[var(--text-muted)]',
          }
  const copyCode = async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success('Agent code copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy the agent code')
    }
  }

  return (
    <>
      <PortalContentHeader
        title="Agent profile"
        breadcrumbs={[
          { label: 'Agents', href: '/agents' },
          { label: name },
        ]}
      />
      <div className="mx-auto w-full max-w-7xl space-y-5">
        {isLoading ? (
          <>
            <section
              className={cardCls}
              aria-busy="true"
              aria-label="Loading agent profile"
            >
              <div className="flex flex-wrap items-center gap-4">
                <Skeleton className="size-16 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64 max-w-full" />
                </div>
                <Skeleton className="h-11 w-28 rounded-md" />
              </div>
              <div className="mt-6 grid gap-4 border-t border-[#dfe7df] pt-5 dark:border-[#3d4140] sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            </section>
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : isError || !agent ? (
          <section className={cardCls}>
            <p className="py-8 text-center text-[#b91c1c]">
              Failed to load agent profile. Please try again.
            </p>
          </section>
        ) : (
          <>
            {/* Overview */}
            <section className={cardCls}>
              <div className="flex flex-wrap items-center gap-4">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrl}
                    alt={name}
                    className="size-16 rounded-full border-2 border-[#dfe7df] object-cover dark:border-[#3d4140]"
                  />
                ) : (
                  <span className="flex size-16 items-center justify-center rounded-full border-2 border-[#dfe7df] bg-[#eff6ef] text-xl font-bold text-[#006838] dark:border-[#3d4140] dark:bg-[#2b352d] dark:text-[#9fd4ae]">
                    {initials(name)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-bold text-[var(--text-main)] sm:text-xl">
                      {name}
                    </h2>
                    <StatusPill status={agent.status} />
                  </div>
                  <p className={cn('mt-1 text-sm', mutedTextCls)}>
                    {agent.address ? `${agent.address} · ` : ''}Member since{' '}
                    {agent.created_at
                      ? new Date(agent.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'N/A'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/agents/${agentId}/cases`}
                    className={btnOutlineGreenCls}
                  >
                    <Briefcase className="size-4" aria-hidden="true" />
                    View cases
                  </Link>
                  {agent.email ? (
                    <a
                      href={`mailto:${agent.email}`}
                      className={actionBtnCls}
                      title={`Email ${agent.email}`}
                      aria-label={`Email ${name}`}
                    >
                      <Mail className="size-4" aria-hidden="true" />
                    </a>
                  ) : null}
                  {telHref ? (
                    <a
                      href={telHref}
                      className={actionBtnCls}
                      title={`Call ${formatPhone(agent.phone)}`}
                      aria-label={`Call ${name}`}
                    >
                      <Phone className="size-4" aria-hidden="true" />
                    </a>
                  ) : null}
                  {code ? (
                    <button
                      type="button"
                      onClick={copyCode}
                      className={actionBtnCls}
                      title="Copy agent code"
                      aria-label="Copy agent code"
                    >
                      {copied ? (
                        <Check
                          className="size-4 text-[#006838]"
                          aria-hidden="true"
                        />
                      ) : (
                        <Copy className="size-4" aria-hidden="true" />
                      )}
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: 'Total sales',
                    value: formatCurrency(statistics?.total_sales),
                    icon: <Banknote className="size-4" aria-hidden="true" />,
                  },
                  {
                    label: 'Cases',
                    value: String(statistics?.number_of_sales ?? 0),
                    icon: <Briefcase className="size-4" aria-hidden="true" />,
                    href: `/agents/${agentId}/cases`,
                  },
                  {
                    label: 'Gross commissions',
                    value: formatCurrency(statistics?.gross_commissions),
                    icon: <TrendingUp className="size-4" aria-hidden="true" />,
                  },
                  {
                    label: 'Net commissions',
                    value: formatCurrency(statistics?.net_commissions),
                    icon: <Wallet className="size-4" aria-hidden="true" />,
                  },
                ].map((stat) => {
                  const inner = (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={cn('text-xs font-medium', mutedTextCls)}>
                          {stat.label}
                        </h4>
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#eff6ef] text-[#006838] dark:bg-[#38483b] dark:text-[#d0e3c8]">
                          {stat.icon}
                        </span>
                      </div>
                      <p className="mt-2 flex items-center justify-between gap-2 text-xl font-semibold tracking-tight text-[var(--text-main)]">
                        {stat.value}
                        {stat.href ? (
                          <ChevronRight
                            className="size-4 text-[#006838] transition-transform group-hover:translate-x-0.5 dark:text-[#9fd4ae]"
                            aria-hidden="true"
                          />
                        ) : null}
                      </p>
                    </>
                  )
                  const statCls =
                    'group min-w-0 rounded-md border border-[#dfe7df] bg-[#fbfcfa] p-3 dark:border-[#3d4140] dark:bg-[#202422]'
                  return stat.href ? (
                    <Link
                      key={stat.label}
                      href={stat.href}
                      className={cn(
                        statCls,
                        'transition-colors hover:border-[#006838] focus-visible:outline-2 focus-visible:outline-[#006838]'
                      )}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <article key={stat.label} className={statCls}>
                      {inner}
                    </article>
                  )
                })}
              </div>
            </section>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="space-y-5">
                {/* Profile information */}
                <section className={cardCls}>
                  <h3 className={sectionTitleCls}>
                    <span className="flex items-center gap-2">
                      <span className={iconBoxCls}>
                        <User className="size-4" aria-hidden="true" />
                      </span>
                      Profile information
                    </span>
                  </h3>
                  <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-5 text-sm sm:grid-cols-2">
                    <div>
                      <dt className={labelCls}>Full name</dt>
                      <dd className={valueCls}>{name}</dd>
                    </div>
                    <div>
                      <dt className={labelCls}>Email</dt>
                      <dd className="break-all">
                        {agent.email ? (
                          <a
                            href={`mailto:${agent.email}`}
                            className={linkValueCls}
                          >
                            {agent.email}
                          </a>
                        ) : (
                          <span className={valueCls}>N/A</span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className={labelCls}>Phone</dt>
                      <dd>
                        {telHref ? (
                          <a href={telHref} className={linkValueCls}>
                            {formatPhone(agent.phone)}
                          </a>
                        ) : (
                          <span className={valueCls}>N/A</span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className={labelCls}>Agent code</dt>
                      <dd className="flex items-center gap-1.5">
                        <span className={`${valueCls} font-mono`}>
                          {code || 'N/A'}
                        </span>
                        {code ? (
                          <button
                            type="button"
                            onClick={copyCode}
                            className="flex size-6 items-center justify-center rounded-md text-[#45564b] transition-colors hover:bg-[#eff6ef] hover:text-[#006838] dark:text-[#b2b7b4] dark:hover:bg-[#2b352d] dark:hover:text-[#9fd4ae]"
                            title="Copy agent code"
                            aria-label="Copy agent code"
                          >
                            {copied ? (
                              <Check
                                className="size-3.5 text-[#006838]"
                                aria-hidden="true"
                              />
                            ) : (
                              <Copy className="size-3.5" aria-hidden="true" />
                            )}
                          </button>
                        ) : null}
                      </dd>
                    </div>
                  </dl>
                </section>

                {/* Payment details */}
                <section className={cardCls}>
                  <h3 className={sectionTitleCls}>
                    <span className="flex items-center gap-2">
                      <span className={iconBoxCls}>
                        <CreditCard className="size-4" aria-hidden="true" />
                      </span>
                      Payment details
                    </span>
                  </h3>
                  {bankDetails.length === 0 && eWallets.length === 0 ? (
                    <p className="mt-4 text-sm text-[#45564b] dark:text-[#b2b7b4]">
                      No payment accounts on record.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {bankDetails.map((bank, i) => (
                        <div
                          key={`bank-${i}`}
                          className="rounded-md border border-[#dfe7df] p-3 dark:border-[#3d4140]"
                        >
                          <div className="flex items-center justify-between">
                            <p className={`${valueCls} flex items-center gap-2`}>
                              <Landmark
                                className="size-4 text-[#006838]"
                                aria-hidden="true"
                              />
                              {String(bank.bank_name ?? `Bank account ${i + 1}`)}
                            </p>
                            {bank.is_primary ? (
                              <span className="rounded-full bg-[#e6f2e8] px-2 py-0.5 text-xs font-semibold text-[#006838] dark:bg-[#2b3f30] dark:text-[#9fd4ae]">
                                Primary
                              </span>
                            ) : null}
                          </div>
                          <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <dt className={labelCls}>Account name</dt>
                              <dd className={valueCls}>
                                {String(bank.account_name ?? 'N/A')}
                              </dd>
                            </div>
                            <div>
                              <dt className={labelCls}>Account number</dt>
                              <dd className={valueCls}>
                                {String(bank.account_number ?? 'N/A')}
                              </dd>
                            </div>
                            {bank.branch ? (
                              <div>
                                <dt className={labelCls}>Branch</dt>
                                <dd className={valueCls}>
                                  {String(bank.branch)}
                                </dd>
                              </div>
                            ) : null}
                            {bank.swift_code ? (
                              <div>
                                <dt className={labelCls}>Swift code</dt>
                                <dd className={valueCls}>
                                  {String(bank.swift_code)}
                                </dd>
                              </div>
                            ) : null}
                          </dl>
                        </div>
                      ))}
                      {eWallets.map((wallet, i) => (
                        <div
                          key={`wallet-${i}`}
                          className="rounded-md border border-[#dfe7df] p-3 dark:border-[#3d4140]"
                        >
                          <div className="flex items-center justify-between">
                            <p className={`${valueCls} flex items-center gap-2`}>
                              <Wallet
                                className="size-4 text-[#006838]"
                                aria-hidden="true"
                              />
                              {String(wallet.provider ?? `E-wallet ${i + 1}`)}
                            </p>
                            {wallet.is_primary ? (
                              <span className="rounded-full bg-[#e6f2e8] px-2 py-0.5 text-xs font-semibold text-[#006838] dark:bg-[#2b3f30] dark:text-[#9fd4ae]">
                                Primary
                              </span>
                            ) : null}
                          </div>
                          <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <dt className={labelCls}>Account name</dt>
                              <dd className={valueCls}>
                                {String(wallet.account_name ?? 'N/A')}
                              </dd>
                            </div>
                            <div>
                              <dt className={labelCls}>Account number</dt>
                              <dd className={valueCls}>
                                {String(wallet.account_number ?? 'N/A')}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              {/* Documents — same checklist presentation as the agent portal */}
              <section className={cardCls}>
                <h3 className={sectionTitleCls}>
                  <span className="flex items-center gap-2">
                    <span className={iconBoxCls}>
                      <FileText className="size-4" aria-hidden="true" />
                    </span>
                    Verification documents
                  </span>
                </h3>
                <p className="mt-1 text-sm text-[#45564b] dark:text-[#b2b7b4]">
                  Documents uploaded by the agent for account verification.
                </p>

                {/* Summary row */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-md bg-[var(--subtle)] p-4">
                  <div className="flex items-center gap-4">
                    <p className="text-sm font-semibold text-[var(--text-main)]">
                      {uploadedCount} of {REQUIRED_DOCUMENTS.length} uploaded
                    </p>
                    <div className="h-1.5 w-32 overflow-hidden rounded-full bg-[var(--border)]">
                      <div
                        className={cn(
                          'h-full rounded-full bg-[#006838] transition-[width] duration-300',
                          PROGRESS_WIDTHS[uploadedCount]
                        )}
                      />
                    </div>
                  </div>
                  <span className={overallStatus.className}>
                    {overallStatus.label}
                  </span>
                </div>

                {docsError ? (
                  <div className="mt-6 flex flex-col items-center gap-3 rounded-md border border-[var(--border)] py-12 text-center">
                    <p className="text-sm text-[var(--text-sub)]">
                      Failed to load documents.
                    </p>
                    <button
                      type="button"
                      onClick={() => refetchDocs()}
                      className="text-sm font-semibold text-[#006838] hover:underline focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8]"
                    >
                      Try again
                    </button>
                  </div>
                ) : docsLoading ? (
                  <div className="mt-6 space-y-4" aria-busy="true">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="skeleton h-20 rounded" />
                    ))}
                  </div>
                ) : (
                  <div
                    className="mt-6 divide-y divide-[var(--border)] border-y border-[var(--border)]"
                    aria-live="polite"
                  >
                    {REQUIRED_DOCUMENTS.map((reqDoc) => {
                      const uploaded = docs.find(
                        (d) => d.tag?.toLowerCase() === reqDoc.tag
                      )
                      return (
                        <DocumentSlotRow
                          key={reqDoc.tag}
                          doc={reqDoc}
                          uploaded={uploaded}
                          onView={() => uploaded && setViewing(uploaded)}
                        />
                      )
                    })}
                  </div>
                )}

              </section>
            </div>
          </>
        )}
      </div>
      <FileViewerModal
        file={viewing}
        onClose={() => setViewing(null)}
        authFetch={authFetch}
      />
    </>
  )
}

/**
 * A verification checklist row — mirrors DocumentRow in the agent portal's
 * settings page, minus the upload/remove actions (admins review, not edit).
 */
function DocumentSlotRow({
  doc,
  uploaded,
  onView,
}: {
  doc: RequiredDoc
  uploaded: AgentDocument | undefined
  onView: () => void
}) {
  return (
    <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-[var(--text-main)]">{doc.type}</h4>
          <RequiredTag required={doc.required} />
        </div>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {doc.description}
        </p>
        {uploaded ? (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="text-sm text-[var(--text-sub)]">
              Uploaded
              {uploaded.created_at
                ? ` ${formatDate(uploaded.created_at, { month: 'short' })}`
                : ''}
            </p>
            <DocStatusPill status={uploaded.status} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-[var(--text-muted)]">No file added</p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 sm:flex-nowrap">
        {uploaded?.id != null && (
          <button
            type="button"
            onClick={onView}
            className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-[var(--field-border)] px-4 text-sm font-semibold text-[#006838] focus-visible:outline-2 focus-visible:outline-[#006838] sm:w-auto dark:text-[#d0e3c8]"
          >
            <Eye className="mr-1.5 size-4" aria-hidden="true" />
            View
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Document preview modal. Google Drive files require an Authorization header
 * that plain links/<img> tags can't send, so the bytes are fetched through the
 * /api/admin/files/[id]/serve proxy and rendered from a local blob URL.
 */
function FileViewerModal({
  file,
  onClose,
  authFetch,
}: {
  file: AgentDocument | null
  onClose: () => void
  authFetch: ReturnType<typeof useAuthFetch>
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!file) return
    let cancelled = false
    setLoading(true)
    setError(null)
    setBlobUrl(null)

    authFetch(`/api/admin/files/${file.id}/serve`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Could not load file (${res.status})`)
        const blob = await res.blob()
        if (!cancelled) {
          setMimeType(
            blob.type || file.mime_type || 'application/octet-stream'
          )
          setBlobUrl(URL.createObjectURL(blob))
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Failed to load file')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [file, authFetch])

  function handleClose() {
    if (blobUrl) URL.revokeObjectURL(blobUrl)
    setBlobUrl(null)
    setMimeType('')
    setError(null)
    onClose()
  }

  const isImage = mimeType.startsWith('image/')
  const isPdf = mimeType === 'application/pdf'
  const title = file ? documentTagLabel(file.tag) : 'Document'

  return (
    <Modal
      open={file !== null}
      onClose={handleClose}
      title={title}
      description="Document preview"
      className="sm:max-w-2xl lg:max-w-4xl"
    >
      <div className="min-h-48 overflow-auto">
        {loading && (
          <div className="flex h-48 items-center justify-center">
            <Loader2
              className="size-7 animate-spin text-[#006838]"
              aria-hidden="true"
            />
          </div>
        )}
        {error && (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm text-[#b91c1c]">{error}</p>
            <p className="text-xs text-[#45564b] dark:text-[#b2b7b4]">
              Check your connection and try again.
            </p>
          </div>
        )}
        {blobUrl && isImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={blobUrl}
            alt={title}
            className="mx-auto max-h-[75vh] max-w-full rounded object-contain"
          />
        )}
        {blobUrl && isPdf && (
          <iframe
            src={blobUrl}
            title={title}
            className="h-[75vh] w-full rounded border-0"
          />
        )}
        {blobUrl && !isImage && !isPdf && (
          <div className="flex h-48 flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-[#45564b] dark:text-[#b2b7b4]">
              This file type cannot be previewed in the browser.
            </p>
            <a
              href={blobUrl}
              download
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#006838] px-4 text-sm font-semibold text-white hover:bg-[#00552e]"
            >
              Download file
            </a>
          </div>
        )}
      </div>
    </Modal>
  )
}
