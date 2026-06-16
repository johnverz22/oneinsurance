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
    PolicyLobList: [
      {
        ProductCode: 'HEALTH',
        PolicyRiskList: [
          {
            ProductElementCode: 'R00001',
            InsuredName: insuredName,
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

/** Calculate duration text between two dates */
function getDurationText(effectiveDateStr: string, expiryDateStr?: string): string {
  if (!effectiveDateStr) return ''
  const effective = new Date(effectiveDateStr)
  let expiry: Date
  if (expiryDateStr) {
    expiry = new Date(expiryDateStr)
  } else {
    expiry = new Date(effective)
    expiry.setFullYear(expiry.getFullYear() + 1)
    expiry.setDate(expiry.getDate() - 1)
  }
  const diffMs = expiry.getTime() - effective.getTime()
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24))
  if (days <= 0) return ''
  if (days >= 365) return `${days} days (1 year)`
  return `${days} days`
}

// Compute default expiry (1 year from start date)
function getDefaultExpiry(startDate: string): string {
  if (!startDate) return ''
  const d = new Date(startDate)
  d.setFullYear(d.getFullYear() + 1)
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

export function HealthDetailsForm({ className }: HealthDetailsFormProps) {
  const { setInsuredInfo, setCompareQuotePlans, setIsLoadingPlans, setPlansError } = useHealthCartStore()
  const params = useParams()
  const agentCode = params['agent-code'] as string
  const echoRef = useRef<any>(null)
  const channelRef = useRef<any>(null)
  const queue = useRef<string[]>([])
  const isProcessing = useRef(false)
  const fallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Track which cache keys have already been fetched successfully
  const fetchedKeysRef = useRef<Set<string>>(new Set())

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

  const fetchPlanByCacheKey = async (cacheKey: string): Promise<any> => {
    try {
      const res = await axios.get(
        `/api/health-insurance/load-quote-by-cache?cacheKey=${cacheKey}`
      )
      const data = res.data
      if (!data.success || !data.data?.Plans?.length) return null
      const carrierCode = data.data.CarrierCode ?? ''
      data.data.Plans = data.data.Plans.map((plan: any) => ({
        ...plan,
        CarrierCode: plan.CarrierCode || carrierCode,
      }))
      return data.data
    } catch {
      return null
    }
  }

  const processQueue = async () => {
    if (isProcessing.current) return
    isProcessing.current = true

    const batch = queue.current.splice(0, queue.current.length)
    const newKeys = batch.filter(k => !fetchedKeysRef.current.has(k))

    if (newKeys.length === 0) {
      isProcessing.current = false
      return
    }

    const results = await Promise.allSettled(
      newKeys.map((cacheKey) => fetchPlanByCacheKey(cacheKey))
    )

    const newPlans: any[] = []
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled' && r.value !== null) {
        fetchedKeysRef.current.add(newKeys[idx])
        newPlans.push(...(r.value.Plans ?? []))
      }
    })

    if (newPlans.length > 0) {
      const existing = useHealthCartStore.getState().compareQuotePlans
      setCompareQuotePlans([...existing, ...newPlans])
      setIsLoadingPlans(false)
      setTimeout(() => {
        document.getElementById('health-plans-grid')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
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
      effectiveDate: new Date().toISOString().split('T')[0],
      agreedToTerms: false,
    } as HealthDetailsFormType,
    onSubmit: async ({ value }) => {
      try {
        setPlansError(null)
        setCompareQuotePlans([])
        setIsLoadingPlans(true)
        fetchedKeysRef.current = new Set()
        queue.current = []
        isProcessing.current = false
        setTimeout(() => {
          document.getElementById('health-plans-grid')?.scrollIntoView({ behavior: 'smooth' })
        }, 100)

        const payload = buildPayload(value, agentCode)

        const echo = getEcho()
        if (echo.connector.pusher.connection.state !== 'connected') {
          echo.connector.pusher.connect()
          await new Promise(r => setTimeout(r, 300))
        }
        echoRef.current = echo

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
        const supportedCarriers: string[] = data?.data?.SupportedCarrier ?? []

        if (!clientRequestId) throw new Error('No ClientRequestId returned')

        // Save insured info
        setInsuredInfo({
          firstName: value.firstName,
          lastName: value.lastName,
          insuredName: `${value.firstName} ${value.lastName}`.trim(),
          email: value.email,
          mobile: value.mobile,
          dateOfBirth: value.dateOfBirth,
          genderCode: value.genderCode,
          isSmoker: value.isSmoker,
          effectiveDate: value.effectiveDate,
          expiryDate: getDefaultExpiry(value.effectiveDate),
        })

        const channel = echo
          .channel(clientRequestId)
          .listen('.insurance.plan.received', (e: any) => {
            const cacheKey = e['cache_key']
            queue.current.push(cacheKey)
            processQueue()
          })

        channelRef.current = channel

        // Fallback poll at 3s in case WebSocket is delayed
        // Always include PACIFIC since SupportedCarrier from backend can be inconsistent
        const carriers = Array.from(new Set(['PACIFIC', ...supportedCarriers, 'OONAPH']))

        setTimeout(() => {
          if (useHealthCartStore.getState().isLoadingPlans) {
            for (const carrier of carriers) {
              const cacheKey = `${carrier}_${clientRequestId}`
              if (!fetchedKeysRef.current.has(cacheKey)) {
                queue.current.push(cacheKey)
              }
            }
            processQueue()
          }
        }, 3000)

        // Final timeout at 60s
        fallbackTimeoutRef.current = setTimeout(() => {
          const { compareQuotePlans, isLoadingPlans } = useHealthCartStore.getState()
          if (isLoadingPlans) {
            setIsLoadingPlans(false)
            closeEchoConnection(clientRequestId)
            if (!compareQuotePlans.length) {
              setPlansError('Plans are taking longer than expected. Please try again.')
            }
          }
          fallbackTimeoutRef.current = null
        }, 60000)

      } catch (err) {
        setIsLoadingPlans(false)
        setPlansError('Something went wrong. Please try again.')
      }
    },
    validators: { onChange: HealthDetailsFormSchema },
  })

  return (
    <Card className={cn('w-full rounded-md border shadow-lg backdrop-blur-sm bg-white lg:rounded-xl', className)}>
      <CardContent className="px-4 pt-3 pb-6 sm:px-8">
        <div className="mb-3">
          <h2 className="text-xl font-bold text-gray-900">Get Personalized Advice</h2>
          <p className="text-muted-foreground text-sm">Let our experts recommend the best plan for you</p>
        </div>

        {/* Row 1: First Name | Last Name | Email */}
        <div className="mb-2 grid gap-4 sm:grid-cols-3">
          <form.Field name="firstName">
            {(field) => (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-primary">First Name <span className="text-destructive">*</span></Label>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="e.g. Juan"
                  className={cn('h-12 rounded-full', { 'border-destructive': fieldHasError(field) })}
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>

          <form.Field name="lastName">
            {(field) => (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-primary">Last Name <span className="text-destructive">*</span></Label>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="e.g. dela Cruz"
                  className={cn('h-12 rounded-full', { 'border-destructive': fieldHasError(field) })}
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>

          <form.Field name="email">
            {(field) => (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-primary">Email Address <span className="text-destructive">*</span></Label>
                <Input
                  type="email"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="e.g. juan@email.com"
                  className={cn('h-12 rounded-full', { 'border-destructive': fieldHasError(field) })}
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
        </div>

        {/* Row 2: Phone Number | Date of Birth | Coverage Start Date */}
        <div className="mb-2 grid gap-4 sm:grid-cols-3">
          <form.Field name="mobile">
            {(field) => (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-primary">Phone Number <span className="text-destructive">*</span></Label>
                <div className={cn('flex h-12 items-center overflow-hidden rounded-full border bg-white focus-within:ring-2 focus-within:ring-primary/30', { 'border-destructive': fieldHasError(field) })}>
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
                <Label className="text-sm font-medium text-primary">Date of Birth <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className={cn('h-12 rounded-full', { 'border-destructive': fieldHasError(field) })}
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>

          <form.Field name="effectiveDate">
            {(field) => (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-primary">Coverage Start Date</Label>
                <Input
                  type="date"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className={cn('h-12 rounded-full', { 'border-destructive': fieldHasError(field) })}
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
        </div>

        {/* Row 4: Gender | Smoker */}
        <div className="mb-3 grid gap-4 sm:grid-cols-2">
          <form.Field name="genderCode">
            {(field) => (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-primary">Gender <span className="text-destructive">*</span></Label>
                <Select onValueChange={(v) => field.handleChange(v as 'M' | 'F')} value={field.state.value}>
                  <SelectTrigger className={cn('h-12 rounded-full', { 'border-destructive': fieldHasError(field) })}>
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
                <Label className="text-sm font-medium text-primary">Do you smoke? <span className="text-destructive">*</span></Label>
                <Select onValueChange={(v) => field.handleChange(v as 'Y' | 'N')} value={field.state.value}>
                  <SelectTrigger className={cn('h-12 rounded-full', { 'border-destructive': fieldHasError(field) })}>
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

        {/* Row 5: Terms + Search Plans */}
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
            {([, isSubmitting]) => (
              <Button
                type="submit"
                disabled={!!isSubmitting}
                onClick={(e) => { e.preventDefault(); form.handleSubmit() }}
                className="bg-primary from-primary to-accent h-12 w-full rounded-full bg-gradient-to-r via-90% px-10 text-sm font-medium text-white shadow-lg hover:bg-green-700 disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
              >
                {isSubmitting ? 'Searching...' : 'Search Plans'}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </CardContent>
    </Card>
  )
}
