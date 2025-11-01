'use client'

import { z } from 'zod'
import { useForm } from '@tanstack/react-form'
import { useRouter } from 'next/navigation'

import {
  RegisterAgentSchema,
  type RegisterAgent,
  RegisterAgentValidationError,
} from '@/types/agent/auth'
import { useAgentRegistrationStore } from '@/store/agent-registration-store'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FieldInfo } from '@/components/ui/form'
import { PasswordInput } from '@/components/ui/password-input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import {
  useRegisterAgent,
  useSendEmailVerification,
} from '@/app/data/mutations/agent/auth-agent'
import Link from 'next/link'
import { useAgentAuthStore } from '@/store/agent-auth-store'
import { useEffect } from 'react'

export default function SignUpPage() {
  const router = useRouter()
  const { mutateAsync: registerAgent } = useRegisterAgent()
  const { mutateAsync: sendEmailVerification } = useSendEmailVerification()

  const {
    credentials,
    setCredentials,
    setRegistrationResult,
    setIsRegistering,
    setRegistrationError,
    setValidationErrors,
    clearValidationErrors,
    getFieldErrors,
    registrationResult,
    isRegistering,
    registrationError,
    validationErrors,
    isFormValid,
  } = useAgentRegistrationStore()
  const { isAuthenticated } = useAgentAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  const form = useForm({
    defaultValues: credentials as RegisterAgent,
    validators: {
      onChange: RegisterAgentSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        setIsRegistering(true)
        setRegistrationError(null)
        clearValidationErrors()

        console.log('Submitting:', value)

        // Update credentials in store
        setCredentials(value)

        // Call the API
        const result = await registerAgent({ data: value as RegisterAgent })

        // Store the result
        setRegistrationResult(result)

        router.push('/verify-email')
      } catch (error: any) {
        console.error('Registration error:', error)

        // Check if it's a 422 validation error
        if (error.status === 422 || error.response?.status === 422) {
          try {
            // Try to parse the validation error response
            const errorData = error.response?.data || error.data

            if (errorData) {
              // It's a validation error, store field-specific errors
              setValidationErrors(errorData.error.errors)
              setRegistrationError(
                errorData.message || 'Please fix the validation errors below.'
              )
            } else {
              // Unknown 422 format, show generic message
              setRegistrationError(
                'Validation failed. Please check your input and try again.'
              )
            }
          } catch (parseError) {
            console.error('Failed to parse validation error:', parseError)
            setRegistrationError(
              'Validation failed. Please check your input and try again.'
            )
          }
        } else {
          // Other errors (network, server, etc.)
          const errorMessage =
            error instanceof Error ? error.message : 'Registration failed'
          setRegistrationError(errorMessage)
        }
      } finally {
        setIsRegistering(false)
      }
    },
  })

  return (
    <div className="flex w-full flex-col justify-center gap-6">
      <h1 className="from-primary to-lilac w-fit bg-gradient-to-r bg-clip-text py-2 text-3xl leading-tight font-black text-transparent md:text-4xl lg:text-5xl">
        Sign Up
      </h1>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        className="w-full"
      >
        <div className="flex w-full flex-col gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <form.Field name="firstName">
              {(field) => (
                <div className="flex w-full flex-col gap-2">
                  <Label htmlFor={field.name} className="required-field">
                    First Name
                  </Label>
                  <Input
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => {
                      field.handleChange(e.target.value)
                    }}
                    placeholder="Enter your first name"
                    className={
                      getFieldErrors('firstName').length > 0
                        ? 'border-destructive'
                        : ''
                    }
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>

            <form.Field name="lastName">
              {(field) => (
                <div className="flex w-full flex-col gap-2">
                  <Label htmlFor={field.name} className="required-field">
                    Last Name
                  </Label>
                  <Input
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => {
                      field.handleChange(e.target.value)
                    }}
                    placeholder="Enter your last name"
                    className={
                      getFieldErrors('lastName').length > 0
                        ? 'border-destructive'
                        : ''
                    }
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>
          </div>

          <form.Field name="email">
            {(field) => (
              <div className="flex w-full flex-col gap-2">
                <Label htmlFor={field.name} className="required-field">
                  Email
                </Label>
                <Input
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => {
                    field.handleChange(e.target.value)
                  }}
                  placeholder="Enter Email"
                  className={
                    getFieldErrors('email').length > 0
                      ? 'border-destructive'
                      : ''
                  }
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>

          <form.Field name="phone">
            {(field) => (
              <div className="flex w-full flex-col gap-2">
                <Label htmlFor={field.name} className="required-field">
                  Phone
                </Label>
                <Input
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => {
                    field.handleChange(e.target.value)
                  }}
                  placeholder="Enter your phone number"
                  className={
                    getFieldErrors('phone').length > 0
                      ? 'border-destructive'
                      : ''
                  }
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>

          <form.Field name="password">
            {(field) => (
              <div className="flex w-full flex-col gap-2">
                <Label htmlFor={field.name} className="required-field">
                  Password
                </Label>
                <PasswordInput
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => {
                    field.handleChange(e.target.value)
                  }}
                  placeholder="Create password"
                  className={
                    getFieldErrors('password').length > 0
                      ? 'border-destructive'
                      : ''
                  }
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>

          <form.Field name="confirmPassword">
            {(field) => (
              <div className="flex w-full flex-col gap-2">
                <Label htmlFor={field.name} className="required-field">
                  Confirm Password
                </Label>
                <PasswordInput
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => {
                    field.handleChange(e.target.value)
                  }}
                  placeholder="Confirm password"
                  className={
                    getFieldErrors('confirmPassword').length > 0
                      ? 'border-destructive'
                      : ''
                  }
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>

          {registrationError && (
            <div className="bg-destructive/15 text-destructive rounded-md p-3 text-sm">
              {registrationError}
              {validationErrors &&
                Object.entries(validationErrors).map(([field, errors]) => (
                  <div key={field}>
                    <strong>{field}:</strong> {errors.join(', ')}
                  </div>
                ))}
            </div>
          )}

          {registrationResult && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">
              Registration successful! Welcome,{' '}
              {registrationResult.data.first_name}!
            </div>
          )}

          <div className="flex w-full justify-end">
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting || isRegistering}
                  className="from-primary to-lilac hover:from-primary/90 hover:to-lilac/90 focus:from-primary/90 focus:to-lilac/90 rounded-full bg-gradient-to-r text-white"
                >
                  {isSubmitting || isRegistering ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <span className="px-5">Sign Up</span>
                  )}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </div>
      </form>

      {/* Additional Actions */}
      <div className="flex w-full items-center justify-start py-4">
        <div className="text-muted-foreground flex flex-col items-start gap-2 text-sm">
          <p>
            Already have an account?{' '}
            <Link
              href="/login"
              className="hover:text-primary text-blue-800 underline underline-offset-4"
            >
              Log In Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
