import { InsuranceBenefit, InsurancePlan } from '@/types/plan'

// ─── legacy types kept for callers outside insurance-plan ───────────────────
interface BenefitGroup {
  parent: InsuranceBenefit
  children: InsuranceBenefit[]
}

interface GroupedBenefits {
  [parentCode: string]: BenefitGroup
}

// ─── canonical category config ──────────────────────────────────────────────

export interface CategoryConfig {
  label: string
  /** lucide-react icon name to import in the UI */
  icon: string
  order: number
}

/**
 * Maps API category strings to a canonical display config.
 * Keys are lowercase for case-insensitive matching.
 */
const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  'emergency medical treatment': { label: 'Medical', icon: 'HeartPulse', order: 1 },
  'personal accident insurance': { label: 'Personal Accident', icon: 'ShieldAlert', order: 2 },
  'travel inconvenience benefits': { label: 'Travel Inconvenience', icon: 'Luggage', order: 3 },
  'recovery of travel expenses': { label: 'Trip Protection', icon: 'Plane', order: 4 },
  'travel assistance benefits': { label: 'Assistance', icon: 'LifeBuoy', order: 5 },
  'personal liability': { label: 'Personal Liability', icon: 'Scale', order: 6 },
  'value-added feature': { label: 'Value-Added', icon: 'Star', order: 7 },
  // Pacific Cross / legacy categories
  'medical treatment': { label: 'Medical', icon: 'HeartPulse', order: 1 },
  'personal accident': { label: 'Personal Accident', icon: 'ShieldAlert', order: 2 },
  'baggage & travel documents': { label: 'Travel Inconvenience', icon: 'Luggage', order: 3 },
  'trip protection': { label: 'Trip Protection', icon: 'Plane', order: 4 },
  'emergency medical': { label: 'Medical', icon: 'HeartPulse', order: 1 },
  // Normalized Pacific Cross sub-categories → canonical
  'baggage delay': { label: 'Travel Inconvenience', icon: 'Luggage', order: 3 },
  'trip cancellation': { label: 'Trip Protection', icon: 'Plane', order: 4 },
  'flight delay': { label: 'Travel Inconvenience', icon: 'Luggage', order: 3 },
}

const DEFAULT_CATEGORY_CONFIG: CategoryConfig = {
  label: 'Other Benefits',
  icon: 'Circle',
  order: 99,
}

export function getCategoryConfig(rawCategory: string): CategoryConfig {
  const key = rawCategory.toLowerCase().trim()
  return CATEGORY_CONFIG[key] ?? { ...DEFAULT_CATEGORY_CONFIG, label: rawCategory }
}

/**
 * Infer canonical category from a benefit when CoverageName/SubCoverageName is
 * missing or non-canonical (e.g. Pacific Cross benefits without CoverageName).
 * Keeps taxonomy consistent across providers for apple-to-apples comparison.
 */
export function getCanonicalConfigForBenefit(benefit: InsuranceBenefit): CategoryConfig {
  const raw = (benefit.CoverageName || benefit.SubCoverageName || '').toLowerCase().trim()
  if (raw && CATEGORY_CONFIG[raw]) return CATEGORY_CONFIG[raw]

  // Keyword inference from BenefitDesc / BenefitCode fall-backs
  const desc = (benefit.BenefitDesc || '').toLowerCase()
  if (!desc) return DEFAULT_CATEGORY_CONFIG

  if (/(medical|hospital|dental|covid|pre-existing|in-patient|out-patient|burial|implant|recreational)/.test(desc)) {
    return CATEGORY_CONFIG['emergency medical treatment']
  }
  if (/accident/.test(desc)) {
    return CATEGORY_CONFIG['personal accident insurance']
  }
  if (/(baggage|flight delay|missed connecting|strikes|hijacking|gadget|theft of cash|loss of travel|mobile phone|sporting equipment)/.test(desc)) {
    return CATEGORY_CONFIG['travel inconvenience benefits']
  }
  if (/(trip cancellation|trip termination|trip postponement|alternative means|staff replacement|terrorism)/.test(desc)) {
    return CATEGORY_CONFIG['recovery of travel expenses']
  }
  if (/emergency assistance/.test(desc)) {
    return CATEGORY_CONFIG['travel assistance benefits']
  }
  if (/personal liability/.test(desc)) {
    return CATEGORY_CONFIG['personal liability']
  }
  if (/(land vehicle rental|land vehicle rental excess)/.test(desc)) {
    return CATEGORY_CONFIG['value-added feature']
  }

  // If raw exists but not in map, bucket as Other rather than creating many distinct rows
  if (raw) return { ...DEFAULT_CATEGORY_CONFIG, label: raw }

  return DEFAULT_CATEGORY_CONFIG
}

