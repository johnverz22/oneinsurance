'use client'

import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { PageLoader } from '@/components/page-loader'
import { Button } from '@/components/ui/button'
import { FAQsSection } from '@/components/faqs-section'
import { useCtplInsuranceStateStore } from '@/store/ctpl-store'
import { CtplInsuranceProduct } from '@/types/ctpl-insurance'
import { Star, Car, Bike, Truck, Bus } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { removeStorage } from '@/utils/remove-session-storage'
import { MotorProposalSearch } from '@/components/ctpl-insurance/motor-proposal-search'

const VEHICLE_TYPES: (CtplInsuranceProduct & { price: number; subtitle: string; emoji: string })[] = [
  { image: '/images/logo.png', title: 'Private Cars', code: 'PRIVATECAR', price: 599, subtitle: 'Ride hailing included', emoji: '🚗' },
  { image: '/images/logo.png', title: 'Motorcycle', code: 'MOTORCYCLE', price: 290, subtitle: 'Ride hailing included', emoji: '🏍️' },
  { image: '/images/logo.png', title: 'Taxi, PUJ and Mini Bus', code: 'TPMB', price: 1150, subtitle: 'Public utility vehicle', emoji: '🚌' },
  { image: '/images/logo.png', title: 'Tourist Car', code: 'ACTC', price: 790, subtitle: 'AC & tourist cars', emoji: '🚙' },
  { image: '/images/logo.png', title: 'Light & Medium Truck', code: 'LMT', price: 660, subtitle: 'Cargo & delivery', emoji: '🚛' },
  { image: '/images/logo.png', title: 'Heavy Truck & Private Bus', code: 'HTPB', price: 1250, subtitle: 'Heavy commercial vehicles', emoji: '🚚' },
]

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
  const [showAll, setShowAll] = useState(false)
  const [isLoadingPlans, setIsLoadingPlans] = useState(false)
  const [plans, setPlans] = useState<any[]>([])
  const [plansError, setPlansError] = useState<string | null>(null)

  useEffect(() => {
    reset()
    removeStorage('ctpl-insurance-storage')
  }, [])

  // Call compare-quote API when insurance type is selected
  useEffect(() => {
    if (insuranceType) {
      fetchPlans()
    }
  }, [insuranceType])

  const fetchPlans = async () => {
    setIsLoadingPlans(true)
    setPlans([])
    setPlansError(null)
    
    try {
      const endpoint = insuranceType === 'CTPL'
        ? '/api/motor-insurance/ctpl/compare-quote'
        : '/api/motor-insurance/comprehensive/compare-quote'

      // Set default dates (1 year from today)
      const effectiveDate = new Date()
      const expiryDate = new Date()
      expiryDate.setFullYear(expiryDate.getFullYear() + 1)

      // Build PolicyRiskList based on insurance type
      const policyRiskList = insuranceType === 'COMPREHENSIVE'
        ? [
            {
              ProductElementCode: 'R00004',
              IsPlateNoAvailable: 'Y',
              VehicleMake: '3',
              VehicleModel: '9',
              BodyType: '4',
              ModelYear: '2023',
              SubModel: '17',
              VehicleUsage: '1',
            },
          ]
        : [
            {
              ProductElementCode: 'R00004',
              IsPlateNoAvailable: 'Y',
            },
          ]

      const basePayload = {
        Duration: '1',
        EffectiveDate: effectiveDate.toISOString().split('T')[0],
        ExpiryDate: expiryDate.toISOString().split('T')[0],
        IsCTPL: insuranceType === 'CTPL' ? 'Y' : 'N',
        PolicyLobList: [
          {
            ProductCode: 'MOTOR',
            PolicyRiskList: policyRiskList,
          },
        ],
        ProductCode: 'MOTOR',
        ProductType: 'MOTORCYCLE', // Default to motorcycle, will be updated when user selects
        ProductVersion: '1.0',
        AgentCode: agentCode,
        Slug: insuranceType === 'CTPL' ? 'motor-ctpl' : 'motor-comprehensive',
      }

      // Add SumInsured for Comprehensive insurance
      const payload = insuranceType === 'COMPREHENSIVE'
        ? { ...basePayload, SumInsured: 100000 }
        : basePayload

      console.log('Calling compare-quote API:', endpoint, payload)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      console.log('Compare-quote response:', data)

      if (response.ok && data.success && data.data) {
        // Store ClientRequestId
        if (data.data.ClientRequestId) {
          setClientRequestId(data.data.ClientRequestId)
        }

        // Extract plans from response
        const plansList = data.data.CarrierPlanList || []
        setPlans(plansList)
        console.log('Plans loaded:', plansList.length)
        
        // If no plans returned, show error
        if (plansList.length === 0) {
          setPlansError('No plans available for this insurance type.')
        }
      } else {
        console.error('Failed to load plans:', data)
        const errorMsg = data.error || data.message || 'Failed to load plans. Please try again.'
        setPlansError(errorMsg)
        setPlans([])
      }
    } catch (error: any) {
      console.error('Error fetching plans:', error)
      const errorMsg = error.message || 'Failed to load plans. Please try again.'
      setPlansError(errorMsg)
      setPlans([])
    } finally {
      setIsLoadingPlans(false)
    }
  }

  const handleBuyNow = (plan: any) => {
    // Store the selected plan
    updateCoverageOption({
      carrierCode: plan.CarrierCode,
      selectedPlan: plan,
    })

    // Set duration
    const start = new Date()
    const end = new Date()
    end.setFullYear(end.getFullYear() + 1)
    useCtplInsuranceStateStore.getState().setDuration({ duration: 1, effectiveDate: start, expiryDate: end })
    
    // Navigate to avail page
    router.push(`/${agentCode}/products/ctpl-insurance/avail`)
  }

  const displayedPlans = showAll ? plans : plans.slice(0, 2)

  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <div className="relative h-[25rem] w-full md:h-[35rem] lg:h-[45rem]">
        <div className="relative h-full w-full">
          <Image
            src="/our-products-motorvehicle.webp"
            alt="ctpl-hero"
            className="aspect-video object-cover opacity-75"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            fill
          />
          <div className="absolute inset-0 bg-black/60 dark:bg-black/40" />
        </div>

        <div
          tabIndex={0}
          role="button"
          onClick={() => router.push('/')}
          className="absolute top-8 left-4 z-10 cursor-pointer gap-3 rounded-tl-full rounded-br-full bg-white px-12 py-1 shadow-lg lg:left-28 xl:left-32"
        >
          <Image src="/images/logo.png" alt="One Insurance" width={140} height={45} className="h-10 w-auto" priority />
        </div>

        <div className="absolute top-0 right-4 max-h-24 max-w-24 rounded-b-2xl bg-white px-3 py-2 sm:right-8 sm:max-h-32 sm:max-w-32 sm:px-4 sm:py-3 md:right-12 md:max-h-36 md:max-w-36 md:px-6 md:py-4 lg:right-20 lg:max-h-40 lg:max-w-40 lg:px-8 lg:py-4">
          <Image src="/images/IFRC.png" alt="IFRC Logo" width={1920} height={1240} className="h-full w-full object-contain" />
        </div>

        <div className="absolute inset-0 mx-auto -mt-8 flex h-full w-full max-w-7xl flex-col justify-center space-y-2.5 px-4 text-white lg:-mt-16">
          <h1 className="text-3xl font-black md:text-4xl lg:text-5xl xl:text-6xl">
            Compulsory Third Party
          </h1>
          <h2 className="text-xl font-semibold md:text-2xl lg:text-3xl xl:text-4xl">
            Liability (CTPL) Insurance
          </h2>
          <p className="max-w-4/5 text-sm md:text-base lg:max-w-2/5">
            Secure dependable CTPL insurance that handles third-party liabilities and protects you during road incidents—giving you confidence every time you drive.
          </p>
        </div>
      </div>

      {/* Insurance Type Selection */}
      {!insuranceType && (
        <div className="relative mx-auto -mt-20 flex w-full max-w-7xl flex-col px-1.5 lg:-mt-40">
          <div className="rounded-2xl bg-white p-8 shadow-2xl">
            <h2 className="mb-2 text-center text-2xl font-black text-gray-900">Choose Your Insurance Type</h2>
            <p className="mb-8 text-center text-sm text-gray-500">Select the type of motor insurance you need</p>

            <div className="grid gap-6 sm:grid-cols-2">
              <button
                onClick={() => setInsuranceType('CTPL')}
                className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-blue-50 to-white p-8 transition-all hover:border-primary hover:shadow-lg"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-4xl group-hover:scale-110 transition-transform">
                  🛡️
                </div>
                <div className="text-center">
                  <h3 className="mb-2 text-xl font-black text-gray-900">CTPL Insurance</h3>
                  <p className="text-sm text-gray-600">Compulsory Third Party Liability - Required by law for all vehicles</p>
                  <p className="mt-3 text-xs text-gray-500">Covers third-party bodily injury and property damage</p>
                </div>
                <span className="from-primary to-accent mt-2 rounded-full bg-gradient-to-r px-6 py-2 text-sm font-semibold text-white">
                  Select CTPL
                </span>
              </button>

              <button
                onClick={() => setInsuranceType('COMPREHENSIVE')}
                className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-green-50 to-white p-8 transition-all hover:border-primary hover:shadow-lg"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl group-hover:scale-110 transition-transform">
                  🚗
                </div>
                <div className="text-center">
                  <h3 className="mb-2 text-xl font-black text-gray-900">Comprehensive Insurance</h3>
                  <p className="text-sm text-gray-600">Complete protection for your vehicle and third parties</p>
                  <p className="mt-3 text-xs text-gray-500">Covers own damage, theft, and third-party liability</p>
                </div>
                <span className="from-primary to-accent mt-2 rounded-full bg-gradient-to-r px-6 py-2 text-sm font-semibold text-white">
                  Select Comprehensive
                </span>
              </button>
            </div>
          </div>

          {/* Proposal Search - Below Insurance Type Selection */}
          <div className="mt-6">
            <MotorProposalSearch />
          </div>
        </div>
      )}

      {/* Vehicle Classification / Plans */}
      {insuranceType && (
        <div className="relative mx-auto -mt-20 flex w-full max-w-7xl flex-col px-1.5 lg:-mt-40">
          <div className="rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="mb-1 text-xl font-bold text-gray-900">Available Plans</h2>
                <p className="text-sm text-gray-500">
                  {insuranceType === 'CTPL' ? 'CTPL Insurance' : 'Comprehensive Insurance'} - Select your plan
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => {
                  setInsuranceType(null as any)
                  setPlans([])
                  reset()
                }}
              >
                Change Type
              </Button>
            </div>

            {/* Loading Spinner */}
            {isLoadingPlans && (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  <p className="text-sm text-gray-600">Loading available plans...</p>
                </div>
              </div>
            )}

            {/* Plans Display */}
            {!isLoadingPlans && plans.length > 0 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  {displayedPlans.map((plan, index) => (
                    <div key={index} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                          <span className="text-2xl">🚗</span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{plan.CarrierPlanDesc || plan.CarrierName}</p>
                          <p className="text-xs text-gray-500">{plan.CarrierName}</p>
                          {plan.ProductType && (
                            <p className="text-xs text-gray-400">{plan.ProductType}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p className="text-primary font-bold">₱ {(plan.Premium || 0).toLocaleString()}</p>
                        <p className="text-xs text-gray-400">Includes all taxes & fees</p>
                        <Button
                          size="sm"
                          className="from-primary to-accent rounded-full bg-gradient-to-r px-5 text-white"
                          onClick={() => handleBuyNow(plan)}
                        >
                          Buy Now
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {plans.length > 2 && !showAll && (
                  <div className="mt-4 flex justify-center">
                    <Button variant="outline" className="rounded-full px-8" onClick={() => setShowAll(true)}>
                      View All ({plans.length} plans)
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* No Plans Found / Error */}
            {!isLoadingPlans && (plans.length === 0 || plansError) && (
              <div className="flex min-h-[200px] items-center justify-center">
                <div className="w-full max-w-2xl rounded-xl border-2 border-orange-200 bg-orange-50 p-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                    <svg
                      className="h-8 w-8 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-orange-800">
                    This Insurance is Currently Unavailable
                  </h3>
                  <p className="mb-4 text-sm text-orange-700">
                    {plansError && (plansError.toLowerCase().includes('agent') || 
                     plansError.toLowerCase().includes('authorized') || 
                     plansError.toLowerCase().includes('lob') ||
                     plansError.toLowerCase().includes('not assigned'))
                      ? "We're sorry, but motor insurance plans are not currently available through this link. This may be because the service is not yet enabled for this agent."
                      : plansError || 'No plans available at the moment.'}
                  </p>
                  <p className="text-xs text-orange-600">
                    Please contact your agent for assistance or try again later.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Testimonials */}
      <div className="mx-auto mt-16 w-full max-w-7xl px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900">What Our Customers Say</h2>
            <p className="text-sm text-gray-500">Real stories from real Filipino families we've protected</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { name: 'Juan Dela Cruz', role: 'Driver', text: 'Napakadali ng proseso! Nakuha ko ang aking CTPL sa loob ng ilang minuto. Highly recommended!' },
            { name: 'Maria Santos', role: 'Nurse', text: 'Affordable and reliable. One Insurance made getting CTPL so convenient for me.' },
            { name: 'Mark Rivera', role: 'Engineer', text: 'Great service! The online process was seamless and the coverage is comprehensive.' },
            { name: 'Carlo Fernandez', role: 'Teacher', text: 'I renewed my CTPL here and it was so much faster than going to the office. Salamat!' },
          ].map((t, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
              <div className="flex">
                {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4" stroke="0.5" fill="#FFA500" />)}
              </div>
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
              <p className="text-muted-foreground text-sm">
                Find answers to the most common questions about our CTPL insurance plans
              </p>
              <div className="pt-6">
                <button className="from-primary to-accent rounded-full bg-gradient-to-r px-5 py-2.5 text-sm font-medium text-white">
                  Ask an Expert
                </button>
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
