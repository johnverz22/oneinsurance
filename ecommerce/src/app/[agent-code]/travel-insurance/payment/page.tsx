'use client'

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import Image from 'next/image'
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronDown,
  CreditCard,
  Loader2,
  MapPin,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { useGetPaymentBrands } from '@/app/data/queries/payment'
import { usePaymentSubmit } from '@/app/data/mutations/payment'
import { COUNTRIES } from '@/constants/countries'
import { storePaymentBrand } from '@/utils/custom-fields-storage'
import { mapToHostedCheckoutRequest, pesosToDltString, type BillingFormData } from '@/utils/payment-mappers'
import type { PaymentBrand } from '@/types/payment'
import { idFilesStore, useFullQuoteResponseStore, useTravelInsuranceStore } from '@/store/travel-insurance-store'
import { COMPANIES, CARRIER_BRAND_COLORS } from '@/constants/companies'
import { getCityNameByCityCode, getProvinceNameByProvCode } from '@/utils/address-util'
import { groupPlanBenefits } from '@/utils/travel-benefits-helpers'
import { toPHP } from '@/utils/fx'
import { getPrincipal } from '@/utils/traveller-form'
import { toTitleCase } from '@/lib/utils'
import { formatDays, formatTripRange, getTripDays, countryLabel } from '@/utils/trip-summary'
import { isProposalExpired, PROPOSAL_VALIDITY_HOURS } from '@/utils/proposal-loader'

const money = (n: number) =>
  n.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

type Payer = BillingFormData
type Errors = Partial<Record<keyof Payer, string>>
type Phase = 'idle' | 'unknown'

const validate = (p: Payer): Errors => {
  const e: Errors = {}
  const len = (k: keyof Payer, label: string, min: number, max: number) => {
    const v = p[k].trim()
    if (!v) e[k] = `${label} is required`
    else if (v.length < min) e[k] = `${label} must be at least ${min} characters`
    else if (v.length > max) e[k] = `${label} must be at most ${max} characters`
  }
  len('firstName', 'First name', 2, 50)
  len('lastName', 'Last name', 2, 50)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim())) e.email = 'Enter a valid email address'
  if (p.phone.length < 7) e.phone = 'Phone number is required'
  else if (p.phone.length > 15) e.phone = 'Phone number must be at most 15 digits'
  len('addressLineOne', 'Address line 1', 1, 80)
  len('addressLineTwo', 'Address line 2', 1, 80)
  len('cityMunicipality', 'City / Municipality', 2, 60)
  len('stateProvinceRegion', 'State / Province / Region', 2, 40)
  if (!/^[0-9]{3,10}$/.test(p.postalCode)) e.postalCode = 'Postal code must be 3–10 digits'
  if (!p.country) e.country = 'Country is required'
  return e
}

function Field({
  id,
  label,
  error,
  optional = false,
  className = '',
  children,
}: {
  id: string
  label: string
  error?: string
  optional?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`min-w-0 text-sm ${className}`}>
      <label htmlFor={id} className="block">
        {label}{' '}
        {optional ? (
          <span className="text-xs font-normal text-[var(--text-muted)]">(optional)</span>
        ) : (
          <span aria-hidden className="text-red-600">*</span>
        )}
      </label>
      {children}
      {error && (
        <span
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 block text-sm text-red-700 dark:text-red-300"
        >
          {error}
        </span>
      )}
    </div>
  )
}

const inputCls = 'ui-form-field mt-2 block min-h-11 w-full'

export default function Step5PaymentPage() {
  return (
    <Suspense fallback={null}>
      <PaymentRoute />
    </Suspense>
  )
}

