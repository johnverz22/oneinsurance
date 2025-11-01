'use client'

import { z } from 'zod'
import Link from 'next/link'
import { FormEvent } from 'react'
import { delay } from '@/utils/delay'
import { Loader2 } from 'lucide-react'
import { useForm } from '@tanstack/react-form'
import { PasswordInput } from '@/components/ui/password-input'
import { FieldInfo } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useSignInStateStore } from '@/store/signin-store'
import { redirect } from 'next/navigation'

const signinFormSchema = z.object({
  email: z.string().email({ message: 'Kindly enter valid email' }),
  password: z.string().min(1, { message: 'Password is required' }),
})

export const SigninForm = () => {
  const setEmail = useSignInStateStore((state) => state.setEmail)

  const form = useForm({
    validators: {
      onChange: signinFormSchema,
    },
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      console.log(value)
      await delay(2000)
      form.reset()
      setEmail(value.email)
      redirect('/')
    },
  })

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    form.handleSubmit()
  }

  return (
    <section className="flex w-full flex-1 place-items-center">
      <div className="mx-auto w-full max-w-md">
        <div className="space-y-2 pb-8">
          <h1 className="text-4xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground">
            We&apos;re glad to see you again. Enter your details to sign in.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <form.Field
            name="email"
            children={(field) => {
              return (
                <div className="space-y-2">
                  <Label htmlFor={field.name} className="capitalize">
                    {field.name}
                  </Label>

                  <Input
                    className="h-11"
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="johndoe@brand.com"
                  />

                  <FieldInfo field={field} />
                </div>
              )
            }}
          />

          <form.Field
            name="password"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name} className="capitalize">
                  {field.name}
                </Label>

                <PasswordInput
                  className="h-11"
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter your password"
                />

                <FieldInfo field={field} />
              </div>
            )}
          />

          <div className="pt-2">
            <div className="pb-4">
              <Link
                href="/forgot-password"
                className="text-muted-foreground text-sm"
              >
                Forgot Password?
              </Link>
            </div>

            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([_, isSubmitting]) => (
                <Button size="lg" className="w-full flex-1 text-white">
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    'Login'
                  )}
                </Button>
              )}
            />

            <div className="relative flex items-center justify-center">
              <div className="bg-foreground/20 absolute h-px w-full" />
              <small className="bg-background text-muted-foreground z-10 p-4">
                OR
              </small>
            </div>

            <Button variant="outline" size="lg" className="w-full flex-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="800px"
                height="800px"
                viewBox="-3 0 262 262"
                preserveAspectRatio="xMidYMid"
              >
                <path
                  d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                  fill="#4285F4"
                />
                <path
                  d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                  fill="#34A853"
                />
                <path
                  d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
                  fill="#FBBC05"
                />
                <path
                  d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                  fill="#EB4335"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="relative flex items-center justify-center py-8">
              <p className="text-muted-foreground text-sm">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="underline underline-offset-8">
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>
    </section>
  )
}
