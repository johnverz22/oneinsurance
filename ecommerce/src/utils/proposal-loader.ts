import {
  useFullQuoteResponseStore,
  useTravelInsuranceStore,
} from '@/store/travel-insurance-store'
import { igwFullQuoteToPolicyData, type IgwFullQuoteResponse } from '@/utils/mappers/travel-insurance/full-quote'
import { carrierCodeForInsurer, insurerDisplayName } from '@/utils/insurer-codes'
import { calculateAge } from '@/utils/calculate-age'
import { findCountry } from '@/utils/trip-summary'
import type { FullQuoteResponse, IssueQuoteResponse } from '@/types/travel-insurance/policy-types'
import type { PersonalInfoFormData } from '@/types/travel-insurance/travel-insurance-request'
import type { InsurancePlan } from '@/types/plan'

export const PROPOSAL_VALIDITY_HOURS = 48
export const RETRIEVED_PROPOSAL_KEY = 'proposal-retrieved'

export type ProposalLoadResult =
  | { status: 'ok'; proposalNo: string }
  | {
      status: 'issued'
      message: string
      policyNo?: string
      paymentRef?: string
      /** Where the caller should send the user: policy page, issuance, or just show the notice. */
      next?: 'policy' | 'issuance' | 'notice'
    }
  | { status: 'expired'; message: string }
  | { status: 'unavailable'; message: string }
  | { status: 'error'; message: string }

/** State-only resumption check — never touches the stores. */
export type ProposalStateKind =
  | 'resumable'
  | 'completed'
  | 'paid_not_issued'
  | 'expired'
  | 'not_found'
  | 'invalid'
  | 'unavailable'
  | 'error'

export interface ProposalStateCheck {
  state: ProposalStateKind
  policyNo?: string
  paymentRef?: string
}

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

// Candidate field names for the DLT payment reference on resumption responses.
// The local transaction layer may expose it under different keys depending on
// backend version — check them all, including a nested `payment` object.
const PAYMENT_REF_KEYS = [
  'payment_reference',
  'merchant_transaction_id',
  'transaction_id',
  'external_reference',
  'payment_ref',
  'reference',
]

const pickPaymentRef = (d: Raw | undefined | null): string | undefined => {
  if (!d || typeof d !== 'object') return undefined
  for (const k of PAYMENT_REF_KEYS) {
    const v = d[k]
    if (typeof v === 'string' && v) return v
  }
  const p = d.payment
  if (p && typeof p === 'object') {
    for (const k of PAYMENT_REF_KEYS) {
      const v = (p as Raw)[k]
      if (typeof v === 'string' && v) return v
    }
  }
  return undefined
}

/** The merchant_transaction_id minted by this browser's payment submit, if any. */
const storedPaymentRef = (): string | undefined =>
  useTravelInsuranceStore.getState().paymentSubmitResponse?.data?.merchant_transaction_id ||
  undefined

const pickPolicyNo = (d: Raw | undefined | null): string | undefined =>
  d?.policy_number ?? d?.quote?.policy_number ?? undefined

/**
 * checkProposalState — the cheap half of the resumption check: classifies the
 * proposal without hydrating any store.  Used by the review page's in-session
 * guard so a paid-elsewhere proposal can't sit on the review screen.
 */
export async function checkProposalState(proposalNo: string): Promise<ProposalStateCheck> {
  let status: number
  let body: Raw
  try {
    const res = await fetch(
      `/api/travel-insurance/full-quote/${encodeURIComponent(proposalNo)}`,
      { method: 'GET', cache: 'no-store' }
    )
    status = res.status
    body = await res.json()
  } catch {
    return { state: 'unavailable' }
  }

  const state: string | undefined = body?.data?.state
  const paymentRef = pickPaymentRef(body?.data) ?? storedPaymentRef()
  const policyNo = pickPolicyNo(body?.data)
  const base = { paymentRef, policyNo }

  if (status === 503 || state === 'unavailable') return { state: 'unavailable', ...base }
  if (status === 410 || state === 'expired') return { state: 'expired', ...base }
  if (status === 409 || state === 'completed' || state === 'paid_not_issued') {
    return { state: state === 'paid_not_issued' ? 'paid_not_issued' : 'completed', ...base }
  }
  if (status === 404 || state === 'not_found') return { state: 'not_found', ...base }
  if (status === 422 || state === 'invalid') return { state: 'invalid', ...base }
  return { state: status === 200 && state === 'resumable' ? 'resumable' : 'error', ...base }
}

/**
 * recoverIssuedPolicy
 *
 * POST /api/travel-insurance/issue-quote is idempotent: for an already-issued
 * proposal the IGW returns the full policy payload (policy_no, certificate
 * numbers, quote echoes) instead of creating anything.  We piggyback on that
 * to recover the issued policy when the resumption check reports `completed`
 * or `paid_not_issued`.  `single_attempt` keeps this probe fast — a real
 * issuance retry flow lives on the issuance page, not here.
 *
 * Returns the policy number on success (stores hydrated + issue state set),
 * otherwise null so the caller can fall back.
 */
