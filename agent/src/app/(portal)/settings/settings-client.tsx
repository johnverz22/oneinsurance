'use client'

import { useRef, useState, useEffect } from 'react'
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
  Trash2,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  Wallet,
  Pencil,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAgentUser, useAgentAuthStore } from '@/store/agent-auth-store'
import { cn, getInitials } from '@/lib/utils'
import { useAuthFetch } from '@/hooks/use-auth-fetch'
import { useAuthenticatedImage } from '@/hooks/use-authenticated-image'
import { PortalContentHeader } from '@/components/layout/portal-content-header'
import { StatusBadge } from '@/components/ui/status-badge'
import type { AgentFile } from '@/types/agent/profile'

// ============================================================
// Schemas
// ============================================================
const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
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

const FILE_RULES = 'One file per type. Accepted formats: JPG, PNG, WEBP, PDF — maximum 10 MB per file.'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

// ============================================================
// Mock adapter for missing backend fields
// ============================================================
// BACKEND REQUIREMENTS (these fields are currently mocked):
// 1. AgentUser.email_verified_at: string | null — email verification timestamp
// 2. AgentUser.is_verified: boolean — account verification status
// 3. AgentFile.file_size: number — file size in bytes
// 4. AgentFile.rejection_reason: string | null — reason for rejection

function mockEmailVerified(user: { email?: string } | null): boolean {
  // Mock: assume email is verified for all logged-in users
  return !!user?.email
}

function mockAccountVerified(documents: AgentFile[]): boolean {
  // Mock: account is verified if at least one document is approved
  return documents.some((d) => d.status === 'approved')
}

function mockRejectionReason(doc: AgentFile): string {
  // Mock: no rejection reason available from backend
  return (doc as any)?.rejection_reason ?? ''
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
  if (!num || num.length <= 4) return num
  return `ending ${num.slice(-4)}`
}

function normalizeProvider(name: string): string {
  const lower = name.toLowerCase()
  if (lower === 'gcash') return 'GCash'
  if (lower === 'maya') return 'Maya'
  if (lower === 'shopeepay') return 'ShopeePay'
  if (lower === 'grabpay') return 'GrabPay'
  return name
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

function DocStatusPill({ status }: { status: AgentFile['status'] | undefined }) {
  if (!status) return null
  if (status === 'approved') return <StatusBadge status="approved" />
  if (status === 'pending') return <StatusBadge status="pending" label="Pending review" />
  if (status === 'rejected') return <StatusBadge status="rejected" />
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
  accountNumberLabel,
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
  accountNumberLabel: string
  accountNumber: string
  isPrimary: boolean
  totalAccounts: number
  onSetPrimary: () => void
  onEdit: () => void
  onRemove: () => void
}) {
  return (
    <div className="rounded-md border border-[var(--border)] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <strong className="text-base text-[var(--text-main)]">{title}</strong>
        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-[var(--subtle)] text-[var(--text-muted)]">
          {typeTag}
        </span>
        {isPrimary && <StatusBadge variant="success" label="Primary" icon={null} />}
      </div>
      <div className="mt-3 space-y-2">
        <div>
          <p className="text-xs text-[var(--text-muted)]">Account name</p>
          <p className="text-sm font-medium text-[var(--text-main)]">{accountName}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)]">{accountNumberLabel}</p>
          <p className="text-sm font-medium tracking-wider text-[var(--text-main)]">{accountNumber}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        {!isPrimary && totalAccounts > 1 && (
          <button
            type="button"
            onClick={onSetPrimary}
            className="inline-flex min-h-9 items-center text-xs font-semibold text-[#006838] hover:underline focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8]"
          >
            Set as primary
          </button>
        )}
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-[var(--text-sub)] hover:text-[#006838] focus-visible:outline-2 focus-visible:outline-[#006838] dark:hover:text-[#d0e3c8]"
        >
          <Pencil className="size-3" aria-hidden="true" /> Edit
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-[var(--text-muted)] hover:text-[#dc2626] focus-visible:outline-2 focus-visible:outline-[#006838]"
        >
          <Trash2 className="size-3" aria-hidden="true" /> Remove
        </button>
      </div>
    </div>
  )
}

