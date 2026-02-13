'use client'

import { useRouter } from 'next/navigation'
import { ChangeEvent, useMemo, useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  ClientRequest,
  useTravelInsuranceStore,
} from '@/store/travel-insurance-store'
import { Skeleton } from '@/components/ui/skeleton'
import { InsurancePlan, TravelInsuranceApiResponse } from '@/types/plan'
import { TravelInsurancePlan } from './insurance-plan'
import ServerOffline from '../server-offline'
import { Input } from '../ui/input'
import { useDebounce } from '@/hooks/use-debounce'
import { ArrowDownUp } from 'lucide-react'
import { removeStorage } from '@/utils/remove-session-storage'
import { useAgentCodeStore } from '@/store/agent-code-store'
import { getEcho } from '@/lib/echo'
import axios from 'axios'
import { TravelCompareQuoteResponse } from '@/types/travel-insurance/compare-quote'
import { storePlanName } from '@/utils/custom-fields-storage'

function ServerConnectionIssue() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <svg
              className="h-8 w-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        </div>

        <h3 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
          Server Connection Issue
        </h3>

        <p className="mb-6 text-gray-600 dark:text-gray-300">
          We're experiencing technical difficulties. Our team has been notified
          and is working to resolve this issue.
        </p>

        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          If the problem persists, please contact our support team.
        </p>
      </div>
    </div>
  )
}

