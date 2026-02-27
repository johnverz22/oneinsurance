import { jsPDF } from 'jspdf'
import { format } from 'date-fns'
import { TravelInsuranceFormData } from '@/types/travel-insurance/travel-insurance-request'
import { FullQuoteResponse } from '@/types/travel-insurance/policy-types'

interface QuotePDFData {
  travelDetails: TravelInsuranceFormData
  apiResponse: FullQuoteResponse
  planName?: string
  providerName?: string
  addons?: string[]
}

export function generateQuotePDF(data: QuotePDFData) {
  const { travelDetails, apiResponse, planName, providerName, addons } = data
  const doc = new jsPDF()
  
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let yPosition = 20

  // Helper function to add text
  const addText = (text: string, x: number, y: number, options?: any) => {
    doc.text(text, x, y, options)
  }

  // Helper function to add line
  const addLine = (y: number) => {
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageWidth - margin, y)
  }

  // Header - Logo and Title
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  addText('One Insurance', margin, yPosition)
  
  yPosition += 10
  doc.setFontSize(16)
  doc.setTextColor(100, 100, 100)
  addText('Travel Insurance Quote', margin, yPosition)
  
  yPosition += 15
  addLine(yPosition)
  yPosition += 10

  // Proposal Number (Prominent)
  if (apiResponse?.data?.ProposalNo) {
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    addText('Proposal Number:', margin, yPosition)
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 112, 243) // Primary blue color
    addText(apiResponse.data.ProposalNo, margin + 50, yPosition)
    
    yPosition += 15
  }

  // Travel Details Section
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  addText('Travel Details', margin, yPosition)
  yPosition += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  // From
  addText('From:', margin, yPosition)
  doc.setFont('helvetica', 'bold')
  addText(travelDetails.travelDetailList[0].PlaceOfOrgin, margin + 40, yPosition)
  yPosition += 7

  // To
  doc.setFont('helvetica', 'normal')
  addText('To:', margin, yPosition)
  doc.setFont('helvetica', 'bold')
  travelDetails.travelDetailList.forEach((detail, index) => {
    if (index > 0) yPosition += 6
    addText(`${detail.DisplaySequence}. ${detail.TravelCountry}`, margin + 40, yPosition)
  })
  yPosition += 7

  // Dates
  doc.setFont('helvetica', 'normal')
  addText('Departure Date:', margin, yPosition)
  doc.setFont('helvetica', 'bold')
  addText(format(travelDetails.departureDate, 'PP'), margin + 40, yPosition)
  yPosition += 7

  doc.setFont('helvetica', 'normal')
  addText('Return Date:', margin, yPosition)
  doc.setFont('helvetica', 'bold')
  addText(format(travelDetails.returnDate!, 'PP'), margin + 40, yPosition)
  yPosition += 7

  // Travelers
  doc.setFont('helvetica', 'normal')
  addText('Travelers:', margin, yPosition)
  doc.setFont('helvetica', 'bold')
  addText(
    `${travelDetails.noOfAdults} Adult${travelDetails.noOfAdults > 1 ? 's' : ''}, ${travelDetails.noOfChildren} Child${travelDetails.noOfChildren !== 1 ? 'ren' : ''}`,
    margin + 40,
    yPosition
  )
  yPosition += 15

  addLine(yPosition)
  yPosition += 10

  // Plan Details Section
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  addText('Plan Details', margin, yPosition)
  yPosition += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  // Provider
  if (providerName) {
    addText('Insurance Provider:', margin, yPosition)
    doc.setFont('helvetica', 'bold')
    addText(providerName, margin + 50, yPosition)
    yPosition += 7
  }

  // Plan
  if (planName) {
    doc.setFont('helvetica', 'normal')
    addText('Plan:', margin, yPosition)
    doc.setFont('helvetica', 'bold')
    addText(planName.toUpperCase(), margin + 50, yPosition)
    yPosition += 7
  }

  // Add-ons
  if (addons && addons.length > 0) {
    doc.setFont('helvetica', 'normal')
    addText('Add-Ons:', margin, yPosition)
    yPosition += 6
    addons.forEach((addon) => {
      doc.setFont('helvetica', 'bold')
      addText(`• ${addon.toUpperCase()}`, margin + 10, yPosition)
      yPosition += 6
    })
    yPosition += 1
  }

  yPosition += 8
  addLine(yPosition)
  yPosition += 10

  // Premium Section
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  addText('Total Premium', margin, yPosition)
  yPosition += 8

  doc.setFontSize(20)
  doc.setTextColor(0, 112, 243)
  const premium = apiResponse?.data?.GrossPremium || 0
  addText(`₱${premium.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin, yPosition)
  
  yPosition += 15
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'italic')
  const infoText = 'The total premium includes the base insurance cost, selected add-ons, carrier pricing adjustments, and applicable taxes and fees.'
  const splitText = doc.splitTextToSize(infoText, pageWidth - (margin * 2))
  addText(splitText, margin, yPosition)
  
  yPosition += 20
  addLine(yPosition)
  yPosition += 10

  // Footer
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  addText(`Generated on: ${format(new Date(), 'PPpp')}`, margin, yPosition)
  yPosition += 6
  addText('For inquiries, contact: support@oneinsurance.ph | +63 (2) 8123-4567', margin, yPosition)

  // Save the PDF
  const fileName = `Travel-Insurance-Quote-${apiResponse?.data?.ProposalNo || 'Draft'}.pdf`
  doc.save(fileName)
}
