'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { getInitials } from '@/lib/utils'
import type { AdminUser } from '@/types/admin/auth'
import {
  useAdminUser,
  useAdminAuthStore,
  useHasHydrated,
} from '@/store/admin-auth-store'
import { useAuthFetch } from '@/hooks/use-auth-fetch'
import { useAuthenticatedImage } from '@/hooks/use-authenticated-image'
import { PortalContentHeader } from '@/components/layout/portal-content-header'
import { Skeleton } from '@/components/ui/skeleton'

// ============================================================
// Schema
// ============================================================
const profileSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email('Enter a valid email address').optional(),
  phone: z.string().optional(),
  designation: z.string().optional(),
})
type ProfileForm = z.infer<typeof profileSchema>

// ============================================================
// Types
// ============================================================
/** Profile photo object returned by the API (admin user's own photo) */
type ProfilePhoto = {
  id: number
  mime_type: string
  updated_at: string
  /** Proxy URL with cache-busting query string, e.g. /api/admin/profile/photo?v=42 */
  url: string
}

/** Full admin profile as returned by GET /api/admin/users/[id]. */
type AdminProfileDetails = {
  id: number
  first_name?: string | null
  last_name?: string | null
  name?: string | null
  email?: string | null
  phone?: string | null
  telephone?: string | null
  role?: string | null
  designation?: string | null
  status?: string | null
  profile_photo?: ProfilePhoto | null
}

// ============================================================
// Helpers
// ============================================================
function splitName(fullName: string | null | undefined) {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean)
  return { first: parts[0] ?? '', last: parts.slice(1).join(' ') }
}

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

function SettingsSkeleton() {
  return (
    <section className="portal-page-card p-5 sm:p-6" aria-busy="true" aria-live="polite">
      <Skeleton className="h-6 w-44" />
      <Skeleton className="mt-2 h-4 w-64" />
      <div className="mt-6 flex items-center gap-5 border-b border-[var(--border)] pb-6">
        <Skeleton className="size-20 shrink-0 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-40 max-w-full" />
          </div>
        ))}
      </div>
    </section>
  )
}

