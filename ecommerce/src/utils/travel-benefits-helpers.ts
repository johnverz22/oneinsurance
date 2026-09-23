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

// ─── limit display helper ────────────────────────────────────────────────────

export type LimitDisplay =
  | { kind: 'amount'; value: string }
  | { kind: 'badge'; label: string }
  | { kind: 'none' }

/**
 * Resolves how a benefit's limit should be displayed.
 * - Silimit present → formatted PHP amount
 * - DefaultLimitDesc present (Included / Unlimited) → badge label
 * - otherwise → none
 */
export function resolveLimitDisplay(benefit: InsuranceBenefit): LimitDisplay {
  if (benefit.Silimit) {
    return { kind: 'amount', value: benefit.Silimit }
  }
  if (benefit.DefaultLimitDesc) {
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