export async function recoverIssuedPolicy(
  proposalNo: string,
  paymentRef?: string
): Promise<string | null> {
  try {
    const res = await fetch('/api/travel-insurance/issue-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proposal_number: proposalNo,
        payment: { reference: paymentRef || proposalNo },
        single_attempt: true,
      }),
    })
    const body: Raw = await res.json().catch(() => null)
    const data: Raw | undefined = body?.data
    if (!res.ok || !data?.policy_no) return null

    const pno = String(data.proposal_number || proposalNo)
    if (!hydrateFromQuotePayload(data, pno)) {
      // Policy exists but the payload couldn't be mapped — still give
      // downstream pages the proposal number they key off.
      useFullQuoteResponseStore.getState().setApiResponse({
        success: true,
        message: String(body?.message || ''),
        data: { ProposalNo: pno },
      } as unknown as FullQuoteResponse)
    }
    const store = useTravelInsuranceStore.getState()
    store.setIssueQuoteResponse(body as unknown as IssueQuoteResponse)
    store.setPolicyNo(String(data.policy_no))
    store.setStep(7)
    return String(data.policy_no)
  } catch {
    return null
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
 *  3. `completed`/`paid_not_issued` (409) are recovered through the idempotent
 *     issue-quote endpoint — see recoverIssuedPolicy.  `completed` resolves to
 *     `next: 'policy'` (policy already issued) and `paid_not_issued` to
 *     `next: 'issuance'` when recovery fails, so the caller can continue the
 *     post-payment journey instead of showing a dead end.
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

  // 409 → completed (paid & issued) or paid but not yet issued.
  // Try to recover the issued policy first — issue-quote is idempotent and
  // returns the full policy payload when one exists.
  if (checkResponse.status === 409 || state === 'completed' || state === 'paid_not_issued') {
    const paymentRef = pickPaymentRef(checkBody?.data) ?? storedPaymentRef()
    const recovered = await recoverIssuedPolicy(proposalNo, paymentRef)
    if (recovered) {
      return {
        status: 'issued',
        next: 'policy',
        policyNo: recovered,
        message: checkBody?.message || 'This proposal has already been issued.',
      }
    }
    if (state === 'paid_not_issued') {
      // Payment is recorded server-side but no policy exists yet — hand off to
      // the issuance page, which finishes the post-payment journey.
      if (!hydrateFromQuotePayload(checkBody.data ?? {}, proposalNo)) {
        useFullQuoteResponseStore.getState().setApiResponse({
          success: true,
          message: '',
          data: { ProposalNo: proposalNo },
        } as unknown as FullQuoteResponse)
      }
      return {
        status: 'issued',
        next: 'issuance',
        paymentRef,
        message: checkBody?.message || 'This proposal is already paid and is being issued.',
      }
    }
    const policyNo = pickPolicyNo(checkBody?.data)
    return {
      status: 'issued',
      next: 'notice',
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
  if (!hydrateFromQuotePayload(checkBody.data ?? {}, proposalNo)) {
    return {
      status: 'error',
      message: 'We could not read this proposal. Please try again or start a new quote.',
    }
  }
  return { status: 'ok', proposalNo: checkBody?.data?.proposal_number || proposalNo }
}

/**
 * hydrateFromQuotePayload
 *
 * Fills the travel store + full-quote store from a quote-shaped payload.
 * Accepts either the resumption shape ({ data: { quote: {...} } }) or the
 * issue-quote shape (same fields at the top level of `data`), normalised via
 * `payload.quote ?? payload`.  Returns false when the payload can't be
 * mapped into TravelPolicyData.
 */
function hydrateFromQuotePayload(payload: Raw, proposalNo: string): boolean {
  const quote: Raw = payload.quote ?? payload
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
  const destsRaw =
    trip.destinations ?? trip.destination_countries ?? trip.destination ?? trip.countries ?? trip.country
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

  const travellers: PersonalInfoFormData[] = rawTravellers.map((t, i) => ({
    isPrincipalApplicant: i === 0,
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

  const travellerCount = Math.max(
    travellers.length,
    Number(quote.traveller_count ?? payload.traveller_count) || 0
  )
  const adultCount = travellers.filter((t) => ageOf(t.dateOfBirth) >= 18).length
  const noOfAdults = travellers.length ? Math.max(1, adultCount) : travellerCount || 1
  const noOfChildren = travellers.length ? Math.max(0, travellers.length - adultCount) : 0

  const selectedAddons = Array.from(
    new Set(rawTravellers.flatMap((t) => (Array.isArray(t.selected_addons) ? t.selected_addons : [])))
  )

  const store = useTravelInsuranceStore.getState()

  const originRaw = trip.origin ?? trip.origin_country ?? trip.departure_country ?? trip.place_of_origin
  const tripOrigin =
    findCountry(typeof originRaw === 'string' ? originRaw : nameOf(originRaw))?.code ?? 'PHILIPPINES'
  const resolvedDestinations = destinations.map((d) => {
    const match = findCountry(d)
    return { code: match?.code ?? d.toUpperCase(), area: match?.area ?? ('APAC' as const) }
  })
  const travelDetailList = resolvedDestinations.map((d, i) => ({
    DisplaySequence: i + 1,
    TravelCountry: d.code,
    PlaceOfOrgin: i === 0 ? tripOrigin : resolvedDestinations[i - 1].code,
    TravelCoverageArea: d.area,
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

  // Hydrate the store BEFORE mapping — even if the policyData synthesis
  // throws below, the issued policy can still render from the quote-shaped
  // fields (selectedPlan especially) instead of a half-empty store.
  useTravelInsuranceStore.setState({
    clientRequest: { id: proposalNumber, status: 'success' },
    refCode: proposalNumber,
    coverageOption,
    travelDetails: hydratedTravelDetails,
    travelersInfo: travellers,
    step: 4,
    highestVisitedStep: Math.max(store.highestVisitedStep, 4),
  })

  let policyData
  try {
    policyData = igwFullQuoteToPolicyData(igwData, {
      travelDetails: hydratedTravelDetails,
      coverageOption,
      travelersInfo: travellers,
    })
  } catch (err) {
    console.error('[proposal-loader] failed to hydrate proposal:', err)
    return false
  }
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
  return true
}
