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
import { delay } from '@/utils/delay'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const roleMap: Record<string, string> = {
  agent: 'Agent',
  referral: 'Referral',
}

export const ApplyForm = () => {
  const router = useRouter()
  const { mutateAsync: createAgentApplication } = useCreateAgentApplication()

  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      application_type: '' as any,
      contact_number: '',
      notes: '',
    } as ApplyFormValues,
    validators: {
      onSubmit: applyFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await createAgentApplication(value)
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
              <Label className="text-muted-foreground">First Name</Label>
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
              <Label className="text-muted-foreground">Last Name</Label>
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
            <Label className="text-muted-foreground">Email</Label>
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
            <Label className="text-muted-foreground">Phone</Label>
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

      <form.Field name="application_type">
        {(field) => (
          <div className="space-y-2.5">
            <Label className="text-muted-foreground">Role</Label>
            <Select
              onValueChange={(value) => field.handleChange(value as any)}
              value={field.state.value}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
              </SelectContent>
            </Select>

            <FieldInfo field={field} />
          </div>
        )}
      </form.Field>

      <form.Field name="notes">
        {(field) => (
          <div className="space-y-2.5">
            <Label className="text-muted-foreground">Message</Label>
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
          <div className="space-y-2">
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="bg-primary from-primary to-accent relative h-11 w-full self-end rounded-full bg-gradient-to-r via-90% px-12 text-sm font-medium text-white shadow-lg hover:bg-success disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto dark:text-white"
            >
              {isSubmitting ? 'Submitting…' : 'Submit'}
            </Button>
            {isSubmitting && (
              <p className="text-muted-foreground text-center text-xs">
                This may take up to a minute. Please don&apos;t close the page.
              </p>
            )}
          </div>
        )}
      </form.Subscribe>
    </form>
  )
}
