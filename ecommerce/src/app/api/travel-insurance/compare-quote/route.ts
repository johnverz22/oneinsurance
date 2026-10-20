import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import { insurerNameToCarrierCode } from '@/utils/insurer-codes'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

// IGW response shapes (v2 — coverages with per-benefit limit objects)

interface IgwCoverageLimit {
  // Docs say 'amount' | 'included' | 'unlimited', but unstructured insurers
  // (e.g. OONA) send null and put the real limit text in `notes`.
  type: string | null
  amount: string | null
  sub_limit_amount: string | null
  sub_limit_per: string | null
  per_unit: string | null
  per_unit_size: number | null
  max_units: number | null
  waiting_period_hours: number | null
  notes: string | null
}

interface IgwCoverage {
  category: string
  name: string
  // The docs describe `is_optional`, but live responses don't send it —
  // optionality is actually signaled by `addon_code` being non-null
  // (perfectly correlated with `is_included: false` where present).
  // Keep is_optional as a fallback in case an insurer does send it.
  is_optional?: boolean
  is_included?: boolean
  addon_code: string | null
  // OONA-only: the carrier's own code for the addon group (not forwarded anywhere yet).
  insurer_addon_code?: string | null
  limit: IgwCoverageLimit
}

/** True when a coverage is part of a purchasable add-on rather than the base plan. */
function isAddonCoverage(c: IgwCoverage): boolean {
  return c.addon_code != null || c.is_optional === true
}

interface IgwPlanItem {
  insurer: { name: string; logo_url: string | null; code?: string }
  product: { code: string; name: string }
  plan: { code: string; name: string; sum_insured: string }
  zone: { code: string; name: string }
  premium: { amount: string; currency: string }
  coverages: IgwCoverage[]
}

interface IgwCompareQuoteResponse {
  success: boolean
  message: string
  data: IgwPlanItem[]
}

/**
 * IGW insurer codes that support the full-quote endpoint.
 *
 * Plans from insurers NOT in this set are stripped from the compare-quote
 * response before it reaches the browser — users can only select plans that
 * will succeed at checkout.
 *
 * Add a code here once the backend team confirms full-quote support for that
 * insurer (test with POST /api/v1/travel/full-quote and verify a 201 back).
 */
const FULL_QUOTE_SUPPORTED_INSURERS = new Set(['MIC', 'OONA'])

/**
 * Normalized per-benefit limit. Survives insurer differences so display code
 * doesn't re-parse strings. See BenefitLimitSchema in types/plan.ts.
 */
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

/** Free-text limits longer than this render as wrapped text, not a badge chip. */
const LIMIT_LABEL_MAX_LEN = 20

/**
 * Normalizes an IGW coverage limit into:
 *  - `limit`          — the structured Limit object consumed by the plan UI
 *  - legacy fields    — old InsureMo convention used by review pages/PDFs:
 *                       Silimit = numeric amount; DefaultLimitDesc = label text
 *                       ('0' = "use Silimit"); LimitModeDesc = qualifier note
 *
 * Only `type:'amount'` produces a numeric amount — notes are never parsed
 * into Silimit. For insurers (e.g. OONA) that send type:null with free text
 * in `notes` ("Up to 1,000,000", "Actual Cost"), the text is shown as-is:
 * short strings become badge labels, longer ones wrapped text; empty/"0"
 * means no cover.
 */
