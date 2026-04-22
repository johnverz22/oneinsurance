'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, CreditCard, Copy, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { toast } from 'sonner'
import { useHealthAvailStore } from '@/store/health-avail-store'
import { useHealthCartStore } from '@/store/health-cart-store'
import { useParams } from 'next/navigation'
import { generateHealthQuotePDF } from '@/utils/generate-health-quote-pdf'
import { COMPANIES } from '@/constants/companies'
import type { PersonalInfoData } from './health-personal-info-form'

interface Props {
  personalInfo: PersonalInfoData
}

export function HealthReviewPage({ personalInfo }: Props) {
  const { prevStep, nextStep } = useHealthAvailStore()
  const { items, insuredInfo, proposalNo } = useHealthCartStore()
  const params = useParams()
  const agentCode = params['agent-code'] as string
  const item = items[0]

  const provider = item ? (COMPANIES.find(c => c.carrierCode === item.carrierCode) ?? null) : null
  const providerName = provider?.companyName ?? item?.provider ?? ''
  const providerLogo = provider?.image ?? item?.providerLogo ?? null

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
    <div className="flex justify-between border-b border-gray-100 py-2 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="max-w-[60%] text-right text-sm font-semibold text-gray-900">{value || '—'}</span>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Proposal Number — always visible since it was set in step 3 */}
      {proposalNo && (
        <Card className="overflow-hidden shadow-none">
          <CardContent className="flex items-center justify-between px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-700">Proposal Number</h3>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-4 py-2">
                <p className="text-lg font-bold tracking-wider text-primary">{proposalNo}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyProposal}>
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
            <h2 className="text-2xl font-bold text-primary">Plan Details</h2>
            <Button
              onClick={handleDownloadPDF}
              variant="default"
              size="lg"
              className="from-primary to-accent rounded-full bg-gradient-to-r font-semibold text-white"
            >
              <Download className="mr-2 h-5 w-5" />
              Download Quote PDF
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-32 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white p-2">
                {providerLogo ? (
                  <img src={providerLogo} alt={providerName} className="h-full w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                ) : null}
              </div>
              <div>
                <span className="mb-1 inline-block rounded-full border border-gray-200 px-3 py-0.5 text-xs text-gray-600">{providerName}</span>
                <h3 className="text-xl font-black uppercase text-gray-900">{item.planName}</h3>
              </div>
              <div className="ml-auto shrink-0">
                <span className="rounded-full bg-[#F5A623] px-4 py-2 text-sm font-bold text-white">
                  ₱ {item.premium.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {insuredInfo?.effectiveDate && (
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Effective Date</p>
                  <p className="font-semibold">{new Date(insuredInfo.effectiveDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Insured</p>
                  <p className="font-semibold">{insuredInfo.insuredName}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Personal Information */}
      <Card className="overflow-hidden shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pt-6">
          <h2 className="text-2xl font-bold text-primary">Your Information</h2>
          <CheckCircle className="text-primary" />
        </CardHeader>
        <CardContent className="space-y-1">
          {row('Full Name', `${personalInfo.firstName ?? ''} ${personalInfo.lastName ?? ''}`.trim())}
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
      <div className="flex w-full flex-col items-center gap-3 lg:flex-row lg:justify-between">
        <Button
          onClick={handleDownloadPDF}
          variant="outline"
          size="lg"
          className="w-full rounded-full border-2 font-semibold lg:w-max lg:px-12"
        >
          <Download className="mr-2 h-5 w-5" />
          Download Quote PDF
        </Button>

        <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="w-full rounded-full px-12 font-semibold lg:w-max"
            onClick={prevStep}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            size="lg"
            className="from-primary to-accent w-full rounded-full bg-gradient-to-r px-14 font-semibold text-white lg:w-max"
            onClick={nextStep}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Proceed to Payment
          </Button>
        </div>
      </div>
    </div>
  )
}
