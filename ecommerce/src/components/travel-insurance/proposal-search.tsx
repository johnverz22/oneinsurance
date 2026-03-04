'use client'

import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useTravelInsuranceStore, useFullQuoteResponseStore } from '@/store/travel-insurance-store'
import { useRouter, useParams } from 'next/navigation'
import { PaymentSuccessInline } from '@/components/payment/payment-success-inline'
import { PaymentBrand } from '@/types/payment'

export function ProposalSearch() {
  const [proposalNumber, setProposalNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [loadedProposalData, setLoadedProposalData] = useState<any>(null)
  const router = useRouter()
  const params = useParams()
  const agentCode = params['agent-code'] as string
  
  const {
    updateTravelDetails,
    updateTravelersInfo,
    updateCoverageOption,
    setStep,
    setIssueQuoteResponse,
    setSelectedPaymentBrand,
    setClientRequest,
  } = useTravelInsuranceStore()

  const { setApiResponse } = useFullQuoteResponseStore()

  const handleSearch = async () => {
    if (!proposalNumber.trim()) {
      toast.error('Please enter a proposal number')
      return
    }

    setIsLoading(true)

    try {
      // First, try to load from backend
      const response = await fetch('/api/travel-insurance/load-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ProposalNo: proposalNumber.trim(),
        }),
      })

      const data = await response.json()

      console.log('Load Quote API Response Status:', response.status)
      console.log('Load Quote API Response Data:', data)

      // Check if backend has the proposal
      const backendHasProposal = response.ok && data.data && !data.data.ValidateResult

      let proposalData = null

      console.log('Backend has proposal?', backendHasProposal)
      console.log('Checking ValidateResult:', data.data?.ValidateResult)

      if (backendHasProposal) {
        // Backend has the proposal
        proposalData = data.data
        console.log('✅ Loaded from backend:', proposalData)
      } else {
        // Backend doesn't have it, try localStorage
        console.log('❌ Backend does not have proposal, checking localStorage...')
        const proposalKey = `proposal_${proposalNumber.trim()}`
        console.log('Looking for key:', proposalKey)
        
        const savedProposal = localStorage.getItem(proposalKey)
        console.log('localStorage result:', savedProposal ? 'FOUND' : 'NOT FOUND')
        
        if (savedProposal) {
          const parsedProposal = JSON.parse(savedProposal)
          proposalData = parsedProposal
          console.log('✅ Loaded from localStorage:', proposalData)
          toast.info('Loaded from your saved data')
        } else {
          // Not in backend or localStorage
          console.error('❌ Proposal not found in backend or localStorage')
          toast.error('Proposal not found. Please check the proposal number.')
          return
        }
      }

      if (!proposalData) {
        toast.error('No proposal data found')
        return
      }

      console.log('Proposal Data to be mapped:', proposalData)

      // Populate travel details
      console.log('Step 1: Populating travel details...')
      updateTravelDetails({
        travelType: proposalData.TravelType || 'INDIVIDUAL',
        travelDetailList: proposalData.TravelDetailList || [],
        departureDate: proposalData.EffectiveDate ? new Date(proposalData.EffectiveDate) : new Date(),
        returnDate: proposalData.ExpiryDate ? new Date(proposalData.ExpiryDate) : new Date(),
        dateOfBirth: proposalData.PolicyCustomerList?.[0]?.DateOfBirth 
          ? new Date(proposalData.PolicyCustomerList[0].DateOfBirth) 
          : new Date(),
        noOfAdults: proposalData.NoOfAdults || 1,
        noOfChildren: proposalData.NoOfChildren || 0,
        isAnnualMultiTrip: proposalData.TripType === 'ANNUAL',
        agreedToTerms: true,
      })
      console.log('✅ Travel details populated')

      // Populate travelers info from PolicyCustomerList and PolicyRiskList
      console.log('Step 2: Populating travelers info...')
      if (proposalData.PolicyLobList?.[0]?.PolicyRiskList) {
        const travelers = proposalData.PolicyLobList[0].PolicyRiskList.map((risk: any) => ({
          firstName: risk.FirstName || '',
          middleName: risk.MiddleName || '',
          lastName: risk.LastName || '',
          suffix: risk.Suffix || 'No Suffix',
          gender: risk.Gender || 'M',
          email: risk.Email || '',
          mobileNumber: risk.Mobile?.replace('+63', '') || '',
          idType: risk.IdTypeCode || 'PAS',
          idNumber: risk.IdNo || '',
          address: {
            province: risk.AddrProvince || '',
            city: risk.City || '',
            zipCode: risk.PostCode || '',
            line1: risk.AddressLine1 || '',
            line2: risk.AddressLine2 || '',
          },
          dateOfBirth: risk.DateOfBirth ? new Date(risk.DateOfBirth) : new Date(),
          isCovidVaccinated: false,
          is_data_sharing_consent: false,
          hasBeneficiary: false,
          beneficiary: {
            firstName: '',
            middleName: '',
            lastName: '',
            dateOfBirth: null,
            relationship: '',
          },
        }))

        updateTravelersInfo(travelers)
        console.log('✅ Travelers info populated:', travelers.length, 'travelers')
      } else {
        console.warn('⚠️ No PolicyRiskList found')
      }

      // Populate coverage option
      console.log('Step 3: Populating coverage option...')
      updateCoverageOption({
        carrierCode: proposalData.CarrierCode || '',
        selectedPlan: undefined, // Will need to be fetched separately
        selectedAddonBenefits: [],
      })
      console.log('✅ Coverage option populated')

      // Store the API response (wrap localStorage data in same format as API)
      console.log('Step 4: Storing API response...')
      if (backendHasProposal) {
        setApiResponse(data)
      } else {
        // Wrap localStorage data in API response format
        setApiResponse({
          success: true,
          message: 'Loaded from localStorage',
          data: proposalData
        })
      }
      console.log('✅ API response stored')

      // Check if proposal has CarrierPolicyNo (payment completed)
      // CarrierPolicyNo is the actual policy number from the carrier (e.g., "P0093780")
      // PolicyId exists before payment, so we ignore it
      // policy_number is what we save to localStorage after payment
      const hasPolicy = !!(proposalData.CarrierPolicyNo || proposalData.policy_number)
      
      console.log('Step 5: Checking payment status...')
      console.log('Has Policy?', hasPolicy)
      console.log('CarrierPolicyNo (carrier policy):', proposalData.CarrierPolicyNo)
      console.log('policy_number (localStorage):', proposalData.policy_number)
      console.log('PolicyNo (IMO policy):', proposalData.PolicyNo)
      console.log('PolicyId (exists before payment - IGNORED):', proposalData.PolicyId)
      console.log('ProposalNo:', proposalData.ProposalNo)
      console.log('Full proposal data keys:', Object.keys(proposalData))
      
      if (hasPolicy) {
        console.log('✅ Payment completed - showing success screen')
        
        // Set issue quote response for success screen
        // Use 'as any' to bypass type checking since we're only showing success screen
        setIssueQuoteResponse({
          success: true,
          message: 'Policy issued',
          data: {
            ProposalNo: proposalData.ProposalNo,
            CarrierPolicyNo: proposalData.CarrierPolicyNo || proposalData.policy_number,
            PolicyNo: proposalData.PolicyNo,
          } as any
        })
        
        // Set a default payment brand (we don't know which was used, so use a generic one)
        const defaultPaymentBrand: PaymentBrand = {
          value: 'Payment Completed',
          code: 'COMPLETED',
          image: '/ePayment.png',
          is_card: false,
        }
        setSelectedPaymentBrand(defaultPaymentBrand)
        
        // Store loaded data and show success screen
        setLoadedProposalData(proposalData)
        setShowSuccess(true)
        
        toast.success('Proposal loaded successfully!')
      } else {
        console.log('✅ Payment not completed - navigating to Review & Confirmation step')
        
        // Try to get the plan name from custom fields storage
        const customFieldsKey = `travel-insurance-custom-fields`
        let planName = 'Travel Insurance Plan'
        try {
          const storedCustomFields = localStorage.getItem(customFieldsKey)
          if (storedCustomFields) {
            const customFields = JSON.parse(storedCustomFields)
            planName = customFields.PlanName || customFields.CarrierPlanDesc || planName
          }
        } catch (e) {
          console.warn('Could not load custom fields:', e)
        }
        
        // Create a plan object from the proposal data
        // This contains the REAL plan data the customer already selected
        const realPlan = {
          CarrierCode: proposalData.CarrierCode,
          CarrierPlanCode: proposalData.CarrierPlanCode || proposalData.PlanCode,
          CarrierPlanDesc: planName,
          DuePremium: proposalData.DuePremium,
          GrossPremium: proposalData.GrossPremium,
          BeforeVatPremium: proposalData.BeforeVatPremium,
          AnnualPremium: proposalData.AnnualPremium,
          ProductCode: proposalData.ProductCode,
          ProductVersion: proposalData.ProductVersion,
        }
        
        console.log('Real plan from proposal:', realPlan)
        
        // Update all state - these are the REAL values the customer already entered
        setClientRequest({
          id: proposalData.ProposalNo,
          status: 'success'
        })
        
        updateCoverageOption({
          carrierCode: proposalData.CarrierCode || '',
          selectedPlan: realPlan as any,
          selectedAddonBenefits: [],
        })
        
        setStep(3) // Step 4 in UI (0-indexed)
        
        console.log('✅ All state updated with real customer data')
        console.log('✅ Navigating to step 4 (Review & Confirmation)...')
        
        // Set a flag to indicate we're loading from proposal search
        // This prevents the avail page from redirecting before state is persisted
        sessionStorage.setItem('loading-from-proposal', 'true')
        sessionStorage.setItem('proposal-target-step', '3') // Step 4 in UI (0-indexed)
        
        // Navigate immediately - the state is set synchronously
        router.push(`/${agentCode}/products/travel-insurance/avail`)
        toast.success('Proposal loaded! Please review and proceed to payment.')
      }
      
      console.log('✅ All steps completed successfully!')
    } catch (error) {
      console.error('Error loading proposal:', error)
      toast.error('Failed to load proposal. Please check the proposal number and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleSuccessContinue = () => {
    setShowSuccess(false)
    setLoadedProposalData(null)
    router.push(`/${agentCode}/products/travel-insurance`)
  }

  // Show success screen if payment was completed
  if (showSuccess && loadedProposalData) {
    const { issueQuoteResponse, selectedPaymentBrand } = useTravelInsuranceStore.getState()
    const { apiResponse } = useFullQuoteResponseStore.getState()
    
    if (issueQuoteResponse && selectedPaymentBrand) {
      return (
        <div className="container mx-auto py-8">
          <PaymentSuccessInline
            onContinue={handleSuccessContinue}
            paymentMethod={selectedPaymentBrand}
            policyData={issueQuoteResponse.data}
            quoteData={loadedProposalData}
            paymentSubmit={{
              merchant_transaction_id: loadedProposalData.ProposalNo,
              success: true,
            } as any}
          />
        </div>
      )
    }
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
            Enter your proposal number to retrieve your saved quote and continue to payment.
          </p>

          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                id="proposal-search"
                placeholder="Enter proposal number (e.g., PTRAVEL0000000803)"
                value={proposalNumber}
                onChange={(e) => setProposalNumber(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isLoading}
                className="h-12"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isLoading || !proposalNumber.trim()}
              className="h-12 px-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
