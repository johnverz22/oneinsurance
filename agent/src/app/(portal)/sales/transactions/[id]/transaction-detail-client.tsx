'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  ShieldCheck,
  CreditCard,
  Users,
  Umbrella,
  Plus,
  ChevronDown,
  Copy,
  Download,
  XCircle,
} from 'lucide-react'
import { escapeCsvCell } from '@/lib/export-to-csv'
import type { LucideIcon } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useAuthFetch } from '@/hooks/use-auth-fetch'
import { StatusBadge } from '@/components/ui/status-badge'
import type { BadgeVariant } from '@/components/ui/status-badge'
import type { PolicyDocData } from '@/utils/generate-policy-pdfs'
import { useAgentUser } from '@/store/agent-auth-store'
import { toast } from 'sonner'

// ─── Formatters ─────────────────────────────────────────────────────────────

function formatTimestamp(value?: string | null): string {
  if (!value) return 'Not available'
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

// Matches the ecommerce policy PDF timestamp style (en-GB, Asia/Manila, PHT).
function formatPaidAt(value?: string | null): string {
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

function formatDateOnly(value?: string | null): string {
  if (!value) return 'Not available'
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

function formatTravelDates(start?: string | null, end?: string | null): string {
  if (!start && !end) return 'Not available'
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
  return days && days > 0 ? `${range} (${days} days)` : range
}

function parseDisplayDate(value?: string | null): Date | null {
  if (!value) return null
  const raw = String(value).trim()
  const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dateOnly) {
    return new Date(
      Number(dateOnly[1]),
      Number(dateOnly[2]) - 1,
      Number(dateOnly[3])
    )
  }
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T')
  const date = new Date(normalized)
  return isNaN(date.getTime()) ? null : date
}

function exportDateParts(value?: string | null): {
  date: string
  dateLabel: string
  time: string
} {
  const raw = rawText(value) || 'Not available'
  const date = parseDisplayDate(value)
  if (!date) return { date: raw, dateLabel: raw, time: 'Not available' }
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return {
    date: `${yyyy}-${mm}-${dd}`,
    dateLabel: date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
  }
}

function formatCompactTravelDates(
  start?: string | null,
  end?: string | null
): string {
  if (!start && !end) return 'Not available'
  if (!start || !end) return formatDateOnly(start ?? end)
  const startYear = rawText(start).slice(0, 4)
  const endYear = rawText(end).slice(0, 4)
  const sameYear = !!startYear && startYear === endYear
  const startLabel = formatDateOnly(start)
  const startCompact = sameYear
    ? startLabel.replace(/, \d{4}$/, '')
    : startLabel
  return `${startCompact} – ${formatDateOnly(end)}`
}

function fullName(person: any): string {
  if (!person) return 'Not available'
  return (
    [person.FirstName, person.MiddleName, person.LastName]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    person.InsuredName ||
    person.CustomerName ||
    'Not available'
  )
}

function titleCase(value?: string | null): string {
  if (!value) return 'Not available'
  return value
    .toString()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function transactionStatusVariant(status: string): BadgeVariant {
  const key = status.toLowerCase()
  if (/reject|declin|fail|cancel|error|expir|suspend|inactiv|block/.test(key)) {
    return 'failure'
  }
  if (/pend|review|interview|process|await|wait|underpaid|partial|unpaid/.test(key)) {
    return 'pending'
  }
  if (/approv|activ|complet|success|paid|verif/.test(key)) return 'success'
  return 'info'
}

function rawText(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return ''
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '')
    if (!cleaned || cleaned === '-' || cleaned === '.') return null
    const num = Number(cleaned)
    return Number.isFinite(num) ? num : null
  }
  return null
}

function exportAmount(value: unknown): string {
  const num = toFiniteNumber(value)
  return num == null ? '0.00' : num.toFixed(2)
}

function firstText(...values: unknown[]): string {
  return rawText(...values) || 'Not available'
}

function countryName(code?: string | null): string {
  const value = rawText(code).toUpperCase()
  if (!value) return 'Not available'
  if (value.length !== 2) return value
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(value) ?? value
  } catch {
    return value
  }
}

