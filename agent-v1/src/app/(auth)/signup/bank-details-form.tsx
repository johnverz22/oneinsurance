'use client'

import { Field, useForm } from '@tanstack/react-form'
import { bankDetailsSchema, BankDetails } from '@/types/agent/auth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { FieldInfo } from '@/components/ui/form'
import { useAgentRegistrationStore } from '@/store/agent-registration-store'

export default function BankDetailsForm() {
  const { bankDetails, increaseStep, setBankDetails, decreaseStep } =
    useAgentRegistrationStore()

  const form = useForm({
    defaultValues: bankDetails,
    validators: {
      onChange: bankDetailsSchema,
    },
    onSubmit: ({ value }) => {
      setBankDetails(value)
      increaseStep()
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Bank Name */}
        <form.Field name="bankName">
          {(field) => (
            <div className="space-y-1">
              <Label htmlFor="bankName" className="text-sm sm:text-base">
                Bank Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bankName"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Enter Bank Name"
                className="h-12 rounded-full bg-gray-50"
              />
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>

        {/* Bank Code */}
        <form.Field name="bankCode">
          {(field) => (
            <div className="space-y-1">
              <Label htmlFor="bankCode" className="text-sm sm:text-base">
                Bank Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bankCode"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Enter Bank Code"
                className="h-12 rounded-full bg-gray-50"
              />
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>
      </div>

      {/* SWIFT / BIC / Routing Number */}
      <form.Field name="routingNumber">
        {(field) => (
          <div className="space-y-1">
            <Label htmlFor="routingNumber" className="text-sm sm:text-base">
              SWIFT / BIC / Routing Number{' '}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="routingNumber"
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Enter SWIFT / BIC / Routing Number"
              className="h-12 rounded-full bg-gray-50"
            />
            <FieldInfo field={field} />
          </div>
        )}
      </form.Field>

      {/* Account Holder Name */}
      <form.Field name="accountHolderName">
        {(field) => (
          <div className="space-y-1">
            <Label htmlFor="accountHolderName" className="text-sm sm:text-base">
              Account Holder Name <span className="text-red-500">*</span>
              <span className="text-muted-foreground ml-2 text-sm font-normal italic">
                Must match Valid ID
              </span>
            </Label>
            <Input
              id="accountHolderName"
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Enter Account Holder Name"
              className="h-12 rounded-full bg-gray-50"
            />
            <FieldInfo field={field} />
          </div>
        )}
      </form.Field>

      {/* Account Number */}
      <form.Field name="accountNumber">
        {(field) => (
          <div className="space-y-1">
            <Label htmlFor="accountNumber" className="text-sm sm:text-base">
              Account Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="accountNumber"
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Enter Account Number"
              className="h-12 rounded-full bg-gray-50"
            />
            <FieldInfo field={field} />
          </div>
        )}
      </form.Field>

      {/* Account Type */}
      <form.Field name="accountType">
        {(field) => (
          <div className="space-y-3">
            <Label className="text-sm sm:text-base">
              Account Type <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={field.state.value}
              onValueChange={(value) =>
                field.handleChange(value as 'savings' | 'current')
              }
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="savings" id="savings" />
                <Label htmlFor="savings" className="cursor-pointer font-normal">
                  Savings
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="current" id="current" />
                <Label htmlFor="current" className="cursor-pointer font-normal">
                  Current
                </Label>
              </div>
            </RadioGroup>
            <FieldInfo field={field} />
          </div>
        )}
      </form.Field>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => decreaseStep()}
          className="min-w-[120px] rounded-full border-2 px-8 py-2 text-base font-semibold"
        >
          Back
        </Button>
        <form.Subscribe>
          <Button
            type="submit"
            disabled={!form.state.canSubmit || form.state.isSubmitting}
            className="from-primary to-lilac min-w-[120px] rounded-full bg-gradient-to-r px-8 py-2 text-base font-semibold hover:bg-green-800"
          >
            Next
          </Button>
        </form.Subscribe>
      </div>
    </form>
  )
}
