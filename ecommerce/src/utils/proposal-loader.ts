import {
  useFullQuoteResponseStore,
  useTravelInsuranceStore,
} from '@/store/travel-insurance-store'
import { igwFullQuoteToPolicyData, type IgwFullQuoteResponse } from '@/utils/mappers/travel-insurance/full-quote'
import { carrierCodeForInsurer, insurerDisplayName } from '@/utils/insurer-codes'
import { calculateAge } from '@/utils/calculate-age'
import type { FullQuoteResponse } from '@/types/travel-insurance/policy-types'
import type { PersonalInfoFormData } from '@/types/travel-insurance/travel-insurance-request'
import type { InsurancePlan } from '@/types/plan'

export const PROPOSAL_VALIDITY_HOURS = 48
export const RETRIEVED_PROPOSAL_KEY = 'proposal-retrieved'

export type ProposalLoadResult =
  | { status: 'ok'; proposalNo: string }
  | { status: 'issued'; message: string; policyNo?: string }
  | { status: 'expired'; message: string }
  | { status: 'unavailable'; message: string }
  | { status: 'error'; message: string }

export const proposalCreatedAt = (data?: { ProposalDate?: string } | null) => {
  const d = data?.ProposalDate ? new Date(data.ProposalDate) : null
  return d && !isNaN(d.getTime()) ? d : null
}

/**
 * Expiry is owned by the backend/IGW — the resumption check and the
 * full-quote response both carry `expires_at`. Fall back to the legacy
 * 48-hour-from-creation heuristic only when no explicit expiry was sent.
 */
export const proposalExpiresAt = (
  data?: { ProposalDate?: string; ExpiresAt?: string | null } | null
) => {
  const explicit = data?.ExpiresAt ? new Date(data.ExpiresAt) : null
  if (explicit && !isNaN(explicit.getTime())) return explicit
  const created = proposalCreatedAt(data)
  return created ? new Date(created.getTime() + PROPOSAL_VALIDITY_HOURS * 3600_000) : null
}

export const isProposalExpired = (
  data?: { ProposalDate?: string; ExpiresAt?: string | null } | null
) => {
  const until = proposalExpiresAt(data)
  return !!until && Date.now() >= until.getTime()
}

export const buildProposalUrl = (origin: string, agentCode: string, proposalNo: string) =>
  `${origin}/${agentCode}/travel-insurance/review?proposal=${encodeURIComponent(proposalNo)}`

const EXPIRED_MESSAGE = 'This proposal has expired. Please generate a new quote.'

type Raw = Record<string, any>

const nameOf = (v: unknown): string =>
  typeof v === 'string' ? v : ((v as Raw)?.name || (v as Raw)?.code || '')
const codeOf = (v: unknown): string =>
  v && typeof v === 'object' ? ((v as Raw).code || '') : ''

const toValidDate = (v: unknown): Date | null => {
  const d = v ? new Date(v as string) : null
  return d && !isNaN(d.getTime()) ? d : null
}

const ageOf = (d: Date) => {
  try {
    return calculateAge(d)
  } catch {
    return 18
  }
}

/**
 * loadProposalIntoStore
 *
 *  1. GET /api/travel-insurance/full-quote/{proposalNumber}
 *     → OI's resumption check (local transaction layer + IGW re-validation).
 *     → Handles: resumable | expired | completed | paid_not_issued |
 *       not_found | invalid | unavailable
 *  2. If resumable, the response's `data.quote` carries everything needed to
 *     refill the flow (insurer/product/plan, premium, trip, traveller names
 *     and birth dates, selected add-ons, expires_at). ID numbers, addresses
 *     and certificate numbers are never returned, so those render
 *     masked/"Not provided" on the review screen.
 *
 * The "unavailable" state (503) is never treated as an error — the FE should
 * offer a retry button, not a hard failure.
 */
