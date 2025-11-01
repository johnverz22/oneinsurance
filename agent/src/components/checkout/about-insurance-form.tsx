'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CATEGORIES } from '@/constants/categories'
import { INSURANCES } from '@/constants/insurances'
import { useCheckoutStore } from '@/store/checkout-store'
import { Star, Building2, CheckCircle, ArrowRight, Info } from 'lucide-react'

export function AboutInsuranceForm() {
  const { formData, nextStep } = useCheckoutStore()

  const insurance = INSURANCES.find((i) => i.id === formData.insuranceId)
  const category = CATEGORIES.find((c) => c.id === insurance?.categoryId)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-white p-3 shadow-sm">
                {category?.icon && (
                  <category.icon className="h-8 w-8 text-blue-600" />
                )}
              </div>

              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {formData.name}
                </h1>
                <div className="mt-2 flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <span className="text-lg font-medium text-gray-600">
                    {formData.merchant}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 fill-current text-yellow-400" />
                <Star className="h-4 w-4 fill-current text-yellow-400" />
                <Star className="h-4 w-4 fill-current text-yellow-400" />
                <Star className="h-4 w-4 fill-current text-yellow-400" />
                <Star className="h-4 w-4 text-gray-300" />
              </div>
              <p className="mt-1 text-sm text-gray-500">4.2/5 Rating</p>
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <div className="mb-3 flex items-center space-x-2">
                <Info className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">About This Insurance</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {insurance?.description}
              </p>
            </div>
            <Separator />
            <div>
              <h3 className="mb-4 text-lg font-semibold">Key Features</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                  <div>
                    <h4 className="font-medium">Comprehensive Coverage</h4>
                    <p className="text-sm text-gray-600">
                      Full protection with extensive benefits
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                  <div>
                    <h4 className="font-medium">24/7 Support</h4>
                    <p className="text-sm text-gray-600">
                      Round-the-clock customer assistance
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                  <div>
                    <h4 className="font-medium">Quick Claims</h4>
                    <p className="text-sm text-gray-600">
                      Fast and hassle-free claim processing
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                  <div>
                    <h4 className="font-medium">Nationwide Network</h4>
                    <p className="text-sm text-gray-600">
                      Access to providers across the country
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <Separator />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <div className="mb-1 text-2xl font-bold text-blue-600">
                  500+
                </div>
                <div className="text-sm text-gray-600">Partner Hospitals</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <div className="mb-1 text-2xl font-bold text-green-600">
                  ₱2M
                </div>
                <div className="text-sm text-gray-600">Maximum Coverage</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <div className="mb-1 text-2xl font-bold text-purple-600">
                  98%
                </div>
                <div className="text-sm text-gray-600">Claim Approval Rate</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={nextStep} size="lg" className="flex-1 text-white">
          Continue to Plans
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
