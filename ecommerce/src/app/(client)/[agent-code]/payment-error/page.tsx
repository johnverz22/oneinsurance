'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PaymentIssueError } from '@/components/payment/payment-finalizing'
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
  const { travelDetails, coverageOption, travelersInfo, paymentSubmitResponse } = useTravelInsuranceStore()
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
        payment: { reference: paymentSubmitResponse?.data?.merchant_transaction_id ?? '' },
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

  const handleDownloadPDF = async () => {
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

      await generateQuotePDF({
        travelDetails,
        travelersInfo,
        apiResponse,
        planName,
        providerName: provider?.companyName,
        addons,
        mainBenefits,
        addonBenefits: selectedAddonBenefits as any,
        agentCode: agentCode || undefined,
        taxes: {
          premiumTax: coverageOption.selectedPlan?.PremiumTaxAmt,
          stampDuty: coverageOption.selectedPlan?.StampDuty,
        },
      })
      toast.success('PDF downloaded successfully')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF')
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-24">
      <div className="mx-auto max-w-2xl">
        <PaymentIssueError
          proposalNumber={proposalNumber}
          paymentReference={paymentSubmitResponse?.data?.merchant_transaction_id}
          amountPaid={paymentSubmitResponse?.data?.amount}
          paidAt={paymentSubmitResponse?.data?.timestamp}
          planName={coverageOption.selectedPlan?.CarrierPlanDesc}
          departureDate={travelDetails.departureDate}
          returnDate={travelDetails.returnDate}
          email={travelersInfo?.[0]?.email}
          isRetrying={isRetrying}
          onRetry={handleRetryIssueQuote}
          onDownloadPdf={handleDownloadPDF}
          onBack={() => router.push(`/${agentCode}/products/travel-insurance`)}
        />
      </div>
    </div>
  )
}
