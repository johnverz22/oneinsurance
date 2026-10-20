'use client'

import { useEffect, useRef } from 'react'
import { useTravelInsuranceStore } from '@/store/travel-insurance-store'
import { TravelCoverageMap } from '@/constants/travel-coverage'
import {
  formatDays,
  formatTravelers,
  formatTripRange,
  getTripDays,
  titleCase,
} from '@/utils/trip-summary'

const countryNames: Record<string, string> = Object.fromEntries(
  Object.values(TravelCoverageMap).flatMap((countries) =>
    countries.map((c) => [c.code, c.name])
  )
)

export function TripStickyBar({ onEdit }: { onEdit: () => void }) {
  const { travelDetails } = useTravelInsuranceStore()
  const headerRef = useRef<HTMLElement>(null)
  const firstDetail = travelDetails.travelDetailList?.[0]

  // Expose the pinned bar height so anchored scrolling never hides content
  // underneath it (scroll-padding-top), and clear it on unmount.
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const root = document.documentElement
    const update = () =>
      root.style.setProperty(
        '--trip-bar-h',
        `${el.offsetHeight + (parseFloat(getComputedStyle(el).top) || 0)}px`
      )
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      ro.disconnect()
      root.style.removeProperty('--trip-bar-h')
    }
  }, [])

  const countryName = (code?: string) =>
    (code && countryNames[code]) || titleCase(code)
  const origin = countryName(firstDetail?.PlaceOfOrgin) || 'Philippines'
  const destinationLabel =
    travelDetails.travelDetailList
      ?.map((d) => countryName(d.TravelCountry))
      .filter(Boolean)
      .join(', ') || 'Destination'
  const tripDays = getTripDays(
    travelDetails.departureDate,
    travelDetails.returnDate
  )

  return (
      <header
        ref={headerRef}
        className="border-border bg-card sticky top-[calc(37px+env(safe-area-inset-top))] z-30 border-b sm:hidden"
      >
        <div className="mx-auto flex h-[50px] max-w-7xl items-center gap-2 px-4 sm:px-6">
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit search"
            className="focus-visible:ring-ring min-h-11 min-w-0 flex-1 rounded-md text-left outline-none focus-visible:ring-2"
          >
            <span className="text-foreground block truncate text-base leading-5 font-semibold">
              {origin} → {destinationLabel}
            </span>
            <span className="text-muted-foreground block truncate text-[13px] leading-[18px]">
              {formatTripRange(
                travelDetails.departureDate,
                travelDetails.returnDate,
                true
              )}{' '}
              · {formatDays(tripDays)} ·{' '}
              {formatTravelers(
                travelDetails.noOfAdults,
                travelDetails.noOfChildren
              )}
            </span>
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="text-primary focus-visible:ring-ring -mr-2 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md px-2 text-sm font-semibold outline-none focus-visible:ring-2"
          >
            Edit<span className="sr-only"> search</span>
          </button>
        </div>
      </header>
  )
}