function DocumentRow({
  doc,
  uploaded,
  onAdd,
  onRemove,
  onView,
  onDropFile,
  removeLoading,
}: {
  doc: RequiredDoc
  uploaded: AgentFile | undefined
  onAdd: () => void
  onRemove: () => void
  onView: () => void
  onDropFile: (file: File, tag: string) => void
  removeLoading: boolean
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      setError('File must be 10 MB or smaller')
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
        'flex flex-col gap-4 py-4 sm:flex-row sm:items-start sm:justify-between',
        isDragging && 'rounded-lg bg-[#e2eddb] ring-2 ring-[#006838] ring-inset dark:bg-[#1a2e1f]'
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-[var(--text-main)]">{doc.type}</h3>
          <RequiredTag required={doc.required} />
        </div>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{doc.description}</p>
        {uploaded ? (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="text-sm text-[var(--text-sub)]">Uploaded</p>
            <DocStatusPill status={uploaded.status} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-[var(--text-muted)]">No file added</p>
        )}
        {uploaded?.status === 'rejected' && mockRejectionReason(uploaded) && (
          <p className="mt-1 text-xs text-[#dc2626] dark:text-red-300">
            Reason: {mockRejectionReason(uploaded)}
          </p>
        )}
        {error && (
          <p role="alert" aria-live="assertive" className="mt-2 text-sm text-[#dc2626] dark:text-red-300">
            {error}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 sm:flex-nowrap">
        {uploaded?.id && (
          <button
            type="button"
            onClick={onView}
            className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-[var(--field-border)] px-4 text-sm font-semibold text-[#006838] focus-visible:outline-2 focus-visible:outline-[#006838] sm:w-auto dark:text-[#d0e3c8]"
          >
            <Eye className="mr-1.5 size-4" aria-hidden="true" />
            View
          </button>
        )}
        {uploaded && (
          <button
            type="button"
            onClick={onRemove}
            disabled={removeLoading}
            className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-[var(--field-border)] px-4 text-sm font-semibold text-[var(--text-muted)] hover:text-[#dc2626] focus-visible:outline-2 focus-visible:outline-[#006838] disabled:opacity-60 sm:w-auto"
            aria-label={`Remove ${doc.type}`}
          >
            <Trash2 className="mr-1.5 size-4" aria-hidden="true" />
            Remove
          </button>
        )}
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-[var(--field-border)] px-4 text-sm font-semibold text-[#006838] focus-visible:outline-2 focus-visible:outline-[#006838] sm:w-auto dark:text-[#d0e3c8]"
        >
          <Upload className="mr-1.5 size-4" aria-hidden="true" />
          {uploaded ? 'Replace' : 'Add file'}
        </button>
      </div>
    </div>
  )
}

// ============================================================
// Skeleton
// ============================================================
function Skeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <div className="skeleton size-10 rounded-full" />
        <div className="skeleton h-8 w-48 rounded" />
      </div>
      {/* Profile panel */}
      <section className="portal-page-card p-5 sm:p-6">
        <div className="skeleton h-6 w-48 rounded" />
        <div className="skeleton mt-4 h-4 w-72 rounded" />
        <div className="mt-6 flex items-center gap-5 border-b border-[var(--border)] pb-6">
          <div className="skeleton size-20 shrink-0 rounded-full" />
          <div className="space-y-3">
            <div className="skeleton h-5 w-40 rounded" />
            <div className="skeleton h-4 w-28 rounded" />
            <div className="skeleton h-4 w-32 rounded" />
          </div>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-5 w-40 max-w-full rounded" />
            </div>
          ))}
        </div>
      </section>
      {/* Two-column grid */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)]">
        <section className="portal-page-card p-5 sm:p-6">
          <div className="skeleton h-6 w-52 rounded" />
          <div className="skeleton mt-3 h-4 w-72 rounded" />
          <div className="skeleton mt-5 h-12 w-full rounded" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton mt-4 h-20 rounded" />
          ))}
        </section>
        <section className="portal-page-card self-start p-5 sm:p-6">
          <div className="skeleton h-6 w-36 rounded" />
          <div className="skeleton mt-3 h-4 w-full rounded" />
          <div className="skeleton mt-5 h-11 w-40 rounded" />
        </section>
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
  if (!open) return null
  const widthClass =
    size === 'xl' ? 'max-w-4xl' :
    size === 'lg' ? 'max-w-2xl' :
    'max-w-md'
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={`w-full ${widthClass} rounded-lg bg-[var(--card)] p-6 shadow-xl`}>
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h3 id="modal-title" className="text-base font-semibold text-[var(--text-main)]">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--subtle)] focus-visible:outline-2 focus-visible:outline-[#006838]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
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
  const queryClient = useQueryClient()
  const authFetch = useAuthFetch()

  // ---- State ----
  const [editing, setEditing] = useState(false)
  const [bankOpen, setBankOpen] = useState(false)
  const [ewalletOpen, setEwalletOpen] = useState(false)
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  // Fetch the profile photo through the authenticated proxy so the
  // Authorization header is sent — plain <img src> cannot do this.
  const profilePhotoSrc = useAuthenticatedImage(
    user?.profile_photo_url || (user as any)?.avatar || null
  )

  // Document dialog state
  const [docDialogDoc, setDocDialogDoc] = useState<RequiredDoc | null>(null)
  const [docFile, setDocFile] = useState<File | null>(null)
  const docFileInputRef = useRef<HTMLInputElement>(null)

  // Document viewer state
  const [viewingDoc, setViewingDoc] = useState<{ file: AgentFile; docType: string } | null>(null)

  // Confirm dialog state
  const [photoRemoveOpen, setPhotoRemoveOpen] = useState(false)
  const [paymentRemoveId, setPaymentRemoveId] = useState<number | null>(null)

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
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.message || 'Failed to upload photo')
      }
      return res.json()
    },
    onSuccess: (data) => {
      const url = data?.data?.profile_photo_url
      if (url) updateUser({ profile_photo_url: url })
      toast.success('Profile photo updated')
      if (photoInputRef.current) photoInputRef.current.value = ''
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to upload profile photo'),
  })

  // ---- Photo delete mutation ----
  const deletePhotoMutation = useMutation({
    mutationFn: async () => {
      const res = await authFetch('/api/agent/profile/photo', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete photo')
      return res.json()
    },
    onSuccess: () => {
      updateUser({ profile_photo_url: undefined })
      toast.success('Profile photo removed')
      setPhotoRemoveOpen(false)
    },
    onError: () => toast.error('Failed to delete photo'),
  })

  // ---- Profile form ----
  const {
    register: regProfile,
    handleSubmit: handleProfile,
    reset: resetProfile,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', phone: user?.phone ?? '' },
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
      // file_name is intentionally omitted — the upload route generates
      // an opaque name of the form "<tag>__<random_hex>.<ext>" server-side.
      form.append('tag', tag)
      const res = await authFetch('/api/agent/files/upload', { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.message || 'Upload failed')
      }
      return res.json()
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

  // ---- Document delete mutation ----
  const deleteDocMutation = useMutation({
    mutationFn: async (id: number | string) => {
      const res = await authFetch(`/api/agent/files/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete document')
      return res.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['agent-files'] })
      await queryClient.refetchQueries({ queryKey: ['agent-files'] })
      toast.success('Document removed')
    },
    onError: () => toast.error('Failed to remove document'),
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
    return documents.find((d) => d.tag?.toLowerCase() === tag.toLowerCase())
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
      toast.error('File must be 10 MB or smaller')
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
    const res = await authFetch('/api/agent/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (!res.ok) throw new Error('Failed to save profile')
    updateUser(values)
    toast.success('Profile updated successfully')
    setEditing(false)
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

  // ---- Computed values ----
  const isVerified = mockAccountVerified(documents)
  const emailVerified = mockEmailVerified(user)
  const uploadedCount = REQUIRED_DOCUMENTS.filter((rd) => findDocForType(rd.tag)).length
  const progressPct = (uploadedCount / REQUIRED_DOCUMENTS.length) * 100

  // Overall verification status
  const requiredTags = REQUIRED_DOCUMENTS.filter((d) => d.required).map((d) => d.tag.toLowerCase())
  const uploadedRequired = documents.filter((d) => requiredTags.includes(d.tag?.toLowerCase() ?? ''))
  const approvedRequired = uploadedRequired.filter((d) => d.status === 'approved')
  const overallStatus =
    approvedRequired.length === requiredTags.length
      ? { status: 'verified', label: 'Verified' }
      : uploadedRequired.length > 0
        ? { status: 'in review', label: 'In review' }
        : null

  if (!user) return <Skeleton />

  return (
    <>
      <div className="flex min-h-full flex-col space-y-6">
        <PortalContentHeader
          title="User settings"
          description="Manage your contact details, verification documents and payout methods."
        />

        {/* ── Profile information (full-width panel) ── */}
        <section className="portal-page-card p-5 sm:p-6" aria-labelledby="profile-title">
          {/* Panel header */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="profile-title" className="text-xl font-semibold tracking-tight text-[var(--text-main)]">
                Profile information
              </h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                The details associated with your portal account.
              </p>
            </div>
            {!editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="btn-primary text-sm"
              >
                Edit profile
              </button>
            )}
          </div>

          {/* Avatar + identity row */}
          <div className="mt-6 flex flex-wrap items-start justify-between gap-5 border-b border-[var(--border)] pb-6">
            <div className="flex min-w-0 items-center gap-5">
              {/* Avatar with optional shield badge */}
              <div className="relative shrink-0">
                {profilePhotoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profilePhotoSrc}
                    alt={user?.name || 'Agent profile'}
                    className="size-20 rounded-full border border-[var(--field-border)] object-cover object-top"
                  />
                ) : (
                  <div className="flex size-20 items-center justify-center rounded-full border border-[var(--field-border)] bg-[#006838] text-xl font-bold text-white">
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
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error('Photo must be 5 MB or smaller')
                          return
                        }
                        photoMutation.mutate(file)
                      }
                    }}
                  />
                </label>
                {/* Shield badge — only when verified */}
                {isVerified ? (
                  <span
                    aria-label="Verified account badge"
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
                    aria-label="Verification incomplete"
                    role="img"
                    title="Verification incomplete"
                    className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full border-2 border-white bg-[#fef9c3] text-[#854d0e] dark:border-[#282c29] dark:bg-[#713f12] dark:text-[#fde047]"
                  >
                    <AlertTriangle className="size-4" aria-hidden="true" />
                  </span>
                )}
              </div>

              {/* Name + role subtitle + photo actions */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-[var(--text-main)]">{user?.name}</p>
                  {user?.status && <StatusBadge status={user.status} />}
                </div>
                <p className="mt-1 text-sm font-medium text-[#006838] dark:text-[#d0e3c8]">
                  {accountType === 'advisor' ? 'Licensed agent / advisor' : 'Referral partner'}
                </p>
                <div className="mt-1.5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="inline-flex min-h-9 items-center text-xs font-semibold text-[var(--text-sub)] hover:text-[#006838] focus-visible:outline-2 focus-visible:outline-[#006838] dark:hover:text-[#d0e3c8]"
                  >
                    Change photo
                  </button>
                  {Boolean(user?.profile_photo_url || (user as any)?.avatar) && (
                    <button
                      type="button"
                      onClick={() => setPhotoRemoveOpen(true)}
                      className="inline-flex min-h-9 items-center text-xs font-semibold text-[var(--text-muted)] hover:text-[#dc2626] focus-visible:outline-2 focus-visible:outline-[#006838]"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {photoMutation.isError && (
                  <p role="alert" className="mt-1 text-sm text-[#dc2626] dark:text-red-300">
                    Failed to upload photo
                  </p>
                )}
              </div>
            </div>

            {/* Account type — read-only segmented control */}
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[var(--text-muted)]">Account type</span>
              <div
                className="flex w-fit rounded-md border border-[var(--field-border)] p-1 opacity-80"
                title="Account type is managed by your administrator"
              >
                <span
                  className={cn(
                    'inline-flex min-h-9 items-center rounded px-3 text-xs font-semibold',
                    accountType === 'advisor' ? 'bg-[#006838] text-white' : 'text-[var(--text-muted)]'
                  )}
                >
                  Agent / advisor
                </span>
                <span
                  className={cn(
                    'inline-flex min-h-9 items-center rounded px-3 text-xs font-semibold',
                    accountType === 'referral' ? 'bg-[#006838] text-white' : 'text-[var(--text-muted)]'
                  )}
                >
                  Referral partner
                </span>
              </div>
            </div>
          </div>

          {/* Profile fields (read-only) */}
          {!editing && (
            <div className="mt-7 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm text-[var(--text-muted)]">Full name</p>
                <p className="mt-1 font-semibold text-[var(--text-main)]">{user?.name}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Email</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <p className="break-all font-semibold text-[var(--text-main)]">{user?.email}</p>
                  {emailVerified && (
                    <CheckCircle2
                      className="size-4 shrink-0 text-[#006838] dark:text-[#d0e3c8]"
                      aria-label="Email verified"
                    />
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Phone</p>
                <p className="mt-1 font-semibold text-[var(--text-main)]">
                  {formatPhoneDisplay(user?.phone)}
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Agent code</p>
                <p className="mt-1 font-semibold text-[var(--text-main)]">
                  {agentCode ?? '—'}
                </p>
              </div>
            </div>
          )}

          {/* Profile edit form */}
          {editing && (
            <form onSubmit={handleProfile(saveProfile)} noValidate className="mt-7 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Full name" error={profileErrors.name?.message} required>
                  <input
                    type="text"
                    autoComplete="name"
                    aria-invalid={!!profileErrors.name}
                    className="ui-form-field"
                    {...regProfile('name')}
                  />
                </Field>
                <Field label="Phone" error={profileErrors.phone?.message} required>
                  <input
                    type="tel"
                    autoComplete="tel"
                    aria-invalid={!!profileErrors.phone}
                    className="ui-form-field"
                    {...regProfile('phone')}
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
                    resetProfile({ name: user?.name ?? '', phone: user?.phone ?? '' })
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

        {/* ── Two-column grid: documents + payment ── */}
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)]">
          {/* Left: Verification documents */}
          <section className="portal-page-card min-w-0 p-5 sm:p-6" aria-labelledby="documents-title">
            <h2 id="documents-title" className="text-xl font-semibold tracking-tight text-[var(--text-main)]">
              Verification documents
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Add and manage the documents needed to verify your agent account.
            </p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">{FILE_RULES}</p>

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
                      onRemove={() => deleteDocMutation.mutate(uploaded!.id)}
                      onView={() => uploaded && setViewingDoc({ file: uploaded, docType: reqDoc.type })}
                      onDropFile={handleDocDropFile}
                      removeLoading={deleteDocMutation.isPending}
                    />
                  )
                })}
              </div>
            )}
          </section>

          {/* Right: Payment details */}
          <section
            className="portal-page-card min-w-0 self-start p-5 sm:p-6"
            aria-labelledby="payment-title"
          >
            <h2 id="payment-title" className="text-xl font-semibold tracking-tight text-[var(--text-main)]">
              Payment details
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
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
                      accountNumberLabel="Account number"
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
                      accountNumberLabel="Mobile number"
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
              JPG, PNG, WEBP or PDF · maximum 10 MB
            </p>
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
