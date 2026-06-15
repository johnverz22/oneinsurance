'use client'

import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import { Suspense, useEffect, useState, useRef } from 'react'
import { PageLoader } from '@/components/page-loader'
import { Button } from '@/components/ui/button'
import { FAQsSection } from '@/components/faqs-section'
import { useCtplInsuranceStateStore } from '@/store/ctpl-store'
import { Star, Shield, Car, CheckCircle2, Loader2, TriangleAlert } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { removeStorage } from '@/utils/remove-session-storage'
import { MotorProposalSearch } from '@/components/ctpl-insurance/motor-proposal-search'
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
    <div className="relative overflow-hidden">
      {/* Hero */}
      <div className="relative h-[25rem] w-full md:h-[35rem] lg:h-[45rem]">
        <div className="relative h-full w-full">
          <Image src="/our-products-motorvehicle.webp" alt="motor-hero" className="aspect-video object-cover opacity-75" sizes="100vw" fill />
          <div className="absolute inset-0 bg-black/80" />
        </div>
        <div tabIndex={0} role="button" onClick={() => router.push('/')} className="absolute top-4 left-3 z-10 cursor-pointer rounded-tl-full rounded-br-full bg-white px-6 py-1 shadow-lg sm:top-8 sm:left-4 sm:px-12 lg:left-28">
          <Image src="/images/logo.png" alt="One Insurance" width={140} height={45} className="h-7 w-auto sm:h-10" priority />
        </div>
        <div className="absolute top-0 right-3 max-h-16 max-w-16 rounded-b-xl bg-white px-2 py-1.5 sm:right-8 sm:max-h-24 sm:max-w-24 sm:rounded-b-2xl sm:px-3 sm:py-2 md:right-12 md:max-h-36 md:max-w-36 md:px-6 md:py-4 lg:right-20 lg:max-h-40 lg:max-w-40 lg:px-8 lg:py-4">
          <Image src="/images/IFRC.png" alt="IFRC Logo" width={1920} height={1240} className="h-full w-full object-contain" />
        </div>
        <div className="absolute inset-0 mx-auto flex h-full w-full max-w-7xl flex-col justify-center space-y-2.5 px-4 text-white">
          <h1 className="text-3xl font-black md:text-4xl lg:text-5xl xl:text-6xl">Motor Insurance</h1>
          <h2 className="text-xl font-semibold md:text-2xl lg:text-3xl">CTPL & Comprehensive Coverage</h2>
          <p className="text-sm md:text-base lg:max-w-2/5">Protect yourself and your vehicle with the right motor insurance plan.</p>
        </div>
      </div>

      {/* Main Card - always visible, overlaps hero */}
      <div className="relative mx-auto -mt-20 flex w-full max-w-7xl flex-col px-1.5 lg:-mt-40">
        <div className="rounded-md bg-white shadow-lg backdrop-blur-sm overflow-hidden lg:rounded-xl">
          {/* Header */}
          <div className="px-4 pt-3 pb-6 sm:px-8">
            <h2 className="text-2xl font-black text-gray-900">Choose Your Insurance Type</h2>
            <p className="text-sm text-gray-500 mt-1">Select the coverage that fits your needs</p>

            {/* Bigger card-style toggle — taller with icon, title, description, select button */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={() => selectType('CTPL')}
                className={`group relative flex flex-col items-center gap-2 sm:gap-3 rounded-2xl border-2 p-4 sm:p-8 transition-all text-center ${
                  insuranceType === 'CTPL'
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-gray-200 bg-gray-50 hover:border-primary/40 hover:bg-gray-100'
                }`}
              >
                <div className={`flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-full ${insuranceType === 'CTPL' ? 'bg-primary/10' : 'bg-blue-50'}`}>
                  <Shield className={`h-5 w-5 sm:h-7 sm:w-7 ${insuranceType === 'CTPL' ? 'text-primary' : 'text-blue-400'}`} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900">CTPL Insurance</h3>
                  <p className="mt-0.5 text-xs sm:text-sm text-gray-500">Required by law for all vehicles</p>
                </div>
                <span className={`mt-1 sm:mt-2 rounded-full border px-3 sm:px-5 py-1 sm:py-1.5 text-xs sm:text-sm font-medium transition-all ${
                  insuranceType === 'CTPL'
                    ? 'from-primary to-accent border-transparent bg-gradient-to-r text-white'
                    : 'border-gray-300 text-gray-600 group-hover:border-primary group-hover:text-primary'
                }`}>
                  {insuranceType === 'CTPL' ? 'Selected ✓' : 'Select CTPL'}
                </span>
              </button>

              <button
                onClick={() => selectType('COMPREHENSIVE')}
                className={`group relative flex flex-col items-center gap-2 sm:gap-3 rounded-2xl border-2 p-4 sm:p-8 transition-all text-center ${
                  insuranceType === 'COMPREHENSIVE'
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-gray-200 bg-gray-50 hover:border-primary/40 hover:bg-gray-100'
                }`}
              >
                <div className={`flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-full ${insuranceType === 'COMPREHENSIVE' ? 'bg-primary/10' : 'bg-green-50'}`}>
                  <Car className={`h-5 w-5 sm:h-7 sm:w-7 ${insuranceType === 'COMPREHENSIVE' ? 'text-primary' : 'text-green-400'}`} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900">Comprehensive</h3>
                  <p className="mt-0.5 text-xs sm:text-sm text-gray-500">Complete vehicle protection</p>
                </div>
                <span className={`mt-1 sm:mt-2 rounded-full border px-3 sm:px-5 py-1 sm:py-1.5 text-xs sm:text-sm font-medium transition-all ${
                  insuranceType === 'COMPREHENSIVE'
                    ? 'from-primary to-accent border-transparent bg-gradient-to-r text-white'
                    : 'border-gray-300 text-gray-600 group-hover:border-primary group-hover:text-primary'
                }`}>
                  {insuranceType === 'COMPREHENSIVE' ? 'Selected ✓' : 'Select Comprehensive'}
                </span>
              </button>
            </div>
          </div>

          {/* Comprehensive Form - expands inside the card */}
          {insuranceType === 'COMPREHENSIVE' && showComprehensiveForm && (
            <div className="border-t border-gray-100 bg-gray-50 px-4 py-5 sm:px-8">
              <h3 className="mb-1 font-bold text-gray-800">Vehicle Details</h3>
              <p className="mb-4 text-xs text-gray-500">Provide your vehicle info to get Comprehensive plans</p>
              <div className="grid gap-3 sm:grid-cols-2">

                {/* Vehicle Type */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary">Vehicle Type <span className="text-destructive">*</span></label>
                  <select
                    value={comprehensiveForm.vehicleType}
                    onChange={e => handleComprehensiveFieldChange('vehicleType', e.target.value)}
                    className={`w-full rounded-full border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 ${comprehensiveFormErrors.vehicleType ? 'border-red-400' : 'border-gray-200'}`}
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
                    className={`w-full rounded-full border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 ${comprehensiveFormErrors.vehicleMake ? 'border-red-400' : 'border-gray-200'}`}
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
                    className={`w-full rounded-full border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 ${comprehensiveFormErrors.vehicleModel ? 'border-red-400' : 'border-gray-200'}`}
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
                    className={`w-full rounded-full border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 ${comprehensiveFormErrors.bodyType ? 'border-red-400' : 'border-gray-200'}`}
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
                    className={`w-full rounded-full border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 ${comprehensiveFormErrors.modelYear ? 'border-red-400' : 'border-gray-200'}`}
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
                    className={`w-full rounded-full border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 ${comprehensiveFormErrors.subModel ? 'border-red-400' : 'border-gray-200'}`}
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
                    className={`w-full rounded-full border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 ${comprehensiveFormErrors.vehicleUsage ? 'border-red-400' : 'border-gray-200'}`}
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
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">₱</span>
                    <input
                      type="number" placeholder="100000" min="10000"
                      value={comprehensiveForm.sumInsured}
                      onChange={e => handleComprehensiveFieldChange('sumInsured', e.target.value)}
                      className={`w-full rounded-full border bg-white pl-7 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 ${comprehensiveFormErrors.sumInsured ? 'border-red-400' : 'border-gray-200'}`}
                    />
                  </div>
                  {comprehensiveFormErrors.sumInsured && <p className="mt-0.5 text-xs text-destructive">{comprehensiveFormErrors.sumInsured}</p>}
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  className="bg-primary from-primary to-accent h-12 rounded-full bg-gradient-to-r via-90% px-8 text-sm font-medium text-white shadow-lg hover:bg-green-700 disabled:pointer-events-none disabled:opacity-50"
                  onClick={handleSearchComprehensivePlans}
                >
                  Search Plans
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Proposal Search */}
        <div className="mt-4"><MotorProposalSearch /></div>
      </div>

      {/* Plans section */}
      {insuranceType && !showComprehensiveForm && (
        <div className="w-full mt-8 border-t border-gray-100">
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
              <div className="flex min-h-[40vh] items-center justify-center px-4 py-16">
                <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                      <TriangleAlert className="h-7 w-7 text-gray-400" />
                    </div>
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-gray-800">No Plans Available</h3>
                  <p className="mb-4 text-sm text-gray-500">
                    {plansError.toLowerCase().includes('agent') || plansError.toLowerCase().includes('lob')
                      ? "Motor insurance plans are not currently available through this link. This may be because the service is not yet enabled for this agent."
                      : plansError}
                  </p>
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="rounded-full bg-gray-100 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    Modify Search
                  </button>
                </div>
              </div>
            )}

            {plans.length > 0 && (
              <div className="flex gap-6 pb-8">
                {/* Left sidebar filters */}
                <aside className="hidden w-[200px] shrink-0 lg:block">
                  <div className="sticky top-4 space-y-6">
                    <div>
                      <h4 className="text-foreground mb-2 text-sm font-bold">Sorted by</h4>
                      <ul className="space-y-1.5">
                        <li>
                          <button type="button" onClick={() => setMotorSortBy('lowest')} className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
                            <span className={`h-2.5 w-2.5 rounded-full border ${motorSortBy === 'lowest' ? 'border-green-600 bg-green-600' : 'border-gray-300 bg-white'}`} />
                            Lowest premium
                          </button>
                        </li>
                        <li>
                          <button type="button" onClick={() => setMotorSortBy('highest')} className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
                            <span className={`h-2.5 w-2.5 rounded-full border ${motorSortBy === 'highest' ? 'border-green-600 bg-green-600' : 'border-gray-300 bg-white'}`} />
                            Highest sum insured
                          </button>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-foreground mb-2 text-sm font-bold">By providers</h4>
                      <ul className="space-y-1.5">
                        {Array.from(new Set(plans.map((p: any) => p.CarrierCode))).map((code: any) => {
                          const company = COMPANIES.find((c) => c.carrierCode === code)
                          const isActive = motorSelectedProviders.length === 0 || motorSelectedProviders.includes(code)
                          return (
                            <li key={code}>
                              <button type="button" onClick={() => setMotorSelectedProviders(prev => prev.includes(code) ? prev.filter((c: string) => c !== code) : [...prev, code])} className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
                                <span className={`h-2.5 w-2.5 rounded-full border ${isActive ? 'border-green-600 bg-green-600' : 'border-gray-300 bg-white'}`} />
                                {company?.companyName || code}
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </div>
                </aside>

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
                    <div key={index} className="bg-background relative flex w-full flex-col rounded-xl overflow-hidden transition-all shadow-[0_0_0_1px_rgba(0,0,0,0.08)] hover:shadow-md mb-3 sm:flex-row">
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
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                                <span className="text-foreground text-xs font-medium">{b.BenefitDesc}</span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        {benefits.length > 3 && (
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
                            <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 bg-background px-4 py-1 text-xs font-medium text-foreground">
                              View more ›
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right price + button */}
                      <div className="flex w-full shrink-0 flex-col items-center justify-center border-t border-gray-100 dark:border-gray-800 p-4 sm:w-[140px] sm:border-l sm:border-t-0 md:w-[160px] lg:w-[180px]">
                        <div className="flex items-baseline gap-1 mb-1">
                          <span className="text-primary text-xs font-semibold">PHP</span>
                          <span className="text-foreground text-lg font-black sm:text-xl lg:text-2xl">
                            {premium.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        <span className="text-primary mb-3 text-xs font-medium">Premium</span>
                        <Button
                          size="sm"
                          className="w-full rounded-full from-primary to-accent bg-gradient-to-r px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
                          onClick={() => handleBuyNow(plan)}
                        >
                          Apply Now
                        </Button>
                      </div>
                    </div>
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
