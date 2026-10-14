'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerInfoCard } from './customer-info-card'
import { CoverageDetailsCard } from './coverage-details-list'
import { useLoadQuoteRequest } from '@/app/data/mutations/load-quote-request'
import {
  MapPin,
  Plane,
  CalendarDays,
  Users,
  DollarSign,
  RotateCcw,
} from 'lucide-react'
import { removeStorage } from '@/utils/remove-session-storage'
import { useTravelInsuranceStore } from '@/store/travel-insurance-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

export function PolicyDisplay() {
  const { policyNo, resetForm } = useTravelInsuranceStore()
  const [open, setOpen] = useState(true)
  const router = useRouter()

  useEffect(() => {
    setOpen(true)
  }, [])

  const {
    data: quoteRequest,
    isLoading,
    isError,
  } = useLoadQuoteRequest(policyNo)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl">
        <Skeleton className="h-16 w-full p-4" />
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((_, index) => (
            <Skeleton className="h-96 w-full" key={index} />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !quoteRequest?.data) return <div>Error: {isError}</div>

  const { data: policy } = quoteRequest

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'Php',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 2:
        return (
          <Badge variant="default" className="bg-primary">
            Active
          </Badge>
        )
      case 1:
        return <Badge variant="secondary">Inactive</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const allRisks = policy.PolicyLobList.flatMap((lob) => lob.PolicyRiskList)

  const travelDays = (expiryDate: string, effectiveDate: string) => {
    const expiry = new Date(expiryDate)
    const effective = new Date(effectiveDate)
    const diffTime = Math.abs(expiry.getTime() - effective.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Handler to reset local storage and go back to first step
  const handleRestart = () => {
    router.push('/products/travel-insurance')
    resetForm()
  }

  return (
    <div className="relative py-6">
      {/* Dialog for email notification */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notice</DialogTitle>
            <DialogDescription>
              The policy will be sent to your email.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="bg-primary -mt-8 flex w-full">
        <div className="mx-auto flex w-full max-w-7xl flex-col justify-between gap-2 p-8 py-10 lg:flex-row">
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white md:text-2xl lg:text-3xl xl:text-4xl">
              Your Policy Details
            </h1>
          </div>
          <p className="text-sm text-muted-foreground lg:max-w-2/5 lg:text-right">
            Here's a summary of your travel insurance policy details. Please
            review the information carefully before proceeding.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-3 px-6 py-4">
        <Card className="w-full gap-2 shadow-none">
          <CardHeader>
            <div className="text-muted-foreground flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm">Policy No:</p>
                <CardTitle className="text-foreground text-2xl font-bold text-balance">
                  {policy.PolicyNo}
                </CardTitle>
              </div>

              <div className="flex items-center justify-between">
                {getStatusBadge(policy.PolicyStatus)}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-card flex items-center gap-3 rounded-lg border p-4">
                <DollarSign className="text-lilac h-5 w-5" />
                <div>
                  <p className="text-muted-foreground text-sm">Cost</p>
                  <p className="text-lilac text-lg font-semibold">
                    {formatCurrency(policy.AnnualPremium)}
                  </p>
                </div>
              </div>

              <div className="bg-card flex items-center gap-3 rounded-lg border p-4">
                <CalendarDays className="text-primary h-5 w-5" />
                <div>
                  <p className="text-muted-foreground text-sm">Travel Days</p>
                  <p className="text-lg font-semibold">
                    {travelDays(policy.ExpiryDate, policy.EffectiveDate)} days
                  </p>
                </div>
              </div>

              <div className="bg-card flex items-center gap-3 rounded-lg border p-4">
                <Users className="text-primary h-5 w-5" />
                <div>
                  <p className="text-muted-foreground text-sm">Travelers</p>
                  <p className="text-lg font-semibold">
                    {policy.NoOfTravellers}
                  </p>
                </div>
              </div>

              <div className="bg-card flex items-center gap-3 rounded-lg border p-4">
                <MapPin className="text-primary h-5 w-5" />
                <div>
                  <p className="text-muted-foreground text-sm">Trip Type</p>
                  <p className="text-lg font-semibold capitalize">
                    {policy.TripType}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="text-foreground font-semibold">
                  Coverage Period
                </h3>
                <div className="text-muted-foreground space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Effective:</span>{' '}
                    {formatDate(policy.EffectiveDate)}
                  </p>
                  <p>
                    <span className="font-medium">Expires:</span>{' '}
                    {formatDate(policy.ExpiryDate)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-foreground font-semibold">
                  Premium Details
                </h3>
                <div className="text-muted-foreground space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Gross Premium:</span>{' '}
                    {formatCurrency(policy.GrossPremium)}
                  </p>
                  <p>
                    <span className="font-medium">Sum Insured:</span>{' '}
                    {formatCurrency(policy.SumInsured)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 lg:grid-cols-2">
          <Card className="h-full w-full gap-2 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-bold">
                <Plane className="text-primary h-5 w-5" />
                Travel Destinations
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full">
              <div className="h-full space-y-4">
                {policy.TravelDetailList.map((detail, index) => (
                  <div
                    key={detail.PolicyElementId}
                    className="bg-muted/50 border-muted-foreground/20 flex h-fit items-center gap-4 rounded-lg border p-4"
                  >
                    <div className="flex-shrink-0">
                      <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="text-muted-foreground h-4 w-4" />
                        <span className="font-medium">
                          {detail.TravelCountry}
                        </span>
                      </div>
                      <div className="text-muted-foreground space-y-1 text-sm">
                        <p>
                          <span className="font-medium">Origin:</span>{' '}
                          {detail.PlaceOfOrgin}
                        </p>
                        <p>
                          <span className="font-medium">Coverage Area:</span>{' '}
                          {detail.TravelCoverageArea}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <CustomerInfoCard
            customers={policy.PolicyLobList.at(0)!.PolicyRiskList}
          />
        </div>

        <CoverageDetailsCard risks={allRisks} />

        <div className="mt-8 flex justify-end">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleRestart}
          >
            <RotateCcw size={18} />
            Buy New Travel Insurance
          </Button>
        </div>
      </div>
    </div>
  )
}