export function CoverageOptionsForm() {
  const router = useRouter()
  const {
    isFormModified,
    coverageOption,
    clientRequest,
    travelDetails,
    quoteRefetchCount,
    insurancePlans,
    setClientRequest,
    updateCoverageOption,
    resetForm,
    incrementQuoteRefetchCount,
    resetQuoteRefetchCount,
    setInsurancePlans,
    updateCustomFields,
  } = useTravelInsuranceStore()
  const { agentCode } = useAgentCodeStore()

  // refs for Echo instance, subscribed channel, and queue processing
  const echoRef = useRef<any>(null)
  const channelRef = useRef<any>(null)
  const queue = useRef<any[]>([]) // Queue to store WebSocket responses
  const isProcessing = useRef(false) // Flag to track if the queue is being processed

  const closeEchoConnection = () => {
    try {
      if (clientRequest.id && echoRef.current) {
        echoRef.current.leave?.(clientRequest.id)
      }

      const connector = echoRef.current?.connector as any
      if (connector?.pusher?.disconnect) {
        connector.pusher.disconnect()
      }

      channelRef.current = null
      echoRef.current = null
    } catch (err) {}
  }

  const hasHydrated = useTravelInsuranceStore.persist?.hasHydrated()
  const [hasReachedLimit, setHasReachedLimit] = useState(false)
  const isEnabled = hasHydrated && !!clientRequest.id && !hasReachedLimit
  const setStatus = (status: ClientRequest['status']) => {
    setClientRequest({ status: status })
  }

  const [isLoading, setIsLoading] = useState(false) // Tracks loading state
  const [isError, setIsError] = useState(false) // Tracks error state

  // Configuration constants
  const CONCURRENCY_LIMIT = 5
  const REQUEST_TIMEOUT = 10000 // 10 seconds

  // Helper function: Fetch plan with timeout
  const fetchPlanWithTimeout = async (
    cacheKey: string,
    timeout: number
  ): Promise<TravelCompareQuoteResponse['data'] | null> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const startTime = performance.now()

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_URL}/quote/compare/${cacheKey}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_ACCESS_TOKEN}`,
          },
          signal: controller.signal,
        }
      )

      const endTime = performance.now()
      console.log(
        `✅ Cache key ${cacheKey} fetched in ${(endTime - startTime).toFixed(2)}ms`
      )

      clearTimeout(timeoutId)

      const data = response.data as TravelCompareQuoteResponse
      if (!data.success || data.data.Plans.length === 0) {
        console.log(`⚠️ Cache key ${cacheKey} returned no valid plans`)
        return null
      }

      return removeNullBenefitCodeItems(data).data
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
        console.warn(`⏱️ Request timeout for cache key: ${cacheKey}`)
      } else {
        console.error(`❌ Error fetching cache key ${cacheKey}:`, error.message)
      }
      return null
    }
  }

  // Helper function: Update plans state
  const updatePlansState = (
    newPlans: TravelCompareQuoteResponse['data'][]
  ): void => {
    const currentPlans = useTravelInsuranceStore.getState().insurancePlans

    if (!currentPlans) {
      // First batch of plans
      setInsurancePlans({
        success: true,
        message: 'Plans loaded',
        data: newPlans,
      })
    } else {
      // Append to existing plans
      setInsurancePlans({
        ...currentPlans,
        data: [...currentPlans.data, ...newPlans],
      })
    }
  }

  useEffect(() => {
    if (clientRequest.id !== undefined) {
      const echo = getEcho()

      if (echo.connector.pusher.connection.state !== 'connected') {
        echo.connector.pusher.connect()
      }

      const processQueue = async () => {
        if (isProcessing.current) {
          console.log('⏸️ Queue processor already running, skipping duplicate call')
          return
        }
        
        isProcessing.current = true
        setIsLoading(true)

        const startTime = performance.now()
        const totalItems = queue.current.length
        console.log(`🚀 Starting queue processing with ${totalItems} items`)

        while (queue.current.length > 0) {
          // Take up to CONCURRENCY_LIMIT items from queue
          const batch = queue.current.splice(0, CONCURRENCY_LIMIT)
          console.log(
            `📦 Processing batch of ${batch.length} items, ${queue.current.length} remaining in queue`
          )

          // Process batch in parallel using Promise.allSettled
          const results = await Promise.allSettled(
            batch.map((cacheKey) =>
              fetchPlanWithTimeout(cacheKey, REQUEST_TIMEOUT)
            )
          )

          // Collect successful results
          const successfulPlans = results
            .filter(
              (r): r is PromiseFulfilledResult<TravelCompareQuoteResponse['data']> =>
                r.status === 'fulfilled' && r.value !== null
            )
            .map((r) => r.value)

          const failedCount = batch.length - successfulPlans.length
          console.log(
            `✅ Batch complete: ${successfulPlans.length} successful, ${failedCount} failed`
          )

          // Batch update state
          if (successfulPlans.length > 0) {
            updatePlansState(successfulPlans)
          }

          // If all requests in batch failed, set error state
          if (successfulPlans.length === 0 && batch.length > 0) {
            setIsError(true)
          }
        }

        const endTime = performance.now()
        const duration = (endTime - startTime).toFixed(2)
        console.log(`✨ Queue processing complete in ${duration}ms (processed ${totalItems} items)`)

        isProcessing.current = false
        setIsLoading(false)
      }

      const channel = echo
        .channel(clientRequest.id)
        .listen('.insurance.plan.received', (e: any) => {
          const cacheKey = e['cache_key']
          const timestamp = new Date().toISOString()
          
          queue.current.push(cacheKey)
          
          console.log(`📨 WebSocket event received at ${timestamp}`)
          console.log(`   Cache key: ${cacheKey}`)
          console.log(`   Queue size: ${queue.current.length}`)
          console.log(`   Processing: ${isProcessing.current ? 'Yes' : 'No'}`)
          
          processQueue()
        })
      setClientRequest({ ...clientRequest, status: 'success' })
      echoRef.current = echo
      channelRef.current = channel
    }

    return () => {
      closeEchoConnection()
    }
  }, [clientRequest.id])

  // Handle page unload to cancel ongoing requests
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Cancel any ongoing travel quote requests
      if (isLoading) {
        // Set status to indicate cancellation
        setStatus('error')

        // The AbortController in React Query will automatically cancel the HTTP request
        // but we can also clean up any local state if needed
        setHasReachedLimit(true)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isLoading, setStatus, setHasReachedLimit])

  const [searchFilter, setSearchFilter] = useState('')
  const debouncedSearchFilter = useDebounce(searchFilter, 300)

  const handleSearchInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchFilter(event.target.value)
  }

  const allTravelPlans = useMemo(() => {
    const plans = insurancePlans?.data.flatMap(({ Plans, ...item }: any) =>
      Plans.map((plan: any) => ({
        ...item,
        Plan: plan,
      }))
    )

    if (!plans) return []

    const lowerFilter = debouncedSearchFilter.toLowerCase()

    return plans
      .filter(
        (plan: any) =>
          plan.CarrierCode.toLowerCase().includes(lowerFilter) ||
          plan.Plan.CarrierPlanDesc.toLowerCase().includes(lowerFilter)
      )
      .slice()
  }, [insurancePlans?.data, debouncedSearchFilter])

  const handleSelectPlan = (plan: InsurancePlan, carrierCode: string) => {
    if (!travelDetails.agreedToTerms) {
      alert('Please agree to the terms and conditions before proceeding.')
      return
    }
    
    // Store only PlanName in CustomFields for the issue-quote API
    const customFields = {
      PlanName: plan.CarrierPlanDesc, // Use CarrierPlanDesc value as PlanName
    }
    
    // Store in localStorage for immediate access
    storePlanName(plan.CarrierPlanDesc) // Store PlanName specifically
    
    // Store in Zustand store for app-wide access
    updateCustomFields(customFields)
    
    updateCoverageOption({ selectedPlan: plan, carrierCode })
    
    console.log('Plan selected - CustomFields stored for issue-quote:', customFields)
    
    // close websocket/echo connection before navigating away
    closeEchoConnection()
    router.push(`/${agentCode}/products/travel-insurance/avail`)
  }

  const handleRefetch = () => {
    if (hasReachedLimit) return

    incrementQuoteRefetchCount()

    if (quoteRefetchCount >= 5) {
      setHasReachedLimit(true)
      resetForm()
      removeStorage('travel-insurance-form')
      // reached retry limit — ensure any open echo connection is closed
      closeEchoConnection()
      return
    }

    // Only refetch if we have a valid client request ID
    if (clientRequest?.id) {
      // refetch()
    }
  }

  if (hasReachedLimit || quoteRefetchCount > 3) {
    return <ServerConnectionIssue />
  }

  if (!clientRequest.id) {
    return null
  }

  if (isError) {
    return <ServerOffline onRefresh={handleRefetch} />
  }

  const isPlansFetching = isLoading || !insurancePlans?.data?.[0].Plans

  return (
    <div className="relative w-full overflow-hidden border-0">
      {/* Overlay when form is modified */}
      {isFormModified && (
        <div className="absolute inset-0 z-20 flex items-start justify-center bg-black/60 pt-8 backdrop-blur-sm">
          <div className="mx-4 max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4">
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                Update Your Search
              </h3>
              <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
                You've made changes to your travel details. Please click the{' '}
                <span className="text-primary font-semibold">Search</span>{' '}
                button to update your coverage options with the latest
                information.
              </p>
            </div>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={() => {
                  const travelForm =
                    document.querySelector(
                      '[data-testid="travel-details-form"]'
                    ) || document.querySelector('form')
                  const searchButton = travelForm?.querySelector(
                    'button[type="submit"]'
                  ) as HTMLButtonElement
                  if (searchButton) {
                    searchButton.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center',
                    })
                    setTimeout(() => searchButton.focus(), 500)
                  }
                }}
                className="bg-primary hover:bg-primary/90 focus:ring-primary rounded-full px-6 py-3 text-sm font-medium text-white transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
              >
                Go to Search Button
              </button>
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Scroll to Top
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="border-t-muted-foreground/10 flex border-t px-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 py-6 sm:gap-6 sm:py-8">
          <div className="w-full text-center">
            <h1 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-2xl font-black text-transparent sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
              Choose your Travel Plans
            </h1>
          </div>

          <div className="flex justify-start gap-2">
            <div className="w-full max-w-md flex-1/2">
              <Input
                className="h-10 w-full sm:h-12"
                placeholder="Search plans..."
                value={searchFilter}
                onChange={handleSearchInputChange}
              />
            </div>
            <Button
              type="button"
              className="bg-primary from-primary to-accent relative h-10 w-full flex-1/2 self-end rounded-full bg-gradient-to-r via-90% px-6 text-sm font-medium text-white shadow-lg hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:w-auto lg:max-w-48 dark:text-white"
              size="lg"
            >
              <ArrowDownUp />
              Recommended
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-1.5">
        {!insurancePlans || !insurancePlans ? (
          <div className="min-h-screen">
            <div className="mx-auto w-full max-w-7xl space-y-4">
              <Skeleton className="h-16 w-full p-4" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((_, index) => (
                  <Skeleton className="h-96 w-full" key={index} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative grid h-full min-h-[60vh] w-full gap-3 pb-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {allTravelPlans.map((item: any) => (
              <TravelInsurancePlan
                key={item.Plan.CarrierPlanCode}
                plan={item.Plan}
                carrierCode={item.CarrierCode}
                selectedPlan={coverageOption.selectedPlan?.CarrierPlanCode}
                isAvailable={!isFormModified}
                onSelectPlan={(plan, carrierCode) => {
                  handleSelectPlan(plan, carrierCode)
                  resetQuoteRefetchCount()
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function removeNullBenefitCodeItems(
  response: TravelCompareQuoteResponse
): TravelCompareQuoteResponse {
  // Create a deep copy to avoid mutating the original object
  const cleanedResponse: TravelCompareQuoteResponse = JSON.parse(
    JSON.stringify(response)
  )

  // Process each plan
  cleanedResponse.data.Plans.forEach((plan) => {
    // Filter out AddonBenefits with null BenefitCode
    if (plan.AddonBenefits) {
      plan.AddonBenefits = plan.AddonBenefits.filter(
        (benefit) => benefit.BenefitCode !== null
      )
    }

    // Filter out MainBenefits with null BenefitCode
    if (plan.MainBenefits) {
      plan.MainBenefits = plan.MainBenefits.filter(
        (benefit) => benefit.BenefitCode !== null
      )
    }
  })

  cleanedResponse.data.Plans = cleanedResponse.data.Plans.filter(
    (plan) => plan.MainBenefits && plan.MainBenefits.length > 0
  )

  return cleanedResponse
}
