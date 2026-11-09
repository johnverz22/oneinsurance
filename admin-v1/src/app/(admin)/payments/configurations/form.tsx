'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { FieldInfo } from '@/components/ui/form'

interface PaymentConfig {
  min_payout_amount: number
  max_payout_amount: number
  description: string
  is_active: boolean
}

const paymentConfigSchema = z
  .object({
    min_payout_amount: z.coerce
      .number()
      .positive('Must be a  valid positive number'),
    max_payout_amount: z.coerce
      .number()
      .positive('Must be a  valid positive number'),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters'),
    is_active: z.boolean(),
  })
  .refine((data) => data.max_payout_amount > data.min_payout_amount, {
    message: 'Maximum amount must be greater than minimum amount',
    path: ['max_payout_amount'],
  })

type PaymentConfigFormData = z.infer<typeof paymentConfigSchema>

export const PaymentConfigForm = ({
  initialData,
  onSubmit,
}: {
  initialData?: PaymentConfig
  onSubmit: (payload: PaymentConfigFormData) => void
}) => {
  const form = useForm({
    defaultValues: {
      min_payout_amount: initialData?.min_payout_amount || 0,
      max_payout_amount: initialData?.max_payout_amount || 0,
      description: initialData?.description || '',
      is_active: initialData?.is_active ?? true,
    } as PaymentConfigFormData,
    onSubmit: async ({ value }) => {
      onSubmit(value)
    },
    validators: {
      onChange: paymentConfigSchema,
    },
  })

  return (
    <div className="space-y-4">
      <form.Field name="min_payout_amount">
        {(field) => (
          <div className="space-y-2">
            <label htmlFor="min_payout_amount" className="text-sm font-medium">
              Minimum Payout Amount
            </label>
            <Input
              id="min_payout_amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(Number(e.target.value))}
            />
            <FieldInfo field={field} />
          </div>
        )}
      </form.Field>

      <form.Field name="max_payout_amount">
        {(field) => (
          <div className="space-y-2">
            <label htmlFor="max_payout_amount" className="text-sm font-medium">
              Maximum Payout Amount
            </label>
            <Input
              id="max_payout_amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(Number(e.target.value))}
            />
            <FieldInfo field={field} />
          </div>
        )}
      </form.Field>

      <form.Field name="description">
        {(field) => (
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="Enter description..."
              rows={3}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldInfo field={field} />
          </div>
        )}
      </form.Field>

      <form.Field name="is_active">
        {(field) => (
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_active"
              checked={field.state.value}
              onCheckedChange={(value) => field.handleChange(value as boolean)}
            />
            <label htmlFor="is_active" className="text-sm font-medium">
              Active Configuration
            </label>
          </div>
        )}
      </form.Field>

      <div className="flex justify-end gap-2 pt-4">
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              onClick={() => form.handleSubmit()}
              disabled={!canSubmit}
              className="px-8"
            >
              {isSubmitting
                ? 'Submitting...'
                : initialData
                  ? 'Update'
                  : 'Create'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </div>
  )
}
