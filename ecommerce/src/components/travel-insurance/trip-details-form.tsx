'use client'

import { useState, useRef, useEffect, useMemo, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plane, Calendar, Users, MapPin, ArrowRight } from 'lucide-react'
import { useTravelInsuranceStore } from '@/store/travel-insurance-store'
import { TravelCoverageMap } from '@/constants/travel-coverage'
import { getNormalizedTravelCoverages } from '@/utils/travel-coverages-helpers'
import {
  DestinationCombobox,
  DestinationOption,
} from '@/components/travel-insurance/destination-combobox'
import { travelInsuranceSchema } from '@/types/travel-insurance/travel-insurance-request'
import { cn } from '@/lib/utils'

interface TripDetailsFormProps {
  agentCode: string
  onOpenRetrieve?: () => void
  variant?: 'page' | 'modal'
  onSubmitted?: () => void
}

export function TripDetailsForm({
  agentCode,
  onOpenRetrieve,
  variant = 'page',
  onSubmitted,
}: TripDetailsFormProps) {
  const router = useRouter()
  const {
    travelDetails,
    updateTravelDetails,
    setInsurancePlans,
    setClientRequest,
    setFormModified,
    resetQuoteRefetchCount,
    setStep,
  } = useTravelInsuranceStore()

  // Hydration guard — avoid SSR mismatch for date inputs / persisted state
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const normalizedTravelDetails = useMemo(() => {
    const details = { ...travelDetails }
    if (details.departureDate && typeof details.departureDate === 'string') {
      details.departureDate = new Date(details.departureDate)
    }
    if (details.returnDate && typeof details.returnDate === 'string') {
      details.returnDate = new Date(details.returnDate)
    }
    if (details.dateOfBirth && typeof details.dateOfBirth === 'string') {
      details.dateOfBirth = new Date(details.dateOfBirth)
    }
    return details
  }, [travelDetails])

  const storedArea = normalizedTravelDetails.travelDetailList?.[0]?.TravelCoverageArea
  const isStoredDomestic = storedArea === 'DOMESTIC'

  // Form states matching mockup
  const [tripType, setTripType] = useState<'single' | 'annual'>(
    normalizedTravelDetails.isAnnualMultiTrip ? 'annual' : 'single'
  )
  const [coverageType, setCoverageType] = useState<'individual' | 'family'>(
    normalizedTravelDetails.travelType === 'FAMILY' ? 'family' : 'individual'
  )
  const [destinationType, setDestinationType] = useState<'international' | 'domestic'>(
    isStoredDomestic ? 'domestic' : 'international'
  )
  const [countryCodes, setCountryCodes] = useState<string[]>(
    (normalizedTravelDetails.travelDetailList ?? [])
      .map((d) => d?.TravelCountry)
      .filter((c): c is string => Boolean(c && c.trim()))
  )
  const [originCode, setOriginCode] = useState<string>(
    normalizedTravelDetails.travelDetailList?.[0]?.PlaceOfOrgin || 'PHILIPPINES'
  )

  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0]
  }, [])

  const defaultDepartureStr = useMemo(() => {
    if (
      normalizedTravelDetails.departureDate instanceof Date &&
      !isNaN(normalizedTravelDetails.departureDate.getTime())
    ) {
      const dep = normalizedTravelDetails.departureDate.toISOString().split('T')[0]
      if (dep >= todayStr) return dep
    }
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().split('T')[0]
  }, [normalizedTravelDetails.departureDate, todayStr])

  const defaultReturnStr = useMemo(() => {
    if (
      normalizedTravelDetails.returnDate instanceof Date &&
      !isNaN(normalizedTravelDetails.returnDate.getTime())
    ) {
      const ret = normalizedTravelDetails.returnDate.toISOString().split('T')[0]
      if (ret >= defaultDepartureStr) return ret
    }
    const d = new Date()
    d.setDate(d.getDate() + 14)
    return d.toISOString().split('T')[0]
  }, [normalizedTravelDetails.returnDate, defaultDepartureStr])

  // DO NOT prefill birthdate to 01/01/1990 — leave empty unless already saved
  const defaultDobStr = useMemo(() => {
    if (
      normalizedTravelDetails.dateOfBirth instanceof Date &&
      !isNaN(normalizedTravelDetails.dateOfBirth.getTime())
    ) {
      return normalizedTravelDetails.dateOfBirth.toISOString().split('T')[0]
    }
    return ''
  }, [normalizedTravelDetails.dateOfBirth])

  const [departure, setDeparture] = useState<string>(defaultDepartureStr)
  const [returnDate, setReturnDate] = useState<string>(defaultReturnStr)
  const [birthDate, setBirthDate] = useState<string>(defaultDobStr)
  const [adults, setAdults] = useState<number>(normalizedTravelDetails.noOfAdults || 1)
  const [children, setChildren] = useState<number>(normalizedTravelDetails.noOfChildren || 0)

  // Unchecked by default
  const [reviewed, setReviewed] = useState<boolean>(false)
  const [travellersOpen, setTravellersOpen] = useState<boolean>(false)
  const [formError, setFormError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const travellersRef = useRef<HTMLDivElement>(null)
  const destTypeGroupRef = useRef<HTMLDivElement>(null)

  // Format date display (e.g. "20 Oct 2026") to avoid MM/DD ambiguity
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return ''
    try {
      const parts = dateStr.split('-')
      if (parts.length !== 3) return ''
      const y = Number(parts[0])
      const m = Number(parts[1])
      const d = Number(parts[2])
      if (!y || !m || !d) return ''
      const dt = new Date(Date.UTC(y, m - 1, d))
      return dt.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
    } catch {
      return ''
    }
  }

  // Build destination options from the same TravelCoverageMap used by ecommerce
  const allDestinationOptions = useMemo<DestinationOption[]>(() => {
    const normalized = getNormalizedTravelCoverages(TravelCoverageMap)
    return normalized.map((opt) => {
      const area =
        Object.keys(TravelCoverageMap).find((a) =>
          TravelCoverageMap[a as keyof typeof TravelCoverageMap].some(
            (c) => c.code === opt.value
          )
        ) || 'WORLD'
      return {
        value: opt.value,
        label: opt.label,
        area,
        flag: opt.flag,
      }
    })
  }, [])

  const fromOptions = useMemo(
    () =>
      allDestinationOptions
        .filter((opt) => opt.area === 'DOMESTIC' || opt.value === 'PHILIPPINES')
        .map((opt) => ({ ...opt, area: 'DOMESTIC' })),
    [allDestinationOptions]
  )

  const destinationOptions = useMemo(() => {
    if (destinationType === 'domestic') {
      return allDestinationOptions.filter((opt) => opt.area === 'DOMESTIC')
    }
    return allDestinationOptions.filter(
      (opt) => opt.area !== 'DOMESTIC' && opt.value !== 'PHILIPPINES'
    )
  }, [allDestinationOptions, destinationType])

  // Close travellers popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (travellersRef.current && !travellersRef.current.contains(e.target as Node)) {
        setTravellersOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const travellerCount = adults + children
  const effectiveCoverageType = travellerCount > 1 ? 'family' : coverageType
  const travellerSummary = `${adults} adult${adults > 1 ? 's' : ''}${
    children > 0 ? ` · ${children} child${children === 1 ? '' : 'ren'}` : ''
  }`

  // Resolve the coverage area from the selected country code
  const resolveCoverageArea = (code: string): string => {
    if (destinationType === 'domestic') return 'DOMESTIC'
    for (const area of ['APAC', 'SCHENGEN', 'WORLD']) {
      const match = TravelCoverageMap[area as keyof typeof TravelCoverageMap]?.find(
        (c) => c.code === code
      )
      if (match) return area
    }
    return 'WORLD'
  }

  const handleTripTypeChange = (type: 'single' | 'annual') => {
    setTripType(type)
    if (type === 'annual') {
      const d = new Date(departure || todayStr)
      d.setFullYear(d.getFullYear() + 1)
      setReturnDate(d.toISOString().split('T')[0])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFieldErrors({})

    const errors: Record<string, string> = {}
    if (!originCode) {
      errors.origin = 'Please select where you are travelling from'
    }
    if (countryCodes.length === 0) {
      errors.travelDetailList = 'Please select at least one destination'
    }
    if (!departure) {
      errors.departureDate = 'Please select a departure date'
    } else if (departure < todayStr) {
      errors.departureDate = 'Departure date cannot be in the past'
    }
    if (!returnDate) {
      errors.returnDate = 'Please select a return date'
    } else if (departure && returnDate < departure) {
      errors.returnDate = 'Return date must be on or after departure date'
    }
    if (!birthDate) {
      errors.dateOfBirth = 'Please enter lead traveller’s date of birth'
    } else if (birthDate > todayStr) {
      errors.dateOfBirth = 'Date of birth must be in the past'
    }
    if (!reviewed) {
      errors.agreedToTerms = 'Please confirm your trip details and accept the Terms & Conditions to proceed'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      const firstKey = Object.keys(errors)[0]
      setFormError(errors[firstKey])

      const fieldIdMap: Record<string, string> = {
        origin: 'travelling-from',
        travelDetailList: 'destination-field',
        departureDate: 'trip-departure',
        returnDate: 'trip-return',
        dateOfBirth: 'trip-birth',
        agreedToTerms: 'trip-terms',
      }
      const targetId = fieldIdMap[firstKey]
      if (targetId) {
        const el = document.getElementById(targetId)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el?.focus()
      }
      return
    }

    const payload: Parameters<typeof updateTravelDetails>[0] = {
      travelType: effectiveCoverageType === 'family' ? 'FAMILY' : 'INDIVIDUAL',
      isAnnualMultiTrip: tripType === 'annual',
      departureDate: new Date(departure),
      returnDate: new Date(returnDate),
      dateOfBirth: new Date(birthDate),
      noOfAdults: adults,
      noOfChildren: children,
      travelDetailList: countryCodes.map((code, idx, arr) => ({
        TravelCoverageArea: resolveCoverageArea(code),
        PlaceOfOrgin: idx === 0 ? originCode : arr[idx - 1],
        TravelCountry: code,
        DisplaySequence: idx + 1,
      })),
      agreedToTerms: reviewed,
    }

    const result = travelInsuranceSchema.safeParse(payload)
    if (!result.success) {
      const zodErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string
        if (!zodErrors[key]) zodErrors[key] = issue.message
      }
      setFieldErrors(zodErrors)
      const firstMessage = result.error.issues[0]?.message || 'Please check the form for errors.'
      setFormError(firstMessage)
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(true)

    // Update Zustand Store exactly as in @ecommerce
    updateTravelDetails(payload)
    setInsurancePlans(null)
    resetQuoteRefetchCount()
    setFormModified(false)
    setClientRequest({
      id: 'pending',
      status: 'fetching',
      errorMessage: undefined,
    })

    setStep(2)
    if (onSubmitted) {
      setIsSubmitting(false)
      onSubmitted()
      return
    }
    router.push(`/${agentCode}/travel-insurance/plans`)
  }

  // Selected destination summary label for left panel
  const destinationSummary = useMemo(() => {
    if (countryCodes.length === 0) return 'Not selected'
    if (countryCodes.length === 1) {
      const opt = destinationOptions.find((o) => o.value === countryCodes[0])
      return opt?.label || countryCodes[0]
    }
    return `${countryCodes.length} countries selected`
  }, [countryCodes, destinationOptions])

  const formBody = (
    <div
      className={
        variant === 'modal'
          ? 'min-w-0'
          : 'min-w-0 rounded-b-xl bg-white p-5 sm:p-8 dark:bg-[#262828] lg:rounded-r-xl lg:rounded-bl-none'
      }
    >
      {!hydrated ? (
        <div className="space-y-6" aria-busy="true" aria-label="Loading trip details form">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="w-full space-y-2">
              <div className="h-7 w-48 animate-pulse rounded bg-[#dfe7df] dark:bg-[#3d4140]" />
              <div className="h-5 w-3/4 animate-pulse rounded bg-[#dfe7df] dark:bg-[#3d4140]" />
            </div>
            <div className="h-10 w-40 animate-pulse rounded bg-[#dfe7df] dark:bg-[#3d4140]" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="h-20 animate-pulse rounded bg-[#dfe7df] dark:bg-[#3d4140]" />
            <div className="h-20 animate-pulse rounded bg-[#dfe7df] dark:bg-[#3d4140]" />
            <div className="h-20 animate-pulse rounded bg-[#dfe7df] dark:bg-[#3d4140]" />
            <div className="h-20 animate-pulse rounded bg-[#dfe7df] dark:bg-[#3d4140]" />
          </div>
          <div className="h-24 animate-pulse rounded bg-[#dfe7df] dark:bg-[#3d4140]" />
        </div>
      ) : (
        <>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight text-[#183d2c] dark:text-[#f4f5f2]">
              Your trip details
            </h3>
            <p className="mt-1 text-sm sm:text-base leading-snug text-[#333333] dark:text-[#c4c7c5]">
              Compare plans and rates with a few trip details.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-5" aria-label="Travel insurance trip details" noValidate>
          {/*
              Row 0: Trip type | Travelling as
              SM (< 640): stack vertically, each full width
              MD+ (≥ 640): side-by-side 2-equal-column grid
            */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
              {/* Trip Type */}
              <fieldset>
                <legend className="text-sm font-medium text-[#183d2c] dark:text-[#f4f5f2]">
                  Trip type
                </legend>
                <div
                  role="radiogroup"
                  aria-label="Trip type"
                  className="mt-1.5 grid grid-cols-2 rounded-lg bg-[#f1f2f0] p-1 dark:bg-[#171919]"
                  onKeyDown={(e) => {
                    const radios = ['single', 'annual'] as const
                    const idx = radios.indexOf(tripType)
                    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                      e.preventDefault()
                      handleTripTypeChange(radios[(idx + 1) % radios.length])
                    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                      e.preventDefault()
                      handleTripTypeChange(radios[(idx + radios.length - 1) % radios.length])
                    }
                  }}
                >
                  {(
                    [
                      { value: 'single', label: 'Single trip', ariaLabel: 'Single trip' },
                      { value: 'annual', label: 'Annual', ariaLabel: 'Annual multi-trip' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={tripType === opt.value}
                      aria-label={opt.ariaLabel}
                      tabIndex={tripType === opt.value ? 0 : -1}
                      onClick={() => handleTripTypeChange(opt.value)}
                      className={cn(
                        'min-h-12 rounded-md px-2 py-2 text-sm font-semibold transition whitespace-nowrap text-center',
                        tripType === opt.value
                          ? 'bg-[#006838] text-white shadow-xs'
                          : 'text-[#333333] hover:text-[#006838] dark:text-[#c4c7c5] dark:hover:text-white'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Travelling as — same pill segmented style as Trip type */}
              <fieldset>
                <legend className="text-sm font-medium text-[#183d2c] dark:text-[#f4f5f2]">
                  Travelling as
                </legend>
                <div
                  role="radiogroup"
                  aria-label="Travelling as"
                  className="mt-1.5 grid grid-cols-2 rounded-lg bg-[#f1f2f0] p-1 dark:bg-[#171919]"
                  onKeyDown={(e) => {
                    const opts = ['individual', 'family'] as const
                    const idx = opts.indexOf(effectiveCoverageType as 'individual' | 'family')
                    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                      e.preventDefault()
                      setCoverageType(opts[(idx + 1) % opts.length])
                    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                      e.preventDefault()
                      setCoverageType(opts[(idx + opts.length - 1) % opts.length])
                    }
                  }}
                >
                  {(
                    [
                      { value: 'individual', label: 'Individual' },
                      { value: 'family', label: 'Family' },
                    ] as const
                  ).map((opt) => {
                    const isSelected = effectiveCoverageType === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={isSelected ? 0 : -1}
                        onClick={() => setCoverageType(opt.value)}
                        className={cn(
                          'min-h-12 rounded-md px-2 py-2 text-sm font-semibold transition whitespace-nowrap text-center',
                          isSelected
                            ? 'bg-[#006838] text-white shadow-xs'
                            : 'text-[#333333] hover:text-[#006838] dark:text-[#c4c7c5] dark:hover:text-white'
                        )}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            </div>

            {/* Rows 1+: Travelling from, Destination, Dates, Travellers, DOB */}
            <div className="mt-5 grid items-start gap-6 sm:grid-cols-2">
              {/* Column 1: Travelling from */}
              <div className="min-w-0" id="travelling-from">
                <div className="flex min-h-6 items-center">
                  <label
                    htmlFor="trip-from"
                    className="text-sm font-medium text-[#183d2c] dark:text-[#f4f5f2]"
                  >
                    Travelling from
                  </label>
                </div>
                <div className="mt-2">
                  <DestinationCombobox
                    mode="domestic"
                    options={fromOptions}
                    value={originCode}
                    onValueChange={setOriginCode}
                    placeholder="Select origin"
                    label="Travelling from"
                    error={Boolean(fieldErrors.origin)}
                    allowClear={false}
                  />
                </div>
                {fieldErrors.origin && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400" role="alert">
                    {fieldErrors.origin}
                  </p>
                )}
              </div>

              {/* Column 2: Destination */}
              <fieldset className="min-w-0" id="destination-field">
                {/*
                  Legend row:
                  - SM/MD: legend left + segmented pill toggle right
                  - LG:    legend left + inline radio buttons right
                */}
                <div className="flex min-h-6 flex-wrap items-center justify-between gap-2 text-sm">
                  <legend className="font-medium text-[#183d2c] dark:text-[#f4f5f2]">
                    Destination
                  </legend>

                  {/* SM / MD: compact pill segmented control (hidden on LG) */}
                  <div
                    ref={destTypeGroupRef}
                    role="radiogroup"
                    aria-label="Destination region"
                    className="inline-flex rounded-lg bg-[#f1f2f0] p-0.5 dark:bg-[#171919] lg:hidden"
                    onKeyDown={(e) => {
                      const opts = ['international', 'domestic'] as const
                      const idx = opts.indexOf(destinationType)
                      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                        e.preventDefault()
                        setDestinationType(opts[(idx + 1) % opts.length])
                        setCountryCodes([])
                      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                        e.preventDefault()
                        setDestinationType(opts[(idx + opts.length - 1) % opts.length])
                        setCountryCodes([])
                      }
                    }}
                  >
                    {(['international', 'domestic'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        role="radio"
                        aria-checked={destinationType === opt}
                        tabIndex={destinationType === opt ? 0 : -1}
                        onClick={() => {
                          setDestinationType(opt)
                          setCountryCodes([])
                        }}
                        className={cn(
                          'min-h-7 rounded-md px-2.5 py-1 text-xs font-semibold capitalize transition',
                          destinationType === opt
                            ? 'bg-[#006838] text-white shadow-xs'
                            : 'text-[#333333] hover:text-[#006838] dark:text-[#c4c7c5] dark:hover:text-white'
                        )}
                      >
                        {opt === 'international' ? 'International' : 'Domestic'}
                      </button>
                    ))}
                  </div>

                  {/* LG: real radio inputs, inline */}
                  <div
                    role="radiogroup"
                    aria-label="Destination region"
                    className="hidden items-center gap-4 lg:flex"
                    onKeyDown={(e) => {
                      const opts = ['international', 'domestic'] as const
                      const idx = opts.indexOf(destinationType)
                      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                        e.preventDefault()
                        setDestinationType(opts[(idx + 1) % opts.length])
                        setCountryCodes([])
                      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                        e.preventDefault()
                        setDestinationType(opts[(idx + opts.length - 1) % opts.length])
                        setCountryCodes([])
                      }
                    }}
                  >
                    {(['international', 'domestic'] as const).map((opt) => {
                      const isChecked = destinationType === opt
                      return (
                        <label
                          key={opt}
                          className="flex cursor-pointer items-center gap-1.5 text-sm"
                        >
                          <input
                            type="radio"
                            name="destination_type_lg"
                            value={opt}
                            checked={isChecked}
                            tabIndex={isChecked ? 0 : -1}
                            onChange={() => {
                              setDestinationType(opt)
                              setCountryCodes([])
                            }}
                            className="
                              relative size-4 shrink-0 cursor-pointer appearance-none rounded-full
                              border-2 border-[#c7d4c9] bg-white transition
                              checked:border-[#006838]
                              checked:bg-[#006838]
                              checked:[background-image:radial-gradient(circle,#fff_30%,transparent_31%)]
                              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838]
                              dark:border-[#565c58] dark:bg-[#1c1e1e]
                              dark:checked:border-[#559e45] dark:checked:bg-[#559e45]
                            "
                          />
                          <span
                            className={cn(
                              'font-medium capitalize',
                              isChecked
                                ? 'text-[#006838] dark:text-[#d0e3c8]'
                                : 'text-[#333333] dark:text-[#c4c7c5]'
                            )}
                          >
                            {opt === 'international' ? 'International' : 'Domestic'}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-2">
                  <DestinationCombobox
                    mode={destinationType}
                    options={destinationOptions}
                    multiple
                    values={countryCodes}
                    onValuesChange={setCountryCodes}
                    placeholder={
                      destinationType === 'domestic'
                        ? 'Select destination in Philippines'
                        : 'Select countries'
                    }
                    label="Destination"
                    error={Boolean(fieldErrors.travelDetailList)}
                    showChips={true}
                  />
                </div>
                {fieldErrors.travelDetailList && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400" role="alert">
                    {fieldErrors.travelDetailList}
                  </p>
                )}
              </fieldset>

              {/* Departure Date */}
              <div className="min-w-0">
                <label
                  htmlFor="trip-departure"
                  className="block text-sm font-medium text-[#183d2c] dark:text-[#f4f5f2]"
                >
                  {tripType === 'annual' ? 'First trip departure' : 'Departure date'}
                </label>
                <input
                  id="trip-departure"
                  name="departure"
                  type="date"
                  value={departure}
                  min={todayStr}
                  required
                  aria-invalid={Boolean(fieldErrors.departureDate)}
                  onChange={(e) => {
                    const nextDep = e.target.value
                    setDeparture(nextDep)
                    if (tripType === 'annual') {
                      const d = new Date(nextDep)
                      d.setFullYear(d.getFullYear() + 1)
                      setReturnDate(d.toISOString().split('T')[0])
                    } else if (nextDep && returnDate < nextDep) {
                      const d = new Date(nextDep)
                      d.setDate(d.getDate() + 7)
                      setReturnDate(d.toISOString().split('T')[0])
                    }
                  }}
                  className={cn(
                    'ui-form-field mt-2 block min-h-12 w-full rounded-md border border-[#c7d4c9] bg-white px-3 py-2 text-base text-[#183d2c] dark:border-[#565c58] dark:bg-[#1c1e1e] dark:text-[#f4f5f2]',
                    fieldErrors.departureDate && 'border-red-600 outline-red-600'
                  )}
                />
                {/* Reserved-height row: green formatted date OR error — prevents row jump */}
                <div className="mt-1 min-h-[1.25rem]">
                  {fieldErrors.departureDate ? (
                    <p className="text-xs text-red-600 dark:text-red-400" role="alert">
                      {fieldErrors.departureDate}
                    </p>
                  ) : departure ? (
                    <p className="text-xs font-semibold text-[#006838] dark:text-[#d0e3c8]" aria-live="polite">
                      {formatDateDisplay(departure)}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Return Date */}
              <div className="min-w-0">
                <label
                  htmlFor="trip-return"
                  className="block text-sm font-medium text-[#183d2c] dark:text-[#f4f5f2]"
                >
                  {tripType === 'annual' ? 'First trip return' : 'Return date'}
                </label>
                <input
                  id="trip-return"
                  name="return"
                  type="date"
                  value={returnDate}
                  min={departure || todayStr}
                  required
                  aria-invalid={Boolean(fieldErrors.returnDate)}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className={cn(
                    'ui-form-field mt-2 block min-h-12 w-full rounded-md border border-[#c7d4c9] bg-white px-3 py-2 text-base text-[#183d2c] dark:border-[#565c58] dark:bg-[#1c1e1e] dark:text-[#f4f5f2]',
                    fieldErrors.returnDate && 'border-red-600 outline-red-600'
                  )}
                />
                {/* Reserved-height row: green formatted date OR error — prevents row jump */}
                <div className="mt-1 min-h-[1.25rem]">
                  {fieldErrors.returnDate ? (
                    <p className="text-xs text-red-600 dark:text-red-400" role="alert">
                      {fieldErrors.returnDate}
                    </p>
                  ) : returnDate ? (
                    <p className="text-xs font-semibold text-[#006838] dark:text-[#d0e3c8]" aria-live="polite">
                      {formatDateDisplay(returnDate)}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Row 3 Col 1: Travellers Popover */}
              <div className="relative min-w-0" ref={travellersRef}>
                <span id="travellers-label" className="block text-sm font-medium text-[#183d2c] dark:text-[#f4f5f2]">
                  Travellers
                </span>
                <button
                  id="travellers-toggle"
                  type="button"
                  onClick={() => setTravellersOpen((prev) => !prev)}
                  aria-expanded={travellersOpen}
                  aria-controls="travellers-popover"
                  aria-haspopup="dialog"
                  aria-labelledby="travellers-label travellers-summary"
                  className="ui-form-field mt-2 flex min-h-12 w-full items-center justify-between rounded-md border border-[#c7d4c9] bg-white px-3 py-2 text-left text-base text-[#183d2c] dark:border-[#565c58] dark:bg-[#1c1e1e] dark:text-[#f4f5f2]"
                >
                  <div className="flex items-center gap-3">
                    <Users className="size-5 shrink-0 text-[#808080] dark:text-[#b2b7b4]" aria-hidden />
                    <span id="travellers-summary" className="font-medium text-sm sm:text-base">
                      {travellerSummary}
                    </span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={cn('size-5 shrink-0 text-[#808080] transition-transform', travellersOpen && 'rotate-180')}
                    aria-hidden
                  >
                    <path d="M6 9l6 6l6 -6" />
                  </svg>
                </button>

                {travellersOpen && (
                  <div
                    id="travellers-popover"
                    role="dialog"
                    aria-labelledby="travellers-popover-title"
                    className="absolute right-0 left-0 z-20 mt-2 rounded-lg border border-[#c7d4c9] bg-white p-4 shadow-xl dark:border-[#565c58] dark:bg-[#262828]"
                  >
                    <h4 id="travellers-popover-title" className="font-semibold text-[#183d2c] dark:text-[#f4f5f2]">
                      Number of travellers
                    </h4>

                    {/* Adults counter */}
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span id="adults-label" className="text-sm font-medium">
                        Adults (18+ yrs)
                      </span>
                      <div role="group" aria-labelledby="adults-label" className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAdults((prev) => Math.max(1, prev - 1))}
                          disabled={adults <= 1}
                          aria-label="Remove adults"
                          className="inline-flex size-11 items-center justify-center rounded-md border border-[#c7d4c9] text-base focus-visible:outline-2 disabled:opacity-40 dark:border-[#565c58]"
                        >
                          −
                        </button>
                        <output className="min-w-6 text-center font-semibold" aria-live="polite">
                          {adults}
                        </output>
                        <button
                          type="button"
                          onClick={() => setAdults((prev) => (travellerCount < 10 ? prev + 1 : prev))}
                          disabled={travellerCount >= 10}
                          aria-label="Add adults"
                          className="inline-flex size-11 items-center justify-center rounded-md border border-[#c7d4c9] text-base focus-visible:outline-2 disabled:opacity-40 dark:border-[#565c58]"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Children counter */}
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span id="children-label" className="text-sm font-medium">
                        Children (0–17 yrs)
                      </span>
                      <div role="group" aria-labelledby="children-label" className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setChildren((prev) => Math.max(0, prev - 1))}
                          disabled={children <= 0}
                          aria-label="Remove children"
                          className="inline-flex size-11 items-center justify-center rounded-md border border-[#c7d4c9] text-base focus-visible:outline-2 disabled:opacity-40 dark:border-[#565c58]"
                        >
                          −
                        </button>
                        <output className="min-w-6 text-center font-semibold" aria-live="polite">
                          {children}
                        </output>
                        <button
                          type="button"
                          onClick={() => setChildren((prev) => (travellerCount < 10 ? prev + 1 : prev))}
                          disabled={travellerCount >= 10}
                          aria-label="Add children"
                          className="inline-flex size-11 items-center justify-center rounded-md border border-[#c7d4c9] text-base focus-visible:outline-2 disabled:opacity-40 dark:border-[#565c58]"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-snug text-[#333333] dark:text-[#c4c7c5]">
                      Up to 10 travellers allowed per quotation.
                    </p>

                    <button
                      type="button"
                      onClick={() => setTravellersOpen(false)}
                      className="mt-3 w-full inline-flex min-h-11 items-center justify-center rounded-md bg-[#006838] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00552e] active:bg-[#004525] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838]"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>

              {/* Row 3 Col 2: Lead Traveller Date of Birth */}
              <div className="min-w-0">
                <label
                  htmlFor="trip-birth"
                  className="block text-sm font-medium text-[#183d2c] dark:text-[#f4f5f2]"
                >
                  Lead traveller’s date of birth
                </label>
                <input
                  id="trip-birth"
                  name="date_of_birth"
                  type="date"
                  value={birthDate}
                  max={todayStr}
                  placeholder="DD / MM / YYYY"
                  required
                  aria-invalid={Boolean(fieldErrors.dateOfBirth)}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className={cn(
                    'ui-form-field mt-2 block min-h-12 w-full rounded-md border border-[#c7d4c9] bg-white px-3 py-2 text-base text-[#183d2c] dark:border-[#565c58] dark:bg-[#1c1e1e] dark:text-[#f4f5f2]',
                    fieldErrors.dateOfBirth && 'border-red-600 outline-red-600'
                  )}
                />
                {/* Reserved-height row: green formatted date OR hint OR error */}
                <div className="mt-1 min-h-[1.25rem]">
                  {fieldErrors.dateOfBirth ? (
                    <p className="text-xs text-red-600 dark:text-red-400" role="alert">
                      {fieldErrors.dateOfBirth}
                    </p>
                  ) : birthDate ? (
                    <p className="text-xs font-semibold text-[#006838] dark:text-[#d0e3c8]" aria-live="polite">
                      {formatDateDisplay(birthDate)}
                    </p>
                  ) : (
                    <p className="text-xs leading-snug text-[#808080] dark:text-[#b2b7b4]">
                      Used for plan eligibility &amp; rates.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Checkbox & Submit */}
            <div className="mt-6 border-t border-[#dfe7df] pt-5 dark:border-[#3d4140]">
              <label
                id="trip-terms"
                tabIndex={-1}
                className={cn(
                  'flex items-start gap-3 text-sm leading-snug cursor-pointer',
                  fieldErrors.agreedToTerms && 'text-red-600'
                )}
              >
                <input
                  type="checkbox"
                  checked={reviewed}
                  onChange={(e) => setReviewed(e.target.checked)}
                  aria-invalid={Boolean(fieldErrors.agreedToTerms)}
                  className="mt-0.5 size-5 shrink-0 rounded border-[#c7d4c9] accent-[#006838] focus:ring-[#006838]"
                />
                <span className="text-[#183d2c] dark:text-[#f4f5f2]">
                  I agree to the{' '}
                  <Link
                    href="/travel-insurance-terms"
                    target="_blank"
                    className="font-semibold underline underline-offset-2 text-[#006838] hover:text-[#00552e] dark:text-[#d0e3c8] dark:hover:text-white"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Terms & Conditions
                  </Link>{' '}
                  and confirm the trip details are correct.
                </span>
              </label>
              {fieldErrors.agreedToTerms && (
                <p className="mt-1.5 text-xs text-red-600 dark:text-red-400" role="alert">
                  {fieldErrors.agreedToTerms}
                </p>
              )}

              {/* Form Error Banner */}
              {formError && (
                <p
                  role="alert"
                  tabIndex={-1}
                  className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                >
                  {formError}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-end gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-[#006838] px-8 py-3 text-base font-semibold text-white hover:bg-[#00552e] active:bg-[#004525] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] disabled:opacity-50 transition"
                >
                  <span>
                    {isSubmitting
                      ? 'Searching plans...'
                      : variant === 'modal'
                      ? 'Update search'
                      : 'Find plans'}
                  </span>
                  {variant !== 'modal' && <ArrowRight className="size-4" aria-hidden="true" />}
                </button>
              </div>
            </div>
          </form>
        </>
      )}
    </div>
  )

  if (variant === 'modal') return formBody

  return (
    <section
      id="trip-search"
      aria-labelledby="search-title"
      className="scroll-mt-20 bg-[#006838] px-5 py-8 sm:px-8 sm:py-12 lg:py-16"
    >
      <div className="mx-auto grid max-w-7xl rounded-xl border border-[#dfe7df] bg-white shadow-xl dark:border-[#3d4140] dark:bg-[#262828] lg:grid-cols-[33%_67%]">
        {/* Mobile / Tablet Compact Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-xl bg-[#d0e3c8] px-5 py-4 text-[#183d2c] dark:bg-[#304538] dark:text-[#f4f5f2] lg:hidden">
          <div className="flex items-center gap-2.5">
            <Plane className="size-5 text-[#006838] dark:text-[#d0e3c8]" aria-hidden />
            <h2 className="text-base font-bold sm:text-lg">Find travel plans for your trip</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onOpenRetrieve) onOpenRetrieve()
              else {
                const m = document.getElementById('retrieve-modal') as HTMLDialogElement | null
                m?.showModal()
              }
            }}
            className="text-xs sm:text-sm font-semibold underline underline-offset-4 hover:text-[#006838] dark:hover:text-white"
          >
            Retrieve a proposal →
          </button>
        </div>

        {/* Desktop Left Summary & Stepper Panel (LG) */}
        <aside className="relative isolate hidden flex-col justify-between overflow-clip rounded-l-xl bg-[#d0e3c8] p-6 lg:flex lg:p-8 text-[#183d2c] dark:bg-[#304538] dark:text-[#f4f5f2]">
          {/*
            Watermark logomark — decorative shield, bottom-left, clipped by overflow-clip.
            Light: Soft-sage fill at 12% opacity over pale-green panel → AA contrast unaffected.
            Dark:  White fill at 8% opacity over dark-green panel.
            Root cause of the old "faded block artifact": a stray background-image or
            mask property on a previous version of this aside that used an <img> or
            CSS background without background-size/position. Replaced here with an
            inline SVG that is fully contained and never causes overflow.
          */}
          <svg
            aria-hidden="true"
            focusable="false"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 381.75 399.36"
            className="pointer-events-none absolute -bottom-8 -left-6 z-[-1] w-[75%] opacity-[0.13] dark:opacity-[0.08]"
            style={{ isolation: 'isolate' }}
          >
            {/* One Insurance shield logomark — white fill, clipped by parent overflow-clip */}
            <path
              fill="currentColor"
              d="M125.42,0c39.5,0,79.01,0,118.51,0,6.54,0,6.6,.02,6.61,6.51,.03,18.18,0,36.36,.01,54.53,0,5.85,.22,6.07,6.12,6.08,16.62,.03,33.23,0,49.85,.06,6.14,.02,6.35,.31,6.35,6.36,.01,17.86,.14,35.73-.06,53.59-.05,4.34,1.32,5.63,5.63,5.58,18.34-.21,36.68-.08,55.02-.08q8.05,0,8.06,8.28c.02,20.06,.31,40.12-.02,60.17-.6,36.31-13.24,67.81-38.42,94.19-16.82,17.63-37.08,30.79-57.1,44.24-28.73,19.32-57.7,38.29-86.38,57.69-4.58,3.1-7.88,2.65-12.16-.1-33.19-21.37-66.57-42.46-99.42-64.36-16.43-10.96-32.92-21.83-47.16-35.67C17.72,274.59,4.65,247.18,.79,215.22c-.6-5.01-.79-9.98-.79-14.99C0,135.98,0,71.73,0,7.48Q0,0,7.38,0C46.73,0,86.07,0,125.42,0Zm35.41,68.95c-26.81,0-53.61,.06-80.42-.07-3.95-.02-5.53,1-5.52,5.27,.14,41.06-.02,82.12,.13,123.18,.07,21,8.17,38.32,24.91,51.33,12.15,9.44,25.34,17.33,38.2,25.71,16.8,10.95,33.65,21.84,50.51,32.69,2.54,1.63,4.79,3.65,8.41,1.25,27.69-18.35,55.63-36.32,83.26-54.75,20.75-13.85,31.75-33.06,31.15-58.58-.43-18.48-.19-36.98,0-55.47,.04-4.07-1.1-5.45-5.3-5.39-17.08,.21-34.17,.09-51.26,.08-6.37,0-6.4-.02-6.4-6.59-.01-16.45,0-32.91,.01-49.36q0-9.44-9.14-9.29c-1.41,.02-2.82,0-4.23,0-24.77,0-49.54,0-74.31,0Zm185.23,1.24c-9.53,0-19.07-.15-28.6,.06-4.37,.1-5.93-1.5-5.89-5.87,.15-19.46,.15-38.91,0-58.37-.03-4.32,1.39-5.97,5.83-5.94,19.46,.16,38.93,.14,58.39,.01,4.34-.03,5.98,1.57,5.95,5.93-.13,19.46-.14,38.91,.02,58.37,.03,4.37-1.52,5.97-5.9,5.88-9.93-.22-19.86-.07-29.79-.07Z"
            />
          </svg>
          <div>
            <div className="inline-flex size-10 items-center justify-center rounded-xl bg-white/70 dark:bg-black/20 text-[#006838] dark:text-[#d0e3c8]">
              <Plane className="size-5" aria-hidden="true" />
            </div>

            <h2 id="search-title" className="mt-4 text-2xl font-bold leading-tight tracking-tight">
              Find travel plans for your trip
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#333333] dark:text-[#c4c7c5]">
              Real-time rate comparison and immediate coverage from accredited insurers.
            </p>

            {/* Stepper / Summary of entered values */}
            <div className="mt-8 space-y-4 rounded-lg bg-white/60 p-4 backdrop-blur-xs dark:bg-black/20 text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4.5 shrink-0 text-[#006838] dark:text-[#d0e3c8]" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#183d2c] dark:text-[#f4f5f2]">Destination</p>
                  <p className="mt-0.5 truncate text-[#333333] dark:text-[#c4c7c5]">
                    {destinationSummary} ({destinationType === 'international' ? 'International' : 'Domestic'})
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 size-4.5 shrink-0 text-[#006838] dark:text-[#d0e3c8]" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#183d2c] dark:text-[#f4f5f2]">Travel dates</p>
                  <p className="mt-0.5 text-[#333333] dark:text-[#c4c7c5]">
                    {departure && returnDate
                      ? `${formatDateDisplay(departure)} – ${formatDateDisplay(returnDate)}`
                      : 'Set departure and return'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="mt-0.5 size-4.5 shrink-0 text-[#006838] dark:text-[#d0e3c8]" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#183d2c] dark:text-[#f4f5f2]">Travellers</p>
                  <p className="mt-0.5 text-[#333333] dark:text-[#c4c7c5]">
                    {travellerSummary} · {tripType === 'annual' ? 'Annual plan' : 'Single trip'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-[#183d2c]/10 pt-5 dark:border-white/10">
            <p className="text-xs text-[#333333] dark:text-[#c4c7c5]">Already saved a quote?</p>
            <button
              type="button"
              onClick={() => {
                if (onOpenRetrieve) onOpenRetrieve()
                else {
                  const m = document.getElementById('retrieve-modal') as HTMLDialogElement | null
                  m?.showModal()
                }
              }}
              className="mt-1 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[#006838] underline underline-offset-4 hover:text-[#00552e] dark:text-[#d0e3c8] dark:hover:text-white focus-visible:outline-2 focus-visible:outline-[#006838]"
            >
              <span>Retrieve a proposal or policy</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </aside>

        {formBody}
      </div>
    </section>
  )
}
