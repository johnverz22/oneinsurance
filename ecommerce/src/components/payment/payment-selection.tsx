'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  PaymentBrand,
  PaymentConfirmationResponse,
  PaymentSubmitRequest,
  PaymentSubmitResponse,
} from '@/types/payment'
import PaymentBrands, {
  CardPaymentBrands,
  DigitalPaymentBrands,
} from '@/components/payment/payment-brands'
import { CardPaymentForm } from './card-payment-form'
import { DigitalPaymentForm } from './digital-payment-form'
import { PaymentSuccessInline } from './payment-success-inline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CreditCard,
  Smartphone,
  ShoppingCart,
  ArrowRight,
  Shield,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react'
import {
  IssueQuoteRequest,
  IssueQuoteResponse,
} from '@/types/travel-insurance/policy-types'
import { useIssueQuoteRequest } from '@/app/data/mutations/issue-quote-request'
import { getCustomFields, validateCustomFields, storePaymentBrand } from '@/utils/custom-fields-storage'
import { usePaymentAuth, usePaymentSubmit } from '@/app/data/mutations/payment'
import {
  useFullQuoteResponseStore,
  useTravelInsuranceStore,
} from '@/store/travel-insurance-store'
import {
  generateTransactionId,
  type PaymentRequestConfig,
} from '@/utils/payment-mappers'
import { useAgentCodeStore } from '@/store/agent-code-store'
import { popup } from '@/store/use-popup-store'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { toast } from 'sonner'
import { delay } from '@/utils/delay'
import { PageLoader } from '../page-loader'
import { usePaymentPolling } from '@/hooks/use-payment-polling'
import {
  saveProposalNumber,
  getProposalNumber,
  clearProposalNumber,
} from '@/utils/payment-storage'

// Utility function to remove transaction_id from URL
const removeTransactionIdFromUrl = () => {
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    url.searchParams.delete('transaction_id')
    window.history.replaceState({}, '', url.toString())
  }
}

interface PaymentSelectionProps {
  onProceedPayment: () => void
}

