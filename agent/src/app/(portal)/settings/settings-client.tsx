'use client'

import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  X,
  Loader2,
  Camera,
  Upload,
  Eye,
  EyeOff,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  Wallet,
  Pencil,
  BadgeCheck,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAgentUser, useAgentAuthStore } from '@/store/agent-auth-store'
import { cn, getInitials } from '@/lib/utils'
import { useAuthFetch } from '@/hooks/use-auth-fetch'
import { useAuthenticatedImage } from '@/hooks/use-authenticated-image'
import { PortalContentHeader } from '@/components/layout/portal-content-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { ActionIcon } from '@/components/ui/action-icon'
import type { AgentFile } from '@/types/agent/profile'

// ============================================================
// Schemas
// ============================================================
const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100, 'First name must be 100 characters or fewer'),
  last_name: z.string().min(1, 'Last name is required').max(100, 'Last name must be 100 characters or fewer'),
  phone: z
    .string()
    .refine(
      (val) => val === '' || (/^\+?[0-9\s\(\)\-]{6,20}$/.test(val) && /[0-9]/.test(val)),
      'Phone may only contain digits, spaces, brackets and dashes, with an optional leading +.',
    ),
  designation: z.string().max(100, 'Designation must be 100 characters or fewer'),
})
type ProfileForm = z.infer<typeof profileSchema>

const bankSchema = z.object({
  bank_name: z.string().min(1, 'Bank name is required'),
  account_number: z.string().min(8, 'Enter a valid account number'),
  account_name: z.string().min(1, 'Account name is required'),
})
type BankForm = z.infer<typeof bankSchema>

const ewalletSchema = z.object({
  provider: z.enum(['GCash', 'Maya', 'ShopeePay', 'GrabPay'], {
    message: 'Select a provider',
  }),
  mobile_number: z.string().min(10, 'Enter a valid mobile number'),
  account_name: z.string().min(1, 'Account name is required'),
})
type EwalletForm = z.infer<typeof ewalletSchema>

// ============================================================
// Types
// ============================================================
type RequiredDoc = {
  /** Display name */
  type: string
  /** API tag (backward compatible with existing documents) */
  tag: string
  description: string
  required: boolean
}

type BankAccount = {
  id: number
  bank_name: string
  account_name: string
  account_number: string
  is_primary: boolean
}

type Ewallet = {
  id: number
  provider: string
  account_name: string
  account_number: string
  mobile_number?: string
  phone?: string
  is_primary: boolean
}

// ============================================================
// Constants
// ============================================================
const REQUIRED_DOCUMENTS: RequiredDoc[] = [
  { type: 'Valid government ID', tag: 'valid_id', description: 'Government-issued photo ID or passport', required: true },
  { type: 'Insurance qualification — Tier 1', tag: 'insurance_qual_1', description: 'Training or professional proficiency certificate', required: true },
  { type: 'Insurance qualification — Tier 2', tag: 'insurance_qual_2', description: 'Additional qualification certificate', required: true },
  { type: 'Insurance qualification — Tier 3', tag: 'insurance_qual_3', description: 'Advanced specialization certificate', required: true },
  { type: 'Agent license or registration', tag: 'agent_license', description: 'Required for licensed agents. Current authority-issued proof.', required: false },
]

const FILE_RULES = 'One file per type. Accepted formats: JPG, PNG, WEBP, PDF — maximum 5 MB per file.'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

// Profile photo limits (separate from document uploads)
const PHOTO_MAX_BYTES = 2 * 1024 * 1024 // 2 MB
const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp'
const PHOTO_ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

// ============================================================
// Mock adapter for missing backend fields
// ============================================================
// BACKEND REQUIREMENTS (these fields are currently mocked):
// 1. AgentUser.email_verified_at: string | null — email verification timestamp
// 2. AgentUser.is_verified: boolean — account verification status
// 3. AgentFile.file_size: number — file size in bytes

function mockEmailVerified(user: { email?: string } | null): boolean {
  // Mock: assume email is verified for all logged-in users
  return !!user?.email
}

function mockAccountVerified(documents: AgentFile[]): boolean {
  // Mock: account is verified if at least one document is approved
  return documents.some((d) => (d.review_status ?? d.status) === 'approved')
}

