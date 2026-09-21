import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

// IGW response shapes
interface IgwBenefit {
  category: string
  name: string
}

interface IgwPlanItem {
  insurer: { name: string; logo_url: string }
  product: { code: string; name: string }
  plan: { code: string; name: string; sum_insured: string }
  premium: { amount: string; currency: string }
  benefits: IgwBenefit[]
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
 * Maps the flat IGW response into the internal TravelInsuranceApiResponse shape
 * expected by the store and coverage-options-form.
 *
 * Groups plans by insurer so each entry in data[] has a CarrierCode and Plans[].
 */
function mapIgwResponseToInternal(igw: IgwCompareQuoteResponse) {
  // Group plans by insurer (mapped to internal carrier code)
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
      // Split benefits into main and addon — IGW doesn't distinguish, so treat all as MainBenefits
      const mainBenefits = item.benefits.map((b, idx) => ({
        BenefitCode: `${item.plan.code}-${idx}`,
        BenefitDesc: b.name,
        BenefitType: 'MAIN',
        CoverageName: b.category,
        SubCoverageName: b.name,
        DisplaySeqNo: String(idx + 1),
        Silimit: item.plan.sum_insured,
        IsMainBenefit: 'Y',
        IsApplicable: 'Y',
      }))

      return {
        CarrierPlanCode: item.plan.code,
        CarrierPlanDesc: item.plan.name,
        CarrierProductCode: item.product.code,
        CarrierProductName: item.product.name,
        DuePremium: item.premium.amount,
        GrossPremium: item.premium.amount,
        BeforeVatPremium: item.premium.amount,
        LGTAmount: '0',
        VatAmount: null,
        TaxAmount: null,
        PremiumTaxAmt: null,
        StampDuty: null,
        DiscountAmount: null,
        SumInsured: item.plan.sum_insured,
        MainBenefits: mainBenefits,
        AddonBenefits: [],
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
