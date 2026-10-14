'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CreditCard,
  Smartphone,
  ShoppingCart,
  ArrowLeft,
  Shield,
  Loader2,
} from 'lucide-react'
import { useCtplInsuranceStateStore } from '@/store/ctpl-store'
import { CardPaymentForm } from '@/components/payment/card-payment-form'
import { DigitalPaymentForm } from '@/components/payment/digital-payment-form'
import PaymentBrands, {
  CardPaymentBrands,
  DigitalPaymentBrands,
} from '@/components/payment/payment-brands'
import { PaymentBrand, PaymentSubmitRequest } from '@/types/payment'
import {
  generateTransactionId,
  type PaymentRequestConfig,
} from '@/utils/payment-mappers'
import { usePaymentAuth, usePaymentSubmit } from '@/app/data/mutations/payment'
import { usePaymentPolling } from '@/hooks/use-payment-polling'
import { popup } from '@/store/use-popup-store'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageLoader } from '@/components/page-loader'
import {
  saveProposalNumber,
  getProposalNumber,
  clearProposalNumber,
} from '@/utils/payment-storage'
import { delay } from '@/utils/delay'

// Utility function to remove transaction_id from URL
const removeTransactionIdFromUrl = () => {
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    url.searchParams.delete('transaction_id')
    window.history.replaceState({}, '', url.toString())
  }
}