// ============================================================
// Helpers
// ============================================================
function formatPhoneDisplay(phone: string | undefined): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  // PH mobile: 639XXXXXXXXX (12 digits) or 09XXXXXXXXX (11 digits)
  if (digits.startsWith('639') && digits.length === 12) {
    return `+63 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`
  }
  if (digits.startsWith('09') && digits.length === 11) {
    return `+63 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
  }
  return phone
}

function maskAccountNumber(num: string): string {
  const digits = (num || '').replace(/\s/g, '')
  if (digits.length <= 4) return num
  return `•••• ${digits.slice(-4)}`
}

function normalizeProvider(name: string): string {
  const lower = name.toLowerCase()
  if (lower === 'gcash') return 'GCash'
  if (lower === 'maya') return 'Maya'
  if (lower === 'shopeepay') return 'ShopeePay'
  if (lower === 'grabpay') return 'GrabPay'
  return name
}

function splitName(name: string | undefined): { first_name: string; last_name: string } {
  const trimmed = (name ?? '').trim()
  const idx = trimmed.indexOf(' ')
  if (idx === -1) return { first_name: trimmed, last_name: '' }
  return { first_name: trimmed.slice(0, idx), last_name: trimmed.slice(idx + 1) }
}

// ============================================================
// Small components
// ============================================================
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

function DocStatusPill({ status, reviewStatus }: { status: AgentFile['status'] | undefined; reviewStatus?: AgentFile['review_status'] | undefined }) {
  const displayStatus = reviewStatus ?? status
  if (!displayStatus) return null
  if (displayStatus === 'approved') return <StatusBadge status="approved" />
  if (displayStatus === 'pending') return <StatusBadge status="pending" label="Pending review" />
  if (displayStatus === 'rejected') return <StatusBadge status="rejected" />
  return null
}

function InfoCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 flex items-start gap-2 rounded-md bg-[var(--subtle)] p-3">
      <Info className="mt-0.5 size-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
      <p className="text-sm text-[var(--text-sub)]">{children}</p>
    </div>
  )
}

function PaymentMethodCard({
  title,
  typeTag,
  accountName,
  accountNumber,
  isPrimary,
  totalAccounts,
  onSetPrimary,
  onEdit,
  onRemove,
}: {
  title: string
  typeTag: string
  accountName: string
  accountNumber: string
  isPrimary: boolean
  totalAccounts: number
  onSetPrimary: () => void
  onEdit: () => void
  onRemove: () => void
}) {
  return (
    <div className="rounded-md border border-[var(--border)] p-4">
      <div className="flex items-center justify-between gap-3">
        <strong className="text-base text-[var(--text-main)]">{title}</strong>
        {isPrimary && (
          <span className="text-xs font-semibold text-[#006838] dark:text-[#d0e3c8]">
            Primary
          </span>
        )}
      </div>
      <p className="mt-1 text-base text-[var(--text-sub)]">{typeTag}</p>
      <p className="mt-2 text-base text-[var(--text-main)]">{accountName}</p>
      <p className="mt-1 text-base tracking-wider text-[var(--text-main)]">
        {accountNumber}
      </p>
      <div className="mt-3 flex items-center gap-1">
        {!isPrimary && totalAccounts > 1 && (
          <ActionIcon label={`Set ${title} as primary`} hint="Set as primary" onClick={onSetPrimary}>
            <BadgeCheck aria-hidden="true" />
          </ActionIcon>
        )}
        <ActionIcon label={`Edit ${title}`} hint="Edit" onClick={onEdit}>
          <Pencil aria-hidden="true" />
        </ActionIcon>
        <ActionIcon label={`Remove ${title}`} hint="Remove" onClick={onRemove}>
          <Trash2 aria-hidden="true" />
        </ActionIcon>
      </div>
    </div>
  )
}

function DocumentRow({
  doc,
  uploaded,
  onAdd,
  onView,
  onDropFile,
}: {
  doc: RequiredDoc
  uploaded: AgentFile | undefined
  onAdd: () => void
  onView: () => void
  onDropFile: (file: File, tag: string) => void
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      setError('File must be 5 MB or smaller')
      return
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Choose a JPG, PNG, WEBP or PDF file')
      return
    }
    setError(null)
    onDropFile(file, doc.tag)
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between',
        isDragging && 'rounded-lg bg-[#e2eddb] ring-2 ring-[#006838] ring-inset dark:bg-[#1a2e1f]'
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-[var(--text-main)]">{doc.type}</h3>
          <RequiredTag required={doc.required} />
        </div>
        <p className="mt-1 text-base text-[var(--text-sub)]">{doc.description}</p>
        {uploaded ? (
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            <p className="break-all text-base text-[#006838] dark:text-[#d0e3c8]">
              {uploaded.original_name && !uploaded.original_name.includes('__')
                ? uploaded.original_name
                : 'Uploaded'}
            </p>
            <DocStatusPill status={uploaded.status} reviewStatus={uploaded.review_status} />
          </div>
        ) : (
          <p className="mt-2 text-base text-[var(--text-muted)]">No file added</p>
        )}
        {(uploaded?.review_status ?? uploaded?.status) === 'rejected' && uploaded?.review_note && (
          <p className="mt-1 text-xs text-[#dc2626] dark:text-red-300">
            Reason: {uploaded.review_note}
          </p>
        )}
        {error && (
          <p role="alert" aria-live="assertive" className="mt-2 text-sm text-[#dc2626] dark:text-red-300">
            {error}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:self-center">
        {uploaded?.id && (
          <ActionIcon
            label={`View ${doc.type}`}
            hint="View"
            onClick={onView}
          >
            <Eye aria-hidden="true" />
          </ActionIcon>
        )}
        <ActionIcon
          label={uploaded ? `Replace ${doc.type}` : `Add ${doc.type}`}
          hint={uploaded ? 'Replace file' : 'Add file'}
          onClick={onAdd}
        >
          {uploaded ? <RefreshCw aria-hidden="true" /> : <Upload aria-hidden="true" />}
        </ActionIcon>
      </div>
    </div>
  )
}

// ============================================================
// Skeleton (exact mockup parity)
// ============================================================
function Skeleton() {
  return (
    <div role="status" aria-label="Loading user settings">
      <span className="sr-only">Loading user settings</span>
      <div aria-hidden="true" className="space-y-4 motion-safe:animate-pulse">
        <section className="agent-dashboard__panel min-w-0 border-border p-5 sm:p-6 space-y-6">
          <div className="h-6 w-48 rounded bg-leaf-20 dark:bg-ink-31" />
          <div className="flex items-center gap-5">
            <div className="size-20 shrink-0 rounded-full bg-leaf-20 dark:bg-ink-31" />
            <div className="space-y-3">
              <div className="h-5 w-40 rounded bg-leaf-20 dark:bg-ink-31" />
              <div className="h-4 w-28 rounded bg-leaf-20 dark:bg-ink-31" />
            </div>
          </div>
          <div className="grid gap-6 border-t border-[var(--border)] pt-6 dark:border-[#3d4140] sm:grid-cols-2">
            <div className="space-y-3">
              <div className="h-4 w-24 rounded bg-leaf-20 dark:bg-ink-31" />
              <div className="h-5 w-40 max-w-full rounded bg-leaf-20 dark:bg-ink-31" />
            </div>
            <div className="space-y-3">
              <div className="h-4 w-24 rounded bg-leaf-20 dark:bg-ink-31" />
              <div className="h-5 w-40 max-w-full rounded bg-leaf-20 dark:bg-ink-31" />
            </div>
            <div className="space-y-3">
              <div className="h-4 w-24 rounded bg-leaf-20 dark:bg-ink-31" />
              <div className="h-5 w-40 max-w-full rounded bg-leaf-20 dark:bg-ink-31" />
            </div>
            <div className="space-y-3">
              <div className="h-4 w-24 rounded bg-leaf-20 dark:bg-ink-31" />
              <div className="h-5 w-40 max-w-full rounded bg-leaf-20 dark:bg-ink-31" />
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.8fr)]">
          <section className="agent-dashboard__panel min-w-0 border-border p-5 sm:p-6 space-y-5">
            <div className="h-6 w-52 rounded bg-leaf-20 dark:bg-ink-31" />
            <div className="h-16 rounded bg-leaf-20 dark:bg-ink-31" />
            <div className="h-16 rounded bg-leaf-20 dark:bg-ink-31" />
            <div className="h-16 rounded bg-leaf-20 dark:bg-ink-31" />
          </section>
          <section className="agent-dashboard__panel min-w-0 border-border p-5 sm:p-6 space-y-5">
            <div className="h-6 w-36 rounded bg-leaf-20 dark:bg-ink-31" />
            <div className="h-4 w-full rounded bg-leaf-20 dark:bg-ink-31" />
            <div className="h-11 w-40 rounded bg-leaf-20 dark:bg-ink-31" />
          </section>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Modal
// ============================================================
function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  size?: 'md' | 'lg' | 'xl'
}) {
  if (!open || typeof document === 'undefined') return null
  const widthClass =
    size === 'xl' ? 'max-w-6xl' :
    size === 'lg' ? 'max-w-2xl' :
    'max-w-md'
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={`max-h-[90dvh] w-full ${widthClass} overflow-y-auto rounded-lg bg-[var(--card)] p-6 shadow-xl`}>
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h3 id="modal-title" className="text-base font-semibold text-[var(--text-main)]">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>
            )}
          </div>
          <ActionIcon label="Close dialog" hint="Close" onClick={onClose}>
            <X aria-hidden="true" />
          </ActionIcon>
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}

// ============================================================
// File viewer modal
// ============================================================
function FileViewerModal({
  file,
  docType,
  onClose,
  authFetch,
}: {
  file: AgentFile | null
  docType: string
  onClose: () => void
  authFetch: ReturnType<typeof useAuthFetch>
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch the file as a blob whenever `file` changes
  useEffect(() => {
    if (!file) return
    let revoked = false
    setLoading(true)
    setError(null)
    setBlobUrl(null)

    authFetch(`/api/agent/files/${file.id}/serve`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Could not load file (${res.status})`)
        const blob = await res.blob()
        const mime = blob.type || file.mime_type || 'application/octet-stream'
        if (!revoked) {
          setMimeType(mime)
          setBlobUrl(URL.createObjectURL(blob))
        }
      })
      .catch((err) => {
        if (!revoked) setError(err?.message || 'Failed to load file')
      })
      .finally(() => {
        if (!revoked) setLoading(false)
      })

    return () => {
      revoked = true
    }
  }, [file, authFetch])

  // Revoke blob URL when modal closes
  function handleClose() {
    if (blobUrl) URL.revokeObjectURL(blobUrl)
    setBlobUrl(null)
    setMimeType('')
    setError(null)
    onClose()
  }

  const isImage = mimeType.startsWith('image/')
  const isPdf = mimeType === 'application/pdf'

  return (
    <Modal
      open={file !== null}
      onClose={handleClose}
      title={docType}
      subtitle="Document preview"
      size="xl"
    >
      <div className="min-h-48 overflow-auto">
        {loading && (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-7 animate-spin text-[#006838]" />
          </div>
        )}
        {error && (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm text-[#dc2626]">{error}</p>
            <p className="text-xs text-[var(--text-muted)]">Check your connection and try again.</p>
          </div>
        )}
        {blobUrl && isImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={blobUrl}
            alt={docType}
            className="mx-auto max-h-[75vh] max-w-full rounded object-contain"
          />
        )}
        {blobUrl && isPdf && (
          <iframe
            src={blobUrl}
            title={docType}
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

// ============================================================
// Confirm dialog
// ============================================================
function ConfirmDialog({
  open,
  onClose,
  title,
  message,
  confirmLabel,
  onConfirm,
  isLoading,
  danger,
}: {
  open: boolean
  onClose: () => void
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  isLoading?: boolean
  danger?: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-[var(--text-sub)]">{message}</p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={cn(
            'min-h-11 flex-1 rounded-md px-5 text-sm font-semibold text-white disabled:opacity-60',
            danger ? 'bg-[#dc2626] hover:bg-[#b91c1c]' : 'bg-[#006838] hover:bg-[#00552e]'
          )}
        >
          {isLoading ? 'Please wait…' : confirmLabel}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 flex-1 rounded-md border border-[var(--field-border)] px-5 text-sm font-semibold text-[var(--text-main)] focus-visible:outline-2 focus-visible:outline-[#006838]"
        >
          Cancel
        </button>
      </div>
    </Modal>
  )
}

// ============================================================
// Password field with show/hide toggle (icon-only, 44px target)
// ============================================================
function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
  autoComplete,
  minLength,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggleShow: () => void
  autoComplete: string
  minLength?: number
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-[var(--text-sub)]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          minLength={minLength}
          required
          className="ui-form-field w-full pr-11"
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-[#59645d] hover:text-[#006838] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] dark:text-[var(--text-muted)] dark:hover:text-[#d0e3c8]"
        >
          {show ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  )
}

// ============================================================
// Field wrapper
// ============================================================
function Field({
  label,
  error,
  children,
  required,
}: {
  label: string
  error?: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[var(--text-sub)]">
        {label} {required && <span className="text-[#dc2626]">*</span>}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-[#dc2626]">
          {error}
        </p>
      )}
    </div>
  )
}

// ============================================================
// Main component
// ============================================================
export function SettingsClient() {
  const user = useAgentUser()
  const updateUser = useAgentAuthStore((s) => s.updateUser)
  const getAuthHeader = useAgentAuthStore((s) => s.getAuthHeader)
  const queryClient = useQueryClient()
  const authFetch = useAuthFetch()

  // ---- State ----
  const [editing, setEditing] = useState(false)
  const [bankOpen, setBankOpen] = useState(false)
  const [ewalletOpen, setEwalletOpen] = useState(false)
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const originalProfileRef = useRef<ProfileForm | null>(null)

  // Fetch fresh profile on mount — the store may have profile_photo: null if
  // the login response didn't include it. This is the authoritative source.
  useEffect(() => {
    const authHeader = getAuthHeader()
    if (!authHeader) return
    fetch('/api/agent/profile', {
      headers: { Authorization: authHeader, Accept: 'application/json' },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const profile = json?.data
        if (profile) {
          updateUser({
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            role: profile.role,
            designation: profile.designation,
            profile_photo: profile.profile_photo ?? null,
          })
        }
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch the profile photo through the authenticated proxy so the
  // Authorization header is sent — plain <img src> cannot do this.
  // Priority: profile_photo.url is the canonical proxy path set after upload
  // (/api/agent/profile/photo?v=…); fall back to other possible field names.
  const rawPhotoUrl =
    user?.profile_photo?.url ||
    (user as any)?.profile_photo_url ||
    (user as any)?.avatar ||
    (user as any)?.photo_url ||
    (user as any)?.profile_picture ||
    null
  const profilePhotoSrc = useAuthenticatedImage(rawPhotoUrl)
  const [photoError, setPhotoError] = useState<string | null>(null)

  // Document dialog state
  const [docDialogDoc, setDocDialogDoc] = useState<RequiredDoc | null>(null)
  const [docFile, setDocFile] = useState<File | null>(null)
  const docFileInputRef = useRef<HTMLInputElement>(null)

  // Document viewer state
  const [viewingDoc, setViewingDoc] = useState<{ file: AgentFile; docType: string } | null>(null)

  // Confirm dialog state
  const [photoRemoveOpen, setPhotoRemoveOpen] = useState(false)
  const [paymentRemoveId, setPaymentRemoveId] = useState<number | null>(null)

  // Password change state
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwShow, setPwShow] = useState({ current: false, new: false, confirm: false })
  const [pwError, setPwError] = useState('')
  const [pwSaving, setPwSaving] = useState(false)

  // Derived: account type from user role (read-only)
  const accountType: 'advisor' | 'referral' = user?.role?.toLowerCase().includes('referral')
    ? 'referral'
    : 'advisor'

  // ---- Photo upload mutation ----
  const photoMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('photo', file)
      const res = await authFetch('/api/agent/profile/photo', { method: 'POST', body: form })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        // 422: errors.photo has the message; 502: Google Drive failure
        if (res.status === 422) {
          throw new Error(json?.errors?.photo || json?.message || 'Invalid photo')
        }
        if (res.status === 502) {
          throw new Error('Could not save your photo, please try again')
        }
        throw new Error(json?.message || 'Failed to upload photo')
      }
      return json
    },
    onSuccess: (data) => {
      const photo = data?.data
      const url =
        photo?.url ||
        photo?.profile_photo_url ||
        data?.profile_photo_url ||
        `/api/agent/profile/photo?v=${Date.now()}`
      updateUser({
        profile_photo_url: url,
        profile_photo: photo
          ? { id: photo.id ?? 1, mime_type: photo.mime_type ?? 'image/jpeg', updated_at: photo.updated_at ?? new Date().toISOString(), url: photo.url || url }
          : { id: 1, mime_type: 'image/jpeg', updated_at: new Date().toISOString(), url },
      } as any)
      setPhotoError(null)
      toast.success('Profile photo updated')
      if (photoInputRef.current) photoInputRef.current.value = ''
    },
    onError: (err: any) => {
      setPhotoError(err?.message || 'Failed to upload profile photo')
    },
  })

  // ---- Photo delete mutation ----
  const deletePhotoMutation = useMutation({
    mutationFn: async () => {
      const res = await authFetch('/api/agent/profile/photo', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete photo')
      return res.json()
    },
    onSuccess: () => {
      updateUser({ profile_photo_url: undefined, profile_photo: null, avatar: undefined } as any)
      setPhotoError(null)
      toast.success('Profile photo removed')
      setPhotoRemoveOpen(false)
    },
    onError: () => toast.error('Failed to delete photo'),
  })

  // ---- Profile form ----
  const { first_name: defaultFirstName, last_name: defaultLastName } = splitName(user?.name)

  const {
    register: regProfile,
    handleSubmit: handleProfile,
    reset: resetProfile,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
    setError,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: defaultFirstName,
      last_name: defaultLastName,
      phone: user?.phone ?? '',
      designation: user?.designation ?? '',
    },
  })

  // ---- Bank form ----
  const {
    register: regBank,
    handleSubmit: handleBank,
    reset: resetBank,
    formState: { errors: bankErrors, isSubmitting: bankSubmitting },
  } = useForm<BankForm>({ resolver: zodResolver(bankSchema) })

  // ---- E-wallet form ----
  const {
    register: regEwallet,
    handleSubmit: handleEwallet,
    reset: resetEwallet,
    formState: { errors: ewalletErrors, isSubmitting: ewalletSubmitting },
  } = useForm<EwalletForm>({ resolver: zodResolver(ewalletSchema) })

  // ---- Referral code query (same as /referrals page) ----
  const { data: referralCodeData } = useQuery<string | null>({
    queryKey: ['referralCode', user?.id],
    queryFn: async () => {
      try {
        const res = await authFetch(`/api/agent/referral?id=${user?.id || ''}`)
        if (!res.ok) return null
        const json = await res.json()
        return typeof json.data === 'string' ? json.data : json.data?.referral_code || null
      } catch {
        return null
      }
    },
    enabled: !!user?.id,
  })

  const agentCode = referralCodeData || user?.agent_code || null
  const {
    data: documents = [],
    isLoading: docsLoading,
    isError: docsError,
    refetch: refetchDocs,
  } = useQuery<AgentFile[]>({
    queryKey: ['agent-files'],
    queryFn: async () => {
      const res = await authFetch('/api/agent/files')
      if (!res.ok) throw new Error('Failed to load documents')
      return (await res.json()).data ?? []
    },
  })

  // ---- Document upload mutation ----
  const uploadMutation = useMutation({
    mutationFn: async ({ file, tag }: { file: File; tag: string }) => {
      const form = new FormData()
      form.append('file', file)
      form.append('tag', tag)
      const res = await authFetch('/api/agent/files/upload', { method: 'POST', body: form })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        // 422: errors.file has the message; 500: retry message
        if (res.status === 422) {
          throw new Error(json?.errors?.file || json?.errors?.tag || json?.message || 'Upload failed')
        }
        if (res.status === 500) {
          throw new Error('Could not save the document, please try again.')
        }
        throw new Error(json?.message || 'Upload failed')
      }
      return json
    },
    onSuccess: async () => {
      // Invalidate + force immediate refetch so the document row updates without a page reload
      await queryClient.invalidateQueries({ queryKey: ['agent-files'] })
      await queryClient.refetchQueries({ queryKey: ['agent-files'] })
      toast.success('Document uploaded successfully')
      closeDocDialog()
    },
    onError: (err: any) => toast.error(err?.message || 'Upload failed — please try again'),
  })

  // ---- Payment methods query ----
  const {
    data: accountsData,
    isLoading: accountsLoading,
    isError: accountsError,
    refetch: refetchAccounts,
  } = useQuery<{ bank_details: BankAccount[]; e_wallets: Ewallet[] }>({
    queryKey: ['agent-accounts', user?.id],
    queryFn: async () => {
      const res = await authFetch('/api/agent/accounts')
      if (!res.ok) {
        if (res.status === 404) return { bank_details: [], e_wallets: [] }
        throw new Error('Failed to load payment methods')
      }
      const json = await res.json()
      return json.data || { bank_details: [], e_wallets: [] }
    },
    enabled: !!user?.id,
  })

  const bankDetails: BankAccount[] = accountsData?.bank_details || []
  const ewallets: Ewallet[] = accountsData?.e_wallets || []
  const totalAccounts = bankDetails.length + ewallets.length

  // ---- Set primary mutation ----
  const setPrimaryMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await authFetch(`/api/agent/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_primary: true }),
      })
      if (!res.ok) throw new Error('Failed to set primary method')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-accounts'] })
      toast.success('Primary payout method updated')
    },
    onError: () => toast.error('Failed to update primary method'),
  })

  // ---- Delete account mutation ----
  const deleteAccountMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await authFetch(`/api/agent/accounts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove payment method')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-accounts'] })
      toast.success('Payment method removed')
      setPaymentRemoveId(null)
    },
    onError: () => toast.error('Failed to remove payment method'),
  })

  // ---- Document helpers ----
  function findDocForType(tag: string): AgentFile | undefined {
    // Re-uploads create a new record per tag — show the most recent one
    return documents
      .filter((d) => d.tag?.toLowerCase() === tag.toLowerCase())
      .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))[0]
  }

  function openDocDialog(doc: RequiredDoc) {
    setDocDialogDoc(doc)
    setDocFile(null)
    if (docFileInputRef.current) docFileInputRef.current.value = ''
  }

  function closeDocDialog() {
    setDocDialogDoc(null)
    setDocFile(null)
    if (docFileInputRef.current) docFileInputRef.current.value = ''
  }

  function submitDoc() {
    if (!docFile || !docDialogDoc) return
    if (docFile.size > MAX_FILE_SIZE) {
      toast.error('File must be 5 MB or smaller')
      return
    }
    if (!ACCEPTED_TYPES.includes(docFile.type)) {
      toast.error('Choose a JPG, PNG, WEBP or PDF file')
      return
    }
    uploadMutation.mutate({ file: docFile, tag: docDialogDoc.tag })
  }

  function handleDocDropFile(file: File, tag: string) {
    uploadMutation.mutate({ file, tag })
  }

  // ---- Payment dialog helpers ----
  function openCreateBank() {
    setEditingAccountId(null)
    resetBank()
    setBankOpen(true)
  }

  function openEditBank(account: BankAccount) {
    setEditingAccountId(account.id)
    resetBank({
      bank_name: account.bank_name || '',
      account_number: account.account_number || '',
      account_name: account.account_name || '',
    })
    setBankOpen(true)
  }

  function openCreateEwallet() {
    setEditingAccountId(null)
    resetEwallet()
    setEwalletOpen(true)
  }

  function openEditEwallet(account: Ewallet) {
    setEditingAccountId(account.id)
    resetEwallet({
      provider: (normalizeProvider(account.provider) as EwalletForm['provider']) || 'GCash',
      mobile_number: account.mobile_number || account.phone || account.account_number || '',
      account_name: account.account_name || '',
    })
    setEwalletOpen(true)
  }

  // ---- Save profile ----
  const saveProfile = async (values: ProfileForm) => {
    const original = originalProfileRef.current
    const payload: Record<string, string | null> = {}
    if (!original || values.first_name !== original.first_name) payload.first_name = values.first_name
    if (!original || values.last_name !== original.last_name) payload.last_name = values.last_name
    if (!original || values.phone !== original.phone) payload.phone = values.phone === '' ? null : values.phone
    if (!original || values.designation !== original.designation)
      payload.designation = values.designation === '' ? null : values.designation

    if (Object.keys(payload).length === 0) {
      setEditing(false)
      return
    }

    try {
      const res = await authFetch('/api/agent/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.status === 403) {
        toast.error('Profile updates are not available for your account.')
        return
      }

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        if (res.status === 422 && err?.errors) {
          const fields = err.errors as Record<string, string[]>
          if (fields.first_name) setError('first_name', { type: 'manual', message: fields.first_name[0] })
          if (fields.last_name) setError('last_name', { type: 'manual', message: fields.last_name[0] })
          if (fields.phone) setError('phone', { type: 'manual', message: fields.phone[0] })
          if (fields.designation) setError('designation', { type: 'manual', message: fields.designation[0] })
          toast.error(err?.message || 'Please fix the highlighted fields.')
          return
        }
        const msg =
          res.status === 500 ? 'Failed to update profile. Please try again.' : err?.message || 'Failed to save profile'
        toast.error(msg)
        return
      }

      const json = await res.json()
      updateUser(json.data)
      toast.success(json?.message || 'Profile updated successfully')
      setEditing(false)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save profile')
    }
  }

  // ---- Save bank account ----
  const saveBank = async (values: BankForm) => {
    try {
      const isEditing = editingAccountId !== null
      const url = isEditing ? `/api/agent/accounts/${editingAccountId}` : '/api/agent/accounts'
      const method = isEditing ? 'PATCH' : 'POST'
      const payload = {
        ...values,
        type: 'bank',
        branch: 'Main',
        swift_code: 'NA',
        is_primary: isEditing ? undefined : totalAccounts === 0,
      }
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.message || 'Failed to save bank account')
      }
      queryClient.invalidateQueries({ queryKey: ['agent-accounts'] })
      toast.success(isEditing ? 'Bank account updated' : 'Bank account saved')
      setBankOpen(false)
      setEditingAccountId(null)
      resetBank()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save bank account')
    }
  }

  // ---- Save e-wallet ----
  const saveEwallet = async (values: EwalletForm) => {
    try {
      const isEditing = editingAccountId !== null
      const url = isEditing ? `/api/agent/accounts/${editingAccountId}` : '/api/agent/accounts'
      const method = isEditing ? 'PATCH' : 'POST'
      const payload = {
        ...values,
        account_number: values.mobile_number,
        phone: values.mobile_number,
        email: user?.email || '',
        type: 'ewallet',
        is_primary: isEditing ? undefined : totalAccounts === 0,
      }
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.message || 'Failed to save e-wallet')
      }
      queryClient.invalidateQueries({ queryKey: ['agent-accounts'] })
      toast.success(isEditing ? 'E-wallet updated' : 'E-wallet saved')
      setEwalletOpen(false)
      setEditingAccountId(null)
      resetEwallet()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save e-wallet')
    }
  }

  // ---- Change password ----
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    if (pwNew.length < 12) {
      setPwError('New password must be at least 12 characters.')
      return
    }
    if (pwNew !== pwConfirm) {
      setPwError('New passwords do not match.')
      return
    }
    if (pwNew === pwCurrent) {
      setPwError('Choose a new password that differs from the current password.')
      return
    }
    setPwSaving(true)
    try {
      const res = await authFetch('/api/agent/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: pwCurrent,
          password: pwNew,
          password_confirmation: pwConfirm,
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.message || 'Failed to update password')
      toast.success('Password updated')
      setPwCurrent('')
      setPwNew('')
      setPwConfirm('')
      setPwShow({ current: false, new: false, confirm: false })
    } catch (err: any) {
      setPwError(err?.message || 'Failed to update password')
    } finally {
      setPwSaving(false)
    }
  }

  // ---- Computed values ----
  const isVerified = mockAccountVerified(documents)
  const emailVerified = mockEmailVerified(user)
  const uploadedCount = REQUIRED_DOCUMENTS.filter((rd) => findDocForType(rd.tag)).length
  const progressPct = (uploadedCount / REQUIRED_DOCUMENTS.length) * 100

  // Overall verification status (drives the documents summary row)
  const requiredTags = REQUIRED_DOCUMENTS.filter((d) => d.required).map((d) => d.tag.toLowerCase())
  const uploadedRequired = documents.filter((d) => requiredTags.includes(d.tag?.toLowerCase() ?? ''))
  const approvedRequired = uploadedRequired.filter((d) => (d.review_status ?? d.status) === 'approved')
  const overallStatus =
    approvedRequired.length === requiredTags.length
      ? { status: 'verified', label: 'Verified' }
      : uploadedRequired.length > 0
        ? { status: 'in review', label: 'In review' }
        : null

  // Ring badge:
  //  • Shield (green) — agent is active AND all required documents are uploaded
  //  • Warning (amber) — agent is not yet active OR at least one required document is missing
  // We check documents only after they've loaded (docsLoading=false) to avoid a
  // flash to the warning state while the fetch is in-flight.
  const isAgentActive = user?.status?.toLowerCase() === 'active'
  const allRequiredUploaded = !docsLoading && requiredTags.every(
    (tag) => !!findDocForType(tag)
  )
  const showShieldBadge = isAgentActive && allRequiredUploaded

  if (!user) {
    return (
      <div className="flex min-h-full flex-col space-y-4">
        <PortalContentHeader
          title="User settings"
          description="Manage your contact details, verification documents and payout methods."
        />
        <Skeleton />
      </div>
    )
  }

  return (
    <>
      <div className="flex min-h-full flex-col space-y-4">
        <PortalContentHeader
          title="User settings"
          description="Manage your contact details, verification documents and payout methods."
        />

        {/* ── Profile information (full-width panel) ── */}
        <section className="agent-dashboard__panel min-w-0 border-border p-5 sm:p-6" aria-labelledby="profile-title">
          {/* Panel header */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="profile-title" className="text-xl font-semibold tracking-tight text-[var(--text-main)]">
                Profile information
              </h2>
              <p className="mt-1 text-base text-[var(--text-sub)]">
                The details associated with your portal account.
              </p>
            </div>
            {!editing && (
              <ActionIcon
                label="Edit profile"
                hint="Edit profile"
                onClick={() => {
                  originalProfileRef.current = {
                    first_name: defaultFirstName,
                    last_name: defaultLastName,
                    phone: user?.phone ?? '',
                    designation: user?.designation ?? '',
                  }
                  setEditing(true)
                }}
                className="shrink-0"
              >
                <Pencil aria-hidden="true" />
              </ActionIcon>
            )}
          </div>

          {/* Avatar + identity row */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-5 border-b border-[var(--border)] pb-6 dark:border-[#3d4140]">
            <div className="flex min-w-0 items-center gap-5">
              {/* Avatar with optional shield badge */}
              <div className="group relative shrink-0">
                {profilePhotoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profilePhotoSrc}
                    alt={user?.name || 'Agent profile'}
                    className="size-20 rounded-full border border-[var(--field-border)] object-cover object-top dark:border-[#3d4140]"
                  />
                ) : (
                  <div className="flex size-20 items-center justify-center rounded-full border border-[var(--field-border)] bg-[#006838] text-xl font-bold text-white dark:border-[#3d4140]">
                    {getInitials(user?.name)}
                  </div>
                )}
                {/* Photo change overlay */}
                <label
                  className={cn(
                    'absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100',
                    photoMutation.isPending && 'opacity-100'
                  )}
                  title="Change photo"
                >
                  {photoMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5" />
                  )}
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept={PHOTO_ACCEPT}
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (!PHOTO_ACCEPTED_TYPES.includes(file.type.toLowerCase())) {
                          setPhotoError('The photo must be a JPG, PNG, or WebP image')
                          return
                        }
                        if (file.size > PHOTO_MAX_BYTES) {
                          setPhotoError('The photo size must not exceed 2MB')
                          return
                        }
                        setPhotoError(null)
                        photoMutation.mutate(file)
                      }
                    }}
                  />
                </label>
                {/* Shield badge — active agent with all required docs = shield, otherwise = warning */}
                {showShieldBadge ? (
                  <span
                    aria-label="Active agent badge"
                    role="img"
                    className={cn(
                      'absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full border-2 border-white dark:border-[#282c29]',
                      accountType === 'advisor'
                        ? 'bg-[#006838] text-white'
                        : 'bg-white text-[#006838] ring-1 ring-[var(--field-border)] dark:bg-[#282c29] dark:text-[#d0e3c8]'
                    )}
                  >
                    <ShieldCheck className="size-4" aria-hidden="true" />
                  </span>
                ) : (
                  <span
                    aria-label="Account pending or incomplete"
                    role="img"
                    title={!isAgentActive ? `Account status: ${user?.status ?? 'pending'}` : 'Required documents missing'}
                    className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full border-2 border-white bg-[#fef9c3] text-[#854d0e] dark:border-[#282c29] dark:bg-[#713f12] dark:text-[#fde047]"
                  >
                    <AlertTriangle className="size-4" aria-hidden="true" />
                  </span>
                )}
              </div>

              {/* Name + role subtitle + photo actions */}
              <div className="min-w-0">
                <p className="text-xl font-semibold leading-tight text-[var(--text-main)]">{user?.name}</p>
                <p className="mt-1 text-base leading-5 text-[#006838]">
                  {accountType === 'advisor' ? 'Licensed agent' : 'Referral partner'}
                  {user?.designation ? (
                    <> · <span className="text-[#006838]">{user.designation}</span></>
                  ) : (
                    <> · <span className="text-[#006838]">{accountType === 'advisor' ? 'advisor' : 'partner'}</span></>
                  )}
                </p>
                <div className="mt-1.5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={photoMutation.isPending}
                    className="block text-left text-xs font-semibold text-[#006838] underline underline-offset-4 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8]"
                  >
                    {photoMutation.isPending ? 'Uploading…' : 'Change photo'}
                  </button>
                  {Boolean(rawPhotoUrl) && (
                    <button
                      type="button"
                      onClick={() => setPhotoRemoveOpen(true)}
                      className="text-xs font-semibold text-[var(--text-muted)] underline underline-offset-4 hover:text-[#dc2626] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-[#006838]"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {photoError && (
                  <p role="alert" aria-live="assertive" className="mt-1 text-sm text-[#dc2626] dark:text-red-300">
                    {photoError}
                  </p>
                )}
              </div>
            </div>

            {/* Account type — segmented control */}
            <div
              role="group"
              aria-label="Preview account type"
              className="flex rounded-md border border-[var(--border)] p-1 dark:border-[#3d4140]"
            >
              <button
                type="button"
                aria-pressed={accountType === 'advisor'}
                className={cn(
                  'min-h-10 rounded px-3 text-base font-semibold focus-visible:outline-2 focus-visible:outline-[#006838]',
                  accountType === 'advisor' ? 'bg-[#006838] text-white' : 'text-[#006838] dark:text-[#d0e3c8]'
                )}
              >
                Agent / advisor
              </button>
              <button
                type="button"
                aria-pressed={accountType === 'referral'}
                className={cn(
                  'min-h-10 rounded px-3 text-base font-semibold focus-visible:outline-2 focus-visible:outline-[#006838]',
                  accountType === 'referral' ? 'bg-[#006838] text-white' : 'text-[#006838] dark:text-[#d0e3c8]'
                )}
              >
                Referral partner
              </button>
            </div>
          </div>

          {/* Profile fields (read-only fact grid) */}
          {!editing && (
            <div className="mt-7 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm text-[var(--text-sub)]">First name</p>
                <p className="mt-1 font-semibold text-[var(--text-main)]">{defaultFirstName || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--text-sub)]">Last name</p>
                <p className="mt-1 font-semibold text-[var(--text-main)]">{defaultLastName || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--text-sub)]">Email</p>
                <p className="mt-1 flex items-center gap-1.5 break-all font-semibold text-[var(--text-main)]">
                  <span>{user?.email}</span>
                  {emailVerified && (
                    <CheckCircle2
                      className="size-4 shrink-0 text-[#006838] dark:text-[#d0e3c8]"
                      aria-label="Email verified"
                    />
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--text-sub)]">Phone</p>
                <p className="mt-1 font-semibold text-[var(--text-main)]">
                  {formatPhoneDisplay(user?.phone) || '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--text-sub)]">Your background</p>
                <p className="mt-1 font-semibold text-[var(--text-main)]">
                  {user?.designation || 'Not selected'}
                </p>
              </div>
            </div>
          )}

          {/* Profile edit form */}
          {editing && (
            <form onSubmit={handleProfile(saveProfile)} noValidate className="mt-7 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="First name" error={profileErrors.first_name?.message} required>
                  <input
                    type="text"
                    autoComplete="given-name"
                    aria-invalid={!!profileErrors.first_name}
                    className="ui-form-field"
                    {...regProfile('first_name')}
                  />
                </Field>
                <Field label="Last name" error={profileErrors.last_name?.message} required>
                  <input
                    type="text"
                    autoComplete="family-name"
                    aria-invalid={!!profileErrors.last_name}
                    className="ui-form-field"
                    {...regProfile('last_name')}
                  />
                </Field>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Phone" error={profileErrors.phone?.message}>
                  <input
                    type="tel"
                    autoComplete="tel"
                    aria-invalid={!!profileErrors.phone}
                    className="ui-form-field"
                    placeholder="+63 917 123 4567"
                    {...regProfile('phone')}
                  />
                </Field>
                <Field label="Designation" error={profileErrors.designation?.message}>
                  <input
                    type="text"
                    autoComplete="organization-title"
                    aria-invalid={!!profileErrors.designation}
                    className="ui-form-field"
                    placeholder="e.g. Senior Agent"
                    {...regProfile('designation')}
                  />
                </Field>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={profileSubmitting}
                  className="btn-primary text-sm"
                >
                  {profileSubmitting ? 'Saving…' : 'Save changes'}
                </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetProfile({
                        first_name: defaultFirstName,
                        last_name: defaultLastName,
                        phone: user?.phone ?? '',
                        designation: user?.designation ?? '',
                      })
                      setEditing(false)
                    }}
                    className="btn-secondary text-sm"
                  >
                    Cancel
                  </button>
              </div>
            </form>
          )}
        </section>

        {/* ── Update password ── */}
        <section
          className="agent-dashboard__panel min-w-0 border-border p-5 sm:p-6"
          aria-labelledby="password-title"
        >
          <h2 id="password-title" className="text-xl font-semibold tracking-tight text-[var(--text-main)]">
            Update password
          </h2>
          <p className="mt-1 text-base text-[var(--text-sub)]">
            Use a unique password with at least 12 characters.
          </p>
          <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <PasswordField
                id="agent-current-password"
                label="Current password"
                value={pwCurrent}
                onChange={setPwCurrent}
                show={pwShow.current}
                onToggleShow={() => setPwShow((s) => ({ ...s, current: !s.current }))}
                autoComplete="current-password"
              />
              <PasswordField
                id="agent-new-password"
                label="New password"
                value={pwNew}
                onChange={setPwNew}
                show={pwShow.new}
                onToggleShow={() => setPwShow((s) => ({ ...s, new: !s.new }))}
                autoComplete="new-password"
                minLength={12}
              />
              <PasswordField
                id="agent-confirm-password"
                label="Confirm new password"
                value={pwConfirm}
                onChange={setPwConfirm}
                show={pwShow.confirm}
                onToggleShow={() => setPwShow((s) => ({ ...s, confirm: !s.confirm }))}
                autoComplete="new-password"
                minLength={12}
              />
            </div>
            {pwError && (
              <p role="alert" className="text-sm text-[#dc2626] dark:text-red-300">
                {pwError}
              </p>
            )}
            <button type="submit" disabled={pwSaving} className="btn-primary">
              {pwSaving ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </section>

        {/* ── Two-column grid: documents + payment ── */}
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)]">
          {/* Left: Verification documents */}
          <section className="agent-dashboard__panel min-w-0 border-border p-5 sm:p-6" aria-labelledby="documents-title">
            <h2 id="documents-title" className="text-xl font-semibold tracking-tight text-[var(--text-main)]">
              Verification documents
            </h2>
            <p className="mt-1 text-base text-[var(--text-sub)]">
              Add and manage the documents needed to verify your agent account.
            </p>

            {/* Summary row */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-md bg-[var(--subtle)] p-4">
              <div className="flex items-center gap-4">
                <p className="text-sm font-semibold text-[var(--text-main)]">
                  {uploadedCount} of {REQUIRED_DOCUMENTS.length} uploaded
                </p>
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-[var(--border)]">
                  <div
                    className="h-full rounded-full bg-[#006838] transition-[width] duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
              {overallStatus ? (
                <StatusBadge status={overallStatus.status} label={overallStatus.label} />
              ) : (
                <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold bg-[var(--subtle)] text-[var(--text-muted)]">
                  Incomplete
                </span>
              )}
            </div>

            {/* Document rows or loading/error */}
            {docsError ? (
              <div className="mt-6 flex flex-col items-center gap-3 rounded-md border border-[var(--border)] py-12 text-center">
                <p className="text-sm text-[var(--text-sub)]">Failed to load documents.</p>
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
                  const uploaded = findDocForType(reqDoc.tag)
                  return (
                    <DocumentRow
                      key={reqDoc.tag}
                      doc={reqDoc}
                      uploaded={uploaded}
                      onAdd={() => openDocDialog(reqDoc)}
                      onView={() => uploaded && setViewingDoc({ file: uploaded, docType: reqDoc.type })}
                      onDropFile={handleDocDropFile}
                    />
                  )
                })}
              </div>
            )}
            <p className="mt-4 text-base leading-6 text-[var(--text-sub)]">{FILE_RULES}</p>
          </section>

          {/* Right: Payment details */}
          <section
            className="agent-dashboard__panel min-w-0 border-border self-start p-5 sm:p-6"
            aria-labelledby="payment-title"
          >
            <h2 id="payment-title" className="text-xl font-semibold tracking-tight text-[var(--text-main)]">
              Payment details
            </h2>
            <p className="mt-1 text-base leading-6 text-[var(--text-sub)]">
              Set up a bank account or e-wallet for payouts.
            </p>

            {/* Info callout */}
            <InfoCallout>Commission payouts are sent to your primary payment method.</InfoCallout>

            {accountsError ? (
              <div className="mt-6 flex flex-col items-center gap-3 rounded-md border border-[var(--border)] py-12 text-center">
                <p className="text-sm text-[var(--text-sub)]">Failed to load payment methods.</p>
                <button
                  type="button"
                  onClick={() => refetchAccounts()}
                  className="text-sm font-semibold text-[#006838] hover:underline focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8]"
                >
                  Try again
                </button>
              </div>
            ) : accountsLoading ? (
              <div className="mt-6 space-y-4" aria-busy="true">
                <div className="skeleton h-20 rounded" />
                <div className="skeleton h-20 rounded" />
              </div>
            ) : totalAccounts === 0 ? (
              /* Empty state */
              <div className="mt-6 flex flex-col items-center justify-center rounded-md border border-dashed border-[var(--border)] py-12 text-center">
                <Wallet className="size-10 text-[var(--text-muted)]" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium text-[var(--text-sub)]">
                  No payout methods added yet.
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Add a bank account or e-wallet to receive commission payouts.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={openCreateBank}
                    className="btn-primary text-sm"
                  >
                    Add bank
                  </button>
                  <button
                    type="button"
                    onClick={openCreateEwallet}
                    className="btn-secondary text-sm"
                  >
                    Add e-wallet
                  </button>
                </div>
              </div>
            ) : (
              /* Add buttons + method cards */
              <>
                <div className="mt-6 flex gap-2">
                  <button type="button" onClick={openCreateBank} className="btn-primary text-sm">
                    Add bank
                  </button>
                  <button type="button" onClick={openCreateEwallet} className="btn-secondary text-sm">
                    Add e-wallet
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  {bankDetails.map((b) => (
                    <PaymentMethodCard
                      key={b.id}
                      title={b.bank_name}
                      typeTag="Bank"
                      accountName={b.account_name}
                      accountNumber={maskAccountNumber(b.account_number)}
                      isPrimary={b.is_primary}
                      totalAccounts={totalAccounts}
                      onSetPrimary={() => setPrimaryMutation.mutate(b.id)}
                      onEdit={() => openEditBank(b)}
                      onRemove={() => setPaymentRemoveId(b.id)}
                    />
                  ))}
                  {ewallets.map((e) => (
                    <PaymentMethodCard
                      key={e.id}
                      title={normalizeProvider(e.provider)}
                      typeTag="E-wallet"
                      accountName={e.account_name}
                      accountNumber={maskAccountNumber(e.account_number || e.phone || e.mobile_number || '')}
                      isPrimary={e.is_primary}
                      totalAccounts={totalAccounts}
                      onSetPrimary={() => setPrimaryMutation.mutate(e.id)}
                      onEdit={() => openEditEwallet(e)}
                      onRemove={() => setPaymentRemoveId(e.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {/* ---- File viewer modal ---- */}
      <FileViewerModal
        file={viewingDoc?.file ?? null}
        docType={viewingDoc?.docType ?? ''}
        onClose={() => setViewingDoc(null)}
        authFetch={authFetch}
      />

      {/* ---- Document upload dialog ---- */}
      <Modal
        open={docDialogDoc !== null}
        onClose={closeDocDialog}
        title={docDialogDoc?.type ?? 'Add document'}
        subtitle="Choose a file for this document type."
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="document-file" className="mb-2 block text-sm font-medium text-[var(--text-sub)]">
              File
            </label>
            <input
              id="document-file"
              ref={docFileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              required
              onChange={(e) => setDocFile(e.target.files?.[0] || null)}
              className="ui-form-field block w-full text-sm file:mr-4 file:border-0 file:bg-[#e6f2e8] file:px-4 file:py-3 file:font-semibold file:text-[#006838]"
            />
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              JPG, PNG, WEBP or PDF · maximum 5 MB
            </p>
            {uploadMutation.isError && (
              <p role="alert" aria-live="assertive" className="mt-2 text-sm text-[#dc2626] dark:text-red-300">
                {uploadMutation.error?.message || 'Upload failed — please try again'}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={submitDoc}
              disabled={!docFile || uploadMutation.isPending}
              className="btn-primary flex-1 text-sm"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Uploading…
                </>
              ) : docDialogDoc && findDocForType(docDialogDoc.tag) ? (
                'Replace document'
              ) : (
                'Add document'
              )}
            </button>
            <button
              type="button"
              onClick={closeDocDialog}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* ---- Bank account dialog ---- */}
      <Modal
        open={bankOpen}
        onClose={() => {
          setBankOpen(false)
          setEditingAccountId(null)
          resetBank()
        }}
        title={editingAccountId !== null ? 'Edit bank account' : 'Add bank account'}
      >
        <form onSubmit={handleBank(saveBank)} noValidate className="space-y-4">
          <Field label="Bank name" error={bankErrors.bank_name?.message} required>
            <input
              type="text"
              className="ui-form-field"
              placeholder="e.g. BDO, BPI, UnionBank"
              {...regBank('bank_name')}
            />
          </Field>
          <Field label="Account number" error={bankErrors.account_number?.message} required>
            <input
              type="text"
              inputMode="numeric"
              className="ui-form-field"
              placeholder="Enter account number"
              {...regBank('account_number')}
            />
          </Field>
          <Field label="Account name" error={bankErrors.account_name?.message} required>
            <input
              type="text"
              className="ui-form-field"
              placeholder="Name as it appears on the account"
              {...regBank('account_name')}
            />
          </Field>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={bankSubmitting} className="btn-primary flex-1 text-sm">
              {bankSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Saving…
                </>
              ) : editingAccountId !== null ? (
                'Save changes'
              ) : (
                'Save bank account'
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setBankOpen(false)
                setEditingAccountId(null)
                resetBank()
              }}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* ---- E-wallet dialog ---- */}
      <Modal
        open={ewalletOpen}
        onClose={() => {
          setEwalletOpen(false)
          setEditingAccountId(null)
          resetEwallet()
        }}
        title={editingAccountId !== null ? 'Edit e-wallet' : 'Add e-wallet'}
      >
        <form onSubmit={handleEwallet(saveEwallet)} noValidate className="space-y-4">
          <Field label="Provider" error={ewalletErrors.provider?.message} required>
            <select className="ui-form-field" {...regEwallet('provider')}>
              <option value="">Select provider…</option>
              {['GCash', 'Maya', 'ShopeePay', 'GrabPay'].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Mobile number" error={ewalletErrors.mobile_number?.message} required>
            <input
              type="tel"
              inputMode="numeric"
              className="ui-form-field"
              placeholder="09XXXXXXXXX"
              {...regEwallet('mobile_number')}
            />
          </Field>
          <Field label="Account name" error={ewalletErrors.account_name?.message} required>
            <input
              type="text"
              className="ui-form-field"
              placeholder="Name registered to this number"
              {...regEwallet('account_name')}
            />
          </Field>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={ewalletSubmitting} className="btn-primary flex-1 text-sm">
              {ewalletSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Saving…
                </>
              ) : editingAccountId !== null ? (
                'Save changes'
              ) : (
                'Save e-wallet'
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setEwalletOpen(false)
                setEditingAccountId(null)
                resetEwallet()
              }}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* ---- Confirm: remove photo ---- */}
      <ConfirmDialog
        open={photoRemoveOpen}
        onClose={() => setPhotoRemoveOpen(false)}
        title="Remove profile photo"
        message="Are you sure you want to remove your profile photo? This action cannot be undone."
        confirmLabel="Remove photo"
        onConfirm={() => deletePhotoMutation.mutate()}
        isLoading={deletePhotoMutation.isPending}
        danger
      />

      {/* ---- Confirm: remove payment method ---- */}
      <ConfirmDialog
        open={paymentRemoveId !== null}
        onClose={() => setPaymentRemoveId(null)}
        title="Remove payment method"
        message={
          bankDetails.find((b) => b.id === paymentRemoveId)?.is_primary ||
          ewallets.find((e) => e.id === paymentRemoveId)?.is_primary
            ? 'This is your primary payout method. Removing it means you will need to set another method as primary. Are you sure?'
            : 'Are you sure you want to remove this payment method? This action cannot be undone.'
        }
        confirmLabel="Remove"
        onConfirm={() => {
          if (paymentRemoveId !== null) deleteAccountMutation.mutate(paymentRemoveId)
        }}
        isLoading={deleteAccountMutation.isPending}
        danger
      />
    </>
  )
}
