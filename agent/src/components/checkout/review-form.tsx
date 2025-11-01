'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCheckoutStore } from '@/store/checkout-store'
import { getInsuranceById } from './helpers'
import { Check, DownloadCloud } from 'lucide-react'

export function ReviewForm() {
  const router = useRouter()
  const { formData, prevStep, resetForm, nextStep } = useCheckoutStore()

  const selectedInsurance = getInsuranceById(formData.insuranceId)
  const selectedPlan = selectedInsurance?.plans[formData.planIndex!]

  const handleSubmit = async () => {
    try {
      console.log('Submitting form:', formData)
      nextStep()
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  const handleReset = () => {
    resetForm()
    router.replace('/products')
  }

  if (!formData.type) {
    return (
      <Card className="mx-auto w-full max-w-6xl">
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            No data to review.
          </p>
          <Button onClick={handleReset} className="mt-4 w-full">
            Start Over
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mx-auto w-full max-w-6xl">
      <CardHeader>
        <CardTitle>Review Your Application</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted rounded-md border p-4">
          <h3 className="mb-3 text-lg font-semibold">Insurance Details</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-muted-foreground text-sm">Type</p>
              <p className="font-medium capitalize">{formData.type}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Plan</p>
              <p className="font-medium">{formData.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Provider</p>
              <p className="font-medium">{formData.merchant}</p>
            </div>
          </div>
        </div>

        <Separator />

        {selectedInsurance && (
          <div className="bg-muted space-y-4 rounded-md border p-4">
            <h3 className="mb-3 text-lg font-semibold">
              Selected Insurance & Plan
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-sm">
                    Insurance Product
                  </p>
                  <p className="font-medium">{selectedInsurance.title}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Selected Plan</p>
                  <p className="font-medium">{selectedPlan?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    Annual Premium
                  </p>
                  <p className="text-lg font-medium">
                    PHP {selectedPlan?.price?.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    Maximum Benefit Limit
                  </p>
                  <p className="font-medium">{selectedPlan?.mbl}</p>
                </div>
              </div>

              {selectedPlan && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground mb-2 text-sm">
                      Coverage Includes:
                    </p>
                    <ul className="space-y-1">
                      {selectedPlan.coverage.map(
                        (item: string, index: number) => (
                          <li key={index} className="flex items-center text-sm">
                            <Check className="mr-2 h-4 w-4 text-green-600" />
                            {item}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-2 text-sm">
                      Key Benefits:
                    </p>
                    <ul className="space-y-1">
                      {selectedPlan.benefits.map(
                        (item: string, index: number) => (
                          <li key={index} className="flex items-center text-sm">
                            <Check className="mr-2 h-4 w-4 text-blue-600" />
                            {item}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <Separator />

        <div className="bg-muted space-y-4 rounded-md border p-4">
          <h3 className="mb-3 text-lg font-semibold">Personal Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-sm">Name</p>
              <p className="font-medium">
                {formData.firstName} {formData.lastName}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Email</p>
              <p className="font-medium">{formData.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Phone</p>
              <p className="font-medium">{formData.phone}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Date of Birth</p>
              <p className="font-medium">
                {format(new Date(formData.dateOfBirth!), 'PPp')}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Address</p>
              <p className="font-medium">
                {formData.address}, {formData.city} {formData.zipCode}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">ID</p>
              <p className="font-medium">
                {formData.idType} - {formData.idNumber}
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/files/Terms-and-Condition.pdf"
          target="_blank"
          rel="noopener noreferrer"
          locale="false"
          className="flex w-full items-center justify-between rounded-xl border px-4 py-4 text-sm"
          download
        >
          Read/Download Terms and Conditions
          <DownloadCloud />
        </Link>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            className="flex-1 bg-transparent"
          >
            Previous
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            Continue to Payment
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
