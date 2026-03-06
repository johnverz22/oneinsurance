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
      // Load proposal from backend API using ProposalNo
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
      console.log('Load Quote API Response Data:', JSON.stringify(data, null, 2))

      // Check if backend has the proposal
      // The backend response structure should be: { success: true, message: "...", data: {...proposal data...} }
      const actualData = data.data
      
      if (!response.ok || !data.success || !actualData) {
        console.error('❌ Proposal not found - no data returned')
        toast.error('Proposal not found. Please check the proposal number.')
        return
      }

      // Check if we only got ValidateResult (meaning proposal not found)
      const dataKeys = Object.keys(actualData)
      console.log('Response data keys:', dataKeys)
      
      if (dataKeys.length === 1 && dataKeys[0] === 'ValidateResult') {
        console.error('❌ Proposal not found - only ValidateResult returned')
        const validateResult = actualData.ValidateResult
        
        // Check if ValidateResult has error messages
        if (validateResult && validateResult.ErrorMessage && Array.isArray(validateResult.ErrorMessage) && validateResult.ErrorMessage.length > 0) {
          const firstError = validateResult.ErrorMessage[0]
          console.error('Validation error:', firstError)
          toast.error(firstError?.message || 'Invalid proposal. Please check the proposal number.')
        } else {
          toast.error('Proposal not found. Please check the proposal number.')
        }
        return
      }

      const proposalData = actualData
      console.log('✅ Loaded proposal from backend')
      console.log('Proposal data keys:', dataKeys)
      console.log('CarrierCode:', proposalData.CarrierCode)
      console.log('CarrierPlanCode:', proposalData.CarrierPlanCode)
      console.log('ProposalNo:', proposalData.ProposalNo)

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

      // Store the API response
      console.log('Step 4: Storing API response...')
      setApiResponse(data)
      console.log('✅ API response stored')

      // Check if proposal has CarrierPolicyNo (payment completed)
      // CarrierPolicyNo is the actual policy number from the carrier (e.g., "P0093780")
      // If CarrierPolicyNo exists, payment is complete and policy is issued
      const hasPolicy = !!proposalData.CarrierPolicyNo
      
      console.log('Step 5: Checking payment status...')
      console.log('Has Policy?', hasPolicy)
      console.log('CarrierPolicyNo (carrier policy):', proposalData.CarrierPolicyNo)
      console.log('PolicyNo (IMO policy):', proposalData.PolicyNo)
      console.log('ProposalNo:', proposalData.ProposalNo)
      
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
        
        // Get plan name from proposal data
        const planName = proposalData.ProductName || 'Travel Insurance'
        
        // Extract benefits from PolicyCoverageList if available
        const mainBenefits: any[] = []
        const addonBenefits: any[] = []
        
        // Try to extract benefits from the first risk's coverage list
        const firstRisk = proposalData.PolicyLobList?.[0]?.PolicyRiskList?.[0]
        if (firstRisk?.PolicyCoverageList) {
          firstRisk.PolicyCoverageList.forEach((coverage: any) => {
            const benefit = {
              BenefitCode: coverage.ProductElementCode || '',
              BenefitDesc: coverage.CoverageName || '',
              BenefitType: 'MAIN',
              CoverageName: coverage.CoverageName || '',
              DefaultLimitDesc: '',
              DisplaySeqNo: coverage.SequenceNumber?.toString() || '0',
              LimitModeDesc: '',
              ParentBenefit: null,
              Silimit: '0',
              SubCoverageName: '',
            }
            mainBenefits.push(benefit)
          })
        }
        
        // Create a plan object from the proposal data
        // This contains the REAL plan data the customer already selected
        const realPlan = {
          CarrierCode: proposalData.CarrierCode,
          CarrierPlanCode: proposalData.CarrierPlanCode || proposalData.PlanCode,
          CarrierPlanDesc: planName,
          CarrierProductCode: proposalData.CarrierProductCode || '',
          CarrierProductName: proposalData.ProductName || 'Travel Insurance',
          DuePremium: Number(proposalData.DuePremium) || 0,
          GrossPremium: Number(proposalData.GrossPremium) || 0,
          BeforeVatPremium: Number(proposalData.BeforeVatPremium) || 0,
          AnnualPremium: Number(proposalData.AnnualPremium) || 0,
          ProductCode: proposalData.ProductCode,
          ProductVersion: proposalData.ProductVersion,
          MainBenefits: mainBenefits,
          AddonBenefits: addonBenefits,
          LGTAmount: Number(proposalData.LGT) || 0,
          DiscountAmount: null,
          PremiumTaxAmt: 0,
          StampDuty: 0,
          SumInsured: proposalData.SumInsured?.toString() || null,
          TaxAmount: 0,
          VatAmount: null,
        }
        
        console.log('Real plan from proposal:', realPlan)
        console.log('Extracted benefits:', { mainBenefits: mainBenefits.length, addonBenefits: addonBenefits.length })
        console.log('Plan validation:', {
          hasCarrierCode: !!realPlan.CarrierCode,
          hasCarrierPlanCode: !!realPlan.CarrierPlanCode,
          hasDuePremium: !!realPlan.DuePremium,
          hasMainBenefits: mainBenefits.length > 0
        })
        
        // Store the full API response for step 4
        setApiResponse({
          success: true,
          message: 'Proposal loaded',
          data: proposalData
        })
        
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
        
        console.log('✅ All state updated with real customer data')
        
        // Set a flag to indicate we're loading from proposal search
        // This prevents the avail page from redirecting before state is persisted
        sessionStorage.setItem('loading-from-proposal', 'true')
        sessionStorage.setItem('proposal-target-step', '3') // Step 4 in UI (0-indexed)
        
        // Wait for Zustand persist middleware to write to sessionStorage
        // Use a longer delay to ensure all state is persisted
        await new Promise(resolve => setTimeout(resolve, 500))
        
        console.log('✅ Navigating to step 4 (Review & Confirmation)...')
        
        // Navigate first, then set step on the avail page
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
            Enter your proposal number to retrieve your saved quote and continue to payment. If payment is already completed, you'll see your policy details and confirmation.
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
              className="from-primary to-accent h-12 rounded-full bg-gradient-to-r px-6 font-semibold dark:text-white"
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
