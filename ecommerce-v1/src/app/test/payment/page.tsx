'use client'

import { useState } from 'react'
import { PaymentBrand, PaymentSubmitRequest } from '@/types/payment'
import PaymentBrands, {
  CardPaymentBrands,
  DigitalPaymentBrands,
} from '@/components/payment/payment-brands'
import { CardPaymentForm } from '@/components/payment/card-payment-form'
import { DigitalPaymentForm } from '@/components/payment/digital-payment-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CreditCard,
  Smartphone,
  ShoppingCart,
  ArrowRight,
  Shield,
  CheckCircle,
} from 'lucide-react'
import { usePaymentAuth, usePaymentSubmit } from '@/app/data/mutations/payment'
import {
  generateTransactionId,
  type PaymentRequestConfig,
} from '@/utils/payment-mappers'
import { toast } from 'sonner'

/**
 * Temporary test page for DLT payment integration.
 * Accessible at /test/payment
 * Allows testing card and e-wallet payment flows with a configurable dummy amount.
 */
export default function TestPaymentPage() {
  const [amount, setAmount] = useState(100)
  const [selectedBrand, setSelectedBrand] = useState<PaymentBrand | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'all' | 'cards' | 'digital'>('all')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [logs, setLogs] = useState<string[]>([])

  const { mutateAsync: getPaymentAuth } = usePaymentAuth()
  const { mutateAsync: submitPayment } = usePaymentSubmit()

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])
  }

  // Fake full quote response for form pre-fill
  const mockFullQuoteResponse = {
    PolicyCustomerList: [
      {
        FirstName: 'Juan',
        LastName: 'Dela Cruz',
        Email: 'juan.delacruz@test.com',
        City: '',
        AddrProvince: '',
        PostCode: '1200',
        AddressLine1: '123 Rizal Street',
        AddressLine2: 'Brgy. Poblacion',
      },
    ],
  }

  const paymentConfig: PaymentRequestConfig = {
    // merchant_account_id and service_code are injected server-side by the BFF
    merchantTransactionId: generateTransactionId(),
    productReferenceId: 'TEST-REF-001',
    productDescription: 'Payment Integration Test',
    amount,
    currency: 'PHP',
    successUrl: typeof window !== 'undefined' ? `${window.location.origin}/test/payment?status=success` : '',
    failureUrl: typeof window !== 'undefined' ? `${window.location.origin}/test/payment?status=failure` : '',
  }

  const handleBrandSelect = (brand: PaymentBrand) => {
    setSelectedBrand(brand)
    setResult(null)
    addLog(`Selected brand: ${brand.value} (${brand.is_card ? 'Card' : 'Digital Wallet'})`)
  }

  const handleCardPaymentSubmit = async (paymentRequest: PaymentSubmitRequest) => {
    setIsProcessing(true)
    setResult(null)
    addLog('Starting card payment submission...')

    try {
      const paymentId = generateTransactionId()
      addLog(`Generated transaction ID: ${paymentId}`)

      addLog('Getting auth token...')
      const authResponse = await getPaymentAuth()
      if (!authResponse?.access_token) {
        addLog('❌ Auth failed — no access_token returned')
        toast.error('Payment authentication failed.')
        return
      }
      addLog('✅ Auth token obtained')

      addLog('Submitting card payment to DLT...')
      const paymentResult = await submitPayment({
        data: {
          ...paymentRequest,
          merchant_transaction_id: paymentId,
        },
        brand_token: authResponse.access_token,
      })

      addLog(`✅ Response: ${JSON.stringify(paymentResult, null, 2)}`)
      setResult(paymentResult)

      if (paymentResult?.success && paymentResult.data.payment_status === 'PAID') {
        toast.success('Payment successful! Status: PAID')
      } else if (paymentResult?.data?.payment_status === 'PENDING') {
        toast.info('Payment pending. Status: PENDING')
      } else if (paymentResult?.data?.payment_status === 'REJECTED') {
        toast.error('Payment rejected.')
      } else {
        toast.warning(`Response: ${paymentResult?.message}`)
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Unknown error'
      addLog(`❌ Error: ${msg}`)
      setResult({ error: msg, raw: error.response?.data })
      toast.error(msg)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDigitalPaymentSubmit = async (paymentRequest: PaymentSubmitRequest) => {
    setIsProcessing(true)
    setResult(null)
    addLog('Starting digital/e-wallet payment submission...')

    try {
      const paymentId = generateTransactionId()
      addLog(`Generated transaction ID: ${paymentId}`)

      addLog('Getting auth token...')
      const authResponse = await getPaymentAuth()
      if (!authResponse?.access_token) {
        addLog('❌ Auth failed — no access_token returned')
        toast.error('Payment authentication failed.')
        return
      }
      addLog('✅ Auth token obtained')

      addLog('Submitting digital payment to DLT...')
      const paymentResult = await submitPayment({
        data: {
          ...paymentRequest,
          merchant_transaction_id: paymentId,
        },
        brand_token: authResponse.access_token,
      })

      addLog(`✅ Response: ${JSON.stringify(paymentResult, null, 2)}`)
      setResult(paymentResult)

      if (paymentResult?.success && paymentResult.data.payment_url) {
        toast.success('Redirect URL received! Opening in new tab...')
        addLog(`Redirect URL: ${paymentResult.data.payment_url}`)
        // Open in new tab so we don't lose the test page
        window.open(paymentResult.data.payment_url, '_blank')
      } else if (paymentResult?.data?.payment_status === 'REJECTED') {
        toast.error('Payment rejected.')
      } else {
        toast.warning(`Response: ${paymentResult?.message}`)
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Unknown error'
      addLog(`❌ Error: ${msg}`)
      setResult({ error: msg, raw: error.response?.data })
      toast.error(msg)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="rounded-lg border-2 border-dashed border-orange-300 bg-orange-50 p-4">
          <h1 className="text-2xl font-bold text-orange-800">
            🧪 DLT Payment Test Page
          </h1>
          <p className="text-sm text-orange-600">
            Temporary page to test the DLT payment gateway integration. Remove before deploying to production.
          </p>
        </div>

        {/* Amount Config */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Test Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="test-amount">Amount (PHP)</Label>
                <Input
                  id="test-amount"
                  type="number"
                  min={1}
                  max={99999}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-40"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Amount: ₱{amount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Brand Selection */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Select Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedBrand && (
                  <div className="mb-4 flex items-center justify-between rounded-lg border border-success/50 bg-success/10 p-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <div className="flex items-center gap-2">
                        <img src={selectedBrand.image} alt={selectedBrand.value} className="h-6 w-10 object-contain" />
                        <span className="font-medium">{selectedBrand.value}</span>
                        <span className="text-xs text-muted-foreground">
                          ({selectedBrand.is_card ? 'Card' : 'Digital'})
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSelectedBrand(null)}>
                      Change
                    </Button>
                  </div>
                )}

                <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">
                      <ShoppingCart className="mr-1 h-4 w-4" /> All
                    </TabsTrigger>
                    <TabsTrigger value="cards">
                      <CreditCard className="mr-1 h-4 w-4" /> Cards
                    </TabsTrigger>
                    <TabsTrigger value="digital">
                      <Smartphone className="mr-1 h-4 w-4" /> Wallets
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="all" className="mt-4">
                    <PaymentBrands onBrandSelect={handleBrandSelect} selectedBrand={selectedBrand} />
                  </TabsContent>
                  <TabsContent value="cards" className="mt-4">
                    <CardPaymentBrands onBrandSelect={handleBrandSelect} selectedBrand={selectedBrand} />
                  </TabsContent>
                  <TabsContent value="digital" className="mt-4">
                    <DigitalPaymentBrands onBrandSelect={handleBrandSelect} selectedBrand={selectedBrand} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right: Payment Form */}
          <div className="space-y-4">
            {!selectedBrand ? (
              <Card className="flex min-h-[400px] items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <ArrowRight className="mx-auto mb-3 h-12 w-12 rotate-180" />
                  <p className="font-medium">Select a payment method to begin</p>
                </div>
              </Card>
            ) : selectedBrand.is_card ? (
              <CardPaymentForm
                selectedBrand={selectedBrand}
                onSubmit={handleCardPaymentSubmit}
                isLoading={isProcessing}
                className="max-w-none"
                paymentConfig={paymentConfig}
                fullQuoteResponse={mockFullQuoteResponse as any}
              />
            ) : (
              <DigitalPaymentForm
                selectedBrand={selectedBrand}
                onSubmit={handleDigitalPaymentSubmit}
                isLoading={isProcessing}
                className="max-w-none"
                paymentConfig={paymentConfig}
                fullQuoteResponse={mockFullQuoteResponse as any}
              />
            )}
          </div>
        </div>

        {/* Logs & Result */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Request Logs</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setLogs([])}>
              Clear
            </Button>
          </CardHeader>
          <CardContent>
            <div className="max-h-60 overflow-y-auto rounded bg-gray-900 p-3 font-mono text-xs text-success">
              {logs.length === 0 ? (
                <p className="text-muted-foreground">No activity yet. Select a brand and submit a payment to see logs.</p>
              ) : (
                logs.map((log, i) => <div key={i}>{log}</div>)
              )}
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                DLT Response {result.success ? '✅' : '❌'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-80 overflow-auto rounded bg-gray-900 p-3 font-mono text-xs text-white">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
