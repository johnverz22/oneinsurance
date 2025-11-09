'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CreditCard,
  Smartphone,
  ShoppingCart,
  ArrowRight,
  Shield,
  CheckCircle,
} from 'lucide-react'
import {
  IssueQuoteRequest,
  IssueQuoteResponse,
} from '@/types/travel-insurance/policy-types'
import { useIssueQuoteRequest } from '@/app/data/mutations/issue-quote-request'
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
import { getEcho } from '@/lib/echo'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { toast } from 'sonner'
import { delay } from '@/utils/delay'
import { PageLoader } from '../page-loader'

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
  const [selectedBrand, setSelectedBrand] = useState<PaymentBrand | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<
    'all' | 'cards' | 'digital'
  >('all')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [issueQuoteResponse, setIssuQuoteResponse] =
    useState<IssueQuoteResponse | null>(null)
  const { mutateAsync: issueQuote } = useIssueQuoteRequest()
  const { mutateAsync: submitPayment } = usePaymentSubmit()
  const { mutateAsync: getPaymentAuth } = usePaymentAuth()
  const {
    setPolicyNo,
    nextStep,
    prevStep,
    setPaymentSubmitResponse,
    resetForm,
    paymentSubmitResponse,
    coverageOption,
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

  // Check for transaction completion on component mount
  useEffect(() => {
    const transactionId = searchParams.get('transaction_id')

    if (paymentSubmitResponse) {
      processedTransactionRef.current = transactionId
      // setTransactionId(transactionId)
      handleTransactionCompletion()
    }
  }, [searchParams])

  // Handle transaction completion when returning from redirect
  const handleTransactionCompletion = async () => {
    // Prevent duplicate execution
    if (isProcessing) {
      return
    }

    setIsProcessing(true)
    setIsIssuingQuote(true)
    try {
      // Issue the quote directly since payment was processed externally
      const issueQuoteRequestBody = {
        ProposalNo: apiResponse.data.ProposalNo,
      } satisfies IssueQuoteRequest

      const response = await issueQuote({
        issueQuoteRequest: issueQuoteRequestBody,
      })

      // Store the response and show success dialog
      setIssuQuoteResponse(response)
      setPolicyNo(response!.data.PolicyNo ?? '')

      // Set a generic digital payment brand for the success dialog
      setSelectedBrand({
        value: 'Digital Payment',
        code: 'DIGITAL',
        image: '/payment-brands/digital-payment.png',
        is_card: false,
      })

      setShowSuccessDialog(true)
      setIsIssuingQuote(false)
      popup.show({
        title: 'Payment Successful!',
        description:
          'Your policy details have been confirmed and recorded in our system.',
        note: 'Please note that this serves as a confirmation of coverage only. The official policy document, which is the legally binding proof of coverage, will be issued directly by the insurance carrier and be made available to you shortly.',
        confirmText: 'Done',
        variant: 'success',
      })
    } catch (error) {
      alert(
        'Transaction completion failed. Please contact support.' +
          paymentSubmitResponse?.data.merchant_transaction_id
      )
    } finally {
      setIsProcessing(false)
      // Clean up URL by removing transaction_id parameter
    }
  }

  // Create payment configuration
  const paymentConfig: PaymentRequestConfig = {
    merchantAccountId:
      process.env.NEXT_PUBLIC_MERCHANT_ACCOUNT_ID || 'MER941055560216',
    merchantTransactionId: generateTransactionId(),
    productReferenceId:
      `${apiResponse?.data?.BusinessObjectId}` || 'ITEM-HZ5RHQD9D',
    productDescription: apiResponse?.data?.ProductCode || 'Travel Insurance',
    amount: apiResponse?.data?.GrossPremium || 0,
    currency: 'PHP',
    description:
      coverageOption.selectedPlan?.CarrierPlanDesc ||
      'Travel Insurance Premium Payment',
    callbackUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/${agentCode}/products/travel-insurance/avail`,
    other_reference_1: apiResponse?.data?.ProposalNo,
    other_reference_1_caption: 'proposal',
  }

  const handleBrandSelect = (brand: PaymentBrand) => {
    setSelectedBrand(brand)
  }

  async function handleCardPaymentIssueQuote(
    paymentRequest: PaymentSubmitRequest
  ) {
    const issueQuoteRequestBody = {
      ProposalNo: apiResponse.data.ProposalNo,
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
    setIssuQuoteResponse(response)
    setPolicyNo(response.data.PolicyNo ?? '')
    setShowSuccessDialog(true)

    popup.show({
      title: 'Payment Successful!',
      description:
        'Your policy details have been confirmed and recorded in our system.',
      note: 'Please note that this serves as a confirmation of coverage only. The official policy document, which is the legally binding proof of coverage, will be issued directly by the insurance carrier and be made available to you shortly.',
      confirmText: 'Done',
      variant: 'success',
    })
  }

  const handleCardPaymentSubmit = async (
    paymentRequest: PaymentSubmitRequest
  ) => {
    setIsProcessing(true)
    try {
      const authResponse = await getPaymentAuth()
      if (!authResponse?.access_token) {
        alert('Payment authentication failed. Please try again.')
        return
      }

      const echo = getEcho()
      if (echo.connector.pusher.connection.state !== 'connected') {
        echo.connect()
      }

      const confirmationPromise = new Promise<PaymentConfirmationResponse>(
        (resolve, reject) => {
          const channel = echo.channel('transaction-channel')

          const timeout = setTimeout(() => {
            channel.stopListening('.transaction.message')
            echo.disconnect()
            reject(new Error('Payment confirmation timeout'))
          }, 30000)

          channel.listen(
            '.transaction.message',
            (data: PaymentConfirmationResponse) => {
              clearTimeout(timeout)

              if (data.code === 200 && transactionStatus) {
                resolve(data)
              } else {
                reject(new Error(data.message))
              }
            }
          )
        }
      )

      setShowCardPaymentProcessing(true)

      const paymentResult = await submitPayment({
        data: {
          ...paymentRequest,
          merchant_transaction_id: generateTransactionId(),
        },
        brand_token: authResponse.access_token,
      })

      if (
        !paymentResult?.success ||
        !paymentResult.data.status_code.includes('OK')
      ) {
        const channel = echo.channel('transaction-channel')
        channel.stopListening('.transaction.message')
        echo.disconnect()

        alert(
          paymentResult?.message ||
            'Payment submission failed. Please try again.'
        )
        setShowCardPaymentProcessing(false)
        setTransactionStatus(false)
        return
      }

      const confirmationResponse = await confirmationPromise

      const channel = echo.channel('transaction-channel')
      channel.stopListening('.transaction.message')
      echo.disconnect()

      // Both payment and confirmation successful
      setPaymentSubmitResponse(paymentResult)
      await handleCardPaymentIssueQuote(paymentRequest)
    } catch (error: any) {
      // Cleanup on error
      try {
        const echo = getEcho()
        const channel = echo.channel('transaction-channel')
        channel.stopListening('.transaction.message')
        echo.disconnect()
      } catch (cleanupError) {}

      toast.error(
        error.response?.data?.message ||
          error.message ||
          'Payment failed. Please try again.'
      )
    } finally {
      setIsProcessing(false)
      setShowCardPaymentProcessing(false)
    }
  }

  const handleDigitalPaymentSubmit = async (
    paymentRequest: PaymentSubmitRequest
  ) => {
    setIsProcessing(true)
    try {
      // Step 1: Get payment authentication
      const authResponse = await getPaymentAuth()
      if (!authResponse?.access_token) {
        alert('Payment authentication failed. Please try again.')
        return
      }

      // Step 2: Submit payment
      const paymentResult = await submitPayment({
        data: paymentRequest,
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
  if (showSuccessDialog && selectedBrand && issueQuoteResponse) {
    return (
      <PaymentSuccessInline
        onContinue={handleSuccessDialogContinue}
        paymentMethod={selectedBrand}
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
        <CardHeader className="flex items-center justify-between -space-y-2 border-b pt-6">
          <div className="flex-1">
            <h2 className="text-2xl font-black">Choose Your Payment Method</h2>
            <p className="text-muted-foreground text-sm">
              Select which payment you will use
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-muted-foreground text-xs">Total Amount</p>
            <p className="text-primary text-2xl font-bold">
              ₱
              {apiResponse?.data?.GrossPremium?.toLocaleString('en-PH', {
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
              {/* Payment Method Tabs */}
              <Tabs
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as any)}
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    All Methods
                  </TabsTrigger>
                  <TabsTrigger
                    value="cards"
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Cards
                  </TabsTrigger>
                  <TabsTrigger
                    value="digital"
                    className="flex items-center gap-2"
                  >
                    <Smartphone className="h-4 w-4" />
                    Digital Wallets
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>All Payment Options</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PaymentBrands
                        onBrandSelect={handleBrandSelect}
                        selectedBrand={selectedBrand}
                        className="grid-cols-2 sm:grid-cols-3"
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="cards" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Credit & Debit Cards</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardPaymentBrands
                        onBrandSelect={handleBrandSelect}
                        selectedBrand={selectedBrand}
                        className="grid-cols-2 sm:grid-cols-3"
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="digital" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Digital Wallets & E-Money</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DigitalPaymentBrands
                        onBrandSelect={handleBrandSelect}
                        selectedBrand={selectedBrand}
                        className="grid-cols-2 sm:grid-cols-3"
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Side - Payment Form */}
            <div className="space-y-6">
              {!selectedBrand ? (
                // Placeholder when no payment method is selected
                <Card className="h-full min-h-[500px]">
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

                  {selectedBrand.is_card ? (
                    <CardPaymentForm
                      selectedBrand={selectedBrand}
                      onSubmit={handleCardPaymentSubmit}
                      onBack={() => prevStep()}
                      isLoading={isProcessing}
                      className="max-w-none"
                      paymentConfig={paymentConfig}
                      fullQuoteResponse={apiResponse.data}
                    />
                  ) : (
                    <DigitalPaymentForm
                      selectedBrand={selectedBrand}
                      onSubmit={handleDigitalPaymentSubmit}
                      onBack={() => prevStep()}
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
              Processing your card payment...
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
