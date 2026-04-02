import { useUpdateCommissionConfiguration } from '@/app/data/mutations/commission'
import { Button } from '@/components/ui/button'
import { FieldInfo } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
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
import { getVatOptionFromCheckboxes, getCheckboxesFromVatOption } from '@/utils/vat-options-mapper'

interface ProductCommisionConfigurationProps {
  selectedCommissionConfig: CommissionConfig | null
  onUpdateSuccess?: () => void
}

const commisionConfigurationSchema = z.object({
  base_commission: z
    .number()
    .min(0, 'Base commission must be at least 0%')
    .max(100, 'Base commission cannot exceed 100%'),
  agent_commission: z
    .number()
    .min(0, 'Agent commission must be at least 0%')
    .max(100, 'Agent commission cannot exceed 100%'),
  agent_overrider_commission: z
    .number()
    .min(0, 'Agent overrider commission must be at least 0%')
    .max(100, 'Agent overrider commission cannot exceed 100%'),
  agent_admin_commission: z
    .number()
    .min(0, 'Agent Admin commission must be at least 0%')
    .max(100, 'Agent Admin commission cannot exceed 100%'),
  agent_admin_overrider_commission: z
    .number()
    .min(0, 'Agent Admin overrider commission must be at least 0%')
    .max(100, 'Agent Admin overrider commission cannot exceed 100%'),
  referral_commission: z
    .number()
    .min(0, 'Referral commission must be at least 0%')
    .max(100, 'Referral commission cannot exceed 100%'),
  referral_overrider_commission: z
    .number()
    .min(0, 'Referral overrider commission must be at least 0%')
    .max(100, 'Referral overrider commission cannot exceed 100%'),
  referral_admin_commission: z
    .number()
    .min(0, 'Referral Admin commission must be at least 0%')
    .max(100, 'Referral Admin commission cannot exceed 100%'),
  referral_admin_overrider_commission: z
    .number()
    .min(0, 'Referral Admin overrider commission must be at least 0%')
    .max(100, 'Referral Admin overrider commission cannot exceed 100%'),
  vat: z
    .number()
    .min(0, 'VAT must be at least 0%')
    .max(100, 'VAT cannot exceed 100%'),
  witholding_tax: z
    .number()
    .min(0, 'Withholding tax must be at least 0%')
    .max(100, 'Withholding tax cannot exceed 100%'),
  isWithVAT: z.boolean(),
  returnVAT: z.boolean(),
  voidVAT: z.boolean(),
  applyGrossVAT: z.boolean(),
  grossVATRate: z.number().min(0).max(100),
  effectivity_date: z.string().min(1, 'Effectivity date is required'),
})
type CommisionConfigurationFormData = z.infer<
  typeof commisionConfigurationSchema
>

