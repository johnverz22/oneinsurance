'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from '@tanstack/react-form'
import { Lock, CheckCircle, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { FieldInfo } from '@/components/ui/form'
import { useResetPassword } from '@/app/data/mutations/agent/auth-agent'
import {
  ResetPasswordSchema,
  type ResetPassword,
  type ResetPasswordValidationError,
} from '@/types/agent/auth'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const { mutateAsync: resetPassword, isPending } = useResetPassword()

  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<
    string,
    string[]
  > | null>(null)

  // Redirect if no token is provided
  useEffect(() => {
    if (!token) {
      router.push('/advisor/signup')
    }
  }, [token, router])

  const form = useForm({
    defaultValues: {
      email: email || '',
      token: token || '',
      password: '',
      confirmPassword: '',
    } as ResetPassword,
    validators: {
      onChange: ResetPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        setError(null)
        setValidationErrors(null)

        console.log('Resetting password with token:', value.token)

        const result = await resetPassword({ data: value })

        console.log('Password reset successful:', result)
        setSuccess(true)

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } catch (error: any) {
        console.error('Password reset error:', error)

        // Handle 422 validation errors
        if (error.status === 422 || error.response?.status === 422) {
          try {
            const errorData = error.response?.data || error.data

            if (errorData && !errorData.success && errorData.errors) {
              setValidationErrors(errorData.errors)
              setError(
                errorData.message || 'Please fix the validation errors below.'
              )
            } else {
              setError(
                'Validation failed. Please check your input and try again.'
              )
            }
          } catch (parseError) {
            console.error('Failed to parse validation error:', parseError)
            setError(
              'Validation failed. Please check your input and try again.'
            )
          }
        } else {
          // Other errors (network, server, invalid token, etc.)
          const errorMessage =
            error instanceof Error ? error.message : 'Password reset failed'
          setError(errorMessage)
        }
      }
    },
  })

  // Helper to get field-specific errors
  const getFieldErrors = (fieldName: string): string[] => {
    return validationErrors?.[fieldName] || []
  }

  // Helper component to display field-specific errors
  const FieldErrors = ({ fieldName }: { fieldName: string }) => {
    const errors = getFieldErrors(fieldName)
    if (errors.length === 0) return null

    return (
      <div className="space-y-1">
        {errors.map((error, index) => (
          <small key={index} className="text-destructive block">
            {error}
          </small>
        ))}
      </div>
    )
  }

  if (!token) {
    return null // Will redirect in useEffect
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="rounded-full bg-green-100 p-4">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          Password Reset Successful!
        </h1>
        <p className="text-gray-600">
          Your password has been successfully updated.
        </p>
        <p className="text-sm text-gray-500">
          Redirecting to login page in a few seconds...
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col justify-center">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-blue-100 p-4">
            <Lock className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Reset Your Password
          </h1>
          <p className="text-gray-600 md:text-lg">
            Enter your new password below
          </p>
        </div>

        {/* Reset Password Form */}
        <div className="flex w-full flex-col items-center">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
            className="flex w-full max-w-md flex-col gap-4"
          >
            <form.Field name="password">
              {(field) => (
                <div className="flex w-full flex-col gap-2">
                  <Label htmlFor={field.name}>New Password *</Label>
                  <PasswordInput
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter your new password"
                    className={
                      getFieldErrors('password').length > 0
                        ? 'border-destructive'
                        : ''
                    }
                  />
                  <FieldInfo field={field} />
                  <FieldErrors fieldName="password" />
                </div>
              )}
            </form.Field>

            <form.Field name="confirmPassword">
              {(field) => (
                <div className="flex w-full flex-col gap-2">
                  <Label htmlFor={field.name}>Confirm New Password *</Label>
                  <PasswordInput
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Confirm your new password"
                    className={
                      getFieldErrors('confirmPassword').length > 0
                        ? 'border-destructive'
                        : ''
                    }
                  />
                  <FieldInfo field={field} />
                  <FieldErrors fieldName="confirmPassword" />
                </div>
              )}
            </form.Field>

            {/* General Error Display */}
            {error && (
              <div className="bg-destructive/15 text-destructive flex items-start gap-2 rounded-md p-3 text-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting || isPending}
                  className="from-primary to-tertiary w-full rounded-full bg-gradient-to-r text-white"
                >
                  {isSubmitting || isPending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Resetting Password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              )}
            </form.Subscribe>
          </form>
        </div>

        {/* Help Text */}
        <div className="text-center text-sm text-gray-500">
          <p>
            Remember your password?{' '}
            <button
              onClick={() => router.push('/sign-in')}
              className="text-blue-600 underline hover:text-blue-800"
            >
              Back to Login
            </button>
          </p>
        </div>
      </div>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 px-4">
          <div className="w-full max-w-md space-y-8 rounded-xl bg-white px-8 py-10 shadow-lg">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Lock className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="mt-6 text-3xl font-bold text-gray-900">
                Loading...
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Please wait while we load the password reset form.
              </p>
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