export default function CtplPaymentStep() {
  const {
    personalInfo,
    decreaseStep,
    insuranceType,
    fullQuoteResponse,
    clientRequestId,
    coverageOption,
  } = useCtplInsuranceStateStore()

  const params = useParams()
  const router = useRouter()
  const agentCode = params['agent-code'] as string

  const [paymentMethod, setPaymentMethod] = useState<'all' | 'cards' | 'digital'>('all')
  const [selectedPaymentBrand, setSelectedPaymentBrand] = useState<PaymentBrand | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showCardPaymentProcessing, setShowCardPaymentProcessing] = useState(false)
  const [isIssuingQuote, setIsIssuingQuote] = useState(false)
  const [paymentProviderMessage, setPaymentProviderMessage] = useState<string | null>(null)
  const isProcessingQuoteRef = useRef(false)

  const { mutateAsync: submitPayment } = usePaymentSubmit()
  const { mutateAsync: getPaymentAuth } = usePaymentAuth()

  const premium = fullQuoteResponse?.TotalPremium || fullQuoteResponse?.GrossPremium || 0
  const proposalNumber = fullQuoteResponse?.ProposalNo || ''

  // Payment success handler
  async function handlePaymentSuccess(data: any) {
    if (isProcessingQuoteRef.current) {
      console.log('Already processing quote, skipping duplicate call')
      return
    }

    isProcessingQuoteRef.current = true

    try {
      clearProposalNumber()
      setShowCardPaymentProcessing(false)
      setIsIssuingQuote(true)

      // Determine API endpoint based on insurance type
      const endpoint = insuranceType === 'CTPL'
        ? '/api/motor-insurance/ctpl/issue-quote'
        : '/api/motor-insurance/comprehensive/issue-quote'

      // Build issue-quote payload — Postman: { ProposalNo, CustomField: { PlanName } }
      const payload = {
        ProposalNo: proposalNumber,
        CustomField: {
          PlanName: (coverageOption.selectedPlan as any)?.CarrierProductName || (coverageOption.selectedPlan as any)?.CarrierPlanDesc || 'CTPL Plan',
        },
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Issue quote failed:', errorData)
        router.push(`/${agentCode}/payment-error`)
        return
      }

      const issueData = await response.json()
      console.log('Issue quote response:', issueData)

      setIsIssuingQuote(false)
      popup.show({
        title: 'Payment Successful!',
        description: 'Your policy details have been confirmed and recorded in our system.',
        note: 'Please note that this serves as a cover note only. The official policy document, which is the legally binding proof of coverage, will be issued directly by the insurance carrier and be made available to you shortly.',
        confirmText: 'Done',
        variant: 'success',
        onConfirm: () => router.push(`/${agentCode}/products/motor-insurance/invoice`),
      })
    } catch (error: any) {
      console.error('Issue quote error:', error)
      const rawMessage = error.message || ''
      const displayMessage =
        rawMessage.toLowerCase() === 'successful'
          ? 'Your payment was received but policy issuance is pending. Please contact support with your proposal number.'
          : rawMessage || 'Payment confirmation failed. Please contact support.'
      toast.error(displayMessage)
      setIsIssuingQuote(false)
      isProcessingQuoteRef.current = false

      if (proposalNumber) {
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

    if (proposalNumber) {
      router.push(`/${agentCode}/payment-error`)
    } else {
      const rawMsg = error.message || ''
      const displayMsg =
        rawMsg.toLowerCase() === 'successful'
          ? 'Your payment was received but policy issuance is pending. Please contact support with your proposal number.'
          : rawMsg || 'Payment failed. Please contact support.'
      toast.error(displayMsg)
    }
  }

  // Payment timeout handler
  function handlePaymentTimeout() {
    setShowCardPaymentProcessing(false)
    setIsProcessing(false)

    if (proposalNumber) {
      router.push(`/${agentCode}/payment-error`)
    } else {
      clearProposalNumber()
      toast.error('Payment verification timed out. Please contact support.')
    }
  }

  // Polling hook
  const { startPolling } = usePaymentPolling({
    proposalNumber: proposalNumber,
    onSuccess: handlePaymentSuccess,
    onError: handlePaymentError,
    onTimeout: handlePaymentTimeout,
  })

  // Check for proposal number on component mount (e-wallet return)
  useEffect(() => {
    const storedProposalNumber = getProposalNumber()

    // Only auto-poll if stored proposal matches current booking
    if (storedProposalNumber && storedProposalNumber === proposalNumber && !isProcessing) {
      removeTransactionIdFromUrl()
      setIsProcessing(true)
      setShowCardPaymentProcessing(true)
      startPolling()
    } else if (storedProposalNumber && storedProposalNumber !== proposalNumber) {
      clearProposalNumber()
    }
  }, [])

  // Create payment configuration
  // merchant_account_id and service_code are injected server-side by the BFF
  const paymentConfig: PaymentRequestConfig = {
    merchantTransactionId: generateTransactionId(),
    productReferenceId: `${fullQuoteResponse?.BusinessObjectId}` || 'MOTOR-INSURANCE',
    productDescription: fullQuoteResponse?.ProductCode || 'Motor Insurance',
    amount: premium,
    currency: 'PHP',
    successUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/${agentCode}/products/motor-insurance/avail`,
    failureUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/${agentCode}/products/motor-insurance/avail`,
  }

  const handleBrandSelect = (brand: PaymentBrand) => {
    setSelectedPaymentBrand(brand)
    setTimeout(() => {
      document.getElementById('motor-payment-form')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleCardPaymentSubmit = async (paymentRequest: PaymentSubmitRequest) => {
    setIsProcessing(true)
    try {
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

      if (!paymentResult?.success || paymentResult.data.payment_status === 'REJECTED') {
        alert(paymentResult?.message || 'Payment submission failed. Please try again.')
        setShowCardPaymentProcessing(false)
        return
      }

      // Start polling for payment verification
      startPolling()
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.message || 'Payment failed. Please try again.'
      )
      setShowCardPaymentProcessing(false)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDigitalPaymentSubmit = async (paymentRequest: PaymentSubmitRequest) => {
    setIsProcessing(true)
    try {
      const paymentId = generateTransactionId()
      localStorage.setItem('payment_transaction_id', paymentId)

      const authResponse = await getPaymentAuth()
      if (!authResponse?.access_token) {
        alert('Payment authentication failed. Please try again.')
        return
      }

      const paymentResult = await submitPayment({
        data: {
          ...paymentRequest,
          merchant_transaction_id: paymentId,
        },
        brand_token: authResponse.access_token,
      })

      if (!paymentResult?.success || paymentResult.data.payment_status === 'REJECTED') {
        alert(paymentResult.message || 'Payment submission failed. Please try again.')
        return
      }

      const redirectUrl = paymentResult.data.payment_url
      if (redirectUrl) {
        saveProposalNumber(proposalNumber)
        alert("You will be redirected to payment wall. Please don't close this tab.")
        window.location.href = redirectUrl
        return
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Payment failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Convert fullQuoteResponse to match FullQuoteResponse['data'] structure
  const fullQuoteData = {
    ...fullQuoteResponse,
    PolicyCustomerList: fullQuoteResponse?.PolicyCustomerList || [
      {
        FirstName: personalInfo.firstName || '',
        LastName: personalInfo.lastName || '',
        MiddleName: personalInfo.middleName || '',
        Email: personalInfo.email || '',
        Mobile: personalInfo.mobileNumber || '',
        AddressLine1: personalInfo.addressLine1 || '',
        AddressLine2: personalInfo.addressLine2 || '',
        City: personalInfo.city || '',
        AddrProvince: personalInfo.province || '',
        PostCode: personalInfo.zipCode || '',
      },
    ],
  } as any

  if (isIssuingQuote) {
    return <PageLoader />
  }

  return (
    <>
      <Card className="bg-background overflow-hidden p-0 pb-8 shadow-none">
        <CardHeader className="flex flex-col gap-2 border-b pt-6 sm:flex-row sm:items-center sm:justify-between sm:-space-y-2">
          <div className="flex-1">
            <h2 className="from-primary to-primary/80 bg-gradient-to-r bg-clip-text text-lg sm:text-2xl font-black text-transparent">
              Choose Your Payment Method
            </h2>
          </div>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
            <p className="text-primary text-lg sm:text-2xl font-black">
              ₱
              {premium.toLocaleString('en-PH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left Side - Payment Method Selection */}
            <div className="space-y-6">
              {/* Mobile: Show compact selected brand with Change button */}
              {selectedPaymentBrand && (
                <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3 lg:hidden">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-14 items-center justify-center rounded border bg-white p-1">
                      <img src={selectedPaymentBrand.image} alt={selectedPaymentBrand.value} className="h-full w-full object-contain" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{selectedPaymentBrand.value}</p>
                      <p className="text-xs text-muted-foreground">{selectedPaymentBrand.is_card ? 'Card' : 'Digital Wallet'}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-full text-xs" onClick={() => setSelectedPaymentBrand(null)}>
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
                  <TabsTrigger value="cards" className="flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4" />
                    Cards
                  </TabsTrigger>
                  <TabsTrigger value="digital" className="flex items-center gap-1.5">
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
            <div id="motor-payment-form" className="space-y-3 lg:space-y-6">
              {!selectedPaymentBrand ? (
                <Card className="h-full min-h-[500px] shadow-none">
                  <CardContent className="flex h-full items-center justify-center p-8">
                    <div className="space-y-4 text-center">
                      <div className="bg-primary/10 dark:bg-primary/50 mx-auto flex h-24 w-24 items-center justify-center rounded-full">
                        <Shield className="text-accent h-12 w-12" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-primary dark:text-accent text-xl font-semibold">
                          Select Payment Method
                        </h3>
                        <p className="text-muted-foreground max-w-sm">
                          Choose your preferred payment method from the options on the left to
                          continue
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
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
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                      fullQuoteResponse={fullQuoteData}
                    />
                  ) : (
                    <DigitalPaymentForm
                      selectedBrand={selectedPaymentBrand}
                      onSubmit={handleDigitalPaymentSubmit}
                      isLoading={isProcessing}
                      className="max-w-none"
                      paymentConfig={paymentConfig}
                      fullQuoteResponse={fullQuoteData}
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
          onClick={decreaseStep}
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
        <Loader2 className="h-14 w-14 animate-spin text-primary mb-2" />
        {message ? (
          <h2 className="text-lg font-semibold text-foreground">{message}</h2>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-foreground">Processing your payment...</h2>
            <p className="max-w-xs text-center text-muted-foreground">
              Please wait while we process your payment. Do not close or refresh this window.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
