'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from '@tanstack/react-form'
import Link from 'next/link'
import { Loader2, LockKeyhole, User } from 'lucide-react'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldInfo } from '@/components/ui/form'
import { PasswordInput } from '@/components/ui/password-input'
import {
  LoginAgentSchema,
  type LoginAgent,
  type LoginAgentResponse,
} from '@/types/agent/auth'
import { useLoginAgent } from '@/app/data/mutations/agent/auth-agent'
import { useAgentAuthStore } from '@/store/agent-auth-store'
import { toast } from 'sonner'
import { NotVerifiedEmailError } from '@/lib/errors'
import { useSendOTP } from '@/app/data/mutations/otp'

const INPUT_FIELD = 'bg-[#F3F5FC] border-0 dark:bg-[#1A1A1A] w-full'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const { mutateAsync: loginAgent } = useLoginAgent()
  const { mutateAsync: sendOTP } = useSendOTP()
  const { login, isAuthenticated } = useAgentAuthStore()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    // Check if agent is authenticated
    if (isAuthenticated && hydrated) {
      // Redirect to login page if not authenticated
      router.push('/')
      return
    }
  }, [isAuthenticated, router, hydrated])

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    } as LoginAgent,
    validators: {
      onChange: LoginAgentSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        setIsLoading(true)
        setLoginError(null)

        const result = (await loginAgent({ data: value })) as LoginAgentResponse

        // Send OTP after successful login validation
        try {
          await sendOTP(value.email)
          toast.success('OTP has been sent to your email')
          
          // Store auth data temporarily in sessionStorage to complete after OTP
          sessionStorage.setItem('pending_auth', JSON.stringify(result))
          
          // Redirect to OTP page with email
          router.push(`/otp?email=${encodeURIComponent(value.email)}`)
        } catch (otpError: any) {
          if (otpError?.response?.status === 404) {
            toast.error('User not found.')
          } else {
            toast.error('Failed to send OTP. Please try again.')
          }
        }
        
        /* TEMPORARY: Direct login without OTP - DISABLED FOR PRODUCTION
        // Complete login directly without OTP (TEMPORARY)
        login(result)
        toast.success('Login successful!')
        router.push('/')
        END TEMPORARY CODE */
      } catch (error: any) {
        if (error instanceof NotVerifiedEmailError) {
          setLoginError(error.message)
          return
        }

        // Handle different types of errors
        if (error?.response?.status === 422) {
          setLoginError('Invalid email or password format')
        } else if (error?.response?.status === 401) {
          setLoginError(
            'Invalid credentials. Please check your email and password.'
          )
        } else if (error?.response?.status === 403) {
          setLoginError('Account not verified or access denied')
        } else {
          setLoginError('Login failed. Please try again.')
        }
      } finally {
        setIsLoading(false)
      }
    },
  })

  return (
    <>
      <div className="mb-6 flex items-center justify-center">
        <Image
          src="/images/logo.png"
          alt="Company Logo"
          width={150}
          height={100}
          className="object-contain"
        />
      </div>

      <div className="flex w-full items-center justify-center">
        <div className="flex w-full flex-col justify-center gap-6">
          <div className="flex w-full items-center justify-center">
            <h1 className="from-primary to-lilac w-fit bg-gradient-to-r bg-clip-text py-2 text-3xl leading-tight font-black text-transparent md:text-4xl lg:text-5xl">
              Log In
            </h1>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
            className="w-full"
          >
            <div className="flex w-full flex-col gap-4">
              {/* Email Field */}
              <form.Field name="email">
                {(field) => (
                  <div className="flex w-full flex-col gap-2">
                    <Label htmlFor={field.name} className="required-field">
                      Email
                    </Label>
                    <div className="relative">
                      <User className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                      <Input
                        name={field.name}
                        type="email"
                        value={field.state.value}
                        onChange={(e) => {
                          field.handleChange(e.target.value)
                        }}
                        placeholder="Enter your email address"
                        disabled={isLoading}
                        className={`${INPUT_FIELD} pl-10`}
                      />
                    </div>
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>

              {/* Password Field */}
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
                      placeholder="Enter your password"
                      disabled={isLoading}
                      leftIcon={<LockKeyhole className="h-5 w-5" />}
                      className={INPUT_FIELD}
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>

              {/* Error Message */}
              {loginError && (
                <div className="bg-destructive/15 text-destructive rounded-md p-3 text-sm">
                  {loginError}
                </div>
              )}

              <div className="text-muted-foreground flex justify-end text-sm">
                <Link
                  href="/forgot-password"
                  className="hover:text-primary underline underline-offset-4"
                >
                  Forgot your password?
                </Link>
              </div>

              {/* Login Button */}
              <div className="flex w-full justify-end">
                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <Button
                      type="submit"
                      disabled={!canSubmit || isSubmitting || isLoading}
                      className="from-primary to-lilac hover:from-primary/90 hover:to-lilac/90 focus:from-primary/90 focus:to-lilac/90 rounded-full bg-gradient-to-r text-white"
                    >
                      {isSubmitting || isLoading ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <span className="px-12">Log in</span>
                      )}
                    </Button>
                  )}
                </form.Subscribe>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