export async function loadProposalIntoStore(proposalNo: string): Promise<ProposalLoadResult> {
  // ── Resumption check ─────────────────────────────────────────────────────
  let checkResponse: Response
  let checkBody: Raw
  try {
    checkResponse = await fetch(
      `/api/travel-insurance/full-quote/${encodeURIComponent(proposalNo)}`,
      { method: 'GET', cache: 'no-store' }
    )
    checkBody = await checkResponse.json()
  } catch {
    return { status: 'unavailable', message: 'We could not reach the server. Please try again.' }
  }

  const state: string | undefined = checkBody?.data?.state

  // 503 → unavailable (IGW unreachable / login failure) — offer retry
  if (checkResponse.status === 503 || state === 'unavailable') {
    return {
      status: 'unavailable',
      message:
        checkBody?.message ||
        'The quoting service is temporarily unavailable. Please try again in a moment.',
    }
  }

  // 410 → expired
  if (checkResponse.status === 410 || state === 'expired') {
    return { status: 'expired', message: checkBody?.message || EXPIRED_MESSAGE }
  }

  // 409 → completed (paid & issued) or paid but not yet issued
  if (checkResponse.status === 409 || state === 'completed' || state === 'paid_not_issued') {
    const policyNo: string | undefined = checkBody?.data?.policy_number ?? checkBody?.data?.quote?.policy_number
    return {
      status: 'issued',
      message:
        checkBody?.message ||
        'This proposal can no longer be resumed. It may already be issued or payment is being processed.',
      ...(policyNo ? { policyNo } : {}),
    }
  }

  // 404 → not_found, 422 → invalid format
  if (checkResponse.status === 404 || state === 'not_found') {
    return {
      status: 'error',
      message: checkBody?.message || 'Proposal not found. Please check the proposal number.',
    }
  }
  if (checkResponse.status === 422 || state === 'invalid') {
    return {
      status: 'error',
      message: checkBody?.message || 'Invalid proposal number format.',
    }
  }

  // If not 200/resumable, treat as a generic error
  if (checkResponse.status !== 200 || state !== 'resumable') {
    return {
      status: 'error',
      message:
        checkBody?.message ||
        'We could not retrieve this proposal. Please try again or start a new quote.',
    }
  }

  // ── Hydrate the store from the resumption payload ────────────────────────
  const payload: Raw = checkBody.data ?? {}
  const quote: Raw = payload.quote ?? {}
  const proposalNumber: string = payload.proposal_number || proposalNo

  const insurerName = insurerDisplayName(quote.insurer)
  const insurerCode = codeOf(quote.insurer)
  const carrierCode = carrierCodeForInsurer(quote.insurer) || insurerCode
  const productName = nameOf(quote.product) || 'Travel Insurance'
  const productCode = codeOf(quote.product)
  const planName = nameOf(quote.plan) || 'Travel Insurance'
  const planCode = codeOf(quote.plan)
  const premiumAmount = Number(quote?.premium?.amount) || 0
  const currency = quote?.premium?.currency || 'PHP'

  const trip: Raw = quote.trip ?? {}
  const departure = toValidDate(
    trip.departure_date ?? trip.departure ?? trip.start_date ?? trip.departureDate
  )
  const returning = toValidDate(
    trip.return_date ?? trip.return ?? trip.end_date ?? trip.returnDate
  )
  const destsRaw = trip.destinations ?? trip.destination ?? trip.countries ?? trip.country
  const destinations: string[] = (Array.isArray(destsRaw) ? destsRaw : destsRaw ? [destsRaw] : [])
    .map((d) => (typeof d === 'string' ? d : nameOf(d)))
    .filter(Boolean)
  const tripType = String(trip.trip_type ?? trip.tripType ?? '').toUpperCase()
  const travelType = String(trip.travel_type ?? trip.travelType ?? '').toUpperCase()

  // Principal applicant first — the review screen treats index 0 as primary.
  const rawTravellers: Raw[] = Array.isArray(quote.travellers) ? [...quote.travellers] : []
  rawTravellers.sort(
    (a, b) => Number(b?.is_principal_applicant === true) - Number(a?.is_principal_applicant === true)
  )

  const travellers: PersonalInfoFormData[] = rawTravellers.map((t) => ({
    firstName: t.first_name || '',
    middleName: t.middle_name || '',
    lastName: t.last_name || '',
    suffix: t.suffix || 'No Suffix',
    gender: 'M',
    email: '',
    mobileNumber: '',
    idType: 'PAS',
    idNumber: '',
    idFrontUploaded: false,
    idBackUploaded: false,
    address: { province: '', city: '', zipCode: '', line1: '', line2: '' },
    dateOfBirth: toValidDate(t.date_of_birth) ?? new Date(),
    isCovidVaccinated: false,
    is_data_sharing_consent: false,
    hasBeneficiary: false,
    beneficiary: { firstName: '', middleName: '', lastName: '', dateOfBirth: null, relationship: '' },
  }))

  const travellerCount = Math.max(travellers.length, Number(quote.traveller_count) || 0)
  const adultCount = travellers.filter((t) => ageOf(t.dateOfBirth) >= 18).length
  const noOfAdults = travellers.length ? Math.max(1, adultCount) : travellerCount || 1
  const noOfChildren = travellers.length ? Math.max(0, travellers.length - adultCount) : 0

  const selectedAddons = Array.from(
    new Set(rawTravellers.flatMap((t) => (Array.isArray(t.selected_addons) ? t.selected_addons : [])))
  )

  const store = useTravelInsuranceStore.getState()

  const travelDetailList = destinations.map((d, i) => ({
    DisplaySequence: i + 1,
    TravelCountry: d,
    PlaceOfOrgin: 'PHILIPPINES',
    TravelCoverageArea: 'APAC' as const,
  }))

  const hydratedTravelDetails = {
    ...store.travelDetails,
    travelType:
      travelType === 'FAMILY' || travelType === 'INDIVIDUAL'
        ? (travelType as 'FAMILY' | 'INDIVIDUAL')
        : store.travelDetails.travelType,
    travelDetailList: travelDetailList.length ? travelDetailList : store.travelDetails.travelDetailList,
    departureDate: departure ?? store.travelDetails.departureDate,
    returnDate: returning ?? store.travelDetails.returnDate,
    dateOfBirth: travellers[0]?.dateOfBirth ?? store.travelDetails.dateOfBirth,
    noOfAdults,
    noOfChildren,
    isAnnualMultiTrip: tripType ? tripType === 'ANNUAL' : store.travelDetails.isAnnualMultiTrip,
    agreedToTerms: true,
  }

  const plan = {
    CarrierCode: carrierCode,
    InsurerCode: insurerCode,
    CarrierPlanCode: planCode,
    CarrierPlanDesc: planName,
    CarrierProductCode: productCode,
    CarrierProductName: productName,
    DuePremium: premiumAmount,
    GrossPremium: premiumAmount,
    BeforeVatPremium: premiumAmount,
    AnnualPremium: premiumAmount,
    Currency: currency,
    ProductCode: productCode || 'TRAVEL',
    ProductVersion: '1.0',
    MainBenefits: [],
    AddonBenefits: [],
    LGTAmount: 0,
    DiscountAmount: null,
    PremiumTaxAmt: 0,
    StampDuty: 0,
    SumInsured: null,
    TaxAmount: 0,
    VatAmount: null,
  } as unknown as InsurancePlan

  // The resumption payload mirrors IgwFullQuoteResponse.data — reuse the
  // synthesis so downstream pages see the same TravelPolicyData shape as a
  // freshly generated proposal.
  const igwData = {
    id: String(payload.id ?? quote.id ?? ''),
    proposal_number: proposalNumber,
    status: quote.status ?? 'draft',
    insurer: { code: insurerCode, name: insurerName },
    product: { code: productCode, name: productName },
    plan: { code: planCode, name: planName },
    premium: { amount: String(quote?.premium?.amount ?? premiumAmount), currency },
    travellers: rawTravellers,
    expires_at: payload.expires_at ?? '',
  } as unknown as NonNullable<IgwFullQuoteResponse['data']>

  const coverageOption = {
    carrierCode,
    selectedPlan: plan,
    selectedAddonBenefits: selectedAddons,
  }

  let policyData
  try {
    policyData = igwFullQuoteToPolicyData(igwData, {
      travelDetails: hydratedTravelDetails,
      coverageOption,
      travelersInfo: travellers,
    })
  } catch (err) {
    console.error('[proposal-loader] failed to hydrate proposal:', err)
    return {
      status: 'error',
      message: 'We could not read this proposal. Please try again or start a new quote.',
    }
  }

  useTravelInsuranceStore.setState({
    clientRequest: { id: proposalNumber, status: 'success' },
    refCode: proposalNumber,
    coverageOption,
    travelDetails: hydratedTravelDetails,
    travelersInfo: travellers,
    step: 4,
    highestVisitedStep: Math.max(store.highestVisitedStep, 4),
  })
  useFullQuoteResponseStore.getState().setApiResponse({
    success: true,
    message: 'Proposal loaded',
    data: policyData,
  } as unknown as FullQuoteResponse)
  try {
    sessionStorage.setItem(RETRIEVED_PROPOSAL_KEY, proposalNumber)
  } catch {
    // storage unavailable — details just won't be masked on refresh
  }
  return { status: 'ok', proposalNo: proposalNumber }
}
