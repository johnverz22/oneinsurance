'use client'

import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import { Suspense, useEffect, useState, useRef } from 'react'
import { PageLoader } from '@/components/page-loader'
import { Button } from '@/components/ui/button'
import { FAQsSection } from '@/components/faqs-section'
import { useCtplInsuranceStateStore } from '@/store/ctpl-store'
import { Star } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { removeStorage } from '@/utils/remove-session-storage'
import { MotorProposalSearch } from '@/components/ctpl-insurance/motor-proposal-search'
import { getEcho } from '@/lib/echo'
import axios from 'axios'
import { COMPANIES } from '@/constants/companies'

const CTPL_FAQS = [
  { question: 'What is CTPL Insurance?', answers: ['Compulsory Third Party Liability (CTPL) insurance is mandatory for all motor vehicle owners in the Philippines. It covers third-party bodily injury or death caused by your vehicle.'] },
  { question: 'Is CTPL required by law?', answers: ['Yes. Under Republic Act 10607, all motor vehicles registered with the LTO must have valid CTPL insurance before registration or renewal.'] },
  { question: 'What does CTPL cover?', answers: ['CTPL covers third-party bodily injury, death, and property damage caused by your vehicle. It does not cover damage to your own vehicle.'] },
  { question: 'How long is CTPL valid?', answers: ['CTPL is typically valid for one year, aligned with your vehicle registration period.'] },
  { question: 'Can I get CTPL online?', answers: ['Yes. Through One Insurance, you can get your CTPL insurance online quickly and conveniently without visiting a physical office.'] },
]

export default function CtplInsurancePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CtplInsurance />
    </Suspense>
  )
}

