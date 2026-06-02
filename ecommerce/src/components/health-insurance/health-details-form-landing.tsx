'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useForm } from '@tanstack/react-form'
import { Card, CardContent } from '@/components/ui/card'
import { type HealthDetailsFormType, HealthDetailsFormSchema } from '@/types/health-insurance/details-schema'
import { fieldHasError } from '@/utils/form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FieldInfo } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { useHealthCartStore } from '@/store/health-cart-store'
import { useHealthAvailStore } from '@/store/health-avail-store'
import { getEcho } from '@/lib/echo'
import axios from 'axios'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function buildPayload(value: HealthDetailsFormType, agentCode?: string) {
  const effectiveDate = new Date(value.effectiveDate)
  const expiryDate = new Date(effectiveDate)
  expiryDate.setMonth(expiryDate.getMonth() + 1)
  const effectiveISO = effectiveDate.toISOString()
  const expiryISO = expiryDate.toISOString()
  const insuredName = `${value.firstName} ${value.lastName}`.trim()
  return {
    AgentCode: agentCode ?? '',
    Slug: 'health-insurance',
    ProductCode: 'HEALTH',
    ProductType: 'CI',
    ProductVersion: '1.0',
    EffectiveDate: effectiveISO,
    ExpiryDate: expiryISO,
    LGT: 50,
    PolicyCustomerList: [{ Mobile: value.mobile }],
    PolicyLobList: [{
      ProductCode: 'HEALTH',
      PolicyRiskList: [{
        ProductElementCode: 'R00001',
        InsuredName: insuredName,
        GenderCode: value.genderCode,
        DateOfBirth: value.dateOfBirth,
        IsSmoker: value.isSmoker,
        IsMainInsured: 'Y',
        IsAdultFlag: 'Y',
        PolicyCoverageList: [{
          ProductElementCode: 'C0001634',
          EffectiveDate: effectiveISO,
          ExpiryDate: expiryISO,
          SumInsured: 500000,
        }],
      }],
    }],
  }
}

