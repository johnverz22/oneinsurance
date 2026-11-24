import type { Transaction } from '@/lib/transactions'
import type { PolicyDocData } from '@/lib/generate-policy-pdfs'

/* eslint-disable @typescript-eslint/no-explicit-any */

export function formatTimestamp(value?: string | null): string {
  if (!value) return '—'
  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const date = new Date(normalized)
  if (isNaN(date.getTime())) return value
  const day = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const time = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  return `${day}, ${time}`
}

export function formatDateOnly(value?: string | null): string {
  if (!value) return '—'
  const dateOnly = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (dateOnly) {
    return new Date(
      Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    ).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    })
  }
  const date = new Date(value.includes('T') ? value : value.replace(' ', 'T'))
  if (isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatTravelDates(start?: string | null, end?: string | null): string {
  if (!start && !end) return '—'
  const startLabel = start ? formatDateOnly(start) : null
  const endLabel = end ? formatDateOnly(end) : null
  const s = new Date(start ?? '')
  const e = new Date(end ?? '')
  let days: number | null = null
  if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
    days = Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1
  }
  const range =
    startLabel && endLabel
      ? `${startLabel} – ${endLabel}`
      : (startLabel ?? `– ${endLabel}`)
  return days && days > 0 ? `${range} (${days} days)` : (range ?? '—')
}

export function rawText(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return ''
}

export function firstText(...values: unknown[]): string {
  return rawText(...values) || '—'
}

export function titleCase(value?: string | null): string {
  if (!value) return '—'
  return value
    .toString()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function countryName(code?: string | null): string {
  const value = rawText(code).toUpperCase()
  if (!value) return '—'
  if (value.length !== 2) return value
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(value) ?? value
  } catch {
    return value
  }
}

export function personDisplayName(person: any): string {
  if (!person) return '—'
  const parts = [
    person.FirstName ?? person.first_name,
    person.MiddleName ?? person.middle_name,
    person.LastName ?? person.last_name,
  ].filter(Boolean)
  const name = parts.join(' ').trim()
  if (name) return name
  return firstText(
    person.InsuredName,
    person.CustomerName,
    person.name,
    [person.first_name, person.last_name].filter(Boolean).join(' ')
  )
}

export function travellerTypeFromDob(dob?: string | null): string {
  if (!dob) return 'Adult'
  const time = new Date(dob).getTime()
  if (isNaN(time)) return 'Adult'
  return (Date.now() - time) / 31_557_600_000 >= 18 ? 'Adult' : 'Child'
}

export function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '')
    if (!cleaned || cleaned === '-' || cleaned === '.') return null
    const num = Number(cleaned)
    return Number.isFinite(num) ? num : null
  }
  return null
}