function PaymentRoute() {
  const router = useRouter()
  const params = useParams()
  const agentCode = (params['agent-code'] as string) || 'ckO6uNx2O6'

  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  const apiData = useFullQuoteResponseStore((s) => s.apiResponse.data)
  const plan = useTravelInsuranceStore((s) => s.coverageOption.selectedPlan)
  const proposalNo = apiData?.ProposalNo

  useEffect(() => {
    if (hydrated && (!proposalNo || !plan)) router.replace(`/${agentCode}/travel-insurance/review`)
  }, [hydrated, proposalNo, plan, router, agentCode])

  if (!hydrated || !proposalNo || !plan) {
    return (
      <>
        <Header agentCode={agentCode} currentStep={5} />
        <div className="w-full mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:pb-10 lg:px-8" aria-busy="true">
          <div className="space-y-2">
            <div className="h-4 w-36 animate-pulse rounded bg-[var(--border)]" />
            <div className="h-8 sm:h-9 w-48 animate-pulse rounded-lg bg-[var(--border)]" />
            <div className="h-4 sm:h-5 w-80 max-w-full animate-pulse rounded bg-[var(--border)]" />
          </div>

          <div className="w-full travel-applicant-layout travel-payment-layout mt-6 lg:mt-8">
            <div className="min-w-0 space-y-7">
              <div className="h-44 w-full animate-pulse rounded-lg bg-[var(--border)]" />
              <div className="h-64 w-full animate-pulse rounded-lg bg-[var(--border)]" />
              <div className="h-96 w-full animate-pulse rounded-lg bg-[var(--border)]" />
            </div>
            <div className="h-80 w-full animate-pulse rounded-lg bg-[var(--border)]" />
          </div>
          <span className="sr-only" role="status">
            Loading payment details
          </span>
        </div>
      </>
    )
  }

  return <PaymentContent agentCode={agentCode} />
}

