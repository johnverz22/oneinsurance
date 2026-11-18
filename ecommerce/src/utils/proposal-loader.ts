import {
  useFullQuoteResponseStore,
  useTravelInsuranceStore,
} from '@/store/travel-insurance-store'
import { igwFullQuoteToPolicyData, type IgwFullQuoteResponse } from '@/utils/mappers/travel-insurance/full-quote'
import { carrierCodeForInsurer, insurerDisplayName } from '@/utils/insurer-codes'
import { calculateAge } from '@/utils/calculate-age'
import { findCountry } from '@/utils/trip-summary'
import type { FullQuoteResponse, IssueQuoteResponse } from '@/types/travel-insurance/policy-types'
import {
  PH_ID_TYPES,
  type PersonalInfoFormData,
  type PhilippineIdTypeEnum,
} from '@/types/travel-insurance/travel-insurance-request'
import type { InsuranceBenefit, InsurancePlan } from '@/types/plan'

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
  /** 404 with the resume-token switch on: unknown proposal or missing/expired token. */
  | { status: 'needs_verification'; message: string }
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
  /** 404 while the resume-token switch is on — verify with an email code. */
  | 'needs_verification'
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

// ── Email-code (OTP) resume ────────────────────────────────────────────────

export type ResumeOtpRequestResult =
  | { status: 'sent' }
  | { status: 'rate_limited'; retryAfterSeconds: number }
  | { status: 'error'; message: string }

export type ResumeOtpVerifyResult =
  | { status: 'verified' }
  /** Wrong / expired / already-used code — one message for all of them. */
  | { status: 'invalid'; message: string }
  /** The code is not 6 digits — show under the field. */
  | { status: 'invalid_format'; message: string }
  /** Too many wrong guesses: the proposal is locked for ~24 hours. */
  | { status: 'locked'; message: string }
  | { status: 'error'; message: string }

/** `Retry-After` may be seconds or an HTTP date. Normalise to seconds. */
export function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined
  const seconds = Number(value)
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds)
  const date = new Date(value)
  if (!isNaN(date.getTime())) {
    return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 1000))
  }
  return undefined
}

/** Asks OI to email a resume code. The response never reveals existence. */
export async function requestResumeOtp(
  proposalNo: string
): Promise<ResumeOtpRequestResult> {
  try {
    const res = await fetch(
      `/api/travel-insurance/full-quote/${encodeURIComponent(proposalNo)}/otp`,
      { method: 'POST', cache: 'no-store' }
    )
    const body = await res.json().catch(() => null)

    if (res.status === 429) {
      return {
        status: 'rate_limited',
        retryAfterSeconds: parseRetryAfter(res.headers.get('retry-after')) ?? 60,
      }
    }
    if (res.ok || res.status === 202) return { status: 'sent' }

    return {
      status: 'error',
      message: body?.message || 'We could not send a code right now. Please try again.',
    }
  } catch {
    return {
      status: 'error',
      message: 'We could not reach the server. Check your connection and try again.',
    }
  }
}

/** Verifies the emailed code; the BFF stores the returned resume token. */
export async function verifyResumeOtp(
  proposalNo: string,
  code: string
): Promise<ResumeOtpVerifyResult> {
  try {
    const res = await fetch(
      `/api/travel-insurance/full-quote/${encodeURIComponent(proposalNo)}/otp/verify`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        cache: 'no-store',
      }
    )
    const body = await res.json().catch(() => null)

    if (res.ok) return { status: 'verified' }

    if (res.status === 429) {
      return {
        status: 'locked',
        message:
          body?.message ||
          'Too many attempts. Please try again later or contact support.',
      }
    }

    if (res.status === 422) {
      const fieldMessage: string | undefined = body?.errors?.code?.[0]
      if (fieldMessage) return { status: 'invalid_format', message: fieldMessage }
      return {
        status: 'invalid',
        message: body?.message || 'The code is invalid or has expired.',
      }
    }

    return {
      status: 'error',
      message: body?.message || 'We could not verify the code. Please try again.',
    }
  } catch {
    return {
      status: 'error',
      message: 'We could not reach the server. Check your connection and try again.',
    }
  }
}

