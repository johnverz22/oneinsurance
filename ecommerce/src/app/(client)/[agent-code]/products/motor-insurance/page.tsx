'use client'

import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import { Suspense, useEffect, useState, useRef } from 'react'
import { PageLoader } from '@/components/page-loader'
import { FAQsSection } from '@/components/faqs-section'
import { useCtplInsuranceStateStore } from '@/store/ctpl-store'
import { Shield, Car, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { StarRating } from '@/components/ui/star-rating'
import {
  PlanCardSkeleton,
  NoPlanState,
  SortFilterSidebar,
  PriceDisplay,
  PrimaryActionButton,
} from '@/components/ui/insurance-shared'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { removeStorage } from '@/utils/remove-session-storage'
import { MotorProposalSearch } from '@/components/ctpl-insurance/motor-proposal-search'
import { MobileProductNav } from '@/components/layout/mobile-product-nav'
import { getEcho } from '@/lib/echo'
import axios from 'axios'
import { COMPANIES, CARRIER_BRAND_COLORS } from '@/constants/companies'
import { Skeleton } from '@/components/ui/skeleton'

const CTPL_FAQS = [
  { question: 'What is CTPL Insurance?', answers: ['Compulsory Third Party Liability (CTPL) insurance is mandatory for all motor vehicle owners in the Philippines.'] },
  { question: 'Is CTPL required by law?', answers: ['Yes. Under Republic Act 10607, all motor vehicles registered with the LTO must have valid CTPL insurance.'] },
  { question: 'What does CTPL cover?', answers: ['CTPL covers third-party bodily injury, death, and property damage caused by your vehicle.'] },
  { question: 'How long is CTPL valid?', answers: ['CTPL is typically valid for one year, aligned with your vehicle registration period.'] },
  { question: 'Can I get CTPL online?', answers: ['Yes. Through One Insurance, you can get your CTPL insurance online quickly and conveniently.'] },
]

// Shared styling for the comprehensive vehicle dropdowns.
// `appearance-none` (incl. -webkit-appearance) strips Safari's native <select>
// chrome so the rounded-pill styling and fixed height render consistently across
// browsers; a custom SVG chevron is drawn via background-image, with right padding
// so option text never overlaps it.
const VEHICLE_SELECT_CLASS =
  "h-10 w-full appearance-none rounded-full border bg-white bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pl-4 pr-9 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"

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
  const [showComprehensiveForm, setShowComprehensiveForm] = useState(false)
  const [comprehensiveForm, setComprehensiveForm] = useState({
    vehicleType: '', vehicleMake: '', vehicleModel: '', bodyType: '', modelYear: '', subModel: '', vehicleUsage: '', sumInsured: '100000',
  })
  const [comprehensiveFormErrors, setComprehensiveFormErrors] = useState<Record<string, string>>({})

  // Cascading dropdown options
  const [makeOptions, setMakeOptions] = useState<{ code: string; label: string }[]>([])
  const [modelOptions, setModelOptions] = useState<{ code: string; label: string }[]>([])
  const [bodyTypeOptions, setBodyTypeOptions] = useState<{ code: string; label: string }[]>([])
  const [yearOptions, setYearOptions] = useState<{ code: string; label: string }[]>([])
  const [subModelOptions, setSubModelOptions] = useState<{ code: string; label: string }[]>([])
  const [usageOptions, setUsageOptions] = useState<{ code: string; label: string }[]>([])
  const [loadingField, setLoadingField] = useState<string | null>(null)
  const [motorSortBy, setMotorSortBy] = useState<'lowest' | 'highest'>('lowest')
  const [motorSelectedProviders, setMotorSelectedProviders] = useState<string[]>([])
  const echoRef = useRef<any>(null)
  const channelRef = useRef<any>(null)
  const queueRef = useRef<string[]>([])
  const isProcessingRef = useRef(false)
  const fallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clientRequestIdRef = useRef<string>('')
  const isInitialMount = useRef(true)

  useEffect(() => {
    reset()
    removeStorage('ctpl-insurance-storage')
  }, [])

  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return }
    if (insuranceType === 'CTPL') { setShowComprehensiveForm(false); fetchPlans() }
    else if (insuranceType === 'COMPREHENSIVE') { setShowComprehensiveForm(true); setPlans([]); setPlansError(null) }
    return () => closeEchoConnection()
  }, [insuranceType])

  const closeEchoConnection = () => {
    try {
      if (clientRequestIdRef.current && echoRef.current) echoRef.current.leave?.(clientRequestIdRef.current)
      const connector = echoRef.current?.connector as any
      if (connector?.pusher?.disconnect) connector.pusher.disconnect()
      channelRef.current = null; echoRef.current = null
    } catch {}
  }

  // Cascade fetch helpers
  const fetchMakes = async (vType: string) => {
    if (!vType) return
    setLoadingField('vehicleMake')
    setMakeOptions([]); setModelOptions([]); setBodyTypeOptions([]); setYearOptions([]); setSubModelOptions([]); setUsageOptions([])
    try {
      const res = await fetch(`/api/motor-insurance/vehicle-data/makes?vehicleType=${vType}`)
      const data = await res.json()
      if (data.success) setMakeOptions(data.data)
    } catch {}
    setLoadingField(null)
  }

  const fetchModels = async (vType: string, makeCode: string) => {
    if (!vType || !makeCode) return
    setLoadingField('vehicleModel')
    setModelOptions([]); setBodyTypeOptions([]); setYearOptions([]); setSubModelOptions([]); setUsageOptions([])
    try {
      const res = await fetch(`/api/motor-insurance/vehicle-data/models?vehicleType=${vType}&makeCode=${makeCode}`)
      const data = await res.json()
      if (data.success) setModelOptions(data.data)
    } catch {}
    setLoadingField(null)
  }

  const fetchBodyTypes = async (vType: string, makeCode: string, modelCode: string) => {
    if (!vType || !makeCode || !modelCode) return
    setLoadingField('bodyType')
    setBodyTypeOptions([]); setYearOptions([]); setSubModelOptions([]); setUsageOptions([])
    try {
      const res = await fetch(`/api/motor-insurance/vehicle-data/body-types?vehicleType=${vType}&makeCode=${makeCode}&modelCode=${modelCode}`)
      const data = await res.json()
      if (data.success) setBodyTypeOptions(data.data)
    } catch {}
    setLoadingField(null)
  }

  const fetchYears = async (vType: string, makeCode: string, modelCode: string, btCode: string) => {
    if (!vType || !makeCode || !modelCode || !btCode) return
    setLoadingField('modelYear')
    setYearOptions([]); setSubModelOptions([]); setUsageOptions([])
    try {
      const res = await fetch(`/api/motor-insurance/vehicle-data/years?vehicleType=${vType}&makeCode=${makeCode}&modelCode=${modelCode}&bodyTypeCode=${btCode}`)
      const data = await res.json()
      if (data.success) setYearOptions(data.data)
    } catch {}
    setLoadingField(null)
  }

  const fetchSubModels = async (vType: string, makeCode: string, modelCode: string, btCode: string, year: string) => {
    if (!vType || !makeCode || !modelCode || !btCode || !year) return
    setLoadingField('subModel')
    setSubModelOptions([]); setUsageOptions([])
    try {
      const res = await fetch(`/api/motor-insurance/vehicle-data/submodels?vehicleType=${vType}&makeCode=${makeCode}&modelCode=${modelCode}&bodyTypeCode=${btCode}&year=${year}`)
      const data = await res.json()
      if (data.success) setSubModelOptions(data.data)
    } catch {}
    setLoadingField(null)
  }

  const fetchUsages = async (vType: string, makeCode: string, modelCode: string, btCode: string, year: string, smCode: string) => {
    if (!vType || !makeCode || !modelCode || !btCode || !year || !smCode) return
    setLoadingField('vehicleUsage')
    setUsageOptions([])
    try {
      const res = await fetch(`/api/motor-insurance/vehicle-data/usages?vehicleType=${vType}&makeCode=${makeCode}&modelCode=${modelCode}&bodyTypeCode=${btCode}&year=${year}&subModelCode=${smCode}`)
      const data = await res.json()
      if (data.success) setUsageOptions(data.data)
    } catch {}
    setLoadingField(null)
  }

  const handleComprehensiveFieldChange = (field: string, value: string) => {
    const f = comprehensiveForm
    if (field === 'vehicleType') {
      setComprehensiveForm(prev => ({ ...prev, vehicleType: value, vehicleMake: '', vehicleModel: '', bodyType: '', modelYear: '', subModel: '', vehicleUsage: '' }))
      fetchMakes(value)
    } else if (field === 'vehicleMake') {
      setComprehensiveForm(prev => ({ ...prev, vehicleMake: value, vehicleModel: '', bodyType: '', modelYear: '', subModel: '', vehicleUsage: '' }))
      fetchModels(f.vehicleType, value)
    } else if (field === 'vehicleModel') {
      setComprehensiveForm(prev => ({ ...prev, vehicleModel: value, bodyType: '', modelYear: '', subModel: '', vehicleUsage: '' }))
      fetchBodyTypes(f.vehicleType, f.vehicleMake, value)
    } else if (field === 'bodyType') {
      setComprehensiveForm(prev => ({ ...prev, bodyType: value, modelYear: '', subModel: '', vehicleUsage: '' }))
      fetchYears(f.vehicleType, f.vehicleMake, f.vehicleModel, value)
    } else if (field === 'modelYear') {
      setComprehensiveForm(prev => ({ ...prev, modelYear: value, subModel: '', vehicleUsage: '' }))
      fetchSubModels(f.vehicleType, f.vehicleMake, f.vehicleModel, f.bodyType, value)
    } else if (field === 'subModel') {
      setComprehensiveForm(prev => ({ ...prev, subModel: value, vehicleUsage: '' }))
      fetchUsages(f.vehicleType, f.vehicleMake, f.vehicleModel, f.bodyType, f.modelYear, value)
    } else if (field === 'vehicleUsage') {
      setComprehensiveForm(prev => ({ ...prev, vehicleUsage: value }))
    } else if (field === 'sumInsured') {
      setComprehensiveForm(prev => ({ ...prev, sumInsured: value }))
    }
  }

  const fetchPlanByCacheKey = async (cacheKey: string): Promise<any> => {
    try {
      const endpoint = insuranceType === 'COMPREHENSIVE'
        ? `/api/motor-insurance/comprehensive/load-quote-by-cache?cacheKey=${cacheKey}`
        : `/api/motor-insurance/load-quote-by-cache?cacheKey=${cacheKey}`
      const res = await axios.get(endpoint, { timeout: 15000 })
      const data = res.data
      if (!data.success || !data.data) return null
      const planData = data.data
      const plansList = planData.Plans || planData.CarrierPlanList || []
      if (plansList.length === 0) return null
      return { CarrierCode: planData.CarrierCode || cacheKey.split('_')[0], Plans: plansList }
    } catch (error: any) {
      if (error.response?.status !== 404) console.error(`Error fetching cache key ${cacheKey}:`, error.message)
      return null
    }
  }

  const processQueue = async () => {
    if (isProcessingRef.current) return
    isProcessingRef.current = true
    while (queueRef.current.length > 0) {
      const batch = queueRef.current.splice(0, 5)
      const results = await Promise.allSettled(batch.map(fetchPlanByCacheKey))
      const successful = results.filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null).map(r => r.value)
      if (successful.length > 0) {
        const newPlans = successful.flatMap((d: any) => (d.Plans || d.CarrierPlanList || []).map((plan: any) => ({ ...plan, CarrierCode: plan.CarrierCode || d.CarrierCode })))
        if (newPlans.length > 0) {
          setPlans(prev => [...prev, ...newPlans])
          setIsLoadingPlans(false)
          // Reset timeout to wait for more providers (20s grace period)
          if (fallbackTimeoutRef.current) { clearTimeout(fallbackTimeoutRef.current) }
          fallbackTimeoutRef.current = setTimeout(() => {
            closeEchoConnection()
          }, 20000)
        }
      }
    }
    isProcessingRef.current = false
  }

  const fetchPlans = async () => {
    setIsLoadingPlans(true); setPlans([]); setPlansError(null)
    queueRef.current = []; isProcessingRef.current = false; closeEchoConnection()
    try {
      const endpoint = insuranceType === 'CTPL' ? '/api/motor-insurance/ctpl/compare-quote' : '/api/motor-insurance/comprehensive/compare-quote'
      const effectiveDate = new Date()
      const expiryDate = new Date(); expiryDate.setFullYear(expiryDate.getFullYear() + 1)
      const policyRiskList = insuranceType === 'COMPREHENSIVE'
        ? [{ ProductElementCode: 'R00004', IsPlateNoAvailable: 'Y', VehicleMake: comprehensiveForm.vehicleMake, VehicleModel: comprehensiveForm.vehicleModel, BodyType: comprehensiveForm.bodyType, ModelYear: comprehensiveForm.modelYear, SubModel: comprehensiveForm.subModel, VehicleUsage: comprehensiveForm.vehicleUsage }]
        : [{ ProductElementCode: 'R00004', IsPlateNoAvailable: 'Y' }]
      const basePayload = {
        Duration: '1', EffectiveDate: effectiveDate.toISOString().split('T')[0], ExpiryDate: expiryDate.toISOString().split('T')[0],
        IsCTPL: insuranceType === 'CTPL' ? 'Y' : 'N', PolicyLobList: [{ ProductCode: 'MOTOR', PolicyRiskList: policyRiskList }],
        ProductCode: 'MOTOR', ProductType: 'MOTORCYCLE', ProductVersion: '1.0', AgentCode: agentCode, Slug: 'motor-insurance',
      }
      const payload = insuranceType === 'COMPREHENSIVE' ? { ...basePayload, SumInsured: parseInt(comprehensiveForm.sumInsured) || 100000 } : basePayload
      const echo = getEcho()
      if (echo.connector.pusher.connection.state !== 'connected') { echo.connector.pusher.connect(); await new Promise(r => setTimeout(r, 300)) }
      echoRef.current = echo
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await response.json()
      if (!response.ok || !data.success) { setPlansError(data.error || data.message || 'Failed to load plans.'); setIsLoadingPlans(false); return }
      const clientReqId = data.data?.ClientRequestId
      const supportedCarriers: string[] = data.data?.SupportedCarrier ?? []
      if (!clientReqId) { setPlansError('No ClientRequestId returned.'); setIsLoadingPlans(false); return }
      setClientRequestId(clientReqId); clientRequestIdRef.current = clientReqId
      const channel = echo.channel(clientReqId).listen('.insurance.plan.received', (e: any) => {
        queueRef.current.push(e['cache_key']); processQueue()
      })
      channelRef.current = channel
      fallbackTimeoutRef.current = setTimeout(() => {
        closeEchoConnection(); setIsLoadingPlans(false)
        setPlans(prev => { if (prev.length === 0) setPlansError('Plans are taking longer than expected. Please try again.'); return prev })
      }, 30000)
    } catch (error: any) {
      setPlansError(error.message || 'Failed to load plans.'); setIsLoadingPlans(false)
    }
  }

  const validateComprehensiveForm = () => {
    const errors: Record<string, string> = {}
    if (!comprehensiveForm.vehicleType) errors.vehicleType = 'Required'
    if (!comprehensiveForm.vehicleMake) errors.vehicleMake = 'Required'
    if (!comprehensiveForm.vehicleModel) errors.vehicleModel = 'Required'
    if (!comprehensiveForm.bodyType) errors.bodyType = 'Required'
    if (!comprehensiveForm.modelYear) errors.modelYear = 'Required'
    if (!comprehensiveForm.subModel) errors.subModel = 'Required'
    if (!comprehensiveForm.vehicleUsage) errors.vehicleUsage = 'Required'
    if (!comprehensiveForm.sumInsured || parseInt(comprehensiveForm.sumInsured) < 10000) errors.sumInsured = 'Min ₱10,000'
    setComprehensiveFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSearchComprehensivePlans = () => {
    if (!validateComprehensiveForm()) return
    setShowComprehensiveForm(false); fetchPlans()
  }

  const handleBuyNow = (plan: any) => {
    updateCoverageOption({ carrierCode: plan.CarrierCode, selectedPlan: plan as any })
    useCtplInsuranceStateStore.getState().setSelectedVehicle({ image: '/images/logo.png', title: plan.CarrierProductName || plan.CarrierPlanDesc || plan.CarrierCode || 'Motor Insurance', code: 'MOTORCYCLE' })
    const start = new Date(); const end = new Date(); end.setFullYear(end.getFullYear() + 1)
    useCtplInsuranceStateStore.getState().setDuration({ duration: 1, effectiveDate: start, expiryDate: end })
    router.push(`/${agentCode}/products/motor-insurance/avail`)
  }

  const selectType = (type: 'CTPL' | 'COMPREHENSIVE') => {
    if (insuranceType === type) return
    setPlans([]); setPlansError(null)
    setComprehensiveForm({ vehicleType: '', vehicleMake: '', vehicleModel: '', bodyType: '', modelYear: '', subModel: '', vehicleUsage: '', sumInsured: '100000' })
    setComprehensiveFormErrors({})
    isInitialMount.current = false
    setInsuranceType(type)
  }

  return (
    <div className="relative overflow-hidden pb-20 md:pb-0">
      {/* Shared mobile bottom nav + desktop chrome hiding + sidebar mount */}
      <MobileProductNav
        searchContent={<MotorProposalSearch />}
        searchTitle="Find Proposal"
        plansTargetId="motor-plans"
      />

      {/* Hero */}
      <div className="relative h-[25rem] w-full md:h-[35rem] lg:h-[45rem]">
        <div className="relative h-full w-full">
          <Image src="/our-products-motorvehicle.webp" alt="motor-hero" className="aspect-video object-cover opacity-75" sizes="100vw" fill />
          <div className="absolute inset-0 bg-black/80" />

          {/* Mobile-only brand logo — header is hidden on mobile by MobileProductNav */}
          <div className="absolute top-4 left-3 z-10 md:hidden">
            <a href={`/${agentCode}`} className="flex cursor-pointer rounded-tl-full rounded-br-full bg-white px-6 py-1 shadow-lg">
              <Image src="/images/logo.png" alt="One Insurance" width={256} height={63} className="h-7 w-auto" priority />
            </a>
          </div>
        </div>
        <div className="absolute top-0 right-3 max-h-16 max-w-16 rounded-b-xl bg-white px-2 py-1.5 sm:right-8 sm:max-h-24 sm:max-w-24 sm:rounded-b-2xl sm:px-3 sm:py-2 md:right-12 md:max-h-36 md:max-w-36 md:px-6 md:py-4 lg:right-20 lg:max-h-40 lg:max-w-40 lg:px-8 lg:py-4">
          <Image src="/images/IFRC.png" alt="IFRC Logo" width={1290} height={800} className="h-full w-full object-contain" />
        </div>
        <div className="absolute inset-0 mx-auto -mt-6 flex h-full w-full max-w-7xl flex-col justify-center space-y-2.5 px-4 text-white lg:-mt-16">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl xl:text-6xl">Motor Insurance</h1>
          <h2 className="hidden text-xl font-semibold text-slate-200 md:block md:text-2xl lg:text-3xl xl:text-4xl">CTPL & Comprehensive Coverage</h2>
          <p className="max-w-[280px] text-xs leading-relaxed text-slate-300 md:max-w-[90%] md:text-base lg:max-w-2/5">Protect yourself and your vehicle with the right motor insurance plan.</p>
        </div>
      </div>

      {/* Main Card - always visible, overlaps hero */}
      <div className="relative z-20 mx-auto -mt-24 flex w-full max-w-7xl flex-col rounded-t-3xl border-t border-border bg-white px-5 pb-4 pt-6 shadow-2xl dark:border-slate-800 dark:bg-background md:-mt-28 md:gap-8 md:rounded-none md:border-0 md:bg-transparent md:px-4 md:pt-0 md:shadow-none lg:-mt-40 lg:gap-12">
        <style>{`
          @media (max-width: 767px) {
            [data-testid="motor-details-form"] {
              border: none !important;
              box-shadow: none !important;
              background: transparent !important;
            }
            [data-testid="motor-details-form"] > div {
              padding: 0 !important;
            }
          }
        `}</style>

        <div data-testid="motor-details-form" className="rounded-md bg-white shadow-lg backdrop-blur-sm overflow-hidden lg:rounded-xl">
          {/* Header */}
          <div className="px-4 pt-3 pb-6 sm:px-8">
            <h2 className="text-2xl font-black text-foreground">Choose Your Insurance Type</h2>
            <p className="text-sm text-muted-foreground mt-1">Select the coverage that fits your needs</p>

            {/* Bigger card-style toggle — taller with icon, title, description, select button */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={() => selectType('CTPL')}
                className={`group relative flex flex-col items-center gap-2 sm:gap-3 rounded-2xl border-2 p-4 sm:p-8 transition-all text-center ${
                  insuranceType === 'CTPL'
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border bg-muted/50 hover:border-primary/40 hover:bg-muted'
                }`}
              >
                <div className={`flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-full ${insuranceType === 'CTPL' ? 'bg-primary/10' : 'bg-blue-50'}`}>
                  <Shield className={`h-5 w-5 sm:h-7 sm:w-7 ${insuranceType === 'CTPL' ? 'text-primary' : 'text-blue-400'}`} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-foreground">CTPL Insurance</h3>
                  <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">Required by law for all vehicles</p>
                </div>
                <span className={`mt-1 sm:mt-2 rounded-full border px-3 sm:px-5 py-1 sm:py-1.5 text-xs sm:text-sm font-medium transition-all ${
                  insuranceType === 'CTPL'
                    ? 'from-primary to-accent border-transparent bg-gradient-to-r text-white'
                    : 'border-border text-muted-foreground group-hover:border-primary group-hover:text-primary'
                }`}>
                  {insuranceType === 'CTPL' ? 'Selected ✓' : 'Select CTPL'}
                </span>
              </button>

              <button
                onClick={() => selectType('COMPREHENSIVE')}
                className={`group relative flex flex-col items-center gap-2 sm:gap-3 rounded-2xl border-2 p-4 sm:p-8 transition-all text-center ${
                  insuranceType === 'COMPREHENSIVE'
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border bg-muted/50 hover:border-primary/40 hover:bg-muted'
                }`}
              >
                <div className={`flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-full ${insuranceType === 'COMPREHENSIVE' ? 'bg-primary/10' : 'bg-success/10'}`}>
                  <Car className={`h-5 w-5 sm:h-7 sm:w-7 ${insuranceType === 'COMPREHENSIVE' ? 'text-primary' : 'text-success'}`} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-foreground">Comprehensive</h3>
                  <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">Complete vehicle protection</p>
                </div>
                <span className={`mt-1 sm:mt-2 rounded-full border px-3 sm:px-5 py-1 sm:py-1.5 text-xs sm:text-sm font-medium transition-all ${
                  insuranceType === 'COMPREHENSIVE'
                    ? 'from-primary to-accent border-transparent bg-gradient-to-r text-white'
                    : 'border-border text-muted-foreground group-hover:border-primary group-hover:text-primary'
                }`}>
                  {insuranceType === 'COMPREHENSIVE' ? 'Selected ✓' : 'Select Comprehensive'}
                </span>
              </button>
            </div>
          </div>

          {/* Comprehensive Form - expands inside the card */}
          {insuranceType === 'COMPREHENSIVE' && showComprehensiveForm && (
            <div className="border-t border-border bg-muted/50 px-4 py-5 sm:px-8">
              <h3 className="mb-1 font-bold text-foreground">Vehicle Details</h3>
              <p className="mb-4 text-xs text-muted-foreground">Provide your vehicle info to get Comprehensive plans</p>
              <div className="grid gap-3 sm:grid-cols-2">

                {/* Vehicle Type */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary">Vehicle Type <span className="text-destructive">*</span></label>
                  <select
                    value={comprehensiveForm.vehicleType}
                    onChange={e => handleComprehensiveFieldChange('vehicleType', e.target.value)}
                    className={`${VEHICLE_SELECT_CLASS} ${comprehensiveFormErrors.vehicleType ? 'border-destructive' : 'border-border'}`}
                  >
                    <option value="">Select Vehicle Type</option>
                    {[{ value: 'MOTORCYCLE', label: 'Motorcycle' }, { value: 'PRIVATECAR', label: 'Private Car' }, { value: 'COMMERCIAL', label: 'Commercial' }, { value: 'LTO', label: 'LTO' }].map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {comprehensiveFormErrors.vehicleType && <p className="mt-0.5 text-xs text-destructive">{comprehensiveFormErrors.vehicleType}</p>}
                </div>

                {/* Make */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary">Vehicle Make <span className="text-destructive">*</span></label>
                  <select
                    value={comprehensiveForm.vehicleMake}
                    onChange={e => handleComprehensiveFieldChange('vehicleMake', e.target.value)}
                    disabled={!comprehensiveForm.vehicleType || loadingField === 'vehicleMake'}
                    className={`${VEHICLE_SELECT_CLASS} ${comprehensiveFormErrors.vehicleMake ? 'border-destructive' : 'border-border'}`}
                  >
                    <option value="">{loadingField === 'vehicleMake' ? 'Loading...' : 'Select Make'}</option>
                    {makeOptions.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
                  </select>
                  {comprehensiveFormErrors.vehicleMake && <p className="mt-0.5 text-xs text-destructive">{comprehensiveFormErrors.vehicleMake}</p>}
                </div>

                {/* Model */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary">Vehicle Model <span className="text-destructive">*</span></label>
                  <select
                    value={comprehensiveForm.vehicleModel}
                    onChange={e => handleComprehensiveFieldChange('vehicleModel', e.target.value)}
                    disabled={!comprehensiveForm.vehicleMake || loadingField === 'vehicleModel'}
                    className={`${VEHICLE_SELECT_CLASS} ${comprehensiveFormErrors.vehicleModel ? 'border-destructive' : 'border-border'}`}
                  >
                    <option value="">{loadingField === 'vehicleModel' ? 'Loading...' : 'Select Model'}</option>
                    {modelOptions.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
                  </select>
                  {comprehensiveFormErrors.vehicleModel && <p className="mt-0.5 text-xs text-destructive">{comprehensiveFormErrors.vehicleModel}</p>}
                </div>

                {/* Body Type */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary">Body Type <span className="text-destructive">*</span></label>
                  <select
                    value={comprehensiveForm.bodyType}
                    onChange={e => handleComprehensiveFieldChange('bodyType', e.target.value)}
                    disabled={!comprehensiveForm.vehicleModel || loadingField === 'bodyType'}
                    className={`${VEHICLE_SELECT_CLASS} ${comprehensiveFormErrors.bodyType ? 'border-destructive' : 'border-border'}`}
                  >
                    <option value="">{loadingField === 'bodyType' ? 'Loading...' : 'Select Body Type'}</option>
                    {bodyTypeOptions.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
                  </select>
                  {comprehensiveFormErrors.bodyType && <p className="mt-0.5 text-xs text-destructive">{comprehensiveFormErrors.bodyType}</p>}
                </div>

                {/* Model Year */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary">Model Year <span className="text-destructive">*</span></label>
                  <select
                    value={comprehensiveForm.modelYear}
                    onChange={e => handleComprehensiveFieldChange('modelYear', e.target.value)}
                    disabled={!comprehensiveForm.bodyType || loadingField === 'modelYear'}
                    className={`${VEHICLE_SELECT_CLASS} ${comprehensiveFormErrors.modelYear ? 'border-destructive' : 'border-border'}`}
                  >
                    <option value="">{loadingField === 'modelYear' ? 'Loading...' : 'Select Year'}</option>
                    {yearOptions.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
                  </select>
                  {comprehensiveFormErrors.modelYear && <p className="mt-0.5 text-xs text-destructive">{comprehensiveFormErrors.modelYear}</p>}
                </div>

                {/* Sub Model */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary">Sub Model <span className="text-destructive">*</span></label>
                  <select
                    value={comprehensiveForm.subModel}
                    onChange={e => handleComprehensiveFieldChange('subModel', e.target.value)}
                    disabled={!comprehensiveForm.modelYear || loadingField === 'subModel'}
                    className={`${VEHICLE_SELECT_CLASS} ${comprehensiveFormErrors.subModel ? 'border-destructive' : 'border-border'}`}
                  >
                    <option value="">{loadingField === 'subModel' ? 'Loading...' : 'Select Sub Model'}</option>
                    {subModelOptions.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
                  </select>
                  {comprehensiveFormErrors.subModel && <p className="mt-0.5 text-xs text-destructive">{comprehensiveFormErrors.subModel}</p>}
                </div>

                {/* Vehicle Usage */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary">Vehicle Usage <span className="text-destructive">*</span></label>
                  <select
                    value={comprehensiveForm.vehicleUsage}
                    onChange={e => handleComprehensiveFieldChange('vehicleUsage', e.target.value)}
                    disabled={!comprehensiveForm.subModel || loadingField === 'vehicleUsage'}
                    className={`${VEHICLE_SELECT_CLASS} ${comprehensiveFormErrors.vehicleUsage ? 'border-destructive' : 'border-border'}`}
                  >
                    <option value="">{loadingField === 'vehicleUsage' ? 'Loading...' : 'Select Usage'}</option>
                    {usageOptions.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
                  </select>
                  {comprehensiveFormErrors.vehicleUsage && <p className="mt-0.5 text-xs text-destructive">{comprehensiveFormErrors.vehicleUsage}</p>}
                </div>

                {/* Sum Insured */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary">Sum Insured <span className="text-destructive">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₱</span>
                    <input
                      type="number" placeholder="100000" min="10000"
                      value={comprehensiveForm.sumInsured}
                      onChange={e => handleComprehensiveFieldChange('sumInsured', e.target.value)}
                      className={`w-full rounded-full border bg-white pl-7 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 ${comprehensiveFormErrors.sumInsured ? 'border-destructive' : 'border-border'}`}
                    />
                  </div>
                  {comprehensiveFormErrors.sumInsured && <p className="mt-0.5 text-xs text-destructive">{comprehensiveFormErrors.sumInsured}</p>}
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <PrimaryActionButton
                  size="lg"
                  className="px-8 text-sm"
                  onClick={handleSearchComprehensivePlans}
                >
                  Search Plans
                </PrimaryActionButton>
              </div>
            </div>
          )}
        </div>

        {/* Proposal Search — inline on desktop, in bottom-nav sheet on mobile */}
        <div className="mt-4 hidden md:block"><MotorProposalSearch /></div>
      </div>

      {/* Plans section */}
      {insuranceType && !showComprehensiveForm && (
        <div id="motor-plans" className="w-full mt-8 border-t border-border">
          <div className="mx-auto w-full max-w-7xl px-4 py-8">
            {isLoadingPlans && plans.length === 0 ? (
              <>
                {/* Header skeleton */}
                <div className="mb-8 text-center">
                  <Skeleton className="mx-auto h-8 w-[50%] sm:h-10" />
                  <Skeleton className="mx-auto mt-2 h-4 w-40" />
                </div>
                {/* Content skeleton with sidebar */}
                <div className="flex gap-6">
                  <aside className="hidden w-[200px] shrink-0 lg:block">
                    <div className="sticky top-4 space-y-6">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </aside>
                  <div className="flex flex-1 flex-col gap-4">
                    <Skeleton className="h-4 w-56" />
                    {Array.from({ length: 3 }).map((_, i) => (
                      <PlanCardSkeleton key={i} />
                    ))}
                    <p className="text-muted-foreground text-center text-sm">
                      Searching for the best plans for you...
                    </p>
                  </div>
                </div>
              </>
            ) : (
            <>
            <div className="mb-8 text-center">
              <h2 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-2xl font-black text-transparent sm:text-3xl md:text-4xl">
                Choose Your Motor Insurance Plan
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">{insuranceType === 'CTPL' ? 'CTPL' : 'Comprehensive'} Insurance Plans</p>
            </div>

            {!isLoadingPlans && plansError && plans.length === 0 && (
              <NoPlanState
                message={
                  plansError.toLowerCase().includes('agent') || plansError.toLowerCase().includes('lob')
                    ? "Motor insurance plans are not currently available through this link. This may be because the service is not yet enabled for this agent."
                    : plansError
                }
                onModifySearch={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              />
            )}

            {plans.length > 0 && (
              <div className="flex gap-6 pb-8">
                {/* Left sidebar filters */}
                <SortFilterSidebar
                  sortOptions={[
                    { key: 'lowest', label: 'Lowest premium' },
                    { key: 'highest', label: 'Highest sum insured' },
                  ]}
                  currentSort={motorSortBy}
                  onSortChange={(key) => setMotorSortBy(key as 'lowest' | 'highest')}
                  providers={Array.from(new Set(plans.map((p: any) => p.CarrierCode as string))).map((code) => {
                    const company = COMPANIES.find((c) => c.carrierCode === code)
                    return {
                      code,
                      name: company?.companyName || code,
                      isActive: motorSelectedProviders.length === 0 || motorSelectedProviders.includes(code),
                    }
                  })}
                  onProviderToggle={(code) =>
                    setMotorSelectedProviders((prev) =>
                      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
                    )
                  }
                />

                {/* Plan cards */}
                <div className="flex flex-1 flex-col gap-4">
                <p className="text-muted-foreground text-sm">
                  We have {plans.length} recommendation{plans.length !== 1 ? 's' : ''} to explore.
                </p>
                {[...plans]
                  .filter((plan: any) => motorSelectedProviders.length === 0 || motorSelectedProviders.includes(plan.CarrierCode))
                  .sort((a: any, b: any) => {
                    const pa = parseFloat(a.DuePremium) || parseFloat(a.GrossPremium) || 0
                    const pb = parseFloat(b.DuePremium) || parseFloat(b.GrossPremium) || 0
                    if (motorSortBy === 'lowest') return pa - pb
                    const getMaxSi = (plan: any) => Math.max(0, ...(plan.MainBenefits || []).map((b: any) => Number(b.Silimit || 0)))
                    return getMaxSi(b) - getMaxSi(a)
                  })
                  .map((plan, index) => {
                  const carrier = COMPANIES.find(c => c.carrierCode === plan.CarrierCode)
                  const premium = parseFloat(plan.DuePremium) || parseFloat(plan.GrossPremium) || parseFloat(plan.BeforeVatPremium) || Number(plan.Premium) || 0
                  const benefits = plan.MainBenefits || []
                  const brandColor = CARRIER_BRAND_COLORS[plan.CarrierCode] || { bg: '#374151', invertLogo: false, logoWhite: undefined }

                  // Top 3 benefits with amounts
                  const benefitsWithAmounts = benefits.filter((b: any) => b.Silimit || b.DefaultLimitDesc).slice(0, 3)

                  return (
                    <Card key={index} variant="interactive" className="relative mb-3 w-full gap-0 overflow-hidden py-0 transition-all sm:flex-row">
                      {/* Left brand block */}
                      <div
                        className="flex h-[100px] w-full shrink-0 items-center justify-center overflow-hidden sm:h-auto sm:w-[140px] sm:rounded-l-xl md:w-[160px] lg:w-[180px]"
                      >
                        {brandColor.planCardLogo ? (
                          <Image
                            src={brandColor.planCardLogo}
                            alt={carrier?.companyName || plan.CarrierCode}
                            className={`h-full w-full object-contain ${plan.CarrierCode === 'PACIFIC' ? 'p-2 sm:p-6' : 'p-3 sm:p-8'}`}
                            width={180}
                            height={120}
                          />
                        ) : carrier?.image ? (
                          <Image
                            src={carrier.image}
                            alt={carrier.companyName}
                            className="h-full w-full object-cover"
                            width={180}
                            height={120}
                          />
                        ) : (
                          <span className="text-foreground text-center text-lg font-bold uppercase leading-tight tracking-wide sm:text-xl">
                            {carrier?.companyName || plan.CarrierCode}
                          </span>
                        )}
                      </div>

                      {/* Middle content */}
                      <div className="flex flex-1 flex-col justify-center p-4 sm:p-5">
                        <h3 className="text-foreground text-base font-bold uppercase tracking-wide sm:text-lg">
                          {plan.CarrierProductName || plan.CarrierPlanDesc || plan.CarrierPlanCode}
                        </h3>
                        <div className="mt-1 mb-3">
                          <span className="rounded-full bg-blue-50 dark:bg-blue-900/30 px-3 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
                            {insuranceType === 'CTPL' ? 'CTPL' : 'Comprehensive'}
                          </span>
                        </div>
                        {benefitsWithAmounts.length > 0 ? (
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
                            {benefitsWithAmounts.map((b: any, i: number) => (
                              <div key={i} className="min-w-0">
                                <p className="text-foreground truncate text-sm font-semibold">
                                  {b.DefaultLimitDesc || `Php ${Number(b.Silimit).toLocaleString('en-PH')}`}
                                </p>
                                <p className="text-muted-foreground truncate text-xs">{b.BenefitDesc}</p>
                              </div>
                            ))}
                          </div>
                        ) : benefits.length > 0 ? (
                          <div className="space-y-1">
                            {benefits.slice(0, 3).map((b: any, i: number) => (
                              <div key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                                <span className="text-foreground text-xs font-medium">{b.BenefitDesc}</span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        {benefits.length > 3 && (
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
                            <span className="inline-flex items-center gap-1 rounded-full border border-border dark:border-gray-700 bg-background px-4 py-1 text-xs font-medium text-foreground">
                              View more ›
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right price + button */}
                      <div className="flex w-full shrink-0 flex-col items-center justify-center border-t border-border dark:border-gray-800 p-4 sm:w-[140px] sm:border-l sm:border-t-0 md:w-[160px] lg:w-[180px]">
                        <PriceDisplay amount={premium} label="Premium" className="mb-3" />
                        <PrimaryActionButton
                          size="sm"
                          className="h-8 w-full px-4 text-xs font-semibold"
                          onClick={() => handleBuyNow(plan)}
                        >
                          Apply Now
                        </PrimaryActionButton>
                      </div>
                    </Card>
                  )
                })}
                </div>
              </div>
            )}
            </>
            )}
          </div>
        </div>
      )}

      {/* Testimonials — hidden on mobile (low priority) */}
      <div className="mx-auto mt-16 hidden w-full max-w-7xl px-4 md:block">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-foreground">What Our Customers Say</h2>
          <p className="text-sm text-muted-foreground">Real stories from real Filipino families we've protected</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { name: 'Juan Dela Cruz', role: 'Driver', text: 'Napakadali ng proseso! Nakuha ko ang aking CTPL sa loob ng ilang minuto. Highly recommended!' },
            { name: 'Maria Santos', role: 'Nurse', text: 'Affordable and reliable. One Insurance made getting CTPL so convenient for me.' },
            { name: 'Mark Rivera', role: 'Engineer', text: 'Great service! The online process was seamless and the coverage is comprehensive.' },
            { name: 'Carlo Fernandez', role: 'Teacher', text: 'I renewed my CTPL here and it was so much faster than going to the office. Salamat!' },
          ].map((t, i) => (
            <div key={i} className="rounded-2xl border bg-card p-5 shadow-sm space-y-3">
              <StarRating rating={5} />
              <p className="text-sm text-muted-foreground italic">"{t.text}"</p>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{t.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs — hidden on mobile (low priority) */}
      <section className="mt-16 hidden w-full bg-section py-16 md:block">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 md:grid-cols-3 md:gap-12">
            <div className="space-y-4">
              <h2 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-3xl font-black text-transparent leading-tight">
                Got a question about Motor Insurance?
              </h2>
              <p className="text-muted-foreground text-sm">Find answers to the most common questions about our motor insurance plans</p>
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