function PaymentContent({ agentCode }: { agentCode: string }) {
  const router = useRouter()
  const { travelDetails, coverageOption, travelersInfo } = useTravelInsuranceStore()
  const apiData = useFullQuoteResponseStore((s) => s.apiResponse.data)
  const plan = coverageOption.selectedPlan!
  const proposalNo = apiData.ProposalNo

  const adults = travelDetails.noOfAdults || 1
  const total = adults + (travelDetails.noOfChildren || 0)
  const expired = isProposalExpired(apiData)

  const provider = COMPANIES.find((c) => c.carrierCode === coverageOption.carrierCode)
  const brand = CARRIER_BRAND_COLORS[coverageOption.carrierCode]
  const insurer = provider?.companyName || plan.CarrierProductName || coverageOption.carrierCode
  const logo = brand?.cardLogoTight || brand?.planCardLogo || provider?.image || plan.LogoUrl
  const planName = plan.CarrierPlanDesc.trim()

  const selectedAddons = useMemo(
    () =>
      Object.entries(groupPlanBenefits(plan).groupedAddonBenefits)
        .filter(([code, g]) => g.children.length > 0 && coverageOption.selectedAddonBenefits?.includes(code))
        .map(([code, g]) => ({
          code,
          name: g.parent.CoverageName || g.parent.BenefitDesc,
        })),
    [plan, coverageOption.selectedAddonBenefits],
  )

  const planPremium = toPHP(
    Number(plan.DuePremium || plan.GrossPremium || plan.BeforeVatPremium) || 0,
    plan.Currency || 'PHP',
  )
  const totalPremium = Number(apiData.DuePremium) || planPremium
  const beforeVat = Number(apiData.BeforeVatPremium) || 0
  const lgt = Number(apiData.LGT) || 0

  const detail = travelDetails.travelDetailList[0]
  const departure = new Date(travelDetails.departureDate)
  const returning = new Date(travelDetails.returnDate)
  const days = getTripDays(departure, returning)
  const origin = countryLabel(detail?.PlaceOfOrgin) || 'Philippines'
  const destinations = travelDetails.travelDetailList.map((d) => countryLabel(d.TravelCountry)).join(', ')

  const customer = apiData.PolicyCustomerList?.[0]
  const lead = getPrincipal(travelersInfo)
  const leadAddress = useMemo(
    () => ({
      country: 'PH',
      postalCode: customer?.PostCode ?? lead?.address?.zipCode ?? '',
      stateProvinceRegion: toTitleCase(
        getProvinceNameByProvCode(customer?.AddrProvince ?? lead?.address?.province ?? '') ?? '',
      ),
      cityMunicipality: toTitleCase(getCityNameByCityCode(customer?.City ?? lead?.address?.city ?? '') ?? ''),
      addressLineOne: customer?.AddressLine1 ?? lead?.address?.line1 ?? '',
      addressLineTwo: customer?.AddressLine2 || lead?.address?.line2 || '',
    }),
    [customer, lead],
  )

  const {
    data: brandsResponse,
    isLoading: brandsLoading,
    error: brandsError,
    refetch: refetchBrands,
  } = useGetPaymentBrands()
  const brands = brandsResponse?.success ? brandsResponse.data : []
  const selectedBrand = useTravelInsuranceStore((s) => s.selectedPaymentBrand)
  const {
    setSelectedPaymentBrand,
    setPaymentBillingDetails,
    setPaymentSubmitResponse,
  } = useTravelInsuranceStore.getState()

  const { mutateAsync: submitPayment } = usePaymentSubmit()
  const searchParams = useSearchParams()

  const [txnId, setTxnId] = useState<string | null>(null)
  const [txnError, setTxnError] = useState(false)
  const returnTxn = searchParams.get('txn')
  const returnStatus = searchParams.get('status') || (searchParams.get('reference_id') ? 'success' : null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [notice, setNotice] = useState<{
    kind: 'error' | 'info'
    text: string
  } | null>(
    returnTxn && returnStatus === 'failure'
      ? { kind: 'error', text: 'Payment was not completed. Please try again.' }
      : null,
  )
  const returnHandled = useRef(false)

  const summaryRef = useRef<HTMLElement>(null)
  const [payer, setPayer] = useState<Payer>({
    firstName: customer?.FirstName ?? lead?.firstName ?? '',
    lastName: customer?.LastName ?? lead?.lastName ?? '',
    email: customer?.Email ?? lead?.email ?? '',
    phone: lead?.mobileNumber ?? '',
    ...leadAddress,
  })
  const [useLeadAddress, setUseLeadAddress] = useState(true)
  const manualAddress = useRef<Partial<Payer> | null>(null)
  const [attempted, setAttempted] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const cancelRef = useRef<HTMLDialogElement>(null)
  const cancelTrigger = useRef<HTMLButtonElement>(null)
  const errors = useMemo<Errors>(() => (attempted ? validate(payer) : {}), [attempted, payer])

  const mintTxn = useCallback(async () => {
    try {
      const res = await axios.get<{ merchant_transaction_id: string }>('/api/payment/transaction-id')
      setTxnId(res.data.merchant_transaction_id)
      setTxnError(false)
    } catch {
      setTxnError(true)
    }
  }, [])

  useEffect(() => {
    let live = true
    axios
      .get<{ merchant_transaction_id: string }>('/api/payment/transaction-id')
      .then((res) => live && setTxnId(res.data.merchant_transaction_id))
      .catch(() => live && setTxnError(true))
    return () => {
      live = false
    }
  }, [])

  const addressKeys: (keyof Payer)[] = [
    'country',
    'postalCode',
    'stateProvinceRegion',
    'cityMunicipality',
    'addressLineOne',
    'addressLineTwo',
  ]
  const set =
    (k: keyof Payer, digits = false) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = digits ? e.target.value.replace(/\D/g, '') : e.target.value
      setPayer((p) => ({ ...p, [k]: value }))
      if (addressKeys.includes(k)) setUseLeadAddress(false)
    }

  const toggleLeadAddress = (on: boolean) => {
    setUseLeadAddress(on)
    if (on) {
      manualAddress.current = { ...payer }
      setPayer((p) => ({ ...p, ...leadAddress }))
    } else if (manualAddress.current) {
      const m = manualAddress.current
      setPayer((p) => ({
        ...p,
        ...Object.fromEntries(addressKeys.map((k) => [k, m[k] ?? p[k]])),
      }))
    }
  }

  // The issuance page owns the post-payment journey — forward the gateway
  // return params (txn / status / reference_id) untouched and let /issuance
  // verify the payment and record the policy there.
  useEffect(() => {
    if (returnHandled.current || !returnTxn) return
    returnHandled.current = true
    if (returnStatus === 'failure') return
    router.replace(`/${agentCode}/travel-insurance/issuance${window.location.search}`)
  }, [returnTxn, returnStatus, router, agentCode])

  const checkStatus = async () => {
    if (!txnId) return
    setProcessing(true)
    try {
      const r = await axios.post('/api/payment/sync', {
        merchant_transaction_id: txnId,
      })
      const st = r.data?.data?.payment_status
      if (st === 'PAID') {
        router.push(`/${agentCode}/travel-insurance/issuance?paid=1&txn=${encodeURIComponent(txnId)}`)
        return
      }
      if (st === 'REJECTED') {
        setPhase('idle')
        setNotice({
          kind: 'error',
          text: 'Payment was rejected. Please try again.',
        })
        await mintTxn()
      } else {
        setNotice({
          kind: 'info',
          text: `Payment status: ${st ?? 'PENDING'}. Please check again in a moment.`,
        })
      }
    } catch {
      setNotice({
        kind: 'error',
        text: 'Could not retrieve payment status. Please contact support.',
      })
    }
    setProcessing(false)
  }


  useEffect(() => {
    const el = cancelRef.current
    if (!el) return
    if (cancelOpen && !el.open) el.showModal()
    if (!cancelOpen && el.open) el.close()
  }, [cancelOpen])
  useEffect(() => {
    const el = cancelRef.current
    if (!el) return
    const onClose = () => {
      setCancelOpen(false)
      cancelTrigger.current?.focus()
    }
    el.addEventListener('close', onClose)
    return () => el.removeEventListener('close', onClose)
  }, [phase])

  const startNewQuote = () => {
    useTravelInsuranceStore.getState().resetForm()
    useFullQuoteResponseStore.getState().resetApiResponse()
    idFilesStore.clear()
    router.push(`/${agentCode}/travel-insurance`)
  }

  const selectBrand = (b: PaymentBrand) => {
    setSelectedPaymentBrand(b)
    storePaymentBrand(b.value)
    setNotice(null)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (expired || processing) return
    setAttempted(true)
    setNotice(null)
    if (!selectedBrand) {
      setNotice({ kind: 'error', text: 'Select a payment method first.' })
      document.getElementById('payment-method-title')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (Object.keys(validate(payer)).length) {
      window.setTimeout(() => {
        const bad = document.querySelector<HTMLElement>('#travel-payment-form [aria-invalid="true"]')
        bad?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        bad?.focus({ preventScroll: true })
      }, 50)
      return
    }
    if (!txnId) {
      setNotice({
        kind: 'error',
        text: 'Transaction reference not ready. Please reload the page.',
      })
      return
    }

    setProcessing(true)
    const returnBase = `${window.location.origin}/${agentCode}/travel-insurance/payment`
    const issuanceBase = `${window.location.origin}/${agentCode}/travel-insurance/issuance`
    const request = {
      ...mapToHostedCheckoutRequest(payer, selectedBrand, {
        merchantTransactionId: txnId,
        productReferenceId: proposalNo,
        productName: planName,
        productDescription: insurer,
        amount: pesosToDltString(Number(apiData.DuePremium) || totalPremium),
        currency: 'PHP',
      }),
      success_url: `${issuanceBase}?status=success&txn=${txnId}`,
      failure_url: `${returnBase}?status=failure&txn=${txnId}`,
    }
    setPaymentBillingDetails(request)

    try {
      const result = await submitPayment(request)
      if (!result.success && (result as { code?: string }).code === 'SUBMISSION_UNKNOWN') {
        const url = result.data?.payment_url
        if (url) {
          setPaymentSubmitResponse(result)
          window.location.assign(url)
          return
        }
        setPhase('unknown')
        setProcessing(false)
        return
      }
      if (!result.success || !result.data?.payment_url) {
        setNotice({
          kind: 'error',
          text: result.success
            ? 'No payment URL received. Please try again.'
            : result.message || 'Payment submission failed. Please try again.',
        })
        setProcessing(false)
        await mintTxn()
        return
      }
      setPaymentSubmitResponse(result)
      window.location.assign(result.data.payment_url)
    } catch (err) {
      const res = (err as { response?: { status?: number; data?: { message?: string } } }).response
      setNotice({
        kind: 'error',
        text:
          res?.status === 409
            ? 'Transaction reference conflict. Please try again.'
            : res?.data?.message || (err instanceof Error ? err.message : 'Payment failed. Please try again.'),
      })
      setProcessing(false)
      await mintTxn()
    }
  }

  const travellerNames = travelersInfo
    .map((t, i) => {
      const n = [t.firstName, t.middleName, t.lastName].filter(Boolean).join(' ') || 'Name not provided'
      return `${n} (${i < adults ? 'Adult' : 'Child'}${t.isPrincipalApplicant && travelersInfo.length > 1 ? ', Principal' : ''})`
    })
    .join(', ')

  const payButton = (
    <button
      type="submit"
      form="travel-payment-form"
      disabled={processing || expired || !txnId}
      className="btn-primary inline-flex min-h-11 items-center justify-center gap-2 px-5 py-3 text-base font-semibold disabled:opacity-60"
    >
      {processing ? (
        <Loader2 className="size-5 animate-spin" aria-hidden />
      ) : (
        <CreditCard className="size-5" aria-hidden />
      )}
      {processing ? 'Redirecting…' : 'Pay'}
    </button>
  )

  if (phase === 'unknown' || txnError) {
    return (
      <>
        <Header agentCode={agentCode} currentStep={5} />
        <div className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:px-6">
          {phase === 'unknown' ? (
            <section className="travel-applicant-card" role="alert">
              <h1 className="flex items-center gap-2 text-xl font-semibold sm:text-2xl">
                <AlertCircle className="size-6 text-amber-600" aria-hidden />
                Payment status unknown
              </h1>
              <p className="mt-3 text-sm leading-6">
                We could not confirm whether your payment went through. Check the status before retrying — paying again
                without verifying may result in a duplicate charge.
              </p>
              <p className="mt-4 text-sm text-[var(--text-muted)]">Your reference number</p>
              <p className="break-all font-mono font-semibold">{txnId}</p>
              {notice && (
                <p role="status" className="mt-4 text-sm">
                  {notice.text}
                </p>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="review-outline-btn"
                  onClick={() => {
                    setPhase('idle')
                    setNotice(null)
                    setSelectedPaymentBrand(null)
                  }}
                >
                  Back to payment
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={checkStatus}
                  className="btn-primary inline-flex min-h-11 items-center justify-center gap-2 px-5 py-3 text-base font-semibold"
                >
                  {processing ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <ShieldCheck className="size-4" aria-hidden />
                  )}
                  Check payment status
                </button>
              </div>
            </section>
          ) : (
            <section className="travel-applicant-card text-center" role="alert">
              <AlertCircle className="mx-auto size-10 text-red-700 dark:text-red-300" aria-hidden />
              <h1 className="mt-3 text-xl font-semibold">Unable to start checkout</h1>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                We could not generate a transaction reference. Please try again.
              </p>
              <button type="button" onClick={mintTxn} className="review-outline-btn mt-5">
                Try again
              </button>
            </section>
          )}
        </div>
      </>
    )
  }

  return (
    <>
      <Header agentCode={agentCode} currentStep={5} />
      <div className="w-full mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:pb-10 lg:px-8">
        <p className="hidden text-xs font-semibold uppercase tracking-wider text-[var(--primary)] sm:block dark:text-[#d0e3c8]">
          Travel insurance · Step 5 of 5
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">Payment</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-sub)] sm:text-base sm:leading-7">
          Choose your payment method and confirm your billing details.
        </p>

        {expired && (
          <div
            role="alert"
            className="mt-6 rounded-md border border-red-200 bg-red-50 p-5 text-sm dark:border-red-800/40 dark:bg-red-900/10"
          >
            <h2 className="font-semibold text-red-800 dark:text-red-300">This proposal has expired</h2>
            <p className="mt-2 leading-6 text-red-800 dark:text-red-300">
              The validity period for this proposal has ended. Please generate a new quote to continue.
            </p>
          </div>
        )}

        {notice && (
          <div
            role={notice.kind === 'error' ? 'alert' : 'status'}
            className={
              notice.kind === 'error'
                ? 'mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800/40 dark:bg-red-900/10 dark:text-red-300'
                : 'mt-6 rounded-md border border-[var(--field-border)] bg-[var(--subtle)] p-4 text-sm'
            }
          >
            {notice.text}
          </div>
        )}

        <form
          id="travel-payment-form"
          noValidate
          onSubmit={submit}
          className="w-full travel-applicant-layout travel-payment-layout"
        >
          <div className="min-w-0 space-y-7">
            <details className="travel-applicant-card travel-coverage travel-payment-summary">
              <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-4">
                <h2 className="text-lg font-semibold sm:text-xl">Travel details</h2>
                <ChevronDown
                  className="size-5 shrink-0 transition-transform [details[open]_&]:rotate-180"
                  aria-hidden
                />
              </summary>
              <dl className="travel-payment-summary__grid">
                <div>
                  <dt>Proposal</dt>
                  <dd className="break-all font-semibold">{proposalNo}</dd>
                </div>
                <div>
                  <dt>
                    <MapPin className="size-3.5" aria-hidden /> Trip
                  </dt>
                  <dd>
                    {origin} → {destinations}
                  </dd>
                </div>
                <div>
                  <dt>
                    <CalendarDays className="size-3.5" aria-hidden /> Dates
                  </dt>
                  <dd>
                    {formatTripRange(departure, returning)} · {formatDays(days)}
                  </dd>
                </div>
                <div>
                  <dt>
                    <Users className="size-3.5" aria-hidden /> Travellers ({total})
                  </dt>
                  <dd className="break-words">{travellerNames}</dd>
                </div>
                <div>
                  <dt>
                    <ShieldCheck className="size-3.5" aria-hidden /> Add-ons ({selectedAddons.length})
                  </dt>
                  <dd className="break-words">
                    {selectedAddons.length ? selectedAddons.map((a) => a.name).join(', ') : 'None selected'}
                  </dd>
                </div>
              </dl>
            </details>

            <section className="travel-applicant-card min-w-0" aria-labelledby="payment-method-title">
              <h2
                id="payment-method-title"
                className="text-lg font-semibold text-[var(--primary)] sm:text-xl dark:text-[#d0e3c8]"
              >
                Payment method
              </h2>
              <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">Select one payment option.</p>
              <fieldset className="mt-4">
                <legend className="sr-only">Select a payment method</legend>
                {brandsLoading ? (
                  <div className="travel-payment-brands" role="status" aria-label="Loading payment options">
                    {Array.from({ length: 6 }, (_, i) => (
                      <div key={i} className="h-[52px] animate-pulse rounded-lg bg-[var(--border)]" />
                    ))}
                  </div>
                ) : brands.length === 0 ? (
                  <div
                    role="alert"
                    className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800/40 dark:bg-red-900/10 dark:text-red-300"
                  >
                    {brandsError
                      ? 'We could not load the payment options.'
                      : 'No payment options are available right now.'}{' '}
                    <button type="button" onClick={() => refetchBrands()} className="font-semibold underline">
                      Try again
                    </button>
                  </div>
                ) : (
                  <div className="travel-payment-brands">
                    {brands.map((b) => (
                      <label key={b.code} className="travel-payment-brand">
                        <input
                          type="radio"
                          name="payment_method"
                          value={b.code}
                          checked={selectedBrand?.code === b.code}
                          onChange={() => selectBrand(b)}
                          required
                          className="sr-only"
                        />
                        <span title={b.value}>
                          <Image src={b.image} alt={b.value} width={80} height={50} unoptimized />
                          <span className="travel-payment-brand__check" aria-hidden>
                            <Check className="size-3" strokeWidth={3} />
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>

              <section className="travel-payment-fields" aria-labelledby="payer-details-title">
                <h3
                  id="payer-details-title"
                  className="text-lg font-semibold text-[var(--primary)] dark:text-[#d0e3c8]"
                >
                  Payer details
                </h3>
                <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                  Prefilled from the lead traveller. All fields are required. You will be redirected to the secure
                  payment page to complete payment.
                </p>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <Field id="payer-first-name" label="First name" error={errors.firstName}>
                    <input
                      id="payer-first-name"
                      type="text"
                      name="firstName"
                      value={payer.firstName}
                      onChange={set('firstName')}
                      autoComplete="given-name"
                      required
                      aria-invalid={!!errors.firstName}
                      aria-describedby={errors.firstName ? 'payer-first-name-error' : undefined}
                      maxLength={50}
                      className={inputCls}
                    />
                  </Field>
                  <Field id="payer-last-name" label="Last name" error={errors.lastName}>
                    <input
                      id="payer-last-name"
                      type="text"
                      name="lastName"
                      value={payer.lastName}
                      onChange={set('lastName')}
                      autoComplete="family-name"
                      required
                      aria-invalid={!!errors.lastName}
                      aria-describedby={errors.lastName ? 'payer-last-name-error' : undefined}
                      maxLength={50}
                      className={inputCls}
                    />
                  </Field>
                  <Field id="payer-email" label="Email address" error={errors.email}>
                    <input
                      id="payer-email"
                      type="email"
                      name="email"
                      value={payer.email}
                      onChange={set('email')}
                      autoComplete="email"
                      required
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'payer-email-error' : undefined}
                      maxLength={150}
                      className={inputCls}
                    />
                  </Field>
                  <Field id="payer-phone" label="Phone number" error={errors.phone}>
                    <span className="relative mt-2 block">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">
                        +63
                      </span>
                      <input
                        id="payer-phone"
                        type="tel"
                        name="phone"
                        inputMode="numeric"
                        value={payer.phone}
                        onChange={set('phone', true)}
                        autoComplete="tel-national"
                        required
                        aria-invalid={!!errors.phone}
                        aria-describedby={errors.phone ? 'payer-phone-error' : undefined}
                        maxLength={15}
                        placeholder="9XX XXX XXXX"
                        className="ui-form-field block min-h-11 w-full pl-12"
                      />
                    </span>
                  </Field>
                </div>
              </section>

              <section className="travel-payment-fields" aria-labelledby="billing-address-title">
                <h3
                  id="billing-address-title"
                  className="text-lg font-semibold text-[var(--primary)] dark:text-[#d0e3c8]"
                >
                  Billing address
                </h3>
                <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">All fields are required.</p>
                <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={useLeadAddress}
                    onChange={(e) => toggleLeadAddress(e.target.checked)}
                    className="size-4 shrink-0 accent-[var(--primary)]"
                  />
                  Use principal traveller’s address
                </label>
                <div className="mt-3 grid gap-5 sm:grid-cols-6">
                  <Field id="billing-country" label="Country" className="sm:col-span-4" error={errors.country}>
                    <select
                      id="billing-country"
                      name="country"
                      value={payer.country}
                      onChange={set('country')}
                      autoComplete="country"
                      required
                      aria-invalid={!!errors.country}
                      aria-describedby={errors.country ? 'billing-country-error' : undefined}
                      className={inputCls}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field id="billing-postal-code" label="Postal code" className="sm:col-span-2" error={errors.postalCode}>
                    <input
                      id="billing-postal-code"
                      type="text"
                      name="postalCode"
                      inputMode="numeric"
                      value={payer.postalCode}
                      onChange={set('postalCode', true)}
                      autoComplete="postal-code"
                      required
                      aria-invalid={!!errors.postalCode}
                      aria-describedby={errors.postalCode ? 'billing-postal-code-error' : undefined}
                      maxLength={10}
                      className={inputCls}
                    />
                  </Field>
                  <Field id="billing-region" label="State / Province / Region" className="sm:col-span-3" error={errors.stateProvinceRegion}>
                    <input
                      id="billing-region"
                      type="text"
                      name="stateProvinceRegion"
                      value={payer.stateProvinceRegion}
                      onChange={set('stateProvinceRegion')}
                      autoComplete="address-level1"
                      required
                      aria-invalid={!!errors.stateProvinceRegion}
                      aria-describedby={errors.stateProvinceRegion ? 'billing-region-error' : undefined}
                      maxLength={40}
                      className={inputCls}
                    />
                  </Field>
                  <Field id="billing-city" label="City / Municipality" className="sm:col-span-3" error={errors.cityMunicipality}>
                    <input
                      id="billing-city"
                      type="text"
                      name="cityMunicipality"
                      value={payer.cityMunicipality}
                      onChange={set('cityMunicipality')}
                      autoComplete="address-level2"
                      required
                      aria-invalid={!!errors.cityMunicipality}
                      aria-describedby={errors.cityMunicipality ? 'billing-city-error' : undefined}
                      maxLength={60}
                      className={inputCls}
                    />
                  </Field>
                  <Field id="billing-address-1" label="Address line 1" className="sm:col-span-6" error={errors.addressLineOne}>
                    <input
                      id="billing-address-1"
                      type="text"
                      name="addressLineOne"
                      value={payer.addressLineOne}
                      onChange={set('addressLineOne')}
                      autoComplete="address-line1"
                      required
                      aria-invalid={!!errors.addressLineOne}
                      aria-describedby={errors.addressLineOne ? 'billing-address-1-error' : undefined}
                      maxLength={80}
                      className={inputCls}
                    />
                  </Field>
                  <Field id="billing-address-2" label="Address line 2" className="sm:col-span-6" error={errors.addressLineTwo}>
                    <input
                      id="billing-address-2"
                      type="text"
                      name="addressLineTwo"
                      value={payer.addressLineTwo}
                      onChange={set('addressLineTwo')}
                      autoComplete="address-line2"
                      required
                      aria-invalid={!!errors.addressLineTwo}
                      aria-describedby={errors.addressLineTwo ? 'billing-address-2-error' : undefined}
                      maxLength={80}
                      placeholder="Apartment, suite, building, etc."
                      className={inputCls}
                    />
                  </Field>
                </div>
              </section>
            </section>
          </div>

          <aside
            ref={summaryRef}
            className="order-first sm:order-none travel-applicant-card travel-selected-plan"
            aria-labelledby="selected-plan-title"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)] dark:text-[#d0e3c8]">
              Your selected plan
            </p>
            {logo && (
              <Image
                src={logo}
                alt={insurer}
                width={160}
                height={64}
                unoptimized
                className="my-5 max-h-16 w-36 rounded-md bg-white object-contain object-left p-1.5"
              />
            )}
            <p className="text-sm text-[var(--text-muted)]">{insurer}</p>
            <h2 id="selected-plan-title" className="mt-2 text-lg font-semibold">
              {planName}
            </h2>

            <dl className="mt-6 space-y-4 border-t border-[var(--border)] pt-5 text-sm">
              <div className="flex justify-between gap-4">
                <dt>
                  {selectedAddons.length ? 'Plan & add-ons' : 'Base plan'} × {total}
                </dt>
                <dd>PHP {money(beforeVat || totalPremium - lgt)}</dd>
              </div>
              {selectedAddons.map((a) => (
                <div key={a.code} className="flex justify-between gap-4 text-[var(--text-muted)]">
                  <dt>{a.name}</dt>
                  <dd className="shrink-0">Included</dd>
                </div>
              ))}
              {!selectedAddons.length && (
                <div className="flex justify-between gap-4 text-[var(--text-muted)]">
                  <dt>Add-ons</dt>
                  <dd>None selected</dd>
                </div>
              )}
              {lgt > 0 && (
                <div className="flex justify-between gap-4">
                  <dt>Local government tax</dt>
                  <dd>PHP {money(lgt)}</dd>
                </div>
              )}
            </dl>

            <div className="mt-6 border-t border-[var(--border)] pt-5" aria-live="polite" aria-atomic="true">
              <p className="text-sm">Total premium</p>
              <p className="mt-1 text-3xl font-semibold">PHP {money(totalPremium)}</p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">For {plural(total, 'traveller')}</p>
            </div>
            <p className="mt-5 text-xs leading-5 text-[var(--text-muted)]">
              Premiums and cover are subject to insurer terms and conditions.
            </p>

            <div className="no-print">
              {expired ? (
                <button
                  type="button"
                  onClick={startNewQuote}
                  className="btn-primary mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 px-5 py-3 text-base font-semibold"
                >
                  Start a new quote
                </button>
              ) : (
                <>
                  <div className="mt-6 flex [&>button]:w-full">{payButton}</div>
                  <button
                    ref={cancelTrigger}
                    type="button"
                    onClick={() => setCancelOpen(true)}
                    aria-haspopup="dialog"
                    className="review-outline-btn mt-3 w-full"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </aside>
        </form>
      </div>

      {!expired && (
        <div className="travel-payment-mobile-bar sm:hidden no-print" role="region" aria-label="Payment total and action">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--text-main)]">PHP {money(totalPremium)}</p>
            <p className="truncate text-xs text-[var(--text-muted)]">Total premium</p>
          </div>
          {payButton}
        </div>
      )}

      <dialog
        ref={cancelRef}
        aria-labelledby="cancel-proposal-title"
        aria-describedby="cancel-proposal-description"
        className="travel-plan-dialog"
        onClick={(e) => e.target === cancelRef.current && setCancelOpen(false)}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="cancel-proposal-title" className="text-xl font-semibold">
            Cancel this proposal?
          </h2>
          <button
            type="button"
            onClick={() => setCancelOpen(false)}
            aria-label="Close dialog"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-md hover:bg-[var(--subtle)] focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <p id="cancel-proposal-description" className="mt-4 text-sm leading-7">
          You can cancel now and return to pay for this proposal within {PROPOSAL_VALIDITY_HOURS} hours of its creation.
        </p>
        <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-7">
          <li>Keep your proposal number so you can retrieve the proposal and resume payment.</li>
          <li>
            Complete payment within {PROPOSAL_VALIDITY_HOURS} hours of creating the proposal. After that, you will need
            to generate a new quote.
          </li>
          <li>
            Generated proposals cannot be edited. To change your trip, plan or traveller details, create a new quote.
          </li>
        </ol>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" autoFocus onClick={() => setCancelOpen(false)} className="review-outline-btn">
            Continue to payment
          </button>
          <button
            type="button"
            onClick={startNewQuote}
            className="btn-primary inline-flex min-h-11 items-center justify-center gap-2 px-5 py-3 text-base font-semibold"
          >
            Cancel for now
          </button>
        </div>
      </dialog>
    </>
  )
}