const EXPIRED_MESSAGE = 'This proposal has expired. Please generate a new quote.'

type Raw = Record<string, any>

const nameOf = (v: unknown): string =>
  typeof v === 'string' ? v : ((v as Raw)?.name || (v as Raw)?.code || '')
const codeOf = (v: unknown): string =>
  v && typeof v === 'object' ? ((v as Raw).code || '') : ''

const toValidDate = (v: unknown): Date | null => {
  if (!v) return null
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v
  if (typeof v === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.trim())
    if (match) {
      const [, y, m, d] = match
      const date = new Date(Number(y), Number(m) - 1, Number(d))
      return isNaN(date.getTime()) ? null : date
    }
  }
  const d = new Date(v as string)
  return !isNaN(d.getTime()) ? d : null
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
  // With the resume-token switch on, a 404 is either an unknown proposal or a
  // missing/expired token — the caller must fall back to email verification.
  if (status === 404 || state === 'not_found') return { state: 'needs_verification', ...base }
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
 *       needs_verification (404) | invalid | unavailable
 *  2. If resumable, the response's `data.quote` carries everything needed to
 *     refill the flow (insurer/product/plan, premium, trip, traveller names
 *     and birth dates, selected add-ons, expires_at).  With a valid resume
 *     token it also carries each traveller's contact details and a *masked*
 *     ID number; without one those fields stay empty ("Not provided").
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

  // 404 → needs verification.  With the resume-token switch on this covers
  // both an unknown proposal and a missing/wrong/expired token, so the only
  // safe next step is the email-code screen.
  if (checkResponse.status === 404 || state === 'not_found') {
    return {
      status: 'needs_verification',
      message:
        checkBody?.message ||
        'Verify your identity with a code sent to the main traveller’s email.',
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

// ── Resume payload → form field normalisation ─────────────────────────────

const asString = (v: unknown): string => (typeof v === 'string' ? v : '')

const normalizeGender = (v: unknown): PersonalInfoFormData['gender'] => {
  const s = asString(v).trim().toLowerCase()
  return s === 'female' || s === 'f' ? 'F' : 'M'
}

const VALID_SUFFIXES = [
  'JR',
  'SR',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'ETAL.',
  'No Suffix',
] as const

const normalizeSuffix = (v: unknown): PersonalInfoFormData['suffix'] => {
  const s = asString(v).trim()
  if (!s || s.toLowerCase() === 'no suffix' || s.toLowerCase() === 'none') {
    return 'No Suffix'
  }
  const upper = s.toUpperCase()
  if (upper === 'JR.' || upper === 'JR') return 'JR'
  if (upper === 'SR.' || upper === 'SR') return 'SR'
  const matched = VALID_SUFFIXES.find((val) => val.toUpperCase() === upper)
  return matched ?? 'No Suffix'
}

const ID_TYPE_ALIASES: Record<string, PhilippineIdTypeEnum> = {
  passport: 'PAS',
  'voter id': 'VOT',
  "voter's id": 'VOT',
  voter: 'VOT',
  'postal id': 'POS',
  postal: 'POS',
  sss: 'SSS',
  umid: 'UMI',
  'unified multi-purpose id': 'UMI',
  tin: 'TIN',
  'tax identification number': 'TIN',
  "driver's license": 'DRI',
  "driver's licence": 'DRI',
  'drivers license': 'DRI',
  'drivers licence': 'DRI',
  prc: 'PRC',
  philhealth: 'PID',
  'e-philsys': 'EPH',
  philsys: 'PHI',
  'barangay id': 'BID',
  'senior citizen id': 'SCC',
  'senior citizen': 'SCC',
  other: 'OTH',
}

/**
 * OI echoes `id_type` exactly as the front end sent it at full-quote.  That is
 * usually the 3-letter code (e.g. `PAS`), but accept a human label too.
 */
const normalizeIdType = (v: unknown): PersonalInfoFormData['idType'] => {
  const raw = asString(v).trim()
  if (!raw) return 'PAS'
  const upper = raw.toUpperCase()
  if (Object.prototype.hasOwnProperty.call(PH_ID_TYPES, upper)) {
    return upper as PersonalInfoFormData['idType']
  }
  return (ID_TYPE_ALIASES[raw.toLowerCase()] ?? 'PAS') as PersonalInfoFormData['idType']
}

/** `+639171234567` / `09171234567` / `9171234567` → `9171234567`. */
const normalizeMobile = (v: unknown): string => {
  const digits = asString(v).replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('63') && digits.length > 10) return digits.slice(2, 12)
  if (digits.startsWith('0') && digits.length > 10) return digits.slice(1, 11)
  return digits
}

const normalizeAddress = (v: unknown): PersonalInfoFormData['address'] => {
  const a = v && typeof v === 'object' ? (v as Raw) : {}
  return {
    province: asString(a.province),
    city: asString(a.city),
    zipCode: asString(a.postal_code ?? a.zip_code ?? a.zipCode),
    line1: asString(a.line1 ?? a.address_line1 ?? a.street),
    line2: asString(a.line2 ?? a.address_line2),
  }
}

/** The backend masks `id_number` (e.g. `*****567A`) — never resubmit it. */
const isMaskedId = (v: string) => /[*•]/.test(v)

// ── Coverage normalization (mirrors compare-quote/route.ts) ──────────────────

/** IGW coverage limit shape (also used in resume payload.coverages[]). */
interface IgwCoverageLimit {
  type: string | null
  amount: string | null
  sub_limit_amount?: string | null
  sub_limit_per?: string | null
  per_unit?: string | null
  per_unit_size?: number | null
  max_units?: number | null
  waiting_period_hours?: number | null
  notes: string | null
}

interface NormalizedBenefitLimit {
  Kind: 'amount' | 'label' | 'text' | 'none'
  Amount: string | null
  Label: string | null
  Qualifier: string | null
  PerUnit: string | null
  MaxUnits: number | null
  SubLimitAmount: string | null
  SubLimitPer: string | null
}

const LIMIT_LABEL_MAX_LEN = 20

/**
 * Normalizes an IGW coverage limit — identical logic to compare-quote/route.ts
 * so resume-loaded plans produce the same InsuranceBenefit shape.
 */
function normalizeIgwLimit(limit: IgwCoverageLimit): {
  limit: NormalizedBenefitLimit
  silimit: string | undefined
  defaultLimitDesc: string | undefined
  limitModeDesc: string | undefined
} {
  const make = (
    kind: NormalizedBenefitLimit['Kind'],
    amount: string | null,
    label: string | null,
    qualifier: string | null
  ) => ({
    limit: {
      Kind: kind,
      Amount: amount,
      Label: label,
      Qualifier: qualifier,
      PerUnit: limit.per_unit ?? null,
      MaxUnits: limit.max_units ?? null,
      SubLimitAmount: limit.sub_limit_amount ?? null,
      SubLimitPer: limit.sub_limit_per ?? null,
    },
    silimit: kind === 'amount' ? (amount ?? undefined) : undefined,
    defaultLimitDesc: kind === 'amount' ? '0' : (label ?? undefined),
    limitModeDesc: qualifier ?? undefined,
  })

  switch (limit.type) {
    case 'amount':
      return make('amount', limit.amount, null, limit.notes)
    case 'included':
      return make('label', null, 'Included', limit.notes)
    case 'unlimited':
      return make('label', null, 'Unlimited', limit.notes)
  }

  const notes = limit.notes?.trim()
  if (!notes || notes === '0') return make('none', null, null, null)
  return make(notes.length <= LIMIT_LABEL_MAX_LEN ? 'label' : 'text', null, notes, null)
}

/** True when a coverage entry belongs to a purchasable add-on. */
const isIgwAddon = (c: Raw) => c.addon_code != null || c.is_optional === true

/**
 * Extract the `coverages` array from the resume payload.
 *
 * Priority order:
 *   1. payload.coverages / quote.coverages  — new backend format (preferred)
 *   2. insurer_quote.PolicyLobList paths     — legacy IGW shape (fallback only)
 */
function extractCoveragesFromPayload(payload: Raw, quote: Raw): Raw[] {
  // ── 1. New structured coverages array (preferred) ──────────────────────────
  for (const arr of [payload.coverages, quote.coverages]) {
    if (Array.isArray(arr) && arr.length > 0) return arr
  }

  // ── 2. Legacy IGW insurer_quote paths (fallback) ───────────────────────────
  const legacyCandidates = [
    payload.insurer_quote,
    quote.insurer_quote,
    payload.insurerQuote,
    quote.insurerQuote,
    payload.other_details?.insurer_quote,
    quote.other_details?.insurer_quote,
    payload.other_details,
    quote.other_details,
  ]

  for (const candidate of legacyCandidates) {
    if (!candidate) continue
    let obj: any = candidate
    if (typeof obj === 'string') {
      try { obj = JSON.parse(obj) } catch { continue }
    }
    if (!obj || typeof obj !== 'object') continue

    if (Array.isArray(obj) && obj.length > 0) return obj

    const direct =
      obj.PolicyCoverageList ??
      obj.policy_coverage_list ??
      obj.policyCoverageList ??
      obj.coverages ??
      obj.Coverages
    if (Array.isArray(direct) && direct.length > 0) return direct

    const lobs = obj.PolicyLobList ?? obj.policy_lob_list ?? obj.policyLobList
    if (Array.isArray(lobs)) {
      const collected: Raw[] = []
      for (const lob of lobs) {
        if (!lob || typeof lob !== 'object') continue
        const lobCovs =
          lob.PolicyCoverageList ?? lob.policy_coverage_list ?? lob.policyCoverageList ?? lob.coverages
        if (Array.isArray(lobCovs) && lobCovs.length > 0) collected.push(...lobCovs)
        const risks = lob.PolicyRiskList ?? lob.policy_risk_list ?? lob.policyRiskList ?? lob.risks
        if (Array.isArray(risks)) {
          for (const risk of risks) {
            if (!risk || typeof risk !== 'object') continue
            const riskCovs =
              risk.PolicyCoverageList ?? risk.policy_coverage_list ?? risk.policyCoverageList ?? risk.coverages
            if (Array.isArray(riskCovs) && riskCovs.length > 0) collected.push(...riskCovs)
          }
        }
      }
      if (collected.length > 0) return collected
    }
  }

  return []
}

/**
 * hydrateFromQuotePayload
 *
 * Fills the travel store + full-quote store from a quote-shaped payload.
 * Accepts either the resumption shape ({ data: { quote: {...} } }) or the
 * issue-quote shape (same fields at the top level of `data`), normalised via
 * `payload.quote ?? payload`.  Returns false when the payload can't be
 * mapped into TravelPolicyData.
 *
 * Returns the hydrated travel details on success so callers can use them
 * to enrich the plan with benefits from a compare-quote.
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
  //
  // The backend can return travellers at two locations:
  //   1. payload.quote.travellers — always present (short form without token,
  //      or full form with token when both locations are populated identically)
  //   2. payload.travellers — present when the backend puts full-detail
  //      travellers at the top-level `data` object instead of inside `quote`
  //
  // Prefer whichever array has richer data (i.e. has an email on the first
  // traveller).  Fall back to the quote-level array.
  const quoteTravellers: Raw[] = Array.isArray(quote.travellers) ? quote.travellers : []
  const payloadTravellers: Raw[] = Array.isArray(payload.travellers) ? payload.travellers : []
  const hasContactData = (arr: Raw[]) =>
    arr.length > 0 && (arr[0]?.email != null || arr[0]?.mobile != null)
  const rawTravellers: Raw[] = [
    ...((hasContactData(payloadTravellers) && !hasContactData(quoteTravellers))
      ? payloadTravellers
      : quoteTravellers),
  ]
  rawTravellers.sort(
    (a, b) => Number(b?.is_principal_applicant === true) - Number(a?.is_principal_applicant === true)
  )

  const travellers: PersonalInfoFormData[] = rawTravellers.map((t, i) => {
    const idNumber = asString(t.id_number)
    return {
      isPrincipalApplicant: i === 0,
      firstName: asString(t.first_name),
      middleName: asString(t.middle_name),
      lastName: asString(t.last_name),
      suffix: normalizeSuffix(t.suffix),
      gender: normalizeGender(t.gender),
      email: asString(t.email),
      mobileNumber: normalizeMobile(t.mobile),
      idType: normalizeIdType(t.id_type),
      idNumber,
      idNumberMasked: isMaskedId(idNumber),
      idFrontUploaded: false,
      idBackUploaded: false,
      address: normalizeAddress(t.address),
      dateOfBirth: toValidDate(t.date_of_birth) ?? new Date(),
      isCovidVaccinated: false,
      // The quote could only have been created with consent given.
      is_data_sharing_consent: true,
      hasBeneficiary: t.has_beneficiary === true,
      beneficiary: t.beneficiary
        ? {
            firstName: asString(t.beneficiary.first_name),
            middleName: asString(t.beneficiary.middle_name),
            lastName: asString(t.beneficiary.last_name),
            dateOfBirth: toValidDate(t.beneficiary.date_of_birth),
            relationship: asString(t.beneficiary.relationship),
          }
        : { firstName: '', middleName: '', lastName: '', dateOfBirth: null, relationship: '' },
    }
  })

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

  const rawCoverages = extractCoveragesFromPayload(payload, quote)

  // ── Detect whether rawCoverages are the new IGW shape ({ category, name, addon_code, limit })
  //    or the legacy IGW shape ({ CoverageName, ProductElementCode, GrossPremium, ... }).
  //    New shape: at least one entry has a `limit` object with a `type` key.
  const isNewShape = rawCoverages.some(
    (c) => c.limit !== undefined && c.limit !== null && typeof c.limit === 'object'
  )

  let mainBenefits: InsuranceBenefit[]
  let addonBenefits: InsuranceBenefit[]

  if (isNewShape) {
    // ── New structured coverages[] from backend ─────────────────────────────
    // Mirror exactly the compare-quote/route.ts mapping so the plan object is
    // identical whether the user came via /quote or via resume.

    mainBenefits = rawCoverages
      .filter((c) => !isIgwAddon(c))
      .map((c, idx) => {
        const { limit, silimit, defaultLimitDesc, limitModeDesc } = normalizeIgwLimit(c.limit ?? {
          type: null, amount: null, notes: null,
        })
        return {
          BenefitCode: `${planCode}-${idx}`,
          BenefitDesc: String(c.name ?? 'Coverage'),
          BenefitType: 'MAIN',
          CoverageName: String(c.category ?? 'Benefit overview'),
          SubCoverageName: String(c.name ?? 'Coverage'),
          DisplaySeqNo: String(idx + 1),
          ParentBenefit: null,
          Silimit: silimit,
          DefaultLimitDesc: defaultLimitDesc,
          Limit: limit,
          LimitModeDesc: limitModeDesc,
          IsMainBenefit: 'Y',
          IsApplicable: 'Y',
        } as unknown as InsuranceBenefit
      })

    // Group addon coverages by addon_code (same as compare-quote/route.ts)
    const addonGroups = new Map<string, { category: string; coverages: Raw[] }>()
    rawCoverages.filter(isIgwAddon).forEach((c, idx) => {
      const key = c.addon_code ?? `${planCode}-addon-${idx}`
      if (!addonGroups.has(key)) addonGroups.set(key, { category: c.category ?? 'Add-ons', coverages: [] })
      addonGroups.get(key)!.coverages.push(c)
    })

    addonBenefits = Array.from(addonGroups.entries()).flatMap(([code, group]) => {
      const parent: InsuranceBenefit = {
        BenefitCode: code,
        BenefitDesc: group.category,
        BenefitType: 'ADDON',
        CoverageName: group.category,
        SubCoverageName: group.category,
        DisplaySeqNo: '0',
        ParentBenefit: null,
        IsMainBenefit: 'N',
        IsApplicable: 'Y',
      } as unknown as InsuranceBenefit

      const children: InsuranceBenefit[] = group.coverages.map((c, idx) => {
        const { limit, silimit, defaultLimitDesc, limitModeDesc } = normalizeIgwLimit(c.limit ?? {
          type: null, amount: null, notes: null,
        })
        return {
          BenefitCode: `${code}-${idx}`,
          BenefitDesc: String(c.name ?? 'Coverage'),
          BenefitType: 'ADDON',
          CoverageName: String(c.category ?? group.category),
          SubCoverageName: String(c.name ?? 'Coverage'),
          DisplaySeqNo: String(idx + 1),
          ParentBenefit: code,
          Silimit: silimit,
          DefaultLimitDesc: defaultLimitDesc,
          Limit: limit,
          LimitModeDesc: limitModeDesc,
          IsMainBenefit: 'N',
          IsApplicable: 'Y',
        } as unknown as InsuranceBenefit
      })

      return [parent, ...children]
    })
  } else {
    // ── Legacy IGW shape (PolicyCoverageList entries with GrossPremium etc.) ──
    // Map as before — all go to MainBenefits, no addon splitting possible.
    mainBenefits = rawCoverages.map((c, idx) => {
      const desc = c.CoverageName ?? c.coverage_name ?? c.BenefitDesc ?? c.name ?? 'Coverage'
      const code = c.ProductElementCode ?? c.product_element_code ?? c.BenefitCode ?? `${planCode}-${idx}`
      const rawAmt = c.GrossPremium ?? c.gross_premium ?? c.SumInsured ?? c.sum_insured ?? c.LimitAmount ?? c.amount
      const amtStr = rawAmt != null ? String(rawAmt) : null
      return {
        BenefitCode: String(code),
        BenefitDesc: String(desc),
        BenefitType: 'MAIN',
        CoverageName: String(c.Category ?? c.CoverageName ?? 'Benefit overview'),
        SubCoverageName: String(desc),
        DisplaySeqNo: String(idx + 1),
        ParentBenefit: null,
        Silimit: amtStr ?? undefined,
        DefaultLimitDesc: amtStr != null ? '0' : 'Included',
        Limit: {
          Kind: amtStr != null ? 'amount' : 'label',
          Amount: amtStr,
          Label: amtStr != null ? null : 'Included',
          Qualifier: null,
          PerUnit: null,
          MaxUnits: null,
          SubLimitAmount: null,
          SubLimitPer: null,
        },
        IsMainBenefit: 'Y',
        IsApplicable: 'Y',
      } as unknown as InsuranceBenefit
    })
    addonBenefits = []
  }

  const insurerQuote: Raw | undefined = payload.insurer_quote ?? quote.insurer_quote
  // Prefer plan.sum_insured from the top-level plan object (new backend shape)
  const sumInsured =
    (quote.plan?.sum_insured ?? quote.plan?.sumInsured) != null
      ? String(quote.plan.sum_insured ?? quote.plan.sumInsured)
      : insurerQuote?.SumInsured != null
      ? String(insurerQuote.SumInsured)
      : null

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
    MainBenefits: mainBenefits,
    AddonBenefits: addonBenefits,
    LGTAmount: 0,
    DiscountAmount: null,
    PremiumTaxAmt: 0,
    StampDuty: 0,
    SumInsured: sumInsured,
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
    expires_at: payload.expires_at ?? quote.expires_at ?? '',
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
    // Pass the backend's original created_at and expires_at so the review
    // page shows the correct proposal date and expiry countdown instead of
    // the current wall-clock time.
    policyData = igwFullQuoteToPolicyData(
      igwData,
      {
        travelDetails: hydratedTravelDetails,
        coverageOption,
        travelersInfo: travellers,
      },
      {
        proposalDate: payload.created_at ?? quote.created_at ?? undefined,
        expiresAt: payload.expires_at ?? quote.expires_at ?? undefined,
      }
    )
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
