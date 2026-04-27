'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import { useCtplInsuranceStateStore } from '@/store/ctpl-store'
import { useParams, useRouter } from 'next/navigation'
import { format, addYears } from 'date-fns'
import { Checkbox } from '@/components/ui/checkbox'

const PRICES: Record<string, number> = {
  PRIVATECAR: 599, MOTORCYCLE: 290, TPMB: 1150, ACTC: 790, LMT: 660, HTPB: 1250, PTB: 1100,
}

export default function CtplReviewPage() {
  const { selectedVehicle, vehicleRegistration, personalInfo, decreaseStep, increaseStep } = useCtplInsuranceStateStore()
  const params = useParams()
  const router = useRouter()
  const agentCode = params['agent-code'] as string
  const [agreed, setAgreed] = useState(false)
  const [agreeError, setAgreeError] = useState('')

  const price = PRICES[selectedVehicle?.code ?? 'PRIVATECAR'] ?? 599
  const today = new Date()
  const expiry = addYears(today, 1)

  const handleProceed = () => {
    if (!agreed) { setAgreeError('You must agree to the terms before proceeding.'); return }
    increaseStep()
  }

  const row = (label: string, value: string) => (
    <div className="flex justify-between border-b border-gray-100 py-2 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value || '—'}</span>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Vehicle Details */}
      <Card className="overflow-hidden shadow-none">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-primary">Vehicle Details</h2>
            <CheckCircle className="text-primary h-5 w-5" />
          </div>
          {row('MV File Number', vehicleRegistration.mvFileNumber)}
          {row('Plate Number', vehicleRegistration.plateNumber)}
          {row('Engine Number', vehicleRegistration.engineNumber)}
          {row('Chassis Number', vehicleRegistration.chassisNumber)}
          {row('Make', vehicleRegistration.make)}
          {row('Model', vehicleRegistration.model)}
          {row('Body Type', vehicleRegistration.bodyType)}
          {row('Model Year', String(vehicleRegistration.modelYear))}
          {row('Sub Model', vehicleRegistration.subModel)}
          {row('Type of Use', vehicleRegistration.typeOfUse)}
        </CardContent>
      </Card>

      {/* Your Information */}
      <Card className="overflow-hidden shadow-none">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-primary">Your Information</h2>
            <CheckCircle className="text-primary h-5 w-5" />
          </div>
          {row('Name', `${personalInfo.firstName} ${personalInfo.middleName ? personalInfo.middleName + ' ' : ''}${personalInfo.lastName}`)}
          {row('Gender', personalInfo.gender === 'M' ? 'Male' : 'Female')}
          {row('Birth Date', personalInfo.dateOfBirth ? format(new Date(personalInfo.dateOfBirth), 'MMMM d, yyyy') : '')}
          {row('Mobile Number', `+63 ${personalInfo.mobileNumber}`)}
          {row('Email Address', personalInfo.email)}
          {row('ID Type', personalInfo.idType)}
          {row('ID Number', personalInfo.idNumber)}
          {row('Address', [personalInfo.addressLine1, personalInfo.city, personalInfo.province].filter(Boolean).join(', '))}
        </CardContent>
      </Card>

      {/* Premium Summary */}
      <Card className="overflow-hidden shadow-none">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-800 text-center">Gross Premium</h2>
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Payment</p>
            <p className="text-4xl font-black text-gray-900">₱ {price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-1">
            <p className="text-xs text-gray-400">Selected CTPL Plan</p>
            <p className="font-bold text-gray-900">{selectedVehicle?.title}</p>
            <p className="text-xs text-gray-500">Ride Hailing Included</p>
            <div className="flex justify-between pt-1">
              <span className="text-sm text-gray-600">₱ {price.toLocaleString()}</span>
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs text-gray-400 mb-1">Policy Period</p>
            <p className="text-sm font-semibold text-gray-800">
              {format(today, 'MMMM d, yyyy')} – {format(expiry, 'MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
            <input placeholder="Get a Promo Code" className="flex-1 bg-transparent text-sm outline-none text-gray-600 placeholder:text-gray-400" />
            <button className="text-sm font-semibold text-orange-500">Apply</button>
          </div>
        </CardContent>
      </Card>

      {/* Terms */}
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <Checkbox
          checked={agreed}
          onCheckedChange={v => { setAgreed(!!v); setAgreeError('') }}
          className="data-[state=checked]:border-primary data-[state=checked]:bg-primary mt-0.5 h-4 w-4"
        />
        <span className="text-sm text-gray-700">
          I hereby confirm that I have carefully read, reviewed and understand the said plans and limitations applicable to this product, including the General Exclusions, and I accept that I agree to all of the policy terms.
        </span>
      </label>
      {agreeError && <p className="text-xs text-red-500">{agreeError}</p>}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" className="rounded-full px-8" onClick={decreaseStep}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          size="lg"
          className="from-primary to-accent rounded-full bg-gradient-to-r px-10 font-semibold text-white"
          onClick={handleProceed}
        >
          Proceed to Payment
        </Button>
      </div>
    </div>
  )
}
