'use client'

import { useForm } from '@tanstack/react-form'
import { EWalletSchema, EWalletFormValues } from '@/types/account'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldInfo } from '@/components/ui/form'

export function EWalletForm({
  defaultValues,
  onSubmit,
}: {
  defaultValues?: EWalletFormValues
  onSubmit: (values: EWalletFormValues) => Promise<void>
}) {
  const isEditForm = !!defaultValues?.id

  const form = useForm({
    defaultValues: defaultValues
      ? { ...defaultValues, type: 'ewallet' }
      : {
          type: 'ewallet',
          provider: '',
          email: '',
          phone: '',
          account_name: '',
          account_number: '',
          is_primary: false,
        },
    validators: {
      onChange: EWalletSchema,
    },
    onSubmit: async ({ value }) => {
      const values = {
        id: value?.id,
        type: 'ewallet',
        provider: value.provider,
        email: value.email,
        phone: value.phone,
        account_name: value.account_name,
        account_number: value.account_number,
        is_primary: value.is_primary,
      } satisfies EWalletFormValues

      await onSubmit(values)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="flex flex-col space-y-6 p-12 py-8"
    >
      <h3 className="border-b py-4 text-xl font-bold lg:text-2xl">
        {isEditForm ? 'Edit E-Wallet' : 'Add E-Wallet'}
      </h3>

      <form.Field name="provider">
        {(field) => (
          <div className="space-y-3">
            <Label>Provider</Label>
            <Input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldInfo field={field} />
          </div>
        )}
      </form.Field>

      <form.Field name="email">
        {(field) => (
          <div className="space-y-3">
            <Label>Email</Label>
            <Input
              type="email"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldInfo field={field} />
          </div>
        )}
      </form.Field>

      <form.Field name="phone">
        {(field) => (
          <div className="space-y-3">
            <Label>Phone</Label>
            <Input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldInfo field={field} />
          </div>
        )}
      </form.Field>

      <form.Field name="account_name">
        {(field) => (
          <div className="space-y-3">
            <Label>Account Name</Label>
            <Input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldInfo field={field} />
          </div>
        )}
      </form.Field>

      <form.Field name="account_number">
        {(field) => (
          <div className="space-y-3">
            <Label>Account Number</Label>
            <Input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldInfo field={field} />
          </div>
        )}
      </form.Field>

      <form.Field name="is_primary">
        {(field) => (
          <div className="border-muted-foreground/30 bg-muted-foreground/20 flex items-center gap-2 rounded-lg border px-2.5 py-4">
            <Checkbox
              checked={field.state.value}
              onCheckedChange={(v) => field.handleChange(!!v)}
            />
            <Label>Set as Primary</Label>
          </div>
        )}
      </form.Field>

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <Button
            type="submit"
            className="h-11 w-full self-end text-white"
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        )}
      />
    </form>
  )
}
