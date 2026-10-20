'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { COMPANIES } from '@/constants/companies'
import { CoverNotePDFInput } from '@/utils/generate-policy-pdf'

type COCRendererProps = {
  cocData: CoverNotePDFInput
  paymentReference?: string
}

export const GenerateAndDownloadCoverNote = ({ cocData, paymentReference }: COCRendererProps) => {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    try {
      setLoading(true)
      const { createCoverNotePDF } = await import('@/utils/generate-policy-pdf')
      const carrierName = COMPANIES.find((c) => c.carrierCode === cocData.policy.carrier)?.companyName || cocData.policy.carrier || ''
      const txId =
        paymentReference ||
        (typeof window !== 'undefined' ? localStorage.getItem('payment_transaction_id') : null) ||
        cocData.carrierPolicyNumber ||
        cocData.policyNumber
      const doc = await createCoverNotePDF(cocData, { carrierName, reference: txId, paymentReference })
      doc.save(`Cover-Note-${cocData.carrierPolicyNumber || cocData.proposalNumber || txId}.pdf`)
    } catch (e) {
      console.error('PDF generation failed:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="lg"
      onClick={handleDownload}
      disabled={loading}
      className="from-primary to-lilac text-primary-foreground w-full rounded-full bg-gradient-to-r font-semibold"
    >
      {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />}
      {loading ? 'Generating Cover Note…' : 'Download Cover Note'}
    </Button>
  )
}
