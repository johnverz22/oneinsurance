'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { ArrowLeft, Minus, Pencil, Plus } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PrimaryActionButton } from '@/components/ui/insurance-shared'
import { CountryFlag } from '@/components/ui/country-flag'
import { TravelCoverageMap } from '@/constants/travel-coverage'
import { useTravelInsuranceStore } from '@/store/travel-insurance-store'
import {
  formatDays,
  formatTravelers,
  formatTripRange,
  getTripDays,
  titleCase,
} from '@/utils/trip-summary'

const toDateInputValue = (d: Date) => format(d, 'yyyy-MM-dd')

function TravelerStepper({
  id,
  label,
  value,
  min,
  onChange,
}: {
  id: string
  label: string
  value: number
  min: number
  onChange: (v: number) => void
}) {
  const btn =
    'border-border bg-card text-foreground focus-visible:ring-ring inline-flex size-11 items-center justify-center rounded-full border outline-none focus-visible:ring-2 disabled:opacity-40'
  return (
    <div className="flex items-center justify-between gap-3">
      <Label id={id} className="text-foreground text-sm font-medium">
        {label}
      </Label>
      <div
        className="flex items-center gap-3"
        role="group"
        aria-labelledby={id}
      >
        <button
          type="button"
          className={btn}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          aria-label={`Decrease ${label.toLowerCase()}`}
        >
          <Minus className="size-4" aria-hidden />
        </button>
        <span className="text-foreground w-6 text-center text-sm font-semibold tabular-nums">
          {value}
        </span>
        <button
          type="button"
          className={btn}
          disabled={value >= 9}
          onClick={() => onChange(value + 1)}
          aria-label={`Increase ${label.toLowerCase()}`}
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}

export function TripStickyBar({
  onBack,
  onApply,
}: {
  onBack: () => void
  onApply: () => void
}) {
  const { travelDetails, updateTravelDetails } = useTravelInsuranceStore()
  const headerRef = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(false)

  // Sheet-local draft state
  const firstDetail = travelDetails.travelDetailList?.[0]
  const [destination, setDestination] = useState('')
  const [departure, setDeparture] = useState('')
  const [returning, setReturning] = useState('')
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)

  // Expose the pinned bar height so anchored scrolling never hides content
  // underneath it (scroll-padding-top), and clear it on unmount.
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const root = document.documentElement
    const update = () =>
      root.style.setProperty('--trip-bar-h', `${el.offsetHeight}px`)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      ro.disconnect()
      root.style.removeProperty('--trip-bar-h')
    }
  }, [])

  const openEditor = () => {
    const list = travelDetails.travelDetailList ?? []
    setDestination(
      (list[0]?.TravelCountry ?? '').toUpperCase()
    )
    setDeparture(toDateInputValue(new Date(travelDetails.departureDate)))
    setReturning(
      toDateInputValue(
        new Date(travelDetails.returnDate ?? travelDetails.departureDate)
      )
    )
    setAdults(travelDetails.noOfAdults)
    setChildren(travelDetails.noOfChildren)
    setOpen(true)
  }

  const destinations = useMemo(
    () =>
      Object.entries(TravelCoverageMap).flatMap(([area, countries]) =>
        countries.map((c) => ({ area, code: c.code, name: c.name, flag: c.flag }))
      ),
    []
  )

  const applyChanges = () => {
    const selected = destinations.find((d) => d.code === destination)
    const list = [...(travelDetails.travelDetailList ?? [])]
    if (selected && list[0]) {
      list[0] = {
        ...list[0],
        TravelCountry: selected.code,
        TravelCoverageArea: selected.area,
      }
    }
    const departureDate = departure ? new Date(`${departure}T00:00:00`) : travelDetails.departureDate
    const returnDate = returning ? new Date(`${returning}T00:00:00`) : travelDetails.returnDate
    updateTravelDetails({
      travelDetailList: list,
      departureDate,
      returnDate,
      noOfAdults: adults,
      noOfChildren: children,
    })
    setOpen(false)
    onApply()
  }

  const countryName = (code?: string) =>
    destinations.find((d) => d.code === code)?.name ?? titleCase(code)
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
    <>
      <header
        ref={headerRef}
        className="border-border bg-card sticky top-0 z-30 border-b pt-[env(safe-area-inset-top)] lg:hidden"
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-1 px-2 sm:px-4">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to search"
            className="text-foreground focus-visible:ring-ring inline-flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="text-foreground truncate text-sm leading-tight font-semibold">
              {origin} → {destinationLabel}
            </p>
            <p className="text-muted-foreground truncate text-xs leading-snug">
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
            </p>
          </div>
          <button
            type="button"
            onClick={openEditor}
            aria-haspopup="dialog"
            className="border-border text-foreground hover:border-primary/40 hover:text-primary focus-visible:ring-ring motion-safe:transition-colors inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-xs font-semibold outline-none focus-visible:ring-2"
          >
            <Pencil className="size-3.5" aria-hidden />
            Edit
          </button>
        </div>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="motion-reduce:animate-none motion-reduce:transition-none max-h-[85vh] overflow-y-auto rounded-t-2xl px-4 pb-6"
        >
          <SheetHeader className="px-0">
            <SheetTitle>Edit your trip</SheetTitle>
            <SheetDescription>
              Update your destination, dates and travelers, then search again.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-5 px-0">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="trip-destination">Destination</Label>
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger
                  id="trip-destination"
                  className="min-h-11 w-full"
                >
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TravelCoverageMap).map(([area, countries]) => (
                    <SelectGroup key={area}>
                      <SelectLabel>{titleCase(area)}</SelectLabel>
                      {countries.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          <CountryFlag flag={c.flag} className="mr-1.5 inline-block" />{' '}
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="trip-departure">Departure</Label>
                <Input
                  id="trip-departure"
                  type="date"
                  className="min-h-11"
                  value={departure}
                  min={toDateInputValue(new Date())}
                  onChange={(e) => {
                    setDeparture(e.target.value)
                    if (returning && e.target.value > returning) {
                      setReturning(e.target.value)
                    }
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="trip-return">Return</Label>
                <Input
                  id="trip-return"
                  type="date"
                  className="min-h-11"
                  value={returning}
                  min={departure || toDateInputValue(new Date())}
                  onChange={(e) => setReturning(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <TravelerStepper
                id="trip-adults-label"
                label="Adults"
                value={adults}
                min={1}
                onChange={setAdults}
              />
              <TravelerStepper
                id="trip-children-label"
                label="Children"
                value={children}
                min={0}
                onChange={setChildren}
              />
            </div>

            <PrimaryActionButton
              size="lg"
              className="mt-1 min-h-12 w-full text-sm font-semibold"
              onClick={applyChanges}
              disabled={!destination || !departure || !returning}
            >
              Update search
            </PrimaryActionButton>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
