'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Check, Eye, GitCompare, Loader2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { ActionIcon } from '@/components/ui/action-icon'
import { Modal, ConfirmDialog } from '@/components/ui/modal'
import { StatusPill } from '@/components/ui/status-pill'
import { CardSkeleton, Skeleton } from '@/components/ui/skeleton'
import { useAuthFetch } from '@/hooks/use-auth-fetch'
import { useAuthenticatedImage } from '@/hooks/use-authenticated-image'
import { useHasHydrated, useIsAuthenticated } from '@/store/admin-auth-store'
import { btnDangerCls, btnOutlineGreenCls, btnPrimaryCls, btnSecondaryCls, fieldCls } from '@/lib/ui-classes'
import { cn, formatPersonName, formatPhone, getInitials } from '@/lib/utils'
import type { Agent, AgentDocument } from '@/types/admin/people'

const panelCls =
  'min-w-0 rounded-lg border border-[#dfe7df] bg-white p-5 dark:border-[#3d4140] dark:bg-[#171919] sm:p-6'
const panelTitleCls =
  'text-xl font-semibold tracking-tight text-[var(--text-main)]'
const subTextCls = 'text-base text-[var(--text-sub)]'
const fieldLabelCls = 'block text-base text-[var(--text-sub)]'
const fieldValueCls =
  'mt-1 block break-words text-sm font-semibold text-[var(--text-main)]'

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

function agentCode(agent?: Agent | null): string {
  return (agent?.settings?.code ?? agent?.agent_code ?? '').toUpperCase()
}

function agentType(agent?: Agent | null): string {
  if (!agent) return 'Agent'
  if (agent.designation) return formatPersonName(agent.designation)
  if (typeof agent.role === 'string' && agent.role.trim()) {
    return formatPersonName(agent.role)
  }
  return 'Agent'
}

/** Format an ISO date as e.g. "10 Oct 2026" (matches the profile mockup). */
function formatRegistrationDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Format a reviewed-at timestamp as e.g. "13 Nov 2026, 02:00". */
function formatReviewDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatStatus(value?: string | null): string {
  if (!value) return '—'
  return formatPersonName(value)
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
    type: 'Valid ID',
    tag: 'valid_id',
    description: 'Government-issued photo ID or passport.',
    required: true,
  },
  {
    type: 'Insurance qualification 1',
    tag: 'insurance_qual_1',
    description: 'Training or professional proficiency certificate.',
    required: true,
  },
  {
    type: 'Insurance qualification 2',
    tag: 'insurance_qual_2',
    description: 'Additional qualification certificate.',
    required: true,
  },
  {
    type: 'Insurance qualification 3',
    tag: 'insurance_qual_3',
    description: 'Advanced specialization certificate.',
    required: true,
  },
  {
    type: 'Agent license or registration',
    tag: 'agent_license',
    description: 'Authority-issued agent licence or registration.',
    required: false,
  },
]

const DOCUMENT_TAG_LABELS: Record<string, string> = {
  profile_photo: 'Profile photo',
  valid_id: 'Valid ID',
  insurance_qual_1: 'Insurance qualification 1',
  insurance_qual_2: 'Insurance qualification 2',
  insurance_qual_3: 'Insurance qualification 3',
  agent_license: 'Agent license / registration',
}

