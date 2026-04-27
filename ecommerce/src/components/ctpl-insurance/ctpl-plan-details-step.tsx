'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useCtplInsuranceStateStore } from '@/store/ctpl-store'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { format } from 'date-fns'

type Plan = {
  CarrierCode: string
  CarrierName: string
  CarrierPlanCode: string
  CarrierProductCode: string
  CarrierProductName: string
  Premium: number
  Benefits?: string[]
}

export default function CtplPlanDetailsStep() {
  const { 
    selectedVehicle, 
    insuranceType, 
    duration,
    sumInsured,
    setSumInsured,
    increaseStep,
    setClientRequestId,
    updateCoverageOption
  } = useCtplInsuranceStateStore()
  
  const params = useParams()
  const router = useRouter()
  const agentCode = params['agent-code'] as string

  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sumInsuredInput, setSumInsuredInput] = useState(sumInsured?.toString() || '100000')

  // Fetch plans on mount
  useEffect(() => {
    if (insuranceType && selectedVehicle?.code && duration?.effectiveDate) {
      fetchPlans()
    }
  }, [insuranceType, selectedVehicle, duration])

  const fetchPlans = async () => {
    setLoading(true)
    setError(null)

    try {
      const effectiveDate = format(duration.effectiveDate, 'yyyy-MM-dd')
      const expiryDate = format(duration.expiryDate, 'yyyy-MM-dd')

      const basePayload = {
        Duration: duration.duration.toString(),
        EffectiveDate: effectiveDate,
        ExpiryDate: expiryDate,
        IsCTPL: insuranceType === 'CTPL' ? 'Y' : 'N',
        PolicyLobList: [
          {
            ProductCode: 'MOTOR',
            PolicyRiskList: [
              {
                ProductElementCode: 'R00004',
                IsPlateNoAvailable: 'Y',
              },
            ],
          },
        ],
        ProductCode: 'MOTOR',
        ProductType: selectedVehicle.code,
        ProductVersion: '1.0',
        AgentCode: agentCode,
        Slug: insuranceType === 'CTPL' ? 'motor-ctpl' : 'motor-comprehensive',
      }

      // Add SumInsured for Comprehensive
      const payload = insuranceType === 'COMPREHENSIVE' 
        ? { ...basePayload, SumInsured: parseInt(sumInsuredInput) }
        : basePayload

      const endpoint = insuranceType === 'CTPL' 
        ? '/api/motor-insurance/ctpl/compare-quote'
        : '/api/motor-insurance/comprehensive/compare-quote'

      console.log('Fetching plans with payload:', payload)

      const response = await axios.post(endpoint, payload)

      console.log('Compare quote response:', response.data)

      // Store ClientRequestId
      if (response.data?.ClientRequestId) {
        setClientRequestId(response.data.ClientRequestId)
      }

      // Extract plans from response
      const plansList = response.data?.SupportedCarrier || []
      setPlans(plansList)

      if (plansList.length === 0) {
        setError('No plans available for this vehicle type')
      }
    } catch (err: any) {
      console.error('Error fetching plans:', err)
      setError(err.response?.data?.message || 'Failed to fetch plans. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan)
    // Cast to any to avoid type mismatch - the store will handle the actual plan data
    updateCoverageOption({
      selectedPlan: plan as any,
      carrierCode: plan.CarrierCode,
    })
  }

  const handleContinue = () => {
    if (!selectedPlan) {
      alert('Please select a plan to continue')
      return
    }
    
    // Save sumInsured for Comprehensive
    if (insuranceType === 'COMPREHENSIVE') {
      setSumInsured(parseInt(sumInsuredInput))
    }
    
    increaseStep()
  }

  const handleSumInsuredChange = (value: string) => {
    setSumInsuredInput(value)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="from-primary to-accent mb-6 bg-gradient-to-r bg-clip-text text-2xl font-black text-transparent">
          {insuranceType === 'CTPL' ? 'CTPL' : 'Comprehensive'} Insurance Plans
        </h2>

        {/* Vehicle Info */}
        <div className="mb-6 flex items-start gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <span className="text-3xl">🚗</span>
          <div className="flex-1">
            <span className="mb-1 inline-block rounded-full border border-gray-200 px-3 py-0.5 text-xs text-gray-600">
              {insuranceType} Insurance
            </span>
            <h3 className="text-lg font-black uppercase text-gray-900">{selectedVehicle?.title}</h3>
            <p className="text-sm text-gray-500">Coverage Period: {duration.duration} Year{duration.duration > 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Sum Insured Input for Comprehensive */}
        {insuranceType === 'COMPREHENSIVE' && (
          <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <Label htmlFor="sumInsured" className="mb-2 block text-sm font-semibold text-gray-700">
              Sum Insured (Vehicle Value) <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                <Input
                  id="sumInsured"
                  type="number"
                  value={sumInsuredInput}
                  onChange={(e) => handleSumInsuredChange(e.target.value)}
                  className="pl-8"
                  placeholder="100000"
                  min="10000"
                  step="10000"
                />
              </div>
              <Button
                onClick={fetchPlans}
                disabled={loading || !sumInsuredInput}
                className="from-primary to-accent bg-gradient-to-r text-white"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Plans'}
              </Button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Enter the current market value of your vehicle</p>
          </div>
        )}

        <hr className="mb-6" />

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="text-primary mb-4 h-12 w-12 animate-spin" />
            <p className="text-gray-600">Loading available plans...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-red-600">{error}</p>
            <Button
              onClick={fetchPlans}
              variant="outline"
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Plans List */}
        {!loading && !error && plans.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Select a plan to continue:</p>
            {plans.map((plan, index) => (
              <div
                key={index}
                onClick={() => handleSelectPlan(plan)}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                  selectedPlan?.CarrierCode === plan.CarrierCode && selectedPlan?.CarrierPlanCode === plan.CarrierPlanCode
                    ? 'border-primary bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full border border-gray-200 bg-white px-3 py-0.5 text-xs font-semibold text-gray-600">
                        {plan.CarrierName || plan.CarrierCode}
                      </span>
                      {selectedPlan?.CarrierCode === plan.CarrierCode && selectedPlan?.CarrierPlanCode === plan.CarrierPlanCode && (
                        <span className="text-primary text-sm">✓ Selected</span>
                      )}
                    </div>
                    <h4 className="mb-1 text-base font-black uppercase text-gray-900">
                      {plan.CarrierProductName || plan.CarrierPlanCode}
                    </h4>
                    <p className="text-xs text-gray-500">Plan Code: {plan.CarrierPlanCode}</p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-[#F5A623] px-4 py-2 text-sm font-bold text-white">
                      ₱ {plan.Premium?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          className="rounded-full px-8"
          onClick={() => router.push(`/${agentCode}/products/ctpl-insurance`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          className="from-primary to-accent rounded-full bg-gradient-to-r px-10 font-semibold text-white"
          onClick={handleContinue}
          disabled={!selectedPlan || loading}
        >
          Continue to Vehicle Details
        </Button>
      </div>
    </div>
  )
}
