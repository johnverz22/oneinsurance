import { jsPDF } from 'jspdf'
import { format } from 'date-fns'
import { TravelInsuranceFormData, PersonalInfoFormData } from '@/types/travel-insurance/travel-insurance-request'
import { FullQuoteResponse } from '@/types/travel-insurance/policy-types'
import { InsuranceBenefit } from '@/types/plan'

interface QuotePDFData {
  travelDetails: TravelInsuranceFormData
  travelersInfo?: PersonalInfoFormData[]
  apiResponse: FullQuoteResponse
  planName?: string
  providerName?: string
  addons?: string[]
  mainBenefits?: InsuranceBenefit[]
  addonBenefits?: InsuranceBenefit[]
}

export function generateQuotePDF(data: QuotePDFData) {
  const { travelDetails, travelersInfo, apiResponse, planName, providerName, mainBenefits, addonBenefits } = data
  
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  let yPosition = 20

  // Colors matching the actual template
  const primaryGreen = [76, 132, 62] // #4C843E - main green color
  const accentGold = [189, 183, 107] // #BDB76B - gold/tan accent
  const lightGreen = [230, 242, 227] // #E6F2E3 - for table headers
  const darkGray = [51, 51, 51] // #333333
  const lightGray = [245, 245, 245] // #F5F5F5
  const borderGray = [200, 200, 200] // #C8C8C8

  // Helper: Check if new page needed
  const checkNewPage = (requiredSpace: number = 30) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage()
      yPosition = margin
      return true
    }
    return false
  }

  // ===== HEADER =====
  // Logo and branding
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
  doc.text('One', margin, yPosition)
  
  const oneWidth = doc.getTextWidth('One')
  doc.setTextColor(accentGold[0], accentGold[1], accentGold[2])
  doc.text('Insurance', margin + oneWidth + 1, yPosition)

  // Tagline
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(100, 100, 100)
  doc.text('Insurance Made Simple. Coverage Made Easy.', margin, yPosition + 5)

  // QUOTATION badge (right side)
  const badgeWidth = 40
  const badgeHeight = 11
  const badgeX = pageWidth - margin - badgeWidth
  const badgeY = yPosition - 6
  
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, 'F')
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('QUOTATION', badgeX + badgeWidth / 2, badgeY + 7.5, { align: 'center' })

  // Proposal number and date (right side, below badge)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  const proposalNo = apiResponse?.data?.ProposalNo || 'N/A'
  doc.text(`Proposal No: ${proposalNo}`, pageWidth - margin, badgeY + badgeHeight + 5, { align: 'right' })
  doc.text(`Issued: ${format(new Date(), 'MMM dd, yyyy h:mm a')}`, pageWidth - margin, badgeY + badgeHeight + 9, { align: 'right' })

  yPosition += 18

  // Separator line
  doc.setDrawColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
  doc.setLineWidth(1)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  
  yPosition += 12

  // ===== YOUR TRAVEL DETAILS =====
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
  doc.text('Your Travel Details', margin, yPosition)
  yPosition += 7

  // Travel details table
  const colWidths = [30, 30, 30, 30, 25, 35]
  const tableStartX = margin
  let tableY = yPosition
  const rowHeight = 10

  // Header row
  doc.setFillColor(lightGreen[0], lightGreen[1], lightGreen[2])
  doc.rect(tableStartX, tableY, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F')
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2])
  doc.setLineWidth(0.5)
  doc.rect(tableStartX, tableY, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'S')
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
  
  const travelHeaders = ['From', 'To', 'Departure', 'Return', 'Duration', 'Travellers']
  let currentX = tableStartX
  travelHeaders.forEach((header, i) => {
    doc.text(header, currentX + colWidths[i] / 2, tableY + 6.5, { align: 'center' })
    if (i < colWidths.length - 1) {
      doc.line(currentX + colWidths[i], tableY, currentX + colWidths[i], tableY + rowHeight)
    }
    currentX += colWidths[i]
  })

  // Data row
  tableY += rowHeight
  doc.setFillColor(255, 255, 255)
  doc.rect(tableStartX, tableY, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F')
  doc.rect(tableStartX, tableY, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'S')
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
  
  const travelData = [
    travelDetails.travelDetailList[0]?.PlaceOfOrgin || 'N/A',
    travelDetails.travelDetailList.map(d => d.TravelCountry).join(', ') || 'N/A',
    format(travelDetails.departureDate, 'MMM dd, yyyy'),
    format(travelDetails.returnDate!, 'MMM dd, yyyy'),
    `${Math.ceil((travelDetails.returnDate!.getTime() - travelDetails.departureDate.getTime()) / (1000 * 60 * 60 * 24))} Days`,
    `${travelDetails.noOfAdults} Adults, ${travelDetails.noOfChildren} Children`
  ]
  
  currentX = tableStartX
  travelData.forEach((cell, i) => {
    const cellText = doc.splitTextToSize(cell, colWidths[i] - 2)
    doc.text(cellText, currentX + colWidths[i] / 2, tableY + 6.5, { align: 'center' })
    if (i < colWidths.length - 1) {
      doc.line(currentX + colWidths[i], tableY, currentX + colWidths[i], tableY + rowHeight)
    }
    currentX += colWidths[i]
  })

  yPosition = tableY + rowHeight + 10

  // ===== PLAN DETAILS =====
  checkNewPage(40)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
  doc.text('Plan Details', margin, yPosition)
  yPosition += 7

  // Plan details table
  const planColWidths = [45, 60, 45, 30]
  tableY = yPosition

  // Header row
  doc.setFillColor(lightGreen[0], lightGreen[1], lightGreen[2])
  doc.rect(tableStartX, tableY, planColWidths.reduce((a, b) => a + b, 0), rowHeight, 'F')
  doc.rect(tableStartX, tableY, planColWidths.reduce((a, b) => a + b, 0), rowHeight, 'S')
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
  
  const planHeaders = ['Insurance Provider', 'Plan Name', 'Coverage Territory', 'Policy Type']
  currentX = tableStartX
  planHeaders.forEach((header, i) => {
    doc.text(header, currentX + planColWidths[i] / 2, tableY + 6.5, { align: 'center' })
    if (i < planColWidths.length - 1) {
      doc.line(currentX + planColWidths[i], tableY, currentX + planColWidths[i], tableY + rowHeight)
    }
    currentX += planColWidths[i]
  })

  // Data row
  tableY += rowHeight
  doc.setFillColor(255, 255, 255)
  doc.rect(tableStartX, tableY, planColWidths.reduce((a, b) => a + b, 0), rowHeight, 'F')
  doc.rect(tableStartX, tableY, planColWidths.reduce((a, b) => a + b, 0), rowHeight, 'S')
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
  
  const planData = [
    providerName || 'N/A',
    planName || 'N/A',
    travelDetails.travelDetailList[0]?.TravelCoverageArea || 'N/A',
    travelDetails.isAnnualMultiTrip ? 'Annual Trip' : 'Single Trip'
  ]
  
  currentX = tableStartX
  planData.forEach((cell, i) => {
    const cellText = doc.splitTextToSize(cell, planColWidths[i] - 2)
    doc.text(cellText, currentX + planColWidths[i] / 2, tableY + 6.5, { align: 'center' })
    if (i < planColWidths.length - 1) {
      doc.line(currentX + planColWidths[i], tableY, currentX + planColWidths[i], tableY + rowHeight)
    }
    currentX += planColWidths[i]
  })

  yPosition = tableY + rowHeight + 10

  // ===== BENEFITS SUMMARY =====
  checkNewPage(50)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
  doc.text('Benefits Summary', margin, yPosition)
  yPosition += 7

  // Benefits table
  if (mainBenefits && mainBenefits.length > 0) {
    const benefitsTableWidth = pageWidth - 2 * margin
    const benefitNameWidth = benefitsTableWidth * 0.7
    const benefitAmountWidth = benefitsTableWidth * 0.3

    // Header
    doc.setFillColor(lightGreen[0], lightGreen[1], lightGreen[2])
    doc.rect(margin, yPosition, benefitsTableWidth, rowHeight, 'F')
    doc.rect(margin, yPosition, benefitsTableWidth, rowHeight, 'S')
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
    doc.text('Benefit', margin + 2, yPosition + 6.5)
    doc.text('Coverage Amount', margin + benefitNameWidth + 2, yPosition + 6.5)
    doc.line(margin + benefitNameWidth, yPosition, margin + benefitNameWidth, yPosition + rowHeight)
    
    yPosition += rowHeight

    // Benefits rows
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    
    const displayBenefits = mainBenefits.slice(0, 20)
    
    displayBenefits.forEach((benefit, index) => {
      checkNewPage(10)
      
      const bgColor = index % 2 === 0 ? [255, 255, 255] : lightGray
      doc.setFillColor(bgColor[0], bgColor[1], bgColor[2])
      doc.rect(margin, yPosition, benefitsTableWidth, rowHeight, 'F')
      doc.rect(margin, yPosition, benefitsTableWidth, rowHeight, 'S')
      
      const benefitName = benefit.CoverageName || benefit.BenefitDesc || 'N/A'
      const benefitAmount = benefit.DefaultLimitDesc !== '0' && benefit.DefaultLimitDesc 
        ? benefit.DefaultLimitDesc
        : benefit.Silimit && benefit.Silimit !== '0'
          ? `PHP ${parseFloat(benefit.Silimit).toLocaleString()}`
          : 'Included'
      
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
      doc.text(benefitName, margin + 2, yPosition + 6.5)
      doc.text(benefitAmount, margin + benefitNameWidth + benefitAmountWidth - 2, yPosition + 6.5, { align: 'right' })
      doc.line(margin + benefitNameWidth, yPosition, margin + benefitNameWidth, yPosition + rowHeight)
      
      yPosition += rowHeight
    })
  }

  yPosition += 10

  // ===== PREMIUM SUMMARY =====
  checkNewPage(60)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
  doc.text('Premium Summary', margin, yPosition)
  yPosition += 7

  const premium = apiResponse?.data?.GrossPremium || apiResponse?.data?.DuePremium || 0
  const basePremium = apiResponse?.data?.BeforeVatPremium || premium
  const covidAddon = apiResponse?.data?.LGT || 0
  const taxes = premium - basePremium - covidAddon

  // Premium breakdown table
  const premiumColWidths = [120, 60]
  tableY = yPosition

  // Header
  doc.setFillColor(lightGreen[0], lightGreen[1], lightGreen[2])
  doc.rect(margin, tableY, premiumColWidths.reduce((a, b) => a + b, 0), rowHeight, 'F')
  doc.rect(margin, tableY, premiumColWidths.reduce((a, b) => a + b, 0), rowHeight, 'S')
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
  doc.text('Description', margin + 2, tableY + 6.5)
  doc.text('Amount (PHP)', margin + premiumColWidths[0] + premiumColWidths[1] - 2, tableY + 6.5, { align: 'right' })
  doc.line(margin + premiumColWidths[0], tableY, margin + premiumColWidths[0], tableY + rowHeight)
  
  tableY += rowHeight

  // Data rows
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
  
  const premiumRows = [
    [`Base Premium - ${travelDetails.noOfAdults} Adults + ${travelDetails.noOfChildren} Children`, basePremium.toFixed(2)],
    ['COVID-19 Coverage Add-on', covidAddon > 0 ? covidAddon.toFixed(2) : 'Included'],
    ['Taxes & Applicable Fees', taxes.toFixed(2)]
  ]
  
  premiumRows.forEach((row, index) => {
    const bgColor = index % 2 === 0 ? [255, 255, 255] : lightGray
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2])
    doc.rect(margin, tableY, premiumColWidths.reduce((a, b) => a + b, 0), rowHeight, 'F')
    doc.rect(margin, tableY, premiumColWidths.reduce((a, b) => a + b, 0), rowHeight, 'S')
    
    doc.text(row[0], margin + 2, tableY + 6.5)
    doc.text(row[1], margin + premiumColWidths[0] + premiumColWidths[1] - 2, tableY + 6.5, { align: 'right' })
    doc.line(margin + premiumColWidths[0], tableY, margin + premiumColWidths[0], tableY + rowHeight)
    
    tableY += rowHeight
  })

  yPosition = tableY + 8

  // Total Premium Box
  const totalBoxWidth = 80
  const totalBoxHeight = 30
  const totalBoxX = pageWidth - margin - totalBoxWidth
  const totalBoxY = yPosition - 5

  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
  doc.roundedRect(totalBoxX, totalBoxY, totalBoxWidth, totalBoxHeight, 3, 3, 'F')
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('TOTAL PREMIUM', totalBoxX + totalBoxWidth / 2, totalBoxY + 11, { align: 'center' })
  
  doc.setFontSize(16)
  doc.text(`PHP ${premium.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, totalBoxX + totalBoxWidth / 2, totalBoxY + 20, { align: 'center' })
  
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  const travelers = travelDetails.noOfAdults + travelDetails.noOfChildren
  const days = Math.ceil((travelDetails.returnDate!.getTime() - travelDetails.departureDate.getTime()) / (1000 * 60 * 60 * 24))
  doc.text(`${travelers} traveler${travelers > 1 ? 's' : ''} - ${days} days`, totalBoxX + totalBoxWidth / 2, totalBoxY + 25, { align: 'center' })

  yPosition = totalBoxY + totalBoxHeight + 12

  // ===== IMPORTANT NOTES =====
  checkNewPage(50)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
  doc.text('Important Notes', margin, yPosition)
  yPosition += 7

  const notes = [
    {
      label: 'Validity',
      text: `This quotation is valid for 30 days from the date of issue (${format(new Date(), 'MMM dd, yyyy')}).`
    },
    {
      label: 'Policy Terms',
      text: `Coverage is subject to the full terms and conditions issued by ${providerName || 'the insurance provider'}.`
    },
    {
      label: 'Accuracy',
      text: 'Ensure all traveler details are accurate at time of purchase. Misrepresentation may void coverage.'
    }
  ]

  notes.forEach(note => {
    checkNewPage(16)
    
    // Light green background box
    doc.setFillColor(lightGreen[0], lightGreen[1], lightGreen[2])
    doc.rect(margin, yPosition - 2, pageWidth - 2 * margin, 13, 'F')
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2])
    doc.setLineWidth(0.5)
    doc.rect(margin, yPosition - 2, pageWidth - 2 * margin, 13, 'S')
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
    doc.text(note.label, margin + 3, yPosition + 2.5)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
    const noteText = doc.splitTextToSize(note.text, pageWidth - 2 * margin - 6)
    doc.text(noteText, margin + 3, yPosition + 7.5)
    
    yPosition += 16
  })

  yPosition += 5

  // Separator line
  doc.setDrawColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
  doc.setLineWidth(1)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  
  yPosition += 8

  // ===== FOOTER =====
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  doc.text('support@oneinsurance.ph  |  +63 (2) 8123-4567  |  www.oneinsurance.ph', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 4
  doc.text('This quotation is valid for 30 days from the date of issue.', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 4
  doc.text('Page 1', pageWidth / 2, yPosition, { align: 'center' })

  // Save the PDF
  const fileName = `Travel-Insurance-Quote-${proposalNo}.pdf`
  doc.save(fileName)
}
