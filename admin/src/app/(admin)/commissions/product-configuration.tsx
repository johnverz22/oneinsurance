import { useUpdateCommissionConfiguration } from '@/app/data/mutations/commission'
import { Button } from '@/components/ui/button'
import { FieldInfo } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  CommissionConfig,
  CommissionConfigUpdateRequest,
} from '@/types/commission'
import { Product } from '@/types/products'
import { Value } from '@radix-ui/react-select'
import { FieldApi, useForm } from '@tanstack/react-form'
import React, { useState, useMemo } from 'react'
import { toast } from 'sonner'
import z from 'zod'
import { Calendar } from 'lucide-react'

interface ProductCommisionConfigurationProps {
  selectedCommissionConfig: CommissionConfig | null
  onUpdateSuccess?: () => void
}

const commisionConfigurationSchema = z.object({
  base_commission: z
    .number()
    .min(0, 'Base commission must be at least 0%')
    .max(30, 'Base commission cannot exceed 30%'),
  agent_commission: z
    .number()
    .min(0, 'Agent commission must be at least 0%')
    .max(15, 'Agent commission cannot exceed 15%'),
  agent_overrider_commission: z
    .number()
    .min(0, 'Agent overrider commission must be at least 0%')
    .max(10, 'Agent overrider commission cannot exceed 10%'),
  agent_admin_commission: z
    .number()
    .min(0, 'Agent Admin commission must be at least 0%'),
  agent_admin_overrider_commission: z
    .number()
    .min(0, 'Agent Admin overrider commission must be at least 0%')
    .max(10, 'Agent Admin overrider commission cannot exceed 10%'),
  referral_commission: z
    .number()
    .min(0, 'Referral commission must be at least 0%')
    .max(25, 'Referral commission cannot exceed 25%'),
  referral_overrider_commission: z
    .number()
    .min(0, 'Referral overrider commission must be at least 0%')
    .max(10, 'Referral overrider commission cannot exceed 10%'),
  referral_admin_commission: z
    .number()
    .min(0, 'Referral Admin commission must be at least 0%'),
  referral_admin_overrider_commission: z
    .number()
    .min(0, 'Referral Admin overrider commission must be at least 0%')
    .max(10, 'Referral Admin overrider commission cannot exceed 10%'),
  vat: z
    .number()
    .min(0, 'VAT must be at least 0%')
    .max(100, 'VAT cannot exceed 100%'),
  witholding_tax: z
    .number()
    .min(0, 'Withholding tax must be at least 0%')
    .max(100, 'Withholding tax cannot exceed 100%'),
  isWithVAT: z.boolean(),
  effectivity_date: z.string().min(1, 'Effectivity date is required'),
})
.refine((data) => data.agent_commission + data.agent_admin_commission === data.base_commission, {
  message: 'Agent + Admin commissions must equal Base commission',
  path: ['agent_commission'],
})
.refine((data) => data.referral_commission + data.referral_admin_commission === data.base_commission, {
  message: 'Referral + Admin commissions must equal Base commission',
  path: ['referral_commission'],
})
type CommisionConfigurationFormData = z.infer<
  typeof commisionConfigurationSchema
>

function mapFormDataToCommissionConfigUpdateRequest(
  formData: CommisionConfigurationFormData
): CommissionConfigUpdateRequest {
  return {
    base_commission: formData.base_commission,
    agent_commission: formData.agent_commission,
    agent_overrider_commission: formData.agent_overrider_commission,
    agent_admin_commission: formData.agent_admin_commission,
    agent_admin_overrider_commission: formData.agent_admin_overrider_commission,
    referral_commission: formData.referral_commission,
    referral_overrider_commission: formData.referral_overrider_commission,
    referral_admin_commission: formData.referral_admin_commission,
    referral_admin_overrider_commission: formData.referral_admin_overrider_commission,
    vat: formData.vat,
    witholding_tax: formData.witholding_tax,
    isWithVAT: formData.isWithVAT,
    effectivity_date: formData.effectivity_date,
    status: 'active',
  } satisfies CommissionConfigUpdateRequest
}

