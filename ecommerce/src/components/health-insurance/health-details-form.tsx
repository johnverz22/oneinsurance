'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { useForm } from '@tanstack/react-form'
import { Card, CardContent } from '@/components/ui/card'
import {
  type HealthDetailsFormType,
  HealthDetailsFormSchema,
} from '@/types/health-insurance/details-schema'
import { fieldHasError } from '@/utils/form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FieldInfo } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { useHealthCartStore } from '@/store/health-cart-store'
import { getEcho } from '@/lib/echo'
import axios from 'axios'
import { useParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type HealthDetailsFormProps = {
  className?: string
}

function buildPayload(value: HealthDetailsFormType, agentCode?: string) {
  const effectiveDate = new Date(value.effectiveDate)
  const expiryDate = new Date(effectiveDate)
  expiryDate.setFullYear(expiryDate.getFullYear() + 1)
  expiryDate.setDate(expiryDate.getDate() - 1)

  const effectiveISO = effectiveDate.toISOString()
  const expiryISO = expiryDate.toISOString()

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
    PolicyLobList: [
      {
        ProductCode: 'HEALTH',
        PolicyRiskList: [
          {
            ProductElementCode: 'R00001',
            InsuredName: value.insuredName,
            GenderCode: value.genderCode,
            DateOfBirth: value.dateOfBirth,
            IsSmoker: value.isSmoker,
            IsMainInsured: 'Y',
            IsAdultFlag: 'Y',
            PolicyCoverageList: [
              {
                ProductElementCode: 'C0001634',
                EffectiveDate: effectiveISO,
                ExpiryDate: expiryISO,
                SumInsured: 500000,
              },
            ],
          },
        ],
      },
    ],
  }
}

