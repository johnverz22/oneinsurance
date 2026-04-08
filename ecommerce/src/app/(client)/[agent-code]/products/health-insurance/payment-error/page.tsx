'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Download, Phone, Mail } from 'lucide-react'
import { useHealthCartStore } from '@/store/health-cart-store'
import { generateHealthQuotePDF } from '@/utils/generate-health-quote-pdf'
import { toast } from 'sonner'

export default function HealthPaymentErrorPage() {
  const router = useRouter()
  const params = useParams()
  const agentCode = params['agent-code'] as string
  const { proposalNo, items, insuredInfo } = useHealthCartStore()
  const [resolvedProposalNo, setResolvedProposalNo] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('health_proposal_no')
    setResolvedProposalNo(proposalNo ?? stored ?? null)
  }, [proposalNo])

  const handleDownloadPDF = () => {
    if (!resolvedProposalNo) {
      toast.error('No proposal data available')
      return
    }
    const item = items[0]
    generateHealthQuotePDF({
      proposalNo: resolvedProposalNo,
      planName: item?.planName ?? 'Health Insurance',
      providerName: item?.provider ?? '',
      premium: item?.premium ?? 0,
      insuredName: insuredInfo?.insuredName ?? '',
      dateOfBirth: insuredInfo?.dateOfBirth ?? '',
      gender: insuredInfo?.genderCode ?? 'M',
      isSmoker: insuredInfo?.isSmoker ?? 'N',
      effectiveDate: insuredInfo?.effectiveDate ?? '',
    })
    toast.success('PDF downloaded!')
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-24">
      <div className="mx-auto max-w-2xl">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <AlertCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Payment Has Been Accepted</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-lg text-gray-700">
              Use your proposal number for reference when contacting support.
            </p>

            {resolvedProposalNo && (
              <div className="rounded-lg border-2 border-primary bg-primary/5 p-6">
                <p className="mb-2 text-sm font-medium text-gray-600">Proposal Number</p>
                <p className="text-3xl font-bold text-primary">{resolvedProposalNo}</p>
              </div>
            )}

            {resolvedProposalNo && (
              <div className="pt-4">
                <Button onClick={handleDownloadPDF} size="lg" className="from-primary to-accent w-full rounded-full bg-gradient-to-r text-white">
                  <Download className="mr-2 h-5 w-5" />
                  Download Proposal PDF
                </Button>
                <p className="mt-3 text-sm text-gray-500">Download your proposal document for your records</p>
              </div>
            )}

            <div className="mt-8 rounded-lg border bg-gray-50 p-4">
              <p className="mb-2 text-sm font-medium text-gray-700">Need Help?</p>
              <div className="space-y-1 text-sm text-gray-600">
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

            <div className="pt-4">
              <Button onClick={() => router.push(`/${agentCode}/products/health-insurance`)} variant="outline" size="lg" className="w-full rounded-full">
                Back to Health Insurance
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
