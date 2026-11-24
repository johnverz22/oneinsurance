'use client'

import { useState, useRef, useEffect, useMemo, useSyncExternalStore, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { addYears, format, parseISO } from 'date-fns'
import { Plane, Calendar, Users, MapPin, ArrowRight } from 'lucide-react'
import { TermsAndConditionsModal } from '@/components/travel-insurance/terms-and-conditions-modal'
import { TripSummaryModal } from '@/components/travel-insurance/trip-summary-modal'
import { idFilesStore, useFullQuoteResponseStore, useTravelInsuranceStore } from '@/store/travel-insurance-store'
import { TravelCoverageMap } from '@/constants/travel-coverage'
import { getNormalizedTravelCoverages } from '@/utils/travel-coverages-helpers'
import {
  DestinationCombobox,
  DestinationOption,
} from '@/components/travel-insurance/destination-combobox'
import { travelInsuranceSchema } from '@/types/travel-insurance/travel-insurance-request'
import { cn } from '@/lib/utils'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function parseYmd(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return y && m && d ? { y, m: m - 1, d } : null
}

function formatDateRange(dep: string, ret: string) {
  const a = parseYmd(dep)
  const b = parseYmd(ret)
  if (!a || !b) return '—'
  const mon = (x: { m: number }) => MONTHS[x.m]
  if (a.y === b.y && a.m === b.m) {
    return a.d === b.d ? `${mon(a)} ${a.d}, ${a.y}` : `${mon(a)} ${a.d}–${b.d}, ${a.y}`
  }
  if (a.y === b.y) return `${mon(a)} ${a.d} – ${mon(b)} ${b.d}, ${a.y}`
  return `${mon(a)} ${a.d}, ${a.y} – ${mon(b)} ${b.d}, ${b.y}`
}

function tripDaysLabel(dep: string, ret: string) {
  const a = parseYmd(dep)
  const b = parseYmd(ret)
  if (!a || !b) return '—'
  const days = Math.round((Date.UTC(b.y, b.m, b.d) - Date.UTC(a.y, a.m, a.d)) / 86400000) + 1
  return days < 1 ? '—' : `${days} day${days > 1 ? 's' : ''}`
}

interface TripDetailsFormProps {
  agentCode: string
  onOpenRetrieve?: () => void
  variant?: 'page' | 'modal'
  onSubmitted?: () => void
}

// Error keys → the focusable control for each field (comboboxes carry the id
// on their inner button/input, not the wrapper div).
const ERROR_FIELD_IDS: Record<string, string> = {
  origin: 'trip-from',
  travelDetailList: 'trip-destination',
  returnDestination: 'trip-return-country',
  departureDate: 'trip-departure',
  returnDate: 'trip-return',
  dateOfBirth: 'trip-birth',
  noOfAdults: 'travellers-toggle',
  agreedToTerms: 'trip-terms',
}

function focusErrorField(key: string) {
  const el = document.getElementById(ERROR_FIELD_IDS[key] ?? '')
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.focus({ preventScroll: true })
}

export function TripDetailsForm(props: TripDetailsFormProps) {
  const [nonce, setNonce] = useState(0)
  useEffect(() => {
    if (props.variant === 'modal') return
    const store = useTravelInsuranceStore.getState()
    if (!store.issueQuoteResponse) return
    store.setIssueQuoteResponse(null)
    store.resetForm()
    useFullQuoteResponseStore.getState().resetApiResponse()
    idFilesStore.clear()
    setNonce((n) => n + 1)
  }, [props.variant])
  return <TripDetailsFormInner key={nonce} {...props} />
}

function TripDetailsFormInner({
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
    highestVisitedStep,
  } = useTravelInsuranceStore()
  const hasSavedTrip = highestVisitedStep > 1

  // Hydration guard — avoid SSR mismatch for date inputs / persisted state
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const normalizedTravelDetails = useMemo(() => {
    const details = { ...travelDetails }
    if (!hasSavedTrip) {
      details.departureDate = undefined as unknown as Date
      details.returnDate = undefined as unknown as Date
      details.dateOfBirth = undefined
    }
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
  }, [travelDetails, hasSavedTrip])

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
  const storedReturn = hasSavedTrip && !isStoredDomestic ? normalizedTravelDetails.returnDestination : undefined
  const [countryCodes, setCountryCodes] = useState<string[]>(() => {
    const codes = (normalizedTravelDetails.travelDetailList ?? [])
      .map((d) => d?.TravelCountry)
      .filter((c): c is string => Boolean(c && c.trim()))
    return storedReturn && codes.length > 1 && codes[codes.length - 1] === storedReturn
      ? codes.slice(0, -1)
      : codes
  })
  const [returnsToPH, setReturnsToPH] = useState<boolean>(!storedReturn)
  const [returnCode, setReturnCode] = useState<string>(storedReturn ?? '')
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
    if (hasSavedTrip) return ''
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().split('T')[0]
  }, [normalizedTravelDetails.departureDate, todayStr, hasSavedTrip])

  const defaultReturnStr = useMemo(() => {
    if (
      defaultDepartureStr &&
      normalizedTravelDetails.returnDate instanceof Date &&
      !isNaN(normalizedTravelDetails.returnDate.getTime())
    ) {
      const ret = normalizedTravelDetails.returnDate.toISOString().split('T')[0]
      if (ret >= defaultDepartureStr) return ret
    }
    if (!hasSavedTrip && defaultDepartureStr) {
      const d = new Date(defaultDepartureStr)
      d.setDate(d.getDate() + 7)
      return d.toISOString().split('T')[0]
    }
    return ''
  }, [normalizedTravelDetails.returnDate, defaultDepartureStr, hasSavedTrip])

  const defaultDobStr = useMemo(() => {
    if (
      normalizedTravelDetails.dateOfBirth instanceof Date &&
      !isNaN(normalizedTravelDetails.dateOfBirth.getTime())
    ) {
      return normalizedTravelDetails.dateOfBirth.toISOString().split('T')[0]
    }
    return hasSavedTrip ? '' : '1990-01-01'
  }, [normalizedTravelDetails.dateOfBirth, hasSavedTrip])

  const [departure, setDeparture] = useState<string>(defaultDepartureStr)
  const [singleReturnDate, setReturnDate] = useState<string>(defaultReturnStr)
  const returnDate = tripType === 'annual'
    ? departure ? format(addYears(parseISO(departure), 1), 'yyyy-MM-dd') : ''
    : singleReturnDate
  const [birthDate, setBirthDate] = useState<string>(defaultDobStr)
  const [adults, setAdults] = useState<number>(normalizedTravelDetails.noOfAdults || 1)
  const [children, setChildren] = useState<number>(normalizedTravelDetails.noOfChildren || 0)

  // Unchecked by default
  const [reviewed, setReviewed] = useState<boolean>(false)
  const [travellersOpen, setTravellersOpen] = useState<boolean>(false)
  const [formError, setFormError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [previewPayload, setPreviewPayload] = useState<Parameters<typeof updateTravelDetails>[0] | null>(null)
  const [tcOpen, setTcOpen] = useState(false)
  const closeTc = useCallback(() => setTcOpen(false), [])

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

  const hasReturnLeg = destinationType === 'international' && !returnsToPH
  const lastDestination = countryCodes[countryCodes.length - 1]
  const returnOptions = useMemo(
    () =>
      allDestinationOptions.filter(
        (opt) => opt.area !== 'DOMESTIC' && opt.value !== 'PHILIPPINES' && opt.value !== lastDestination
      ),
    [allDestinationOptions, lastDestination]
  )
  const destinationLabelOf = (code: string) =>
    allDestinationOptions.find((o) => o.value === code)?.label || code

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
  const effectiveCoverageType = children > 0 ? 'family' : coverageType
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
    if (hasReturnLeg && !returnCode) {
      errors.returnDestination = 'Please select a return destination'
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
      focusErrorField(firstKey)
      return
    }

    const allCountryCodes = hasReturnLeg ? [...countryCodes, returnCode] : countryCodes
    const payload: Parameters<typeof updateTravelDetails>[0] = {
      travelType: effectiveCoverageType === 'family' ? 'FAMILY' : 'INDIVIDUAL',
      isAnnualMultiTrip: tripType === 'annual',
      departureDate: new Date(departure),
      returnDate: new Date(returnDate),
      dateOfBirth: new Date(birthDate),
      noOfAdults: adults,
      noOfChildren: children,
      returnDestination: hasReturnLeg ? returnCode : undefined,
      travelDetailList: allCountryCodes.map((code, idx, arr) => ({
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
      const firstIssue = result.error.issues[0]
      setFormError(firstIssue?.message || 'Please check the form for errors.')
      setIsSubmitting(false)
      focusErrorField(String(firstIssue?.path[0] ?? ''))
      return
    }

    if (variant === 'modal') {
      commitSearch(payload)
      return
    }
    setPreviewPayload(payload)
  }

  const commitSearch = (payload: Parameters<typeof updateTravelDetails>[0]) => {
    setIsSubmitting(true)
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
    const total = countryCodes.length + (hasReturnLeg && returnCode ? 1 : 0)
    if (total === 0) return 'Not selected'
    if (total === 1) {
      const opt = destinationOptions.find((o) => o.value === countryCodes[0])
      return opt?.label || countryCodes[0]
    }
    return `${total} countries selected`
  }, [countryCodes, destinationOptions, hasReturnLeg, returnCode])

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
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight text-[var(--text-main)] dark:text-[var(--text-main)]">
              Your trip details
            </h3>
            <p className="mt-1 text-base leading-normal text-[var(--text-sub)] dark:text-[var(--text-sub)]">
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
                <legend className="text-sm font-medium text-[var(--text-main)] dark:text-[var(--text-main)]">
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
                          : 'text-[var(--text-sub)] hover:text-[#006838] dark:text-[var(--text-sub)] dark:hover:text-white'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Travelling as — same pill segmented style as Trip type */}
              <fieldset>
                <legend className="text-sm font-medium text-[var(--text-main)] dark:text-[var(--text-main)]">
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
                            : 'text-[var(--text-sub)] hover:text-[#006838] dark:text-[var(--text-sub)] dark:hover:text-white'
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
                    className="text-sm font-medium text-[var(--text-main)] dark:text-[var(--text-main)]"
                  >
                    Travelling from <span aria-hidden className="text-red-600">*</span>
                  </label>
                </div>
                <div className="mt-2">
                  <DestinationCombobox
                    id="trip-from"
                    mode="domestic"
                    options={fromOptions}
                    value={originCode}
                    onValueChange={setOriginCode}
                    placeholder="Select origin"
                    label="Travelling from"
                    required
                    error={Boolean(fieldErrors.origin)}
                    describedBy={fieldErrors.origin ? 'travelling-from-error' : undefined}
                    allowClear={false}
                  />
                </div>
                {fieldErrors.origin && (
                  <p id="travelling-from-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400" role="alert">
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
                  <legend className="font-medium text-[var(--text-main)] dark:text-[var(--text-main)]">
                    Destination <span aria-hidden className="text-red-600">*</span>
                  </legend>

                  {/* SM / MD: compact pill segmented control (hidden on LG) */}
                  <div
                    ref={destTypeGroupRef}
                    role="radiogroup"
                    aria-label="Destination region"
                    className="inline-flex rounded-lg bg-[#f1f2f0] p-0.5 dark:bg-[#171919] md:hidden"
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
                            : 'text-[var(--text-sub)] hover:text-[#006838] dark:text-[var(--text-sub)] dark:hover:text-white'
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
                    className="hidden items-center gap-4 md:flex"
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
                                : 'text-[var(--text-sub)] dark:text-[var(--text-sub)]'
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
                    id="trip-destination"
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
                    required
                    error={Boolean(fieldErrors.travelDetailList)}
                    describedBy={fieldErrors.travelDetailList ? 'destination-error' : undefined}
                    showChips={true}
                  />
                </div>
                {fieldErrors.travelDetailList && (
                  <p id="destination-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400" role="alert">
                    {fieldErrors.travelDetailList}
                  </p>
                )}

                {destinationType === 'international' && (
                  <div className="mt-3">
                    <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-[var(--text-main)] dark:text-[var(--text-main)]">
                      <input
                        type="checkbox"
                        checked={returnsToPH}
                        onChange={(e) => {
                          setReturnsToPH(e.target.checked)
                          if (e.target.checked) setReturnCode('')
                        }}
                        className="size-4 shrink-0 accent-[#006838]"
                      />
                      Return destination is Philippines
                    </label>
                    {!returnsToPH && (
                      <div className="mt-1">
                        <span className="block text-sm font-medium text-[var(--text-main)] dark:text-[var(--text-main)]">
                          Return destination <span aria-hidden className="text-red-600">*</span>
                        </span>
                        <div className="mt-2">
                          <DestinationCombobox
                            id="trip-return-country"
                            mode="international"
                            options={returnOptions}
                            value={returnCode === lastDestination ? '' : returnCode}
                            onValueChange={setReturnCode}
                            placeholder="Select a country"
                            label="Return destination"
                            required
                            error={Boolean(fieldErrors.returnDestination)}
                            describedBy={fieldErrors.returnDestination ? 'return-destination-error' : undefined}
                            allowClear={false}
                          />
                        </div>
                        {fieldErrors.returnDestination && (
                          <p id="return-destination-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400" role="alert">
                            {fieldErrors.returnDestination}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </fieldset>

              {/* Departure Date */}
              <div className="min-w-0">
                <label
                  htmlFor="trip-departure"
                  className="block text-sm font-medium text-[var(--text-main)] dark:text-[var(--text-main)]"
                >
                  {tripType === 'annual' ? 'First trip departure' : 'Departure date'}{' '}
                  <span aria-hidden className="text-red-600">*</span>
                </label>
                <input
                  id="trip-departure"
                  name="departure"
                  type="date"
                  value={departure}
                  min={todayStr}
                  required
                  aria-invalid={Boolean(fieldErrors.departureDate)}
                  aria-describedby={fieldErrors.departureDate ? 'trip-departure-error' : undefined}
                  onChange={(e) => {
                    const nextDep = e.target.value
                    setDeparture(nextDep)
                    if (nextDep && singleReturnDate && singleReturnDate < nextDep) setReturnDate('')
                  }}
                  className={cn(
                    'ui-form-field mt-2 block min-h-12 w-full rounded-md border border-[#c7d4c9] bg-white px-3 py-2 text-base text-[var(--text-main)] dark:border-[#565c58] dark:bg-[#1c1e1e] dark:text-[var(--text-main)]',
                    fieldErrors.departureDate && 'border-red-600 outline-red-600'
                  )}
                />
                {/* Reserved-height row: green formatted date OR error — prevents row jump */}
                <div className="mt-1 min-h-[1.25rem]">
                  {fieldErrors.departureDate ? (
                    <p id="trip-departure-error" className="text-xs text-red-600 dark:text-red-400" role="alert">
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
                  className="block text-sm font-medium text-[var(--text-main)] dark:text-[var(--text-main)]"
                >
                  Return date{' '}
                  <span aria-hidden className="text-red-600">*</span>
                </label>
                <input
                  id="trip-return"
                  name="return"
                  type="date"
                  value={returnDate}
                  min={departure || todayStr}
                  disabled={tripType === 'annual'}
                  required
                  aria-invalid={Boolean(fieldErrors.returnDate)}
                  aria-describedby={fieldErrors.returnDate ? 'trip-return-error' : tripType === 'annual' ? 'trip-return-hint' : undefined}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className={cn(
                    'ui-form-field mt-2 block min-h-12 w-full rounded-md border border-[#c7d4c9] bg-white px-3 py-2 text-base text-[var(--text-main)] dark:border-[#565c58] dark:bg-[#1c1e1e] dark:text-[var(--text-main)]',
                    'disabled:cursor-not-allowed disabled:bg-[var(--subtle)] disabled:text-[var(--text-muted)] disabled:opacity-60',
                    fieldErrors.returnDate && 'border-red-600 outline-red-600'
                  )}
                />
                {/* Reserved-height row: green formatted date OR error — prevents row jump */}
                <div className="mt-1 min-h-[1.25rem]">
                  {fieldErrors.returnDate ? (
                    <p id="trip-return-error" className="text-xs text-red-600 dark:text-red-400" role="alert">
                      {fieldErrors.returnDate}
                    </p>
                  ) : tripType === 'annual' ? (
                    <p id="trip-return-hint" className="text-xs font-semibold text-[#006838] dark:text-[#d0e3c8]" aria-live="polite">
                      Automatically set to one year after departure.
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
                <span id="travellers-label" className="block text-sm font-medium text-[var(--text-main)] dark:text-[var(--text-main)]">
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
                  className="ui-form-field mt-2 flex min-h-12 w-full items-center justify-between rounded-md border border-[#c7d4c9] bg-white px-3 py-2 text-left text-base text-[var(--text-main)] dark:border-[#565c58] dark:bg-[#1c1e1e] dark:text-[var(--text-main)]"
                >
                  <div className="flex items-center gap-3">
                    <Users className="size-5 shrink-0 text-[var(--text-muted)] dark:text-[var(--text-muted)]" aria-hidden />
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
                    className={cn('size-5 shrink-0 text-[var(--text-muted)] transition-transform', travellersOpen && 'rotate-180')}
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
                    <h4 id="travellers-popover-title" className="font-semibold text-[var(--text-main)] dark:text-[var(--text-main)]">
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

                    <p className="mt-3 text-xs leading-snug text-[var(--text-sub)] dark:text-[var(--text-sub)]">
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
                  className="block text-sm font-medium text-[var(--text-main)] dark:text-[var(--text-main)]"
                >
                  Lead traveller’s date of birth <span aria-hidden className="text-red-600">*</span>
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
                  aria-describedby={
                    fieldErrors.dateOfBirth ? 'trip-birth-error' : 'trip-birth-hint'
                  }
                  onChange={(e) => setBirthDate(e.target.value)}
                  className={cn(
                    'ui-form-field mt-2 block min-h-12 w-full rounded-md border border-[#c7d4c9] bg-white px-3 py-2 text-base text-[var(--text-main)] dark:border-[#565c58] dark:bg-[#1c1e1e] dark:text-[var(--text-main)]',
                    fieldErrors.dateOfBirth && 'border-red-600 outline-red-600'
                  )}
                />
                {/* Reserved-height row: green formatted date OR hint OR error */}
                <div className="mt-1 min-h-[1.25rem]">
                  {fieldErrors.dateOfBirth ? (
                    <p id="trip-birth-error" className="text-xs text-red-600 dark:text-red-400" role="alert">
                      {fieldErrors.dateOfBirth}
                    </p>
                  ) : birthDate ? (
                    <p className="text-xs font-semibold text-[#006838] dark:text-[#d0e3c8]" aria-live="polite">
                      {formatDateDisplay(birthDate)}
                    </p>
                  ) : (
                    <p id="trip-birth-hint" className="text-xs leading-snug text-[var(--text-muted)] dark:text-[var(--text-muted)]">
                      Used for plan eligibility &amp; rates.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Checkbox & Submit */}
            <div className="mt-6 border-t border-[#dfe7df] pt-5 dark:border-[#3d4140]">
              <label
                className={cn(
                  'flex items-start gap-3 text-sm leading-snug cursor-pointer',
                  fieldErrors.agreedToTerms && 'text-red-600'
                )}
              >
                <input
                  id="trip-terms"
                  type="checkbox"
                  checked={reviewed}
                  onChange={(e) => setReviewed(e.target.checked)}
                  required
                  aria-invalid={Boolean(fieldErrors.agreedToTerms)}
                  aria-describedby={fieldErrors.agreedToTerms ? 'trip-terms-error' : undefined}
                  className="mt-0.5 size-5 shrink-0 rounded border-[#c7d4c9] accent-[#006838] focus:ring-[#006838]"
                />
                <span className="text-[var(--text-main)] dark:text-[var(--text-main)]">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setTcOpen(true) }}
                    className="font-semibold underline underline-offset-2 text-[#006838] hover:text-[#00552e] dark:text-[#d0e3c8] dark:hover:text-white"
                  >
                    Terms &amp; Conditions
                  </button>{' '}
                  and confirm the trip details are correct.{' '}
                  <span aria-hidden className="text-red-600">*</span>
                </span>
              </label>
              {fieldErrors.agreedToTerms && (
                <p id="trip-terms-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400" role="alert">
                  {fieldErrors.agreedToTerms}
                </p>
              )}

              {/* Form Error Banner — hidden when the error is already shown inline (e.g. agreedToTerms) */}
              {formError && formError !== fieldErrors.agreedToTerms && (
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

  if (variant === 'modal') return (
    <>
      {formBody}
      <TermsAndConditionsModal open={tcOpen} onClose={closeTc} />
    </>
  )

  return (
    <>
      <section
      id="trip-search"
      aria-labelledby="search-title"
      className="scroll-mt-20 bg-[#006838] px-5 py-8 sm:px-8 sm:py-12 lg:py-16"
    >
      <div className="mx-auto grid max-w-7xl rounded-xl border border-[#dfe7df] bg-white shadow-xl dark:border-[#3d4140] dark:bg-[#262828] lg:grid-cols-[33%_67%]">
        {/* Mobile / Tablet Compact Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-xl bg-[#d0e3c8] px-5 py-4 text-[var(--text-main)] dark:bg-[#304538] dark:text-[var(--text-main)] lg:hidden">
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
        <aside className="relative isolate hidden flex-col justify-between overflow-clip rounded-l-xl bg-[#d0e3c8] p-6 lg:flex lg:p-8 text-[var(--text-main)] dark:bg-[#304538] dark:text-[var(--text-main)]">
          {/*
            Watermark logomark — UnoSure icon mark, bottom-left, clipped by overflow-clip.
          */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/icon-unosure-dark.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-8 -left-6 z-[-1] w-[75%] select-none opacity-[0.13] dark:opacity-[0.08]"
          />
          <div>
            <div className="inline-flex size-10 items-center justify-center rounded-xl bg-white/70 dark:bg-black/20 text-[#006838] dark:text-[#d0e3c8]">
              <Plane className="size-5" aria-hidden="true" />
            </div>

            <h2 id="search-title" className="mt-4 text-2xl font-bold leading-tight tracking-tight">
              Find travel plans for your trip
            </h2>
            <p className="mt-2 text-base leading-6 text-[var(--text-sub)] dark:text-[var(--text-sub)]">
              Real-time rate comparison and immediate coverage from accredited insurers.
            </p>

            {/* Stepper / Summary of entered values */}
            <div className="mt-8 space-y-4 rounded-lg bg-white/60 p-4 backdrop-blur-xs dark:bg-black/20 text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4.5 shrink-0 text-[#006838] dark:text-[#d0e3c8]" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--text-main)] dark:text-[var(--text-main)]">Destination</p>
                  <p className="mt-0.5 truncate text-[var(--text-sub)] dark:text-[var(--text-sub)]">
                    {destinationSummary} ({destinationType === 'international' ? 'International' : 'Domestic'})
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 size-4.5 shrink-0 text-[#006838] dark:text-[#d0e3c8]" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--text-main)] dark:text-[var(--text-main)]">Travel dates</p>
                  <p className="mt-0.5 text-[var(--text-sub)] dark:text-[var(--text-sub)]">
                    {departure && returnDate
                      ? `${formatDateDisplay(departure)} – ${formatDateDisplay(returnDate)}`
                      : 'Set departure and return'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="mt-0.5 size-4.5 shrink-0 text-[#006838] dark:text-[#d0e3c8]" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--text-main)] dark:text-[var(--text-main)]">Travellers</p>
                  <p className="mt-0.5 text-[var(--text-sub)] dark:text-[var(--text-sub)]">
                    {travellerSummary} · {tripType === 'annual' ? 'Annual plan' : 'Single trip'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-[#183d2c]/10 pt-5 dark:border-white/10">
            <p className="text-xs text-[var(--text-sub)] dark:text-[var(--text-sub)]">Already saved a quote?</p>
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
    <TermsAndConditionsModal open={tcOpen} onClose={closeTc} />
    <TripSummaryModal
      open={previewPayload !== null}
      onClose={() => setPreviewPayload(null)}
      onContinue={() => previewPayload && commitSearch(previewPayload)}
      isSubmitting={isSubmitting}
      stops={[
        { kind: 'Travelling from', name: destinationLabelOf(originCode) },
        ...countryCodes.map((c, i) => ({
          kind: countryCodes.length > 1 ? `Destination ${i + 1}` : 'Destination',
          name: destinationLabelOf(c),
        })),
        { kind: 'Return to', name: hasReturnLeg ? destinationLabelOf(returnCode) : 'Philippines' },
      ]}
      dates={formatDateRange(departure, returnDate)}
      days={tripDaysLabel(departure, returnDate)}
      rows={[
        { label: 'Travellers', value: String(travellerCount) },
        { label: 'Coverage', value: effectiveCoverageType === 'family' ? 'Family' : 'Individual' },
        { label: 'Trip type', value: tripType === 'annual' ? 'Annual multi-trip' : 'Single trip' },
      ]}
    />
    </>
  )
}
