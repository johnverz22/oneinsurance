'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
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
import { TripStickyBar } from '@/components/travel-insurance/trip-sticky-bar'
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
    updateCoverageOption,
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
    // Returning to the plan list clears add-on selections — they belong to
    // the previously chosen plan and are re-picked on the details step.
    updateCoverageOption({ selectedAddonBenefits: [] })
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

  const renderSummary = (actions?: React.ReactNode) => (
    <div className="bg-card border-border hidden flex-col rounded-xl border px-4 py-2.5 sm:flex">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
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
        Edit search
      </Button>
      </div>
      {actions && (
        <div className="border-border mt-2.5 hidden items-center gap-3 border-t pt-2.5 lg:flex">
          {actions}
        </div>
      )}
    </div>
  )
  const summaryBar = renderSummary()

  return (
    <JourneyLayout
      agentCode={agentCode}
      steps={TRAVEL_JOURNEY_STEPS}
      currentStep={0}
      highestVisitedStep={0}
      headerClassName="relative"
      stickyProgress
      className="pb-8 max-sm:pt-0 lg:pb-12"
    >
      <>
        {/* Mobile/tablet pinned trip bar — journey header scrolls away, this stays */}
        <TripStickyBar onEdit={goToSearch} />

        {(isSearching || isEmpty) && (
          <JourneyContainer className="mb-6 space-y-4 max-sm:pt-4 sm:space-y-6">
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
          <CoverageOptionsForm onRetry={startSearch} summary={renderSummary} />
        )}
      </>
    </JourneyLayout>
  )
}
