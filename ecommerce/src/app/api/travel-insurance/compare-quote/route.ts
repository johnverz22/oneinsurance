import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

// IGW response shapes (v2 — coverages with per-benefit limit objects)

interface IgwCoverageLimit {
  type: 'amount' | 'included' | 'unlimited'
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
  is_optional: boolean
  addon_code: string | null
  limit: IgwCoverageLimit
}

interface IgwPlanItem {
  insurer: { name: string; logo_url: string | null }
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
 * Maps IGW insurer names to the internal carrier codes used in COMPANIES constant.
 * Add entries here as new insurers are onboarded via IGW.
 */
const INSURER_NAME_TO_CARRIER_CODE: Record<string, string> = {
  'malayan insurance': 'MALAYAN',
  'oona insurance': 'OONAPH',
  'oona': 'OONAPH',
  'pacific cross': 'PACIFIC',
  'standard insurance': 'STANDARD',
  'pioneer insurance': 'PIONEER',
  'paramount': 'PARAMOUNT',
  'axa': 'AXAPH',
  'philcare': 'PHILCARE',
  'maxicare': 'MAXICARE',
}

function insurerNameToCarrierCode(insurerName: string): string {
  const key = insurerName.toLowerCase()
  // Try exact match first, then prefix match
  if (INSURER_NAME_TO_CARRIER_CODE[key]) return INSURER_NAME_TO_CARRIER_CODE[key]
  for (const [pattern, code] of Object.entries(INSURER_NAME_TO_CARRIER_CODE)) {
    if (key.includes(pattern)) return code
  }
  // Fallback: uppercase first word of insurer name
  return insurerName.split(' ')[0].toUpperCase()
}

/**
 * Derives a human-readable limit string from a coverage limit object.
 *
 * - type "amount"    → formatted numeric string, e.g. "1,000,000.00"
 * - type "included"  → "Included"
 * - type "unlimited" → "Unlimited"
 *
 * Returns null when there is no meaningful display value.
 */
function deriveLimitDisplay(limit: IgwCoverageLimit): {
  silimit: string | undefined
  defaultLimitDesc: string | undefined
} {
  switch (limit.type) {
    case 'amount':
      return {
        silimit: limit.amount ?? undefined,
        defaultLimitDesc: undefined,
      }
    case 'included':
      return {
        silimit: undefined,
        defaultLimitDesc: 'Included',
      }
    case 'unlimited':
      return {
        silimit: undefined,
        defaultLimitDesc: 'Unlimited',
      }
    default:
      return { silimit: undefined, defaultLimitDesc: undefined }
  }
}

/**
 * Maps the IGW response into the internal TravelInsuranceApiResponse shape
 * expected by the store and coverage-options-form.
 *
 * Groups plans by insurer so each entry in data[] has a CarrierCode and Plans[].
 * Uses the new coverages[].limit structure for accurate per-benefit amounts.
 */
function mapIgwResponseToInternal(igw: IgwCompareQuoteResponse) {
  const grouped = new Map<string, { carrierCode: string; items: IgwPlanItem[] }>()

  for (const item of igw.data) {
    const carrierCode = insurerNameToCarrierCode(item.insurer.name)
    if (!grouped.has(carrierCode)) {
      grouped.set(carrierCode, { carrierCode, items: [] })
    }
    grouped.get(carrierCode)!.items.push(item)
  }

  const data = Array.from(grouped.values()).map(({ carrierCode, items }) => ({
    CarrierCode: carrierCode,
    ClientRequestId: '',
    ProductCode: items[0].product.code,
    ProductVersion: '1.0',
    Plans: items.map((item) => {
      const mapCoverage = (c: IgwCoverage, idx: number) => {
        const { silimit, defaultLimitDesc } = deriveLimitDisplay(c.limit)
        return {
          BenefitCode: c.addon_code ?? `${item.plan.code}-${idx}`,
          BenefitDesc: c.name,
          BenefitType: c.is_optional ? 'ADDON' : 'MAIN',
          CoverageName: c.category,
          SubCoverageName: c.name,
          DisplaySeqNo: String(idx + 1),
          Silimit: silimit,
          DefaultLimitDesc: defaultLimitDesc,
          // notes surface as LimitModeDesc (e.g. "Per day, up to 7 days.")
          LimitModeDesc: c.limit.notes ?? undefined,
          IsMainBenefit: c.is_optional ? 'N' : 'Y',
          IsApplicable: 'Y',
        }
      }

      const mainBenefits = item.coverages
        .filter((c) => !c.is_optional)
        .map((c, idx) => mapCoverage(c, idx))

      const addonBenefits = item.coverages
        .filter((c) => c.is_optional)
        .map((c, idx) => mapCoverage(c, idx))

      return {
        CarrierPlanCode: item.plan.code,
        CarrierPlanDesc: item.plan.name,
        CarrierProductCode: item.product.code,
        CarrierProductName: item.product.name,
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
