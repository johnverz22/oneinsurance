'use client'

import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useForm } from '@tanstack/react-form'
import { applyFormSchema, ApplyFormValues } from './form.schema'
import { useCreateAgentApplication } from '@/app/data/mutations/application'
import { Textarea } from '@/components/ui/textarea'
import { FieldInfo } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export const ApplyForm = () => {
  const router = useRouter()
  const { mutateAsync: createAgentApplication } = useCreateAgentApplication()

  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      application_type: 'agent',
      contact_number: '',
      notes: '',
    } as ApplyFormValues,
    validators: {
      onSubmit: applyFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const { firstName, lastName, ...rest } = value
        const fullName = `${firstName} ${lastName}`

        const values = { ...rest, name: fullName }
        await createAgentApplication({ values })
        form.reset()

        toast.success(
          'Application submitted successfully. We’ll be in touch soon.'
        )
      } catch (error: unknown) {
        console.log('Failed to submit application:', error)

        const message =
          error instanceof Error ? error?.message : 'Something went wrong'
        toast.error(message)
      }
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="flex flex-col justify-end gap-4 py-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <form.Field name="firstName">
          {(field) => (
            <div className="space-y-2.5">
              <Label className="text-gray-500">First Name</Label>
              <Input
                placeholder="First Name"
                value={field.state.value}
                className="text-black"
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>

        <form.Field name="lastName">
          {(field) => (
            <div className="space-y-2.5">
              <Label className="text-gray-500">Last Name</Label>
              <Input
                placeholder="Last Name"
                value={field.state.value}
                className="text-black"
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>
      </div>

      <form.Field name="email">
        {(field) => (
          <div className="space-y-2.5">
            <Label className="text-gray-500">Email</Label>
            <Input
              type="email"
              placeholder="Email"
              value={field.state.value}
              className="text-black"
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />

            <FieldInfo field={field} />
          </div>
        )}
      </form.Field>

      <form.Field name="contact_number">
        {(field) => (
          <div className="space-y-2.5">
            <Label className="text-gray-500">Phone</Label>
            <Input
              placeholder="Phone Number"
              value={field.state.value}
              className="text-black"
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />

            <FieldInfo field={field} />
          </div>
        )}
      </form.Field>

      <form.Field name="notes">
        {(field) => (
          <div className="space-y-2.5">
            <Label className="text-gray-500">Message</Label>
            <Textarea
              placeholder="Message"
              value={field.state.value}
              className="rounded-2xl text-black"
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />

            <FieldInfo field={field} />
          </div>
        )}
      </form.Field>

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
      >
        {([canSubmit, isSubmitting]) => (
          <Button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="bg-primary from-primary to-accent relative h-11 w-full self-end rounded-full bg-gradient-to-r via-90% px-12 text-sm font-medium text-white shadow-lg hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto dark:text-white"
          >
            {isSubmitting ? 'Submitting…' : 'Submit'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
