'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { subDays } from 'date-fns'
import { Users } from 'lucide-react'
import { useForm, useStore } from '@tanstack/react-form'
import { useCreateQuoteRequest } from '@/app/data/mutations/create-quote-request'
import {
  TravelInsuranceFormData,
  travelInsuranceSchema,
} from '@/types/travel-insurance/travel-insurance-request'
import { useTravelInsuranceStore } from '@/store/travel-insurance-store'
import { useAgentCodeStore } from '@/store/agent-code-store'
import { TravelCoverageMap } from '@/constants/travel-coverage'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { MultiSelect } from '@/components/ui/multi-select'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldInfo } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { ComboBox } from '@/components/ui/combobox'
import { getNormalizedTravelCoverages } from '@/utils/travel-coverages-helpers'
import { cn } from '@/lib/utils'

type TravelDetailsFormProps = {
  className?: string
}

export function TravelDetailsForm({ className }: TravelDetailsFormProps) {
  const { mutateAsync } = useCreateQuoteRequest()
  const { agentCode } = useAgentCodeStore()
  const {
    travelDetails,
    updateTravelDetails,
    clientRequest,
    setClientRequest,
    setFormModified,
    setInsurancePlans,
    resetQuoteRefetchCount,
  } = useTravelInsuranceStore()

  // Track domestic mode explicitly — derived from store on init, then controlled by toggle
  const [isDomesticMode, setIsDomesticMode] = useState(() => {
    return travelDetails.travelDetailList?.length > 0 &&
      travelDetails.travelDetailList.every((d) =>
        d?.TravelCountry &&
        TravelCoverageMap.DOMESTIC.some((c) => c.code === d.TravelCountry)
      )
  })

  // Ensure dates are Date objects (fallback in case store rehydration doesn't work perfectly)
  const normalizedTravelDetails = useMemo(() => {
    const details = { ...travelDetails }

    // Convert string dates to Date objects if needed
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

  const form = useForm({
    defaultValues: normalizedTravelDetails,
    onSubmit: async ({ value }) => {
      await submitCompareQuoteRequest({ value })
    },
    // Run validation on blur (and on submit) to avoid blocking canSubmit while the user types
    validators: {
      onChange: travelInsuranceSchema,
      onBlur: travelInsuranceSchema,
      onSubmit: travelInsuranceSchema,
    },
  })

  // Find the code for a country, searching all coverage areas
  const findCountryCodeAnyArea = (country: string) => {
    for (const area of Object.keys(TravelCoverageMap)) {
      const found = TravelCoverageMap[
        area as keyof typeof TravelCoverageMap
      ].find(
        (c: { name: string; code: string }) =>
          c.name === country || c.code === country
      )
      if (found) return found.code
    }
    return country
  }

  const handleUpdateDate = (value: Date) => {
    // Set time to noon to avoid timezone issues
    return new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate(),
      12,
      0,
      0
    )
  }

  const getReturnDateForAnnualTrip = (departureDate: Date) => {
    const returnDate = new Date(departureDate)
    returnDate.setFullYear(returnDate.getFullYear() + 1)
    return returnDate
  }

  const getReturnDateForSingleTrip = (departureDate: Date) => {
    const returnDate = new Date(departureDate)
    returnDate.setDate(returnDate.getDate() + 7)
    return returnDate
  }

  const submitCompareQuoteRequest = async ({
    value,
  }: {
    value: TravelInsuranceFormData
  }) => {
    try {
      const newTravelDetails = value.travelDetailList.map((details) => {
        // To: use selected coverage area logic (already handled)
        const travelCountryCode = findCountryCodeAnyArea(details.TravelCountry)

        // From: always search all areas for the code
        const originCountryCode = findCountryCodeAnyArea(details.PlaceOfOrgin)
        return {
          ...details,
          TravelCountry: travelCountryCode,
          PlaceOfOrgin: originCountryCode,
        }
      })

      value = { ...value, travelDetailList: newTravelDetails }

      updateTravelDetails(value)
      setInsurancePlans(null)
      resetQuoteRefetchCount()
      
      // Clear any previous error state before making new request
      // Don't set status to undefined - just let the new request set it
      
      const clientRequestId = await mutateAsync(value)
      setFormModified(false)
      setClientRequest({
        id: clientRequestId,
        status: 'success',
      })

      const coverageOptions = document.getElementById('coverage-options')
      coverageOptions?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    } catch (err) {
      setClientRequest({ status: 'error' })
      throw err
    }
  }

  const options = getNormalizedTravelCoverages(TravelCoverageMap)
  const currentValues = useStore(form.store, (state) => state.values)

  // "From" field should ALWAYS only show Philippine locations (DOMESTIC) + Philippines itself
  // Destinations can be anywhere in the world
  const fromOptions = useMemo(() => {
    return options.filter((opt) => 
      opt.value === 'PHILIPPINES' ||
      TravelCoverageMap.DOMESTIC.some((country) => country.code === opt.value)
    )
  }, [options])

  const isDetailsFormState = useMemo(() => {
    // If form is submitting or we're already fetching, disable
    if (
      form.state.isSubmitting ||
      (clientRequest.id && clientRequest.status === 'fetching')
    ) {
      return { canSubmit: false, title: 'Searching...' }
    }

    // Use Zod schema to perform a quick validation on currentValues so
    // we can enable the Search button immediately after user edits fields
    try {
      travelInsuranceSchema.parse(currentValues)
      // If parse succeeds, form is valid
      return { canSubmit: true, title: 'Search' }
    } catch (e) {
      // Invalid according to schema
      return { canSubmit: false, title: 'Search' }
    }
  }, [
    form.state.isSubmitting,
    currentValues,
    clientRequest.id,
    clientRequest.status,
  ])

  useEffect(() => {
    // Skip setting form as modified on initial load
    const isInitialLoad =
      JSON.stringify(currentValues) === JSON.stringify(normalizedTravelDetails)
    if (!isInitialLoad) {
      setFormModified(true)
    }
  }, [currentValues, normalizedTravelDetails, setFormModified, form.state])

  return (
    <Card
      className={cn(
        'w-full space-y-6 rounded-md border shadow-lg backdrop-blur-sm lg:rounded-xl',
        className
      )}
      data-testid="travel-details-form"
    >
      <CardContent className="space-y-6 px-4 pt-3 pb-6 sm:px-8">
        <div className="flex flex-col items-stretch justify-end gap-6 sm:flex-row sm:items-center sm:gap-4">
          <form.Field name="isAnnualMultiTrip">
            {(field) => (
              <div className="border-muted-foreground/30 flex w-full rounded-full border bg-gray-100 p-1 sm:w-auto dark:bg-gray-950">
                <button
                  type="button"
                  onClick={() => {
                    field.handleChange(false)
                    setFormModified(true)
                    // When switching to single trip, set return date to 3 days after departure
                    const currentDepartureDate =
                      form.getFieldValue('departureDate')
                    if (currentDepartureDate) {
                      const newReturnDate =
                        getReturnDateForSingleTrip(currentDepartureDate)
                      form.setFieldValue('returnDate', newReturnDate)
                      updateTravelDetails({
                        returnDate: newReturnDate,
                        isAnnualMultiTrip: false,
                      })
                    }
                  }}
                  className={`flex-1 rounded-full px-4 py-3 text-sm font-medium transition-all sm:flex-none sm:px-6 sm:py-2 ${
                    field.state.value === false
                      ? 'bg-lilac text-white shadow-md'
                      : 'text-foreground'
                  }`}
                >
                  Single Trip
                </button>
                <button
                  type="button"
                  onClick={() => {
                    field.handleChange(true)
                    setFormModified(true)
                    const currentDepartureDate =
                      form.getFieldValue('departureDate')
                    if (currentDepartureDate) {
                      const newReturnDate =
                        getReturnDateForAnnualTrip(currentDepartureDate)
                      form.setFieldValue('returnDate', newReturnDate)
                      updateTravelDetails({
                        returnDate: newReturnDate,
                        isAnnualMultiTrip: true,
                      })
                    }
                  }}
                  className={`flex-1 rounded-full px-4 py-3 text-sm font-medium transition-all sm:flex-none sm:px-6 sm:py-2 ${
                    field.state.value === true
                      ? 'bg-lilac text-white shadow-md'
                      : 'text-foreground'
                  }`}
                >
                  Annual Trip
                </button>
              </div>
            )}
          </form.Field>
        </div>

        <div className="relative flex w-full flex-col gap-4 sm:gap-6 lg:flex-row lg:gap-4">
          <form.Field name={`travelDetailList[0].PlaceOfOrgin`}>
            {(placeOfOriginField) => (
              <div className="w-full space-y-2">
                <p className="text-primary text-sm font-medium sm:text-base">
                  From
                </p>
                <ComboBox
                  title="place"
                  options={fromOptions}
                  value={placeOfOriginField.state.value}
                  onValueChange={(value) => {
                    placeOfOriginField.handleChange(value)
                    const updatedTravelDetailList = [
                      ...currentValues.travelDetailList,
                    ]
                    updatedTravelDetailList[0] = {
                      ...updatedTravelDetailList[0],
                      PlaceOfOrgin: value,
                    }
                    updateTravelDetails({
                      travelDetailList: updatedTravelDetailList,
                    })
                    // mark form as modified when user changes the origin
                    setFormModified(true)
                    // canSubmit is computed via Zod on currentValues; no explicit validate call needed
                  }}
                />
                <FieldInfo field={placeOfOriginField} />
              </div>
            )}
          </form.Field>

          <form.Field
            name="travelDetailList"
            children={(field) => {
              const options = getNormalizedTravelCoverages(TravelCoverageMap)

              // Destination options filtered by mode
              const destinationOptions = isDomesticMode
                ? options.filter((opt) =>
                    TravelCoverageMap.DOMESTIC.some((c) => c.code === opt.value)
                  )
                : options.filter((opt) =>
                    !TravelCoverageMap.DOMESTIC.some((c) => c.code === opt.value) &&
                    opt.value !== 'PHILIPPINES'
                  )

              const handleDomesticToggle = (domestic: boolean) => {
                setIsDomesticMode(domestic)
                setFormModified(true)
                const newList = [{
                  TravelCoverageArea: domestic ? 'DOMESTIC' : 'APAC',
                  PlaceOfOrgin: currentValues.travelDetailList?.[0]?.PlaceOfOrgin || '',
                  TravelCountry: '',
                  DisplaySequence: 1,
                }]
                field.handleChange(newList)
                updateTravelDetails({ travelDetailList: newList })
              }

              // Check if there are any destinations selected
              const hasDestinations = field.state.value?.some(
                (d: any) => d?.TravelCountry && d.TravelCountry.trim() !== ''
              )

              return (
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-primary text-sm font-medium sm:text-base">
                      Destinations
                    </p>
                    {/* Domestic toggle */}
                    <div className="border-muted-foreground/30 flex rounded-full border bg-gray-100 p-0.5 dark:bg-gray-950">
                      <button
                        type="button"
                        onClick={() => handleDomesticToggle(false)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                          !isDomesticMode
                            ? 'bg-lilac text-white shadow-sm'
                            : 'text-foreground'
                        }`}
                      >
                        International
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDomesticToggle(true)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                          isDomesticMode
                            ? 'bg-lilac text-white shadow-sm'
                            : 'text-foreground'
                        }`}
                      >
                        Domestic
                      </button>
                    </div>
                  </div>

                  <MultiSelect
                    key={isDomesticMode ? 'domestic' : 'international'}
                    options={destinationOptions}
                    className="dark:bg-input/30 border-muted-foreground/30 relative flex h-12 w-full items-center gap-1.5 overflow-hidden rounded-full border bg-white px-3 hover:bg-white"
                    hideSelectAll={true}
                    singleLine
                    onValueChange={(values) => {
                      // mark form as modified when user changes destinations
                      setFormModified(true)
                      // Filter out empty string values
                      const filtered = values.filter((v) => v !== '')

                      // Function to find coverage area for a country code
                      const findCoverageArea = (countryCode: string) => {
                        if (isDomesticMode) return 'DOMESTIC'
                        for (const [area, countries] of Object.entries(
                          TravelCoverageMap
                        )) {
                          if (
                            (countries as Array<any>).some(
                              (country: any) => country.code === countryCode
                            )
                          ) {
                            return area
                          }
                        }
                        return 'WORLD' // Default fallback
                      }

                      const selectedOrigin =
                        (currentValues.travelDetailList &&
                          currentValues.travelDetailList[0] &&
                          currentValues.travelDetailList[0].PlaceOfOrgin) ||
                        ''

                      // If destinations are cleared, preserve the origin with an empty destination
                      const newTravelDetailList = filtered.length > 0
                        ? filtered.map((code, idx, arr) => ({
                            TravelCoverageArea: findCoverageArea(code),
                            PlaceOfOrgin:
                              idx === 0
                                ? selectedOrigin
                                : (arr[idx - 1] ?? selectedOrigin),
                            TravelCountry: code,
                            DisplaySequence: idx + 1,
                          }))
                        : [
                            {
                              TravelCoverageArea: 'APAC',
                              PlaceOfOrgin: selectedOrigin,
                              TravelCountry: '',
                              DisplaySequence: 1,
                            },
                          ]
                      
                      field.handleChange(newTravelDetailList)
                      updateTravelDetails({
                        travelDetailList: newTravelDetailList,
                      })
                      field.handleBlur()
                    }}
                    defaultValue={
                      (field.state.value ?? [])
                        .map((d: any) =>
                          d && typeof d.TravelCountry === 'string'
                            ? d.TravelCountry
                            : ''
                        )
                        .filter(
                          (v: string) =>
                            typeof v === 'string' && v.trim() !== ''
                        ) ?? []
                    }
                    placeholder={isDomesticMode ? "Select destination city" : "Select your destinations"}
                    autoSize={false}
                  />
                  <FieldInfo field={field} />
                  {!hasDestinations && (field.state.meta.isTouched || field.state.meta.errors.length > 0) && (
                    <p className="text-destructive text-xs">
                      Please select at least one destination
                    </p>
                  )}
                </div>
              )
            }}
          />

          <form.Field name="dateOfBirth">
            {(field) => (
              <div className="w-full space-y-2">
                <p className="text-primary text-sm font-medium sm:text-base">{`Date of Birth ${currentValues.travelType === 'FAMILY' ? 'of Oldest' : ''}`}</p>
                <DateTimePicker
                  variant="date"
                  value={field.state.value ?? undefined}
                  onChange={(value) => {
                    const adjustedDate = handleUpdateDate(value)
                    field.handleChange(adjustedDate)
                  }}
                  disabled={(date) =>
                    date > new Date() || date < new Date('1900-01-01')
                  }
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
        </div>

        <div className="relative flex w-full flex-col gap-4 sm:gap-6 lg:flex-row lg:gap-4">
          <form.Field name="departureDate">
            {(field) => (
              <div className="w-full space-y-2">
                <p className="text-primary text-sm font-medium sm:text-base">
                  Departure Date
                </p>
                <DateTimePicker
                  variant="date"
                  value={field.state.value ?? undefined}
                  onChange={(value) => {
                    const adjustedDate = handleUpdateDate(value)
                    field.handleChange(adjustedDate)
                    updateTravelDetails({ departureDate: adjustedDate })

                    // Auto-update return date based on trip type
                    const isAnnual = form.getFieldValue('isAnnualMultiTrip')
                    if (isAnnual) {
                      const newReturnDate =
                        getReturnDateForAnnualTrip(adjustedDate)
                      form.setFieldValue('returnDate', newReturnDate)
                      updateTravelDetails({ returnDate: newReturnDate })
                    } else {
                      const newReturnDate =
                        getReturnDateForSingleTrip(adjustedDate)
                      form.setFieldValue('returnDate', newReturnDate)
                      updateTravelDetails({ returnDate: newReturnDate })
                    }
                  }}
                  disabled={(date) => date < subDays(new Date(), 1)}
                  fromYear={new Date().getFullYear()}
                  toYear={new Date().getFullYear() + 10}
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>

          <form.Field name="returnDate">
            {(field) => {
              const isAnnual = form.getFieldValue('isAnnualMultiTrip')

              return (
                <div className="w-full space-y-2">
                  <p className="text-primary text-sm font-medium sm:text-base">
                    Return Date
                  </p>
                  <DateTimePicker
                    variant="date"
                    value={field.state.value ?? undefined}
                    onChange={(value) => {
                      const adjustedDate = handleUpdateDate(value)
                      field.handleChange(adjustedDate)
                    }}
                    disabled={(date) => {
                      // If annual trip, disable all dates (return date is auto-calculated)
                      if (isAnnual) return true
                      return date < new Date()
                    }}
                    fromYear={new Date().getFullYear()}
                    toYear={new Date().getFullYear() + 10}
                  />
                  <FieldInfo field={field} />
                </div>
              )
            }}
          </form.Field>

          <div className="w-full space-y-2">
            <p className="text-primary text-sm font-medium sm:text-base">
              Number of Travellers
            </p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-12 w-full justify-start rounded-full !px-8"
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span className="text-sm">
                    {currentValues.noOfAdults} Adults,{' '}
                    {currentValues.noOfChildren} Children
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60 md:w-80" align="start">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="leading-none font-medium">
                      Who's travelling?
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      Set the number of travellers (maximum 10 travelers).
                    </p>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <form.Field
                      name="noOfAdults"
                      children={(field) => (
                        <div className="flex items-center gap-4">
                          <Label
                            htmlFor={field.name}
                            className="text-muted-foreground w-14 font-medium"
                          >
                            Adult
                          </Label>
                          <Input
                            id={field.name}
                            type="number"
                            min={1}
                            max={10}
                            className="h-8 w-16"
                            value={field.state.value ?? ''}
                            onChange={(e) => {
                              const value = Number(e.target.value)
                              const currentChildren = form.getFieldValue('noOfChildren') || 0
                              const total = value + currentChildren
                              
                              // Limit total travelers to 10
                              if (total <= 10 && value >= 1) {
                                field.handleChange(value)
                              } else if (value >= 1) {
                                // If exceeds 10, set adults to max possible
                                field.handleChange(10 - currentChildren)
                              }
                            }}
                            onBlur={field.handleBlur}
                            name={field.name}
                          />
                        </div>
                      )}
                    />
                    <form.Field
                      name="noOfChildren"
                      children={(field) => (
                        <div className="flex items-center gap-4">
                          <Label
                            htmlFor={field.name}
                            className="text-muted-foreground w-14 font-medium"
                          >
                            Children
                          </Label>
                          <Input
                            id={field.name}
                            type="number"
                            min={0}
                            max={10}
                            className="h-8 w-16"
                            value={field.state.value ?? ''}
                            onChange={(e) => {
                              const value = Number(e.target.value)
                              const currentAdults = form.getFieldValue('noOfAdults') || 1
                              const total = currentAdults + value
                              
                              // Limit total travelers to 10
                              if (total <= 10 && value >= 0) {
                                field.handleChange(value)
                              } else if (value >= 0) {
                                // If exceeds 10, set children to max possible
                                field.handleChange(10 - currentAdults)
                              }
                            }}
                            onBlur={field.handleBlur}
                            name={field.name}
                          />
                        </div>
                      )}
                    />
                  </div>

                  <form.Field name="travelType">
                    {(field) => (
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="travelType"
                          checked={field.state.value === 'FAMILY'}
                          onCheckedChange={(checked) => {
                            const value =
                              checked === true ? 'FAMILY' : 'INDIVIDUAL'
                            field.handleChange(value)
                          }}
                        />
                        <Label htmlFor="travelType">
                          We're travelling as a family
                        </Label>
                      </div>
                    )}
                  </form.Field>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="relative flex flex-col gap-4 sm:gap-6 md:flex-row md:items-start md:justify-between">
          <form.Field name="agreedToTerms">
            {(field) => (
              <div className="w-full max-w-80 space-y-2 sm:flex-1">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="terms"
                    checked={field.state.value}
                    onCheckedChange={(value) => {
                      field.handleChange(value as boolean)
                    }}
                    className="data-[state=checked]:border-lilac data-[state=checked]:bg-lilac h-5 w-5"
                  />

                  <Label
                    htmlFor="terms"
                    className="flex cursor-pointer flex-wrap text-sm leading-relaxed"
                  >
                    I agree to the{' '}
                    <Link
                      href="/terms-and-condition"
                      target="_blank"
                      className="text-lilac inline font-medium underline underline-offset-8"
                    >
                      Terms & Conditions
                    </Link>
                  </Label>
                </div>
                <p className="text-muted-foreground text-xs">
                  This travel insurance is valid for air travel only.
                </p>
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                onClick={(e) => {
                  e.preventDefault()
                  form.handleSubmit()
                  setInsurancePlans(null)
                }}
                className="bg-primary from-primary to-accent relative h-12 w-full self-end rounded-full bg-gradient-to-r via-90% px-6 text-sm font-medium text-white shadow-lg hover:bg-green-700 disabled:pointer-events-none disabled:opacity-100 sm:w-auto sm:px-8 dark:text-white"
                size="lg"
              >
                {isDetailsFormState.title}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </CardContent>
    </Card>
  )
}