function documentTagLabel(tag?: string | null): string {
  if (!tag || tag === 'document') return 'Document'
  return (
    DOCUMENT_TAG_LABELS[tag] ??
    tag.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

function documentFileName(file: AgentDocument): string {
  for (const name of [file.original_name, file.file_name]) {
    if (name && !name.includes('__')) return name
  }
  return 'Uploaded document'
}

type ReviewStatus = 'pending' | 'approved' | 'rejected'

function reviewStatusOf(file?: AgentDocument | null): ReviewStatus {
  const raw = String(
    file?.review_status ?? file?.status ?? 'pending'
  ).toLowerCase()
  if (raw === 'approved' || raw === 'rejected') return raw
  return 'pending'
}

/**
 * Newest upload first. A re-upload for the same tag creates a newer file that
 * restarts review as pending, so the first entry is the current document and
 * the rest are its history.
 */
function filesForTag(documents: AgentDocument[], tag: string): AgentDocument[] {
  return documents
    .filter((doc) => doc.tag?.toLowerCase() === tag.toLowerCase())
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
}

/**
 * Rewrites a backend profile photo URL to an admin proxy route.
 *
 * The dedicated endpoint is "/api/v1/agents/{agentId}/profile-photo" (with an
 * optional ?v= cache-busting query); the agent's own route is
 * "/api/v1/agents/profile-photo". Older records may still point at the agent
 * app's file proxy ("/api/agent/files/{id}/serve"). Both are swapped for the
 * matching admin route so the admin token is sent. Already-local and external
 * URLs are returned unchanged.
 */
function toAdminProfilePhotoUrl(
  url: string | null | undefined,
  agentId: number | string | undefined
): string | null {
  if (!url) return null
  if (url.startsWith('/api/admin/')) return url

  if (url.includes('/profile-photo') && agentId) {
    const qs = url.includes('?') ? url.slice(url.indexOf('?')) : ''
    return `/api/admin/agents/${agentId}/profile-photo${qs}`
  }

  // Legacy: the agent app served the tagged profile_photo file directly.
  const fileServe = url.match(/\/api\/(?:agent\/|v1\/)?files\/([^/]+)\/serve/)
  if (fileServe) return `/api/admin/files/${fileServe[1]}/serve`

  return url
}

/**
 * Resolve the agent's photo to an admin proxy URL.
 *
 * GET /admin/agents/{id} may return the structured `profile_photo` object, the
 * legacy flat `profile_photo_url`, or neither. When none of the hints are
 * present we still try the dedicated admin photo endpoint, keyed by agent id;
 * a 404 simply means the agent has no photo and the initials fallback shows.
 */
function resolveAgentPhotoUrl(agent?: Agent | null): string | null {
  if (!agent?.id) return null

  const raw =
    agent.profile_photo?.url ?? agent.profile_photo_url ?? agent.avatar ?? null
  if (raw) return toAdminProfilePhotoUrl(raw, agent.id)

  // Newer backends explicitly send null when there is no photo; don't probe
  // the endpoint in that case. An absent field means we should still try.
  if (agent.profile_photo === null) return null

  return `/api/admin/agents/${agent.id}/profile-photo`
}

type PaymentAccount = {
  provider: string
  kind: 'Bank' | 'E-wallet'
  accountName: string
  accountNumber: string
  isPrimary: boolean
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : String(value ?? '').trim()
}

function maskAccountNumber(value: unknown): string {
  const raw = text(value)
  if (!raw) return '—'
  if (raw.includes('•') || raw.includes('*')) return raw
  const compact = raw.replace(/\s+/g, '')
  if (compact.length <= 4) return compact
  return `•••• ${compact.slice(-4)}`
}

function paymentAccounts(agent?: Agent | null): PaymentAccount[] {
  if (!agent) return []

  const banks: PaymentAccount[] = (agent.bank_details ?? []).map((bank) => ({
    provider: text(bank.bank_name) || 'Bank account',
    kind: 'Bank',
    accountName: text(bank.account_name) || '—',
    accountNumber: maskAccountNumber(
      bank.account_number_masked ?? bank.account_number
    ),
    isPrimary: Boolean(bank.is_primary),
  }))

  const wallets: PaymentAccount[] = (agent.ewallets ?? []).map((wallet) => ({
    provider: text(wallet.provider) || 'E-wallet',
    kind: 'E-wallet',
    accountName: text(wallet.account_name) || '—',
    accountNumber: maskAccountNumber(
      wallet.account_number_masked ?? wallet.account_number
    ),
    isPrimary: Boolean(wallet.is_primary),
  }))

  return [...banks, ...wallets]
}

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

  const [viewing, setViewing] = useState<AgentDocument | null>(null)
  const [comparing, setComparing] = useState<AgentDocument | null>(null)

  // Document review (approve/reject) state — per backend hand-off
  // fe-handoff-agent-document-review.md
  const [rejectFile, setRejectFile] = useState<AgentDocument | null>(null)
  const [approveFile, setApproveFile] = useState<AgentDocument | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [rejectLoading, setRejectLoading] = useState(false)
  const [approveLoading, setApproveLoading] = useState(false)
  const [rejectNoteError, setRejectNoteError] = useState<string | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)

  const openReject = (file: AgentDocument) => {
    setRejectFile(file)
    setRejectNote('')
    setRejectNoteError(null)
    setReviewError(null)
  }

  const openApprove = (file: AgentDocument) => {
    setApproveFile(file)
    setReviewError(null)
  }

  const changeRejectNote = (value: string) => {
    setRejectNote(value)
    setRejectNoteError(null)
    setReviewError(null)
  }

  const handleReject = async () => {
    if (!rejectFile) return
    if (!rejectNote.trim()) {
      setRejectNoteError('A reason is required to reject a document.')
      return
    }
    setReviewError(null)
    setRejectNoteError(null)
    setRejectLoading(true)
    try {
      const res = await authFetch(
        `/api/admin/agents/${agentId}/documents/${rejectFile.id}/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note: rejectNote.trim() }),
        }
      )
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string
          errors?: Record<string, { message?: string }>
        }
        if (res.status === 422 && body?.errors?.note) {
          setRejectNoteError(Array.isArray(body.errors.note)
            ? String(body.errors.note[0])
            : String(body.errors.note.message ?? body.errors.note))
          setRejectLoading(false)
          return
        }
        if (res.status === 422) {
          throw new Error(body?.message || 'This file was replaced by a newer upload. Review the new one.')
        }
        if (res.status === 404) throw new Error('This document was replaced — reload the page.')
        if (res.status === 403) throw new Error('You are not allowed to review documents.')
        throw new Error(body?.message || `Failed to reject (${res.status})`)
      }
      setRejectFile(null)
      setRejectNote('')
      refetchDocs()
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Failed to reject document')
    } finally {
      setRejectLoading(false)
    }
  }

  const confirmApprove = async () => {
    if (!approveFile) return
    setReviewError(null)
    setApproveLoading(true)
    try {
      const res = await authFetch(
        `/api/admin/agents/${agentId}/documents/${approveFile.id}/approve`,
        { method: 'POST' }
      )
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string
          errors?: Record<string, unknown>
        }
        if (res.status === 422) {
          throw new Error('This file was replaced by a newer upload. Review the new one.')
        }
        if (res.status === 404) throw new Error('This document was replaced — reload the page.')
        if (res.status === 403) throw new Error('You are not allowed to review documents.')
        throw new Error(body?.message || `Failed to approve (${res.status})`)
      }
      setApproveFile(null)
      refetchDocs()
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Failed to approve document')
    } finally {
      setApproveLoading(false)
    }
  }

  const name = agent ? agentDisplayName(agent) : `Agent #${agentId}`
  const code = agentCode(agent)
  const docs = documents ?? []
  const accounts = paymentAccounts(agent)

  const documentSlots = REQUIRED_DOCUMENTS.map((reqDoc) => {
    const files = filesForTag(docs, reqDoc.tag)
    return { reqDoc, files, current: files[0] }
  })
  const reviewCounts = documentSlots.reduce(
    (counts, slot) => {
      if (slot.current) counts[reviewStatusOf(slot.current)] += 1
      return counts
    },
    { pending: 0, approved: 0, rejected: 0 }
  )

  // Profile photo — read through the admin proxy so the bearer token is sent.
  const photoServeUrl = resolveAgentPhotoUrl(agent)
  const photoUrl = useAuthenticatedImage(photoServeUrl)

  const nameParts = name.split(/\s+/).filter(Boolean)
  const profileFields = agent
    ? [
        {
          label: 'First name',
          value: agent.first_name || nameParts[0] || '—',
        },
        {
          label: 'Last name',
          value: agent.last_name || nameParts.slice(1).join(' ') || '—',
        },
        { label: 'Code', value: code || '—' },
        { label: 'Type', value: agentType(agent) },
        { label: 'Email', value: agent.email || '—' },
        { label: 'Phone', value: formatPhone(agent.phone) || '—' },
        { label: 'Location', value: agent.address || '—' },
        {
          label: 'Registration date',
          value: formatRegistrationDate(agent.created_at),
        },
        { label: 'Background', value: agent.background || '—' },
        { label: 'Status', value: formatStatus(agent.status) },
      ]
    : []

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/agents?tab=agents"
            className="group mb-2 flex w-fit min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-[#006838] no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8]"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span className="underline-offset-2 group-hover:underline group-focus-visible:underline">
              Back to agents
            </span>
          </Link>
          <div className="min-w-0">
            <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-[var(--text-main)] sm:text-3xl">
              {name}
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--text-sub)] sm:text-base">
              View profile information and verification documents.
            </p>
          </div>
        </div>
        <Link href={`/agents/${agentId}/cases`} className={btnOutlineGreenCls}>
          View cases
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-5" aria-busy="true" aria-label="Loading profile">
          <section className={panelCls}>
            <Skeleton className="h-6 w-44" />
            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32 max-w-full" />
                </div>
              ))}
            </div>
          </section>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.8fr)]">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      ) : isError || !agent ? (
        <section className={panelCls}>
          <p className="py-8 text-center text-[#991b1b] dark:text-[#fca5a5]">
            Failed to load agent profile. Please try again.
          </p>
        </section>
      ) : (
        <div className="space-y-5">
          {/* Profile information */}
          <section className={panelCls} aria-labelledby="profile-info-title">
            <h2 id="profile-info-title" className="text-lg font-semibold text-[var(--text-main)]">
              Profile information
            </h2>
            <dl className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {profileFields.map((field) => (
                <div key={field.label}>
                  <dt className={fieldLabelCls}>{field.label}</dt>
                  <dd className={fieldValueCls}>{field.value}</dd>
                </div>
              ))}
              <div className="sm:col-span-2 xl:col-span-1 xl:col-start-4 xl:row-span-4 xl:row-start-1">
                <dt className="sr-only">Partner photo</dt>
                <dd className="flex h-full items-center justify-center">
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoUrl}
                      alt={name}
                      className="size-[200px] max-w-full rounded-full border border-[#dfe7df] object-cover dark:border-[#3d4140]"
                    />
                  ) : (
                    <span className="flex size-[200px] max-w-full items-center justify-center rounded-full border border-[#dfe7df] bg-[#eff6ef] text-3xl font-bold text-[#006838] dark:border-[#3d4140] dark:bg-[#38483b] dark:text-[#d0e3c8]">
                      {getInitials(name) || 'A'}
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.8fr)]">
            {/* Verification documents */}
            <section
              className={panelCls}
              aria-labelledby="verification-documents-title"
            >
              <h2
                id="verification-documents-title"
                className={panelTitleCls}
              >
                Verification documents
              </h2>
              <p className={cn('mt-1', subTextCls)}>
                View the documents submitted to verify this partner account.
              </p>

              {!docsLoading && !docsError && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusPill status={`${reviewCounts.pending} pending`} />
                  <StatusPill status={`${reviewCounts.approved} approved`} />
                  <StatusPill status={`${reviewCounts.rejected} rejected`} />
                </div>
              )}

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
                <div className="mt-6 divide-y divide-[#dfe7df] border-y border-[#dfe7df] dark:divide-[#3d4140] dark:border-[#3d4140]">
                  {documentSlots.map(({ reqDoc, current: uploaded }) => {
                    const status = reviewStatusOf(uploaded)
                    const isReplacement = Boolean(uploaded?.previous_file_id)

                    return (
                      <div
                        key={reqDoc.tag}
                        className="flex flex-wrap items-center justify-between gap-4 py-4"
                      >
                        <div className="min-w-0">
                          <h3 className="font-semibold text-[var(--text-main)]">
                            {reqDoc.type}
                          </h3>
                          <p className="mt-1 text-base text-[var(--text-sub)]">
                            {reqDoc.description}
                          </p>
                          {uploaded ? (
                            <button
                              type="button"
                              onClick={() => setViewing(uploaded)}
                              className="mt-2 break-all text-left text-base text-[#006838] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8]"
                            >
                              {documentFileName(uploaded)}
                            </button>
                          ) : (
                            <p className="mt-2 text-base text-[var(--text-muted)]">
                              No file added
                            </p>
                          )}
                          {uploaded && (
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs leading-none">
                              <StatusPill status={status} />
                              {status === 'pending' && (
                                <span
                                  className={cn(
                                    'rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                                    isReplacement
                                      ? 'border-[#b88e28]/30 text-[#b88e28] dark:text-[#e4c27f]'
                                      : 'border-[#006838]/20 text-[#006838] dark:text-[#d0e3c8]'
                                  )}
                                >
                                  {isReplacement
                                    ? 'Replacement upload'
                                    : 'New upload'}
                                </span>
                              )}
                              {status === 'rejected' && uploaded.review_note && (
                                <span className="text-xs text-[#991b1b]">
                                  {uploaded.review_note}
                                </span>
                              )}
                            </div>
                          )}
                          {isReplacement && uploaded && (
                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                              {uploaded.previous_review_status === 'rejected' && (
                                <>
                                  Replaced a rejected document
                                  {uploaded.previous_reviewed_at && ` on ${formatReviewDate(uploaded.previous_reviewed_at)}`}
                                  {uploaded.previous_review_note ? `: “${uploaded.previous_review_note}”` : ''}
                                </>
                              )}
                              {uploaded.previous_review_status === 'approved' && (
                                <>
                                  Replaced an approved document
                                  {uploaded.previous_reviewed_at && ` on ${formatReviewDate(uploaded.previous_reviewed_at)}`}
                                </>
                              )}
                              {uploaded.previous_review_status === 'pending' && (
                                <>Replaced a document that was never reviewed</>
                              )}
                              {!uploaded.previous_review_status && (
                                <>Replaced a previous upload</>
                              )}
                            </p>
                          )}
                          {uploaded && uploaded.reviewed_at && status !== 'pending' && (
                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                              Reviewed {formatReviewDate(uploaded.reviewed_at)}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-1">
                          {uploaded?.id != null && (
                            <ActionIcon
                              label={`View ${reqDoc.type} document`}
                              hint="View"
                              hintDelayMs={0}
                              onClick={() => setViewing(uploaded)}
                            >
                              <Eye aria-hidden="true" />
                            </ActionIcon>
                          )}
                          {uploaded?.previous_file_id != null && (
                            <ActionIcon
                              label={`Compare ${reqDoc.type} with replaced upload`}
                              hint="Compare"
                              hintDelayMs={0}
                              onClick={() => setComparing(uploaded)}
                            >
                              <GitCompare aria-hidden="true" />
                            </ActionIcon>
                          )}
                          {uploaded && status === 'pending' && (
                            <ActionIcon
                              label={`Approve ${reqDoc.type} document`}
                              hint="Approve"
                              hintDelayMs={0}
                              onClick={() => openApprove(uploaded)}
                            >
                              <Check aria-hidden="true" />
                            </ActionIcon>
                          )}
                          {uploaded && status === 'pending' && (
                            <ActionIcon
                              label={`Reject ${reqDoc.type} document`}
                              hint="Reject"
                              hintDelayMs={0}
                              failure
                              onClick={() => openReject(uploaded)}
                            >
                              <XCircle aria-hidden="true" />
                            </ActionIcon>
                          )}
                          {uploaded && status === 'approved' && (
                            <ActionIcon
                              label={`Reject ${reqDoc.type} document and change its approval`}
                              hint="Change decision"
                              hintDelayMs={0}
                              failure
                              onClick={() => openReject(uploaded)}
                            >
                              <XCircle aria-hidden="true" />
                            </ActionIcon>
                          )}
                          {uploaded && status === 'rejected' && (
                            <ActionIcon
                              label={`Approve ${reqDoc.type} document anyway`}
                              hint="Approve anyway"
                              hintDelayMs={0}
                              onClick={() => openApprove(uploaded)}
                            >
                              <Check aria-hidden="true" />
                            </ActionIcon>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Payment details */}
            <section className={panelCls} aria-labelledby="payment-title">
              <h2 id="payment-title" className={panelTitleCls}>
                Payment details
              </h2>
              <p className={cn('mt-1 leading-6', subTextCls)}>
                Payout methods on file for this partner.
              </p>

              {accounts.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--text-sub)]">
                  No payout methods on file.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {accounts.map((account, index) => (
                    <div
                      key={`${account.kind}-${account.provider}-${index}`}
                      className="rounded-md border border-[#dfe7df] p-4 dark:border-[#3d4140]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <strong className="text-base text-[var(--text-main)]">
                          {account.provider}
                        </strong>
                        {account.isPrimary ? (
                          <span className="text-xs font-semibold text-[#006838] dark:text-[#d0e3c8]">
                            Primary
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-base text-[var(--text-sub)]">
                        {account.kind}
                      </p>
                      <p className="mt-2 text-base text-[var(--text-main)]">
                        {account.accountName}
                      </p>
                      <p className="mt-1 text-base tracking-wider text-[var(--text-main)]">
                        {account.accountNumber}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={approveFile !== null}
        onClose={() => {
          if (!approveLoading) setApproveFile(null)
        }}
        onConfirm={confirmApprove}
        title={`Approve ${
          approveFile ? documentTagLabel(approveFile.tag) : 'document'
        }?`}
        message={
          <>
            <span className="block">
              {approveFile
                ? documentFileName(approveFile)
                : 'This document'}{' '}
              will be marked as approved.
            </span>
            {approveFile && reviewStatusOf(approveFile) === 'rejected' && (
              <span className="mt-2 block font-medium text-[#006838] dark:text-[#d0e3c8]">
                This clears the previous rejection reason.
              </span>
            )}
            {reviewError && (
              <span className="mt-2 block text-red-600 dark:text-red-400">
                {reviewError}
              </span>
            )}
          </>
        }
        confirmLabel="Approve"
        loading={approveLoading}
      />
      <RejectReasonModal
        open={rejectFile !== null}
        file={rejectFile}
        note={rejectNote}
        onNoteChange={changeRejectNote}
        noteError={rejectNoteError}
        error={reviewError}
        loading={rejectLoading}
        onClose={() => {
          if (!rejectLoading) setRejectFile(null)
        }}
        onReject={handleReject}
      />
      <FileViewerModal
        file={viewing}
        onClose={() => setViewing(null)}
        authFetch={authFetch}
        onApprove={() => {
          if (!viewing) return
          setViewing(null)
          openApprove(viewing)
        }}
        onReject={() => {
          if (!viewing) return
          setViewing(null)
          openReject(viewing)
        }}
        onCompare={(f) => {
          setViewing(null)
          setComparing(f)
        }}
      />
      <DocumentCompareModal
        file={comparing}
        onClose={() => setComparing(null)}
        authFetch={authFetch}
        onApprove={(f) => {
          setComparing(null)
          openApprove(f)
        }}
        onReject={(f) => {
          setComparing(null)
          openReject(f)
        }}
        onPreviousNotFound={() => {
          setComparing(null)
          refetchDocs()
        }}
      />
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
  onApprove,
  onReject,
  onCompare,
}: {
  file: AgentDocument | null
  onClose: () => void
  authFetch: ReturnType<typeof useAuthFetch>
  onApprove?: () => void
  onReject?: () => void
  onCompare?: (file: AgentDocument) => void
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
  const status = reviewStatusOf(file)
  const canReview = file?.replaced_by_file_id == null

  return (
    <Modal
      open={file !== null}
      onClose={handleClose}
      title={title}
      className="sm:max-w-2xl lg:max-w-6xl"
    >
      <p className="mb-3 text-sm text-[var(--text-sub)]">
        {file ? documentFileName(file) : 'Document preview'}
      </p>
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
            <p className="text-sm text-[#991b1b] dark:text-[#fca5a5]">{error}</p>
            <p className="text-xs text-[var(--text-sub)]">
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
            <p className="text-sm text-[var(--text-sub)]">
              This file type cannot be previewed in the browser.
            </p>
            <a
              href={blobUrl}
              download
              aria-label={`Download ${title} document`}
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#006838] px-4 text-sm font-semibold text-white hover:bg-[#00552e]"
            >
              Download file
            </a>
          </div>
        )}
      </div>
      {file && (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#dfe7df] px-5 py-4 dark:border-[#3d4140]">
          {status === 'approved' && (
            <p className="mr-auto text-sm text-[var(--text-sub)]">
              Approved
              {file.reviewed_at
                ? ` ${formatReviewDate(file.reviewed_at)}`
                : ''}
            </p>
          )}
          {status === 'rejected' && (
            <p className="mr-auto text-sm text-[#991b1b] dark:text-[#fca5a5]">
              Rejected
              {file.review_note ? ` — ${file.review_note}` : ''}
            </p>
          )}
          {file.previous_file_id != null && onCompare && (
            <button
              type="button"
              onClick={() => onCompare(file)}
              className={cn(btnSecondaryCls, 'inline-flex items-center gap-1.5')}
            >
              <GitCompare className="size-4" aria-hidden="true" />
              Compare with previous
            </button>
          )}
          {canReview && status !== 'rejected' && (
            <button
              type="button"
              onClick={onReject}
              aria-label={`Reject ${title} document`}
              className={btnDangerCls}
            >
              {status === 'approved' ? 'Reject document' : 'Reject'}
            </button>
          )}
          {canReview && status !== 'approved' && (
            <button
              type="button"
              onClick={onApprove}
              aria-label={
                status === 'rejected'
                  ? `Approve ${title} document anyway`
                  : `Approve ${title} document`
              }
              className={btnPrimaryCls}
            >
              {status === 'rejected' ? 'Approve anyway' : 'Approve'}
            </button>
          )}
        </div>
      )}
    </Modal>
  )
}

/**
 * Compare modal: displays the previous superseded file next to the new upload.
 * Review actions are presented strictly on the new (current) file.
 */
function DocumentCompareModal({
  file,
  onClose,
  authFetch,
  onApprove,
  onReject,
  onPreviousNotFound,
}: {
  file: AgentDocument | null
  onClose: () => void
  authFetch: ReturnType<typeof useAuthFetch>
  onApprove?: (file: AgentDocument) => void
  onReject?: (file: AgentDocument) => void
  onPreviousNotFound?: () => void
}) {
  const [prevBlobUrl, setPrevBlobUrl] = useState<string | null>(null)
  const [prevMimeType, setPrevMimeType] = useState('')
  const [prevLoading, setPrevLoading] = useState(false)
  const [prevError, setPrevError] = useState<string | null>(null)

  const [currBlobUrl, setCurrBlobUrl] = useState<string | null>(null)
  const [currMimeType, setCurrMimeType] = useState('')
  const [currLoading, setCurrLoading] = useState(false)
  const [currError, setCurrError] = useState<string | null>(null)

  // Fetch previous file
  useEffect(() => {
    if (!file?.previous_file_id) return
    let cancelled = false
    setPrevLoading(true)
    setPrevError(null)
    setPrevBlobUrl(null)

    authFetch(`/api/admin/files/${file.previous_file_id}/serve`)
      .then(async (res) => {
        if (res.status === 404) {
          throw new Error('404: The previous file no longer exists (it was replaced or deleted).')
        }
        if (!res.ok) throw new Error(`Could not load previous file (${res.status})`)
        const blob = await res.blob()
        if (!cancelled) {
          setPrevMimeType(blob.type || 'application/octet-stream')
          setPrevBlobUrl(URL.createObjectURL(blob))
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const msg = err?.message || 'Failed to load previous file'
          setPrevError(msg)
          if (msg.includes('404')) {
            toast.error('The previous document was replaced or deleted. Refreshing list.')
            onPreviousNotFound?.()
          }
        }
      })
      .finally(() => {
        if (!cancelled) setPrevLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [file?.previous_file_id, authFetch, onPreviousNotFound])

  // Fetch current file
  useEffect(() => {
    if (!file) return
    let cancelled = false
    setCurrLoading(true)
    setCurrError(null)
    setCurrBlobUrl(null)

    authFetch(`/api/admin/files/${file.id}/serve`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Could not load current file (${res.status})`)
        const blob = await res.blob()
        if (!cancelled) {
          setCurrMimeType(blob.type || file.mime_type || 'application/octet-stream')
          setCurrBlobUrl(URL.createObjectURL(blob))
        }
      })
      .catch((err) => {
        if (!cancelled) setCurrError(err?.message || 'Failed to load current file')
      })
      .finally(() => {
        if (!cancelled) setCurrLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [file?.id, authFetch])

  function handleClose() {
    if (prevBlobUrl) URL.revokeObjectURL(prevBlobUrl)
    if (currBlobUrl) URL.revokeObjectURL(currBlobUrl)
    setPrevBlobUrl(null)
    setCurrBlobUrl(null)
    setPrevError(null)
    setCurrError(null)
    onClose()
  }

  if (!file) return null

  const title = documentTagLabel(file.tag)
  const currentStatus = reviewStatusOf(file)
  const prevStatus = file.previous_review_status ?? 'pending'

  const isPrevImage = prevMimeType.startsWith('image/')
  const isPrevPdf = prevMimeType === 'application/pdf'

  const isCurrImage = currMimeType.startsWith('image/')
  const isCurrPdf = currMimeType === 'application/pdf'

  return (
    <Modal
      open={file !== null}
      onClose={handleClose}
      title={`Compare: ${title}`}
      className="sm:max-w-4xl lg:max-w-7xl"
    >
      <p className="mb-4 text-sm text-[var(--text-sub)]">
        Comparing the replaced document with the new upload side-by-side.
      </p>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Previous Document */}
        <div className="flex flex-col rounded-lg border border-[#dfe7df] p-4 dark:border-[#3d4140]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#dfe7df] pb-3 dark:border-[#3d4140]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold uppercase tracking-wider text-[var(--text-sub)]">
                  Previous document
                </span>
                <span className="rounded bg-[var(--subtle)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-muted)]">
                  Read-only
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                File ID #{file.previous_file_id}
                {file.previous_reviewed_at && ` · Decided ${formatReviewDate(file.previous_reviewed_at)}`}
              </p>
            </div>
            <StatusPill status={prevStatus} />
          </div>

          {file.previous_review_note && (
            <div className="mb-3 rounded-md bg-red-50 p-2.5 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <span className="font-semibold">Rejection reason:</span> {file.previous_review_note}
            </div>
          )}

          <div className="flex min-h-[360px] flex-1 items-center justify-center overflow-auto rounded bg-[var(--subtle)] p-2">
            {prevLoading && (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="size-7 animate-spin text-[#006838]" aria-hidden="true" />
              </div>
            )}
            {prevError && (
              <div className="p-4 text-center">
                <p className="text-sm text-[#991b1b] dark:text-[#fca5a5]">{prevError}</p>
                <p className="mt-1 text-xs text-[var(--text-sub)]">
                  The previous file cannot be previewed.
                </p>
              </div>
            )}
            {prevBlobUrl && isPrevImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={prevBlobUrl}
                alt="Previous document"
                className="mx-auto max-h-[60vh] max-w-full rounded object-contain"
              />
            )}
            {prevBlobUrl && isPrevPdf && (
              <iframe
                src={prevBlobUrl}
                title="Previous document"
                className="h-[60vh] w-full rounded border-0"
              />
            )}
            {prevBlobUrl && !isPrevImage && !isPrevPdf && (
              <div className="p-4 text-center">
                <p className="text-sm text-[var(--text-sub)]">Preview not available in browser.</p>
                <a
                  href={prevBlobUrl}
                  download
                  className="mt-2 inline-flex min-h-9 items-center gap-2 rounded-md bg-[#006838] px-3 text-xs font-semibold text-white"
                >
                  Download file
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Right: Current Document */}
        <div className="flex flex-col rounded-lg border border-[#006838]/40 bg-white p-4 dark:border-[#006838]/60 dark:bg-[var(--card)]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#dfe7df] pb-3 dark:border-[#3d4140]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold uppercase tracking-wider text-[#006838] dark:text-[#d0e3c8]">
                  Current upload (new)
                </span>
                <span className="rounded-full border border-[#006838]/30 px-2 py-0.5 text-[11px] font-semibold text-[#006838] dark:text-[#d0e3c8]">
                  File ID #{file.id}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[var(--text-sub)]">
                {documentFileName(file)}
                {file.created_at && ` · Uploaded ${formatReviewDate(file.created_at)}`}
              </p>
            </div>
            <StatusPill status={currentStatus} />
          </div>

          {currentStatus === 'rejected' && file.review_note && (
            <div className="mb-3 rounded-md bg-red-50 p-2.5 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <span className="font-semibold">Rejection reason:</span> {file.review_note}
            </div>
          )}

          <div className="flex min-h-[360px] flex-1 items-center justify-center overflow-auto rounded bg-[var(--subtle)] p-2">
            {currLoading && (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="size-7 animate-spin text-[#006838]" aria-hidden="true" />
              </div>
            )}
            {currError && (
              <div className="p-4 text-center">
                <p className="text-sm text-[#991b1b] dark:text-[#fca5a5]">{currError}</p>
                <p className="mt-1 text-xs text-[var(--text-sub)]">
                  Check your connection and try again.
                </p>
              </div>
            )}
            {currBlobUrl && isCurrImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currBlobUrl}
                alt="Current document"
                className="mx-auto max-h-[60vh] max-w-full rounded object-contain"
              />
            )}
            {currBlobUrl && isCurrPdf && (
              <iframe
                src={currBlobUrl}
                title="Current document"
                className="h-[60vh] w-full rounded border-0"
              />
            )}
            {currBlobUrl && !isCurrImage && !isCurrPdf && (
              <div className="p-4 text-center">
                <p className="text-sm text-[var(--text-sub)]">Preview not available in browser.</p>
                <a
                  href={currBlobUrl}
                  download
                  className="mt-2 inline-flex min-h-9 items-center gap-2 rounded-md bg-[#006838] px-3 text-xs font-semibold text-white"
                >
                  Download file
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review actions strictly on current file */}
      <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-[#dfe7df] pt-4 dark:border-[#3d4140]">
        <button type="button" onClick={handleClose} className={btnSecondaryCls}>
          Close
        </button>
        {currentStatus !== 'rejected' && onReject && (
          <button
            type="button"
            onClick={() => {
              handleClose()
              onReject(file)
            }}
            className={btnDangerCls}
          >
            {currentStatus === 'approved' ? 'Reject document' : 'Reject current'}
          </button>
        )}
        {currentStatus !== 'approved' && onApprove && (
          <button
            type="button"
            onClick={() => {
              handleClose()
              onApprove(file)
            }}
            className={btnPrimaryCls}
          >
            {currentStatus === 'rejected' ? 'Approve anyway' : 'Approve current'}
          </button>
        )}
      </div>
    </Modal>
  )
}

/**
 * Reject reason modal. A rejection requires a note (max 500 chars). The
 * note error from a 422 (`errors.note`) is shown under the textarea.
 */
function RejectReasonModal({
  open,
  file,
  note,
  onNoteChange,
  noteError,
  error,
  loading,
  onClose,
  onReject,
}: {
  open: boolean
  file: AgentDocument | null
  note: string
  onNoteChange: (v: string) => void
  noteError: string | null
  error: string | null
  loading: boolean
  onClose: () => void
  onReject: () => void
}) {
  const status = reviewStatusOf(file)
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Reject ${file ? documentTagLabel(file.tag) : 'document'}`}
      className="sm:max-w-md"
    >
      <div className="space-y-3">
        <p className="text-sm text-[var(--text-sub)]">
          Enter the reason for rejection. The agent will be emailed.
        </p>
        <p className="text-sm text-[var(--text-sub)]">
          {file ? documentFileName(file) : 'This document'} will be rejected
          {status === 'approved'
            ? ', replacing its current approval'
            : ''}
          . A later upload of the same document restarts review as pending.
        </p>
        <label
          htmlFor="reject-reason-note"
          className="block text-sm font-semibold text-[var(--text-main)]"
        >
          Reason
        </label>
        <textarea
          id="reject-reason-note"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          maxLength={500}
          rows={4}
          aria-invalid={noteError ? true : undefined}
          aria-describedby={
            noteError ? 'reject-reason-note-error' : undefined
          }
          className={cn(
            fieldCls,
            'mt-1',
            noteError ? 'border-red-600 focus-visible:outline-red-600' : ''
          )}
          placeholder="Why is this document being rejected?"
        />
        {noteError && (
          <p
            id="reject-reason-note-error"
            className="mt-1 text-xs text-red-600 dark:text-red-400"
          >
            {noteError}
          </p>
        )}
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
        <p className="text-xs text-[var(--text-muted)]">
          {note.length}/500 characters
        </p>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className={btnSecondaryCls}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onReject}
          disabled={loading || !note.trim()}
          aria-label={`Reject ${
            file ? documentTagLabel(file.tag) : 'document'
          }`}
          className={btnDangerCls}
        >
          {loading ? 'Please wait…' : 'Reject document'}
        </button>
      </div>
    </Modal>
  )
}
