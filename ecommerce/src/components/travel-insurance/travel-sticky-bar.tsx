'use client'

import { useEffect, useRef, useState } from 'react'
import {
  CalendarDays,
  ChevronDown,
  Lock,
  MapPin,
  SlidersHorizontal,
  Undo2,
  Users,
} from 'lucide-react'
import { useTravelInsuranceStore } from '@/store/travel-insurance-store'
import { formatTripRange, countryLabel } from '@/utils/trip-summary'

const FALLBACK_DATE = new Date('2000-01-01')

export function TripSummary({
  onEdit,
  hideFloatingBelowLg = false,
  hideMobile = false,
  readOnlyLabel,
  premium,
}: {
  onEdit: () => void
  hideFloatingBelowLg?: boolean
  hideMobile?: boolean
  readOnlyLabel?: string
  premium?: string
}) {
  const { travelDetails } = useTravelInsuranceStore()
  const ref = useRef<HTMLDivElement>(null)
  const [floating, setFloating] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setFloating(!entry.isIntersecting), {
      threshold: 0,
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const detail = travelDetails.travelDetailList?.[0]
  const origin = countryLabel(detail?.PlaceOfOrgin) || 'Philippines'
  const legs = travelDetails.travelDetailList ?? []
  const hasReturnLeg = Boolean(travelDetails.returnDestination) && legs.length > 1
  const returnDestination = hasReturnLeg ? countryLabel(legs[legs.length - 1].TravelCountry) : ''
  const returnLabel = returnDestination || 'Philippines'
  const destLabels = (hasReturnLeg ? legs.slice(0, -1) : legs)
    .map((d) => countryLabel(d.TravelCountry))
    .filter(Boolean)
  const routeNodes = [origin, ...destLabels, returnLabel].filter(Boolean)
  const fullRoute = routeNodes.join(' → ')
  const travellers = (travelDetails.noOfAdults || 1) + (travelDetails.noOfChildren || 0)
  const dates = formatTripRange(
    new Date(travelDetails.departureDate || FALLBACK_DATE),
    new Date(travelDetails.returnDate || FALLBACK_DATE)
  )

  const routeItem = (text: string, fullText?: string) => (
    <div className="travel-trip-route">
      <MapPin className="size-5" aria-hidden />
      <span {...(fullText ? { title: fullText, 'aria-label': fullText, tabIndex: 0 } : {})}>
        <span className="travel-trip-label">Trip route</span>
        <span className="travel-trip-route-value">{text}</span>
      </span>
      {fullText && <span className="travel-route-tooltip" role="tooltip">{fullText}</span>}
    </div>
  )

  const factItems = (
    <>
      <div>
        <Undo2 className="size-5" aria-hidden />
        <span>
          <span className="travel-trip-label">Return destination</span>
          {returnLabel}
        </span>
      </div>
      <div>
        <CalendarDays className="size-5" aria-hidden />
        <span>
          <span className="travel-trip-label">Travel dates</span>
          {dates}
        </span>
      </div>
      <div>
        <Users className="size-5" aria-hidden />
        <span>
          <span className="travel-trip-label">Travellers</span>
          {travellers} {travellers === 1 ? 'traveller' : 'travellers'}
        </span>
      </div>
    </>
  )

  const modifyButton = (
    <button type="button" onClick={onEdit} className="travel-modify">
      <SlidersHorizontal className="size-4" aria-hidden />
      Modify search
    </button>
  )

  const action = readOnlyLabel ? (
    <span className="travel-trip-status">{readOnlyLabel}</span>
  ) : (
    modifyButton
  )

  const floatingAction = readOnlyLabel ? (
    <span className="travel-trip-status" title={readOnlyLabel} aria-label={readOnlyLabel} tabIndex={0}>
      <Lock className="size-3.5" aria-hidden />
      {readOnlyLabel}
    </span>
  ) : (
    modifyButton
  )

  const premiumBlock = premium && (
    <div className="travel-trip-premium" aria-live="polite" aria-atomic="true">
      <span>
        <span className="travel-trip-label">Total premium</span>
        <strong>{premium}</strong>
      </span>
    </div>
  )

  return (
    <>
      <div ref={ref} className="travel-trip-summary max-md:hidden">
        {routeItem(fullRoute)}
        {factItems}
        {action}
      </div>
      {!hideMobile && !hideFloatingBelowLg && (
        <aside
          aria-label="Your trip summary"
          className={`travel-trip-bar md:hidden${!readOnlyLabel ? ' travel-trip-bar--compact' : ''}${detailsOpen ? ' is-open' : ''}`}
        >
          <div className="travel-trip-bar__row">
            <MapPin
              className="size-4 shrink-0 text-[var(--primary)] dark:text-[#d0e3c8]"
              aria-hidden
            />
            <span className="travel-trip-bar__text" title={fullRoute} aria-label={fullRoute} tabIndex={0}>
              {fullRoute}
            </span>
            <button
              type="button"
              className="travel-trip-bar__toggle"
              aria-expanded={detailsOpen}
              aria-label={detailsOpen ? 'Hide trip details' : 'View trip details'}
              onClick={(e) => {
                e.stopPropagation()
                setDetailsOpen((v) => !v)
              }}
            >
              <ChevronDown className="size-4" aria-hidden />
            </button>
            {premium ? (
              <span className="travel-trip-bar__total">
                <span>Total premium</span>
                <strong>{premium}</strong>
              </span>
            ) : null}
            {readOnlyLabel ? (
              <span className="travel-trip-bar__status" title={readOnlyLabel}>
                {readOnlyLabel}
              </span>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
                className="travel-trip-bar__edit"
              >
                Modify
              </button>
            )}
          </div>
          <div className="travel-trip-bar__details" hidden={!detailsOpen}>
            {dates} · {travellers} {travellers === 1 ? 'traveller' : 'travellers'}
          </div>
        </aside>
      )}
      {floating && (
        <aside
          aria-label="Your trip summary"
          className={`travel-trip-summary travel-trip-summary--floating max-md:hidden${hideFloatingBelowLg ? ' max-lg:hidden' : ''}`}
        >
          {routeItem(fullRoute, fullRoute)}
          {factItems}
          <div className="travel-trip-end">
            {premiumBlock}
            {floatingAction}
          </div>
        </aside>
      )}
    </>
  )
}