function normalizeLimit(limit: IgwCoverageLimit): {
  limit: NormalizedBenefitLimit
  silimit: string | undefined
  defaultLimitDesc: string | undefined
  limitModeDesc: string | undefined
} {
  const make = (
    kind: NormalizedBenefitLimit['Kind'],
    amount: string | null,
    label: string | null,
    qualifier: string | null,
    extra?: Partial<NormalizedBenefitLimit>
  ) => ({
    limit: {
      Kind: kind,
      Amount: amount,
      Label: label,
      Qualifier: qualifier,
      PerUnit: limit.per_unit,
      MaxUnits: limit.max_units,
      SubLimitAmount: limit.sub_limit_amount,
      SubLimitPer: limit.sub_limit_per,
      ...extra,
    },
    silimit: kind === 'amount' ? (amount ?? undefined) : undefined,
    // '0' is the old sentinel meaning "render the Silimit amount"
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

  // ── type null/other: no structured amount — fall back to notes text ──────
  const notes = limit.notes?.trim()

  // empty or "0" sentinel → no cover
  if (!notes || notes === '0') return make('none', null, null, null)

  // free text — short strings become badge labels, longer ones plain text
  return make(notes.length <= LIMIT_LABEL_MAX_LEN ? 'label' : 'text', null, notes, null)
}

/**
 * Maps the IGW response into the internal TravelInsuranceApiResponse shape
 * expected by the store and coverage-options-form.
 *
 * Groups plans by insurer so each entry in data[] has a CarrierCode and Plans[].
 * Uses the new coverages[].limit structure for accurate per-benefit amounts.
 */
function mapIgwResponseToInternal(igw: IgwCompareQuoteResponse) {
  const grouped = new Map<
    string,
    { carrierCode: string; insurerCode?: string; items: IgwPlanItem[] }
  >()

  for (const item of igw.data) {
    // Skip insurers that don't support full-quote yet so users never reach
    // a plan they can't purchase.  Add to FULL_QUOTE_SUPPORTED_INSURERS once
    // the backend confirms support.
    if (item.insurer.code && !FULL_QUOTE_SUPPORTED_INSURERS.has(item.insurer.code)) {
      continue
    }

    const carrierCode = insurerNameToCarrierCode(item.insurer.name)
    if (!grouped.has(carrierCode)) {
      grouped.set(carrierCode, {
        carrierCode,
        insurerCode: item.insurer.code,
        items: [],
      })
    }
    grouped.get(carrierCode)!.items.push(item)
  }

  const data = Array.from(grouped.values()).map(({ carrierCode, insurerCode, items }) => ({
    CarrierCode: carrierCode,
    ClientRequestId: '',
    InsurerCode: insurerCode,
    ProductCode: items[0].product.code,
    ProductVersion: '1.0',
    Plans: items.map((item) => {
      const mainBenefits = item.coverages
        .filter((c) => !isAddonCoverage(c))
        .map((c, idx) => {
          const { limit, silimit, defaultLimitDesc, limitModeDesc } = normalizeLimit(c.limit)
          return {
            BenefitCode: `${item.plan.code}-${idx}`,
            BenefitDesc: c.name,
            BenefitType: 'MAIN',
            CoverageName: c.category,
            SubCoverageName: c.name,
            DisplaySeqNo: String(idx + 1),
            ParentBenefit: null,
            Silimit: silimit,
            DefaultLimitDesc: defaultLimitDesc,
            // normalized limit for the plan UI; LimitModeDesc carries the qualifier
            // note for legacy renderers ("Per day, up to 7 days.", "subject to limit of…")
            Limit: limit,
            LimitModeDesc: limitModeDesc,
            IsMainBenefit: 'Y',
            IsApplicable: 'Y',
          }
        })

      // Group addon coverages by `addon_code` — that's the purchasable unit
      // (e.g. "cruise" bundles 7 coverages under one toggle). Coverages that
      // are optional but carry no addon_code (is_optional fallback) each get
      // their own single-coverage group so they still render as a selectable
      // unit. BenefitCode on the *parent* row is the group key — that's what
      // selectedAddonBenefits stores and what UI toggles act on.
      const addonGroups = new Map<string, { category: string; coverages: IgwCoverage[] }>()
      item.coverages.filter(isAddonCoverage).forEach((c, idx) => {
        const key = c.addon_code ?? `${item.plan.code}-addon-${idx}`
        if (!addonGroups.has(key)) addonGroups.set(key, { category: c.category, coverages: [] })
        addonGroups.get(key)!.coverages.push(c)
      })

      const addonBenefits = Array.from(addonGroups.entries()).flatMap(([code, group]) => {
        const parent = {
          BenefitCode: code,
          BenefitDesc: group.category,
          BenefitType: 'ADDON',
          CoverageName: group.category,
          SubCoverageName: group.category,
          DisplaySeqNo: '0',
          ParentBenefit: null,
          IsMainBenefit: 'N',
          IsApplicable: 'Y',
        }
        const children = group.coverages.map((c, idx) => {
          const { limit, silimit, defaultLimitDesc, limitModeDesc } = normalizeLimit(c.limit)
          return {
            BenefitCode: `${code}-${idx}`,
            BenefitDesc: c.name,
            BenefitType: 'ADDON',
            CoverageName: c.category,
            SubCoverageName: c.name,
            DisplaySeqNo: String(idx + 1),
            ParentBenefit: code,
            Silimit: silimit,
            DefaultLimitDesc: defaultLimitDesc,
            Limit: limit,
            LimitModeDesc: limitModeDesc,
            IsMainBenefit: 'N',
            IsApplicable: 'Y',
          }
        })
        return [parent, ...children]
      })

      return {
        CarrierPlanCode: item.plan.code,
        CarrierPlanDesc: item.plan.name,
        CarrierProductCode: item.product.code,
        CarrierProductName: item.product.name,
        InsurerCode: item.insurer.code,
        DuePremium: item.premium.amount,
        GrossPremium: item.premium.amount,
        BeforeVatPremium: item.premium.amount,
        Currency: item.premium.currency,
        Zone: item.zone,
        LGTAmount: '0',
        VatAmount: null,
        TaxAmount: null,
        PremiumTaxAmt: null,
        StampDuty: null,
        DiscountAmount: null,
        SumInsured: item.plan.sum_insured,
        LogoUrl: item.insurer.logo_url ?? undefined,
        MainBenefits: mainBenefits,
        AddonBenefits: addonBenefits,
      }
    }),
  }))

  return {
    success: igw.success,
    message: igw.message,
    data,
  }
}

// GET ?id={ClientRequestId} — polls the async compare-quote result.
// Returns 202 while still pending (browser should keep polling / waiting for WS event),
// or the mapped internal plan list on 200.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id query parameter is required' },
        { status: 400 }
      )
    }

    const url = `${process.env.BASE_URL}/travel/compare-quote/${id}`

    const response = await axios.get<IgwCompareQuoteResponse>(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${process.env.BACKEND_TOKEN}`,
      },
    })

    // Backend returns 202 while insurers are still being queried
    if (response.status === 202) {
      return NextResponse.json(response.data, { status: 202 })
    }

    const mapped = mapIgwResponseToInternal(response.data)
    return NextResponse.json(mapped, { status: 200 })
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

// POST — legacy synchronous compare-quote (old endpoint, holds connection ~25s).
// Kept for backward compatibility; prefer the init → WebSocket → GET flow.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body) {
      return NextResponse.json(
        { error: 'Request body is required' },
        { status: 400 }
      )
    }

    const url = `${process.env.BASE_URL}/travel/compare-quote`

    const response = await axios.post<IgwCompareQuoteResponse>(url, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.BACKEND_TOKEN}`,
      },
      timeout: 60000,
    })

    const mapped = mapIgwResponseToInternal(response.data)

    return NextResponse.json(mapped, { status: 200 })
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
