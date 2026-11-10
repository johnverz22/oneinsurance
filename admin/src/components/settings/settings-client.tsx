'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getInitials } from '@/lib/utils'
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
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  phone: z.string(),
})
type ProfileForm = z.infer<typeof profileSchema>

// ============================================================
// Types
// ============================================================
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
  profile_photo_url?: string | null
  avatar?: string | null
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

  const [details, setDetails] = useState<AdminProfileDetails | null>(null)
  const [detailsLoaded, setDetailsLoaded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [photoPending, setPhotoPending] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const profilePhotoSrc = useAuthenticatedImage(
    details?.profile_photo_url ||
      details?.avatar ||
      user?.profile_photo_url ||
      null
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { first_name: '', last_name: '', email: '', phone: '' },
  })

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
    if (!details) return
    const { first, last } = splitName(details.first_name || details.name)
    reset({
      first_name: details.first_name ?? first,
      last_name: details.last_name ?? last,
      email: details.email ?? user?.email ?? '',
      phone: details.phone ?? details.telephone ?? '',
    })
  }, [details, user?.email, reset])

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
      const res = await authFetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          phone: values.phone || null,
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || 'Failed to update profile')
      }
      updateUser({
        name: `${values.first_name} ${values.last_name}`.trim(),
        email: values.email,
      })
      setDetails((prev) =>
        prev
          ? {
              ...prev,
              first_name: values.first_name,
              last_name: values.last_name,
              name: `${values.first_name} ${values.last_name}`.trim(),
              email: values.email,
              phone: values.phone || null,
            }
          : prev
      )
      setEditing(false)
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
    }
  }

  async function uploadPhoto(file: File) {
    if (!user?.id) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be 5 MB or smaller')
      return
    }
    setPhotoPending(true)
    try {
      const formData = new FormData()
      formData.append('profile_photo', file)
      const res = await authFetch(`/api/admin/users/${user.id}/photo`, {
        method: 'POST',
        body: formData,
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || 'Failed to upload photo')
      }
      const photoUrl =
        json?.data?.profile_photo_url ??
        json?.data?.avatar ??
        json?.profile_photo_url ??
        null
      updateUser({ profile_photo_url: photoUrl })
      setDetails((prev) =>
        prev ? { ...prev, profile_photo_url: photoUrl } : prev
      )
      toast.success('Profile photo updated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload photo')
    } finally {
      setPhotoPending(false)
    }
  }

  async function removePhoto() {
    if (!user?.id) return
    setPhotoPending(true)
    try {
      const res = await authFetch(`/api/admin/users/${user.id}/photo`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to remove photo')
      updateUser({ profile_photo_url: null })
      setDetails((prev) =>
        prev ? { ...prev, profile_photo_url: null, avatar: null } : prev
      )
      toast.success('Profile photo removed')
    } catch {
      toast.error('Failed to remove photo')
    } finally {
      setPhotoPending(false)
    }
  }

  const loading = !hasHydrated || !user || !detailsLoaded

  const hasPhoto = Boolean(profilePhotoSrc)

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
            <div className="relative shrink-0">
              {profilePhotoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profilePhotoSrc}
                  alt={displayName || 'Admin profile'}
                  className="size-20 rounded-full border border-[var(--field-border)] object-cover object-top"
                />
              ) : (
                <div className="flex size-20 items-center justify-center rounded-full border border-[var(--field-border)] bg-[#006838] text-xl font-bold text-white">
                  {getInitials(displayName)}
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
              <div className="mt-1.5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoPending}
                  className="inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-[var(--text-sub)] hover:text-[#006838] focus-visible:outline-2 focus-visible:outline-[#006838] disabled:opacity-60 dark:hover:text-[#d0e3c8]"
                >
                  {photoPending ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Camera className="size-3.5" aria-hidden="true" />
                  )}
                  Change photo
                </button>
                {hasPhoto && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    disabled={photoPending}
                    className="inline-flex min-h-9 items-center text-xs font-semibold text-[var(--text-muted)] hover:text-[#dc2626] focus-visible:outline-2 focus-visible:outline-[#006838] disabled:opacity-60"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
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

        {/* Edit form */}
        {editing && (
          <form
            onSubmit={handleSubmit(saveProfile)}
            noValidate
            className="mt-7 space-y-5"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="First name" error={errors.first_name?.message} required>
                <input
                  type="text"
                  autoComplete="given-name"
                  aria-invalid={!!errors.first_name}
                  className="ui-form-field"
                  {...register('first_name')}
                />
              </Field>
              <Field label="Last name" error={errors.last_name?.message} required>
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
              <Field label="Email" error={errors.email?.message} required>
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
                  const { first, last } = splitName(details?.first_name || details?.name)
                  reset({
                    first_name: details?.first_name ?? first,
                    last_name: details?.last_name ?? last,
                    email: details?.email ?? user?.email ?? '',
                    phone: details?.phone ?? details?.telephone ?? '',
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
      )}
    </div>
  )
}
