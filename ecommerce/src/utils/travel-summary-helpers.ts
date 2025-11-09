import { format, differenceInDays } from 'date-fns'
import {
  FullQuoteResponse,
  IssueQuoteResponse,
} from '@/types/travel-insurance/policy-types'
import { PaymentBrand } from '@/types/payment'
import { CoverageOptionFormData } from '@/types/travel-insurance/travel-insurance-request'

export const transformToInvoiceData = (
  policyData: IssueQuoteResponse['data'],
  quoteData: FullQuoteResponse['data'],
  paymentMethod: PaymentBrand
) => {
  const effectiveDate = new Date(quoteData.EffectiveDate)
  const expiryDate = new Date(quoteData.ExpiryDate)
  const calculatedTravelDays = differenceInDays(expiryDate, effectiveDate) + 1

  const customer = quoteData.PolicyCustomerList?.[0]

  const basePremium = quoteData.GrossPremium || 0
  const lgt = quoteData.LGT || 0
  const vat = quoteData.DuePremium - quoteData.BeforeVatPremium || 0
  const processingFee = quoteData.GrossPremium - quoteData.BeforeVatPremium || 0
  const total = quoteData?.DuePremium ?? basePremium + lgt + vat + processingFee

  const destinations =
    quoteData.TravelDetailList && quoteData.TravelDetailList.length > 0
      ? quoteData.TravelDetailList.map((travel: any) => {
          return travel.PlaceOfOrgin && travel.TravelCountry
            ? `${travel.PlaceOfOrgin} → ${travel.TravelCountry}`
            : travel.TravelCountry || 'Not specified'
        }).join(', ')
      : 'Not specified'

  return {
    policyNumber: policyData.PolicyNo || '',
    proposalNumber: policyData.ProposalNo || '',
    invoiceDate: format(new Date(), 'MMMM dd, yyyy'),
    customer: {
      name: `${customer?.FirstName || ''} ${customer?.LastName || ''}`.trim(),
      email: customer?.Email || '',
      phone: customer?.Mobile || '',
      address:
        `${customer?.AddressLine1 || ''}, ${customer?.City || ''}`.trim(),
    },
    travel: {
      type: quoteData.TravelType || '',
      departureDate: format(effectiveDate, 'MMMM dd, yyyy'),
      returnDate: format(expiryDate, 'MMMM dd, yyyy'),
      duration: `${quoteData.TravelDays || calculatedTravelDays || 0} Days`,
      destinations: destinations,
    },
    policy: {
      carrier: quoteData.CarrierCode || '',
      plan: quoteData.CarrierPlanCode || '',
      coverageArea: quoteData.TravelDetailList?.[0]?.TravelCoverageArea || '',
    },
    payment: {
      basePremium: basePremium,
      lgt: lgt,
      vat: vat,
      processingFee: processingFee,
      total: total,
      method: paymentMethod.value || '',
    },
    status: {
      issueDate: format(new Date(), 'MMMM dd, yyyy'),
      status: 'Active',
      effectiveDate: format(new Date(quoteData.EffectiveDate), 'MMMM dd, yyyy'),
      expiryDate: format(new Date(quoteData.ExpiryDate), 'MMMM dd, yyyy'),
    },
  }
}

export const transformToCOCData = (
  policyData: IssueQuoteResponse['data'],
  quoteData: FullQuoteResponse['data'],
  coverageOption: CoverageOptionFormData
) => {
  const effectiveDate = new Date(quoteData.EffectiveDate)
  const expiryDate = new Date(quoteData.ExpiryDate)
  const calculatedTravelDays = differenceInDays(expiryDate, effectiveDate) + 1

  const destinations =
    quoteData.TravelDetailList && quoteData.TravelDetailList.length > 0
      ? quoteData.TravelDetailList.map((travel: any) => {
          return travel.PlaceOfOrgin && travel.TravelCountry
            ? `${travel.PlaceOfOrgin} → ${travel.TravelCountry}`
            : travel.TravelCountry || 'Not specified'
        }).join(', ')
      : 'Not specified'

  const customers =
    quoteData.PolicyCustomerList?.map((customer) => ({
      name: `${customer?.FirstName ?? ''} ${customer?.LastName ?? ''}`.trim(),
      email: customer?.Email ?? '',
      phone: customer?.Mobile ?? '',
      address: [
        customer?.AddressLine1,
        customer?.City,
        customer?.AddrProvince,
        customer?.PostCode,
      ]
        .filter(Boolean)
        .join(', '),
    })) ?? []

  const coverageList =
    quoteData.PolicyLobList?.[0]?.PolicyRiskList?.[0]?.PolicyCoverageList?.map(
      (c) => ({
        name: c.CoverageName,
        sumInsured: 'Included',
      })
    ) ?? []

  return {
    policyNumber: policyData?.PolicyNo ?? '',
    proposalNumber: quoteData?.ProposalNo ?? '',
    invoiceDate: format(new Date(), 'MMMM dd, yyyy'),

    customers,

    travel: {
      type: quoteData.TravelType || '',
      departureDate: format(effectiveDate, 'MMMM dd, yyyy'),
      returnDate: format(expiryDate, 'MMMM dd, yyyy'),
      duration: `${quoteData.TravelDays || calculatedTravelDays || 0} Days`,
      destinations,
    },

    policy: {
      carrier: quoteData.CarrierCode || '',
      plan: quoteData.CarrierPlanCode || '',
      coverageArea: quoteData.TravelDetailList?.[0]?.TravelCoverageArea || '',
    },

    coverage: coverageList,

    status: {
      issueDate: format(new Date(), 'MMMM dd, yyyy'),
      status: 'Active',
      effectiveDate: format(effectiveDate, 'MMMM dd, yyyy'),
      expiryDate: format(expiryDate, 'MMMM dd, yyyy'),
    },

    plan: {
      code:
        coverageOption.selectedPlan?.CarrierPlanDesc ||
        coverageOption.selectedPlan?.CarrierPlanCode ||
        '',
    },
  }
}
