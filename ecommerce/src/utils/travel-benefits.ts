import { InsuranceBenefit, InsurancePlan } from '@/types/plan'

export function formatBenefitLimit(benefit?: InsuranceBenefit): string {
  if (!benefit || !benefit.Limit) return '—'
  const limit = benefit.Limit
  if (limit.Kind === 'none') return '—'
  if (limit.Kind === 'label' && limit.Label) return limit.Label
  if (limit.Kind === 'text' && limit.Label) return limit.Label
  if (limit.Amount) {
    const amount = Number(limit.Amount)
    if (!isNaN(amount)) {
      return `PHP ${amount.toLocaleString('en-PH')}`
    }
  }
  if (limit.Label) return limit.Label
  return '—'
}

export function findBenefit(
  plan: InsurancePlan,
  keywords: string[]
): InsuranceBenefit | undefined {
  return plan.MainBenefits?.find((b) =>
    keywords.some((kw) => b.BenefitDesc.toLowerCase().includes(kw.toLowerCase()))
  )
}

export function getKeyBenefits(plan: InsurancePlan) {
  return {
    medical: findBenefit(plan, ['medical', 'hospitalization', 'hospital']),
    evacuation: findBenefit(plan, ['evacuation', 'repatriation', 'medical evacuation']),
    baggage: findBenefit(plan, ['baggage', 'luggage', 'bag loss']),
    flightDelay: findBenefit(plan, ['flight delay', 'travel delay', 'delay']),
  }
}

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const num = typeof value === 'string' ? Number(value) : value
  if (isNaN(num)) return '—'
  return `PHP ${num.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export function normalizeStaticPlan(plan: InsurancePlan): InsurancePlan {
  const normalize = (b: InsuranceBenefit): InsuranceBenefit => {
    if (b.Limit) return b
    const desc = b.DefaultLimitDesc && b.DefaultLimitDesc !== '0' ? b.DefaultLimitDesc : null
    const base = { Qualifier: null, PerUnit: null, MaxUnits: null, SubLimitAmount: null, SubLimitPer: null }
    if (desc) return { ...b, Limit: { Kind: 'label', Amount: null, Label: desc, ...base } }
    if (b.Silimit && b.Silimit !== '0')
      return { ...b, Limit: { Kind: 'amount', Amount: b.Silimit, Label: null, ...base } }
    return { ...b, Limit: { Kind: 'none', Amount: null, Label: null, ...base } }
  }
  return {
    ...plan,
    MainBenefits: (plan.MainBenefits ?? []).map((b) =>
      normalize({
        ...b,
        BenefitType: b.BenefitType ?? 'MAIN',
        CoverageName: b.CoverageName || b.SubCoverageName,
      })
    ),
  }
}

export type BenefitRow = { label: string; value: string }

export function getHighlightBenefits(plan: InsurancePlan, max = 6): BenefitRow[] {
  return (plan.MainBenefits ?? [])
    .filter((b) => b.Limit && b.Limit.Kind !== 'none')
    .sort((a, b) => Number(a.DisplaySeqNo) - Number(b.DisplaySeqNo))
    .slice(0, max)
    .map((b) => ({ label: b.BenefitDesc, value: formatBenefitLimit(b) }))
}

export function groupBenefits(plan: InsurancePlan): { title: string; rows: BenefitRow[] }[] {
  const groups = new Map<string, BenefitRow[]>()
  const sorted = [...(plan.MainBenefits ?? [])].sort(
    (a, b) => Number(a.DisplaySeqNo) - Number(b.DisplaySeqNo)
  )
  for (const b of sorted) {
    const title = b.CoverageName || 'Benefit overview'
    if (!groups.has(title)) groups.set(title, [])
    groups.get(title)!.push({ label: b.BenefitDesc, value: formatBenefitLimit(b) })
  }
  return [...groups.entries()].map(([title, rows]) => ({ title, rows }))
}
