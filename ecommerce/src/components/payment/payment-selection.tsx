'use client'

/**
 * PaymentSelection — DLT Hosted Checkout v4.0
 *
 * Flow:
 *  1. On mount: mint merchant_transaction_id server-side (GET /api/payment/transaction-id).
 *  2. User selects a brand (card or e-wallet — all go through the same path).
 *  3. User fills billing details and clicks Continue.
 *  4. POST /api/payment/submit → receive payment_url.
 *  5. Redirect browser to payment_url (DLT-hosted page handles everything).
 *  6. DLT redirects back to this page with ?status=success|failure&txn=<id>.
 *  7. On mount (if ?txn present): POST /api/payment/sync → get authoritative status.
 *  8. On PAID: issue the quote → show success screen.
 */

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PaymentBrand } from '@/types/payment'
import PaymentBrands, {
  CardPaymentBrands,
  DigitalPaymentBrands,
} from '@/components/payment/payment-brands'
import { HostedCheckoutForm } from './card-payment-form'
import { PaymentSuccessInline } from './payment-success-inline'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CreditCard,
  Smartphone,
  ShoppingCart,
  ArrowRight,
  Shield,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react'
import {
  IssueQuoteRequest,
  IssueQuoteResponse,
} from '@/types/travel-insurance/policy-types'
import { useIssueQuoteRequest } from '@/app/data/mutations/issue-quote-request'
import { getCustomFields, validateCustomFields, storePaymentBrand } from '@/utils/custom-fields-storage'
import { usePaymentSubmit, usePaymentSync } from '@/app/data/mutations/payment'
import {
  useFullQuoteResponseStore,
  useTravelInsuranceStore,
} from '@/store/travel-insurance-store'
import {
  mapToHostedCheckoutRequest,
  pesosToDltString,
  type PaymentRequestConfig,
} from '@/utils/payment-mappers'
import { useAgentCodeStore } from '@/store/agent-code-store'
import { popup } from '@/store/use-popup-store'
import { toast } from 'sonner'
import { PageLoader } from '../page-loader'
import axios from 'axios'
import { COMPANIES } from '@/constants/companies'
import { getPlanName } from '@/utils/custom-fields-storage'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function removeReturnParamsFromUrl() {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.delete('status')
  url.searchParams.delete('txn')
  url.searchParams.delete('reference_id')
  window.history.replaceState({}, '', url.toString())
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PaymentSelection() {
  const [paymentMethod, setPaymentMethod] = useState<'all' | 'cards' | 'digital'>('all')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [isIssuingQuote, setIsIssuingQuote] = useState(false)
  const [txnIdMintError, setTxnIdMintError] = useState(false)
  // SUBMISSION_UNKNOWN: DLT could not confirm the outcome — show verify screen
  const [isSubmissionUnknown, setIsSubmissionUnknown] = useState(false)

  // Stable merchant_transaction_id minted server-side on load
  const [merchantTransactionId, setMerchantTransactionId] = useState<string | null>(null)

  const isProcessingQuoteRef = useRef(false)

  const { mutateAsync: issueQuote } = useIssueQuoteRequest()
  const { mutateAsync: submitPayment } = usePaymentSubmit()
  const { mutateAsync: syncPayment } = usePaymentSync()

  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    prevStep,
    resetForm,
    setIssueQuoteResponse,
    setPolicyNo,
    setSelectedPaymentBrand,
    setPaymentBillingDetails,
    setPaymentSubmitResponse,
    issueQuoteResponse,
    selectedPaymentBrand,
    paymentSubmitResponse,
    coverageOption,
  } = useTravelInsuranceStore()

  const { agentCode } = useAgentCodeStore()
  const { apiResponse } = useFullQuoteResponseStore()

  // --------------------------------------------------------------------------
  // 1. Mint merchant_transaction_id on mount (before the form is shown)
  // --------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false

    async function mintId() {
      try {
        const res = await axios.get<{ merchant_transaction_id: string }>(
          '/api/payment/transaction-id'
        )
        if (!cancelled) setMerchantTransactionId(res.data.merchant_transaction_id)
      } catch {
        if (!cancelled) setTxnIdMintError(true)
      }
    }

    // If returning from DLT redirect, skip minting — we'll use the txn from the URL
    const returnTxn = searchParams.get('txn') || searchParams.get('reference_id')
    if (returnTxn) {
      setMerchantTransactionId(returnTxn)
    } else {
      mintId()
    }

    return () => { cancelled = true }
  }, [])

  // --------------------------------------------------------------------------
  // 2. On return from DLT redirect — call /sync once
  // --------------------------------------------------------------------------
  useEffect(() => {
    const status = searchParams.get('status')
    const referenceId = searchParams.get('reference_id')
    // DLT returns our merchant_transaction_id as either ?txn= (our param) or
    // ?reference_id= (DLT's own param appended to the success_url).
    const txn = searchParams.get('txn') || referenceId

    if (!txn) return
    if (isProcessingQuoteRef.current) return

    removeReturnParamsFromUrl()

    // If DLT used reference_id without status, treat it as success
    // (DLT only appends reference_id on the success_url path)
    const effectiveStatus = status || (referenceId ? 'success' : null)

    if (effectiveStatus === 'failure') {
      toast.error('Payment was not completed. Please try again.')
      return
    }

    // status === 'success' — verify with DLT /sync
    isProcessingQuoteRef.current = true
    setIsProcessing(true)

    syncPayment({ merchant_transaction_id: txn })
      .then((syncResult) => {
        if (syncResult.data.payment_status === 'PAID') {
          handleIssueQuote(txn)
        } else if (syncResult.data.payment_status === 'REJECTED') {
          toast.error('Payment was rejected. Please try again with a different payment method.')
          setIsProcessing(false)
          isProcessingQuoteRef.current = false
        } else {
          // PENDING — payor may still be on the DLT page or DLT is processing
          toast.info('Payment is being processed. Please wait a moment and check your status.')
          setIsProcessing(false)
          isProcessingQuoteRef.current = false
        }
      })
      .catch(() => {
        // Sync call failed — redirect to error page if we have a proposal number
        if (apiResponse?.data?.ProposalNo) {
          router.push(`/${agentCode}/payment-error`)
        } else {
          toast.error('Unable to verify payment status. Please contact support.')
          setIsProcessing(false)
          isProcessingQuoteRef.current = false
        }
      })
  }, [searchParams])

  // --------------------------------------------------------------------------
  // Issue quote after confirmed PAID
  // --------------------------------------------------------------------------
  async function handleIssueQuote(txnId: string) {
    setIsIssuingQuote(true)
    try {
      const customFields = getCustomFields()
      console.log('[handleIssueQuote] customFields from localStorage:', customFields)
      console.log('[handleIssueQuote] ProposalNo:', apiResponse?.data?.ProposalNo)

      if (!customFields.PlanName) {
        const fallbackPlanName =
          getPlanName() ||
          apiResponse?.data?.ProductName ||
          apiResponse?.data?.ProductCode ||
          ''
        if (fallbackPlanName) {
          customFields.PlanName = fallbackPlanName
          console.warn('[handleIssueQuote] PlanName missing — using fallback:', fallbackPlanName)
        } else {
          console.error('[handleIssueQuote] PlanName missing and no fallback available')
        }
      }

      const issueBody: IssueQuoteRequest = {
        proposal_number: apiResponse.data.ProposalNo,
        CustomField: {
          PlanName: customFields.PlanName,
          ...(customFields.PaymentBrand ? { PaymentBrand: customFields.PaymentBrand } : {}),
        },
      }
      const response = await issueQuote({ issueQuoteRequest: issueBody })
      setIssueQuoteResponse(response)
      setPolicyNo(response?.data?.policy_no ?? '')

      popup.show({
        title: 'Payment Successful!',
        description: 'Your policy details have been confirmed and recorded in our system.',
        note: 'Please note that this serves as a cover note only. The official policy document, which is the legally binding proof of coverage, will be issued directly by the insurance carrier and be made available to you shortly.',
        confirmText: 'Done',
        variant: 'success',
        onConfirm: () => setShowSuccessDialog(true),
      })
    } catch (error: any) {
      console.error('[payment-selection] issue quote error:', error)
      toast.error(
        error?.message || 'Payment confirmed but policy issuance failed. Please contact support.'
      )
      if (apiResponse?.data?.ProposalNo) {
        router.push(`/${agentCode}/payment-error`)
      }
    } finally {
      setIsIssuingQuote(false)
      setIsProcessing(false)
      isProcessingQuoteRef.current = false
    }
  }

  // --------------------------------------------------------------------------
  // 3. Unified payment submit — same path for every brand
  // --------------------------------------------------------------------------
  async function handlePaymentSubmit(
    paymentRequest: ReturnType<typeof mapToHostedCheckoutRequest>
  ) {
    if (!merchantTransactionId) {
      toast.error('Transaction reference not ready. Please reload the page.')
      return
    }

    setIsProcessing(true)
    setPaymentBillingDetails(paymentRequest as any)

    const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL ?? '')
    const returnBase = `${origin}/${agentCode}/products/travel-insurance/avail`

    const submitData = {
      ...paymentRequest,
      merchant_transaction_id: merchantTransactionId,
      success_url: `${returnBase}?status=success&txn=${merchantTransactionId}`,
      failure_url: `${returnBase}?status=failure&txn=${merchantTransactionId}`,
    }

    try {
      const result = await submitPayment(submitData)

      // SUBMISSION_UNKNOWN (503 from DLT, returned as HTTP 200 with success=false):
      // DLT could not confirm if the transaction was created.  The payment_url
      // may still be present — if so, redirect the payor to complete payment.
      // If no payment_url, show a verify-status screen so the user can check
      // with /sync before attempting again.  Never auto-retry on this code.
      if (!result.success && (result as any).code === 'SUBMISSION_UNKNOWN') {
        const paymentUrl = result.data?.payment_url
        if (paymentUrl) {
          // Transaction likely went through — redirect to complete payment
          setPaymentSubmitResponse(result as any)
          window.location.href = paymentUrl
          return
        }
        // No payment_url — show verify screen, keep same transaction ID
        setIsSubmissionUnknown(true)
        setIsProcessing(false)
        return
      }

      if (!result.success) {
        toast.error(result.message || 'Payment submission failed. Please try again.')
        setIsProcessing(false)
        // Non-ambiguous failure — mint a fresh transaction ID for next attempt
        try {
          const res = await axios.get<{ merchant_transaction_id: string }>('/api/payment/transaction-id')
          setMerchantTransactionId(res.data.merchant_transaction_id)
        } catch {}
        return
      }

      setPaymentSubmitResponse(result)

      const paymentUrl = result.data.payment_url
      if (!paymentUrl) {
        toast.error('No payment URL received. Please try again.')
        setIsProcessing(false)
        return
      }

      // Redirect to DLT-hosted checkout page
      window.location.href = paymentUrl
    } catch (error: any) {
      const status = error?.response?.status

      if (status === 409) {
        // Reference conflict — mint a fresh ID and let user retry
        toast.error('Transaction reference conflict. Please try again.')
        try {
          const res = await axios.get<{ merchant_transaction_id: string }>('/api/payment/transaction-id')
          setMerchantTransactionId(res.data.merchant_transaction_id)
        } catch {}
      } else {
        toast.error(
          error?.response?.data?.message || error?.message || 'Payment failed. Please try again.'
        )
        try {
          const res = await axios.get<{ merchant_transaction_id: string }>('/api/payment/transaction-id')
          setMerchantTransactionId(res.data.merchant_transaction_id)
        } catch {}
      }
      setIsProcessing(false)
    }
  }

  const handleBrandSelect = (brand: PaymentBrand) => {
    setSelectedPaymentBrand(brand)
    storePaymentBrand(brand.value)
    setTimeout(() => {
      document.getElementById('payment-form-section')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleSuccessDialogContinue = () => {
    setShowSuccessDialog(false)
    resetForm()
    window.location.href = `/${agentCode}/products/travel-insurance`
  }

  // --------------------------------------------------------------------------
  // Build payment config for HostedCheckoutForm
  // --------------------------------------------------------------------------
  const amount = pesosToDltString(apiResponse?.data?.DuePremium ?? 0)
  const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL ?? '')
  const returnBase = `${origin}/${agentCode}/products/travel-insurance/avail`

  // Plan name: stored in localStorage when the user selected a plan
  const planName = getPlanName() || apiResponse?.data?.ProductName || apiResponse?.data?.ProductCode || 'Travel Insurance'

  // Insurer/provider name: look up CarrierCode in COMPANIES, fall back to code itself
  const carrierCode = apiResponse?.data?.CarrierCode ?? ''
  const insurerName =
    COMPANIES.find((c) => c.carrierCode === carrierCode)?.companyName ??
    carrierCode ??
    'OneInsurance'

  const paymentConfig: PaymentRequestConfig = {
    merchantTransactionId: merchantTransactionId ?? '',
    // product_reference_id = proposal number
    productReferenceId: apiResponse?.data?.ProposalNo ?? '',
    // product_name = insurance plan name
    productName: planName,
    // product_description = insurance provider name
    productDescription: insurerName,
    amount,
    currency: 'PHP',
    successUrl: merchantTransactionId
      ? `${returnBase}?status=success&txn=${merchantTransactionId}`
      : `${returnBase}?status=success`,
    failureUrl: merchantTransactionId
      ? `${returnBase}?status=failure&txn=${merchantTransactionId}`
      : `${returnBase}?status=failure`,
  }

  // --------------------------------------------------------------------------
  // Render states
  // --------------------------------------------------------------------------

  // Error: couldn't mint a transaction ID
  if (txnIdMintError) {
    return (
      <Card className="bg-background overflow-hidden p-0 shadow-none">
        <CardContent className="flex flex-col items-center gap-6 py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <div className="space-y-2">
            <h3 className="text-primary text-lg font-bold sm:text-xl">Unable to Start Checkout</h3>
            <p className="text-muted-foreground max-w-sm text-sm">
              We could not generate a transaction reference. Please reload the page to try again.
            </p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            size="lg"
            variant="outline"
            className="rounded-full border-2 px-12 font-semibold"
          >
            Reload Page
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Issuing quote after payment confirmed
  if (isIssuingQuote) {
    return <PageLoader />
  }

  // SUBMISSION_UNKNOWN: DLT could not confirm outcome — let user verify before retrying
  if (isSubmissionUnknown) {
    return (
      <div className="space-y-6">
        <Card className="bg-background overflow-hidden p-0 shadow-none">
          <CardHeader className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
              <h2 className="text-primary text-lg font-bold sm:text-2xl">Payment Status Unknown</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground text-sm">
              We could not confirm whether your payment went through. Please check the status
              before retrying — submitting again without verifying may result in a duplicate charge.
            </p>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-muted-foreground mb-1 text-xs font-medium">Your Reference Number</p>
              <p className="font-mono text-base font-bold tracking-widest">{merchantTransactionId}</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-between">
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="w-full rounded-full border-2 font-semibold sm:w-auto sm:px-12"
            onClick={() => {
              setIsSubmissionUnknown(false)
              setSelectedPaymentBrand(null)
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Payment
          </Button>
          <Button
            size="lg"
            className="from-primary to-accent w-full rounded-full bg-gradient-to-r font-semibold dark:text-white sm:w-auto sm:px-12"
            disabled={isProcessing}
            onClick={async () => {
              if (!merchantTransactionId) return
              setIsProcessing(true)
              try {
                const syncRes = await axios.post('/api/payment/sync', { merchant_transaction_id: merchantTransactionId })
                const paymentStatus = syncRes.data?.data?.payment_status
                if (paymentStatus === 'PAID') {
                  setIsSubmissionUnknown(false)
                  handleIssueQuote(merchantTransactionId)
                } else if (paymentStatus === 'REJECTED') {
                  setIsSubmissionUnknown(false)
                  toast.error('Payment was rejected. Please try again.')
                  const newId = await axios.get<{ merchant_transaction_id: string }>('/api/payment/transaction-id')
                  setMerchantTransactionId(newId.data.merchant_transaction_id)
                } else {
                  toast.info(`Payment status: ${paymentStatus ?? 'PENDING'}. Please check again in a moment.`)
                }
              } catch {
                toast.error('Could not retrieve payment status. Please contact support.')
              } finally {
                setIsProcessing(false)
              }
            }}
          >
            {isProcessing ? (
              <><div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />Checking...</>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Check Payment Status
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // Success screen
  if (showSuccessDialog && selectedPaymentBrand && issueQuoteResponse) {
    return (
      <PaymentSuccessInline
        onContinue={handleSuccessDialogContinue}
        paymentMethod={selectedPaymentBrand}
        policyData={issueQuoteResponse.data}
        quoteData={apiResponse.data}
        paymentSubmit={
          paymentSubmitResponse?.data ??
          ({ merchant_transaction_id: merchantTransactionId ?? '' } as any)
        }
      />
    )
  }

  // Main payment selection UI
  return (
    <div className="space-y-6">
      <Card className="bg-background overflow-hidden p-0 pb-8 shadow-none">
        <CardHeader className="flex flex-col gap-2 border-b pt-6 sm:flex-row sm:items-center sm:justify-between sm:-space-y-2">
          <h2 className="text-primary text-lg font-bold sm:text-2xl">
            Choose Your Payment Method
          </h2>
          <div className="flex flex-col items-start gap-0.5 sm:items-end">
            <p className="text-muted-foreground text-sm font-medium">Total Amount</p>
            <p className="text-primary text-lg font-bold sm:text-2xl">
              ₱{apiResponse?.data?.DuePremium?.toLocaleString('en-PH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) ?? '0.00'}
            </p>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left — Brand selection */}
            <div className="space-y-4">
              {/* Mobile: compact selected brand pill */}
              {selectedPaymentBrand && (
                <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3 lg:hidden">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-14 items-center justify-center rounded border bg-white p-1">
                      <img src={selectedPaymentBrand.image} alt={selectedPaymentBrand.value}
                        className="h-full w-full object-contain" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{selectedPaymentBrand.value}</p>
                      <p className="text-muted-foreground text-xs">
                        {selectedPaymentBrand.is_card ? 'Card' : 'Digital Wallet'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-2 text-xs font-semibold"
                    onClick={() => setSelectedPaymentBrand(null)}
                  >
                    Change
                  </Button>
                </div>
              )}

              <div className={selectedPaymentBrand ? 'hidden lg:block' : ''}>
                <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
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
                    <PaymentBrands onBrandSelect={handleBrandSelect} selectedBrand={selectedPaymentBrand} />
                  </TabsContent>
                  <TabsContent value="cards" className="mt-6">
                    <CardPaymentBrands onBrandSelect={handleBrandSelect} selectedBrand={selectedPaymentBrand} />
                  </TabsContent>
                  <TabsContent value="digital" className="mt-6">
                    <DigitalPaymentBrands onBrandSelect={handleBrandSelect} selectedBrand={selectedPaymentBrand} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Right — Billing form or placeholder */}
            <div id="payment-form-section" className="space-y-4">
              {!selectedPaymentBrand ? (
                <div className="border-muted-foreground/20 bg-muted/30 flex min-h-[500px] w-full items-center justify-center rounded-lg border">
                  <div className="space-y-4 p-8 text-center">
                    <div className="bg-primary/10 dark:bg-primary/20 mx-auto flex h-20 w-20 items-center justify-center rounded-full">
                      <CreditCard className="text-primary h-10 w-10" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-primary dark:text-accent text-lg font-bold">
                        Select a Payment Method
                      </h3>
                      <p className="text-muted-foreground max-w-xs text-sm">
                        Choose your preferred payment method on the left to continue
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="h-4 w-4" /><span>Cards</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Smartphone className="h-4 w-4" /><span>Wallets</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4 shrink-0" />
                    <span>Fill in your billing details — you'll be redirected to complete payment securely</span>
                  </div>
                  <HostedCheckoutForm
                    selectedBrand={selectedPaymentBrand}
                    onSubmit={handlePaymentSubmit}
                    isLoading={isProcessing}
                    className="max-w-none"
                    paymentConfig={paymentConfig}
                    fullQuoteResponse={apiResponse.data}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom nav — matches review page layout */}
      <div className="flex w-full flex-col items-center gap-3 px-1.5 lg:px-0">
        <div className="flex w-full flex-col items-center gap-3 lg:flex-row lg:justify-between">
          {/* Back button — full width on mobile, auto on desktop */}
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="w-full rounded-full border-2 font-semibold lg:w-auto lg:px-12"
            onClick={prevStep}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Review
          </Button>
        </div>
      </div>
    </div>
  )
}
