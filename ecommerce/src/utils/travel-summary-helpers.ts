import { format, differenceInDays } from 'date-fns'
import {
  FullQuoteResponse,
  IssueQuoteResponse,
} from '@/types/travel-insurance/policy-types'
import { PaymentBrand, PaymentSubmitRequest } from '@/types/payment'
import { CoverageOptionFormData } from '@/types/travel-insurance/travel-insurance-request'
import {
  getCityNameByCityCode,
  getProvinceNameByProvCode,
} from './address-util'
import { Coverage } from '@/components/payment/coverage-of-confirmation'

export const transformToInvoiceData = (
  policyData: IssueQuoteResponse['data'],
  quoteData: FullQuoteResponse['data'],
  paymentMethod: PaymentBrand,
  paymentBillingDetails: PaymentSubmitRequest
) => {
  const effectiveDate = new Date(quoteData.EffectiveDate)
  const expiryDate = new Date(quoteData.ExpiryDate)
  const calculatedTravelDays = differenceInDays(expiryDate, effectiveDate) + 1

  const basePremium = quoteData.GrossPremium || 0

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
      name: `${paymentBillingDetails?.first_name || ''} ${paymentBillingDetails?.last_name || ''}`.trim(),
      email: paymentBillingDetails?.email || '',
      phone: paymentBillingDetails?.phone || '',
      address:
        `${paymentBillingDetails?.address_line_one || ''}, ${paymentBillingDetails?.address_line_two || ''}`.trim(),
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
  coverages: Coverage[],
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
        getCityNameByCityCode(customer?.City),
        getProvinceNameByProvCode(customer?.AddrProvince),
        customer?.PostCode,
      ]
        .filter(Boolean)
        .join(', '),
    })) ?? []

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

    coverage: coverages,

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