// ============================================================
// Main component
// ============================================================
export function SettingsClient() {
  const user = useAdminUser()
  const hasHydrated = useHasHydrated()
  const updateUser = useAdminAuthStore((s) => s.updateUser)
  const authFetch = useAuthFetch()

  const isSuperadmin = user?.role === 'superadmin'

  const [details, setDetails] = useState<AdminProfileDetails | null>(null)
  const [detailsLoaded, setDetailsLoaded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [photoPending, setPhotoPending] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwShow, setPwShow] = useState({ current: false, new: false, confirm: false })
  const [pwError, setPwError] = useState('')
  const [pwNotice, setPwNotice] = useState('')
  const [pwSaving, setPwSaving] = useState(false)

  // Use profile_photo.url from details or the auth store — never the deprecated profile_photo_url.
  const profilePhotoSrc = useAuthenticatedImage(
    details?.profile_photo?.url ?? user?.profile_photo?.url ?? null
  )

  /** Values the form was last reset to — used to send only changed fields. */
  const originalRef = useRef<ProfileForm>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    designation: '',
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { first_name: '', last_name: '', email: '', phone: '', designation: '' },
  })

  /** Reset the form to the current profile values (read from details or the stored user). */
  const resetFormToCurrent = useCallback(() => {
    if (!details) return
    const { first, last } = splitName(details.first_name || details.name)
    const defaults = {
      first_name: details.first_name ?? first,
      last_name: details.last_name ?? last,
      email: details.email ?? user?.email ?? '',
      phone: details.phone ?? details.telephone ?? '',
      designation: details.designation ?? '',
    }
    reset(defaults)
    originalRef.current = defaults
  }, [details, user?.email, reset])

  // Fetch the full profile record — the auth store only keeps a subset.
  useEffect(() => {
    if (!hasHydrated || !user?.id) return
    let cancelled = false
    authFetch(`/api/admin/users/${user.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled) return
        const profile: AdminProfileDetails | null = json?.data ?? null
        setDetails(profile)
        setDetailsLoaded(true)
      })
      .catch(() => {
        if (!cancelled) setDetailsLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [hasHydrated, user?.id, authFetch])

  // Derive form defaults once the profile record arrives.
  useEffect(() => {
    resetFormToCurrent()
  }, [details, user?.email, resetFormToCurrent])

  const displayName =
    [details?.first_name, details?.last_name].filter(Boolean).join(' ') ||
    details?.name ||
    user?.name ||
    ''
  const displayRole = details?.designation || details?.role || user?.role || 'Administrator'

  async function saveProfile(values: ProfileForm) {
    if (!user?.id) {
      toast.error('User ID not found')
      return
    }
    try {
      // Send only fields that changed — the backend leaves everything else as-is.
      const body: Record<string, string | number> = { id: user.id }
      if (values.first_name !== undefined && values.first_name !== originalRef.current.first_name) {
        body.first_name = values.first_name
      }
      if (values.last_name !== undefined && values.last_name !== originalRef.current.last_name) {
        body.last_name = values.last_name
      }
      if (values.email !== undefined && values.email !== originalRef.current.email) {
        body.email = values.email
      }
      if (values.phone !== undefined && values.phone !== originalRef.current.phone) {
        body.phone = values.phone
      }
      if (values.designation !== undefined && values.designation !== originalRef.current.designation) {
        body.designation = values.designation
      }

      const res = await authFetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.success === false) {
        if (res.status === 401) throw new Error('Session expired — please sign in again.')
        if (res.status === 400) throw new Error(json?.message || 'Failed to update profile')
        if (res.status === 403) throw new Error('Superadmin accounts cannot be updated here.')
        if (res.status === 500) throw new Error('Server error — please try again later.')
        throw new Error(json?.message || `Failed to update profile (${res.status})`)
      }

      // Refresh the displayed profile from the response data instead of refetching.
      const updated = (json?.data ?? json) as AdminProfileDetails | undefined
      if (updated) {
        const userUpdates: Partial<AdminUser> = {}
        if (updated.name != null) userUpdates.name = updated.name
        if (updated.email != null) userUpdates.email = updated.email
        if (updated.designation != null) userUpdates.designation = updated.designation
        updateUser(userUpdates)
        // Split the response name into first/last since the backend returns
        // a combined `name` and no separate first_name/last_name fields.
        const nameParts = splitName(updated.name)
        setDetails((prev) =>
          prev
            ? {
                ...prev,
                ...updated,
                first_name: nameParts.first || prev.first_name,
                last_name: nameParts.last || prev.last_name,
              }
            : prev
        )
        originalRef.current = {
          first_name: values.first_name ?? originalRef.current.first_name,
          last_name: values.last_name ?? originalRef.current.last_name,
          email: values.email ?? originalRef.current.email,
          phone: values.phone ?? originalRef.current.phone,
          designation: values.designation ?? originalRef.current.designation,
        }
      }

      setEditing(false)
      toast.success('Profile saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
    }
  }

  async function uploadPhoto(file: File) {
    setPhotoError('')
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      setPhotoError('Choose a JPG, PNG or WebP image no larger than 2 MB.')
      return
    }
    setPhotoPending(true)
    try {
      const formData = new FormData()
      formData.append('photo', file)
      const res = await authFetch('/api/admin/profile/photo', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.success === false) {
        if (res.status === 502) throw new Error('Could not save your photo, please try again.')
        throw new Error(json?.errors?.photo || json?.message || 'Failed to upload photo')
      }
      const photoData: ProfilePhoto | null = json?.data ?? null
      // Update both local state and the auth store so the header avatar also updates.
      setDetails((prev) => prev ? { ...prev, profile_photo: photoData } : prev)
      updateUser({ profile_photo: photoData ?? undefined })
      toast.success('Profile photo updated')
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'Failed to upload photo')
    } finally {
      setPhotoPending(false)
    }
  }

  async function removePhoto() {
    setPhotoError('')
    setPhotoPending(true)
    try {
      const res = await authFetch('/api/admin/profile/photo', { method: 'DELETE' })
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || 'Failed to remove photo')
      }
      setDetails((prev) => prev ? { ...prev, profile_photo: null } : prev)
      updateUser({ profile_photo: null })
      toast.success('Profile photo removed')
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'Failed to remove photo')
    } finally {
      setPhotoPending(false)
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    setPwNotice('')
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
      const res = await authFetch('/api/admin/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: pwCurrent,
          password: pwNew,
          password_confirmation: pwConfirm,
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || 'Failed to update password')
      }
      toast.success('Password updated')
      setPwNotice('Password updated.')
      setPwCurrent('')
      setPwNew('')
      setPwConfirm('')
      setPwShow({ current: false, new: false, confirm: false })
    } catch (error) {
      setPwError(error instanceof Error ? error.message : 'Failed to update password')
    } finally {
      setPwSaving(false)
    }
  }

  const loading = !hasHydrated || !user || !detailsLoaded

  return (
    <div className="flex min-h-full flex-col space-y-6">
      <PortalContentHeader
        title="User settings"
        description="Manage your admin account details."
      />

      {loading ? (
        <SettingsSkeleton />
      ) : (
      /* ── Profile information ── */
      <section className="portal-page-card p-5 sm:p-6" aria-labelledby="profile-title">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2
              id="profile-title"
              className="text-xl font-semibold tracking-tight text-[var(--text-main)]"
            >
              Profile information
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {isSuperadmin
                ? 'Profile details are read-only for superadmin accounts.'
                : 'The details associated with your portal account.'}
            </p>
          </div>
          {/* Superadmins cannot edit via PUT /admin/users/{id} — hide the edit button. */}
          {!editing && !isSuperadmin && (
            <button
              type="button"
              onClick={() => {
                resetFormToCurrent()
                setEditing(true)
              }}
              aria-label="Edit profile"
              className="ui-action-icon shrink-0"
            >
              <Pencil aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Avatar + identity row */}
        <div className="mt-6 flex flex-wrap items-start justify-between gap-5 border-b border-[var(--border)] pb-6">
          <div className="flex min-w-0 items-center gap-5">
            <div className="relative shrink-0">
              {profilePhotoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profilePhotoSrc}
                  alt={displayName || 'Admin profile'}
                  className="size-20 rounded-full border border-[var(--field-border)] object-cover object-top"
                />
              ) : (
                <div className="flex size-20 items-center justify-center rounded-full border border-[var(--field-border)] bg-[#eff6ef] text-xl font-bold text-[#006838] dark:bg-[#38483b] dark:text-[#d0e3c8]">
                  {getInitials(displayName) || 'AD'}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-[var(--text-main)]">
                  {displayName || 'Admin user'}
                </p>
              </div>
              <p className="mt-1 text-sm font-medium text-[#006838] dark:text-[#d0e3c8]">
                {displayRole}
              </p>
              {/* Photo controls — available to both admin and superadmin. */}
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoPending}
                  className="text-left text-[0.75rem] font-semibold leading-4 text-[#006838] underline underline-offset-4 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-[#006838] disabled:opacity-60 dark:text-[#d0e3c8]"
                >
                  {photoPending ? 'Uploading…' : 'Change photo'}
                </button>
                {details?.profile_photo && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    disabled={photoPending}
                    aria-label="Remove profile photo"
                    className="flex items-center gap-1 text-[0.75rem] font-semibold leading-4 text-[#dc2626] underline underline-offset-4 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-[#dc2626] disabled:opacity-60"
                  >
                    <Trash2 className="size-3" aria-hidden="true" />
                    Remove
                  </button>
                )}
              </div>
              {photoError && (
                <p role="alert" className="mt-1 text-sm text-[#dc2626] dark:text-red-300">
                  {photoError}
                </p>
              )}
              <input
                ref={photoInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                aria-hidden="true"
                tabIndex={-1}
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadPhoto(file)
                  e.target.value = ''
                }}
              />
            </div>
          </div>
        </div>

        {/* Read-only fields */}
        {!editing && (
          <div className="mt-7 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm text-[var(--text-muted)]">First name</p>
              <p className="mt-1 font-semibold text-[var(--text-main)]">
                {details?.first_name || splitName(details?.name).first || '—'}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Last name</p>
              <p className="mt-1 font-semibold text-[var(--text-main)]">
                {details?.last_name || splitName(details?.name).last || '—'}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Email</p>
              <p className="mt-1 break-all font-semibold text-[var(--text-main)]">
                {details?.email || user?.email || '—'}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Phone</p>
              <p className="mt-1 font-semibold text-[var(--text-main)]">
                {details?.phone || details?.telephone || '—'}
              </p>
            </div>
          </div>
        )}

        {/* Edit form — hidden for superadmin */}
        {editing && !isSuperadmin && (
          <form
            onSubmit={handleSubmit(saveProfile)}
            noValidate
            className="mt-7 space-y-5"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="First name" error={errors.first_name?.message}>
                <input
                  type="text"
                  autoComplete="given-name"
                  aria-invalid={!!errors.first_name}
                  className="ui-form-field"
                  {...register('first_name')}
                />
              </Field>
              <Field label="Last name" error={errors.last_name?.message}>
                <input
                  type="text"
                  autoComplete="family-name"
                  aria-invalid={!!errors.last_name}
                  className="ui-form-field"
                  {...register('last_name')}
                />
              </Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Email" error={errors.email?.message}>
                <input
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  className="ui-form-field"
                  {...register('email')}
                />
              </Field>
              <Field label="Phone" error={errors.phone?.message}>
                <input
                  type="tel"
                  autoComplete="tel"
                  aria-invalid={!!errors.phone}
                  className="ui-form-field"
                  {...register('phone')}
                />
              </Field>
            </div>
            <Field label="Designation" error={errors.designation?.message}>
              <input
                type="text"
                autoComplete="organization"
                aria-invalid={!!errors.designation}
                className="ui-form-field"
                {...register('designation')}
              />
            </Field>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary text-sm"
              >
                {isSubmitting ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetFormToCurrent()
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
      )}

      {/* ── Update password ── */}
      <section
        className="portal-page-card mt-5 p-5 sm:p-6"
        aria-labelledby="password-title"
      >
        <h2
          id="password-title"
          className="text-xl font-semibold tracking-tight text-[var(--text-main)]"
        >
          Update password
        </h2>
        <p className="mt-1 text-sm text-[var(--text-sub)]">
          Use a unique password with at least 12 characters.
        </p>
        <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <PasswordField
              id="admin-current-password"
              label="Current password"
              value={pwCurrent}
              onChange={setPwCurrent}
              show={pwShow.current}
              onToggleShow={() => setPwShow((s) => ({ ...s, current: !s.current }))}
              autoComplete="current-password"
            />
            <PasswordField
              id="admin-new-password"
              label="New password"
              value={pwNew}
              onChange={setPwNew}
              show={pwShow.new}
              onToggleShow={() => setPwShow((s) => ({ ...s, new: !s.new }))}
              autoComplete="new-password"
              minLength={12}
            />
            <PasswordField
              id="admin-confirm-password"
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
          {pwNotice && (
            <p role="status" className="text-sm text-[#006838] dark:text-[#d0e3c8]">
              {pwNotice}
            </p>
          )}
          <button type="submit" disabled={pwSaving} className="btn-primary">
            {pwSaving ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </section>
    </div>
  )
}