/** Ordered list of canonical categories for comparison matrix (one consistent taxonomy) */
export const CANONICAL_CATEGORY_ORDER: CategoryConfig[] = [
  CATEGORY_CONFIG['emergency medical treatment'],
  CATEGORY_CONFIG['personal accident insurance'],
  CATEGORY_CONFIG['travel inconvenience benefits'],
  CATEGORY_CONFIG['recovery of travel expenses'],
  CATEGORY_CONFIG['travel assistance benefits'],
  CATEGORY_CONFIG['personal liability'],
  CATEGORY_CONFIG['value-added feature'],
]

// ─── grouped category type used by the UI ───────────────────────────────────

export interface BenefitCategory {
  key: string
  config: CategoryConfig
  benefits: InsuranceBenefit[]
}

/**
 * Groups MainBenefits (falling back to AddonBenefits) by their CoverageName
 * category, applies canonical ordering, and returns sorted BenefitCategory[].
 */
export function groupBenefitsByCategory(plan: InsurancePlan): BenefitCategory[] {
  const source =
    plan.MainBenefits?.length ? plan.MainBenefits : (plan.AddonBenefits ?? [])

  if (!source.length) return []

  const map = new Map<string, InsuranceBenefit[]>()

  for (const b of source) {
    const cat = b.CoverageName || b.SubCoverageName || 'Other'
    if (!map.has(cat)) map.set(cat, [])
    map.get(cat)!.push(b)
  }

  return Array.from(map.entries())
    .map(([key, benefits]) => ({
      key,
      config: getCategoryConfig(key),
      benefits,
    }))
    .sort((a, b) => a.config.order - b.config.order || a.key.localeCompare(b.key))
}

/** Normalized grouping — always maps to the canonical taxonomy for matrix comparison */
export function groupBenefitsByCanonical(plan: InsurancePlan): Map<string, InsuranceBenefit[]> {
  const source: InsuranceBenefit[] = [
    ...(plan.MainBenefits ?? []),
    ...(plan.AddonBenefits ?? []),
  ]
  const map = new Map<string, InsuranceBenefit[]>()
  for (const b of source) {
    const cfg = getCanonicalConfigForBenefit(b)
    const label = cfg.label
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(b)
  }
  return map
}

/** All canonical rows that actually appear in any of the given plans (apples-to-apples) */
export function getComparisonRowConfigs(plans: InsurancePlan[]): CategoryConfig[] {
  const present = new Set<string>()
  for (const plan of plans) {
    for (const [label] of groupBenefitsByCanonical(plan)) {
      present.add(label)
    }
  }
  // Keep canonical order, but only rows that exist in at least one plan
  const ordered = CANONICAL_CATEGORY_ORDER.filter((c) => present.has(c.label))
  // Any "Other" buckets that slipped through (inferred raw) → append at end sorted
  const others = Array.from(present)
    .filter((l) => !CANONICAL_CATEGORY_ORDER.some((c) => c.label === l))
    .sort()
    .map((l) => ({ label: l, icon: 'Circle', order: 99 }) as CategoryConfig)
  return [...ordered, ...others]
}

// ─── limit display helper ────────────────────────────────────────────────────

export type LimitDisplay =
  | { kind: 'amount'; value: string; qualifier?: string }
  | { kind: 'badge'; label: string; qualifier?: string }
  | { kind: 'text'; text: string }
  | { kind: 'none' }

/**
 * Resolves how a benefit's limit should be displayed.
 *
 * Prefers the normalized `Limit` object emitted by the compare-quote mapper:
 *  - amount → formatted PHP amount, optional qualifier sub-line
 *  - label  → badge chip ("Included" / "Unlimited" / short text like "Actual Cost")
 *  - text   → longer free text (rendered wrapped, not as a chip)
 *  - none   → —
 *
 * Falls back to the legacy InsureMo fields for data without `Limit`
 * (Pacific Cross static plans, CTPL, proposal loads): Silimit holds the amount
 * and DefaultLimitDesc the label, where '0' is the sentinel meaning
 * "use Silimit".
 */
export function resolveLimitDisplay(benefit: InsuranceBenefit): LimitDisplay {
  const normalizeAmount = (value?: string | null) => {
    if (!value) return null
    const normalized = value.replace(/,/g, '').trim()
    const amount = Number(normalized)
    return Number.isFinite(amount) ? String(amount) : null
  }

  const limit = benefit.Limit
  if (limit) {
    switch (limit.Kind) {
      case 'amount': {
        const amount = normalizeAmount(limit.Amount)
        return amount
          ? { kind: 'amount', value: amount, qualifier: limit.Qualifier ?? undefined }
          : limit.Amount
            ? { kind: 'badge', label: limit.Amount, qualifier: limit.Qualifier ?? undefined }
            : { kind: 'none' }
      }
      case 'label':
        return limit.Label
          ? { kind: 'badge', label: limit.Label, qualifier: limit.Qualifier ?? undefined }
          : { kind: 'none' }
      case 'text':
        return limit.Label ? { kind: 'text', text: limit.Label } : { kind: 'none' }
      default:
        return { kind: 'none' }
    }
  }

  if (benefit.Silimit && benefit.Silimit !== '0') {
    const amount = normalizeAmount(benefit.Silimit)
    return amount
      ? { kind: 'amount', value: amount }
      : { kind: 'badge', label: benefit.Silimit }
  }
  if (benefit.DefaultLimitDesc && benefit.DefaultLimitDesc !== '0') {
    return { kind: 'badge', label: benefit.DefaultLimitDesc }
  }
  return { kind: 'none' }
}

