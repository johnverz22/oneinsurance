'use client'

import { useState, useRef } from 'react'
import { Search, Loader2, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { useCtplInsuranceStateStore } from '@/store/ctpl-store'
import { useRouter, useParams } from 'next/navigation'

export function MotorProposalSearch() {
  const [proposalNumber, setProposalNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<'business' | 'general' | null>(null)
  const isProcessingRef = useRef(false)
  const router = useRouter()
  const params = useParams()
  const agentCode = params['agent-code'] as string
  
  const {
    setInsuranceType,
    setSelectedVehicle,
    setDuration,
    setVehicleRegistration,
    setPersonalInfo,
    setClientRequestId,
    setFullQuoteResponse,
    updateCoverageOption,
  } = useCtplInsuranceStateStore()

  const handleSearch = async () => {
    if (!proposalNumber.trim()) {
      toast.error('Please enter a proposal number')
      return
    }

    setErrorMessage(null)
    setErrorType(null)

    if (isProcessingRef.current || isLoading) {
      console.log('⚠️ Already processing a request, ignoring duplicate call')
      return
    }

    console.log('🔍 Starting motor insurance proposal search for:', proposalNumber.trim())
    setIsLoading(true)
    isProcessingRef.current = true

    try {
      // Determine if it's CTPL or Comprehensive from proposal number prefix
      // This is a heuristic - adjust based on your actual proposal number format
      const isCTPL = proposalNumber.toUpperCase().includes('CTPL') || 
                     proposalNumber.toUpperCase().startsWith('PMOTOR')
      
      const endpoint = isCTPL 
        ? '/api/motor-insurance/ctpl/load-quote'
        : '/api/motor-insurance/comprehensive/load-quote'

      console.log(`📡 Calling ${isCTPL ? 'CTPL' : 'Comprehensive'} load-quote API...`)
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Type: 'proposal',
          ProposalNo: proposalNumber.trim(),
        }),
        cache: 'no-store',
      })

      const data = await response.json()

      console.log('Load Quote API Response Status:', response.status)
      console.log('Load Quote API Response Data:', JSON.stringify(data, null, 2))

      const actualData = data.data
      
      if (response.status === 422) {
        console.error('❌ Business logic error (422):', data)
        const errorMsg = data.error || data.message || 'This proposal cannot be processed.'
        setErrorMessage(errorMsg)
        setErrorType('business')
        return
      }
      
      if (!response.ok || !data.success || !actualData) {
        console.error('❌ Proposal not found - no data returned')
        const errorMsg = data.error || data.message || 'Proposal not found. Please check the proposal number.'
        setErrorMessage(errorMsg)
        setErrorType('general')
        return
      }

      const dataKeys = Object.keys(actualData)
      console.log('Response data keys:', dataKeys)
      
      if (dataKeys.length === 1 && dataKeys[0] === 'ValidateResult') {
        console.error('❌ Proposal not found - only ValidateResult returned')
        const validateResult = actualData.ValidateResult
        
        if (validateResult && validateResult.ErrorMessage && Array.isArray(validateResult.ErrorMessage) && validateResult.ErrorMessage.length > 0) {
          const firstError = validateResult.ErrorMessage[0]
          console.error('Validation error:', firstError)
          const errorMsg = firstError?.message || firstError?.Message || 'Invalid proposal. Please check the proposal number.'
          setErrorMessage(errorMsg)
          setErrorType('general')
        } else {
          setErrorMessage('Proposal not found. Please check the proposal number.')
          setErrorType('general')
        }
        return
      }

      const proposalData = actualData
      console.log('✅ Loaded proposal from backend')
      console.log('ProposalNo:', proposalData.ProposalNo)
      console.log('CarrierPolicyNo:', proposalData.CarrierPolicyNo)
      console.log('PolicyNo:', proposalData.PolicyNo)

      // Check if proposal has CarrierPolicyNo (payment completed)
      const hasPolicy = !!proposalData.CarrierPolicyNo
      
      if (hasPolicy) {
        console.log('✅ Payment completed - showing error message')
        
        // Payment already completed - show error message
        setErrorMessage('This proposal has already been paid and processed. Please check your email for the policy document or contact support.')
        setErrorType('business')
        return
      } else {
        console.log('✅ Payment not completed - populating form and navigating to review')
        
        // Populate store with proposal data
        setInsuranceType(proposalData.IsCTPL === 'Y' ? 'CTPL' : 'COMPREHENSIVE')
        
        // Set vehicle info
        setSelectedVehicle({
          image: '/images/logo.png',
          title: proposalData.ProductType || 'Vehicle',
          code: proposalData.ProductType || 'MOTORCYCLE',
        })
        
        // Set duration
        const durationValue = parseInt(proposalData.Duration)
        setDuration({
          duration: (durationValue === 3 ? 3 : 1) as 1 | 3,
          effectiveDate: new Date(proposalData.EffectiveDate),
          expiryDate: new Date(proposalData.ExpiryDate),
        })
        
        // Set vehicle registration from PolicyRiskList
        const risk = proposalData.PolicyLobList?.[0]?.PolicyRiskList?.[0]
        if (risk) {
          setVehicleRegistration({
            mvFileNumber: risk.MvFileNumber || '',
            plateNumber: risk.LicensePlateNumber || '',
            engineNumber: risk.EngineNo || '',
            chassisNumber: risk.ChassisNo || '',
            make: risk.VehicleMake || '',
            model: risk.VehicleModel || '',
            bodyType: risk.BodyType || '',
            modelYear: risk.ModelYear || '',
            subModel: risk.SubModel || '',
            typeOfUse: risk.VehicleUsage || '',
            dateOfRegistration: risk.DateOfRegistration ? new Date(risk.DateOfRegistration) : new Date(),
            fieldOfficeCode: risk.FieldOfficeCode || '',
            agreeToTerms: true,
          })
        }
        
        // Set personal info from PolicyCustomerList
        const customer = proposalData.PolicyCustomerList?.[0]
        if (customer) {
          setPersonalInfo({
            firstName: customer.FirstName || '',
            middleName: customer.MiddleName || '',
            lastName: customer.LastName || '',
            suffix: customer.Suffix || 'No Suffix',
            gender: customer.Gender || 'M',
            dateOfBirth: customer.DateOfBirth ? new Date(customer.DateOfBirth) : new Date(),
            idType: customer.IdTypeCode || 'PAS',
            idNumber: customer.IdNo || '',
            province: customer.AddrProvince || '',
            city: customer.City || '',
            zipCode: customer.PostCode?.toString() || '',
            addressLine1: customer.AddressLine1 || '',
            addressLine2: customer.AddressLine2 || '',
            mobileNumber: customer.Mobile || '',
            email: customer.Email || '',
          })
        }
        
        // Set coverage option
        updateCoverageOption({
          carrierCode: proposalData.CarrierCode || '',
          selectedPlan: {
            CarrierCode: proposalData.CarrierCode,
            CarrierName: proposalData.CarrierName || '',
            CarrierPlanCode: proposalData.CarrierPlanCode || '',
            CarrierProductCode: proposalData.CarrierProductCode || '',
            CarrierProductName: proposalData.ProductName || '',
            Premium: proposalData.GrossPremium || proposalData.TotalPremium || 0,
          } as any,
        })
        
        // Store full quote response
        setFullQuoteResponse(proposalData)
        
        // Navigate to avail page at step 4 (review step)
        // Step 0: Insurance type selection (landing page)
        // Step 1: Plan details
        // Step 2: Vehicle registration
        // Step 3: Personal info
        // Step 4: Review ← Navigate here
        // Step 5: Payment
        router.push(`/${agentCode}/products/ctpl-insurance/avail?step=4`)
        toast.success('Loading proposal...')
      }
    } catch (error) {
      console.error('❌ Error loading proposal:', error)
      
      if (error instanceof Error) {
        setErrorMessage(`Failed to load proposal: ${error.message}`)
      } else {
        setErrorMessage('Failed to load proposal. Please check the proposal number and try again.')
      }
      setErrorType('general')
    } finally {
      setIsLoading(false)
      setTimeout(() => {
        isProcessingRef.current = false
        console.log('✅ Processing flag reset - ready for next search')
      }, 2000)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const clearError = () => {
    setErrorMessage(null)
    setErrorType(null)
  }

  return (
    <Card className="w-full shadow-lg">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="proposal-search" className="text-lg font-semibold">
              Have an existing proposal?
            </Label>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Enter your proposal number to retrieve your saved quote and continue to payment. If payment is already completed, you'll see your policy details and confirmation.
          </p>

          {/* Error Card */}
          {errorMessage && (
            <Alert className={`${errorType === 'business' ? 'border-orange-200 bg-orange-50' : 'border-red-200 bg-red-50'}`}>
              <AlertCircle className={`h-4 w-4 ${errorType === 'business' ? 'text-orange-600' : 'text-red-600'}`} />
              <AlertDescription className="flex items-center justify-between">
                <span className={`${errorType === 'business' ? 'text-orange-800' : 'text-red-800'}`}>
                  {errorMessage}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearError}
                  className={`ml-2 h-6 w-6 p-0 ${errorType === 'business' ? 'text-orange-600 hover:text-orange-800' : 'text-red-600 hover:text-red-800'}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                id="proposal-search"
                placeholder="Enter proposal number (e.g., PMOTOR0000000125)"
                value={proposalNumber}
                onChange={(e) => {
                  setProposalNumber(e.target.value)
                  if (errorMessage) {
                    clearError()
                  }
                }}
                onKeyDown={handleKeyPress}
                disabled={isLoading}
                className="h-12"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isLoading}
              className="from-primary to-accent h-12 rounded-full bg-gradient-to-r via-90% px-6 font-semibold text-white shadow-lg disabled:pointer-events-none disabled:opacity-50 dark:text-white"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Search'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
