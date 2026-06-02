'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CreditCard, Smartphone, ShoppingCart, CheckCircle, Loader2, Shield, ArrowRight, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import PaymentBrands, { CardPaymentBrands, DigitalPaymentBrands } from '@/components/payment/payment-brands'
import { PaymentBrand } from '@/types/payment'
import { usePaymentAuth, usePaymentSubmit } from '@/app/data/mutations/payment'
import { usePaymentPolling } from '@/hooks/use-payment-polling'
import { generateTransactionId, mapCardPaymentToRequest, mapDigitalPaymentToRequest, type PaymentRequestConfig } from '@/utils/payment-mappers'
import { useHealthCartStore } from '@/store/health-cart-store'
import { useHealthAvailStore } from '@/store/health-avail-store'
import { COUNTRIES } from '@/constants/countries'
import { HealthSuccessTabs } from './health-success-tabs'
import type { PersonalInfoData } from './health-personal-info-form'

interface Props {
  personalInfo: PersonalInfoData
  agentCode: string
}

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 20 }, (_, i) => currentYear + i)
const MONTHS = ['01','02','03','04','05','06','07','08','09','10','11','12']

export function HealthPaymentStep({ personalInfo, agentCode }: Props) {
  const router = useRouter()
  const { items, clearCart, proposalNo, duePremium } = useHealthCartStore()
  const { prevStep } = useHealthAvailStore()

  const [selectedBrand, setSelectedBrand] = useState<PaymentBrand | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'all' | 'cards' | 'digital'>('all')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isAwaitingPayment, setIsAwaitingPayment] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showCvv, setShowCvv] = useState(false)
  const [policyNo, setPolicyNo] = useState<string | null>(null)
  const isProcessingQuoteRef = useRef(false)

  // Card fields — pre-filled from personalInfo
  const [cardNumber, setCardNumber] = useState('')
  const [cardholderName, setCardholderName] = useState(`${personalInfo.firstName ?? ''} ${personalInfo.lastName ?? ''}`.trim().toUpperCase())
  const [expiryMonth, setExpiryMonth] = useState('')
  const [expiryYear, setExpiryYear] = useState('')
  const [cvv, setCvv] = useState('')

  // Personal details — pre-filled
  const [firstName, setFirstName] = useState(personalInfo.firstName ?? '')
  const [lastName, setLastName] = useState(personalInfo.lastName ?? '')
  const [email, setEmail] = useState(personalInfo.email)
  const [phone, setPhone] = useState(personalInfo.phone)

  // Billing address — pre-filled
  const [country, setCountry] = useState('PH')
  const [province, setProvince] = useState(personalInfo.province)
  const [city, setCity] = useState(personalInfo.city)
  const [postalCode, setPostalCode] = useState(personalInfo.postCode)
  const [addressLine1, setAddressLine1] = useState(personalInfo.addressLine1)
  const [addressLine2, setAddressLine2] = useState(personalInfo.addressLine2 || 'N/A')

  const [errors, setErrors] = useState<Record<string, string>>({})

  const { mutateAsync: getPaymentAuth } = usePaymentAuth()
  const { mutateAsync: submitPayment } = usePaymentSubmit()

  // Use DuePremium from full-quote if available, otherwise fall back to cart items
  const cartTotal = items.reduce((sum, i) => sum + i.premium * i.quantity, 0)
  const grandTotal = duePremium ?? cartTotal

  const { startPolling } = usePaymentPolling({
    proposalNumber: proposalNo ?? '',
    onSuccess: async () => {
      if (isProcessingQuoteRef.current) return
      isProcessingQuoteRef.current = true
      try {
        const firstItem = items[0]
        const issueRes = await fetch('/api/health-insurance/issue-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ProposalNo: proposalNo,
            CustomField: { PlanName: firstItem?.planName ?? '', PaymentBrand: selectedBrand?.value ?? 'VISA' },
          }),
        })
        if (issueRes.ok) {
          const issueData = await issueRes.json()
          // Extract CarrierPolicyNo from the issue-quote response (same as travel)
          const carrierPolicyNo = issueData?.data?.CarrierPolicyNo || null
          setPolicyNo(carrierPolicyNo)
          setIsAwaitingPayment(false)
          setShowSuccess(true)
        } else {
          // Payment succeeded but issue-quote failed — redirect to error page with proposal number
          setIsAwaitingPayment(false)
          router.push(`/${agentCode}/products/health-insurance/payment-error`)
        }
      } catch {
        // Same — payment succeeded but something went wrong after — redirect to error page
        setIsAwaitingPayment(false)
        router.push(`/${agentCode}/products/health-insurance/payment-error`)
      } finally {
        isProcessingQuoteRef.current = false
        setIsProcessing(false)
      }
    },
    onError: () => {
      setIsAwaitingPayment(false)
      setIsProcessing(false)
      if (proposalNo) router.push(`/${agentCode}/products/health-insurance/payment-error`)
      else toast.error('Payment failed. Please try again.')
    },
    onTimeout: () => {
      setIsAwaitingPayment(false)
      setIsProcessing(false)
      if (proposalNo) router.push(`/${agentCode}/products/health-insurance/payment-error`)
      else toast.error('Payment verification timed out.')
    },
  })

  const formatCardNumber = (v: string) => v.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ')

  const validateAndPay = async () => {
    if (!selectedBrand) { toast.error('Please select a payment method.'); return }
    const e: Record<string, string> = {}
    if (selectedBrand.is_card) {
      if (!cardNumber.trim()) e.cardNumber = 'Card number is required'
      if (!cardholderName.trim()) e.cardholderName = 'Cardholder name is required'
      if (!expiryMonth) e.expiryMonth = 'Select month'
      if (!expiryYear) e.expiryYear = 'Select year'
      if (!cvv.trim()) e.cvv = 'CVV is required'
    }
    if (!firstName.trim()) e.firstName = 'First name is required'
    if (!lastName.trim()) e.lastName = 'Last name is required'
    if (!email.trim()) e.email = 'Email is required'
    if (!province.trim()) e.province = 'Province is required'
    if (!city.trim()) e.city = 'City is required'
    if (!postalCode.trim()) e.postalCode = 'Postal code is required'
    if (!addressLine1.trim()) e.addressLine1 = 'Address line 1 is required'
    setErrors(e)
    if (Object.keys(e).length > 0) return

    if (!proposalNo) { toast.error('No proposal found. Please go back.'); return }
    setIsProcessing(true)
    try {
      const authResponse = await getPaymentAuth()
      if (!authResponse?.access_token) { toast.error('Payment authentication failed.'); setIsProcessing(false); return }

      const isCard = selectedBrand.is_card

      const paymentConfig: PaymentRequestConfig = {
        merchantAccountId: process.env.NEXT_PUBLIC_MERCHANT_ACCOUNT_ID || 'MER941055560216',
        merchantTransactionId: generateTransactionId(),
        productReferenceId: proposalNo,
        productDescription: `Health Insurance - ${items[0]?.planName ?? ''}`,
        amount: grandTotal,
        currency: 'PHP',
        description: 'Health Insurance Premium',
        callbackUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/${agentCode}/products/health-insurance/avail`,
        other_reference_1: proposalNo,
        other_reference_1_caption: 'proposal',
      }

      const formData = {
        firstName,
        lastName,
        email: email.trim().toLowerCase(),
        phone: phone ? `+63${phone.replace(/^(\+63|0)/, '')}` : '',
        addressLineOne: addressLine1.trim(),
        addressLineTwo: addressLine2.trim() || '',
        cityMunicipality: city.trim(),
        stateProvinceRegion: province.trim(),
        postalCode: postalCode.trim(),
        country,
      }

      const mappedPayload = isCard
        ? mapCardPaymentToRequest(
            { ...formData, cardNumber, cardholderName, expiryMonth, expiryYear, ccv: cvv },
            selectedBrand,
            paymentConfig
          )
        : mapDigitalPaymentToRequest(
            { ...formData, phoneNumber: formData.phone },
            selectedBrand,
            paymentConfig
          )

      const paymentResult = await submitPayment({
        data: mappedPayload,
        brand_token: authResponse.access_token,
      })

      if (!paymentResult?.success || !(paymentResult as any)?.data?.status_code?.includes('OK')) {
        toast.error(paymentResult?.message ?? 'Payment submission failed.')
        setIsProcessing(false)
        return
      }

      const redirectUrl = (paymentResult as any)?.data?.redirect_url
      if (redirectUrl) { localStorage.setItem('health_proposal_no', proposalNo); window.location.href = redirectUrl; return }

      setIsAwaitingPayment(true)
      startPolling()
    } catch (err) {
      console.error('Payment error:', err)
      toast.error('Payment failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const [showInlineInvoice, setShowInlineInvoice] = useState(false)

  const handleViewInvoice = () => {
    setShowSuccess(false)
    setShowInlineInvoice(true)
  }

  const err = (key: string) => errors[key] ? <p className="mt-1 text-xs text-red-500">{errors[key]}</p> : null

  // Inline success with Cover Note & Invoice (like travel insurance)
  if (showInlineInvoice) {
    const insuredName = `${personalInfo.firstName ?? ''} ${personalInfo.lastName ?? ''}`.trim()
    const firstItem = items[0]
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-8">
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <h1 className="text-primary text-3xl font-bold">Payment Successful!</h1>
          <p className="text-lg text-gray-600">Your health insurance policy has been successfully issued.</p>
        </div>

        {/* Tabs — Cover Note / Invoice Details */}
        <HealthSuccessTabs
          proposalNo={proposalNo ?? ''}
          policyNo={policyNo}
          insuredName={insuredName}
          email={email}
          provider={firstItem?.provider || 'N/A'}
          planName={firstItem?.planName || 'Health Insurance'}
          grandTotal={grandTotal}
        />

        <div className="flex justify-center">
          <Button className="from-primary to-accent rounded-full bg-gradient-to-r px-8 text-white" onClick={() => { clearCart(); window.location.href = `/${agentCode}/products/health-insurance` }}>
            Buy New Health Insurance
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <Card className="overflow-hidden p-0 pb-0 shadow-none">
        <CardHeader className="flex items-center justify-between border-b pt-6">
          <div className="flex-1">
            <h2 className="from-primary to-primary/80 bg-gradient-to-r bg-clip-text text-2xl font-black text-transparent">
              Choose Your Payment Method
            </h2>
            <p className="text-muted-foreground text-sm">Select which payment you will use</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-muted-foreground text-xs">Total Amount</p>
            <p className="text-primary text-2xl font-bold">
              ₱{grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </CardHeader>
      </Card>

      {/* Main 2-col layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left — Payment brand tabs */}
        <div className="space-y-4">
          <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="flex items-center gap-1.5"><ShoppingCart className="h-4 w-4" />All Methods</TabsTrigger>
              <TabsTrigger value="cards" className="flex items-center gap-1.5"><CreditCard className="h-4 w-4" />Cards</TabsTrigger>
              <TabsTrigger value="digital" className="flex items-center gap-1.5"><Smartphone className="h-4 w-4" />Digital Wallets</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <Card><CardContent className="pt-4">
                <p className="mb-3 font-semibold text-gray-800">All Payment Options</p>
                <PaymentBrands onBrandSelect={setSelectedBrand} selectedBrand={selectedBrand} className="grid-cols-3" />
              </CardContent></Card>
            </TabsContent>
            <TabsContent value="cards" className="mt-4">
              <Card><CardContent className="pt-4">
                <p className="mb-3 font-semibold text-gray-800">Credit & Debit Cards</p>
                <CardPaymentBrands onBrandSelect={setSelectedBrand} selectedBrand={selectedBrand} className="grid-cols-3" />
              </CardContent></Card>
            </TabsContent>
            <TabsContent value="digital" className="mt-4">
              <Card><CardContent className="pt-4">
                <p className="mb-3 font-semibold text-gray-800">Digital Wallets & E-Money</p>
                <DigitalPaymentBrands onBrandSelect={setSelectedBrand} selectedBrand={selectedBrand} className="grid-cols-3" />
              </CardContent></Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right — Form */}
        <div className="space-y-4">
          {!selectedBrand ? (
            <Card className="min-h-[300px]">
              <CardContent className="flex h-full items-center justify-center p-8">
                <div className="space-y-3 text-center">
                  <div className="bg-primary/10 mx-auto flex h-20 w-20 items-center justify-center rounded-full">
                    <ArrowRight className="text-accent h-10 w-10 rotate-180" />
                  </div>
                  <h3 className="text-primary text-lg font-semibold">Select Payment Method</h3>
                  <p className="text-muted-foreground text-sm">Choose from the options on the left</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Pay with [Brand] header */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3">
                    <div className="flex h-8 w-12 items-center justify-center rounded border bg-white p-1">
                      <img src={selectedBrand.image} alt={selectedBrand.value} className="h-full w-full object-contain" />
                    </div>
                    <div>
                      <p className="text-base font-semibold">Pay with {selectedBrand.value}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Shield className="h-3 w-3" />Secure payment processing
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
              </Card>

              {selectedBrand.is_card && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CreditCard className="h-4 w-4" />Card Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Card Number</Label>
                      <Input value={cardNumber} onChange={(e) => { setCardNumber(formatCardNumber(e.target.value)); setErrors(p => ({...p, cardNumber: ''})) }} placeholder="1234 5678 9012 3456" maxLength={19} className={`h-11 ${errors.cardNumber ? 'border-red-500' : ''}`} />
                      {err('cardNumber')}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Card Holder Name</Label>
                      <Input value={cardholderName} onChange={(e) => { setCardholderName(e.target.value.toUpperCase()); setErrors(p => ({...p, cardholderName: ''})) }} placeholder="JUAN DELA CRUZ" className={`h-11 uppercase ${errors.cardholderName ? 'border-red-500' : ''}`} />
                      {err('cardholderName')}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Expires On</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Select value={expiryMonth} onValueChange={(v) => { setExpiryMonth(v); setErrors(p => ({...p, expiryMonth: ''})) }}>
                            <SelectTrigger className={`h-11 ${errors.expiryMonth ? 'border-red-500' : ''}`}><SelectValue placeholder="MM" /></SelectTrigger>
                            <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                          </Select>
                          <Select value={expiryYear} onValueChange={(v) => { setExpiryYear(v); setErrors(p => ({...p, expiryYear: ''})) }}>
                            <SelectTrigger className={`h-11 ${errors.expiryYear ? 'border-red-500' : ''}`}><SelectValue placeholder="YYYY" /></SelectTrigger>
                            <SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        {err('expiryMonth')}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1">CVV <Shield className="h-3 w-3 text-gray-400" /></Label>
                        <div className="relative">
                          <Input value={cvv} onChange={(e) => { setCvv(e.target.value); setErrors(p => ({...p, cvv: ''})) }} type={showCvv ? 'text' : 'password'} placeholder="123" maxLength={4} className={`h-11 pr-10 ${errors.cvv ? 'border-red-500' : ''}`} />
                          <Button type="button" variant="ghost" size="sm" className="absolute top-0 right-0 h-full px-3" onClick={() => setShowCvv(!showCvv)}>
                            {showCvv ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        {err('cvv')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Personal Details */}
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Personal Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>First Name</Label>
                      <Input value={firstName} onChange={(e) => { setFirstName(e.target.value); setErrors(p => ({...p, firstName: ''})) }} placeholder="Juan" className={`h-11 ${errors.firstName ? 'border-red-500' : ''}`} />
                      {err('firstName')}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Last Name</Label>
                      <Input value={lastName} onChange={(e) => { setLastName(e.target.value); setErrors(p => ({...p, lastName: ''})) }} placeholder="Dela Cruz" className={`h-11 ${errors.lastName ? 'border-red-500' : ''}`} />
                      {err('lastName')}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email Address</Label>
                    <Input value={email} onChange={(e) => { setEmail(e.target.value); setErrors(p => ({...p, email: ''})) }} type="email" placeholder="juan@example.com" className={`h-11 ${errors.email ? 'border-red-500' : ''}`} />
                    {err('email')}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone Number (Optional)</Label>
                    <div className="relative">
                      <div className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-gray-500">+63</div>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9XX XXX XXXX" className="h-11 pl-12" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Billing Address */}
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Billing Address</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Country</Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>State/Province/Region</Label>
                      <Input value={province} onChange={(e) => { setProvince(e.target.value); setErrors(p => ({...p, province: ''})) }} placeholder="Metro Manila" className={`h-11 ${errors.province ? 'border-red-500' : ''}`} />
                      {err('province')}
                    </div>
                    <div className="space-y-1.5">
                      <Label>City/Municipality</Label>
                      <Input value={city} onChange={(e) => { setCity(e.target.value); setErrors(p => ({...p, city: ''})) }} placeholder="Manila" className={`h-11 ${errors.city ? 'border-red-500' : ''}`} />
                      {err('city')}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Postal Code</Label>
                    <Input value={postalCode} onChange={(e) => { setPostalCode(e.target.value.replace(/\D/g,'')); setErrors(p => ({...p, postalCode: ''})) }} placeholder="1000" className={`h-11 ${errors.postalCode ? 'border-red-500' : ''}`} inputMode="numeric" />
                    {err('postalCode')}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Address Line 1</Label>
                    <Input value={addressLine1} onChange={(e) => { setAddressLine1(e.target.value); setErrors(p => ({...p, addressLine1: ''})) }} placeholder="123 Main Street" className={`h-11 ${errors.addressLine1 ? 'border-red-500' : ''}`} />
                    {err('addressLine1')}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Address Line 2</Label>
                    <Input value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} placeholder="Apartment, suite, etc." className="h-11" />
                  </div>
                </CardContent>
              </Card>

              {/* Complete Payment button */}
              <Button
                size="lg"
                className="from-primary to-accent w-full rounded-full bg-gradient-to-r font-semibold text-white"
                onClick={validateAndPay}
                disabled={isProcessing || isAwaitingPayment}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Processing...</span>
                ) : isAwaitingPayment ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Verifying Payment...</span>
                ) : (
                  <span className="flex items-center gap-2"><Lock className="h-4 w-4" />Complete Payment</span>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Back button */}
      <div className="mt-6">
        <Button type="button" size="lg" variant="outline" className="rounded-full px-12 font-semibold" onClick={prevStep}>
          <ArrowLeft className="mr-2 h-4 w-4" />Back to Review
        </Button>
      </div>

      {/* Success Dialog — matching travel's AppPopup styling */}
      <Dialog open={showSuccess} onOpenChange={() => {}}>
        <DialogContent className="max-w-md rounded-3xl p-8 text-center" showCloseButton={false} onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader className="items-center">
            <div className="relative mx-auto mb-6 h-32 w-32 rounded-full bg-emerald-50 p-6">
              <CheckCircle className="text-primary h-full w-full" strokeWidth={1.5} />
            </div>
            <DialogTitle className="text-foreground text-xl font-semibold md:text-2xl">Payment Successful!</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm font-medium">
              Your policy details have been confirmed and recorded in our system.
            </DialogDescription>
            <p className="text-muted-foreground text-sm font-medium">
              Please note that this serves as a cover note only. The official policy document, which is the legally binding proof of coverage, will be issued directly by the insurance carrier and be made available to you shortly.
            </p>
          </DialogHeader>
          <button
            onClick={handleViewInvoice}
            className="from-primary to-primary/80 hover:from-primary/80 hover:to-primary w-full rounded-2xl bg-gradient-to-r px-6 py-4 text-lg font-semibold text-white transition-all"
          >
            Done
          </button>
        </DialogContent>
      </Dialog>
    </>
  )
}
