'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from '@tanstack/react-form'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldInfo } from '@/components/ui/form'
import { PasswordInput } from '@/components/ui/password-input'
import { LoginSchema, type Login, type LoginResponse } from '@/types/auth'
import { useLoginAdmin } from '@/app/data/mutations/auth'
import { useAuthStore } from '@/store/auth-store'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const { mutateAsync: loginAdmin } = useLoginAdmin()
  const { login, isAuthenticated } = useAuthStore()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    // Check if agent is authenticated
    if (isAuthenticated && hydrated) {
      // Redirect to login page if not authenticated
      router.push('/agents')
      return
    }
  }, [isAuthenticated, router, hydrated])

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    } as Login,
    validators: {
      onChange: LoginSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        setIsLoading(true)
        setLoginError(null)

        const result = (await loginAdmin({ data: value })) as LoginResponse

        // Store authentication data in the store
        login(result)

        // Handle successful login
        toast.success(`Welcome back, ${result.data.user.name}!`)

        // Redirect to admin inquiries
        router.push('/agents')
      } catch (error: any) {
        console.error('Login error:', error)

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
    <div className="flex w-full flex-col justify-center gap-6">
      <h1 className="from-primary to-lilac w-fit bg-gradient-to-r bg-clip-text py-2 text-3xl leading-tight font-black text-transparent md:text-4xl lg:text-5xl">
        Log In
      </h1>

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
                <Input
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onChange={(e) => {
                    field.handleChange(e.target.value)
                  }}
                  placeholder="Enter your email address"
                  disabled={isLoading}
                  className="w-full"
                />
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
                  className="w-full"
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

          {/* Login Button */}
          <div className="flex w-full justify-end pt-8">
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
                    <span className="px-5">Log in</span>
                  )}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </div>
      </form>
    </div>
  )
}
