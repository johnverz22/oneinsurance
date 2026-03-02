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
  const { travelDetails, travelersInfo, apiResponse, planName, providerName, addons, mainBenefits, addonBenefits } = data
  const doc = new jsPDF()
  
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
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

  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace: number = 20) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage()
      yPosition = margin
      return true
    }
    return false
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

  // Travelers Information Section
  if (travelersInfo && travelersInfo.length > 0) {
    checkNewPage(40)
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    addText('Travelers Information', margin, yPosition)
    yPosition += 10

    travelersInfo.forEach((traveler, index) => {
      checkNewPage(60)
      
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 112, 243)
      addText(`Traveler ${index + 1}`, margin, yPosition)
      yPosition += 7

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)

      // Name
      const fullName = [
        traveler.firstName,
        traveler.middleName,
        traveler.lastName,
        traveler.suffix !== 'No Suffix' ? traveler.suffix : ''
      ].filter(Boolean).join(' ')
      
      addText('Name:', margin + 5, yPosition)
      doc.setFont('helvetica', 'bold')
      addText(fullName, margin + 50, yPosition)
      yPosition += 5

      // Gender & Date of Birth
      doc.setFont('helvetica', 'normal')
      addText('Gender:', margin + 5, yPosition)
      doc.setFont('helvetica', 'bold')
      addText(traveler.gender === 'M' ? 'Male' : 'Female', margin + 50, yPosition)
      yPosition += 5

      doc.setFont('helvetica', 'normal')
      addText('Date of Birth:', margin + 5, yPosition)
      doc.setFont('helvetica', 'bold')
      const dob = traveler.dateOfBirth instanceof Date ? traveler.dateOfBirth : new Date(traveler.dateOfBirth)
      addText(format(dob, 'PP'), margin + 50, yPosition)
      yPosition += 5

      // Contact Information
      doc.setFont('helvetica', 'normal')
      addText('Email:', margin + 5, yPosition)
      doc.setFont('helvetica', 'bold')
      addText(traveler.email, margin + 50, yPosition)
      yPosition += 5

      doc.setFont('helvetica', 'normal')
      addText('Mobile:', margin + 5, yPosition)
      doc.setFont('helvetica', 'bold')
      addText(`+63${traveler.mobileNumber}`, margin + 50, yPosition)
      yPosition += 5

      // ID Information
      doc.setFont('helvetica', 'normal')
      addText('ID Type:', margin + 5, yPosition)
      doc.setFont('helvetica', 'bold')
      addText(traveler.idType, margin + 50, yPosition)
      yPosition += 5

      doc.setFont('helvetica', 'normal')
      addText('ID Number:', margin + 5, yPosition)
      doc.setFont('helvetica', 'bold')
      addText(traveler.idNumber, margin + 50, yPosition)
      yPosition += 5

      // Address
      doc.setFont('helvetica', 'normal')
      addText('Address:', margin + 5, yPosition)
      doc.setFont('helvetica', 'bold')
      const addressParts = [
        traveler.address.line1,
        traveler.address.line2,
        traveler.address.city,
        traveler.address.province,
        traveler.address.zipCode
      ].filter(Boolean)
      
      // Split address into multiple lines if too long
      const addressText = addressParts.join(', ')
      const splitAddress = doc.splitTextToSize(addressText, pageWidth - margin - 55)
      let addressY = yPosition
      splitAddress.forEach((line: string) => {
        if (addressY > yPosition) {
          checkNewPage(5)
          addText(line, margin + 50, addressY)
        } else {
          addText(line, margin + 50, addressY)
        }
        addressY += 5
      })
      yPosition = addressY

      // COVID Vaccination Status
      if (traveler.isCovidVaccinated !== undefined) {
        doc.setFont('helvetica', 'normal')
        addText('COVID-19 Vaccinated:', margin + 5, yPosition)
        doc.setFont('helvetica', 'bold')
        addText(traveler.isCovidVaccinated ? 'Yes' : 'No', margin + 50, yPosition)
        yPosition += 5
      }

      // Beneficiary Information
      if (traveler.hasBeneficiary && traveler.beneficiary?.firstName) {
        yPosition += 3
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(100, 100, 100)
        addText('Beneficiary:', margin + 5, yPosition)
        yPosition += 5

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        const beneficiaryName = [
          traveler.beneficiary.firstName,
          traveler.beneficiary.middleName,
          traveler.beneficiary.lastName
        ].filter(Boolean).join(' ')
        
        addText(beneficiaryName, margin + 10, yPosition)
        yPosition += 5

        if (traveler.beneficiary.relationship) {
          doc.setFont('helvetica', 'normal')
          addText(`Relationship: ${traveler.beneficiary.relationship}`, margin + 10, yPosition)
          yPosition += 5
        }

        if (traveler.beneficiary.dateOfBirth) {
          const beneficiaryDob = traveler.beneficiary.dateOfBirth instanceof Date 
            ? traveler.beneficiary.dateOfBirth 
            : new Date(traveler.beneficiary.dateOfBirth)
          addText(`Date of Birth: ${format(beneficiaryDob, 'PP')}`, margin + 10, yPosition)
          yPosition += 5
        }
      }

      yPosition += 5
    })

    yPosition += 5
    addLine(yPosition)
    yPosition += 10
  }

  // Benefits Section
  if (mainBenefits && mainBenefits.length > 0) {
    checkNewPage(40)
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    addText('Coverage Benefits', margin, yPosition)
    yPosition += 10

    // Main Benefits
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 112, 243)
    addText('Main Benefits', margin, yPosition)
    yPosition += 7

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)

    mainBenefits.forEach((benefit) => {
      checkNewPage(10)
      
      const benefitText = `• ${benefit.CoverageName || benefit.BenefitDesc}`
      const limitText = benefit.DefaultLimitDesc || benefit.Silimit || ''
      
      // Benefit name
      addText(benefitText, margin + 5, yPosition)
      
      // Coverage limit (right-aligned)
      if (limitText) {
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(0, 112, 243)
        addText(limitText, pageWidth - margin, yPosition, { align: 'right' })
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
      }
      
      yPosition += 6
    })

    // Addon Benefits
    if (addonBenefits && addonBenefits.length > 0) {
      yPosition += 5
      checkNewPage(20)
      
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 112, 243)
      addText('Additional Benefits', margin, yPosition)
      yPosition += 7

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)

      addonBenefits.forEach((benefit) => {
        checkNewPage(10)
        
        const benefitText = `• ${benefit.CoverageName || benefit.BenefitDesc}`
        const limitText = benefit.DefaultLimitDesc || benefit.Silimit || ''
        
        // Benefit name
        addText(benefitText, margin + 5, yPosition)
        
        // Coverage limit (right-aligned)
        if (limitText) {
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(0, 112, 243)
          addText(limitText, pageWidth - margin, yPosition, { align: 'right' })
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(0, 0, 0)
        }
        
        yPosition += 6
      })
    }

    yPosition += 5
    addLine(yPosition)
    yPosition += 10
  }

  // Premium Section
  checkNewPage(40)
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