export function HealthDetailsForm({ className }: HealthDetailsFormProps) {
  const { setInsuredInfo, setCompareQuotePlans, setIsLoadingPlans, setPlansError } = useHealthCartStore()
  const params = useParams()
  const agentCode = params['agent-code'] as string
  const echoRef = useRef<any>(null)
  const channelRef = useRef<any>(null)
  const queue = useRef<string[]>([])
  const isProcessing = useRef(false)

  const closeEchoConnection = (channelId: string) => {
    try {
      if (echoRef.current) {
        echoRef.current.leave?.(channelId)
        const connector = echoRef.current?.connector as any
        if (connector?.pusher?.disconnect) connector.pusher.disconnect()
        channelRef.current = null
        echoRef.current = null
      }
    } catch {}
  }

  const fetchPlanByCacheKey = async (cacheKey: string, retries = 2): Promise<any> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await axios.get(
          `/api/health-insurance/load-quote-by-cache?cacheKey=${cacheKey}`
        )
        const data = res.data
        // Empty plans is a valid response (e.g. OONAPH has no plans) — don't retry
        if (!data.success || !data.data?.Plans?.length) return null
        // Inject CarrierCode from parent into each plan (API puts it on data, not on each plan)
        const carrierCode = data.data.CarrierCode ?? ''
        data.data.Plans = data.data.Plans.map((plan: any) => ({
          ...plan,
          CarrierCode: plan.CarrierCode || carrierCode,
        }))
        return data.data
      } catch (err: any) {
        // Only retry on network errors or 5xx, not 404 (cache not ready yet)
        const status = err?.response?.status
        if (status === 404 || attempt >= retries) return null
        await new Promise(r => setTimeout(r, 1000 * attempt))
      }
    }
    return null
  }

  const processQueue = async () => {
    if (isProcessing.current) {
      // Already processing — new items will be picked up in the current loop
      return
    }
    isProcessing.current = true

    let foundPlans = false

    // Keep looping — wait briefly for any late-arriving cache keys
    let emptyLoops = 0
    while (emptyLoops < 3) {
      if (queue.current.length === 0) {
        // Wait a bit for more events to arrive before giving up
        await new Promise(r => setTimeout(r, 500))
        emptyLoops++
        continue
      }
      emptyLoops = 0 // reset if we got items

      const batch = queue.current.splice(0, 5)
      const results = await Promise.allSettled(
        batch.map((cacheKey) => fetchPlanByCacheKey(cacheKey))
      )
      const successfulPlans = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
        .map((r) => r.value)

      if (successfulPlans.length > 0) {
        const allPlans = successfulPlans.flatMap((p: any) => p.Plans ?? [])
        setCompareQuotePlans(allPlans)
        setIsLoadingPlans(false)
        foundPlans = true
        setTimeout(() => {
          document.getElementById('health-plans-grid')?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
    }

    isProcessing.current = false

    // If no plans found after draining the queue, stop loading
    if (!foundPlans) {
      setIsLoadingPlans(false)
    }
  }

  const form = useForm({
    defaultValues: {
      insuredName: '',
      mobile: '',
      dateOfBirth: '',
      genderCode: '' as 'M' | 'F',
      isSmoker: '' as 'Y' | 'N',
      effectiveDate: '',
      agreedToTerms: false,
    } as HealthDetailsFormType,
    onSubmit: async ({ value }) => {
      try {
        // Reset and show loading, scroll down immediately
        setPlansError(null)
        setCompareQuotePlans([])
        setIsLoadingPlans(true)
        setTimeout(() => {
          document.getElementById('health-plans-grid')?.scrollIntoView({ behavior: 'smooth' })
        }, 100)

        const payload = buildPayload(value, agentCode)
        const res = await fetch('/api/health-insurance/compare-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          const errMsg = errData?.message || errData?.error || 'Unable to load health insurance plans.'
          setIsLoadingPlans(false)
          setPlansError(errMsg)
          return
        }

        const data = await res.json()
        const clientRequestId = data?.data?.ClientRequestId ?? data?.ClientRequestId

        if (!clientRequestId) throw new Error('No ClientRequestId returned')

        // Save insured info
        setInsuredInfo({
          insuredName: value.insuredName,
          mobile: value.mobile,
          dateOfBirth: value.dateOfBirth,
          genderCode: value.genderCode,
          isSmoker: value.isSmoker,
          effectiveDate: value.effectiveDate,
        })

        // Subscribe to WebSocket channel using clientRequestId — same as travel insurance
        const echo = getEcho()
        if (echo.connector.pusher.connection.state !== 'connected') {
          echo.connector.pusher.connect()
        }

        const channel = echo
          .channel(clientRequestId)
          .listen('.insurance.plan.received', (e: any) => {
            const cacheKey = e['cache_key']
            console.log('Health plan received, cache_key:', cacheKey)
            queue.current.push(cacheKey)
            processQueue()
          })

        echoRef.current = echo
        channelRef.current = channel

        // 60s timeout fallback — increased to handle slow connections
        setTimeout(() => {
          const { compareQuotePlans, isLoadingPlans } = useHealthCartStore.getState()
          if (!compareQuotePlans.length && isLoadingPlans) {
            setIsLoadingPlans(false)
            closeEchoConnection(clientRequestId)
            setPlansError('Plans are taking longer than expected. Please try again.')
          }
        }, 60000)

      } catch (err) {
        setIsLoadingPlans(false)
        setPlansError('Something went wrong. Please try again.')
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

        {/* Row 1: Full Name | Email | Phone */}
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <form.Field name="insuredName">
            {(field) => (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Full Name <span className="text-red-500">*</span></Label>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Enter Full Name"
                  className={cn('h-11 rounded-full', { 'border-destructive': fieldHasError(field) })}
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Email Address <span className="text-red-500">*</span></Label>
            <Input placeholder="Enter Email Address" className="h-11 rounded-full" />
          </div>

          <form.Field name="mobile">
            {(field) => (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Phone Number <span className="text-red-500">*</span></Label>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Enter Phone Number"
                  className={cn('h-11 rounded-full', { 'border-destructive': fieldHasError(field) })}
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
        </div>

        {/* Row 2: DOB | Coverage Start */}
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <form.Field name="dateOfBirth">
            {(field) => (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Date of Birth <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className={cn('h-11 rounded-full', { 'border-destructive': fieldHasError(field) })}
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>

          <form.Field name="effectiveDate">
            {(field) => (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Coverage Start Date <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className={cn('h-11 rounded-full', { 'border-destructive': fieldHasError(field) })}
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
        </div>

        {/* Row 3: Gender | Smoker */}
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

        {/* Row 4: Terms + Get Advice */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form.Field name="agreedToTerms">
            {(field) => (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="terms"
                    checked={field.state.value}
                    onCheckedChange={(v) => field.handleChange(v as boolean)}
                    className="data-[state=checked]:border-primary data-[state=checked]:bg-primary h-4 w-4"
                  />
                  <Label htmlFor="terms" className="cursor-pointer text-sm">
                    I agree with the{' '}
                    <Link href="/travel-insurance-terms" target="_blank" className="text-primary font-medium underline underline-offset-4">
                      Terms & Conditions
                    </Link>
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
