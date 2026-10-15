'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { COMPANIES } from '@/constants/companies'
import { InvoicePDFInput } from '@/utils/generate-policy-pdf'

type InvoiceRendererProps = {
  invoiceData: InvoicePDFInput
  paymentReference?: string
}

export const GenerateAndDownloadInvoice = ({ invoiceData, paymentReference }: InvoiceRendererProps) => {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    try {
      setLoading(true)
      const { createInvoicePDF } = await import('@/utils/generate-policy-pdf')
      const carrierName = COMPANIES.find((c) => c.carrierCode === invoiceData.policy.carrier)?.companyName || invoiceData.policy.carrier || ''
      const txId =
        paymentReference ||
        (typeof window !== 'undefined' ? localStorage.getItem('payment_transaction_id') : null) ||
        invoiceData.policyNumber
      const doc = await createInvoicePDF(invoiceData, { carrierName, reference: txId, paymentReference })
      doc.save(`Invoice-${txId || invoiceData.proposalNumber}.pdf`)
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
      {loading ? 'Generating Invoice…' : 'Download Invoice'}
    </Button>
  )
}
