'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, ArrowLeft, Download } from 'lucide-react'
import { useCtplInsuranceStateStore } from '@/store/ctpl-store'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

export default function CtplReviewPage() {
  const { 
    selectedVehicle, 
    vehicleRegistration, 
    personalInfo, 
    decreaseStep, 
    increaseStep,
    fullQuoteResponse,
    insuranceType,
    duration
  } = useCtplInsuranceStateStore()
  
  const params = useParams()
  const router = useRouter()
  const agentCode = params['agent-code'] as string
  const [agreed, setAgreed] = useState(false)
  const [agreeError, setAgreeError] = useState('')

  // Extract premium and proposal number from full quote response
  const premium = fullQuoteResponse?.TotalPremium || fullQuoteResponse?.GrossPremium || 0
  const netPremium = fullQuoteResponse?.NetPremium || 0
  const taxes = fullQuoteResponse?.TotalTax || 0
  const proposalNumber = fullQuoteResponse?.ProposalNo || ''

  const handleDownloadPDF = async () => {
    try {
      if (!proposalNumber) {
        toast.error('No proposal number available')
        return
      }

      toast.info('PDF download feature coming soon')
      // TODO: Implement PDF generation for motor insurance
      // Similar to travel insurance generateQuotePDF
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF')
    }
  }

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
      {/* Proposal Number Display */}
      {proposalNumber && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-semibold">Proposal Number</p>
              <p className="text-lg font-black text-blue-900">{proposalNumber}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={async () => {
                  try {
                    if (navigator?.clipboard?.writeText) {
                      await navigator.clipboard.writeText(proposalNumber)
                      toast.success('Proposal number copied to clipboard')
                    } else {
                      const textArea = document.createElement('textarea')
                      textArea.value = proposalNumber
                      textArea.style.position = 'fixed'
                      textArea.style.left = '-999999px'
                      document.body.appendChild(textArea)
                      textArea.select()
                      try {
                        document.execCommand('copy')
                        toast.success('Proposal number copied to clipboard')
                      } catch (err) {
                        toast.error('Failed to copy proposal number')
                      }
                      document.body.removeChild(textArea)
                    }
                  } catch (error) {
                    console.error('Failed to copy:', error)
                    toast.error('Failed to copy proposal number')
                  }
                }}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
              </Button>
              <div className="rounded-full bg-blue-100 p-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs text-blue-700">
            Save this number to retrieve your quote later
          </p>
        </div>
      )}

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
          <h2 className="text-xl font-bold text-gray-800 text-center">Premium Summary</h2>
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Payment</p>
            <p className="text-4xl font-black text-gray-900">₱ {premium.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
          </div>
          
          {/* Premium Breakdown */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
            <p className="text-xs text-gray-400">Premium Breakdown</p>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Net Premium</span>
                <span className="font-semibold text-gray-900">₱ {netPremium.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
              {taxes > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxes & Fees</span>
                  <span className="font-semibold text-gray-900">₱ {taxes.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-1 mt-1 flex justify-between text-sm font-bold">
                <span className="text-gray-800">Total Premium</span>
                <span className="text-gray-900">₱ {premium.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Plan Details */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-1">
            <p className="text-xs text-gray-400">Selected {insuranceType} Plan</p>
            <p className="font-bold text-gray-900">{selectedVehicle?.title}</p>
            <p className="text-xs text-gray-500">{fullQuoteResponse?.CarrierName || 'Insurance Provider'}</p>
          </div>

          {/* Policy Period */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs text-gray-400 mb-1">Policy Period</p>
            <p className="text-sm font-semibold text-gray-800">
              {format(duration.effectiveDate, 'MMMM d, yyyy')} – {format(duration.expiryDate, 'MMMM d, yyyy')}
            </p>
          </div>

          {/* Promo Code */}
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
      {agreeError && <p className="text-xs text-destructive">{agreeError}</p>}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-full px-8" onClick={decreaseStep}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {proposalNumber && (
            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              className="rounded-full px-6"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          )}
        </div>
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
