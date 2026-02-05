import { TravelPolicyData } from '@/types/quote'
import { jsPDF } from 'jspdf'

export function generateTravelInsurancePDF(
  apiResponse: TravelPolicyData
): jsPDF {
  const doc = new jsPDF()
  const data = apiResponse

  // Set up fonts and colors
  doc.setFontSize(20)
  doc.setTextColor(0, 51, 102) // Dark blue

  // Header
  doc.text('TRAVEL INSURANCE POLICY', 105, 20, { align: 'center' })

  // Policy basic information
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text('Policy Information', 20, 40)

  doc.setFontSize(10)
  let yPos = 50

  // Policy details in two columns
  const leftCol = 20
  const rightCol = 120

  doc.text(`Policy No: ${(data as any).CarrierPolicyNo || data.PolicyNo || 'N/A'}`, leftCol, yPos)
  doc.text(`Carrier: ${data.CarrierCode}`, rightCol, yPos)
  yPos += 8

  doc.text(`Plan: ${data.PlanCode}`, leftCol, yPos)
  doc.text(`Issue Date: ${formatDate(data.IssueDate)}`, rightCol, yPos)
  yPos += 8

  doc.text(`Effective Date: ${data.EffectiveDate}`, leftCol, yPos)
  doc.text(`Expiry Date: ${data.ExpiryDate}`, rightCol, yPos)
  yPos += 8

  doc.text(`Travel Days: ${data.TravelDays}`, leftCol, yPos)
  doc.text(`No. of Travellers: ${data.NoOfTravellers}`, rightCol, yPos)
  yPos += 15

  // Premium information
  doc.setFontSize(16)
  doc.text('Premium Information', 20, yPos)
  yPos += 10

  doc.setFontSize(10)
  doc.text(`Sum Insured: ₱ ${data.SumInsured.toLocaleString()}`, leftCol, yPos)
  doc.text(`Gross Premium: ₱ ${data.GrossPremium}`, rightCol, yPos)
  yPos += 8

  doc.text(`Annual Premium: ₱ ${data.AnnualPremium}`, leftCol, yPos)
  yPos += 15

  // Promo codes if any
  if (data.PromoCodeList && data.PromoCodeList.length > 0) {
    doc.setFontSize(12)
    doc.text('Applied Discounts:', 20, yPos)
    yPos += 8

    doc.setFontSize(10)
    data.PromoCodeList.forEach((promo) => {
      doc.text(
        `Code: ${promo.PromoCode} (${promo.DiscountPercent}% discount)`,
        leftCol,
        yPos
      )
      yPos += 6
    })
    yPos += 10
  }

  // Policyholder information
  if (data.PolicyCustomerList && data.PolicyCustomerList.length > 0) {
    const customer = data.PolicyCustomerList[0]

    doc.setFontSize(16)
    doc.text('Policyholder Information', 20, yPos)
    yPos += 10

    doc.setFontSize(10)
    const fullName = `${customer.FirstName} ${customer.MiddleName !== 'null' ? customer.MiddleName + ' ' : ''}${customer.LastName}`
    doc.text(`Name: ${fullName}`, leftCol, yPos)
    yPos += 8

    doc.text(`Email: ${customer.Email}`, leftCol, yPos)
    doc.text(`Mobile: ${customer.Mobile}`, rightCol, yPos)
    yPos += 8

    doc.text(`Date of Birth: ${customer.DateOfBirth}`, leftCol, yPos)
    doc.text(`Gender: ${customer.Gender}`, rightCol, yPos)
    yPos += 8

    doc.text(`ID Type: ${customer.IdTypeCode}`, leftCol, yPos)
    doc.text(`ID No: ${customer.IdNo}`, rightCol, yPos)
    yPos += 8

    doc.text(`Address: ${customer.AddressLine1}`, leftCol, yPos)
    yPos += 6
    doc.text(
      `${customer.City}, ${customer.AddrProvince} ${customer.PostCode}`,
      leftCol,
      yPos
    )
    yPos += 15
  }

  // Travel details
  if (data.TravelDetailList && data.TravelDetailList.length > 0) {
    doc.setFontSize(16)
    doc.text('Travel Information', 20, yPos)
    yPos += 10

    doc.setFontSize(10)
    data.TravelDetailList.forEach((travel) => {
      doc.text(`From: ${travel.PlaceOfOrgin}`, leftCol, yPos)
      doc.text(`To: ${travel.TravelCountry}`, rightCol, yPos)
      yPos += 8
      doc.text(`Coverage Area: ${travel.TravelCoverageArea}`, leftCol, yPos)
      yPos += 10
    })
  }

  // Check if we need a new page for coverage details
  if (yPos > 240) {
    doc.addPage()
    yPos = 20
  }

  // Coverage details
  if (
    data.PolicyLobList &&
    data.PolicyLobList[0]?.PolicyRiskList?.[0]?.PolicyCoverageList
  ) {
    const coverages = data.PolicyLobList[0].PolicyRiskList[0].PolicyCoverageList

    doc.setFontSize(16)
    doc.text('Coverage Details', 20, yPos)
    yPos += 10

    doc.setFontSize(10)
    doc.text('This policy includes the following coverages:', 20, yPos)
    yPos += 10

    // Create coverage list in two columns
    coverages.forEach((coverage, index) => {
      const column = index % 2 === 0 ? leftCol : rightCol
      const currentY = yPos + Math.floor(index / 2) * 6

      // Check if we need a new page
      if (currentY > 270) {
        doc.addPage()
        yPos = 20
        doc.text(`${index + 1}. ${coverage.CoverageName}`, column, yPos)
      } else {
        doc.text(`${index + 1}. ${coverage.CoverageName}`, column, currentY)
      }
    })

    yPos += Math.ceil(coverages.length / 2) * 6 + 15
  }

  // Footer
  if (yPos > 260) {
    doc.addPage()
    yPos = 20
  }

  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text(
    'This is a computer-generated document. No signature is required.',
    105,
    280,
    { align: 'center' }
  )
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 285, {
    align: 'center',
  })

  return doc
}

// Utility function to format date
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

// Example usage function
export function downloadPolicyPDF(
  apiResponse: TravelPolicyData,
  filename?: string
): void {
  const doc = generateTravelInsurancePDF(apiResponse)
  const policyNo = (apiResponse as any).CarrierPolicyNo || apiResponse.PolicyNo || 'policy'
  const defaultFilename = `${policyNo}_travel_insurance.pdf`

  doc.save(filename || defaultFilename)
}

// Alternative function to get PDF as blob (useful for web applications)
export function getPolicyPDFBlob(apiResponse: TravelPolicyData): Blob {
  const doc = generateTravelInsurancePDF(apiResponse)
  return doc.output('blob')
}

// Alternative function to get PDF as base64 string
export function getPolicyPDFBase64(apiResponse: TravelPolicyData): string {
  const doc = generateTravelInsurancePDF(apiResponse)
  return doc.output('datauristring')
}
