import { jsPDF } from 'jspdf'
import { format } from 'date-fns'

interface HealthQuotePDFData {
  proposalNo: string
  planName: string
  providerName: string
  premium: number
  insuredName: string
  dateOfBirth: string
  gender: string
  isSmoker: string
  effectiveDate: string
  expiryDate?: string
  email?: string
  phone?: string
  address?: string
  benefits?: Array<{ BenefitDesc: string; DefaultLimitDesc?: string; Silimit?: string }>
  agentCode?: string
}

export function generateHealthQuotePDF(data: HealthQuotePDFData) {
  const { proposalNo, planName, providerName, premium, insuredName, dateOfBirth, gender, isSmoker, effectiveDate, email, phone, address, benefits, agentCode } = data

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  let y = 20

  const primaryGreen = [76, 132, 62] as [number, number, number]
  const darkGray = [51, 51, 51] as [number, number, number]
  const lightGray = [245, 245, 245] as [number, number, number]

  const checkPage = (space = 30) => {
    if (y + space > 270) { doc.addPage(); y = 20 }
  }

  // Header
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...primaryGreen)
  doc.text('One Insurance', margin, y)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.text('Health Insurance Quote', margin, y + 7)
  doc.setFontSize(10)
  doc.text(`Generated: ${format(new Date(), 'MMMM dd, yyyy')}`, pageWidth - margin, y, { align: 'right' })
  y += 18

  // Divider
  doc.setDrawColor(...primaryGreen)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  // Proposal Number
  doc.setFillColor(230, 242, 227)
  doc.roundedRect(margin, y, pageWidth - margin * 2, 14, 3, 3, 'F')
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...primaryGreen)
  doc.text('Proposal Number:', margin + 4, y + 9)
  doc.setFontSize(12)
  doc.text(proposalNo, pageWidth - margin - 4, y + 9, { align: 'right' })
  y += 22

  // Plan Details
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...primaryGreen)
  doc.text('Plan Details', margin, y)
  y += 8

  const planRows = [
    ['Insurance Provider', providerName],
    ['Plan Name', planName],
    ['Premium', `PHP ${premium.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`],
    ['Effective Date', effectiveDate ? format(new Date(effectiveDate), 'MMMM dd, yyyy') : '—'],
  ]

  planRows.forEach(([label, value]) => {
    checkPage(10)
    doc.setFillColor(...lightGray)
    doc.rect(margin, y, pageWidth - margin * 2, 9, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...darkGray)
    doc.text(label, margin + 3, y + 6)
    doc.setFont('helvetica', 'normal')
    doc.text(value, pageWidth - margin - 3, y + 6, { align: 'right' })
    y += 10
  })

  y += 6

  // Insured Information
  checkPage(40)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...primaryGreen)
  doc.text('Insured Information', margin, y)
  y += 8

  const insuredRows = [
    ['Full Name', insuredName],
    ['Date of Birth', dateOfBirth],
    ['Gender', gender === 'M' ? 'Male' : 'Female'],
    ['Smoker', isSmoker === 'Y' ? 'Yes' : 'No'],
    ...(email ? [['Email', email]] : []),
    ...(phone ? [['Phone', `+63 ${phone}`]] : []),
    ...(address ? [['Address', address]] : []),
  ] as [string, string][]

  insuredRows.forEach(([label, value]) => {
    checkPage(10)
    doc.setFillColor(...lightGray)
    doc.rect(margin, y, pageWidth - margin * 2, 9, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...darkGray)
    doc.text(label, margin + 3, y + 6)
    doc.setFont('helvetica', 'normal')
    doc.text(value, pageWidth - margin - 3, y + 6, { align: 'right' })
    y += 10
  })

  // Benefits
  if (benefits && benefits.length > 0) {
    y += 6
    checkPage(20)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...primaryGreen)
    doc.text('Key Benefits', margin, y)
    y += 8

    benefits.slice(0, 10).forEach((b) => {
      checkPage(10)
      const limitText = b.DefaultLimitDesc || (b.Silimit ? `PHP ${Number(b.Silimit).toLocaleString()}` : '')
      doc.setFillColor(...lightGray)
      doc.rect(margin, y, pageWidth - margin * 2, 9, 'F')
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...darkGray)
      doc.text(b.BenefitDesc || '', margin + 3, y + 6)
      if (limitText) doc.text(limitText, pageWidth - margin - 3, y + 6, { align: 'right' })
      y += 10
    })
  }

  // Footer
  y += 10
  checkPage(20)
  doc.setDrawColor(...primaryGreen)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(120, 120, 120)
  doc.text('This document serves as a quote only. The official policy will be issued by the insurance carrier.', margin, y)
  if (agentCode) {
    y += 5
    doc.text(`Agent Code: ${agentCode}`, margin, y)
  }

  doc.save(`health-quote-${proposalNo}.pdf`)
}
