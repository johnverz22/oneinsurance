'use client'

import { useEffect, useRef, useState } from 'react'
import { CalendarDays, MapPin, SlidersHorizontal, Undo2, Users } from 'lucide-react'
import { format, isSameMonth } from 'date-fns'
import { useTravelInsuranceStore } from '@/store/travel-insurance-store'
import { formatTripRange, countryLabel } from '@/utils/trip-summary'

const FALLBACK_DATE = new Date('2000-01-01')

export function TripSummary({
  onEdit,
  hideFloatingBelowLg = false,
  readOnlyLabel,
  premium,
}: {
  onEdit: () => void
  hideFloatingBelowLg?: boolean
  readOnlyLabel?: string
  premium?: string
}) {
  const { travelDetails } = useTravelInsuranceStore()
  const ref = useRef<HTMLDivElement>(null)
  const [floating, setFloating] = useState(false)

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
  const destinations = (hasReturnLeg ? legs.slice(0, -1) : legs)
    .map((d) => countryLabel(d.TravelCountry))
    .join(', ')
  const travellers = (travelDetails.noOfAdults || 1) + (travelDetails.noOfChildren || 0)
  const dates = formatTripRange(
    new Date(travelDetails.departureDate || FALLBACK_DATE),
    new Date(travelDetails.returnDate || FALLBACK_DATE)
  )

  const departure = new Date(travelDetails.departureDate || FALLBACK_DATE)
  const returning = new Date(travelDetails.returnDate || FALLBACK_DATE)
  const shortDates = isSameMonth(departure, returning)
    ? `${format(departure, 'MMM d')}–${format(returning, 'd')}`
    : `${format(departure, 'MMM d')} – ${format(returning, 'MMM d')}`
  const shortOrigin = origin === 'Philippines' ? 'PH' : origin
  const [firstDest, ...moreDest] = destinations.split(', ')
  const compactSummary = `${shortOrigin} → ${firstDest}${moreDest.length ? ` +${moreDest.length}` : ''} ↩ ${returnLabel} · ${shortDates} · ${travellers} ${travellers === 1 ? 'traveller' : 'travellers'}`

  const items = (
    <>
      <div>
        <MapPin className="size-5" aria-hidden />
        <span>
          <span className="travel-trip-label">Trip route</span>
          {[origin, destinations, returnLabel].join(' → ')}
        </span>
      </div>
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
      {readOnlyLabel ? (
        <span className="travel-trip-status">{readOnlyLabel}</span>
      ) : (
        <button type="button" onClick={onEdit} className="travel-modify">
          <SlidersHorizontal className="size-4" aria-hidden />
          Modify search
        </button>
      )}
      {premium && (
        <div className="travel-trip-premium" aria-live="polite" aria-atomic="true">
          <span>
            <span className="travel-trip-label">Total premium</span>
            <strong>{premium}</strong>
          </span>
        </div>
      )}
    </>
  )

  return (
    <>
      <div ref={ref} className="travel-trip-summary max-sm:hidden">
        {items}
      </div>
      {!hideFloatingBelowLg && (
        <aside
          aria-label="Your trip summary"
          onClick={readOnlyLabel ? undefined : onEdit}
          className="travel-trip-bar sm:hidden"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <MapPin className="size-4 shrink-0 text-[var(--primary)] dark:text-[#d0e3c8]" aria-hidden />
            {readOnlyLabel ? (
              <span className="travel-trip-bar__stack">
                <span className="travel-trip-bar__text">{compactSummary}</span>
                <span className="travel-trip-bar__status">{readOnlyLabel}</span>
              </span>
            ) : (
              <span className="travel-trip-bar__text">{compactSummary}</span>
            )}
          </div>
          {readOnlyLabel ? (
            premium ? (
              <span className="travel-trip-bar__total">
                <span>Total premium</span>
                <strong>{premium}</strong>
              </span>
            ) : null
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
        </aside>
      )}
      {floating && (
        <aside
          aria-label="Your trip summary"
          className={`travel-trip-summary travel-trip-summary--floating max-sm:hidden${hideFloatingBelowLg ? ' max-lg:hidden' : ''}`}
        >
          {items}
        </aside>
      )}
    </>
  )
}
