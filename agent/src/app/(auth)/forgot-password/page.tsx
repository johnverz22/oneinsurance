'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from '@tanstack/react-form'
import { Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldInfo } from '@/components/ui/form'
import axios from 'axios'
import { z } from 'zod'
import { useForgotPassword } from '@/app/data/mutations/agent/auth-agent'
import { toast } from 'sonner'

const ForgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const { mutateAsync: forgotPassword } = useForgotPassword()

  const form = useForm({
    defaultValues: { email: '' },
    validators: { onChange: ForgotPasswordSchema },
    onSubmit: async ({ value }) => {
      try {
        setError(null)
        setIsPending(true)
        const requestBody = {
          email: value.email,
          redirectUrl: `${window.location.origin}/agent/reset-password`,
        }
        const result = await forgotPassword({
          data: {
            email: requestBody.email,
            redirectUrl: requestBody.redirectUrl,
          },
        })
        console.log('Forgot password response:', result)
        toast.success(result.message)
        setSuccess(true)
      } catch (err: any) {
        console.error('Forgot password error:', err)
        setError(
          err?.response?.data?.message || err?.message || 'Request failed.'
        )
      } finally {
        setIsPending(false)
      }
    },
  })

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="rounded-full bg-green-100 p-4">
          <Mail className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="text-center text-gray-600">
          If an account with that email exists, you'll receive instructions to
          reset your password.
        </p>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col items-center justify-center gap-4">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <Mail className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
        <p className="mt-2 text-sm text-gray-600">
          Enter your email and we'll send you a link to reset your password.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        className="flex w-full flex-col gap-4"
      >
        <form.Field name="email">
          {(field) => (
            <div className="flex w-full flex-col gap-2">
              <Label htmlFor={field.name}>Email *</Label>
              <Input
                name={field.name}
                type="email"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="you@company.com"
                disabled={isPending}
              />
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>

        {error && (
          <div className="bg-destructive/15 text-destructive rounded-md p-3 text-sm">
            {error}
          </div>
        )}

        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting || isPending}
              className="from-primary to-tertiary w-full rounded-full bg-gradient-to-r text-white"
            >
              {isSubmitting || isPending ? 'Sending...' : 'Send reset link'}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="text-center text-sm text-gray-500">
        <p>
          Remember your password?{' '}
          <button
            onClick={() => router.push('/login')}
            className="text-blue-600 underline hover:text-blue-800"
          >
            Back to Login
          </button>
        </p>
      </div>
    </div>
  )
}
