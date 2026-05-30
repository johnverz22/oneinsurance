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
import { COMPANIES } from '@/constants/companies'
import pacificCrossPlansData from '@/constants/pacific-cross-travel-plans.json'
import pacificCrossAsiaPlansData from '@/constants/pacific-cross-travel-plans-asia.json'
import pacificCrossDomesticPlansData from '@/constants/pacific-cross-travel-plans-domestic.json'

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
    resetCoverageOption,
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
  const [expectedProviders, setExpectedProviders] = useState(0) // Track expected number of providers
  const [receivedProviders, setReceivedProviders] = useState(0) // Track received providers
  const receivedProvidersRef = useRef(0) // Ref to track received providers without stale closure
  const expectedProvidersRef = useRef(0) // Ref to track expected providers without stale closure
  const allProvidersTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null) // Timeout for all providers

  // Configuration constants
  const CONCURRENCY_LIMIT = 5
  const REQUEST_TIMEOUT = 15000 // 15 seconds per request
  const ALL_PROVIDERS_TIMEOUT = 30000 // 30 seconds max wait for all providers

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
        `/api/travel-insurance/load-quote-by-cache?cacheKey=${cacheKey}`,
        {
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
      } else if (error.message === 'canceled' || error.message?.includes('cancel')) {
        // Silently ignore canceled requests (happens when navigating away)
        console.log(`ℹ️ Request canceled for cache key: ${cacheKey}`)
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
      // First batch of plans — reset any previously selected plan
      resetCoverageOption()
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

  // Helper: check plans and finalize loading state
  const finalizeLoading = () => {
    console.log(`🏁 finalizeLoading called — received: ${receivedProvidersRef.current}, expected: ${expectedProvidersRef.current}`)
    const currentPlans = useTravelInsuranceStore.getState().insurancePlans
    const hasAnyPlans = currentPlans?.data?.some((provider: any) => provider.Plans && provider.Plans.length > 0)
    if (!hasAnyPlans) {
      console.log('❌ No plans available from any provider - showing error')
      setIsError(true)
      // Reset clientRequest status so the Search button stops showing "Searching..."
      setClientRequest({ ...useTravelInsuranceStore.getState().clientRequest, status: 'error' })
    } else {
      console.log('✅ Plans available - clearing any error state')
      setIsError(false)
    }
    // Clear timeout
    if (allProvidersTimeoutRef.current) {
      clearTimeout(allProvidersTimeoutRef.current)
      allProvidersTimeoutRef.current = null
    }
    isProcessing.current = false
    setIsLoading(false)

    // Keep WebSocket open for a grace period to catch late-arriving providers
    setTimeout(() => {
      closeEchoConnection()
      console.log('🔌 WebSocket connection closed after grace period')
    }, 15000)
  }

  useEffect(() => {
    if (clientRequest.id !== undefined) {
      // Reset error state and counters when starting a new search
      setIsError(false)
      receivedProvidersRef.current = 0
      expectedProvidersRef.current = 0
      setExpectedProviders(0)
      setReceivedProviders(0)

      // Clear any previous timeout
      if (allProvidersTimeoutRef.current) {
        clearTimeout(allProvidersTimeoutRef.current)
        allProvidersTimeoutRef.current = null
      }

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

          // Don't set error here - wait until all batches are processed
        }

        const endTime = performance.now()
        const duration = (endTime - startTime).toFixed(2)
        console.log(`✨ Queue processing complete in ${duration}ms (processed ${totalItems} items)`)

        // Increment received providers count using ref (avoids stale closure)
        receivedProvidersRef.current += 1
        setReceivedProviders(receivedProvidersRef.current)
        console.log(`📊 Received ${receivedProvidersRef.current}/${expectedProvidersRef.current} providers`)

        // Only check for errors after ALL providers have responded
        if (receivedProvidersRef.current >= expectedProvidersRef.current) {
          console.log('🔍 All providers received - checking for plans...')
          
          // Small delay to ensure state is updated
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // Clear the hard timeout since all providers responded
          if (allProvidersTimeoutRef.current) {
            clearTimeout(allProvidersTimeoutRef.current)
            allProvidersTimeoutRef.current = null
          }

          finalizeLoading()
        } else {
          console.log(`⏳ Waiting for more providers (${receivedProvidersRef.current}/${expectedProvidersRef.current})...`)
          isProcessing.current = false
          // Show plans immediately if we have any — don't wait for all providers
          const currentPlans = useTravelInsuranceStore.getState().insurancePlans
          const hasPlans = currentPlans?.data?.some((p: any) => p.Plans && p.Plans.length > 0)
          if (hasPlans) {
            // Display what we have now, keep listening for more providers
            setIsLoading(false)
            setIsError(false)
          }
          // Keep the timeout running — it will finalize when remaining providers respond or time out
        }
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

          // Set expected providers from the event if available, otherwise default to 2
          if (expectedProvidersRef.current === 0) {
            const count = e['total_providers'] ?? 2
            expectedProvidersRef.current = count
            setExpectedProviders(count)
            console.log(`📋 Expected providers set to: ${count} (raw value from event: ${e['total_providers']})`)

            // Hard timeout fallback — if not all providers respond within timeout, finalize anyway
            if (allProvidersTimeoutRef.current) clearTimeout(allProvidersTimeoutRef.current)
            allProvidersTimeoutRef.current = setTimeout(() => {
              console.log(`⏰ Timeout reached — finalizing with ${receivedProvidersRef.current}/${expectedProvidersRef.current} providers`)
              finalizeLoading()
            }, ALL_PROVIDERS_TIMEOUT)
          } else {
            // After first provider responded, keep waiting for remaining providers
            if (allProvidersTimeoutRef.current) clearTimeout(allProvidersTimeoutRef.current)
            allProvidersTimeoutRef.current = setTimeout(() => {
              console.log(`⏰ Short timeout reached — finalizing with ${receivedProvidersRef.current}/${expectedProvidersRef.current} providers`)
              finalizeLoading()
            }, 20000)
          }
          
          processQueue()
        })
      setClientRequest({ ...clientRequest, status: 'success' })
      echoRef.current = echo
      channelRef.current = channel
    }

    return () => {
      closeEchoConnection()
      if (allProvidersTimeoutRef.current) {
        clearTimeout(allProvidersTimeoutRef.current)
        allProvidersTimeoutRef.current = null
      }
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
  const [sortBy, setSortBy] = useState<'lowest' | 'highest' | 'addons' | 'discounts'>('lowest')
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])
  const [selectedCoverages, setSelectedCoverages] = useState<string[]>([])
  const planListRef = useRef<HTMLDivElement>(null)

  const scrollToPlans = () => {
    setTimeout(() => {
      planListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }
  const handleSearchInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchFilter(event.target.value)
  }

  const toggleProvider = (code: string) => {
    setSelectedProviders((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
    scrollToPlans()
  }

  const toggleCoverage = (coverage: string) => {
    setSelectedCoverages((prev) =>
      prev.includes(coverage) ? prev.filter((c) => c !== coverage) : [...prev, coverage]
    )
    scrollToPlans()
  }

  const allTravelPlans = useMemo(() => {
    // Dynamic plans from WebSocket (Malayan, Oona, etc.)
    const dynamicPlans = insurancePlans?.data.flatMap(({ Plans, ...item }: any) =>
      Plans.map((plan: any) => ({
        ...item,
        Plan: plan,
      }))
    ) || []

    // Static Pacific Cross plans — only show after dynamic plans have loaded (compare-quote was called)
    // Filter based on destination type from travel details
    const pacificPlans = insurancePlans?.data
      ? (() => {
          const coverageArea = travelDetails.travelDetailList?.[0]?.TravelCoverageArea || ''
          const isDomestic = coverageArea === 'DOMESTIC'
          const isApac = coverageArea === 'APAC'

          if (isDomestic) {
            // Domestic destination → only show domestic plans
            return pacificCrossDomesticPlansData.Plans.map((plan: any) => ({
              CarrierCode: pacificCrossDomesticPlansData.CarrierCode,
              IsExternalLink: pacificCrossDomesticPlansData.IsExternalLink,
              RedirectUrl: pacificCrossDomesticPlansData.RedirectUrl,
              Plan: plan,
            }))
          } else if (isApac) {
            // Asia/APAC destination → show world + asia plans
            return [
              ...pacificCrossPlansData.Plans.map((plan: any) => ({
                CarrierCode: pacificCrossPlansData.CarrierCode,
                IsExternalLink: pacificCrossPlansData.IsExternalLink,
                RedirectUrl: pacificCrossPlansData.RedirectUrl,
                Plan: plan,
              })),
              ...pacificCrossAsiaPlansData.Plans.map((plan: any) => ({
                CarrierCode: pacificCrossAsiaPlansData.CarrierCode,
                IsExternalLink: pacificCrossAsiaPlansData.IsExternalLink,
                RedirectUrl: pacificCrossAsiaPlansData.RedirectUrl,
                Plan: plan,
              })),
            ]
          } else {
            // SCHENGEN / WORLD (non-Asia international) → world plans only
            return pacificCrossPlansData.Plans.map((plan: any) => ({
              CarrierCode: pacificCrossPlansData.CarrierCode,
              IsExternalLink: pacificCrossPlansData.IsExternalLink,
              RedirectUrl: pacificCrossPlansData.RedirectUrl,
              Plan: plan,
            }))
          }
        })()
      : []

    const allPlans = [...dynamicPlans, ...pacificPlans]

    if (!allPlans.length) return []

    const lowerFilter = debouncedSearchFilter.toLowerCase()

    return allPlans
      .filter(
        (plan: any) =>
          plan.CarrierCode.toLowerCase().includes(lowerFilter) ||
          plan.Plan.CarrierPlanDesc.toLowerCase().includes(lowerFilter)
      )
      .filter((plan: any) =>
        selectedProviders.length === 0 || selectedProviders.includes(plan.CarrierCode)
      )
      .filter((plan: any) => {
        // Filter by selected coverages
        if (selectedCoverages.length === 0) return true
        const allBenefits = [...(plan.Plan.MainBenefits || []), ...(plan.Plan.AddonBenefits || [])]
        const planCoverages = allBenefits.map((b: any) => b.CoverageName || b.SubCoverageName).filter(Boolean)
        return selectedCoverages.some((c) => planCoverages.includes(c))
      })
      .filter((plan: any) => {
        // Filter by add-ons: only show plans that actually have AddonBenefits with data
        if (sortBy === 'addons') {
          return plan.Plan.AddonBenefits && plan.Plan.AddonBenefits.length > 0
        }
        // Filter by discounts: only show plans that have a Discount field with a value > 0
        if (sortBy === 'discounts') {
          const discount = Number(plan.Plan.Discount || plan.Plan.DiscountAmount || 0)
          return discount > 0
        }
        return true
      })
      .sort((a: any, b: any) => {
        if (sortBy === 'lowest') {
          return Number(a.Plan.DuePremium) - Number(b.Plan.DuePremium)
        }
        if (sortBy === 'addons') {
          // Among plans with add-ons, sort by number of add-ons descending
          const aAddons = (a.Plan.AddonBenefits || []).length
          const bAddons = (b.Plan.AddonBenefits || []).length
          return bAddons - aAddons
        }
        if (sortBy === 'discounts') {
          // Among discounted plans, sort by discount amount descending
          const aDiscount = Number(a.Plan.Discount || a.Plan.DiscountAmount || 0)
          const bDiscount = Number(b.Plan.Discount || b.Plan.DiscountAmount || 0)
          return bDiscount - aDiscount
        }
        // highest sum insured — use the max Silimit from MainBenefits or AddonBenefits
        const getMaxSi = (plan: any) => {
          const allBenefits = [...(plan.MainBenefits || []), ...(plan.AddonBenefits || [])]
          return Math.max(0, ...allBenefits.map((b: any) => Number(b.Silimit || 0)))
        }
        return getMaxSi(b.Plan) - getMaxSi(a.Plan)
      })
  }, [insurancePlans?.data, debouncedSearchFilter, sortBy, selectedProviders, selectedCoverages, travelDetails.travelDetailList])

  // Get available providers from loaded plans
  const availableProviders = useMemo(() => {
    const dynamicProviders = insurancePlans?.data ? insurancePlans.data.map((d: any) => d.CarrierCode) : []
    // Only include Pacific Cross after dynamic plans have loaded
    const allProviders = insurancePlans?.data ? [...dynamicProviders, pacificCrossPlansData.CarrierCode] : []
    return Array.from(new Set(allProviders)) as string[]
  }, [insurancePlans?.data])

  // Get available coverages from loaded plans
  const availableCoverages = useMemo(() => {
    const coverages = new Set<string>()
    // Dynamic plans
    if (insurancePlans?.data) {
      insurancePlans.data.forEach((provider: any) => {
        provider.Plans.forEach((plan: any) => {
          const allBenefits = [...(plan.MainBenefits || []), ...(plan.AddonBenefits || [])]
          allBenefits.forEach((b: any) => {
            const name = b.CoverageName || b.SubCoverageName
            if (name) coverages.add(name)
          })
        })
      })
    }
    // Pacific Cross static plans
    pacificCrossPlansData.Plans.forEach((plan: any) => {
      const allBenefits = [...(plan.MainBenefits || []), ...(plan.AddonBenefits || [])]
      allBenefits.forEach((b: any) => {
        const name = b.CoverageName || b.SubCoverageName
        if (name) coverages.add(name)
      })
    })
    pacificCrossAsiaPlansData.Plans.forEach((plan: any) => {
      const allBenefits = [...(plan.MainBenefits || []), ...(plan.AddonBenefits || [])]
      allBenefits.forEach((b: any) => {
        const name = b.CoverageName || b.SubCoverageName
        if (name) coverages.add(name)
      })
    })
    pacificCrossDomesticPlansData.Plans.forEach((plan: any) => {
      const allBenefits = [...(plan.MainBenefits || []), ...(plan.AddonBenefits || [])]
      allBenefits.forEach((b: any) => {
        const name = b.CoverageName || b.SubCoverageName
        if (name) coverages.add(name)
      })
    })
    return Array.from(coverages).sort()
  }, [insurancePlans?.data])

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

  // Don't show anything if no search has been performed yet
  if (!clientRequest.id) {
    return null
  }

  if (isError) {
    const errorMessage = clientRequest.errorMessage || ''
    const isAuthError = errorMessage.toLowerCase().includes('agent') ||
      errorMessage.toLowerCase().includes('authorized') ||
      errorMessage.toLowerCase().includes('lob') ||
      errorMessage.toLowerCase().includes('slug') ||
      errorMessage.toLowerCase().includes('validation')

    if (isAuthError) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center px-4 py-16">
          <div className="mx-auto max-w-lg rounded-2xl border border-orange-200 bg-orange-50 p-8 text-center shadow-sm">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
                <svg className="h-7 w-7 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
            </div>
            <h3 className="mb-2 text-lg font-bold text-orange-800">This Insurance is Currently Unavailable</h3>
            <p className="mb-4 text-sm text-orange-700">
              We're sorry, but travel insurance plans are not currently available through this link. This may be because the service is not yet enabled for this agent.
            </p>
            <p className="text-xs text-orange-600">
              Please contact your agent or reach out to our support team for assistance.
            </p>
          </div>
        </div>
      )
    }

    return <ServerOffline onRefresh={handleRefetch} />
  }

  const isPlansFetching = (isLoading || !insurancePlans?.data?.[0]?.Plans) && !!clientRequest.id && !isError
  const hasPlans = insurancePlans?.data && insurancePlans.data.length > 0

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
          {isPlansFetching ? (
            <>
              <div className="w-full text-center">
                <Skeleton className="mx-auto h-10 w-[70%] sm:h-12 md:h-14" />
              </div>
              <div className="flex justify-start gap-2">
                <Skeleton className="h-10 w-full max-w-md flex-1/2 rounded-full sm:h-12" />
                <Skeleton className="h-10 w-full flex-1/2 rounded-full sm:h-12 sm:w-auto lg:max-w-48" />
              </div>
            </>
          ) : (
            <>
              <div className="w-full text-center">
                <h1 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-2xl font-black leading-tight text-transparent sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
                  Choose your Travel Plans
                </h1>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-start">
                <div className="w-full sm:max-w-md">
                  <Input
                    className="h-10 w-full sm:h-12"
                    placeholder="Search plans..."
                    value={searchFilter}
                    onChange={handleSearchInputChange}
                  />
                </div>
                <Button
                  type="button"
                  className="bg-primary from-primary to-accent relative hidden h-10 self-end rounded-full bg-gradient-to-r via-90% px-6 text-sm font-medium text-white shadow-lg hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex sm:h-12 sm:w-auto lg:max-w-48 dark:text-white"
                  size="lg"
                >
                  <ArrowDownUp />
                  Recommended
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-1.5">
        {isPlansFetching ? (
          <div className="relative flex min-h-[60vh] gap-6 pb-6">
            {/* Sidebar skeleton */}
            <aside className="hidden w-[200px] shrink-0 lg:block">
              <div className="sticky top-4 space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-22" />
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-30" />
                  <Skeleton className="h-3 w-26" />
                </div>
              </div>
            </aside>
            {/* Plan cards skeleton */}
            <div className="flex flex-1 flex-col gap-4">
              <Skeleton className="h-4 w-56" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex w-full overflow-hidden rounded-xl border">
                  <Skeleton className="w-[140px] sm:w-[160px] md:w-[180px] h-[120px] rounded-none" />
                  <div className="flex flex-1 flex-col justify-center p-4 sm:p-5 gap-3">
                    <Skeleton className="h-5 w-[55%]" />
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                      <div><Skeleton className="h-4 w-16 mb-1" /><Skeleton className="h-3 w-24" /></div>
                      <div><Skeleton className="h-4 w-16 mb-1" /><Skeleton className="h-3 w-24" /></div>
                      <div><Skeleton className="h-4 w-16 mb-1" /><Skeleton className="h-3 w-24" /></div>
                    </div>
                  </div>
                  <div className="flex w-[140px] sm:w-[160px] md:w-[180px] shrink-0 flex-col items-center justify-center border-l p-4 gap-2">
                    <Skeleton className="h-7 w-16" />
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-8 w-full rounded-full" />
                  </div>
                </div>
              ))}
              <p className="text-muted-foreground text-center text-sm">
                Searching for the best plans for you...
              </p>
            </div>
          </div>
        ) : isError ? (
          <div className="flex min-h-[40vh] items-center justify-center px-4 py-16">
            <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-4 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-800 dark:text-white">No Plans Available</h3>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                No travel insurance plans are available for your selected dates and destination. Please try different travel details or contact your agent for assistance.
              </p>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="rounded-full bg-gray-100 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Modify Search
              </button>
            </div>
          </div>
        ) : (
          <div className="relative flex min-h-[60vh] gap-6 pb-6">
            {/* Left sidebar filters */}
            <aside className="hidden w-[200px] shrink-0 lg:block">
              <div className="sticky top-4 space-y-6">
                {/* Sorted by */}
                <div>
                  <h4 className="text-foreground mb-2 text-sm font-bold">Sorted by</h4>
                  <ul className="space-y-1.5">
                    <li>
                      <button
                        type="button"
                        onClick={() => { setSortBy('lowest'); scrollToPlans() }}
                        className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <span className={`h-2.5 w-2.5 rounded-full border ${sortBy === 'lowest' ? 'border-green-600 bg-green-600' : 'border-gray-300 bg-white'}`} />
                        Lowest premium
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => { setSortBy('highest'); scrollToPlans() }}
                        className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <span className={`h-2.5 w-2.5 rounded-full border ${sortBy === 'highest' ? 'border-green-600 bg-green-600' : 'border-gray-300 bg-white'}`} />
                        Highest sum insured
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => { setSortBy('addons'); scrollToPlans() }}
                        className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <span className={`h-2.5 w-2.5 rounded-full border ${sortBy === 'addons' ? 'border-green-600 bg-green-600' : 'border-gray-300 bg-white'}`} />
                        With add-ons
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => { setSortBy('discounts'); scrollToPlans() }}
                        className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <span className={`h-2.5 w-2.5 rounded-full border ${sortBy === 'discounts' ? 'border-green-600 bg-green-600' : 'border-gray-300 bg-white'}`} />
                        With discounts
                      </button>
                    </li>
                  </ul>
                </div>

                {/* By providers */}
                <div>
                  <h4 className="text-foreground mb-2 text-sm font-bold">By providers</h4>
                  <ul className="space-y-1.5">
                    {availableProviders.map((code: string) => {
                      const company = COMPANIES.find((c) => c.carrierCode === code)
                      const isActive = selectedProviders.length === 0 || selectedProviders.includes(code)
                      return (
                        <li key={code}>
                          <button
                            type="button"
                            onClick={() => toggleProvider(code)}
                            className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            <span className={`h-2.5 w-2.5 rounded-full border ${isActive ? 'border-green-600 bg-green-600' : 'border-gray-300 bg-white'}`} />
                            {company?.companyName || code}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>

                {/* By coverages */}
                <div>
                  <h4 className="text-foreground mb-2 text-sm font-bold">By coverages</h4>
                  <ul className="space-y-1.5">
                    {availableCoverages.map((coverage: string) => {
                      const isActive = selectedCoverages.includes(coverage)
                      const capitalizedCoverage = coverage.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
                      return (
                        <li key={coverage}>
                          <button
                            type="button"
                            onClick={() => toggleCoverage(coverage)}
                            className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            <span className={`h-2 w-2 shrink-0 rounded-full ${isActive ? 'bg-green-600' : 'bg-gray-300'}`} />
                            <span className="text-left capitalize">{capitalizedCoverage}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            </aside>

            {/* Plan list */}
            <div ref={planListRef} className="flex flex-1 flex-col gap-4">
              <p className="text-foreground text-sm">
                We have {allTravelPlans.length} recommendation{allTravelPlans.length !== 1 ? 's' : ''} to explore.
              </p>
              {allTravelPlans.map((item: any, index: number) => (
                <TravelInsurancePlan
                  key={`${item.CarrierCode}-${item.Plan.CarrierPlanCode || item.Plan.CarrierPlanDesc}-${index}`}
                  plan={item.Plan}
                  carrierCode={item.CarrierCode}
                  selectedPlan={coverageOption.selectedPlan?.CarrierPlanCode}
                  isAvailable={!isFormModified}
                  redirectUrl={item.IsExternalLink === 'Y' ? item.RedirectUrl : undefined}
                  currency={item.Plan.Currency}
                  onSelectPlan={(plan, carrierCode) => {
                    handleSelectPlan(plan, carrierCode)
                    resetQuoteRefetchCount()
                  }}
                />
              ))}
            </div>
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

  // Keep plans that have either MainBenefits OR AddonBenefits
  // Some providers (e.g. OONA) may return plans with only AddonBenefits
  cleanedResponse.data.Plans = cleanedResponse.data.Plans.filter(
    (plan) =>
      (plan.MainBenefits && plan.MainBenefits.length > 0) ||
      (plan.AddonBenefits && plan.AddonBenefits.length > 0)
  )

  return cleanedResponse
}