function CtplInsurance() {
  const router = useRouter()
  const params = useParams()
  const agentCode = params['agent-code'] as string
  const { insuranceType, setInsuranceType, reset, setClientRequestId, updateCoverageOption } = useCtplInsuranceStateStore()
  const [isLoadingPlans, setIsLoadingPlans] = useState(false)
  const [plans, setPlans] = useState<any[]>([])
  const [plansError, setPlansError] = useState<string | null>(null)

  const echoRef = useRef<any>(null)
  const channelRef = useRef<any>(null)
  const queueRef = useRef<string[]>([])
  const isProcessingRef = useRef(false)
  const fallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clientRequestIdRef = useRef<string>('')

  useEffect(() => {
    reset()
    removeStorage('ctpl-insurance-storage')
  }, [])

  useEffect(() => {
    if (insuranceType) {
      fetchPlans()
    }
    return () => closeEchoConnection()
  }, [insuranceType])

  const closeEchoConnection = () => {
    try {
      if (clientRequestIdRef.current && echoRef.current) {
        echoRef.current.leave?.(clientRequestIdRef.current)
      }
      const connector = echoRef.current?.connector as any
      if (connector?.pusher?.disconnect) connector.pusher.disconnect()
      channelRef.current = null
      echoRef.current = null
    } catch {}
  }

  const fetchPlanByCacheKey = async (cacheKey: string): Promise<any> => {
    try {
      const res = await axios.get(`/api/motor-insurance/load-quote-by-cache?cacheKey=${cacheKey}`, { timeout: 10000 })
      const data = res.data
      if (!data.success || !data.data) return null
      const planData = data.data
      const plansList = planData.Plans || planData.CarrierPlanList || []
      if (plansList.length === 0) return null
      return {
        CarrierCode: planData.CarrierCode || cacheKey.split('_')[0],
        Plans: plansList,
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error(`Error fetching cache key ${cacheKey}:`, error.message)
      }
      return null
    }
  }

  const processQueue = async () => {
    if (isProcessingRef.current) return
    isProcessingRef.current = true

    while (queueRef.current.length > 0) {
      const batch = queueRef.current.splice(0, 5)
      const results = await Promise.allSettled(batch.map(fetchPlanByCacheKey))
      const successful = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
        .map(r => r.value)

      if (successful.length > 0) {
        const newPlans = successful.flatMap((d: any) =>
          (d.Plans || d.CarrierPlanList || []).map((plan: any) => ({
            ...plan,
            CarrierCode: plan.CarrierCode || d.CarrierCode,
          }))
        )
        if (newPlans.length > 0) {
          setPlans(prev => [...prev, ...newPlans])
          setIsLoadingPlans(false)
          if (fallbackTimeoutRef.current) {
            clearTimeout(fallbackTimeoutRef.current)
            fallbackTimeoutRef.current = null
          }
        }
      }
    }

    isProcessingRef.current = false
  }

  const fetchPlans = async () => {
    setIsLoadingPlans(true)
    setPlans([])
    setPlansError(null)
    queueRef.current = []
    isProcessingRef.current = false
    closeEchoConnection()

    try {
      const endpoint = insuranceType === 'CTPL'
        ? '/api/motor-insurance/ctpl/compare-quote'
        : '/api/motor-insurance/comprehensive/compare-quote'

      const effectiveDate = new Date()
      const expiryDate = new Date()
      expiryDate.setFullYear(expiryDate.getFullYear() + 1)

      const policyRiskList = insuranceType === 'COMPREHENSIVE'
        ? [{ ProductElementCode: 'R00004', IsPlateNoAvailable: 'Y', VehicleMake: '3', VehicleModel: '9', BodyType: '4', ModelYear: '2023', SubModel: '17', VehicleUsage: '1' }]
        : [{ ProductElementCode: 'R00004', IsPlateNoAvailable: 'Y' }]

      const basePayload = {
        Duration: '1',
        EffectiveDate: effectiveDate.toISOString().split('T')[0],
        ExpiryDate: expiryDate.toISOString().split('T')[0],
        IsCTPL: insuranceType === 'CTPL' ? 'Y' : 'N',
        PolicyLobList: [{ ProductCode: 'MOTOR', PolicyRiskList: policyRiskList }],
        ProductCode: 'MOTOR',
        ProductType: 'MOTORCYCLE',
        ProductVersion: '1.0',
        AgentCode: agentCode,
        Slug: 'motor-insurance',
      }

      const payload = insuranceType === 'COMPREHENSIVE' ? { ...basePayload, SumInsured: 100000 } : basePayload

      // Set up WebSocket BEFORE calling API
      const echo = getEcho()
      if (echo.connector.pusher.connection.state !== 'connected') {
        echo.connector.pusher.connect()
        await new Promise(r => setTimeout(r, 300))
      }
      echoRef.current = echo

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setPlansError(data.error || data.message || 'Failed to load plans. Please try again.')
        setIsLoadingPlans(false)
        return
      }

      const clientReqId = data.data?.ClientRequestId
      const supportedCarriers: string[] = data.data?.SupportedCarrier ?? []

      if (!clientReqId) {
        setPlansError('No ClientRequestId returned from server.')
        setIsLoadingPlans(false)
        return
      }

      setClientRequestId(clientReqId)
      clientRequestIdRef.current = clientReqId

      // Subscribe to WebSocket channel
      const channel = echo
        .channel(clientReqId)
        .listen('.insurance.plan.received', (e: any) => {
          const cacheKey = e['cache_key']
          console.log('Motor plan received, cache_key:', cacheKey)
          queueRef.current.push(cacheKey)
          processQueue()
        })
      channelRef.current = channel

      // Fallback: if WebSocket event fired before we subscribed
      setTimeout(() => {
        if (queueRef.current.length === 0 && supportedCarriers.length > 0) {
          console.log('No WebSocket events yet — trying direct cache poll...')
          for (const carrier of supportedCarriers) {
            queueRef.current.push(`${carrier}_${clientReqId}`)
          }
          processQueue()
        }
      }, 1500)

      // 30s timeout fallback
      fallbackTimeoutRef.current = setTimeout(() => {
        closeEchoConnection()
        setIsLoadingPlans(false)
        setPlans(prev => {
          if (prev.length === 0) setPlansError('Plans are taking longer than expected. Please try again.')
          return prev
        })
      }, 30000)

    } catch (error: any) {
      console.error('Error fetching plans:', error)
      setPlansError(error.message || 'Failed to load plans. Please try again.')
      setIsLoadingPlans(false)
    }
  }

  const handleBuyNow = (plan: any) => {
    updateCoverageOption({ carrierCode: plan.CarrierCode, selectedPlan: plan as any })
    // Set selectedVehicle so avail page doesn't redirect back
    useCtplInsuranceStateStore.getState().setSelectedVehicle({
      image: '/images/logo.png',
      title: plan.CarrierPlanDesc || plan.CarrierProductName || plan.CarrierCode || 'Motor Insurance',
      code: 'MOTORCYCLE',
    })
    const start = new Date()
    const end = new Date()
    end.setFullYear(end.getFullYear() + 1)
    useCtplInsuranceStateStore.getState().setDuration({ duration: 1, effectiveDate: start, expiryDate: end })
    router.push(`/${agentCode}/products/ctpl-insurance/avail`)
  }

  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <div className="relative h-[25rem] w-full md:h-[35rem] lg:h-[45rem]">
        <div className="relative h-full w-full">
          <Image src="/our-products-motorvehicle.webp" alt="ctpl-hero" className="aspect-video object-cover opacity-75" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" fill />
          <div className="absolute inset-0 bg-black/60 dark:bg-black/40" />
        </div>
        <div tabIndex={0} role="button" onClick={() => router.push('/')} className="absolute top-8 left-4 z-10 cursor-pointer gap-3 rounded-tl-full rounded-br-full bg-white px-12 py-1 shadow-lg lg:left-28 xl:left-32">
          <Image src="/images/logo.png" alt="One Insurance" width={140} height={45} className="h-10 w-auto" priority />
        </div>
        <div className="absolute top-0 right-4 max-h-24 max-w-24 rounded-b-2xl bg-white px-3 py-2 sm:right-8 sm:max-h-32 sm:max-w-32 sm:px-4 sm:py-3 md:right-12 md:max-h-36 md:max-w-36 md:px-6 md:py-4 lg:right-20 lg:max-h-40 lg:max-w-40 lg:px-8 lg:py-4">
          <Image src="/images/IFRC.png" alt="IFRC Logo" width={1920} height={1240} className="h-full w-full object-contain" />
        </div>
        <div className="absolute inset-0 mx-auto -mt-8 flex h-full w-full max-w-7xl flex-col justify-center space-y-2.5 px-4 text-white lg:-mt-16">
          <h1 className="text-3xl font-black md:text-4xl lg:text-5xl xl:text-6xl">Compulsory Third Party</h1>
          <h2 className="text-xl font-semibold md:text-2xl lg:text-3xl xl:text-4xl">Liability (CTPL) Insurance</h2>
          <p className="max-w-4/5 text-sm md:text-base lg:max-w-2/5">Secure dependable CTPL insurance that handles third-party liabilities and protects you during road incidents.</p>
        </div>
      </div>

      {/* Insurance Type Selection - overlaps hero */}
      {!insuranceType && (
        <div className="relative mx-auto -mt-20 flex w-full max-w-7xl flex-col px-1.5 lg:-mt-40">
          <div className="rounded-2xl bg-white p-8 shadow-2xl">
            <h2 className="mb-2 text-center text-2xl font-black text-gray-900">Choose Your Insurance Type</h2>
            <p className="mb-8 text-center text-sm text-gray-500">Select the type of motor insurance you need</p>
            <div className="grid gap-6 sm:grid-cols-2">
              <button onClick={() => setInsuranceType('CTPL')} className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-blue-50 to-white p-8 transition-all hover:border-primary hover:shadow-lg">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-4xl group-hover:scale-110 transition-transform">🛡️</div>
                <div className="text-center">
                  <h3 className="mb-2 text-xl font-black text-gray-900">CTPL Insurance</h3>
                  <p className="text-sm text-gray-600">Compulsory Third Party Liability - Required by law for all vehicles</p>
                  <p className="mt-3 text-xs text-gray-500">Covers third-party bodily injury and property damage</p>
                </div>
                <span className="from-primary to-accent mt-2 rounded-full bg-gradient-to-r px-6 py-2 text-sm font-semibold text-white">Select CTPL</span>
              </button>
              <button onClick={() => setInsuranceType('COMPREHENSIVE')} className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-green-50 to-white p-8 transition-all hover:border-primary hover:shadow-lg">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl group-hover:scale-110 transition-transform">🚗</div>
                <div className="text-center">
                  <h3 className="mb-2 text-xl font-black text-gray-900">Comprehensive Insurance</h3>
                  <p className="text-sm text-gray-600">Complete protection for your vehicle and third parties</p>
                  <p className="mt-3 text-xs text-gray-500">Covers own damage, theft, and third-party liability</p>
                </div>
                <span className="from-primary to-accent mt-2 rounded-full bg-gradient-to-r px-6 py-2 text-sm font-semibold text-white">Select Comprehensive</span>
              </button>
            </div>
          </div>
          <div className="mt-6"><MotorProposalSearch /></div>
        </div>
      )}

      {/* When type selected */}
      {insuranceType && (
        <>
          {/* Compact type badge - overlaps hero */}
          <div className="relative mx-auto -mt-20 flex w-full max-w-7xl flex-col px-1.5 lg:-mt-40">
            <div className="rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-gray-900">{insuranceType === 'CTPL' ? '🛡️ CTPL Insurance' : '🚗 Comprehensive Insurance'}</h2>
                  <p className="text-sm text-gray-500">{insuranceType === 'CTPL' ? 'Compulsory Third Party Liability - Required by law' : 'Complete protection for your vehicle and third parties'}</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => { setInsuranceType(null as any); setPlans([]); reset() }}>
                  Change Type
                </Button>
              </div>
            </div>
            {/* Proposal Search - below the type badge */}
            <div className="mt-4">
              <MotorProposalSearch />
            </div>
          </div>

          {/* Plans - full width below, like travel */}
          <div id="motor-plans-section" className="w-full mt-8 border-t border-gray-100">
            <div className="mx-auto w-full max-w-7xl px-4 py-8">
              <div className="mb-8 text-center">
                <h2 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-2xl font-black text-transparent sm:text-3xl md:text-4xl">
                  Choose Your Motor Insurance Plan
                </h2>
                <p className="text-muted-foreground mt-2 text-sm">{insuranceType === 'CTPL' ? 'CTPL' : 'Comprehensive'} Insurance Plans</p>
              </div>

              {/* Loading */}
              {isLoadingPlans && (
                <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 py-16">
                  <svg className="text-primary h-12 w-12 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-muted-foreground text-base">We're searching for the best plans for you. This may take a moment...</p>
                </div>
              )}

              {/* Error */}
              {!isLoadingPlans && plansError && plans.length === 0 && (
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
                      {plansError.toLowerCase().includes('agent') || plansError.toLowerCase().includes('lob') || plansError.toLowerCase().includes('not assigned')
                        ? "We're sorry, but motor insurance plans are not currently available through this link. This may be because the service is not yet enabled for this agent."
                        : plansError}
                    </p>
                    <p className="text-xs text-orange-600">Please contact your agent for assistance or try again later.</p>
                  </div>
                </div>
              )}

              {/* Plans Grid */}
              {plans.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pb-8">
                  {plans.map((plan, index) => {
                    const carrier = COMPANIES.find(c => c.carrierCode === plan.CarrierCode)
                    return (
                      <div key={index} className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
                        {/* Carrier Logo */}
                        <div className="mb-4 flex items-center justify-center h-16">
                          {carrier?.image ? (
                            <Image src={carrier.image} alt={carrier.companyName} width={120} height={60} className="object-contain" />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">🚗</div>
                          )}
                        </div>
                        
                        {/* Plan Name */}
                        <div className="mb-4 text-center">
                          <p className="font-black text-gray-900 text-lg">{plan.CarrierProductName || plan.CarrierPlanDesc || carrier?.companyName || plan.CarrierCode}</p>
                          <span className="mt-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            {insuranceType === 'CTPL' ? 'CTPL' : 'Comprehensive'}
                          </span>
                        </div>
                        
                        {/* Premium */}
                        <div className="mt-auto text-center">
                          <p className="text-xs text-gray-400 mb-1">Total Premium</p>
                          <p className="text-3xl font-black text-gray-900">
                            ₱ {(parseFloat(plan.GrossPremium) || parseFloat(plan.DuePremium) || parseFloat(plan.BeforeVatPremium) || Number(plan.Premium) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">Includes all taxes & fees</p>
                          <Button className="from-primary to-accent mt-4 w-full rounded-full bg-gradient-to-r font-semibold text-white" onClick={() => handleBuyNow(plan)}>
                            Get Started
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Testimonials */}
      <div className="mx-auto mt-16 w-full max-w-7xl px-4">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-900">What Our Customers Say</h2>
          <p className="text-sm text-gray-500">Real stories from real Filipino families we've protected</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { name: 'Juan Dela Cruz', role: 'Driver', text: 'Napakadali ng proseso! Nakuha ko ang aking CTPL sa loob ng ilang minuto. Highly recommended!' },
            { name: 'Maria Santos', role: 'Nurse', text: 'Affordable and reliable. One Insurance made getting CTPL so convenient for me.' },
            { name: 'Mark Rivera', role: 'Engineer', text: 'Great service! The online process was seamless and the coverage is comprehensive.' },
            { name: 'Carlo Fernandez', role: 'Teacher', text: 'I renewed my CTPL here and it was so much faster than going to the office. Salamat!' },
          ].map((t, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
              <div className="flex">{[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4" stroke="0.5" fill="#FFA500" />)}</div>
              <p className="text-sm text-gray-600 italic">"{t.text}"</p>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://avatar.iran.liara.run/public/${i % 2 === 0 ? 'boy' : 'girl'}/${i + 1}`} />
                  <AvatarFallback>{t.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <section className="mt-16 w-full bg-[#eef2f7] py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 md:grid-cols-3 md:gap-12">
            <div className="space-y-4">
              <h2 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-3xl font-black text-transparent leading-tight">
                Got a question about CTPL Insurance in the Philippines?
              </h2>
              <p className="text-muted-foreground text-sm">Find answers to the most common questions about our CTPL insurance plans</p>
              <div className="pt-6">
                <button className="from-primary to-accent rounded-full bg-gradient-to-r px-5 py-2.5 text-sm font-medium text-white">Ask an Expert</button>
              </div>
            </div>
            <div className="md:col-span-2">
              <FAQsSection faqs={CTPL_FAQS} title="" description="" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