function personDisplayName(person: any): string {
  if (!person) return 'Not available'
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

function travellerTypeFromDob(dob?: string | null): string {
  if (!dob) return 'Adult'
  const time = new Date(dob).getTime()
  if (isNaN(time)) return 'Adult'
  return (Date.now() - time) / 31_557_600_000 >= 18 ? 'Adult' : 'Child'
}

function formatLimitText(text: string): string {
  const grouped = (value: string) =>
    Number(value.replace(/,/g, '')).toLocaleString('en-PH', {
      maximumFractionDigits: 2,
    })
  return text
    .replace(
      /\b(?:PHP|Php)\s*(\d[\d,]*(?:\.\d+)?)/g,
      (_match, num: string) => `₱${grouped(num)}`
    )
    .replace(
      /(^|[^₱$€\d,])(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d{4,}(?:\.\d+)?)(?!\s*(?:%|\/|days?|hrs?|hours?))/g,
      (_match, prefix: string, num: string) => `${prefix}₱${grouped(num)}`
    )
}

function coverageLimitText(coverage: any): string {
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

// ─── Small building blocks ───────────────────────────────────────────────────

function SummaryCard({
  icon: Icon,
  title,
  description,
  badge,
  children,
}: {
  icon: LucideIcon
  title: string
  description: string
  badge?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="w-full min-w-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text-main)]">
      <header className="flex min-h-[87px] items-center gap-3 border-b border-[var(--border)] px-[21px] pb-[19px] pt-[22px]">
        <span
          aria-hidden="true"
          className="flex size-[45px] shrink-0 items-center justify-center rounded-lg bg-[#006838] text-white"
        >
          <Icon className="size-6" strokeWidth={2} />
        </span>
        <div className="min-w-0 [overflow-wrap:anywhere]">
          <h2 className="text-[20px] font-semibold leading-6 text-[#006838] dark:text-[#d0e3c8]">
            {title}
          </h2>
          <p className="text-[14px] leading-[17px] text-[#878787] dark:text-[#b2b7b4]">
            {description}
          </p>
        </div>
        {badge && <div className="ms-auto shrink-0">{badge}</div>}
      </header>
      <div className="px-[29px] py-8">{children}</div>
    </section>
  )
}

function SummaryGroup({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={className}>
      <h3 className="mb-4 text-xs font-normal uppercase text-[#b88e28] dark:text-[#e4c27f]">
        {title}
      </h3>
      {children}
    </section>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[14px] leading-[normal] text-[#878787] dark:text-[#b2b7b4]">
        {label}
      </dt>
      <dd className="text-[16px] leading-6 [overflow-wrap:anywhere] text-[var(--text-main)]">
        {children}
      </dd>
    </div>
  )
}

function CopyReference({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${label.toLowerCase()}`}
        className="ui-action-icon -my-2 shrink-0"
      >
        <Copy className="size-4" aria-hidden="true" />
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? `${label} copied` : ''}
      </span>
    </>
  )
}

function DownloadMenu({
  docData,
  rows,
  fileBase,
}: {
  docData: PolicyDocData | null
  rows: Array<[string, string]>
  fileBase: string
}) {
  const [busy, setBusy] = useState(false)
  const ready = docData !== null

  const downloadCsv = () => {
    const csv = [
      'Field,Value',
      ...rows.map(([f, v]) => `${escapeCsvCell(f)},${escapeCsvCell(v)}`),
    ].join('\r\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transaction-${fileBase}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const downloadPdf = async () => {
    if (!docData) return
    setBusy(true)
    try {
      const m = await import('@/utils/generate-policy-pdfs')
      await m.downloadCoverageSummary(docData)
    } catch (err) {
      console.error('Transaction PDF failed:', err)
      toast.error('We could not create the PDF. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const close = (el: HTMLElement) => {
    const details = el.closest('details')
    if (details) details.open = false
  }

  const itemCls =
    'flex min-h-10 w-full items-center rounded px-3 text-left text-sm font-medium text-[var(--text-main)] hover:bg-[var(--subtle)] focus-visible:outline-2 focus-visible:outline-[#006838] disabled:opacity-60'

  return (
    <details className="group relative z-30">
      <summary
        role="button"
        aria-label="Download transaction"
        className="ui-action-icon cursor-pointer list-none [&::-webkit-details-marker]:hidden"
      >
        <Download className="size-5" aria-hidden="true" />
        <span className="sr-only">Download transaction</span>
      </summary>
      <div className="absolute right-0 top-full z-40 mt-1 min-w-44 rounded-md border border-[var(--border)] bg-white p-1 shadow-md dark:bg-[#1f2320]">
        <button
          type="button"
          disabled={!ready || busy}
          onClick={(e) => {
            close(e.currentTarget)
            void downloadPdf()
          }}
          className={itemCls}
        >
          {busy ? 'Generating…' : 'PDF'}
        </button>
        <button
          type="button"
          disabled={!ready}
          onClick={(e) => {
            downloadCsv()
            close(e.currentTarget)
          }}
          className={itemCls}
        >
          CSV
        </button>
      </div>
    </details>
  )
}

function DetailSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading transaction details"
      className="mt-7 space-y-5 motion-safe:animate-pulse"
    >
      <span className="sr-only">Loading transaction details</span>
      {[3, 2, 1, 3, 2].map((rows, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="w-full min-w-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)]"
        >
          <div className="flex min-h-[87px] items-center gap-3 border-b border-[var(--border)] px-[21px] pb-[19px] pt-[22px]">
            <div className="size-[45px] shrink-0 rounded-lg bg-[var(--subtle)]" />
            <div className="min-w-0 space-y-2">
              <div className="h-5 w-40 rounded bg-[var(--subtle)]" />
              <div className="h-3 w-56 max-w-full rounded bg-[var(--subtle)]" />
            </div>
          </div>
          <div className="space-y-5 px-[29px] py-8">
            <div className="h-3 w-28 rounded bg-[var(--subtle)]" />
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: rows * 2 }).map((_, j) => (
                <div key={j} className="space-y-2">
                  <div className="h-3 w-20 rounded bg-[var(--subtle)]" />
                  <div className="h-5 w-40 max-w-full rounded bg-[var(--subtle)]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Coverage grouping ───────────────────────────────────────────────────────

const COVERAGE_GROUPS: Array<{ name: string; test: RegExp }> = [
  {
    name: 'Medical & emergency expenses',
    test: /medical|emergency|hospital|dental|evacuation|treatment|transport/i,
  },
  {
    name: 'Trip disruption',
    test: /trip|departure|connection|cancel|interrupt|document|accommodation|delay/i,
  },
  {
    name: 'Personal belongings & baggage',
    test: /baggage|belongings|effects|item|property/i,
  },
]

function coverageCategory(coverage: any, name: string): string {
  const category = rawText(coverage?.category)
  if (category) return category
  const match = COVERAGE_GROUPS.find((g) => g.test.test(name))
  return match?.name ?? 'Other benefits'
}

function groupCoverages(coverages: any[]) {
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

// ─── Page ────────────────────────────────────────────────────────────────────

export function TransactionDetailClient({ id }: { id: string }) {
  const authFetch = useAuthFetch()
  const agentUser = useAgentUser()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['transaction', id],
    queryFn: async () => {
      const res = await authFetch(`/api/transactions/${id}`)
      if (!res.ok) throw new Error('Transaction not found')
      return res.json()
    },
  })

  const tx: any = data?.data ?? data ?? {}

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
  const hasNewPolicyShape =
    Array.isArray(pd.coverages) ||
    Array.isArray(pd.travellers) ||
    !!pd.trip ||
    !!pd.insurer ||
    !!pd.plan

  const customers: any[] = pd.PolicyCustomerList ?? []
  const policyHolder =
    customers.find((c) => c.IsPolicyHolder === 'Y') ?? customers[0] ?? null

  const risks: any[] = pd.PolicyLobList?.[0]?.PolicyRiskList ?? []
  const legacyCoverages: any[] = []
  const seenLegacyCoverages = new Set<string>()
  for (const risk of risks) {
    for (const coverage of risk?.PolicyCoverageList ?? []) {
      const name = coverage?.CoverageName
      if (typeof name === 'string' && name && !seenLegacyCoverages.has(name)) {
        seenLegacyCoverages.add(name)
        legacyCoverages.push(coverage)
      }
    }
  }
  const travelDetails = pd.TravelDetailList?.[0] ?? null

  const pdTravellers: any[] = Array.isArray(pd.travellers) ? pd.travellers : []
  const pdCoverages: any[] = Array.isArray(pd.coverages) ? pd.coverages : []
  const pdTrip = pd.trip ?? null

  const travellers: Array<{
    name: string
    birthday: string
    birthdayRaw: string
    gender: string
    type: string
  }> =
    hasNewPolicyShape && pdTravellers.length > 0
      ? pdTravellers.map((t) => ({
          name: personDisplayName(t),
          birthday: formatDateOnly(t?.date_of_birth),
          birthdayRaw: rawText(t?.date_of_birth) || 'Not available',
          gender: titleCase(t?.gender),
          type: travellerTypeFromDob(t?.date_of_birth),
        }))
      : risks.length > 0
        ? risks.map((r) => ({
            name: personDisplayName(r),
            birthday: formatDateOnly(r.DateOfBirth),
            birthdayRaw: rawText(r.DateOfBirth, r.Dob) || 'Not available',
            gender: titleCase(r.Gender),
            type:
              String(r.IsAdultTraveller).toUpperCase() === 'N' ? 'Child' : 'Adult',
          }))
        : customers
            .filter((c) => String(c.IsInsured).toUpperCase() !== 'N')
            .map((c) => ({
              name: personDisplayName(c),
              birthday: formatDateOnly(c.DateOfBirth),
              birthdayRaw: rawText(c.DateOfBirth, c.Dob) || 'Not available',
              gender: titleCase(c.Gender),
              type: c.IsPolicyHolder === 'Y' ? 'Policy holder' : 'Adult',
            }))

  const policyNumber =
    rawText(
      tx?.policy_number,
      tx?.carrier_policy_no,
      pd.policy_no,
      pd.CarrierPolicyNo
    ) || null

  const proposalNumber =
    rawText(
      tx?.proposal_number,
      pd.proposal_number,
      pd.ProposalNo,
      pd.CarrierProposalNo
    ) || null

  const certificateNumber =
    rawText(
      tx?.certificate_number,
      pd.certificate_number,
      pd.other_details?.prn_no
    ) ||
    pdTravellers.map((t) => rawText(t?.certificate_number)).find(Boolean) ||
    null

  const policyStatusLabel =
    policyNumber || certificateNumber || pd?.issued_at || pd?.policy_no
      ? 'Issued'
      : 'Not issued'

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

  const principalTraveller =
    pdTravellers.find((t) => t?.is_principal_applicant) ?? pdTravellers[0] ?? null
  const holderCandidates = hasNewPolicyShape
    ? [
        principalTraveller ? personDisplayName(principalTraveller) : '',
        fullName(policyHolder),
        rawText(tx?.policy_holder),
      ]
    : [fullName(policyHolder), rawText(tx?.policy_holder)]
  const holderName =
    holderCandidates.find((value) => value && value !== 'Not available') ??
    'Not available'

  const originCode = rawText(pdTrip?.origin_country, travelDetails?.PlaceOfOrgin)
  const destinationCodes = Array.isArray(pdTrip?.destination_countries)
    ? pdTrip.destination_countries
    : travelDetails?.TravelCountry
      ? [travelDetails.TravelCountry]
      : []
  const origin = originCode ? countryName(originCode) : null
  const destination = destinationCodes.length
    ? destinationCodes.map((code: any) => countryName(code)).join(', ')
    : null
  const tripRoute =
    origin || destination
      ? `${origin ?? 'Not available'} – ${destination ?? 'Not available'}`
      : 'Not available'
  const returnDestination = origin ?? 'Not available'
  const travelDates = formatTravelDates(
    pdTrip?.departure_date ?? pd.EffectiveDate,
    pdTrip?.return_date ?? pd.ExpiryDate
  )
  const travelType = titleCase(rawText(pdTrip?.trip_type, pd.TravelType))

  const toCount = (value: unknown) => {
    const n = Number(value)
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 0
  }
  const travellerCount =
    toCount(pdTrip?.traveler_count) ||
    travellers.length ||
    toCount(pd.NoOfTravellers)
  const adultCount = travellers.length
    ? travellers.filter((t) => t.type === 'Adult').length
    : toCount(pd.NoOfAdults)
  const childCount = travellers.length
    ? travellers.filter((t) => t.type === 'Child').length
    : toCount(pd.NoOfChildren)
  const travellerSummary =
    travellerCount > 0
      ? `${travellerCount} ${travellerCount === 1 ? 'traveller' : 'travellers'}` +
        (adultCount || childCount
          ? ` (${adultCount} adult${adultCount === 1 ? '' : 's'}${
              childCount
                ? `, ${childCount} child${childCount === 1 ? '' : 'ren'}`
                : ''
            })`
          : '')
      : 'Not available'

  const referenceId =
    tx?.merchant_transaction_id ?? tx?.payment_id ?? String(tx?.id ?? id)
  const amount = tx?.amount ?? tx?.premium ?? pd.premium?.amount
  const method = rawText(tx?.payment_brand, tx?.payment_method) || 'Not available'
  const paymentChannel =
    rawText(tx?.payment_channel, tx?.channel, tx?.payment_method) ||
    'Not available'
  const currencyCode = rawText(tx?.currency, pd?.premium?.currency) || 'PHP'
  const netCommission =
    tx?.net_commission ??
    tx?.commission_log?.net_commission ??
    tx?.commission_log?.agent_commission
  const premiumNumber = toFiniteNumber(amount)
  const commissionNumber = toFiniteNumber(netCommission) ?? 0
  const rawStatus =
    tx?.transaction_status || tx?.payment_status || tx?.status || 'pending'
  const timestamp = tx?.transaction_date ?? tx?.created_at ?? pd.issued_at ?? null

  const allCoverages = pdCoverages.length ? pdCoverages : legacyCoverages
  const coverageGroups = groupCoverages(
    allCoverages.filter(
      (coverage) =>
        coverage?.is_included !== false &&
        !rawText(coverage?.addon_code, coverage?.insurer_addon_code)
    )
  )
  const coverageCount = coverageGroups.length

  const addonCoverages = pdCoverages.filter(
    (coverage) =>
      rawText(coverage?.addon_code, coverage?.insurer_addon_code) &&
      coverage?.is_included !== false
  )
  const selectedAddonNames = pdTravellers.flatMap((traveller) =>
    Array.isArray(traveller?.selected_addons) ? traveller.selected_addons : []
  )
    .map((addon: any) =>
      rawText(
        typeof addon === 'string' ? addon : addon?.name,
        typeof addon === 'object' ? addon?.label : '',
        typeof addon === 'object' ? addon?.code : ''
      )
    )
    .filter(Boolean)
  const addonItems = [
    ...addonCoverages.map((coverage) => ({
      name: rawText(coverage?.name, coverage?.CoverageName),
      limit: coverageLimitText(coverage),
    })),
    ...selectedAddonNames.map((name) => ({ name, limit: 'Included' })),
  ].filter(
    (item, index, list) => item.name && list.findIndex((i) => i.name === item.name) === index
  )

  // ── PDF document data (ported from ecommerce /policy route) ──────────────
  const pdfDeparture = pdTrip?.departure_date ?? pd.EffectiveDate ?? null
  const pdfReturn = pdTrip?.return_date ?? pd.ExpiryDate ?? null
  const pdfStartLabel = pdfDeparture ? formatDateOnly(pdfDeparture) : null
  const pdfEndLabel = pdfReturn ? formatDateOnly(pdfReturn) : null
  const pdfDates =
    pdfStartLabel && pdfEndLabel
      ? `${pdfStartLabel} – ${pdfEndLabel}`
      : (pdfStartLabel ?? pdfEndLabel ?? 'Not available')
  const pdfStartDate = new Date(pdfDeparture ?? '')
  const pdfEndDate = new Date(pdfReturn ?? '')
  const pdfDays =
    !isNaN(pdfStartDate.getTime()) && !isNaN(pdfEndDate.getTime())
      ? Math.round((pdfEndDate.getTime() - pdfStartDate.getTime()) / 86_400_000) + 1
      : 0
  const pdfDuration =
    pdfDays > 0 ? `${pdfDays} ${pdfDays === 1 ? 'day' : 'days'}` : ''

  const pdfRouteParts = [
    origin,
    destination,
    returnDestination,
  ].filter((v): v is string => !!v && v !== 'Not available')
  const pdfRoute = pdfRouteParts.join(' - ') || 'Not available'

  const pdfGroups: PolicyDocData['groups'] = [
    ...coverageGroups.map((g) => ({
      title: g.name,
      rows: g.items.map((i) => ({ label: i.name, value: i.limit })),
    })),
    ...(addonItems.length
      ? [
          {
            title: 'Selected add-ons',
            rows: addonItems.map((i) => ({ label: i.name, value: i.limit })),
          },
        ]
      : []),
  ]

  const pdfTotal =
    Number(String(amount ?? '').replace(/,/g, '')) || 0
  const pdfPlanName =
    rawText(pd?.plan?.name, tx?.plan_name, pd?.CarrierPlanDesc) ||
    'Travel insurance'
  const pdfMethod =
    method === 'Not available' ? '—' : method
  const pdfInsurerLogo =
    rawText(
      pd?.insurer?.logo_url,
      pd?.insurer?.logo,
      pd?.insurer?.image_url,
      tx?.insurer_logo_url,
      tx?.insurer_logo
    ) || null

  const pdfDocData: PolicyDocData | null = data
    ? {
        policyNo: policyNumber || 'Not available',
        proposalNo: proposalNumber || '',
        paymentRef: String(referenceId),
        planName: pdfPlanName,
        insurer: insurer === 'Not available' ? '—' : insurer,
        insurerLogoUrl: pdfInsurerLogo,
        route: pdfRoute,
        dates: pdfDates,
        duration: pdfDuration,
        travellers: travellerSummary,
        recipient: holderName,
        groups: pdfGroups,
        total: pdfTotal,
        paidAt: formatPaidAt(timestamp),
        method: pdfMethod,
        statusLabel: titleCase(rawStatus),
      }
    : null

  const displayTitle = policyNumber || 'Not available'

  const exportDate = exportDateParts(timestamp)
  const compactTravelDates = formatCompactTravelDates(pdfDeparture, pdfReturn)
  const agentCode =
    rawText(tx?.agent_code_used, agentUser?.agent_code) || 'Not available'
  const partnerCode =
    rawText(tx?.partner_code, tx?.agent_code_used, agentUser?.agent_code) ||
    'Not available'

  const exportRows: Array<[string, string]> = [
    ['id', String(tx?.id ?? id)],
    ['payment', String(referenceId)],
    ['policy', policyNumber || 'Not available'],
    ['certificate', certificateNumber || 'N/A'],
    ['holder', holderName],
    ['product', product],
    ['plan', plan],
    ['premium', formatCurrency(premiumNumber ?? 0, currencyCode)],
    ['premium amount', exportAmount(amount)],
    ['commission', formatCurrency(commissionNumber, currencyCode)],
    ['commission amount', exportAmount(netCommission)],
    ['currency', currencyCode],
    ['status', titleCase(rawStatus)],
    ['date', exportDate.date],
    ['date label', exportDate.dateLabel],
    ['time', exportDate.time],
    ['payment channel', paymentChannel],
    ['method', method],
    [
      'agent',
      rawText(agentUser?.name, tx?.agent_name, tx?.agent?.name) ||
        'Not available',
    ],
    ['agent code', agentCode],
    ['route', tripRoute],
    ['travellers', travellerSummary],
  ]

  const pushTravellerRows = (prefix: string) => {
    travellers.forEach((traveller, index) => {
      exportRows.push(
        [`${prefix}${index}.name`, traveller.name],
        [`${prefix}${index}.birthday`, traveller.birthdayRaw],
        [`${prefix}${index}.gender`, traveller.gender],
        [`${prefix}${index}.type`, traveller.type]
      )
    })
  }
  pushTravellerRows('traveller details.')

  exportRows.push(
    ['partner code', partnerCode],
    ['timestamp', formatTimestamp(timestamp)],
    ['policy details.policy status', policyStatusLabel],
    ['policy details.provider', insurer],
    ['policy details.proposal', proposalNumber || 'Not available'],
    ['policy details.insured', holderName],
    ['policy details.trip route', tripRoute],
    ['policy details.return destination', returnDestination],
    ['policy details.travel dates', compactTravelDates],
    ['policy details.duration', pdfDuration || 'Not available'],
    ['policy details.travellers', travellerSummary]
  )
  pushTravellerRows('policy details.traveller details.')

  coverageGroups.forEach((group) => {
    group.items.forEach((item, index) => {
      exportRows.push(
        [`policy details.coverage.${group.name}.${index}.0`, item.name],
        [`policy details.coverage.${group.name}.${index}.1`, item.limit]
      )
    })
  })
  addonItems.forEach((item, index) => {
    exportRows.push(
      [`policy details.add ons.${index}.0`, item.name],
      [`policy details.add ons.${index}.1`, item.limit]
    )
  })

  return (
    <div>
      <Link
        href="/sales"
        className="group mb-2 flex min-h-11 w-fit items-center gap-2 rounded-md text-sm font-semibold text-[#006838] no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8]"
      >
        <span aria-hidden="true">←</span>
        <span className="underline-offset-2 group-hover:underline group-focus-visible:underline">
          Back to Sales
        </span>
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-[var(--text-main)] sm:text-3xl">
            <span className="break-all">{displayTitle}</span>
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-sub)] sm:text-base">
            Transaction details
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge
            variant={transactionStatusVariant(String(rawStatus))}
            label={titleCase(rawStatus)}
          />
          <DownloadMenu
            docData={pdfDocData}
            rows={exportRows}
            fileBase={String(referenceId)}
          />
        </div>
      </div>

      {isLoading ? (
        <DetailSkeleton />
      ) : isError || !data ? (
        <div className="mt-7 flex flex-col items-center gap-4 rounded-lg border border-[var(--border)] bg-[var(--card)] px-6 py-16 text-center">
          <XCircle className="size-10 text-[#dc2626]" aria-hidden="true" />
          <p className="text-base font-semibold text-[var(--text-main)]">
            Transaction not found
          </p>
          <p className="text-sm text-[#878787] dark:text-[#b2b7b4]">
            The transaction <span className="font-mono">{id}</span> could not be
            loaded.
          </p>
          <Link href="/sales" className="btn-secondary">
            Back to Sales
          </Link>
        </div>
      ) : (
        <div className="mt-7 space-y-5">
          {/* Policy overview */}
          <SummaryCard
            icon={ShieldCheck}
            title="Policy overview"
            description="Policy identifiers, cover and trip details."
          >
            <SummaryGroup
              title="Policy details"
              className="border-b border-[var(--border)] pb-5"
            >
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Plan">{plan}</Field>
                <Field label="Product">{product}</Field>
                <Field label="Insurer">{insurer}</Field>
                <Field label="Policy number">
                  <span className="break-all">
                    {policyNumber || 'Not available'}
                  </span>
                  {policyNumber && (
                    <CopyReference
                      value={policyNumber}
                      label="Policy number"
                    />
                  )}
                </Field>
                <Field label="Proposal number">
                  <span className="break-all">
                    {proposalNumber || 'Not available'}
                  </span>
                  {proposalNumber && (
                    <CopyReference
                      value={proposalNumber}
                      label="Proposal number"
                    />
                  )}
                </Field>
                <Field label="Policy holder">{holderName}</Field>
              </dl>
            </SummaryGroup>

            <SummaryGroup title="Trip details" className="mt-6">
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
                <Field label="Trip route">{tripRoute}</Field>
                <Field label="Return destination">{returnDestination}</Field>
                <Field label="Travel dates">{travelDates}</Field>
                <Field label="Travellers">{travellerSummary}</Field>
              </dl>
            </SummaryGroup>
          </SummaryCard>

          {/* Payment & commission */}
          <SummaryCard
            icon={CreditCard}
            title="Payment & commission"
            description="Payment records and the commission earned on this policy."
          >
            <SummaryGroup
              title="Payment record"
              className="border-b border-[var(--border)] pb-5"
            >
              <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Reference ID">{referenceId}</Field>
                <Field label="Amount">{formatCurrency(amount)}</Field>
                <Field label="Method">{method}</Field>
                <Field label="Status">{titleCase(rawStatus)}</Field>
                <Field label="Timestamp">{formatTimestamp(timestamp)}</Field>
              </dl>
            </SummaryGroup>

            <SummaryGroup title="Commission" className="mt-6">
              <dl>
                <Field label="Net commission">
                  {formatCurrency(netCommission)}
                </Field>
              </dl>
            </SummaryGroup>
          </SummaryCard>

          {/* Travellers */}
          <SummaryCard
            icon={Users}
            title="Travellers"
            description="Insured travellers on this policy."
            badge={
              travellers.length > 0 ? (
                <StatusBadge
                  variant="info"
                  label={`${travellers.length} ${
                    travellers.length === 1 ? 'traveller' : 'travellers'
                  }`}
                />
              ) : null
            }
          >
            {travellers.length > 0 ? (
              <div
                role="table"
                aria-label="Insured travellers"
                className="overflow-x-auto"
              >
                <div role="rowgroup" className="min-w-[560px]">
                  <div
                    role="row"
                    className="grid grid-cols-5 gap-x-6 pb-3 text-[14px] leading-normal text-[#878787] dark:text-[#b2b7b4]"
                  >
                    <div role="columnheader">No.</div>
                    <div role="columnheader">Full name</div>
                    <div role="columnheader">Birthday</div>
                    <div role="columnheader">Gender</div>
                    <div role="columnheader">Type</div>
                  </div>
                </div>
                <div role="rowgroup" className="min-w-[560px]">
                  {travellers.map((t, idx) => (
                    <div
                      key={idx}
                      role="row"
                      className="grid grid-cols-5 gap-x-6 border-b border-[var(--border)] py-3 text-[16px] leading-6 last:border-b-0"
                    >
                      <div role="cell" className="min-w-0 [overflow-wrap:anywhere]">
                        {idx + 1}
                      </div>
                      <div role="cell" className="min-w-0 [overflow-wrap:anywhere]">
                        {t.name}
                      </div>
                      <div role="cell" className="min-w-0 [overflow-wrap:anywhere]">
                        {t.birthday}
                      </div>
                      <div role="cell" className="min-w-0 [overflow-wrap:anywhere]">
                        {t.gender}
                      </div>
                      <div role="cell" className="min-w-0 [overflow-wrap:anywhere]">
                        {t.type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-base text-[#878787] dark:text-[#b2b7b4]">
                No traveller details recorded for this case.
              </p>
            )}
          </SummaryCard>

          {/* Coverage summary */}
          <SummaryCard
            icon={Umbrella}
            title="Coverage summary"
            description="Benefit limits grouped by type of cover."
            badge={
              coverageCount > 0 ? (
                <StatusBadge
                  variant="info"
                  label={`${coverageCount} benefit ${
                    coverageCount === 1 ? 'group' : 'groups'
                  }`}
                />
              ) : null
            }
          >
            {coverageGroups.length > 0 ? (
              <div className="grid grid-cols-1">
                {coverageGroups.map((group) => (
                  <details
                    key={group.name}
                    className="travel-faq portal-coverage-group rounded-md"
                  >
                    <summary className="travel-faq__question flex min-h-16 cursor-pointer list-none items-center gap-3 px-3 py-5 text-xs font-normal uppercase text-[#b88e28] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#006838] dark:text-[#e4c27f] dark:focus-visible:outline-[#d0e3c8]">
                      <span className="min-w-0 grow leading-6">
                        {group.name}
                      </span>
                      <span className="shrink-0 text-xs font-normal normal-case text-[var(--text-sub)]">
                        {group.items.length}{' '}
                        {group.items.length === 1 ? 'item' : 'items'}
                      </span>
                      <ChevronDown
                        className="travel-faq__chevron size-5 shrink-0"
                        aria-hidden="true"
                      />
                    </summary>
                    <div className="portal-benefit-list overflow-hidden">
                      <dl className="grid">
                        {group.items.map((item, idx) => (
                          <div
                            key={`${item.name}-${idx}`}
                            className="grid min-w-0 items-start gap-1 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(130px,.6fr)] sm:gap-6"
                          >
                            <dt className="text-[14px] leading-[normal] text-[#878787] dark:text-[#b2b7b4]">
                              {item.name}
                            </dt>
                            <dd className="text-[16px] leading-6 [overflow-wrap:anywhere] text-[var(--text-main)]">
                              {item.limit}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <p className="text-base text-[#878787] dark:text-[#b2b7b4]">
                No coverage details available for this case.
              </p>
            )}
          </SummaryCard>

          {/* Add-ons */}
          <SummaryCard
            icon={Plus}
            title="Add-ons"
            description="Additional cover included with this policy."
            badge={
              addonItems.length > 0 ? (
                <StatusBadge
                  variant="info"
                  label={`${addonItems.length} add-on${
                    addonItems.length === 1 ? '' : 's'
                  }`}
                />
              ) : null
            }
          >
            {addonItems.length > 0 ? (
              <SummaryGroup title="Additional benefits">
                <div className="portal-benefit-list overflow-hidden">
                  <dl className="grid">
                    {addonItems.map((item, idx) => (
                      <div
                        key={`${item.name}-${idx}`}
                        className="grid min-w-0 items-start gap-1 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(130px,.6fr)] sm:gap-6"
                      >
                        <dt className="text-[14px] leading-[normal] text-[#878787] dark:text-[#b2b7b4]">
                          {item.name}
                        </dt>
                        <dd className="text-[16px] leading-6 [overflow-wrap:anywhere] text-[var(--text-main)]">
                          {item.limit}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </SummaryGroup>
            ) : (
              <p className="text-base text-[#878787] dark:text-[#b2b7b4]">
                No add-ons selected for this case.
              </p>
            )}
          </SummaryCard>
        </div>
      )}
    </div>
  )
}
