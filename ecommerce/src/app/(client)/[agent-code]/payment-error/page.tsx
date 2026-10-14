'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Download, Phone, Mail, RefreshCw, ArrowLeft } from 'lucide-react'
import { useFullQuoteResponseStore, useTravelInsuranceStore } from '@/store/travel-insurance-store'
import { useAgentCodeStore } from '@/store/agent-code-store'
import { getProposalNumber } from '@/utils/payment-storage'
import { generateQuotePDF } from '@/utils/generate-quote-pdf'
import { COMPANIES } from '@/constants/companies'
import { toast } from 'sonner'
import axios from 'axios'
import { getPlanName, getPaymentBrand } from '@/utils/custom-fields-storage'

export default function PaymentErrorPage() {
  const router = useRouter()
  const { apiResponse } = useFullQuoteResponseStore()
  const { travelDetails, coverageOption, travelersInfo } = useTravelInsuranceStore()
  const { agentCode } = useAgentCodeStore()
  const [proposalNumber, setProposalNumber] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    const storeProposalNo = apiResponse?.data?.ProposalNo
    const storedProposalNo = getProposalNumber()
    setProposalNumber(storeProposalNo || storedProposalNo || null)
  }, [apiResponse])

  const handleRetryIssueQuote = async () => {
    if (!proposalNumber) return
    setIsRetrying(true)
    try {
      const planName = getPlanName() || apiResponse?.data?.ProductName || apiResponse?.data?.ProductCode || ''
      const paymentBrand = getPaymentBrand()

      const res = await axios.post('/api/travel-insurance/issue-quote', {
        proposal_number: proposalNumber,
        CustomField: {
          ...(planName ? { PlanName: planName } : {}),
          ...(paymentBrand ? { PaymentBrand: paymentBrand } : {}),
        },
      })

      if (res.data?.success) {
        toast.success('Policy issued successfully! Redirecting…')
        // Navigate back to the avail page — the store will render the success screen
        router.push(`/${agentCode}/products/travel-insurance/avail`)
      } else {
        toast.error(res.data?.message || 'Policy issuance failed. Please try again in a moment.')
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
        err?.message ||
        'Could not reach the server. Please try again.'
      )
    } finally {
      setIsRetrying(false)
    }
  }

  const handleDownloadPDF = () => {
    try {
      if (!apiResponse?.data) {
        toast.error('Quote data not available')
        return
      }
      const provider = COMPANIES.find((c) => c.carrierCode === coverageOption.carrierCode)
      const planName = coverageOption.selectedPlan?.CarrierPlanDesc
      const addons = coverageOption.selectedAddonBenefits?.map((addonCode) => {
        const addon = coverageOption.selectedPlan?.AddonBenefits?.find((b) => b.BenefitCode === addonCode)
        return addon?.BenefitDesc || addonCode
      })
      const mainBenefits = coverageOption.selectedPlan?.MainBenefits || []
      const selectedAddonBenefits = coverageOption.selectedAddonBenefits
        ?.map((addonCode) => coverageOption.selectedPlan?.AddonBenefits?.find((b) => b.BenefitCode === addonCode))
        .filter(Boolean) || []

      generateQuotePDF({
        travelDetails,
        travelersInfo,
        apiResponse,
        planName,
        providerName: provider?.companyName,
        addons,
        mainBenefits,
        addonBenefits: selectedAddonBenefits as any,
        agentCode: agentCode || undefined,
      })
      toast.success('PDF downloaded successfully')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF')
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-24">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* Main card */}
        <Card className="bg-background overflow-hidden p-0 shadow-none">
          <CardHeader className="pt-8 pb-2">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <div className="space-y-1">
                <h1 className="text-primary text-xl font-bold sm:text-2xl">
                  Payment Received
                </h1>
                <p className="text-muted-foreground text-sm">
                  Your payment was successful. We're finalizing your policy — this may take a moment.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pb-8">
            {/* Proposal number */}
            {proposalNumber && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 text-center">
                <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
                  Proposal Number
                </p>
                <p className="text-primary text-2xl font-bold tracking-wider">
                  {proposalNumber}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Keep this number for your records
                </p>
              </div>
            )}

            {/* Retry */}
            <div className="space-y-2">
              <Button
                onClick={handleRetryIssueQuote}
                disabled={isRetrying || !proposalNumber}
                size="lg"
                className="from-primary to-accent w-full rounded-full bg-gradient-to-r font-semibold dark:text-white"
              >
                {isRetrying ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                    Finalizing Policy…
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Finalize My Policy
                  </>
                )}
              </Button>
              <p className="text-muted-foreground text-center text-xs">
                Click to complete policy issuance. Safe to retry — no double charging.
              </p>
            </div>

            {/* PDF download */}
            {proposalNumber && (
              <Button
                onClick={handleDownloadPDF}
                size="lg"
                variant="outline"
                className="w-full rounded-full border-2 font-semibold"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Proposal PDF
              </Button>
            )}

            {/* Support */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-muted-foreground mb-3 text-center text-xs font-medium uppercase tracking-wide">
                Need Help?
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>+63 (2) 8123-4567</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>support@oneinsurance.ph</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back button */}
        <div className="flex justify-center">
          <Button
            onClick={() => router.push(`/${agentCode}/products/travel-insurance`)}
            variant="outline"
            size="lg"
            className="rounded-full border-2 px-12 font-semibold"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Travel Insurance
          </Button>
        </div>

      </div>
    </div>
  )
}