export function HealthDetailsFormLanding({ className }: { className?: string }) {
  const params = useParams()
  const router = useRouter()
  const agentCode = params['agent-code'] as string
  const { setInsuredInfo, setCompareQuotePlans, setIsLoadingPlans } = useHealthCartStore()
  const { setStep, resetSteps } = useHealthAvailStore()
  const echoRef = useRef<any>(null)
  const queue = useRef<string[]>([])
  const isProcessing = useRef(false)
  const navigatedRef = useRef(false)

  const fetchPlanByCacheKey = async (cacheKey: string) => {
    try {
      const res = await axios.get(`/api/health-insurance/load-quote-by-cache?cacheKey=${cacheKey}`)
      const data = res.data
      if (!data.success || !data.data?.Plans?.length) return null
      const carrierCode = data.data.CarrierCode ?? ''
      data.data.Plans = data.data.Plans.map((plan: any) => ({
        ...plan,
        CarrierCode: plan.CarrierCode || carrierCode,
      }))
      return data.data
    } catch { return null }
  }

  const processQueue = async () => {
    if (isProcessing.current) return
    isProcessing.current = true
    while (queue.current.length > 0) {
      const batch = queue.current.splice(0, 5)
      const results = await Promise.allSettled(batch.map((k) => fetchPlanByCacheKey(k)))
      const successful = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
        .map((r) => r.value)
      if (successful.length > 0) {
        const allPlans = successful.flatMap((p: any) => p.Plans ?? [])
        setCompareQuotePlans(allPlans)
        setIsLoadingPlans(false)
        // Navigate to avail page at step 0 (plans will be visible there)
        if (!navigatedRef.current) {
          navigatedRef.current = true
          resetSteps()
          router.push(`/${agentCode}/products/health-insurance/avail`)
        }
      }
    }
    isProcessing.current = false
  }

  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      mobile: '',
      dateOfBirth: '',
      genderCode: '' as 'M' | 'F',
      isSmoker: '' as 'Y' | 'N',
      effectiveDate: '',
      agreedToTerms: false,
    } as HealthDetailsFormType,
    onSubmit: async ({ value }) => {
      try {
        navigatedRef.current = false
        setCompareQuotePlans([])
        setIsLoadingPlans(true)

        const payload = buildPayload(value, agentCode)
        const res = await fetch('/api/health-insurance/compare-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to get quote')
        const data = await res.json()
        const clientRequestId = data?.data?.ClientRequestId ?? data?.ClientRequestId
        if (!clientRequestId) throw new Error('No ClientRequestId returned')

        setInsuredInfo({
          firstName: value.firstName,
          lastName: value.lastName,
          insuredName: `${value.firstName} ${value.lastName}`.trim(),
          email: value.email ?? '',
          mobile: value.mobile,
          dateOfBirth: value.dateOfBirth,
          genderCode: value.genderCode,
          isSmoker: value.isSmoker,
          effectiveDate: value.effectiveDate,
          expiryDate: (() => { const d = new Date(value.effectiveDate); d.setMonth(d.getMonth() + 1); return d.toISOString().split('T')[0] })(),
        })

        const echo = getEcho()
        if (echo.connector.pusher.connection.state !== 'connected') {
          echo.connector.pusher.connect()
        }
        echo.channel(clientRequestId).listen('.insurance.plan.received', (e: any) => {
          queue.current.push(e['cache_key'])
          processQueue()
        })
        echoRef.current = echo

        setTimeout(() => {
          const { compareQuotePlans } = useHealthCartStore.getState()
          if (!compareQuotePlans.length) {
            setIsLoadingPlans(false)
            toast.error('Plans are taking longer than expected. Please try again.')
          }
        }, 30000)
      } catch {
        setIsLoadingPlans(false)
        toast.error('Something went wrong. Please try again.')
      }
    },
    validators: { onChange: HealthDetailsFormSchema },
  })

  return (
    <Card className={cn('w-full rounded-2xl border-0 shadow-2xl bg-white', className)}>
      <CardContent className="px-6 pt-6 pb-7 sm:px-8">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900">Get Personalized Advice</h2>
          <p className="text-muted-foreground text-sm">Let our experts recommend the best plan for you</p>
        </div>

        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <form.Field name="firstName">
            {(field) => (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">First Name <span className="text-red-500">*</span></Label>
                <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} placeholder="e.g. Juan" className={cn('h-11 rounded-full', { 'border-destructive': fieldHasError(field) })} />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
          <form.Field name="lastName">
            {(field) => (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Last Name <span className="text-red-500">*</span></Label>
                <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} placeholder="e.g. dela Cruz" className={cn('h-11 rounded-full', { 'border-destructive': fieldHasError(field) })} />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
          <form.Field name="email">
            {(field) => (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Email Address <span className="text-red-500">*</span></Label>
                <Input type="email" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} placeholder="e.g. juan@email.com" className={cn('h-11 rounded-full', { 'border-destructive': fieldHasError(field) })} />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
        </div>

        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <form.Field name="mobile">
            {(field) => (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Phone Number <span className="text-red-500">*</span></Label>
                <div className={cn('flex h-11 items-center overflow-hidden rounded-full border bg-white focus-within:ring-2 focus-within:ring-primary/30', { 'border-destructive': fieldHasError(field) })}>
                  <span className="border-r px-3 text-sm text-gray-500">+63</span>
                  <input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="9171234567"
                    className="h-full flex-1 bg-transparent px-3 text-sm outline-none"
                  />
                </div>
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
          <form.Field name="dateOfBirth">
            {(field) => (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Date of Birth <span className="text-red-500">*</span></Label>
                <Input type="date" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} className={cn('h-11 rounded-full', { 'border-destructive': fieldHasError(field) })} />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
        </div>

        <div className="mb-5 grid gap-4 sm:grid-cols-2">
          <form.Field name="genderCode">
            {(field) => (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Gender <span className="text-red-500">*</span></Label>
                <Select onValueChange={(v) => field.handleChange(v as 'M' | 'F')} value={field.state.value}>
                  <SelectTrigger className={cn('h-11 rounded-full', { 'border-destructive': fieldHasError(field) })}>
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Male</SelectItem>
                    <SelectItem value="F">Female</SelectItem>
                  </SelectContent>
                </Select>
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
          <form.Field name="isSmoker">
            {(field) => (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Do you smoke? <span className="text-red-500">*</span></Label>
                <Select onValueChange={(v) => field.handleChange(v as 'Y' | 'N')} value={field.state.value}>
                  <SelectTrigger className={cn('h-11 rounded-full', { 'border-destructive': fieldHasError(field) })}>
                    <SelectValue placeholder="Select Smoking Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="N">No</SelectItem>
                    <SelectItem value="Y">Yes</SelectItem>
                  </SelectContent>
                </Select>
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
        </div>

        <div className="mb-5 grid gap-4 sm:grid-cols-2">
          <form.Field name="effectiveDate">
            {(field) => (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Coverage Start Date <span className="text-red-500">*</span></Label>
                <Input type="date" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} className={cn('h-11 rounded-full', { 'border-destructive': fieldHasError(field) })} />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
          <form.Subscribe selector={(s) => s.values.effectiveDate}>
            {(effectiveDate) => {
              const getExp = (d: string) => { if (!d) return ''; const x = new Date(d); x.setMonth(x.getMonth() + 1); return x.toISOString().split('T')[0] }
              return (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Expiry Date</Label>
                  <Input type="date" value={getExp(effectiveDate)} readOnly className="h-11 rounded-full bg-gray-50" />
                </div>
              )
            }}
          </form.Subscribe>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form.Field name="agreedToTerms">
            {(field) => (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Checkbox id="terms-landing" checked={field.state.value} onCheckedChange={(v) => field.handleChange(v as boolean)} className="data-[state=checked]:border-primary data-[state=checked]:bg-primary h-4 w-4" />
                  <Label htmlFor="terms-landing" className="cursor-pointer text-sm">
                    I agree with the{' '}
                    <Link href="/travel-insurance-terms" target="_blank" className="text-primary font-medium underline underline-offset-4">Terms & Conditions</Link>
                  </Label>
                </div>
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
          <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                disabled={!canSubmit || !!isSubmitting}
                onClick={(e) => { e.preventDefault(); form.handleSubmit() }}
                className="from-primary to-accent h-11 w-full rounded-full bg-gradient-to-r px-10 text-sm font-semibold text-white sm:w-auto"
              >
                {isSubmitting ? 'Searching...' : 'Get Advice'}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </CardContent>
    </Card>
  )
}
