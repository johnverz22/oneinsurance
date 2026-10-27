'use client'

import { useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { CheckCircle2, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { applyFormSchema, ApplyFormValues, BACKGROUND_OPTIONS } from './form.schema'

const labelCls = 'block text-sm font-semibold text-[var(--text-main)]'
const errorCls = 'mt-1 text-xs text-red-700 dark:text-red-300'
const Req = () => (
  <span className="text-red-600 dark:text-red-400" aria-hidden="true">
    *
  </span>
)

export function ApplyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const confirmRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ApplyFormValues>({
    resolver: zodResolver(applyFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      contact_number: '',
      role: 'agent',
      background: '',
      other_details: '',
    },
  })

  const background = useWatch({ control, name: 'background' })
  const otherOpen = background === 'other'

  const onSubmit = async (data: ApplyFormValues) => {
    setIsSubmitting(true)
    try {
      const backgroundLabel = BACKGROUND_OPTIONS.find((o) => o.value === data.background)?.label
      const notes = [
        backgroundLabel && `Background: ${backgroundLabel}`,
        otherOpen && data.other_details.trim() && `Details: ${data.other_details.trim()}`,
      ]
        .filter(Boolean)
        .join('\n')

      const response = await fetch('/api/agents/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          contact_number: data.contact_number,
          application_type: data.role,
          notes,
        }),
      })
      const resData = await response.json()
      if (!response.ok || resData.success === false) {
        throw new Error(resData.message || 'Failed to submit application. Please try again.')
      }
      reset()
      setConfirmed(true)
      requestAnimationFrame(() => confirmRef.current?.focus())
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onChange={() => confirmed && setConfirmed(false)}
      className="space-y-4"
    >
      <p className="text-sm text-[var(--text-sub)]">
        Fields marked <Req /> are required.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className={labelCls}>
            First name <Req />
          </label>
          <input
            id="firstName"
            type="text"
            required
            autoComplete="given-name"
            aria-invalid={!!errors.firstName}
            {...register('firstName')}
            className="ui-form-field mt-1.5"
          />
          {errors.firstName && <p className={errorCls}>{errors.firstName.message}</p>}
        </div>
        <div>
          <label htmlFor="lastName" className={labelCls}>
            Last name <Req />
          </label>
          <input
            id="lastName"
            type="text"
            required
            autoComplete="family-name"
            aria-invalid={!!errors.lastName}
            {...register('lastName')}
            className="ui-form-field mt-1.5"
          />
          {errors.lastName && <p className={errorCls}>{errors.lastName.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="email" className={labelCls}>
          Email address <Req />
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register('email')}
          className="ui-form-field mt-1.5"
        />
        {errors.email && <p className={errorCls}>{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="contact_number" className={labelCls}>
          Contact number <Req />
        </label>
        <input
          id="contact_number"
          type="tel"
          required
          autoComplete="tel"
          aria-invalid={!!errors.contact_number}
          {...register('contact_number')}
          className="ui-form-field mt-1.5"
        />
        {errors.contact_number && <p className={errorCls}>{errors.contact_number.message}</p>}
      </div>

      <div>
        <label htmlFor="role" className={labelCls}>
          How would you like to partner with us? <Req />
        </label>
        <select
          id="role"
          required
          aria-invalid={!!errors.role}
          {...register('role')}
          className="ui-form-field mt-1.5"
        >
          <option value="agent">Agent (Direct Sales &amp; Network)</option>
          <option value="referral">Referral / Affiliate Partner</option>
        </select>
        {errors.role && <p className={errorCls}>{errors.role.message}</p>}
      </div>

      <div>
        <label htmlFor="background" className={labelCls}>
          Your background <span className="font-normal text-[var(--text-muted)]">(optional)</span>
        </label>
        <select
          id="background"
          aria-describedby="background-help"
          {...register('background')}
          className="ui-form-field mt-1.5"
        >
          <option value="">Select your background</option>
          {BACKGROUND_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <p id="background-help" className="mt-1 text-xs text-[var(--text-muted)]">
          Choose the option that best describes your experience. Select Other (specify) to add your
          own details.
        </p>
      </div>

      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-[240ms] ease-out motion-reduce:transition-none',
          otherOpen ? 'grid-rows-[1fr] opacity-100' : 'invisible grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="p-0.5">
            <label htmlFor="other_details" className={labelCls}>
              Other background details{' '}
              <span className="font-normal text-[var(--text-muted)]">(optional)</span>
            </label>
            <textarea
              id="other_details"
              rows={3}
              maxLength={2000}
              disabled={!otherOpen}
              aria-invalid={!!errors.other_details}
              {...register('other_details')}
              className="ui-form-field mt-1.5"
            />
            {errors.other_details && <p className={errorCls}>{errors.other_details.message}</p>}
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full gap-2">
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              <span>Submitting application…</span>
            </>
          ) : (
            <span>Submit application</span>
          )}
        </button>
        {isSubmitting && (
          <p className="mt-2 text-center text-xs text-[var(--text-muted)]">
            This may take up to a minute. Please don&apos;t close the page.
          </p>
        )}
      </div>

      {confirmed && (
        <div
          ref={confirmRef}
          tabIndex={-1}
          role="status"
          className="flex items-start gap-3 rounded-md border border-[#559e45] bg-[#e2eddb] p-4 text-sm text-[#183d2c] outline-none focus-visible:outline-2 focus-visible:outline-[#006838] dark:bg-[#304538] dark:text-[#f4f5f2]"
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#006838] dark:text-[#d0e3c8]" aria-hidden />
          <p>
            <strong className="font-semibold">Application received.</strong> Thank you for your
            interest. Our team will be in touch soon.
          </p>
        </div>
      )}
    </form>
  )
}
