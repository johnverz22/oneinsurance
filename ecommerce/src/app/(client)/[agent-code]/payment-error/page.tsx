'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Download, Phone, Mail } from 'lucide-react'
import { useFullQuoteResponseStore, useTravelInsuranceStore } from '@/store/travel-insurance-store'
import { getProposalNumber } from '@/utils/payment-storage'
import { generateQuotePDF } from '@/utils/generate-quote-pdf'
import { COMPANIES } from '@/constants/companies'
import { toast } from 'sonner'

export default function PaymentErrorPage() {
  const router = useRouter()
  const { apiResponse } = useFullQuoteResponseStore()
  const { travelDetails, coverageOption } = useTravelInsuranceStore()
  const [proposalNumber, setProposalNumber] = useState<string | null>(null)

  useEffect(() => {
    // Try to get proposal number from store first, then from localStorage
    const storeProposalNo = apiResponse?.data?.ProposalNo
    const storedProposalNo = getProposalNumber()
    
    setProposalNumber(storeProposalNo || storedProposalNo || null)
  }, [apiResponse])

  const handleDownloadPDF = () => {
    try {
      if (!apiResponse?.data) {
        toast.error('Quote data not available')
        return
      }

      // Get provider name
      const provider = COMPANIES.find(
        (c) => c.carrierCode === coverageOption.carrierCode
      )

      // Get plan name
      const planName = coverageOption.selectedPlan?.CarrierPlanDesc

      // Get addon names
      const addons = coverageOption.selectedAddonBenefits?.map((addonCode) => {
        const addon = coverageOption.selectedPlan?.AddonBenefits?.find(
          (benefit) => benefit.BenefitCode === addonCode
        )
        return addon?.BenefitDesc || addonCode
      })

      generateQuotePDF({
        travelDetails,
        apiResponse,
        planName,
        providerName: provider?.companyName,
        addons,
      })

      toast.success('PDF downloaded successfully')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF')
    }
  }

  const handleBackToHome = () => {
    router.push('/')
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-24">
      <div className="mx-auto max-w-2xl">
        {/* Main Message Card */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <AlertCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">Payment Has Been Accepted</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-lg text-gray-700 dark:text-gray-300">
              Use proposal number for reference when contacting support
            </p>
            
            {proposalNumber && (
              <div className="rounded-lg border-2 border-primary bg-primary/5 p-6">
                <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Proposal Number
                </p>
                <p className="text-3xl font-bold text-primary">
                  {proposalNumber}
                </p>
              </div>
            )}

            {/* PDF Download CTA */}
            {proposalNumber && (
              <div className="pt-4">
                <Button
                  onClick={handleDownloadPDF}
                  size="lg"
                  className="w-full text-lg"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download Proposal PDF
                </Button>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  Download your proposal document for your records
                </p>
              </div>
            )}

            {/* Support Contact Info */}
            <div className="mt-8 rounded-lg border bg-gray-50 p-4 dark:bg-gray-900">
              <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Need Help?
              </p>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center justify-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>+63 (2) 8123-4567</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>support@oneinsurance.ph</span>
                </div>
              </div>
            </div>

            {/* Back Button */}
            <div className="pt-4">
              <Button
                onClick={handleBackToHome}
                variant="outline"
                size="lg"
                className="w-full"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