export default function ProductCommisionConfiguration({
  selectedCommissionConfig,
  onUpdateSuccess,
}: ProductCommisionConfigurationProps) {
  const { mutateAsync: updateConfingCommission } =
    useUpdateCommissionConfiguration()
  const [saleAmount, setSaleAmount] = useState<number>(1000)
  
  const form = useForm({
    defaultValues: {
      base_commission: Number(selectedCommissionConfig?.base_commission) ?? 30,
      agent_commission: Number(selectedCommissionConfig?.agent_commission) ?? 15,
      agent_overrider_commission:
        Number(selectedCommissionConfig?.agent_overrider_commission || selectedCommissionConfig?.agent_overriders_commission) ?? 10,
      agent_admin_commission: Number(selectedCommissionConfig?.agent_admin_commission || selectedCommissionConfig?.ifrc_admin) ?? 15,
      agent_admin_overrider_commission:
        Number(selectedCommissionConfig?.agent_admin_overrider_commission || selectedCommissionConfig?.ifrc_overrider_commission) ?? 10,
      referral_commission: Number(selectedCommissionConfig?.referral_commission || selectedCommissionConfig?.ifrc_digitech) ?? 25,
      referral_overrider_commission: Number(selectedCommissionConfig?.referral_overrider_commission || selectedCommissionConfig?.digitech_referral) ?? 5,
      referral_admin_commission:
        Number(selectedCommissionConfig?.referral_admin_commission || selectedCommissionConfig?.digitech_overriders) ?? 10,
      referral_admin_overrider_commission: Number(selectedCommissionConfig?.referral_admin_overrider_commission || selectedCommissionConfig?.ifrc_admin) ?? 25,
      vat: Number(selectedCommissionConfig?.vat) ?? 0,
      witholding_tax: Number(selectedCommissionConfig?.witholding_tax) ?? 0,
      isWithVAT: selectedCommissionConfig?.isWithVAT ?? false,
      effectivity_date: selectedCommissionConfig?.effectivity_date 
        ? selectedCommissionConfig.effectivity_date.split('T')[0] 
        : new Date().toISOString().split('T')[0],
    },
    validators: {
      onChange: commisionConfigurationSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const updateRequestData =
          mapFormDataToCommissionConfigUpdateRequest(value)
        const response = await updateConfingCommission({
          data: updateRequestData,
          commissionConfigId: selectedCommissionConfig!.id,
        })

        if (response?.success) {
          toast.success(response.message || 'Commission configuration updated successfully!')
          onUpdateSuccess?.()
        } else {
          toast.error(response?.message || 'Failed to update commission configuration.')
        }
      } catch (error) {
        console.error('Form submission error:', error)
        toast.error('An error occurred while saving the configuration.')
      }
    },
  })

  // Reset form when selectedCommissionConfig changes
  React.useEffect(() => {
    if (selectedCommissionConfig) {
      form.reset({
        base_commission: Number(selectedCommissionConfig.base_commission),
        agent_commission: Number(selectedCommissionConfig.agent_commission),
        agent_overrider_commission: Number(selectedCommissionConfig.agent_overrider_commission || selectedCommissionConfig.agent_overriders_commission),
        agent_admin_commission: Number(selectedCommissionConfig.agent_admin_commission || selectedCommissionConfig.ifrc_admin),
        agent_admin_overrider_commission: Number(selectedCommissionConfig.agent_admin_overrider_commission || selectedCommissionConfig.ifrc_overrider_commission),
        referral_commission: Number(selectedCommissionConfig.referral_commission || selectedCommissionConfig.ifrc_digitech),
        referral_overrider_commission: Number(selectedCommissionConfig.referral_overrider_commission || selectedCommissionConfig.digitech_referral),
        referral_admin_commission: Number(selectedCommissionConfig.referral_admin_commission || selectedCommissionConfig.digitech_overriders),
        referral_admin_overrider_commission: Number(selectedCommissionConfig.referral_admin_overrider_commission || selectedCommissionConfig.ifrc_admin),
        vat: Number(selectedCommissionConfig.vat) ?? 0,
        witholding_tax: Number(selectedCommissionConfig.witholding_tax) ?? 0,
        isWithVAT: selectedCommissionConfig.isWithVAT ?? false,
        effectivity_date: selectedCommissionConfig.effectivity_date.split('T')[0],
      })
    }
  }, [selectedCommissionConfig?.id])

  return (
    <div>
      {!selectedCommissionConfig ? (
        <div className="text-center">
          Select a product to configure commissions
        </div>
      ) : (
        <div className="space-y-10">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              void form.handleSubmit()
            }}
          >
            <div className="space-y-10">
              {/* Header */}
              <div className="space-y-4">
                <div>
                  <p className="text-xl font-bold">
                    {selectedCommissionConfig?.product.name}
                  </p>
                  <p className="text-base font-light">
                    Overall commission percentage for this product
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Base Commission */}
                  <form.Field
                    name="base_commission"
                    children={(field) => {
                      return (
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">
                            Base Commission
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              name={field.name}
                              id={field.name}
                              onChange={(e) => {
                                const commissionRate = Number(e.target.value)
                                field.handleChange(commissionRate)
                              }}
                              onBlur={field.handleBlur}
                              value={field.state.value.toString()}
                              className="h-10 w-24 text-right font-semibold"
                            />
                            <span className="text-sm text-gray-600">
                              % of total net sale amount
                            </span>
                          </div>
                          <FieldInfo field={field} />
                        </div>
                      )
                    }}
                  />

                  {/* Effectivity Date */}
                  <form.Field
                    name="effectivity_date"
                    children={(field) => {
                      return (
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">
                            Effectivity Date
                          </Label>
                          <div className="relative">
                            <Input
                              type="date"
                              name={field.name}
                              id={field.name}
                              onChange={(e) => {
                                field.handleChange(e.target.value)
                              }}
                              onBlur={field.handleBlur}
                              value={field.state.value}
                              className="h-10 w-full cursor-pointer font-medium [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
                            />
                            <Calendar className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
                          </div>
                          <FieldInfo field={field} />
                        </div>
                      )
                    }}
                  />

                  {/* VAT */}
                  <form.Field
                    name="vat"
                    children={(field) => {
                      return (
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">
                            VAT
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              name={field.name}
                              id={field.name}
                              onChange={(e) => {
                                field.handleChange(Number(e.target.value))
                              }}
                              onBlur={field.handleBlur}
                              value={field.state.value.toString()}
                              className="h-10 w-24 text-right font-semibold"
                              step="0.01"
                            />
                            <span className="text-sm text-gray-600">%</span>
                          </div>
                          <FieldInfo field={field} />
                        </div>
                      )
                    }}
                  />

                  {/* Withholding Tax */}
                  <form.Field
                    name="witholding_tax"
                    children={(field) => {
                      return (
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">
                            Withholding Tax
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              name={field.name}
                              id={field.name}
                              onChange={(e) => {
                                field.handleChange(Number(e.target.value))
                              }}
                              onBlur={field.handleBlur}
                              value={field.state.value.toString()}
                              className="h-10 w-24 text-right font-semibold"
                              step="0.01"
                            />
                            <span className="text-sm text-gray-600">%</span>
                          </div>
                          <FieldInfo field={field} />
                        </div>
                      )
                    }}
                  />

                  {/* Is With VAT Checkbox */}
                  <form.Field
                    name="isWithVAT"
                    children={(field) => {
                      return (
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">
                            VAT Status
                          </Label>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={field.name}
                              checked={field.state.value}
                              onCheckedChange={(checked) => {
                                field.handleChange(checked === true)
                              }}
                            />
                            <label
                              htmlFor={field.name}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Is With VAT
                            </label>
                          </div>
                          <FieldInfo field={field} />
                        </div>
                      )
                    }}
                  />
                </div>
              </div>

              {/* Commission Configuration fields*/}
              <div className="grid items-start gap-6 md:grid-cols-2">
                {/* Agent-based sales */}
                <div className="rounded-lg border-2 border-blue-300 bg-blue-50/30 p-6 shadow-sm">
                  <div className="mb-6 text-center">
                    <h3 className="text-lg font-bold text-blue-900">
                      Agent-based Sales
                    </h3>
                    <p className="text-sm text-blue-700">
                      Commission distribution when sale is made by an Agent
                    </p>
                  </div>
                  
                  {/* Validation error for agent commission */}
                  <form.Field
                    name="agent_commission"
                    children={(field) => (
                      <div className="mb-4">
                        <FieldInfo field={field} />
                      </div>
                    )}
                  />

                  <div className="space-y-4">
                    {/* Agent Group */}
                    <div className="rounded-lg border border-blue-200 bg-white p-4 shadow-sm">
                      <p className="mb-3 text-sm font-semibold text-blue-900">
                        Agent Commission
                      </p>
                      <div className="space-y-3">
                        {/* agent */}
                        <form.Field
                          name="agent_commission"
                          children={(field) => (
                            <div>
                              <div className="flex items-center justify-between rounded-lg bg-[#EFF6FF] px-4 py-2">
                                <Label className="font-semibold text-black">
                                  Agent
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    name={field.name}
                                    id={field.name}
                                    onChange={(e) =>
                                      field.handleChange(Number(e.target.value))
                                    }
                                    onBlur={field.handleBlur}
                                    value={field.state.value.toString()}
                                    className="h-9 w-20 text-right text-black"
                                  />
                                  <span className="text-muted-foreground">%</span>
                                </div>
                              </div>
                            </div>
                          )}
                        />
                        {/* agent overrider */}
                        <form.Field
                          name="agent_overrider_commission"
                          children={(field) => (
                            <div>
                              <div className="ml-4 flex items-center justify-between rounded-lg bg-[#F0FDF4] px-3 py-1.5">
                                <Label className="text-sm font-medium text-black">
                                  Overrider
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    name={field.name}
                                    id={field.name}
                                    onChange={(e) =>
                                      field.handleChange(Number(e.target.value))
                                    }
                                    onBlur={field.handleBlur}
                                    value={field.state.value.toString()}
                                    className="h-8 w-16 text-right text-black"
                                  />
                                  <span className="text-muted-foreground text-sm">%</span>
                                </div>
                              </div>
                              <FieldInfo field={field} />
                            </div>
                          )}
                        />
                      </div>
                    </div>

                    {/* Admin Group */}
                    <div className="rounded-lg border border-purple-200 bg-white p-4 shadow-sm">
                      <p className="mb-3 text-sm font-semibold text-purple-900">
                        Admin Commission
                      </p>
                      <div className="space-y-3">
                        {/* IFRC admin for Agent-based */}
                        <form.Field
                          name="agent_admin_commission"
                          children={(field) => (
                            <div>
                              <div className="flex items-center justify-between rounded-lg bg-[#F5F0FC] px-4 py-2">
                                <Label className="font-semibold text-black">
                                  Admin
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    name={field.name}
                                    id={field.name}
                                    onChange={(e) =>
                                      field.handleChange(Number(e.target.value))
                                    }
                                    onBlur={field.handleBlur}
                                    value={field.state.value.toString()}
                                    className="h-9 w-20 text-right text-black"
                                  />
                                  <span className="text-muted-foreground">%</span>
                                </div>
                              </div>
                              <FieldInfo field={field} />
                            </div>
                          )}
                        />
                        {/* IFRC admin overrider for Agent-based */}
                        <form.Field
                          name="agent_admin_overrider_commission"
                          children={(field) => (
                            <div>
                              <div className="ml-4 flex items-center justify-between rounded-lg bg-[#FFF7ED] px-3 py-1.5">
                                <Label className="text-sm font-medium text-black">
                                  Overrider
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    name={field.name}
                                    id={field.name}
                                    onChange={(e) =>
                                      field.handleChange(Number(e.target.value))
                                    }
                                    onBlur={field.handleBlur}
                                    value={field.state.value.toString()}
                                    className="h-8 w-16 text-right text-black"
                                  />
                                  <span className="text-muted-foreground text-sm">%</span>
                                </div>
                              </div>
                              <FieldInfo field={field} />
                            </div>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Referral-based sales */}
                <div className="rounded-lg border-2 border-green-300 bg-green-50/30 p-6 shadow-sm">
                  <div className="mb-6 text-center">
                    <h3 className="text-lg font-bold text-green-900">
                      Referral-based Sales
                    </h3>
                    <p className="text-sm text-green-700">
                      Commission distribution when sale is made by a Referral
                    </p>
                  </div>
                  
                  {/* Validation error for referral commission */}
                  <form.Field
                    name="referral_commission"
                    children={(field) => (
                      <div className="mb-4">
                        <FieldInfo field={field} />
                      </div>
                    )}
                  />

                  <div className="space-y-4">
                    {/* Referral Group */}
                    <div className="rounded-lg border border-blue-200 bg-white p-4 shadow-sm">
                      <p className="mb-3 text-sm font-semibold text-blue-900">
                        Referral Commission
                      </p>
                      <div className="space-y-3">
                        {/* Referral */}
                        <form.Field
                          name="referral_commission"
                          children={(field) => (
                            <div>
                              <div className="flex items-center justify-between rounded-lg bg-[#EFF6FF] px-4 py-2">
                                <Label className="font-semibold text-black">
                                  Referral
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    name={field.name}
                                    id={field.name}
                                    onChange={(e) =>
                                      field.handleChange(Number(e.target.value))
                                    }
                                    onBlur={field.handleBlur}
                                    value={field.state.value.toString()}
                                    className="h-9 w-20 text-right text-black"
                                  />
                                  <span className="text-muted-foreground">%</span>
                                </div>
                              </div>
                            </div>
                          )}
                        />
                        {/* Referral overrider */}
                        <form.Field
                          name="referral_overrider_commission"
                          children={(field) => (
                            <div>
                              <div className="ml-4 flex items-center justify-between rounded-lg bg-[#F0FDF4] px-3 py-1.5">
                                <Label className="text-sm font-medium text-black">
                                  Overrider
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    name={field.name}
                                    id={field.name}
                                    onChange={(e) =>
                                      field.handleChange(Number(e.target.value))
                                    }
                                    onBlur={field.handleBlur}
                                    value={field.state.value.toString()}
                                    className="h-8 w-16 text-right text-black"
                                  />
                                  <span className="text-muted-foreground text-sm">%</span>
                                </div>
                              </div>
                              <FieldInfo field={field} />
                            </div>
                          )}
                        />
                      </div>
                    </div>

                    {/* Admin Group */}
                    <div className="rounded-lg border border-purple-200 bg-white p-4 shadow-sm">
                      <p className="mb-3 text-sm font-semibold text-purple-900">
                        Admin Commission
                      </p>
                      <div className="space-y-3">
                        {/* Admin for Referral-based */}
                        <form.Field
                          name="referral_admin_commission"
                          children={(field) => (
                            <div>
                              <div className="flex items-center justify-between rounded-lg bg-[#F5F0FC] px-4 py-2">
                                <Label className="font-semibold text-black">
                                  Admin
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    name={field.name}
                                    id={field.name}
                                    onChange={(e) =>
                                      field.handleChange(Number(e.target.value))
                                    }
                                    onBlur={field.handleBlur}
                                    value={field.state.value.toString()}
                                    className="h-9 w-20 text-right text-black"
                                  />
                                  <span className="text-muted-foreground">%</span>
                                </div>
                              </div>
                              <FieldInfo field={field} />
                            </div>
                          )}
                        />
                        {/* Admin overrider for Referral-based */}
                        <form.Field
                          name="referral_admin_overrider_commission"
                          children={(field) => (
                            <div>
                              <div className="ml-4 flex items-center justify-between rounded-lg bg-[#FFF7ED] px-3 py-1.5">
                                <Label className="text-sm font-medium text-black">
                                  Overrider
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    name={field.name}
                                    id={field.name}
                                    onChange={(e) =>
                                      field.handleChange(Number(e.target.value))
                                    }
                                    onBlur={field.handleBlur}
                                    value={field.state.value.toString()}
                                    className="h-8 w-16 text-right text-black"
                                  />
                                  <span className="text-muted-foreground text-sm">%</span>
                                </div>
                              </div>
                              <FieldInfo field={field} />
                            </div>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button - moved inside form */}
            <div className="mt-6 flex justify-end gap-2">
              {/* Temporarily hidden
              <Button
                variant={'outline'}
                className="rounded-full"
                onClick={(e) => {
                  e.preventDefault()
                  toast.info('Feature under development')
                }}
              >
                Reset to Default
              </Button>
              <Button
                variant={'outline'}
                className="rounded-full"
                onClick={(e) => {
                  e.preventDefault()
                  toast.info('Feature under development')
                }}
              >
                Apply to all Products
              </Button>
              */}
              <Button
                type="submit"
                className="rounded-full bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => {}}
              >
                Save Configuration
              </Button>
            </div>

            {/* Form submission status */}
            <form.Subscribe
              selector={(state) => [state.isSubmitting]}
              children={([isSubmitting]) => {
                return (
                  <>
                    {isSubmitting && (
                      <div className="mt-2 text-blue-600 font-semibold">Saving configuration...</div>
                    )}
                  </>
                )
              }}
            />
          </form>
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-xl font-bold">Commission Simulator</p>
              <p className="text-base font-light">
                Preview how commissions will be distributed based on sale amount
              </p>
              <div className="flex items-center gap-4">
                <Label className="font-semibold">Sale Amount:</Label>
                <div className="flex items-center">
                  <span className="mr-2">₱</span>
                  <Input
                    type="number"
                    value={saleAmount}
                    onChange={(e) => setSaleAmount(Number(e.target.value) || 0)}
                    className="h-10 w-40 text-right"
                    min={0}
                    step={100}
                  />
                </div>
              </div>
            </div>
            <form.Subscribe>
              {(field) => {
                const baseCommissionTotal =
                  (field.values.base_commission / 100) * saleAmount
                
                // VAT and Withholding Tax calculations
                const vatAmount = baseCommissionTotal * (field.values.vat / 100)
                const withholdingTaxAmount = baseCommissionTotal * (field.values.witholding_tax / 100)
                
                // Net commission calculation based on isWithVAT
                let netCommission
                if (field.values.isWithVAT) {
                  netCommission = baseCommissionTotal - vatAmount - withholdingTaxAmount
                } else {
                  netCommission = baseCommissionTotal + vatAmount - withholdingTaxAmount
                }
                
                // Agent-based calculations
                const agentCommissionTotal =
                  (field.values.agent_commission / 100) * saleAmount
                const agentOverriderTotal =
                  (field.values.agent_overrider_commission / 100) * agentCommissionTotal

                const agentAdminCommissionTotal =
                  (field.values.agent_admin_commission / 100) * saleAmount
                const agentAdminOverriderTotal =
                  (field.values.agent_admin_overrider_commission / 100) * agentAdminCommissionTotal

                // Referral-based calculations
                const referralCommissionTotal =
                  (field.values.referral_commission / 100) * saleAmount
                const referralOverriderTotal =
                  (field.values.referral_overrider_commission / 100) *
                  referralCommissionTotal
                
                const referralAdminCommissionTotal =
                  (field.values.referral_admin_commission / 100) * saleAmount
                const referralAdminOverriderTotal =
                  (field.values.referral_admin_overrider_commission / 100) * referralAdminCommissionTotal
                
                return (
                  <div className="space-y-4">
                    
                    <div className="grid items-start gap-6 md:grid-cols-2">
                      {/* Agent-based Distribution */}
                      <div className="rounded-lg border-2 border-blue-300 bg-blue-50/30 p-6 shadow-sm">
                        <div className="mb-4 text-center">
                          <h4 className="text-base font-bold text-blue-900">
                            Agent-based Distribution
                          </h4>
                        </div>

                        <div className="space-y-4">
                          {/* Agent Group */}
                          <div className="rounded-lg border border-blue-200 bg-white p-3 shadow-sm">
                            <p className="mb-2 text-xs font-semibold text-blue-900">
                              Agent Commission
                            </p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between rounded-lg bg-[#EFF6FF] px-3 py-2 text-[#437AEE]">
                                <p className="text-sm font-semibold">Agent</p>
                                <p className="font-bold">
                                  ₱ {agentCommissionTotal.toFixed(2)}
                                </p>
                              </div>
                              <div className="ml-3 flex items-center justify-between rounded-lg bg-[#F0FDF4] px-2 py-1.5 text-[#24A34A]">
                                <p className="text-xs">Overrider</p>
                                <p className="text-sm font-semibold">
                                  ₱ {agentOverriderTotal.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Admin Group */}
                          <div className="rounded-lg border border-purple-200 bg-white p-3 shadow-sm">
                            <p className="mb-2 text-xs font-semibold text-purple-900">
                              Admin Commission
                            </p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between rounded-lg bg-[#F5F0FC] px-3 py-2 text-[#9636EA]">
                                <p className="text-sm font-semibold">Admin</p>
                                <p className="font-bold">
                                  ₱ {agentAdminCommissionTotal.toFixed(2)}
                                </p>
                              </div>
                              <div className="ml-3 flex items-center justify-between rounded-lg bg-[#FFF7ED] px-2 py-1.5 text-[#F08548]">
                                <p className="text-xs">Overrider</p>
                                <p className="text-sm font-semibold">
                                  ₱ {agentAdminOverriderTotal.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex justify-between border-t-2 border-blue-400 pt-3">
                          <p className="font-semibold text-blue-900">Agent-based Total:</p>
                          <p className="font-bold text-blue-900">
                            ₱{' '}
                            {(
                              agentCommissionTotal + agentAdminCommissionTotal
                            ).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Referral-based Distribution */}
                      <div className="rounded-lg border-2 border-green-300 bg-green-50/30 p-6 shadow-sm">
                        <div className="mb-4 text-center">
                          <h4 className="text-base font-bold text-green-900">
                            Referral-based Distribution
                          </h4>
                        </div>

                        <div className="space-y-4">
                          {/* Referral Group */}
                          <div className="rounded-lg border border-blue-200 bg-white p-3 shadow-sm">
                            <p className="mb-2 text-xs font-semibold text-blue-900">
                              Referral Commission
                            </p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between rounded-lg bg-[#EFF6FF] px-3 py-2 text-[#437AEE]">
                                <p className="text-sm font-semibold">Referral</p>
                                <p className="font-bold">
                                  ₱ {referralCommissionTotal.toFixed(2)}
                                </p>
                              </div>
                              <div className="ml-3 flex items-center justify-between rounded-lg bg-[#F0FDF4] px-2 py-1.5 text-[#24A34A]">
                                <p className="text-xs">Overrider</p>
                                <p className="text-sm font-semibold">
                                  ₱ {referralOverriderTotal.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Admin Group */}
                          <div className="rounded-lg border border-purple-200 bg-white p-3 shadow-sm">
                            <p className="mb-2 text-xs font-semibold text-purple-900">
                              Admin Commission
                            </p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between rounded-lg bg-[#F5F0FC] px-3 py-2 text-[#9636EA]">
                                <p className="text-sm font-semibold">Admin</p>
                                <p className="font-bold">
                                  ₱ {referralAdminCommissionTotal.toFixed(2)}
                                </p>
                              </div>
                              <div className="ml-3 flex items-center justify-between rounded-lg bg-[#FFF7ED] px-2 py-1.5 text-[#F08548]">
                                <p className="text-xs">Overrider</p>
                                <p className="text-sm font-semibold">
                                  ₱ {referralAdminOverriderTotal.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex justify-between border-t-2 border-green-400 pt-3">
                          <p className="font-semibold text-green-900">Referral-based Total:</p>
                          <p className="font-bold text-green-900">
                            ₱{' '}
                            {(
                              referralCommissionTotal + referralAdminCommissionTotal
                            ).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }}
            </form.Subscribe>
            <form.Subscribe>
              {(field) => {
                const grossCommission = (field.values.base_commission / 100) * saleAmount
                const vatAmount = grossCommission * (field.values.vat / 100)
                const withholdingTaxAmount = grossCommission * (field.values.witholding_tax / 100)
                
                let netCommission
                if (field.values.isWithVAT) {
                  netCommission = grossCommission - vatAmount - withholdingTaxAmount
                } else {
                  netCommission = grossCommission + vatAmount - withholdingTaxAmount
                }
                
                return (
                  <div className="space-y-3">
                    {/* Gross Commission */}
                    <div className="flex items-center justify-between rounded-lg bg-blue-100 p-4 text-black">
                      <div>
                        <p className="text-lg font-bold">
                          Gross Commission (₱ {saleAmount.toLocaleString()} sale):
                        </p>
                        <p className="font-light text-sm">
                          Base commission Rate: {field.values.base_commission}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xl font-bold">₱ {grossCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>

                    {/* VAT and Withholding Tax Breakdown */}
                    <div className="rounded-lg border-2 border-gray-300 bg-white p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">VAT ({field.values.vat}%):</span>
                          <span className="font-semibold">{field.values.isWithVAT ? '-' : '+'} ₱ {vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Withholding Tax ({field.values.witholding_tax}%):</span>
                          <span className="font-semibold">- ₱ {withholdingTaxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{field.values.isWithVAT ? '✓' : '✗'} Is With VAT</span>
                        </div>
                      </div>
                    </div>

                    {/* Net Commission */}
                    <div className="flex items-center justify-between rounded-lg bg-green-100 p-4 text-black border-2 border-green-400">
                      <div>
                        <p className="text-lg font-bold text-green-900">
                          Net Commission:
                        </p>
                        <p className="font-light text-sm text-green-800">
                          After VAT and Withholding Tax
                        </p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-green-900">₱ {netCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>
                )
              }}
            </form.Subscribe>
          </div>
        </div>
      )}
    </div>
  )
}
