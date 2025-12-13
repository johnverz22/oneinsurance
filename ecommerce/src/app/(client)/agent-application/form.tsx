'use client'

import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { applyFormSchema, ApplyFormValues } from './form.schema'
import { FieldInfo } from '@/components/ui/form'
import { Label } from '@/components/ui/label'

export const ApplyForm = () => {
  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      message: '',
    } as ApplyFormValues,
    validators: {
      onSubmit: applyFormSchema,
    },
    onSubmit: async ({ value }) => {
      console.log('Form submitted:', value)
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

      <form.Field name="phone">
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

      <form.Field name="message">
        {(field) => (
          <div className="space-y-2.5">
            <Label className="text-gray-500">Message</Label>
            <Input
              placeholder="Message"
              value={field.state.value}
              className="text-black"
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
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