// ─── legacy exports kept for backward compatibility ──────────────────────────

export function extractPlanBenefits(plan: InsurancePlan) {
  return extractUniqueCoverageNames(plan)
}

export function extractUniqueCoverageNames(plan: InsurancePlan) {
  if (!plan) return []

  const sourceBenefits =
    plan.MainBenefits?.length ? plan.MainBenefits : (plan.AddonBenefits ?? [])

  if (!sourceBenefits.length) return []

  const groupedByCoverage = sourceBenefits.reduce(
    (acc, benefit) => {
      const coverageName = benefit.CoverageName!
      if (!coverageName) return acc
      if (!acc[coverageName]) acc[coverageName] = []
      acc[coverageName].push(benefit)
      return acc
    },
    {} as Record<string, typeof sourceBenefits>
  )

  return Object.entries(groupedByCoverage)
    .map(([coverageName, benefits]) => {
      const representative = benefits.reduce((max, current) => {
        const maxAmount = parseFloat(max.Silimit || '0')
        const currentAmount = parseFloat(current.Silimit || '0')
        return currentAmount > maxAmount ? current : max
      }, benefits[0])

      return {
        ...representative,
        coverageName,
        benefitCount: benefits.length,
        allBenefits: benefits,
        totalAmount: Math.max(...benefits.map((b) => parseFloat(b.Silimit || '0'))),
        displayCoverage: representative.DefaultLimitDesc,
      }
    })
    .sort((a, b) => a.coverageName.localeCompare(b.coverageName))
}

export function groupBenefitsByParent(benefits: InsuranceBenefit[]): GroupedBenefits {
  const grouped: GroupedBenefits = {}
  const parents = benefits.filter((b) => b.ParentBenefit === null)
  parents.forEach((parent) => {
    grouped[parent.BenefitCode!] = { parent, children: [] }
  })
  benefits.forEach((benefit) => {
    if (benefit.ParentBenefit !== 'NA' && grouped[benefit.ParentBenefit!]) {
      grouped[benefit.ParentBenefit!].children.push(benefit)
    }
  })
  return grouped
}

export function groupPlanBenefits(plan: InsurancePlan) {
  if (!plan) return { groupedMainBenefits: {}, groupedAddonBenefits: {} }
  return {
    groupedMainBenefits: groupBenefitsByParent(plan.MainBenefits ?? []),
    groupedAddonBenefits: groupBenefitsByParent(plan.AddonBenefits ?? []),
  }
}

export function groupBenefits(plan: InsurancePlan) {
  if (!plan) return []

  const benefits = plan.MainBenefits?.length ? plan.MainBenefits : (plan.AddonBenefits ?? [])
  if (!benefits.length) return []

  const grouped = benefits.reduce(
    (grp, benefit) => {
      const coverageName = benefit.CoverageName || benefit.SubCoverageName
      if (!coverageName) return grp
      if (!grp[coverageName]) grp[coverageName] = []
      grp[coverageName].push(benefit)
      return grp
    },
    {} as Record<string, InsuranceBenefit[]>
  )

  return Object.entries(grouped)
    .map(([coverageName, benefits]) => ({ coverageName, benefits }))
    .sort((a, b) => a.coverageName.localeCompare(b.coverageName))
}

export function parseLimit(limit?: string): number {
  if (!limit) return 0
  const match = limit.match(/\d+(?:\.\d+)?/)
  if (!match) return 0
  return Number(match[0])
}

type GroupedBenefit = { coverageName: string; benefits: InsuranceBenefit[] }

export function getHighlightedBenefits(benefit: GroupedBenefit[], showAll = false) {
  const parentBenefits = benefit.flatMap((g) => g.benefits)
  const sorted = parentBenefits.sort((a, b) => {
    const limitA = parseLimit(a.DefaultLimitDesc)
    const limitB = parseLimit(b.DefaultLimitDesc)
    return limitB - limitA
  })

  if (showAll) return { benefits: sorted, hasMore: parentBenefits.length > 4 }

  return { benefits: sorted.slice(0, 4), hasMore: parentBenefits.length > 4 }
}

