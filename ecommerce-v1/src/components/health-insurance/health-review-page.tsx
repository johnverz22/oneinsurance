'use client'

import { Button } from '@/components/ui/button'
import { Copy, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { toast } from 'sonner'
import { useHealthAvailStore } from '@/store/health-avail-store'
import { useHealthCartStore } from '@/store/health-cart-store'
import { useParams } from 'next/navigation'
import { generateHealthQuotePDF } from '@/utils/generate-health-quote-pdf'
import { COMPANIES, CARRIER_BRAND_COLORS } from '@/constants/companies'
import type { PersonalInfoData } from './health-personal-info-form'

interface Props {
  personalInfo: PersonalInfoData
}

export function HealthReviewPage({ personalInfo }: Props) {
  const { prevStep, nextStep } = useHealthAvailStore()
  const { items, insuredInfo, proposalNo, duePremium, fullQuoteData } = useHealthCartStore()
  const params = useParams()
  const agentCode = params['agent-code'] as string
  const item = items[0]

  const provider = item ? (COMPANIES.find(c => c.carrierCode === item.carrierCode) ?? null) : null
  const providerName = provider?.companyName ?? item?.provider ?? ''
  const brandColor = provider ? (CARRIER_BRAND_COLORS[provider.carrierCode] || null) : null
  const providerLogo = (brandColor as any)?.planCardLogo || (provider?.image ?? item?.providerLogo ?? null)
  const displayPremium = duePremium ?? (item?.premium ?? 0)

  const handleCopyProposal = async () => {
    if (!proposalNo) return
    try {
      await navigator.clipboard.writeText(proposalNo)
      toast.success('Proposal number copied!')
    } catch {
      toast.error('Failed to copy')
    }
  }

  const handleDownloadPDF = () => {
    if (!proposalNo || !item) { toast.error('No proposal data available.'); return }
    generateHealthQuotePDF({
      proposalNo,
      planName: item.planName,
      providerName: providerName,
      premium: item.premium,
      insuredName: `${personalInfo.firstName ?? ''} ${personalInfo.lastName ?? ''}`.trim(),
      dateOfBirth: insuredInfo?.dateOfBirth ?? '',
      gender: insuredInfo?.genderCode ?? 'M',
      isSmoker: insuredInfo?.isSmoker ?? 'N',
      effectiveDate: insuredInfo?.effectiveDate ?? '',
      email: personalInfo.email,
      phone: personalInfo.phone,
      address: [personalInfo.addressLine1, personalInfo.city, personalInfo.province].filter(Boolean).join(', '),
      agentCode,
    })
    toast.success('PDF downloaded!')
  }

  const row = (label: string, value: string) => (
    <div className="flex justify-between border-b border-border py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right text-sm font-semibold text-foreground">{value || '—'}</span>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Proposal Number — always visible since it was set in step 3 */}
      {proposalNo && (
        <Card className="overflow-hidden shadow-none">
          <CardContent className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-foreground">Proposal Number</h3>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 overflow-hidden">
                <p className="text-sm font-bold tracking-wider text-primary sm:text-lg truncate">{proposalNo}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleCopyProposal}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Details */}
      {item && (
        <Card className="overflow-hidden shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pt-6">
            <h2 className="text-primary text-lg sm:text-2xl font-bold">Plan Details</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Provider + Plan + Coverage in responsive layout */}
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:gap-2">
              <div className="h-14 w-28 shrink-0 overflow-hidden rounded-md">
                {providerLogo ? (
                  <img src={providerLogo} alt={providerName} className="h-full w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                ) : null}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <h3 className="text-foreground text-left text-lg font-bold uppercase tracking-wide sm:text-xl break-words">{item.planName}</h3>
                {fullQuoteData?.carrierProductName && (
                  <p className="text-sm text-muted-foreground">{fullQuoteData.carrierProductName}</p>
                )}
              </div>
              <div className="shrink-0">
                <span className="rounded-full bg-orange-400 px-4 py-2 text-sm font-bold text-white whitespace-nowrap">
                  ₱ {displayPremium.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Coverage Section — matching travel's Benefits style */}
            {fullQuoteData?.coverages && fullQuoteData.coverages.length > 0 && (
              <div className="w-full space-y-3">
                <h2 className="text-primary text-base font-bold">Coverage</h2>
                <div className="border-muted-foreground/20 bg-muted/30 w-full rounded-md border p-4">
                  <div className="space-y-2">
                    {fullQuoteData.coverages.map((cov, idx) => (
                      <div key={idx} className="grid grid-cols-2 items-center gap-3">
                        <h4 className="text-sm font-medium">{cov.coverageName}</h4>
                        <small className="text-right text-sm text-foreground">
                          Php {cov.sumInsured.toLocaleString('en-PH')}
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Effective / Expiry / Insured row */}
            {/* Insured / Dates / Duration — row layout */}
            <div className="space-y-0">
              <div className="flex items-center justify-between border-b border-border py-3">
                <span className="text-sm font-medium text-foreground">Insured</span>
                <span className="text-sm font-semibold text-foreground uppercase">{insuredInfo?.insuredName || `${personalInfo.firstName} ${personalInfo.lastName}`.trim()}</span>
              </div>
              {insuredInfo?.effectiveDate && (
                <div className="flex items-center justify-between border-b border-border py-3">
                  <span className="text-sm font-medium text-foreground">Effective Date</span>
                  <span className="text-sm font-semibold text-foreground">{new Date(fullQuoteData?.effectiveDate || insuredInfo.effectiveDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-b border-border py-3">
                <span className="text-sm font-medium text-foreground">Expiration Date</span>
                <span className="text-sm font-semibold text-foreground">
                  {fullQuoteData?.expiryDate
                    ? new Date(fullQuoteData.expiryDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
                    : insuredInfo?.expiryDate
                      ? new Date(insuredInfo.expiryDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
                      : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-foreground">Duration</span>
                <span className="text-sm font-semibold text-foreground">
                  {(() => {
                    const start = fullQuoteData?.effectiveDate || insuredInfo?.effectiveDate
                    const end = fullQuoteData?.expiryDate || insuredInfo?.expiryDate
                    if (!start || !end) return '—'
                    const days = Math.round((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24))
                    return `${days} Days`
                  })()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personal Information */}
      <Card className="overflow-hidden shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pt-6">
            <h2 className="text-primary text-lg sm:text-2xl font-bold">Your Information</h2>
            <CheckCircle className="text-primary" />
          </CardHeader>
        <CardContent className="space-y-1">
          {row('Full Name', `${personalInfo.firstName ?? ''} ${personalInfo.lastName ?? ''}`.trim().toUpperCase())}
          {row('Email', personalInfo.email)}
          {row('Phone', personalInfo.phone ? `+63 ${personalInfo.phone}` : '')}
          {row('Place of Birth', personalInfo.placeOfBirth)}
          {row('ID Type', personalInfo.idTypeCode)}
          {row('ID Number', personalInfo.idNo)}
          {row('Address', [personalInfo.addressLine1, personalInfo.addressLine2].filter(Boolean).join(', '))}
          {row('Province', personalInfo.province)}
          {row('City', personalInfo.city)}
          {row('Post Code', personalInfo.postCode)}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="hidden items-center justify-between lg:flex">
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="w-1/2 rounded-full bg-transparent px-12 font-semibold lg:w-max"
          onClick={prevStep}
          data-mobile-action="back"
        >
          Back
        </Button>
        <Button
          size="lg"
          className="from-primary to-accent w-1/2 rounded-full bg-gradient-to-r via-90% px-14 text-sm font-medium text-white lg:w-max dark:text-white"
          onClick={nextStep}
          data-mobile-action="next"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
