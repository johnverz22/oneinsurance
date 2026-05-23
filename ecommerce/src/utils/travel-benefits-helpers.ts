import { Benefit, InsuranceBenefit, InsurancePlan, Plan } from '@/types/plan'

interface BenefitGroup {
  parent: InsuranceBenefit
  children: InsuranceBenefit[]
}

interface GroupedBenefits {
  [parentCode: string]: BenefitGroup
}

export function extractPlanBenefits(plan: InsurancePlan) {
  return extractUniqueCoverageNames(plan)
}

export function extractUniqueCoverageNames(plan: InsurancePlan) {
  if (!plan) {
    return []
  }

  // Use MainBenefits if available, otherwise fall back to AddonBenefits
  const sourceBenefits = (plan.MainBenefits && plan.MainBenefits.length > 0)
    ? plan.MainBenefits
    : (plan.AddonBenefits || [])

  if (sourceBenefits.length === 0) {
    return []
  }

  // Group by CoverageName
  const groupedByCoverage = sourceBenefits.reduce(
    (acc, benefit) => {
      const coverageName = benefit.CoverageName!

      if (!coverageName) {
        return acc
      }

      if (!acc[coverageName]) {
        acc[coverageName] = []
      }
      acc[coverageName].push(benefit)
      return acc
    },
    {} as Record<string, typeof sourceBenefits>
  )

  // Get one representative benefit per coverage group
  return Object.entries(groupedByCoverage)
    .map(([coverageName, benefits]) => {
      // Find the benefit with the highest Silimit or just take the first one
      const representative = benefits.reduce((max, current) => {
        const maxAmount = parseFloat(max.Silimit || '0')
        const currentAmount = parseFloat(current.Silimit || '0')
        return currentAmount > maxAmount ? current : max
      }, benefits[0])

      const totalAmount = Math.max(
        ...benefits.map((b) => parseFloat(b.Silimit || '0'))
      )

      return {
        ...representative,
        coverageName,
        benefitCount: benefits.length,
        allBenefits: benefits,
        totalAmount,
        displayCoverage: representative.DefaultLimitDesc,
      }
    })
    .sort((a, b) => a.coverageName.localeCompare(b.coverageName))
}

/**
 * Groups benefits by parent-child relationships
 * @param benefits - Array of benefits to group
 * @returns Array of grouped benefits with parent and their children
 */
export function groupBenefitsByParent(
  benefits: InsuranceBenefit[]
): GroupedBenefits {
  const grouped: GroupedBenefits = {}

  // First, identify all parent benefits (those with ParentBenefit: 'NA')
  const parents: InsuranceBenefit[] = benefits.filter(
    (benefit) => benefit.ParentBenefit === null
  )

  // Initialize each parent group
  parents.forEach((parent: InsuranceBenefit) => {
    grouped[parent.BenefitCode!] = {
      parent: parent,
      children: [],
    }
  })

  // Then, assign child benefits to their respective parents
  benefits.forEach((benefit: InsuranceBenefit) => {
    if (benefit.ParentBenefit !== 'NA' && grouped[benefit.ParentBenefit!]) {
      grouped[benefit.ParentBenefit!].children.push(benefit)
    }
  })

  return grouped
}

/**
 * Groups both MainBenefits and AddonBenefits in a Plan
 * @param plan - InsurancePlan object containing MainBenefits and AddonBenefits
 * @returns Object with grouped main and addon benefits
 */
export function groupPlanBenefits(plan: InsurancePlan) {
  if (!plan) {
    return {
      groupedMainBenefits: {},
      groupedAddonBenefits: {},
    }
  }

  return {
    groupedMainBenefits: groupBenefitsByParent(plan.MainBenefits || []),
    groupedAddonBenefits: groupBenefitsByParent(plan.AddonBenefits || []),
  }
}

export function groupBenefits(plan: InsurancePlan) {
  if (!plan) {
    return []
  }

  // Use MainBenefits if available, otherwise fall back to AddonBenefits
  const benefits = (plan.MainBenefits && plan.MainBenefits.length > 0)
    ? plan.MainBenefits
    : (plan.AddonBenefits || [])

  if (benefits.length === 0) {
    return []
  }

  const grouped = benefits.reduce(
    (grp, benefit) => {
      const coverageName = benefit.CoverageName || benefit.SubCoverageName

      if (!coverageName) {
        return grp
      }

      if (!grp[coverageName]) {
        grp[coverageName] = []
      }
      grp[coverageName].push(benefit)
      return grp
    },
    {} as Record<string, InsuranceBenefit[]>
  )

  return Object.entries(grouped)
    .map(([coverageName, benefits]) => ({
      coverageName,
      benefits,
    }))
    .slice()
    .sort((a, b) => a.coverageName.localeCompare(b.coverageName))
}

export function parseLimit(limit?: string): number {
  if (!limit) return 0

  // match first continuous number (integer/decimal)
  const match = limit.match(/\d+(?:\.\d+)?/)

  if (!match) return 0
  return Number(match[0])
}

type GroupedBenefit = {
  coverageName: string
  benefits: InsuranceBenefit[]
}

export function getHighlightedBenefits(
  benefit: GroupedBenefit[],
  showAll: boolean = false
) {
  const parentBenefits = benefit.flatMap((g) => g.benefits)
  const sorted = parentBenefits.sort((a, b) => {
    const limitA = parseLimit(a.DefaultLimitDesc)
    const limitB = parseLimit(b.DefaultLimitDesc)
    return limitB - limitA // highest first
  })

  if (showAll) {
    return { benefits: sorted, hasMore: false }
  }

  const limited = sorted.slice(0, 4)
  const hasMore = parentBenefits.length > 4

  return { benefits: limited, hasMore }
}
