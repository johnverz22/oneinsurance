import { Button } from '@/components/ui/button'
import { FieldInfo } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Product } from '@/types/products'
import { Value } from '@radix-ui/react-select'
import { FieldApi, useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { toast } from 'sonner'
import z from 'zod'

interface ProductCommisionConfigurationProps {
  selectedProduct: Product | null
}

const commisionConfigurationSchema = z.object({
  base_commission: z
    .number()
    .min(1, 'Base commission must be at least 1%')
    .max(30, 'Base commission cannot exceed 30%'),
  agent: z
    .number()
    .min(1, 'Agent commission must be at least 1%')
    .max(15, 'Agent commission cannot exceed 15%'),
  agent_overrider: z
    .number()
    .min(1, 'Agent overrider commission must be at least 1%')
    .max(10, 'Agent overrider commission cannot exceed 10%'),
  admin: z
    .number()
    .min(1, 'IFRC Admin commission must be at least 1%')
    .max(15, 'IFRC Admin commission cannot exceed 15%'),
  admin_overrider: z
    .number()
    .min(1, 'IFRC Admin overrider commission must be at least 1%')
    .max(10, 'IFRC Admin overrider commission cannot exceed 10%'),

  digitech: z
    .number()
    .min(1, 'IFRC Digitech commission must be at least 1%')
    .max(25, 'IFRC Digitech commission cannot exceed 25%'),
  referral: z
    .number()
    .min(1, 'Referral commission must be at least 1%')
    .max(5, 'Referral commission cannot exceed 5%'),
  referral_overrider: z
    .number()
    .min(1, 'Referral overrider commission must be at least 1%')
    .max(10, 'Referral overrider commission cannot exceed 10%'),
})
type CommisionConfigurationFormData = z.infer<
  typeof commisionConfigurationSchema
>

export default function ProductCommisionConfiguration({
  selectedProduct,
}: ProductCommisionConfigurationProps) {
  const DUMMY_PRICE = 15000
  const [baseCommission, setBaseCommission] = useState(DUMMY_PRICE * 0.3)

  const form = useForm({
    defaultValues: {
      base_commission: 30,
      agent: 15,
      agent_overrider: 10,
      admin: 15,
      admin_overrider: 10,
      digitech: 25,
      referral: 5,
      referral_overrider: 10,
    },
    validators: {
      onSubmit: commisionConfigurationSchema,
    },
    onSubmit: async ({ value }) => {
      console.log('Form submitted with values:', value)
    },
  })

  return (
    <div>
      {!selectedProduct ? (
        <div className="text-center">
          Select a product to configure commissions
        </div>
      ) : (
        <div className="space-y-10">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
          >
            <div className="space-y-10">
              {/* Header */}
              <div className="flex justify-between">
                <div className="space-y-3">
                  <div>
                    <p className="text-xl font-bold">
                      {selectedProduct.name} by {selectedProduct.provider.name}
                    </p>
                    <p className="text-base font-light">
                      Overall commision percentage for this product
                    </p>
                  </div>

                  <form.Field
                    name="base_commission"
                    children={(field) => {
                      return (
                        <div>
                          <div className="flex items-center">
                            <Label className="font-semibol mr-4">
                              Base Commission:{' '}
                            </Label>
                            <Input
                              type="number"
                              name={field.name}
                              id={field.name}
                              onChange={(e) => {
                                const commissionRate = Number(e.target.value)
                                field.handleChange(commissionRate)
                                const calculatedBaseCommission =
                                  (commissionRate / 100) * DUMMY_PRICE
                                setBaseCommission(calculatedBaseCommission)
                              }}
                              onBlur={field.handleBlur}
                              value={field.state.value.toString()}
                              className="h-10 w-20 text-right"
                            />
                            <span className="text-muted-foreground ml-2">
                              % of total net sale amount
                            </span>
                          </div>
                          <FieldInfo field={field} />
                        </div>
                      )
                    }}
                  />
                </div>

                <div>
                  <p className="text-xl font-bold">
                    ₱ {selectedProduct.price ?? DUMMY_PRICE.toFixed(2)}
                  </p>
                  <p className="text-muted-foreground text-base">Total</p>
                </div>
              </div>

              {/* Commission Configuration fields*/}
              <div className="grid items-start gap-6 md:grid-cols-2">
                {/* agent based sale */}
                <div className="flex flex-col items-end justify-center gap-4">
                  <p className="text-muted-foreground w-full text-center">
                    Commission distribution for Agent-based sales
                  </p>
                  {/* agent */}
                  <form.Field
                    name="agent"
                    children={(field) => (
                      <div className="flex w-[100%] items-center justify-between rounded-full bg-[#EFF6FF] px-4 py-2">
                        <Label className="mr-4 font-semibold text-black">
                          Agent
                        </Label>
                        <div className="flex items-center">
                          <Input
                            type="number"
                            name={field.name}
                            id={field.name}
                            onChange={(e) =>
                              field.handleChange(Number(e.target.value))
                            }
                            onBlur={field.handleBlur}
                            value={field.state.value.toString()}
                            className="h-10 w-20 text-right text-black"
                          />
                          <span className="text-muted-foreground ml-2">%</span>
                        </div>

                        <FieldInfo field={field} />
                      </div>
                    )}
                  />
                  {/* agent overrider */}
                  <form.Field
                    name="agent_overrider"
                    children={(field) => (
                      <div className="flex w-[85%] items-center justify-between rounded-full bg-[#F0FDF4] px-4 py-2">
                        <Label className="mr-4 font-semibold text-black">
                          Overrider
                        </Label>
                        <div className="flex items-center">
                          <Input
                            type="number"
                            name={field.name}
                            id={field.name}
                            onChange={(e) =>
                              field.handleChange(Number(e.target.value))
                            }
                            onBlur={field.handleBlur}
                            value={field.state.value.toString()}
                            className="h-10 w-20 text-right text-black"
                          />
                          <span className="text-muted-foreground ml-2">%</span>
                        </div>

                        <FieldInfo field={field} />
                      </div>
                    )}
                  />

                  {/* IFRC admin */}
                  <form.Field
                    name="admin"
                    children={(field) => (
                      <div className="flex w-[100%] items-center justify-between rounded-full bg-[#F5F0FC] px-4 py-2">
                        <Label className="mr-4 font-semibold text-black">
                          Admin
                        </Label>
                        <div className="flex items-center">
                          <Input
                            type="number"
                            name={field.name}
                            id={field.name}
                            onChange={(e) =>
                              field.handleChange(Number(e.target.value))
                            }
                            onBlur={field.handleBlur}
                            value={field.state.value.toString()}
                            className="h-10 w-20 text-right text-black"
                          />
                          <span className="text-muted-foreground ml-2">%</span>
                        </div>

                        <FieldInfo field={field} />
                      </div>
                    )}
                  />

                  {/* IFRC admin overrider */}
                  <form.Field
                    name="admin_overrider"
                    children={(field) => (
                      <div className="flex w-[85%] items-center justify-between rounded-full bg-[#FFF7ED] px-4 py-2">
                        <Label className="mr-4 font-semibold text-black">
                          Overrider
                        </Label>
                        <div className="flex items-center">
                          <Input
                            type="number"
                            name={field.name}
                            id={field.name}
                            onChange={(e) =>
                              field.handleChange(Number(e.target.value))
                            }
                            onBlur={field.handleBlur}
                            value={field.state.value.toString()}
                            className="h-10 w-20 text-right text-black"
                          />
                          <span className="text-muted-foreground ml-2">%</span>
                        </div>

                        <FieldInfo field={field} />
                      </div>
                    )}
                  />
                </div>

                {/* Digi-Tech based commission */}
                <div className="flex flex-col items-end justify-center gap-4">
                  <p className="text-muted-foreground w-full text-center">
                    Commission distribution for DigiTech-based sales
                  </p>
                  {/* digitech */}
                  <form.Field
                    name="digitech"
                    children={(field) => (
                      <div className="flex w-[100%] items-center justify-between rounded-full bg-[#F5F0FC] px-4 py-2">
                        <Label className="mr-4 font-semibold text-black">
                          IFRC DigiTech
                        </Label>
                        <div className="flex items-center">
                          <Input
                            type="number"
                            name={field.name}
                            id={field.name}
                            onChange={(e) =>
                              field.handleChange(Number(e.target.value))
                            }
                            onBlur={field.handleBlur}
                            value={field.state.value.toString()}
                            className="h-10 w-20 text-right text-black"
                          />
                          <span className="text-muted-foreground ml-2">%</span>
                        </div>

                        <FieldInfo field={field} />
                      </div>
                    )}
                  />

                  {/* Referral */}
                  <form.Field
                    name="referral"
                    children={(field) => (
                      <div className="flex w-[100%] items-center justify-between rounded-full bg-[#EFF6FF] px-4 py-2">
                        <Label className="mr-4 font-semibold text-black">
                          Referral
                        </Label>
                        <div className="flex items-center">
                          <Input
                            type="number"
                            name={field.name}
                            id={field.name}
                            onChange={(e) =>
                              field.handleChange(Number(e.target.value))
                            }
                            onBlur={field.handleBlur}
                            value={field.state.value.toString()}
                            className="h-10 w-20 text-right text-black"
                          />
                          <span className="text-muted-foreground ml-2">%</span>
                        </div>

                        <FieldInfo field={field} />
                      </div>
                    )}
                  />

                  {/* Referral overrider */}
                  <form.Field
                    name="referral_overrider"
                    children={(field) => (
                      <div className="flex w-[85%] items-center justify-between rounded-full bg-[#FFF7ED] px-4 py-2">
                        <Label className="mr-4 font-semibold text-black">
                          Overrider
                        </Label>
                        <div className="flex items-center">
                          <Input
                            type="number"
                            name={field.name}
                            id={field.name}
                            onChange={(e) =>
                              field.handleChange(Number(e.target.value))
                            }
                            onBlur={field.handleBlur}
                            value={field.state.value.toString()}
                            className="h-10 w-20 text-right text-black"
                          />
                          <span className="text-muted-foreground ml-2">%</span>
                        </div>

                        <FieldInfo field={field} />
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>
          </form>
          <div className="space-y-4">
            <div>
              <p className="text-xl font-bold">Commission Simulator</p>
              <p className="text-base font-light">
                Preview how commissions will be distributed for a ₱{' '}
                {DUMMY_PRICE.toFixed(2)} sale
              </p>
            </div>
            <form.Subscribe>
              {(field) => {
                return (
                  <div className="grid items-start gap-4 md:grid-cols-2">
                    <div className="flex h-full flex-col justify-between space-y-4">
                      <div className="flex flex-col items-end justify-center gap-4">
                        <div className="w-full text-left">
                          Agent Distribution
                        </div>

                        <div className="flex w-[100%] items-center justify-between rounded-full bg-[#EFF6FF] p-4 text-[#437AEE]">
                          <p>Agent/Advisor</p>
                          <p className="font-bold">
                            ₱{' '}
                            {(
                              (field.values.agent / 100) *
                              baseCommission
                            ).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex w-[85%] items-center justify-between rounded-full bg-[#F0FDF4] p-4 text-[#24A34A]">
                          <p>Overrider</p>
                          <p className="font-bold">
                            ₱{' '}
                            {(
                              (field.values.agent / 100) *
                              baseCommission *
                              (field.values.agent_overrider / 100)
                            ).toFixed(2)}
                          </p>
                        </div>

                        <div className="flex w-[100%] items-center justify-between rounded-full bg-[#F5F0FC] p-4 text-[#9636EA]">
                          <p>IFRC Admin</p>
                          <p className="font-bold">
                            ₱{' '}
                            {(
                              (field.values.admin / 100) *
                              baseCommission
                            ).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex w-[85%] items-center justify-between rounded-full bg-[#FFF7ED] p-4 text-[#F08548]">
                          <p>Overrider</p>
                          <p className="font-bold">
                            ₱{' '}
                            {(
                              (field.values.admin / 100) *
                              baseCommission *
                              (field.values.admin_overrider / 100)
                            ).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex w-full justify-between border-t-1 border-gray-500 pt-2">
                        <p>Agent Total:</p>
                        <p className="font-bold">
                          ₱{' '}
                          {(
                            (field.values.agent / 100) * baseCommission +
                            (field.values.admin / 100) * baseCommission
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex h-full flex-col justify-between">
                      <div className="flex flex-col items-end justify-center gap-4">
                        <div></div>
                        <div className="w-full text-left">
                          Referral Distribution
                        </div>

                        <div className="flex w-[100%] items-center justify-between rounded-full bg-[#F5F0FC] p-4 text-[#9636EA]">
                          <p>IFRC DigiTech</p>
                          <p className="font-bold">
                            ₱{' '}
                            {(
                              (field.values.digitech / 100) *
                              baseCommission
                            ).toFixed(2)}
                          </p>
                        </div>

                        <div className="flex w-[100%] items-center justify-between rounded-full bg-[#EFF6FF] p-4 text-[#437AEE]">
                          <p>Referral</p>
                          <p className="font-bold">
                            ₱{' '}
                            {(
                              (field.values.referral / 100) *
                              baseCommission
                            ).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex w-[85%] items-center justify-between rounded-full bg-[#FFF7ED] p-4 text-[#F08548]">
                          <p>Overrider</p>
                          <p className="font-bold">
                            ₱{' '}
                            {(
                              (field.values.referral / 100) *
                              baseCommission *
                              (field.values.referral_overrider / 100)
                            ).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex w-full justify-between border-t-1 border-gray-500 pt-2">
                        <p>Referral Total:</p>
                        <p className="font-bold">
                          ₱{' '}
                          {(
                            (field.values.digitech / 100) * baseCommission +
                            (field.values.referral / 100) * baseCommission
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              }}
            </form.Subscribe>
            <div className="flex items-center justify-between rounded-lg bg-gray-200 p-4 text-black">
              <div>
                <p className="text-xl font-bold">
                  Total Commission (₱ {DUMMY_PRICE.toFixed(2)} sale):
                </p>
                <p className="font-light">
                  Effective commision Rate:{' '}
                  {(baseCommission / DUMMY_PRICE) * 100}%
                </p>
              </div>
              <div>
                <p>₱ {baseCommission.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="font-bold">Configuration Actions</p>
            <p className="text-sm font-light">
              Save or apply your commission configuration
            </p>
            <div className="mt-4 flex gap-2">
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
              <Button
                type="submit"
                className="rounded-full bg-blue-600 text-white hover:bg-blue-700"
                onClick={(e) => {
                  e.preventDefault()
                  form.handleSubmit()
                }}
              >
                Save Configuration
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
