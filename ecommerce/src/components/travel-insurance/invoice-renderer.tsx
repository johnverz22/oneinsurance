'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { COMPANIES } from '@/constants/companies'
import { PaymentSubmitRequest } from '@/types/payment'

type InvoiceRendererProps = {
  invoiceData: {
    policyNumber: string
    carrierPolicyNumber?: string
    planName?: string
    proposalNumber: string
    invoiceDate: string
    customer: {
      name: string
      email: string
      phone: string
      address: string
    }
    travel: {
      type: string
      departureDate: string
      returnDate: string
      duration: string
      destinations: string
    }
    policy: {
      carrier: string
      plan: string
      coverageArea: string
    }
    payment: {
      basePremium: number
      method: string
    }
    status: {
      issueDate: string
      status: string
      effectiveDate: string
      expiryDate: string
    }
  }
}

export const GenerateAndDownloadInvoice = ({ invoiceData }: InvoiceRendererProps) => {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    try {
      setLoading(true)
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      const carrierName = COMPANIES.find(c => c.carrierCode === invoiceData.policy.carrier)?.companyName || invoiceData.policy.carrier || ''
      const txId = (typeof window !== 'undefined' ? localStorage.getItem('payment_transaction_id') : null) || invoiceData.policyNumber || ''

      const margin = 15
      let y = 20

      // Header
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('Invoice', margin, y)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100)
      doc.text(`#${txId}`, margin, y + 8)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0)
      doc.text('One Insurance', 195, y, { align: 'right' })
      y += 20
      doc.setDrawColor(220)
      doc.line(margin, y, 195, y)
      y += 10

      // Info row
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100)
      doc.text('Policy Number', margin, y)
      doc.text('Insurance Provider', 80, y)
      doc.text('Payment Method', 145, y)
      y += 5
      doc.setFontSize(9)
      doc.setTextColor(0)
      doc.setFont('helvetica', 'bold')
      doc.text(invoiceData.carrierPolicyNumber || invoiceData.policyNumber || 'N/A', margin, y)
      doc.text(carrierName || 'N/A', 80, y)
      doc.text(invoiceData.payment.method || 'N/A', 145, y)
      y += 15

      // From / To
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(100)
      doc.text('From', margin, y)
      doc.text('To', 110, y)
      y += 5
      doc.setFontSize(9)
      doc.setTextColor(0)
      doc.setFont('helvetica', 'bold')
      doc.text('IFRC Digitech Online Payment Gateway', margin, y)
      doc.text(invoiceData.customer.name.toUpperCase(), 110, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(60)
      const fromLines = ['6th Floor Padilla Building', 'F. Ortigas Jr. Road, Ortigas Center, Pasig City', 'TEL: +632 8633 5681', 'concierge@ifrcinsurance.com']
      fromLines.forEach(line => { doc.text(line, margin, y); y += 4 })
      const toY = y - (fromLines.length * 4)
      let ty = toY
      doc.text(invoiceData.customer.address || '', 110, ty); ty += 4
      doc.text(invoiceData.customer.email || '', 110, ty); ty += 4
      doc.text(invoiceData.customer.phone || '', 110, ty)
      y += 10

      // Table header
      doc.setDrawColor(220)
      doc.line(margin, y, 195, y)
      y += 5
      doc.setFontSize(8)
      doc.setTextColor(100)
      doc.text('Description', margin, y)
      doc.text('Units', 140, y)
      doc.text('Premium', 195, y, { align: 'right' })
      y += 3
      doc.line(margin, y, 195, y)
      y += 6

      // Table row
      doc.setFontSize(9)
      doc.setTextColor(0)
      doc.setFont('helvetica', 'bold')
      doc.text(invoiceData.planName || invoiceData.policy.plan || '', margin, y)
      y += 4
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(80)
      if (carrierName) { doc.text(carrierName, margin, y); y += 4 }
      doc.text(invoiceData.travel.destinations || '', margin, y); y += 4
      doc.text(`${invoiceData.travel.duration || ''} • ${invoiceData.travel.type || ''}`, margin, y)
      doc.setFontSize(9)
      doc.setTextColor(0)
      doc.text('1', 140, y - 8)
      doc.text(`PHP ${invoiceData.payment.basePremium.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`, 195, y - 8, { align: 'right' })
      y += 8

      // Total
      doc.setDrawColor(220)
      doc.line(margin, y, 195, y)
      y += 6
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('Total Amount', 130, y)
      doc.text(`PHP ${invoiceData.payment.basePremium.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`, 195, y, { align: 'right' })
      y += 10

      // Note
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8)
      doc.setTextColor(100)
      doc.text('Note: Policy coverage begins on the effective date. Please ensure payment is completed before departure. VAT Inclusive', margin, y)
      y += 12

      // Status section
      doc.setFillColor(248, 248, 248)
      doc.rect(margin, y, 180, 28, 'F')
      y += 6
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(0)
      doc.text('POLICY STATUS', margin + 3, y)
      y += 6
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100)
      doc.text('Status', margin + 3, y)
      doc.text('Issue Date', 80, y)
      doc.text('Coverage Period', 140, y)
      y += 4
      doc.setTextColor(0)
      doc.setFont('helvetica', 'bold')
      doc.text(invoiceData.status.status || 'Active', margin + 3, y)
      doc.text(invoiceData.status.issueDate || '', 80, y)
      doc.text(`${invoiceData.status.effectiveDate || ''} - ${invoiceData.status.expiryDate || ''}`, 140, y)
      y += 14

      // Thank you
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(9)
      doc.setTextColor(100)
      doc.text('Thank you for choosing One Insurance. Have a safe and wonderful journey!', 105, y, { align: 'center' })

      doc.save('policy-invoice.pdf')
    } catch (e) {
      console.error('PDF generation failed:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button className="w-full font-bold" variant="outline" size="lg" onClick={handleDownload} disabled={loading}>
      {loading ? 'Generating Invoice...' : 'Generate And Download Invoice'}
    </Button>
  )
}
