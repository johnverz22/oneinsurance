'use client'

import { useForm } from '@tanstack/react-form'
import { signupSchema } from '@/types/signup-schema'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  useSignUpStateStore,
  useSignUpStepStateStore,
} from '@/store/signup-store'
import {
  FIELD_CONTAINER_STYLE,
  REQUIRED_FIELD_INDICATOR_STYLE,
} from './form-style'
import { ChevronRight } from 'lucide-react'
import { Label } from '@radix-ui/react-label'
import { Input } from '@/components/ui/input'
import { FieldInfo } from '../ui/form'

const accountCredentialSchema = signupSchema
  .pick({
    email: true,
    password: true,
    confirmPassword: true,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password don't match",
    path: ['confirmPassword'],
  })

type AccountCredentialSchema = z.infer<typeof accountCredentialSchema>

export default function AccountCredentialForm() {
  const increaseStep = useSignUpStepStateStore((state) => state.increaseStep)
  const { setData, email, password, confirmPassword } = useSignUpStateStore()

  const form = useForm({
    defaultValues: {
      email: email ?? '',
      password: password ?? '',
      confirmPassword: confirmPassword ?? '',
    },
    validators: {
      onChange: accountCredentialSchema,
    },
    onSubmit: async ({ value }: { value: AccountCredentialSchema }) => {
      setData(value)
      increaseStep()
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await form.handleSubmit()
  }

  return (
    <>
      <section className="flex w-full flex-col gap-4 p-[10%]">
        <div className="flex flex-col">
          <h1 className="text-primary text-3xl font-bold tracking-wide sm:text-4xl md:text-5xl lg:text-6xl">
            Welcome!
          </h1>
          <p className="text-sm font-light tracking-normal text-gray-600 sm:text-base md:text-lg">
            Comprehensive Insurance Solutions Tailored for Success
          </p>
        </div>
        <span className="text-xs font-extralight tracking-normal">
          Step 1 of 5: Account Credentials
        </span>
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
          {/* Email Input */}
          <form.Field name="email">
            {(field) => {
              return (
                <>
                  <div className={FIELD_CONTAINER_STYLE}>
                    <Label htmlFor={field.name} className="capitalize">
                      Email{' '}
                      <span className={REQUIRED_FIELD_INDICATOR_STYLE}>*</span>
                    </Label>

                    <div className="flex flex-col gap-1">
                      <Input
                        type="text"
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="johndoe@email.com"
                      />

                      <FieldInfo field={field} />
                    </div>
                  </div>
                </>
              )
            }}
          </form.Field>

          {/* Password input */}
          <form.Field name="password">
            {(field) => {
              return (
                <>
                  <div className={FIELD_CONTAINER_STYLE}>
                    <Label htmlFor={field.name} className="capitalize">
                      Password{' '}
                      <span className={REQUIRED_FIELD_INDICATOR_STYLE}>*</span>
                    </Label>
                    <Input
                      type="password"
                      name={field.name}
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldInfo field={field} />
                  </div>
                </>
              )
            }}
          </form.Field>

          {/* Confirm Password input */}
          <form.Field name="confirmPassword">
            {(field) => {
              return (
                <>
                  <div className={FIELD_CONTAINER_STYLE}>
                    <Label htmlFor={field.name} className="capitalize">
                      Confirm Password{' '}
                      <span className={REQUIRED_FIELD_INDICATOR_STYLE}>*</span>
                    </Label>
                    <Input
                      type="password"
                      name={field.name}
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    <FieldInfo field={field} />
                  </div>
                </>
              )
            }}
          </form.Field>

          <form.Subscribe>
            <div className="mt-4 grid grid-cols-2 place-content-around gap-3">
              <div></div>
              <Button type="submit">
                Next <ChevronRight />
              </Button>
            </div>
          </form.Subscribe>
        </form>
      </section>
    </>
  )
}
