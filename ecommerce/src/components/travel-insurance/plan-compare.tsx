'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import {
  Circle,
  HeartPulse,
  LifeBuoy,
  Luggage,
  Plane,
  Scale,
  ShieldAlert,
  Star,
  X,
} from 'lucide-react'
import {
  getComparisonRowConfigs,
  groupBenefitsByCanonical,
  resolveLimitDisplay,
} from '@/utils/travel-benefits-helpers'
import type { InsuranceBenefit, InsurancePlan } from '@/types/plan'

export const MAX_COMPARE = 3

export type ComparePlan = {
  id: string
  carrierName: string
  planName: string
  duePremium: number
  currency: string
  logoUrl?: string
  logoSize: { width: number; height: number }
  redirectUrl?: string
  rawPlan: InsurancePlan
}

const ICONS: Record<string, React.ElementType> = {
  HeartPulse,
  ShieldAlert,
  Luggage,
  Plane,
  LifeBuoy,
  Scale,
  Star,
  Circle,
}

const money = (n: number) =>
  n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const compactAmount = (value: string) => {
  const n = Number(value)
  if (Number.isNaN(n)) return value
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`
  return n.toLocaleString('en-PH', { maximumFractionDigits: 0 })
}

const symbol = (currency: string) =>
  currency === 'PHP' ? '₱' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : `${currency} `

const limitText = (b: InsuranceBenefit, currency: string) => {
  const d = resolveLimitDisplay(b)
  if (d.kind === 'amount') return `${symbol(currency)}${compactAmount(d.value)}`
  if (d.kind === 'badge') return d.label
  if (d.kind === 'text') return d.text
  return '—'
}

const rank = (b: InsuranceBenefit) => {
  const d = resolveLimitDisplay(b)
  return d.kind === 'amount' ? Number(d.value) : d.kind === 'none' ? -1 : 9_999_999
}

function summarize(benefits: InsuranceBenefit[] | undefined, currency: string) {
  if (!benefits?.length) return null
  const top = [...benefits].sort((a, b) => rank(b) - rank(a))[0]
  return {
    text: limitText(top, currency),
    more: benefits.length - 1,
    items: benefits.map((b) => {
      const d = resolveLimitDisplay(b)
      const note = d.kind === 'amount' || d.kind === 'badge' ? d.qualifier : undefined
      return { name: b.BenefitDesc, value: limitText(b, currency), note: note?.trim() && note !== '0' ? note : undefined }
    }),
  }
}

function useCompareRows(plans: ComparePlan[]) {
  return useMemo(() => {
    const rows = getComparisonRowConfigs(plans.map((p) => p.rawPlan))
    const maps = new Map(plans.map((p) => [p.id, groupBenefitsByCanonical(p.rawPlan)]))
    return { rows, maps }
  }, [plans])
}

function CompareCell({
  benefits,
  currency,
}: {
  benefits?: InsuranceBenefit[]
  currency: string
}) {
  const s = summarize(benefits, currency)
  if (!s) return <span className="travel-compare-empty">—</span>
  return (
    <span className="travel-compare-cell">
      <strong>{s.text}</strong>
      {s.more > 0 ? (
        <details className="travel-compare-details">
          <summary>+{s.more} more</summary>
          <ul>
            {s.items.map((it, i) => (
              <li key={i}>
                <span className="font-medium">{it.name}:</span> {it.value}
                {it.note && <span className="travel-benefit-note">{it.note}</span>}
              </li>
            ))}
          </ul>
        </details>
      ) : (
        s.items[0]?.note && <small>{s.items[0].note}</small>
      )}
    </span>
  )
}

function CompareLogo({ plan }: { plan: ComparePlan }) {
  if (!plan.logoUrl) return <p className="travel-provider-name">{plan.carrierName}</p>
  return (
    <div className="travel-insurer-logo">
      <Image
        src={plan.logoUrl}
        alt={plan.carrierName}
        width={plan.logoSize.width}
        height={plan.logoSize.height}
        unoptimized
      />
    </div>
  )
}

type ChooseProps = { onChoose: (id: string) => void }

/** lg: side-by-side cards (mockup "Compare your options"). */
export function CompareGrid({
  plans,
  onRemove,
  onChoose,
}: { plans: ComparePlan[]; onRemove: (id: string) => void } & ChooseProps) {
  const { rows, maps } = useCompareRows(plans)
  return (
    <section className="travel-comparison" aria-labelledby="compare-title">
      <h2 id="compare-title" className="text-lg font-semibold">
        Compare your options
      </h2>
      <p className="travel-comparison__hint">
        Select up to {MAX_COMPARE} plans below to review their benefits side by side.
      </p>
      {plans.length > 0 && (
        <div className="travel-comparison__grid">
          {plans.map((plan) => (
            <article key={plan.id} aria-label={plan.planName}>
              <CompareLogo plan={plan} />
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold">{plan.planName}</h3>
                <button
                  type="button"
                  onClick={() => onRemove(plan.id)}
                  aria-label={`Remove ${plan.planName}`}
                  className="travel-comparison__remove"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
              <p className="my-4 text-lg font-bold">
                {plan.currency} {money(plan.duePremium)}
              </p>
              <dl>
                {rows.map((row) => (
                  <div key={row.label} className="travel-comparison__row">
                    <dt>{row.label}</dt>
                    <dd>
                      <CompareCell
                        benefits={maps.get(plan.id)?.get(row.label)}
                        currency={plan.rawPlan.Currency || 'PHP'}
                      />
                    </dd>
                  </div>
                ))}
              </dl>
              <button type="button" onClick={() => onChoose(plan.id)} className="travel-apply mt-4">
                Choose this plan <span aria-hidden>→</span>
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

/** < lg: sticky bottom bar. */
export function MobileCompareBar({
  count,
  onCompare,
  onClear,
}: {
  count: number
  onCompare: () => void
  onClear: () => void
}) {
  if (count === 0) return null
  return (
    <div className="travel-compare-bar">
      <button type="button" onClick={onClear} className="travel-compare-bar__clear">
        Clear
      </button>
      <button type="button" onClick={onCompare} className="travel-apply travel-compare-bar__go">
        Compare ({count})
      </button>
    </div>
  )
}

/** < lg: full-screen sheet with horizontally scrollable matrix. */
export function CompareSheet({
  open,
  plans,
  onClose,
  onClear,
  onChoose,
}: {
  open: boolean
  plans: ComparePlan[]
  onClose: () => void
  onClear: () => void
} & ChooseProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const { rows, maps } = useCompareRows(plans)

  const onScroll = () => {
    const el = bodyRef.current
    const col = el?.querySelector('thead th:nth-child(2)') as HTMLElement | null
    if (!el || !col) return
    setActive(Math.min(plans.length - 1, Math.round(el.scrollLeft / col.offsetWidth)))
  }
  const slideTo = (i: number) => {
    const el = bodyRef.current
    const col = el?.querySelector('thead th:nth-child(2)') as HTMLElement | null
    if (el && col) el.scrollTo({ left: i * col.offsetWidth, behavior: 'smooth' })
  }

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const mq = window.matchMedia('(min-width: 1024px)')
    const onMq = () => mq.matches && onClose()
    document.addEventListener('keydown', onKey)
    mq.addEventListener('change', onMq)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
      mq.removeEventListener('change', onMq)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="travel-compare-sheet" role="dialog" aria-modal="true" aria-label="Compare plans">
      <header className="travel-compare-sheet__header">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close compare"
          className="travel-compare-sheet__close"
        >
          <X className="size-5" aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold">Compare plans</h2>
          <p className="travel-comparison__hint !mt-0.5 !text-xs">
            {plans.length} {plans.length === 1 ? 'plan' : 'plans'} selected
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            onClear()
            onClose()
          }}
          className="travel-compare-bar__clear"
        >
          Clear
        </button>
      </header>
      <div ref={bodyRef} onScroll={onScroll} className="travel-compare-sheet__body">
        {plans.length < 2 ? (
          <div className="travel-compare-sheet__empty">
            <p>Select at least 2 plans using the checkboxes, then tap Compare.</p>
            <button type="button" onClick={onClose} className="travel-apply !w-auto px-6">
              Back to plans
            </button>
          </div>
        ) : (
          <table className="travel-compare-matrix">
            <thead>
              <tr>
                <th scope="col" className="travel-compare-matrix__corner">
                  Coverage
                </th>
                {plans.map((plan) => (
                  <th key={plan.id} scope="col">
                    <CompareLogo plan={plan} />
                    <span className="travel-compare-matrix__name">{plan.planName}</span>
                    <span className="travel-compare-matrix__price">
                      {plan.currency} {money(plan.duePremium)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onChoose(plan.id)}
                      className="travel-apply travel-compare-matrix__choose"
                    >
                      Choose
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const Icon = ICONS[row.icon] ?? Circle
                return (
                  <tr key={row.label}>
                    <th scope="row">
                      <Icon className="size-3.5 shrink-0" aria-hidden />
                      {row.label}
                    </th>
                    {plans.map((plan) => (
                      <td key={plan.id}>
                        <CompareCell
                          benefits={maps.get(plan.id)?.get(row.label)}
                          currency={plan.rawPlan.Currency || 'PHP'}
                        />
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      {plans.length > 1 && (
        <footer className="travel-compare-sheet__pager">
          <span>Swipe to compare</span>
          <div className="flex">
            {plans.map((plan, i) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => slideTo(i)}
                aria-label={`Show ${plan.planName}`}
                aria-current={i === active}
                className="travel-compare-sheet__dot"
              />
            ))}
          </div>
        </footer>
      )}
    </div>
  )
}