export default function PaymentSelection() {
  const [paymentMethod, setPaymentMethod] = useState<
    'all' | 'cards' | 'digital'
  >('all')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const { mutateAsync: issueQuote } = useIssueQuoteRequest()
  const { mutateAsync: submitPayment } = usePaymentSubmit()
  const { mutateAsync: getPaymentAuth } = usePaymentAuth()
  const router = useRouter()
  const {
    setPolicyNo,
    nextStep,
    prevStep,
    setPaymentSubmitResponse,
    resetForm,
    setIssueQuoteResponse,
    setSelectedPaymentBrand,
    setPaymentBillingDetails,
    paymentSubmitResponse,
    coverageOption,
    issueQuoteResponse,
    selectedPaymentBrand,
  } = useTravelInsuranceStore()
  const { agentCode } = useAgentCodeStore()
  const { apiResponse } = useFullQuoteResponseStore()
  const [transactionId, setTransactionId] = useState('')
  const processedTransactionRef = useRef<string | null>(null)
  const searchParams = useSearchParams()
  const [paymentProviderMessage, setPaymentProviderMessage] = useState<
    string | null
  >(null)
  const [showCardPaymentProcessing, setShowCardPaymentProcessing] =
    useState(false)
  const [isIssuingQuote, setIsIssuingQuote] = useState(false)
  const [transactionStatus, setTransactionStatus] = useState(true)
  const isProcessingQuoteRef = useRef(false) // Guard against duplicate calls

  // Polling hook
  const { startPolling, stopPolling } = usePaymentPolling({
    proposalNumber: apiResponse?.data?.ProposalNo || '',
    onSuccess: handlePaymentSuccess,
    onError: handlePaymentError,
    onTimeout: handlePaymentTimeout,
  })

  // Check for proposal number on component mount (e-wallet return)
  useEffect(() => {
    const proposalNumber = getProposalNumber()

    if (proposalNumber && !isProcessing) {
      // Remove transaction_id from URL if present
      removeTransactionIdFromUrl()
      // Start polling
      setIsProcessing(true)
      setShowCardPaymentProcessing(true)
      startPolling()
    }
  }, [])

  // Payment success handler
  async function handlePaymentSuccess(data: any) {
    // Guard against duplicate calls
    if (isProcessingQuoteRef.current) {
      console.log('Already processing quote, skipping duplicate call')
      return
    }

    isProcessingQuoteRef.current = true

    try {
      // Clear localStorage
      clearProposalNumber()
      setShowCardPaymentProcessing(false)
      setIsIssuingQuote(true)

      // Issue the quote
      const customFields = getCustomFields()
      const isValidCustomFields = validateCustomFields(customFields)
      
      console.log('Issue Quote - CustomFields retrieved:', customFields)
      console.log('Issue Quote - CustomFields validation:', isValidCustomFields)
      
      const issueQuoteRequestBody = {
        ProposalNo: data.proposal_number,
        CustomField: customFields, // Use CustomField (singular) as per API specification
      } satisfies IssueQuoteRequest

      const response = await issueQuote({
        issueQuoteRequest: issueQuoteRequestBody,
      })

      // Store the response and show success dialog
      setIssueQuoteResponse(response)
      setPolicyNo(response?.data?.PolicyNo ?? '')

      // Set a generic digital payment brand for the success dialog
      setSelectedPaymentBrand({
        value: 'Digital Payment',
        code: 'DIGITAL',
        image: '/payment-brands/digital-payment.png',
        is_card: false,
      })

      setIsIssuingQuote(false)
      popup.show({
        title: 'Payment Successful!',
        description: 'Your policy details have been confirmed and recorded in our system.',
        note: 'Please note that this serves as a cover note only. The official policy document, which is the legally binding proof of coverage, will be issued directly by the insurance carrier and be made available to you shortly.',
        confirmText: 'Done',
        variant: 'success',
        onConfirm: () => setShowSuccessDialog(true),
      })
    } catch (error: any) {
      console.error('Issue quote error:', error)
      const rawMessage = error.message || ''
      const displayMessage = rawMessage.toLowerCase() === 'successful'
        ? 'Your payment was received but policy issuance is pending. Please contact support with your proposal number.'
        : rawMessage || 'Payment confirmation failed. Please contact support.'
      toast.error(displayMessage)
      setIsIssuingQuote(false)
      isProcessingQuoteRef.current = false
      
      // Redirect to error page if payment was successful but quote issuance failed
      if (apiResponse?.data?.ProposalNo) {
        router.push(`/${agentCode}/payment-error`)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // Payment error handler
  function handlePaymentError(error: Error) {
    clearProposalNumber()
    setShowCardPaymentProcessing(false)
    setIsProcessing(false)
    
    // If we have a proposal number, payment was accepted but something went wrong
    if (apiResponse?.data?.ProposalNo) {
      router.push(`/${agentCode}/payment-error`)
    } else {
      const rawMsg = error.message || ''
      const displayMsg = rawMsg.toLowerCase() === 'successful'
        ? 'Your payment was received but policy issuance is pending. Please contact support with your proposal number.'
        : rawMsg || 'Payment failed. Please contact support.'
      toast.error(displayMsg)
    }
  }

  // Payment timeout handler
  function handlePaymentTimeout() {
    setShowCardPaymentProcessing(false)
    setIsProcessing(false)
    
    // If we have a proposal number, redirect to error page
    if (apiResponse?.data?.ProposalNo) {
      router.push(`/${agentCode}/payment-error`)
    } else {
      clearProposalNumber()
      toast.error(
        'Payment verification timed out. Please contact support.'
      )
    }
  }

  // Handle transaction completion when returning from redirect
  // Note: This is now handled by the useEffect on mount that checks for proposal number
  const handleTransactionCompletion = async () => {
    // This function is kept for backward compatibility but the actual
    // payment verification is now handled by polling in the mount useEffect
    return
  }

  // Create payment configuration
  const paymentConfig: PaymentRequestConfig = {
    merchantAccountId:
      process.env.NEXT_PUBLIC_MERCHANT_ACCOUNT_ID || 'MER941055560216',
    merchantTransactionId: generateTransactionId(),
    productReferenceId:
      `${apiResponse?.data?.BusinessObjectId}` || 'ITEM-HZ5RHQD9D',
    productDescription: apiResponse?.data?.ProductCode || 'Travel Insurance',
    amount: apiResponse?.data?.DuePremium || 0,
    currency: 'PHP',
    description:
      coverageOption.selectedPlan?.CarrierPlanDesc ||
      'Travel Insurance Premium Payment',
    callbackUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/${agentCode}/products/travel-insurance/avail`,
    other_reference_1: apiResponse?.data?.ProposalNo,
    other_reference_1_caption: 'proposal',
  }


  const handleBrandSelect = (brand: PaymentBrand) => {
    setSelectedPaymentBrand(brand)
    // Store payment brand in localStorage dynamically
    storePaymentBrand(brand.value)
    // On mobile, scroll to payment form after brand selection
    setTimeout(() => {
      document.getElementById('payment-form-section')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  async function handleCardPaymentIssueQuote(
    paymentRequest: PaymentSubmitRequest
  ) {
    const customFields = getCustomFields()
    const isValidCustomFields = validateCustomFields(customFields)
    
    console.log('Card Payment Issue Quote - CustomFields retrieved:', customFields)
    console.log('Card Payment Issue Quote - CustomFields validation:', isValidCustomFields)
    
    const issueQuoteRequestBody = {
      ProposalNo: apiResponse.data.ProposalNo,
      CustomField: customFields, // Use CustomField (singular) as per API specification
    } satisfies IssueQuoteRequest

    const response = await issueQuote({
      issueQuoteRequest: issueQuoteRequestBody,
    })

    if (!response?.success) {
      alert(
        `Payment processed but quote issuance failed. Please contact support. Remember your Transaction ID: ${paymentRequest.merchant_transaction_id}`
      )
      return
    }

    await delay(3000)

    setShowCardPaymentProcessing(false)

    // Store the response and show success dialog
    setIssueQuoteResponse(response)
    setPolicyNo(response.data?.PolicyNo ?? '')
    popup.show({
      title: 'Payment Successful!',
      description: 'Your policy details have been confirmed and recorded in our system.',
      note: 'Please note that this serves as a cover note only. The official policy document, which is the legally binding proof of coverage, will be issued directly by the insurance carrier and be made available to you shortly.',
      confirmText: 'Done',
      variant: 'success',
      onConfirm: () => setShowSuccessDialog(true),
    })
  }

  const handleCardPaymentSubmit = async (
    paymentRequest: PaymentSubmitRequest
  ) => {
    setIsProcessing(true)
    try {
      setPaymentBillingDetails(paymentRequest)
      
      // Generate and store payment ID in localStorage before submission
      const paymentId = generateTransactionId()
      localStorage.setItem('payment_transaction_id', paymentId)
      
      const authResponse = await getPaymentAuth()
      if (!authResponse?.access_token) {
        alert('Payment authentication failed. Please try again.')
        return
      }

      setShowCardPaymentProcessing(true)

      const paymentResult = await submitPayment({
        data: {
          ...paymentRequest,
          merchant_transaction_id: paymentId,
        },
        brand_token: authResponse.access_token,
      })

      if (
        !paymentResult?.success ||
        !paymentResult.data.status_code.includes('OK')
      ) {
        alert(
          paymentResult?.message ||
            'Payment submission failed. Please try again.'
        )
        setShowCardPaymentProcessing(false)
        setTransactionStatus(false)
        return
      }

      // Both payment submission successful, start polling
      setPaymentSubmitResponse(paymentResult)
      startPolling()
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          'Payment failed. Please try again.'
      )
      setShowCardPaymentProcessing(false)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDigitalPaymentSubmit = async (
    paymentRequest: PaymentSubmitRequest
  ) => {
    setIsProcessing(true)
    try {
      setPaymentBillingDetails(paymentRequest)
      
      // Generate and store payment ID in localStorage before submission
      const paymentId = generateTransactionId()
      localStorage.setItem('payment_transaction_id', paymentId)
      
      // Step 1: Get payment authentication
      const authResponse = await getPaymentAuth()
      if (!authResponse?.access_token) {
        alert('Payment authentication failed. Please try again.')
        return
      }

      // Step 2: Submit payment
      const paymentResult = await submitPayment({
        data: {
          ...paymentRequest,
          merchant_transaction_id: paymentId,
        },
        brand_token: authResponse.access_token,
      })

      if (
        !paymentResult?.success ||
        !paymentResult.data.status_code.includes('OK')
      ) {
        alert(
          paymentResult.message ||
            'Payment submission failed. Please try again.'
        )
        return
      }

      // store payment response in the store
      setPaymentSubmitResponse(paymentResult)

      const redirectUrl = paymentResult.data.redirect_url
      if (redirectUrl) {
        // Save proposal number to localStorage before redirect
        saveProposalNumber(apiResponse.data.ProposalNo)

        alert(
          "You will be redirected to payment wall. Please don't close this tab."
        )
        // Redirect to external payment page in the same tab
        window.location.href = redirectUrl
        return
      }
    } catch (error: any) {
      alert(
        error.response?.data?.message || 'Payment failed. Please try again.'
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSuccessDialogContinue = () => {
    setShowSuccessDialog(false)
    resetForm()
    window.location.href = `/${agentCode}/products/travel-insurance`
  }

  // If showing success, render the success content instead of payment selection
  if (showSuccessDialog && selectedPaymentBrand && issueQuoteResponse) {
    return (
      <PaymentSuccessInline
        onContinue={handleSuccessDialogContinue}
        paymentMethod={selectedPaymentBrand}
        policyData={issueQuoteResponse.data}
        quoteData={apiResponse.data}
        paymentSubmit={
          paymentSubmitResponse?.data ||
          ({
            merchant_transaction_id: transactionId,
            success: true,
          } as any)
        }
      />
    )
  }

  if (isIssuingQuote) {
    return <PageLoader />
  }

  return (
    <>
      <Card className="bg-background overflow-hidden p-0 pb-8 shadow-none">
        <CardHeader className="flex flex-col gap-2 border-b pt-6 sm:flex-row sm:items-center sm:justify-between sm:-space-y-2">
          <div className="flex-1">
            <h2 className="from-primary to-primary/80 bg-gradient-to-r bg-clip-text text-2xl font-black text-transparent">
              Choose Your Payment Method
            </h2>
          </div>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <p className="text-sm font-medium text-gray-400">Total Amount</p>
            <p className="text-primary text-2xl font-black">
              ₱
              {apiResponse?.data?.DuePremium?.toLocaleString('en-PH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) || '0.00'}
            </p>
          </div>
        </CardHeader>

        <CardContent>
          {/* Main Content - Side by Side Layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left Side - Payment Method Selection */}
            <div className="space-y-6">
              {/* Mobile: Show compact selected brand with Change button when brand is selected */}
              {selectedPaymentBrand && (
                <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3 lg:hidden">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-14 items-center justify-center rounded border bg-white p-1">
                      <img
                        src={selectedPaymentBrand.image}
                        alt={selectedPaymentBrand.value}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{selectedPaymentBrand.value}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedPaymentBrand.is_card ? 'Card' : 'Digital Wallet'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs"
                    onClick={() => setSelectedPaymentBrand(null)}
                  >
                    Change
                  </Button>
                </div>
              )}

              {/* Payment Method Tabs — hidden on mobile when brand is selected */}
              <div className={selectedPaymentBrand ? 'hidden lg:block' : ''}>
              <Tabs
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as any)}
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all" className="flex items-center gap-1.5">
                    <ShoppingCart className="h-4 w-4" />
                    <span className="sm:hidden">All</span>
                    <span className="hidden sm:inline">All Methods</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="cards"
                    className="flex items-center gap-1.5"
                  >
                    <CreditCard className="h-4 w-4" />
                    Cards
                  </TabsTrigger>
                  <TabsTrigger
                    value="digital"
                    className="flex items-center gap-1.5"
                  >
                    <Smartphone className="h-4 w-4" />
                    <span className="sm:hidden">Wallets</span>
                    <span className="hidden sm:inline">Digital Wallets</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                      <PaymentBrands
                        onBrandSelect={handleBrandSelect}
                        selectedBrand={selectedPaymentBrand}
                      />
                </TabsContent>

                <TabsContent value="cards" className="mt-6">
                      <CardPaymentBrands
                        onBrandSelect={handleBrandSelect}
                        selectedBrand={selectedPaymentBrand}
                      />
                </TabsContent>

                <TabsContent value="digital" className="mt-6">
                      <DigitalPaymentBrands
                        onBrandSelect={handleBrandSelect}
                        selectedBrand={selectedPaymentBrand}
                      />
                </TabsContent>
              </Tabs>
              </div>
            </div>

            {/* Right Side - Payment Form */}
            <div id="payment-form-section" className="space-y-3 lg:space-y-6">
              {!selectedPaymentBrand ? (
                // Placeholder when no payment method is selected
                <Card className="h-full min-h-[500px] shadow-none">
                  <CardContent className="flex h-full items-center justify-center p-8">
                    <div className="space-y-4 text-center">
                      <div className="bg-primary/10 dark:bg-primary/50 mx-auto flex h-24 w-24 items-center justify-center rounded-full">
                        <ArrowRight className="text-accent h-12 w-12 rotate-180" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-primary dark:text-accent text-xl font-semibold">
                          Select Payment Method
                        </h3>
                        <p className="text-muted-foreground max-w-sm">
                          Choose your preferred payment method from the options
                          on the left to continue
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-4 w-4" />
                          <span>Cards</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Smartphone className="h-4 w-4" />
                          <span>Digital Wallets</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                // Payment Form based on selected brand
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Shield className="h-4 w-4" />
                    <span>Complete your payment securely</span>
                  </div>

                  {selectedPaymentBrand.is_card ? (
                    <CardPaymentForm
                      selectedBrand={selectedPaymentBrand}
                      onSubmit={handleCardPaymentSubmit}
                      isLoading={isProcessing}
                      className="max-w-none"
                      paymentConfig={paymentConfig}
                      fullQuoteResponse={apiResponse.data}
                    />
                  ) : (
                    <DigitalPaymentForm
                      selectedBrand={selectedPaymentBrand}
                      onSubmit={handleDigitalPaymentSubmit}
                      isLoading={isProcessing}
                      className="max-w-none"
                      paymentConfig={paymentConfig}
                      fullQuoteResponse={apiResponse.data}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Back Button */}
      <div className="mt-6 flex justify-center lg:justify-start">
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="rounded-full px-12 font-semibold"
          onClick={prevStep}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Review
        </Button>
      </div>

      <CardPaymentProcessingDialog
        isOpen={showCardPaymentProcessing}
        message={paymentProviderMessage}
      />
    </>
  )
}

function CardPaymentProcessingDialog({
  isOpen,
  message,
}: {
  isOpen: boolean
  message: string | null
}) {
  return (
    <Dialog open={isOpen}>
      <DialogHeader>
        <DialogTitle></DialogTitle>
      </DialogHeader>
      <DialogContent className="flex flex-col items-center justify-center gap-4 py-10">
        <svg width="60" height="60" viewBox="0 0 50 50" className="mb-2">
          <circle
            cx="25"
            cy="25"
            r="20"
            stroke="#0070f3"
            strokeWidth="5"
            fill="none"
            strokeDasharray="31.4 31.4"
            strokeDashoffset="0"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 25 25"
              to="360 25 25"
              dur="1s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
        {message ? (
          <h2 className="text-lg font-semibold text-gray-800">{message}</h2>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-gray-800">
              Processing your payment...
            </h2>
            <p className="max-w-xs text-center text-gray-500">
              Please wait while we process your payment. Do not close or refresh
              this window.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
