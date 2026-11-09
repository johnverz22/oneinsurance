import { z } from 'zod'
import Image from 'next/image'
import { delay } from '@/utils/delay'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from '@tanstack/react-form'
import { getInsuranceById } from './helpers'
import { useCheckoutStore } from '@/store/checkout-store'
import { CATEGORIES } from '@/constants/categories'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldInfo } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  CreditCard,
  User,
  Calendar,
  Lock,
  Loader2Icon,
  CheckCircle,
  Warehouse,
} from 'lucide-react'
import { paymentSchema } from '@/types/checkout'

export function CheckoutForm() {
  const router = useRouter()
  const [isWithCoupon, setIsWithCoupon] = useState(false)
  const { formData, setCurrentStep, resetForm } = useCheckoutStore()

  const form = useForm({
    defaultValues: {
      cardType: 'credit',
      nameOnCard: '',
      cardNumber: '',
      validOn: '',
      cvv: '',
      saveCard: true,
    },
    validators: { onChange: paymentSchema },
    onSubmit: async ({ value }) => {
      await delay(10000)

      resetForm()
      router.replace('/products')
    },
  })

  const selectedInsurance = getInsuranceById(formData.insuranceId)
  const selectedPlan = selectedInsurance?.plans[formData.planIndex!]
  const category = CATEGORIES.find(
    (c) => c.id === selectedInsurance?.categoryId
  )

  const cardTypes = ['credit', 'debit']

  useEffect(() => {
    if (!selectedPlan) {
      setCurrentStep(2)
    }
  }, [selectedPlan, selectedInsurance])

  if (!selectedPlan) {
    return <Loader2Icon className="animate-spin" />
  }

  const itemPrice = selectedPlan.price
  const taxesAndCharges = itemPrice * 0.012
  const billTotal = itemPrice + taxesAndCharges

  return (
    <div className="mx-auto min-h-screen max-w-6xl p-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-lg border p-6 shadow-sm">
          <h1>Secure Your Coverage</h1>
          <p className="text-muted-foreground">
            Complete your payment to activate your insurance policy
          </p>

          <form
            className="pt-6"
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
          >
            <div className="bg-muted/50 mb-6 rounded-md border p-4">
              <form.Field
                name="cardType"
                children={(field) => (
                  <div className="grid gap-4 md:grid-cols-2">
                    {cardTypes.map((card, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => field.handleChange(card)}
                        className={`flex h-full items-center space-x-2 rounded-md border-2 p-4 transition-colors ${
                          field.state.value === card
                            ? 'border-green-500 bg-green-300/50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <CreditCard className="h-5 w-5" />
                        <span className="font-medium capitalize">
                          {card} Card
                        </span>
                        {field.state.value === card && (
                          <CheckCircle className="text-foreground ml-auto h-4 w-4 rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>

            <div className="bg-muted/50 mb-6 rounded-md border p-4">
              <form.Field
                name="nameOnCard"
                children={(field) => (
                  <div className="mb-4">
                    <Label className="mb-2 block text-sm font-medium">
                      Card Name
                    </Label>
                    <div className="relative">
                      <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                      <Input
                        type="text"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 py-3 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:ring-green-500"
                        placeholder="John Doe"
                      />
                    </div>

                    <FieldInfo field={field} />
                  </div>
                )}
              />

              <form.Field
                name="cardNumber"
                children={(field) => (
                  <div className="mb-4">
                    <Label className="mb-2 block text-sm font-medium">
                      Card Number
                    </Label>
                    <div className="relative">
                      <CreditCard className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                      <Input
                        type="text"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 py-3 pr-16 pl-10 focus:border-transparent focus:ring-2 focus:ring-green-500"
                        placeholder="XXXX-XXXX-XXXX-XXXX"
                      />
                      <div className="absolute top-1/2 right-3 -translate-y-1/2 transform text-sm font-bold text-blue-600">
                        VISA
                      </div>
                    </div>

                    <FieldInfo field={field} />
                  </div>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <form.Field
                  name="validOn"
                  children={(field) => (
                    <div>
                      <Label className="mb-2 block text-sm font-medium">
                        Valid On
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                        <Input
                          type="text"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 py-3 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:ring-green-500"
                          placeholder="MM/YY"
                        />
                      </div>

                      <FieldInfo field={field} />
                    </div>
                  )}
                />

                <form.Field
                  name="cvv"
                  children={(field) => (
                    <div>
                      <Label className="mb-2 block text-sm font-medium">
                        CVV Code
                      </Label>
                      <div className="relative">
                        <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                        <Input
                          type="password"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 py-3 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:ring-green-500"
                          placeholder="***"
                        />
                      </div>

                      <FieldInfo field={field} />
                    </div>
                  )}
                />
              </div>
            </div>

            <form.Field
              name="saveCard"
              children={(field) => (
                <Label
                  htmlFor="toggle-save"
                  className="hover:bg-accent/50 flex items-start gap-3 rounded-md border p-3 has-[[aria-checked=true]]:border-green-600 dark:has-[[aria-checked=true]]:border-green-900"
                >
                  <Checkbox
                    id="toggle-save"
                    className="data-[state=checked]:border-green-600 data-[state=checked]:bg-green-600 data-[state=checked]:text-white dark:data-[state=checked]:border-green-700 dark:data-[state=checked]:bg-green-700"
                    checked={field.state.value}
                    onCheckedChange={(value) =>
                      field.handleChange(value as true | false)
                    }
                  />
                  <div className="grid gap-1.5 font-normal">
                    <p className="text-sm leading-none font-medium">
                      Default Card
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Securely save this card for a faster checkout next time
                    </p>
                  </div>
                </Label>
              )}
            />

            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  size="lg"
                  disabled={!canSubmit}
                  className="my-4 w-full flex-1 text-white"
                >
                  {isSubmitting ? (
                    'Processing...'
                  ) : (
                    <span>Pay PHP {billTotal.toFixed(2)}</span>
                  )}
                </Button>
              )}
            />
          </form>
        </div>

        <div className="rounded-lg border p-6 shadow-sm">
          <div className="bg-muted mb-6 rounded-md border p-4 text-center">
            <div className="mb-2 inline-flex size-10 items-center justify-center rounded-full bg-black">
              <Warehouse className="fill-white" />
            </div>
            <h3 className="font-bold uppercase">{formData.merchant}</h3>
          </div>

          <div className="mb-6">
            <div className="mb-4 flex items-center gap-4">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                <Image
                  src={selectedInsurance.image}
                  className="object-cover"
                  alt="insurance"
                  fill
                />
              </div>
              <div className="max-w-3/4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedInsurance.title}
                </h3>
                <p className="text-sm text-gray-600">{category?.title}</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Item Total</span>
                <span className="text-gray-900 dark:text-gray-100">
                  PHP {itemPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Taxes and Charges</span>
                <span className="text-gray-900 dark:text-gray-100">
                  PHP {taxesAndCharges.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount</span>
                <Button
                  variant="link"
                  className="!px-0 text-right text-green-600"
                  onClick={() => setIsWithCoupon((prev) => !prev)}
                >
                  {isWithCoupon ? 'No ' : 'Apply'} Coupon
                </Button>
              </div>

              {isWithCoupon && (
                <Input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 py-3 pr-4 focus:border-transparent focus:ring-2 focus:ring-green-500"
                  placeholder="Enter coupon"
                />
              )}
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between font-medium">
                <span className="text-gray-900 dark:text-gray-100">
                  BILL TOTAL
                </span>
                <span className="text-gray-900 dark:text-gray-100">
                  PHP {billTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
