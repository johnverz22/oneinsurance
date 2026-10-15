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
import PaymentBrands from '@/components/payment/payment-brands'
import { HostedCheckoutForm } from './card-payment-form'
import { PaymentSuccessInline } from './payment-success-inline'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CreditCard,
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
import { usePaymentPhaseStore } from '@/store/payment-phase-store'
import { PaymentFinalizing, PaymentIssueError } from './payment-finalizing'
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
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [isIssuingQuote, setIsIssuingQuote] = useState(false)
  const [txnIdMintError, setTxnIdMintError] = useState(false)
  // SUBMISSION_UNKNOWN: DLT could not confirm the outcome — show verify screen
  const [isSubmissionUnknown, setIsSubmissionUnknown] = useState(false)

  // Stable merchant_transaction_id minted server-side on load
  const [merchantTransactionId, setMerchantTransactionId] = useState<string | null>(null)

  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false)
  const [issueError, setIssueError] = useState(false)
  const [issueFailures, setIssueFailures] = useState(0)
  const [retryError, setRetryError] = useState<string | null>(null)
  const lastPaidTxnRef = useRef<string | null>(null)

  const isProcessingQuoteRef = useRef(false)
  const setPaymentPhase = usePaymentPhaseStore((s) => s.setPhase)

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
    travelDetails,
    travelersInfo,
  } = useTravelInsuranceStore()

  const { agentCode } = useAgentCodeStore()
  const { apiResponse } = useFullQuoteResponseStore()

  useEffect(() => {
    setPaymentPhase(
      showSuccessDialog ? 'success' : issueError ? 'error' : isIssuingQuote || isVerifyingPayment ? 'finalizing' : 'idle'
    )
  }, [showSuccessDialog, issueError, isIssuingQuote, isVerifyingPayment, setPaymentPhase])

  useEffect(() => () => setPaymentPhase('idle'), [setPaymentPhase])

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
      // Keep the ref set for this mount — dev StrictMode re-invokes this
      // effect with stale searchParams, which would toast twice. Returning
      // from DLT is always a fresh page load, so a legit retry remounts.
      isProcessingQuoteRef.current = true
      toast.error('Payment was not completed. Please try again.')
      return
    }

    // status === 'success' — verify with DLT /sync
    isProcessingQuoteRef.current = true
    setIsProcessing(true)
    setIsVerifyingPayment(true)

    syncPayment({ merchant_transaction_id: txn })
      .then((syncResult) => {
        if (syncResult.data.payment_status === 'PAID') {
          handleIssueQuote(txn)
        } else if (syncResult.data.payment_status === 'REJECTED') {
          toast.error('Payment was rejected. Please try again with a different payment method.')
          setIsVerifyingPayment(false)
          setIsProcessing(false)
          isProcessingQuoteRef.current = false
        } else {
          // PENDING — payor may still be on the DLT page or DLT is processing
          toast.info('Payment is being processed. Please wait a moment and check your status.')
          setIsVerifyingPayment(false)
          setIsProcessing(false)
          isProcessingQuoteRef.current = false
        }
      })
      .catch(() => {
        setIsVerifyingPayment(false)
        // Sync call failed — show the finalize-policy error inline if we have a proposal number
        if (apiResponse?.data?.ProposalNo) {
          lastPaidTxnRef.current = txn
          setIssueError(true)
        } else {
          toast.error('Unable to verify payment status. Please contact support.')
        }
        setIsProcessing(false)
        isProcessingQuoteRef.current = false
      })
  }, [searchParams])

  // --------------------------------------------------------------------------
  // Issue quote after confirmed PAID
  // --------------------------------------------------------------------------
  async function handleIssueQuote(txnId: string) {
    lastPaidTxnRef.current = txnId
    setRetryError(null)
    setIsVerifyingPayment(false)
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
        payment: { reference: txnId },
        CustomField: {
          PlanName: customFields.PlanName,
          ...(customFields.PaymentBrand ? { PaymentBrand: customFields.PaymentBrand } : {}),
        },
      }
      const response = await issueQuote({ issueQuoteRequest: issueBody })
      setIssueError(false)
      setIssueFailures(0)
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
      console.warn('[payment-selection] issue quote error:', error)
      const message = error?.message || 'We couldn’t create your policy this time.'
      if (apiResponse?.data?.ProposalNo) {
        if (issueError) setRetryError(message)
        setIssueFailures((n) => n + 1)
        setIssueError(true)
      } else {
        toast.error(message)
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
      <Card className="bg-card overflow-hidden p-0 shadow-none">
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

  // Payment succeeded but issuing the policy failed — stay in the journey layout
  // (also while retrying, so the button shows its own loading state)
  if (issueError) {
    return (
      <PaymentIssueError
        proposalNumber={apiResponse?.data?.ProposalNo ?? null}
        paymentReference={lastPaidTxnRef.current ?? merchantTransactionId}
        amountPaid={paymentSubmitResponse?.data?.amount}
        paidAt={paymentSubmitResponse?.data?.timestamp}
        planName={coverageOption.selectedPlan?.CarrierPlanDesc ?? apiResponse?.data?.ProductName}
        departureDate={travelDetails.departureDate}
        returnDate={travelDetails.returnDate}
        email={travelersInfo?.[0]?.email}
        failedAttempts={issueFailures}
        retryError={retryError}
        hideBackOnDesktop
        isRetrying={isIssuingQuote}
        onRetry={() => handleIssueQuote(lastPaidTxnRef.current ?? merchantTransactionId ?? '')}
        onBack={() => router.push(`/${agentCode}/products/travel-insurance`)}
      />
    )
  }

  // Issuing quote after payment confirmed
  if (isIssuingQuote || isVerifyingPayment) {
    return <PaymentFinalizing stage={isIssuingQuote ? 'issuing' : 'verifying'} />
  }

  // SUBMISSION_UNKNOWN: DLT could not confirm outcome — let user verify before retrying
  if (isSubmissionUnknown) {
    return (
      <div className="space-y-6">
        <Card className="bg-card overflow-hidden p-0 shadow-none">
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
            className="from-primary to-lilac text-primary-foreground w-full rounded-full bg-gradient-to-r font-semibold sm:w-auto sm:px-12"
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
        hideContinueOnDesktop
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
    <div className="space-y-4 lg:space-y-6">
      <Card className="bg-card gap-0 overflow-hidden p-0 shadow-none">
        <CardHeader className="px-5 pt-5 pb-3 sm:px-6">
          <h2 className="text-primary text-lg font-bold sm:text-2xl">Payment Method</h2>
          <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <Shield className="text-success size-4 shrink-0" />
            Secure checkout — you'll be redirected to complete payment.
          </p>
        </CardHeader>

        <CardContent className="space-y-6 px-5 pt-3 pb-6 sm:px-6">
          <PaymentBrands
            variant="compact"
            onBrandSelect={handleBrandSelect}
            selectedBrand={selectedPaymentBrand}
          />

          {selectedPaymentBrand && (
            <div id="payment-form-section">
              <HostedCheckoutForm
                selectedBrand={selectedPaymentBrand}
                onSubmit={handlePaymentSubmit}
                isLoading={isProcessing}
                className="max-w-none"
                compactActions
                paymentConfig={paymentConfig}
                fullQuoteResponse={apiResponse.data}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="hidden">
        <Button type="button" onClick={prevStep} data-mobile-action="back">
          Back
        </Button>
      </div>
    </div>
  )
}
