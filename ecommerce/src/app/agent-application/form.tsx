'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { applyFormSchema, ApplyFormValues } from './form.schema'
import { Loader2 } from 'lucide-react'

const labelCls =
  'block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]'
const errorCls = 'mt-1 text-xs text-red-700 dark:text-red-300'

export function ApplyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApplyFormValues>({
    resolver: zodResolver(applyFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      contact_number: '',
      application_type: 'agent',
      notes: '',
    },
  })

  const onSubmit = async (data: ApplyFormValues) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/agents/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          contact_number: data.contact_number,
          application_type: data.application_type,
          notes: data.notes,
        }),
      })

      const resData = await response.json()

      if (!response.ok || resData.success === false) {
        throw new Error(resData.message || 'Failed to submit application. Please try again.')
      }

      toast.success(
        resData.message || 'Application submitted successfully. We’ll be in touch soon!'
      )
      reset()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name Fields */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className={labelCls}>
            First Name <span className="text-red-600 dark:text-red-300">*</span>
          </label>
          <input
            id="firstName"
            type="text"
            placeholder="Juan"
            autoComplete="given-name"
            aria-invalid={!!errors.firstName}
            {...register('firstName')}
            className="ui-form-field mt-1.5"
          />
          {errors.firstName && (
            <p className={errorCls}>{errors.firstName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className={labelCls}>
            Last Name <span className="text-red-600 dark:text-red-300">*</span>
          </label>
          <input
            id="lastName"
            type="text"
            placeholder="Dela Cruz"
            autoComplete="family-name"
            aria-invalid={!!errors.lastName}
            {...register('lastName')}
            className="ui-form-field mt-1.5"
          />
          {errors.lastName && (
            <p className={errorCls}>{errors.lastName.message}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className={labelCls}>
          Email Address <span className="text-red-600 dark:text-red-300">*</span>
        </label>
        <input
          id="email"
          type="email"
          placeholder="juan@example.com"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register('email')}
          className="ui-form-field mt-1.5"
        />
        {errors.email && (
          <p className={errorCls}>{errors.email.message}</p>
        )}
      </div>

      {/* Phone Number */}
      <div>
        <label htmlFor="contact_number" className={labelCls}>
          Contact Number <span className="text-red-600 dark:text-red-300">*</span>
        </label>
        <input
          id="contact_number"
          type="tel"
          placeholder="0917 123 4567"
          autoComplete="tel-national"
          aria-invalid={!!errors.contact_number}
          {...register('contact_number')}
          className="ui-form-field mt-1.5"
        />
        {errors.contact_number && (
          <p className={errorCls}>{errors.contact_number.message}</p>
        )}
      </div>

      {/* Role */}
      <div>
        <label htmlFor="application_type" className={labelCls}>
          Role <span className="text-red-600 dark:text-red-300">*</span>
        </label>
        <select
          id="application_type"
          aria-invalid={!!errors.application_type}
          {...register('application_type')}
          className="ui-form-field mt-1.5"
        >
          <option value="agent">Agent (Direct Sales & Network)</option>
          <option value="referral">Referral Partner</option>
        </select>
        {errors.application_type && (
          <p className={errorCls}>{errors.application_type.message}</p>
        )}
      </div>

      {/* Notes / Message */}
      <div>
        <label htmlFor="notes" className={labelCls}>
          Message / Background (Optional)
        </label>
        <textarea
          id="notes"
          rows={3}
          placeholder="Tell us about your insurance sales background or distribution reach..."
          {...register('notes')}
          className="ui-form-field mt-1.5"
        />
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full gap-2">
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              <span>Submitting Application…</span>
            </>
          ) : (
            <span>Submit Application</span>
          )}
        </button>

        {isSubmitting && (
          <p className="mt-2 text-center text-xs text-[var(--text-muted)]">
            This may take up to a minute. Please don&apos;t close the page.
          </p>
        )}
      </div>
    </form>
  )
}