function mapFormDataToCommissionConfigUpdateRequest(
  formData: CommisionConfigurationFormData
): CommissionConfigUpdateRequest {
  // Determine vatOptions based on checkbox states
  const vatOptions = getVatOptionFromCheckboxes({
    isWithVAT: formData.isWithVAT,
    returnVAT: formData.returnVAT,
    voidVAT: formData.voidVAT,
    applyGrossVAT: formData.applyGrossVAT,
  })

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
    gross_vat: formData.grossVATRate,
    isWithVAT: formData.isWithVAT,
    vatOptions: vatOptions,
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
      ...getCheckboxesFromVatOption(selectedCommissionConfig?.vatOptions),
      grossVATRate: Number(selectedCommissionConfig?.gross_vat) ?? 0,
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

  // Automatic calculation functions
  const handleAgentCommissionChange = (value: number) => {
    const baseCommission = form.getFieldValue('base_commission')
    const newAdminCommission = Math.max(0, baseCommission - value)
    form.setFieldValue('agent_commission', value)
    form.setFieldValue('agent_admin_commission', newAdminCommission)
  }

  const handleAgentAdminCommissionChange = (value: number) => {
    const baseCommission = form.getFieldValue('base_commission')
    const newAgentCommission = Math.max(0, baseCommission - value)
    form.setFieldValue('agent_admin_commission', value)
    form.setFieldValue('agent_commission', newAgentCommission)
  }

  const handleReferralCommissionChange = (value: number) => {
    const baseCommission = form.getFieldValue('base_commission')
    const newReferralAdminCommission = Math.max(0, baseCommission - value)
    form.setFieldValue('referral_commission', value)
    form.setFieldValue('referral_admin_commission', newReferralAdminCommission)
  }

  const handleReferralAdminCommissionChange = (value: number) => {
    const baseCommission = form.getFieldValue('base_commission')
    const newReferralCommission = Math.max(0, baseCommission - value)
    form.setFieldValue('referral_admin_commission', value)
    form.setFieldValue('referral_commission', newReferralCommission)
  }

  const handleBaseCommissionChange = (value: number) => {
    const currentAgentCommission = form.getFieldValue('agent_commission')
    const currentReferralCommission = form.getFieldValue('referral_commission')
    
    // Update base commission
    form.setFieldValue('base_commission', value)
    
    // Auto-adjust admin commissions to maintain the split
    form.setFieldValue('agent_admin_commission', Math.max(0, value - currentAgentCommission))
    form.setFieldValue('referral_admin_commission', Math.max(0, value - currentReferralCommission))
  }

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
        ...getCheckboxesFromVatOption(selectedCommissionConfig.vatOptions),
        grossVATRate: Number(selectedCommissionConfig.gross_vat) ?? 0,
        effectivity_date: selectedCommissionConfig.effectivity_date
          ? selectedCommissionConfig.effectivity_date.split('T')[0]
          : new Date().toISOString().split('T')[0],
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
                                handleBaseCommissionChange(commissionRate)
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
                </div>
              </div>

              {/* Tax Configuration Card */}
              <div className="rounded-lg border-2 border-gray-300 bg-gray-50 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Tax Configuration</h3>
                
                <div className="grid grid-cols-2 gap-6">
                  {/* VAT */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">
                      Value-Added Tax (VAT)
                    </Label>
                    <form.Field
                      name="vat"
                      children={(field) => {
                        return (
                          <div className="space-y-2">
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
                  </div>

                  {/* Withholding Tax */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">
                      Withholding Tax (WHT)
                    </Label>
                    <form.Field
                      name="witholding_tax"
                      children={(field) => {
                        return (
                          <div className="space-y-2">
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
                  </div>
                </div>

                {/* VAT Options */}
                <div className="mt-6 space-y-3">
                  <form.Field
                    name="isWithVAT"
                    children={(field) => {
                      return (
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="deduct-vat"
                            checked={field.state.value}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.handleChange(true)
                                form.setFieldValue('returnVAT', false)
                                form.setFieldValue('voidVAT', false)
                                form.setFieldValue('applyGrossVAT', false)
                              } else {
                                field.handleChange(false)
                              }
                            }}
                          />
                          <label
                            htmlFor="deduct-vat"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Deduct VAT
                          </label>
                        </div>
                      )
                    }}
                  />

                  <form.Field
                    name="returnVAT"
                    children={(field) => {
                      return (
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="return-vat"
                            checked={field.state.value}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.handleChange(true)
                                form.setFieldValue('isWithVAT', false)
                                form.setFieldValue('voidVAT', false)
                                form.setFieldValue('applyGrossVAT', false)
                              } else {
                                field.handleChange(false)
                              }
                            }}
                          />
                          <label
                            htmlFor="return-vat"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Return VAT
                          </label>
                        </div>
                      )
                    }}
                  />

                  <form.Field
                    name="voidVAT"
                    children={(field) => {
                      return (
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="void"
                            checked={field.state.value}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.handleChange(true)
                                form.setFieldValue('isWithVAT', false)
                                form.setFieldValue('returnVAT', false)
                                form.setFieldValue('applyGrossVAT', false)
                              } else {
                                field.handleChange(false)
                              }
                            }}
                          />
                          <label
                            htmlFor="void"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Void
                          </label>
                        </div>
                      )
                    }}
                  />

                  <div className="space-y-2">
                    <form.Field
                      name="applyGrossVAT"
                      children={(field) => {
                        return (
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="apply-gross-vat"
                              checked={field.state.value}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.handleChange(true)
                                  form.setFieldValue('isWithVAT', false)
                                  form.setFieldValue('returnVAT', false)
                                  form.setFieldValue('voidVAT', false)
                                } else {
                                  field.handleChange(false)
                                }
                              }}
                            />
                            <label
                              htmlFor="apply-gross-vat"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Apply gross VAT
                            </label>
                          </div>
                        )
                      }}
                    />
                    <form.Field
                      name="applyGrossVAT"
                      children={(applyGrossVATField) => (
                        <form.Field
                          name="grossVATRate"
                          children={(field) => {
                            return (
                              <div className="ml-6">
                                <Label className="text-sm text-gray-600">VAT factor (%)</Label>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  className="mt-1 h-10 w-48"
                                  step="0.01"
                                  value={field.state.value.toString()}
                                  onChange={(e) => field.handleChange(Number(e.target.value))}
                                  disabled={!applyGrossVATField.state.value}
                                />
                              </div>
                            )
                          }}
                        />
                      )}
                    />
                  </div>
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
                                      handleAgentCommissionChange(Number(e.target.value))
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
                              <div className="ml-4 flex items-center justify-between rounded-lg bg-[#F3F4F6] px-3 py-1.5">
                                <Label className="text-sm font-medium text-gray-900">
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
                                    className="h-8 w-16 text-right text-gray-900"
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
                                      handleAgentAdminCommissionChange(Number(e.target.value))
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
                              <div className="ml-4 flex items-center justify-between rounded-lg bg-[#F3F4F6] px-3 py-1.5">
                                <Label className="text-sm font-medium text-gray-900">
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
                                    className="h-8 w-16 text-right text-gray-900"
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
                                      handleReferralCommissionChange(Number(e.target.value))
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
                              <div className="ml-4 flex items-center justify-between rounded-lg bg-[#F3F4F6] px-3 py-1.5">
                                <Label className="text-sm font-medium text-gray-900">
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
                                    className="h-8 w-16 text-right text-gray-900"
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
                                      handleReferralAdminCommissionChange(Number(e.target.value))
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
                              <div className="ml-4 flex items-center justify-between rounded-lg bg-[#F3F4F6] px-3 py-1.5">
                                <Label className="text-sm font-medium text-gray-900">
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
                                    className="h-8 w-16 text-right text-gray-900"
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
                Preview how commissions will be distributed based on gross premium.
              </p>
              <div className="flex items-center gap-4">
                <Label className="font-semibold">Gross Premium:</Label>
                <div className="flex items-center">
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
                
                // Agent-based calculations
                // Step 1: Calculate gross commission for Agent only
                const agentGrossCommission = saleAmount * (field.values.agent_commission / 100)
                
                // Step 2: Apply VAT logic based on selected option
                let agentVatAmount = 0
                let agentWhtAmount = 0
                let agentNetCommission = 0
                let agentGrossAfterVatFactor = agentGrossCommission
                
                if (field.values.isWithVAT) {
                  // DEDUCT VAT: net = (gross - VAT) - WHT
                  agentVatAmount = agentGrossCommission * (field.values.vat / 100)
                  agentWhtAmount = agentGrossCommission * (field.values.witholding_tax / 100)
                  agentNetCommission = (agentGrossCommission - agentVatAmount) - agentWhtAmount
                } else if (field.values.voidVAT) {
                  // VOID: net = gross - WHT (VAT is voided/ignored)
                  agentVatAmount = agentGrossCommission * (field.values.vat / 100)
                  agentWhtAmount = agentGrossCommission * (field.values.witholding_tax / 100)
                  agentNetCommission = agentGrossCommission - agentWhtAmount
                } else if (field.values.returnVAT) {
                  // RETURN VAT: net = (gross + VAT) - WHT
                  agentVatAmount = agentGrossCommission * (field.values.vat / 100)
                  agentWhtAmount = agentGrossCommission * (field.values.witholding_tax / 100)
                  agentNetCommission = (agentGrossCommission + agentVatAmount) - agentWhtAmount
                } else if (field.values.applyGrossVAT && field.values.grossVATRate > 0) {
                  // APPLY GROSS VAT: 
                  // 1. grossAfterVatFactor = gross / vatFactor
                  // 2. VAT = grossAfterVatFactor * vat%
                  // 3. WHT = grossAfterVatFactor * wht%
                  // 4. net = gross - WHT
                  const vatFactor = 1 + (field.values.grossVATRate / 100)
                  agentGrossAfterVatFactor = agentGrossCommission / vatFactor
                  agentVatAmount = agentGrossAfterVatFactor * (field.values.vat / 100)
                  agentWhtAmount = agentGrossAfterVatFactor * (field.values.witholding_tax / 100)
                  agentNetCommission = agentGrossCommission - agentWhtAmount
                } else {
                  // No VAT option selected: net = gross - WHT
                  agentVatAmount = agentGrossCommission * (field.values.vat / 100)
                  agentWhtAmount = agentGrossCommission * (field.values.witholding_tax / 100)
                  agentNetCommission = agentGrossCommission - agentWhtAmount
                }
                
                // Calculate overrider (simple percentage, no VAT/WHT)
                const agentOverriderTotal = agentGrossCommission * (field.values.agent_overrider_commission / 100)
                
                // Calculate Admin commission (simple percentage, no VAT/WHT)
                const agentAdminCommissionTotal = saleAmount * (field.values.agent_admin_commission / 100)
                const agentAdminOverriderTotal = agentAdminCommissionTotal * (field.values.agent_admin_overrider_commission / 100)
                
                // Total Agent Net Commission = only the Agent net commission (not including admin)
                const totalAgentNetCommission = agentNetCommission
                
                // Display values
                const agentCommissionTotal = agentGrossCommission

                // Referral-based calculations
                // Step 1: Calculate gross commission for Referral only
                const referralGrossCommission = saleAmount * (field.values.referral_commission / 100)
                
                // Step 2: Apply VAT logic based on selected option
                let referralVatAmount = 0
                let referralWhtAmount = 0
                let referralNetCommission = 0
                let referralGrossAfterVatFactor = referralGrossCommission
                
                if (field.values.isWithVAT) {
                  // DEDUCT VAT: net = (gross - VAT) - WHT
                  referralVatAmount = referralGrossCommission * (field.values.vat / 100)
                  referralWhtAmount = referralGrossCommission * (field.values.witholding_tax / 100)
                  referralNetCommission = (referralGrossCommission - referralVatAmount) - referralWhtAmount
                } else if (field.values.voidVAT) {
                  // VOID: net = gross - WHT (VAT is voided/ignored)
                  referralVatAmount = referralGrossCommission * (field.values.vat / 100)
                  referralWhtAmount = referralGrossCommission * (field.values.witholding_tax / 100)
                  referralNetCommission = referralGrossCommission - referralWhtAmount
                } else if (field.values.returnVAT) {
                  // RETURN VAT: net = (gross + VAT) - WHT
                  referralVatAmount = referralGrossCommission * (field.values.vat / 100)
                  referralWhtAmount = referralGrossCommission * (field.values.witholding_tax / 100)
                  referralNetCommission = (referralGrossCommission + referralVatAmount) - referralWhtAmount
                } else if (field.values.applyGrossVAT && field.values.grossVATRate > 0) {
                  // APPLY GROSS VAT: 
                  // 1. grossAfterVatFactor = gross / vatFactor
                  // 2. VAT = grossAfterVatFactor * vat%
                  // 3. WHT = grossAfterVatFactor * wht%
                  // 4. net = gross - WHT
                  const vatFactor = 1 + (field.values.grossVATRate / 100)
                  referralGrossAfterVatFactor = referralGrossCommission / vatFactor
                  referralVatAmount = referralGrossAfterVatFactor * (field.values.vat / 100)
                  referralWhtAmount = referralGrossAfterVatFactor * (field.values.witholding_tax / 100)
                  referralNetCommission = referralGrossCommission - referralWhtAmount
                } else {
                  // No VAT option selected: net = gross - WHT
                  referralVatAmount = referralGrossCommission * (field.values.vat / 100)
                  referralWhtAmount = referralGrossCommission * (field.values.witholding_tax / 100)
                  referralNetCommission = referralGrossCommission - referralWhtAmount
                }
                
                // Calculate overrider (simple percentage, no VAT/WHT)
                const referralOverriderTotal = referralGrossCommission * (field.values.referral_overrider_commission / 100)
                
                // Calculate Admin commission (simple percentage, no VAT/WHT)
                const referralAdminCommissionTotal = saleAmount * (field.values.referral_admin_commission / 100)
                const referralAdminOverriderTotal = referralAdminCommissionTotal * (field.values.referral_admin_overrider_commission / 100)
                
                // Total Referral Net Commission = only the Referral net commission (not including admin)
                const totalReferralNetCommission = referralNetCommission
                
                // Display values
                const referralCommissionTotal = referralGrossCommission
                
                return (
                  <div className="space-y-4">
                    
                    <div className="grid items-start gap-6 md:grid-cols-2">
                      {/* Agent-based Distribution */}
                      <div className="rounded-lg border-2 border-blue-300 bg-blue-50/30 p-6 shadow-sm">
                        <div className="mb-4 text-center">
                          <h4 className="text-base font-bold text-blue-900 mb-3">Agent-based Distribution</h4>
                        </div>
                        <div className="mb-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">Base Commission Rate ({field.values.base_commission}%)</p>
                            <p className="text-base font-bold">{baseCommissionTotal.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {/* Agent Group */}
                          <div className="rounded-lg border border-blue-200 bg-white p-3 shadow-sm">
                            <p className="mb-2 text-xs font-semibold text-blue-900">
                              Agent Commission
                            </p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between rounded-lg bg-[#EFF6FF] px-3 py-2 text-[#437AEE]">
                                <p className="text-sm font-semibold">Agent ({field.values.agent_commission}%)</p>
                                <p className="font-bold">
                                  {agentCommissionTotal.toFixed(2)}
                                </p>
                              </div>
                              <div className="ml-3 flex items-center justify-between rounded-lg bg-[#F3F4F6] px-2 py-1.5 text-gray-900">
                                <p className="text-xs">Overrider ({field.values.agent_overrider_commission}%)</p>
                                <p className="text-sm font-semibold">
                                  {agentOverriderTotal.toFixed(2)}
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
                                <p className="text-sm font-semibold">Admin ({field.values.agent_admin_commission}%)</p>
                                <p className="font-bold">
                                  {agentAdminCommissionTotal.toFixed(2)}
                                </p>
                              </div>
                              <div className="ml-3 flex items-center justify-between rounded-lg bg-[#F3F4F6] px-2 py-1.5 text-gray-900">
                                <p className="text-xs">Overrider ({field.values.agent_admin_overrider_commission}%)</p>
                                <p className="text-sm font-semibold">
                                  {agentAdminOverriderTotal.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* VAT and Withholding Tax */}
                          <div className="space-y-1 border-t pt-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span>Value-Added Tax ({field.values.vat}%)</span>
                                {field.values.vat > 0 && field.values.isWithVAT && (
                                  <Badge variant="default" className="bg-green-600 text-white text-xs">
                                    Deduct VAT
                                  </Badge>
                                )}
                                {field.values.vat > 0 && field.values.returnVAT && (
                                  <Badge variant="default" className="bg-blue-600 text-white text-xs">
                                    Return VAT
                                  </Badge>
                                )}
                                {field.values.vat > 0 && field.values.voidVAT && (
                                  <Badge variant="default" className="bg-gray-600 text-white text-xs">
                                    Void
                                  </Badge>
                                )}
                                {field.values.applyGrossVAT && field.values.grossVATRate > 0 && (
                                  <Badge variant="default" className="bg-purple-600 text-white text-xs">
                                    Gross VAT ({field.values.grossVATRate}%)
                                  </Badge>
                                )}
                              </div>
                              <span className={field.values.voidVAT ? 'line-through' : ''}>
                                {field.values.isWithVAT ? '-' : '+'} {Math.abs(agentVatAmount).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Withholding Tax ({field.values.witholding_tax}%)</span>
                              <span>- {agentWhtAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex justify-between border-t-2 border-blue-400 pt-3">
                          <p className="font-semibold text-blue-900">Agent Net Commission</p>
                          <p className="font-bold text-blue-900">
                            ₱ {totalAgentNetCommission.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Referral-based Distribution */}
                      <div className="rounded-lg border-2 border-green-300 bg-green-50/30 p-6 shadow-sm">
                        <div className="mb-4 text-center">
                          <h4 className="text-base font-bold text-green-900 mb-3">Referral-based Distribution</h4>
                        </div>
                        <div className="mb-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">Base Commission Rate ({field.values.base_commission}%)</p>
                            <p className="text-base font-bold">{baseCommissionTotal.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {/* Referral Group */}
                          <div className="rounded-lg border border-blue-200 bg-white p-3 shadow-sm">
                            <p className="mb-2 text-xs font-semibold text-blue-900">
                              Referral Commission
                            </p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between rounded-lg bg-[#EFF6FF] px-3 py-2 text-[#437AEE]">
                                <p className="text-sm font-semibold">Referral ({field.values.referral_commission}%)</p>
                                <p className="font-bold">
                                  {referralCommissionTotal.toFixed(2)}
                                </p>
                              </div>
                              <div className="ml-3 flex items-center justify-between rounded-lg bg-[#F3F4F6] px-2 py-1.5 text-gray-900">
                                <p className="text-xs">Overrider ({field.values.referral_overrider_commission}%)</p>
                                <p className="text-sm font-semibold">
                                  {referralOverriderTotal.toFixed(2)}
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
                                <p className="text-sm font-semibold">Admin ({field.values.referral_admin_commission}%)</p>
                                <p className="font-bold">
                                  {referralAdminCommissionTotal.toFixed(2)}
                                </p>
                              </div>
                              <div className="ml-3 flex items-center justify-between rounded-lg bg-[#F3F4F6] px-2 py-1.5 text-gray-900">
                                <p className="text-xs">Overrider ({field.values.referral_admin_overrider_commission}%)</p>
                                <p className="text-sm font-semibold">
                                  {referralAdminOverriderTotal.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* VAT and Withholding Tax */}
                          <div className="space-y-1 border-t pt-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span>Value-Added Tax ({field.values.vat}%)</span>
                                {field.values.vat > 0 && field.values.isWithVAT && (
                                  <Badge variant="default" className="bg-green-600 text-white text-xs">
                                    Deduct VAT
                                  </Badge>
                                )}
                                {field.values.vat > 0 && field.values.returnVAT && (
                                  <Badge variant="default" className="bg-blue-600 text-white text-xs">
                                    Return VAT
                                  </Badge>
                                )}
                                {field.values.vat > 0 && field.values.voidVAT && (
                                  <Badge variant="default" className="bg-gray-600 text-white text-xs">
                                    Void
                                  </Badge>
                                )}
                                {field.values.applyGrossVAT && field.values.grossVATRate > 0 && (
                                  <Badge variant="default" className="bg-purple-600 text-white text-xs">
                                    Gross VAT ({field.values.grossVATRate}%)
                                  </Badge>
                                )}
                              </div>
                              <span className={field.values.voidVAT ? 'line-through' : ''}>
                                {field.values.isWithVAT ? '-' : '+'} {Math.abs(referralVatAmount).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Withholding Tax ({field.values.witholding_tax}%)</span>
                              <span>- {referralWhtAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex justify-between border-t-2 border-green-400 pt-3">
                          <p className="font-semibold text-green-900">Referral Net Commission</p>
                          <p className="font-bold text-green-900">
                            ₱ {totalReferralNetCommission.toFixed(2)}
                          </p>
                        </div>
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
