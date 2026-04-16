'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Coverage } from '../payment/coverage-of-confirmation'
import { COMPANIES } from '@/constants/companies'

type COCRendererProps = {
  cocData: {
    policyNumber: string
    carrierPolicyNumber: string
    proposalNumber: string
    invoiceDate: string
    customers: {
      name: string
      email: string
      phone: string
      address: string
    }[]
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
    coverage: Coverage[]
    status: {
      issueDate: string
      status: string
      effectiveDate: string
      expiryDate: string
    }
    plan?: {
      code?: string
    }
  }
}

export const GenerateAndDownloadCoverNote = ({ cocData }: COCRendererProps) => {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    try {
      setLoading(true)
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      const carrierName = COMPANIES.find(c => c.carrierCode === cocData.policy.carrier)?.companyName || cocData.policy.carrier || ''
      const txId = (typeof window !== 'undefined' ? localStorage.getItem('payment_transaction_id') : null) || cocData.policyNumber || ''

      const margin = 15
      let y = 20

      // Header
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.text('Cover Note', margin, y)
      y += 7
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100)
      doc.text('Issued by One Insurance', margin, y)
      y += 5
      doc.text(`#${txId}`, margin, y)
      y += 8
      doc.setDrawColor(220)
      doc.line(margin, y, 195, y)
      y += 10

      // Policy info
      doc.setFontSize(8)
      doc.setTextColor(100)
      doc.text('Insurance Provider', margin, y)
      doc.text('Plan', 80, y)
      doc.text('Issued Date', 145, y)
      y += 5
      doc.setFontSize(9)
      doc.setTextColor(0)
      doc.setFont('helvetica', 'bold')
      doc.text(carrierName || 'N/A', margin, y)
      doc.text(`${cocData.policy.plan || ''} (${cocData.plan?.code || cocData.policy.carrier || ''})`, 80, y)
      doc.text(cocData.status.issueDate || '', 145, y)
      y += 10

      // Travel info
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(100)
      doc.text('Travel Period', margin, y)
      doc.text('Duration', 80, y)
      doc.text('Travel Type', 145, y)
      y += 5
      doc.setFontSize(9)
      doc.setTextColor(0)
      doc.text(`${cocData.travel.departureDate || ''} - ${cocData.travel.returnDate || ''}`, margin, y)
      doc.text(cocData.travel.duration || '', 80, y)
      doc.text(cocData.travel.type || '', 145, y)
      y += 8

      doc.setFontSize(8)
      doc.setTextColor(100)
      doc.text('Destinations', margin, y)
      y += 5
      doc.setFontSize(9)
      doc.setTextColor(0)
      doc.text(cocData.travel.destinations || '', margin, y)
      y += 12

      // Insured individuals
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('Insured Individuals', margin, y)
      y += 6
      cocData.customers.forEach((c, i) => {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(0)
        doc.text(c.name.toUpperCase(), margin, y); y += 4
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(60)
        doc.text(c.address || '', margin, y); y += 4
        doc.text(c.email || '', margin, y); y += 4
        doc.text(`(+63) ${c.phone || ''}`, margin, y); y += 6
        if (i < cocData.customers.length - 1) {
          doc.setDrawColor(230)
          doc.line(margin, y, 195, y)
          y += 4
        }
      })
      y += 4

      // Coverage table
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(0)
      doc.text('Coverage Details', margin, y)
      y += 6
      doc.setDrawColor(220)
      doc.line(margin, y, 195, y)
      y += 4
      doc.setFontSize(8)
      doc.setTextColor(100)
      doc.text('Coverage Name', margin, y)
      doc.text('Sum Insured', 195, y, { align: 'right' })
      y += 3
      doc.line(margin, y, 195, y)
      y += 5

      cocData.coverage.forEach((item, i) => {
        if (y > 270) { doc.addPage(); y = 20 }
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(0)
        doc.text(item.coverageName || '', margin, y)
        const si = typeof item.sumInsured === 'number'
          ? `PHP ${item.sumInsured.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
          : String(item.sumInsured || 'Included')
        doc.text(si, 195, y, { align: 'right' })
        y += 5
        if (i % 2 === 0) {
          doc.setFillColor(249, 249, 249)
          doc.rect(margin, y - 5, 180, 5, 'F')
        }
      })
      y += 6

      // Policy summary
      doc.setFillColor(247, 247, 247)
      doc.rect(margin, y, 180, 30, 'F')
      y += 6
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.text('POLICY SUMMARY', margin + 3, y)
      y += 6
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100)
      doc.text('Status', margin + 3, y)
      doc.text('Coverage Period', 80, y)
      doc.text('Coverage Area', 145, y)
      y += 4
      doc.setTextColor(0)
      doc.setFont('helvetica', 'bold')
      doc.text(cocData.status.status || 'Active', margin + 3, y)
      doc.text(`${cocData.status.effectiveDate || ''} - ${cocData.status.expiryDate || ''}`, 80, y)
      doc.text(cocData.policy.coverageArea || '', 145, y)
      y += 14

      // Footer
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8)
      doc.setTextColor(100)
      doc.text('Thank you for choosing One Insurance. Stay protected and travel with confidence.', 105, y, { align: 'center' })
      y += 5
      doc.text('This document is electronically generated and valid without signature.', 105, y, { align: 'center' })

      doc.save('cover-note.pdf')
    } catch (e) {
      console.error('PDF generation failed:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button className="w-full font-bold" variant="outline" size="lg" onClick={handleDownload} disabled={loading}>
      {loading ? 'Generating Cover Note...' : 'Generate And Download Cover Note'}
    </Button>
  )
}
