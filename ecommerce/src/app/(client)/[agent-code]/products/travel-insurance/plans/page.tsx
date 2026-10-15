'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  MapPin,
  Pencil,
  Users,
} from 'lucide-react'
import { PageLoader } from '@/components/page-loader'
import { Button } from '@/components/ui/button'
import {
  formatDays,
  formatTravelers,
  formatTripRange,
  getTripDays,
  titleCase,
} from '@/utils/trip-summary'
import { NoPlanState, PlanCardSkeleton } from '@/components/ui/insurance-shared'
import {
  JourneyContainer,
  JourneyLayout,
  PageIntro,
} from '@/components/travel-insurance/journey-layout'
import { CoverageOptionsForm } from '@/components/travel-insurance/coverage-options-form'
import { TRAVEL_JOURNEY_STEPS } from '@/constants/travel-journey'
import { useTravelCompare } from '@/hooks/use-travel-compare'
import { travelInsuranceSchemaToInitCompareQuote } from '@/utils/mappers/travel-insurance/init-compare-quote'
import {
  useFullQuoteResponseStore,
  useTravelInsuranceStore,
} from '@/store/travel-insurance-store'

function SummaryChip({
  icon: Icon,
  children,
}: {
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="text-foreground flex min-w-0 items-center gap-2 text-sm font-medium">
      <Icon className="text-primary size-4 shrink-0" />
      <span className="min-w-0">{children}</span>
    </div>
  )
}

export default function TravelPlansPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <TravelPlansPageContent />
    </Suspense>
  )
}

function TravelPlansPageContent() {
  const router = useRouter()
  const params = useParams<{ 'agent-code': string }>()
  const agentCode = params['agent-code']
  const landingPath = `/${agentCode}/products/travel-insurance`

  const {
    travelDetails,
    insurancePlans,
    setInsurancePlans,
    setClientRequest,
    setFormModified,
    resetQuoteRefetchCount,
  } = useTravelInsuranceStore()
  const { resetApiResponse } = useFullQuoteResponseStore()
  const {
    compare,
    status,
    cards,
    clientRequestId,
    error: compareError,
  } = useTravelCompare()

  const [hydrated, setHydrated] = useState(false)
  const started = useRef(false)

  const startSearch = useCallback(() => {
    setInsurancePlans(null)
    resetQuoteRefetchCount()
    setFormModified(false)
    setClientRequest({
      id: 'pending',
      status: 'fetching',
      errorMessage: undefined,
    })
    compare(travelInsuranceSchemaToInitCompareQuote(travelDetails, agentCode))
  }, [
    agentCode,
    compare,
    travelDetails,
    setInsurancePlans,
    resetQuoteRefetchCount,
    setFormModified,
    setClientRequest,
  ])

  useEffect(() => setHydrated(true), [])

  // Kick off the search as soon as the page mounts. If plans are already in
  // the store (e.g. user came back from the avail steps) reuse them.
  useEffect(() => {
    if (!hydrated || started.current) return
    started.current = true

    if (!travelDetails.travelDetailList?.[0]?.TravelCountry) {
      router.replace(landingPath)
      return
    }

    resetApiResponse()
    if (insurancePlans?.data?.length) return
    startSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated])

  // Sync hook results into the store. `cards` is a dependency so a later
  // .insurance.plan.received event refreshes the list (GET is cumulative).
  useEffect(() => {
    if (status === 'ready' && cards) {
      setInsurancePlans(cards)
      setClientRequest({
        id: clientRequestId ?? 'ready',
        status: 'success',
        errorMessage: undefined,
      })
    } else if (status === 'error') {
      setClientRequest({
        id: clientRequestId ?? 'error',
        status: 'error',
        errorMessage:
          compareError?.message || 'Unable to load travel insurance plans.',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, cards])

  const goToSearch = () => router.push(landingPath)

  if (!hydrated || !travelDetails.travelDetailList?.[0]?.TravelCountry)
    return <PageLoader />

  const hasPlans = !!insurancePlans?.data?.length
  const isEmpty =
    status === 'ready' && !!cards && cards.data.length === 0 && !hasPlans
  const isError = status === 'error'
  const isSearching = !hasPlans && !isEmpty && !isError

  const summaryBar = (
    <div className="bg-card border-border flex flex-col gap-2 rounded-xl border px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <SummaryChip icon={MapPin}>
          <span className="flex flex-wrap items-center gap-x-1.5">
            {titleCase(
              travelDetails.travelDetailList[0]?.PlaceOfOrgin
            )}
            <ArrowRight className="text-muted-foreground size-3.5" />
            {travelDetails.travelDetailList
              .map((d) => titleCase(d.TravelCountry))
              .join(', ')}
          </span>
        </SummaryChip>
        <span aria-hidden className="bg-border hidden h-5 w-px sm:block" />
        <SummaryChip icon={CalendarDays}>
          {formatTripRange(
            travelDetails.departureDate,
            travelDetails.returnDate
          )}{' '}
          ·{' '}
          {formatDays(
            getTripDays(
              travelDetails.departureDate,
              travelDetails.returnDate
            )
          )}
        </SummaryChip>
        <span aria-hidden className="bg-border hidden h-5 w-px sm:block" />
        <SummaryChip icon={Users}>
          {formatTravelers(
            travelDetails.noOfAdults,
            travelDetails.noOfChildren
          )}
        </SummaryChip>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 self-start rounded-full sm:self-auto"
        onClick={goToSearch}
      >
        <Pencil className="mr-1.5 size-4" />
        Modify search
      </Button>
    </div>
  )

  return (
    <JourneyLayout
      agentCode={agentCode}
      steps={TRAVEL_JOURNEY_STEPS}
      currentStep={0}
      highestVisitedStep={0}
    >
      <>
        {(isSearching || isEmpty) && (
          <JourneyContainer className="mb-6 space-y-4 sm:space-y-6">
            <PageIntro
              title="Choose your travel plan"
              helper={
                isEmpty
                  ? 'No plans match your trip.'
                  : 'Searching for the best plans for you…'
              }
            />
            {summaryBar}
          </JourneyContainer>
        )}


        {isSearching && (
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:px-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <PlanCardSkeleton key={i} />
            ))}
          </div>
        )}

        {isEmpty && <NoPlanState onModifySearch={goToSearch} />}

        {(hasPlans || isError) && (
          <CoverageOptionsForm onRetry={startSearch} summary={summaryBar} />
        )}
      </>
      {hasPlans && (
        <div className="border-border bg-card fixed right-0 bottom-0 left-0 z-30 border-t px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <button
              type="button"
              onClick={goToSearch}
              className="border-border bg-card text-foreground shrink-0 rounded-full border px-4 py-2.5 text-xs font-semibold"
            >
              <ArrowLeft className="mr-1 inline size-3.5" />
              Back
            </button>
            <div className="min-w-0 flex-1 text-center">
              <p className="text-muted-foreground text-[10px] leading-none">
                Your trip
              </p>
              <p className="text-primary truncate text-sm leading-tight font-black">
                {titleCase(
                  travelDetails.travelDetailList[0]?.PlaceOfOrgin ?? ''
                )}{' '}
                →{' '}
                {travelDetails.travelDetailList
                  .map((d) => titleCase(d.TravelCountry))
                  .join(', ')}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById('plan-list')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
              className="from-primary to-lilac text-primary-foreground shrink-0 rounded-full bg-gradient-to-r px-5 py-2.5 text-xs font-semibold"
            >
              View Plans
            </button>
          </div>
        </div>
      )}
    </JourneyLayout>
  )
}