export function formatCurrency(value: unknown, currency?: string | null): string {
  const num = toFiniteNumber(value)
  if (num == null) return '—'
  const symbol = (currency ?? 'PHP') === 'PHP' ? '₱' : `${currency ?? 'PHP'} `
  return `${symbol}${num.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

export function formatLimitText(text: string): string {
  const grouped = (v: string) =>
    Number(v.replace(/,/g, '')).toLocaleString('en-PH', { maximumFractionDigits: 2 })
  return text
    .replace(
      /\b(?:PHP|Php)\s*(\d[\d,]*(?:\.\d+)?)/g,
      (_m, num: string) => `₱${grouped(num)}`
    )
    .replace(
      /(^|[^₱$€\d,])(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d{4,}(?:\.\d+)?)(?!\s*(?:%|\/|days?|hrs?|hours?))/g,
      (_m, prefix: string, num: string) => `${prefix}₱${grouped(num)}`
    )
}

export function coverageLimitText(coverage: any): string {
  const limit = coverage?.limit
  let text = ''
  if (limit && typeof limit === 'object') {
    const notes = rawText(limit.notes)
    const amount = rawText(limit.amount, limit.sub_limit_amount)
    text = notes && notes !== '0' ? notes : amount || notes
  } else {
    text = rawText(limit, coverage?.CoverageLimit, coverage?.Limit)
  }
  if (!text) return 'Included'
  if (text === '0') return '—'
  if (/^\d+(\.\d+)?$/.test(text)) {
    const num = Number(text)
    if (num === 0) return '—'
    return `₱${num.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`
  }
  return formatLimitText(text)
}

// ─── Coverage grouping ───────────────────────────────────────────────────────

export function coverageCategory(coverage: any, name: string): string {
  const category = rawText(coverage?.category)
  if (category) return category
  if (/medical|emergency|hospital|dental|evacuation|treatment|transport/i.test(name))
    return 'Medical & emergency expenses'
  if (/trip|departure|connection|cancel|interrupt|document|accommodation|delay/i.test(name))
    return 'Trip disruption'
  if (/baggage|belongings|effects|item|property/i.test(name))
    return 'Personal belongings & baggage'
  return 'Other benefits'
}

export function groupCoverages(coverages: any[]) {
  const groups = new Map<string, Array<{ name: string; limit: string }>>()
  const seen = new Set<string>()
  for (const coverage of coverages) {
    const name = rawText(coverage?.name, coverage?.CoverageName)
    if (!name) continue
    const category = coverageCategory(coverage, name)
    const key = `${category}|${name}`
    if (seen.has(key)) continue
    seen.add(key)
    const list = groups.get(category) ?? []
    list.push({ name, limit: coverageLimitText(coverage) })
    groups.set(category, list)
  }
  return Array.from(groups, ([name, items]) => ({ name, items }))
}


export function buildTransactionSummary(
  raw: Transaction | null | undefined,
  fallbackId?: number | string | null
) {
  const tx: any = raw ?? {}

  // ── Parse policy_details ──────────────────────────────────────────────────
  let policyDetails: any = null
  if (tx?.policy_details) {
    try {
      policyDetails =
        typeof tx.policy_details === 'string'
          ? JSON.parse(tx.policy_details)
          : tx.policy_details
    } catch {
      policyDetails = null
    }
  }

  const pd: any = policyDetails ?? {}

  const hasNewShape =
    Array.isArray(pd.coverages) ||
    Array.isArray(pd.travellers) ||
    !!pd.trip ||
    !!pd.insurer ||
    !!pd.plan

  // Legacy shapes
  const customers: any[] = pd.PolicyCustomerList ?? []
  const risks: any[] = pd.PolicyLobList?.[0]?.PolicyRiskList ?? []
  const travelDetails = pd.TravelDetailList?.[0] ?? null
  const legacyCoverages: any[] = []
  const seenLegacy = new Set<string>()
  for (const risk of risks) {
    for (const cov of risk?.PolicyCoverageList ?? []) {
      const name = cov?.CoverageName
      if (typeof name === 'string' && name && !seenLegacy.has(name)) {
        seenLegacy.add(name)
        legacyCoverages.push(cov)
      }
    }
  }

  // New shape arrays
  const pdTravellers: any[] = Array.isArray(pd.travellers) ? pd.travellers : []
  const pdCoverages: any[] = Array.isArray(pd.coverages) ? pd.coverages : []
  const pdTrip = pd.trip ?? null

  // ── Computed display values ───────────────────────────────────────────────

  const policyNumber =
    rawText(tx?.policy_number, tx?.carrier_policy_no, pd.policy_no, pd.CarrierPolicyNo) || null

  const proposalNumber =
    rawText(tx?.proposal_number, pd.proposal_number, pd.ProposalNo, pd.CarrierProposalNo) || null

  const certificateNumber =
    rawText(tx?.certificate_number, pd.certificate_number, pd.other_details?.prn_no) ||
    pdTravellers.map((t) => rawText(t?.certificate_number)).find(Boolean) ||
    null

  const plan = titleCase(
    firstText(pd.plan?.name, tx?.plan_name, pd.CarrierPlanCode, pd.PlanCode)
  )

  const product = titleCase(
    firstText(
      pd.product?.name,
      pd.ProductName,
      tx?.product_name,
      tx?.line_of_business,
      typeof tx?.product === 'object' ? tx?.product?.name : tx?.product
    )
  )

  const insurer = firstText(pd.insurer?.name, tx?.insurer_name)

  // Policy holder name
  const policyHolderCustomer =
    customers.find((c) => c.IsPolicyHolder === 'Y') ?? customers[0] ?? null
  const principalTraveller =
    pdTravellers.find((t) => t?.is_principal_applicant) ?? pdTravellers[0] ?? null
  const holderName =
    (hasNewShape
      ? [
          principalTraveller ? personDisplayName(principalTraveller) : '',
          rawText(tx?.policy_holder),
        ]
      : [
          policyHolderCustomer
            ? [
                policyHolderCustomer.FirstName,
                policyHolderCustomer.MiddleName,
                policyHolderCustomer.LastName,
              ]
                .filter(Boolean)
                .join(' ')
                .trim()
            : '',
          rawText(tx?.policy_holder),
        ]
    ).find((v) => v && v !== '—') ?? '—'

  // Contact from principal traveller or root tx fields
  const holderEmail = rawText(
    principalTraveller?.email,
    tx?.client_email
  )
  const holderPhone = rawText(
    principalTraveller?.mobile
      ? `+63${principalTraveller.mobile}`
      : '',
    tx?.client_phone
  )

  // Trip
  const originCode = rawText(pdTrip?.origin_country, travelDetails?.PlaceOfOrgin)
  const destCodes: string[] = Array.isArray(pdTrip?.destination_countries)
    ? pdTrip.destination_countries
    : travelDetails?.TravelCountry
      ? [travelDetails.TravelCountry]
      : []
  const origin = originCode ? countryName(originCode) : null
  const destination = destCodes.length
    ? destCodes.map((c: string) => countryName(c)).join(', ')
    : null
  const tripRoute =
    origin || destination
      ? `${origin ?? '—'} → ${destination ?? '—'}`
      : '—'
  const travelDates = formatTravelDates(
    pdTrip?.departure_date ?? pd.EffectiveDate,
    pdTrip?.return_date ?? pd.ExpiryDate
  )
  const travelType = titleCase(rawText(pdTrip?.trip_type, pd.TravelType))

  // Traveller rows
  const toCount = (v: unknown) => {
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 0
  }

  const travellers: Array<{
    name: string
    birthday: string
    gender: string
    type: string
    certificate: string | null
  }> =
    hasNewShape && pdTravellers.length > 0
      ? pdTravellers.map((t) => ({
          name: personDisplayName(t),
          birthday: formatDateOnly(t?.date_of_birth),
          gender: titleCase(t?.gender),
          type: travellerTypeFromDob(t?.date_of_birth),
          certificate: rawText(t?.certificate_number) || null,
        }))
      : risks.length > 0
        ? risks.map((r) => ({
            name: personDisplayName(r),
            birthday: formatDateOnly(r.DateOfBirth),
            gender: titleCase(r.Gender),
            type:
              String(r.IsAdultTraveller).toUpperCase() === 'N' ? 'Child' : 'Adult',
            certificate: null,
          }))
        : customers
            .filter((c) => String(c.IsInsured).toUpperCase() !== 'N')
            .map((c) => ({
              name: personDisplayName(c),
              birthday: formatDateOnly(c.DateOfBirth),
              gender: titleCase(c.Gender),
              type: c.IsPolicyHolder === 'Y' ? 'Policy holder' : 'Adult',
              certificate: null,
            }))

  const adultCount = travellers.filter((t) => t.type === 'Adult').length
  const childCount = travellers.filter((t) => t.type === 'Child').length
  const travellerCount =
    toCount(pdTrip?.traveler_count) || travellers.length || toCount(pd.NoOfTravellers)
  const travellerSummary =
    travellerCount > 0
      ? `${travellerCount} ${travellerCount === 1 ? 'traveller' : 'travellers'}` +
        (adultCount || childCount
          ? ` (${adultCount} adult${adultCount === 1 ? '' : 's'}${
              childCount ? `, ${childCount} child${childCount === 1 ? '' : 'ren'}` : ''
            })`
          : '')
      : '—'

  // Payment
  const referenceId = rawText(tx?.merchant_transaction_id, tx?.payment_id, String(tx?.id ?? fallbackId ?? ''))
  const amount = tx?.amount ?? tx?.premium ?? pd.premium?.amount
  const method = rawText(tx?.payment_brand, tx?.payment_method) || '—'
  const currencyCode = rawText(tx?.currency, pd?.premium?.currency) || 'PHP'
  const rawNetCommission =
    tx?.net_commission ??
    tx?.commission_log?.net_commission ??
    tx?.commission_log?.agent_commission
  const rawStatus = rawText(tx?.transaction_status, tx?.payment_status, tx?.status) || 'pending'
  const timestamp = tx?.transaction_date ?? tx?.created_at ?? pd.issued_at ?? null
  const agentCode = (rawText(tx?.agent?.code, tx?.agent_code_used)).toUpperCase()
  const agentName = rawText(tx?.agent?.name) || null

  // Coverages
  const allCoverages = pdCoverages.length ? pdCoverages : legacyCoverages
  const coverageGroups = groupCoverages(
    allCoverages.filter(
      (c) =>
        c?.is_included !== false &&
        !rawText(c?.addon_code, c?.insurer_addon_code)
    )
  )

  const addonCoverages = pdCoverages.filter(
    (c) =>
      rawText(c?.addon_code, c?.insurer_addon_code) && c?.is_included !== false
  )
  const selectedAddonNames = pdTravellers
    .flatMap((t) => (Array.isArray(t?.selected_addons) ? t.selected_addons : []))
    .map((addon: any) =>
      rawText(
        typeof addon === 'string' ? addon : addon?.name,
        typeof addon === 'object' ? addon?.label : '',
        typeof addon === 'object' ? addon?.code : ''
      )
    )
    .filter(Boolean)
  const addonItems = [
    ...addonCoverages.map((c) => ({
      name: rawText(c?.name, c?.CoverageName),
      limit: coverageLimitText(c),
    })),
    ...selectedAddonNames.map((name: string) => ({ name, limit: 'Included' })),
  ].filter(
    (item, idx, list) =>
      item.name && list.findIndex((i) => i.name === item.name) === idx
  )

  const status = rawText(tx?.status, tx?.transaction_status) || null

  return {
    hasNewShape,
    plan,
    product,
    insurer,
    policyNumber,
    proposalNumber,
    certificateNumber,
    holderName,
    holderEmail,
    holderPhone,
    origin,
    destination,
    tripRoute,
    travelDates,
    travelType,
    travellers,
    travellerSummary,
    referenceId,
    amount,
    method,
    currencyCode,
    rawNetCommission,
    rawStatus,
    timestamp,
    agentCode,
    agentName,
    coverageGroups,
    addonItems,
    status,
    departureDate: (pdTrip?.departure_date ?? pd.EffectiveDate ?? null) as string | null,
    returnDate: (pdTrip?.return_date ?? pd.ExpiryDate ?? null) as string | null,
    planLabel: rawText(pd?.plan?.name, tx?.plan_name, pd?.CarrierPlanDesc) || 'Travel insurance',
    insurerLogoUrl:
      rawText(
        pd?.insurer?.logo_url,
        pd?.insurer?.logo,
        pd?.insurer?.image_url,
        tx?.insurer_logo_url,
        tx?.insurer_logo
      ) || null,
  }
}

export type TransactionSummary = ReturnType<typeof buildTransactionSummary>

/** Payment timestamp in the policy PDF style (en-GB, Asia/Manila, PHT). */
export function formatPaidAt(value?: string | null): string {
  if (!value) return '—'
  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const date = new Date(normalized)
  if (isNaN(date.getTime())) return value
  return `${date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Manila',
  })} PHT`
}

/** Map the summary onto the data the cover-notes PDF generator expects. */
export function toPolicyPdfData(s: TransactionSummary): PolicyDocData {
  const start = s.departureDate ? formatDateOnly(s.departureDate) : null
  const end = s.returnDate ? formatDateOnly(s.returnDate) : null
  const dates =
    start && end ? `${start} – ${end}` : (start ?? end ?? 'Not available')
  const from = new Date(s.departureDate ?? '')
  const to = new Date(s.returnDate ?? '')
  const days =
    !isNaN(from.getTime()) && !isNaN(to.getTime())
      ? Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1
      : 0
  const route =
    [s.origin, s.destination].filter((v): v is string => !!v).join(' - ') ||
    'Not available'

  return {
    policyNo: s.policyNumber || 'Not available',
    proposalNo: s.proposalNumber || '',
    paymentRef: String(s.referenceId),
    planName: s.planLabel,
    insurer: s.insurer === '—' ? '—' : s.insurer,
    insurerLogoUrl: s.insurerLogoUrl,
    route,
    dates,
    duration: days > 0 ? `${days} ${days === 1 ? 'day' : 'days'}` : '',
    travellers: s.travellerSummary,
    recipient: s.holderName,
    groups: [
      ...s.coverageGroups.map((g) => ({
        title: g.name,
        rows: g.items.map((i) => ({ label: i.name, value: i.limit })),
      })),
      ...(s.addonItems.length
        ? [
            {
              title: 'Selected add-ons',
              rows: s.addonItems.map((i) => ({ label: i.name, value: i.limit })),
            },
          ]
        : []),
    ],
    total: toFiniteNumber(s.amount) ?? 0,
    paidAt: formatPaidAt(s.timestamp),
    method: s.method === '—' ? '—' : s.method,
    statusLabel: titleCase(s.rawStatus),
  }
}
