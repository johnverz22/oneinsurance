'use client'

import { useForm } from '@tanstack/react-form'
import { useRouter, useSearchParams } from 'next/navigation'

import {
  RegisterAgentBaseSchema,
  type RegisterAgent,
  RegisterAgentValidationError,
  RegisterAgentSchema,
} from '@/types/agent/auth'
import { useAgentRegistrationStore } from '@/store/agent-registration-store'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FieldInfo } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import {
  useRegisterAgent,
} from '@/app/data/mutations/agent/auth-agent'
import Link from 'next/link'
import { useAgentAuthStore } from '@/store/agent-auth-store'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'

const INPUT_FIELD = 'bg-[#F3F5FC] border-0 dark:bg-[#1A1A1A] w-full'

export default function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { mutateAsync: registerAgent } = useRegisterAgent()

  const {
    credentials,
    setIsRegistering,
    setRegistrationError,
    setRegistrationSuccess,
    setValidationErrors,
    clearValidationErrors,
    getFieldErrors,
    registrationResult,
    isRegistering,
    registrationError,
    registrationSuccess,
    validationErrors,
  } = useAgentRegistrationStore()
  const { isAuthenticated } = useAgentAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setRegistrationError('Invalid or missing invitation token. Please use the signup link provided in your invitation email.')
    } else if (token.length < 10) {
      setRegistrationError('Invalid invitation token format. Please use the correct signup link provided in your invitation email.')
    } else {
      clearValidationErrors()
    }
  }, [searchParams, setRegistrationError, clearValidationErrors])

  const form = useForm({
    defaultValues: {
      ...credentials,
      token: searchParams.get('token') || '',
      email: '',
    } as RegisterAgent,
    validators: {
      onChange: RegisterAgentSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        setIsRegistering(true)
        clearValidationErrors()
        
        // Step 1: Register the agent
        const registrationResponse = await registerAgent({ data: value })
        
        if (registrationResponse.success) {
          // Registration succeeded - clear any errors and show success
          clearValidationErrors()
          setRegistrationSuccess('Account created successfully! Redirecting to login...')
          setTimeout(() => {
            router.push('/login')
          }, 1500)
        }
      } catch (error: any) {
        console.error('Registration/Login error:', error)

        // Check if it's a 422 validation error
        if (error.status === 422 || error.response?.status === 422) {
          try {
            // Try to parse the validation error response
            const errorData = error.response?.data || error.data

            if (errorData) {
              // It's a validation error, store field-specific errors
              setValidationErrors(errorData.error?.errors || errorData.errors)
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
                    className={cn(
                      getFieldErrors('firstName').length > 0
                        ? 'border-destructive'
                        : '',
                      INPUT_FIELD
                    )}
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
                    className={cn(
                      getFieldErrors('firstName').length > 0
                        ? 'border-destructive'
                        : '',
                      INPUT_FIELD
                    )}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>
          </div>

          <form.Field name="token">
            {(field) => (
              <input
                type="hidden"
                name={field.name}
                value={field.state.value}
              />
            )}
          </form.Field>

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
                  placeholder="Enter your email"
                  className={cn(
                    getFieldErrors('email').length > 0
                      ? 'border-destructive'
                      : '',
                    INPUT_FIELD
                  )}
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
                  className={cn(
                    getFieldErrors('firstName').length > 0
                      ? 'border-destructive'
                      : '',
                    INPUT_FIELD
                  )}
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
                <Input
                  type="password"
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => {
                    field.handleChange(e.target.value)
                  }}
                  placeholder="Create password"
                  className={cn(
                    getFieldErrors('firstName').length > 0
                      ? 'border-destructive'
                      : '',
                    INPUT_FIELD
                  )}
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
                <Input
                  type="password"
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => {
                    field.handleChange(e.target.value)
                  }}
                  placeholder="Confirm password"
                  className={cn(
                    getFieldErrors('firstName').length > 0
                      ? 'border-destructive'
                      : '',
                    INPUT_FIELD
                  )}
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>

          {registrationSuccess && (
            <div className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-md p-3 text-sm">
              {registrationSuccess}
            </div>
          )}

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



          <div className="flex w-full justify-end">
            <Button
              type="submit"
              disabled={isRegistering || !searchParams.get('token')}
              className="from-primary to-lilac hover:from-primary/90 hover:to-lilac/90 focus:from-primary/90 focus:to-lilac/90 rounded-full bg-gradient-to-r text-white"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="px-3">Creating Account...</span>
                </>
              ) : (
                <span className="px-5">Create Account</span>
              )}
            </Button>
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
