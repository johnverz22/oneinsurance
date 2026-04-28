'use client'

import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useCtplInsuranceStateStore } from '@/store/ctpl-store'
import { format, addYears } from 'date-fns'

const PRICES: Record<string, number> = {
  PRIVATECAR: 599, MOTORCYCLE: 290, TPMB: 1150, ACTC: 790, LMT: 660, HTPB: 1250, PTB: 1100,
}

export default function CtplCertificatePage() {
  const params = useParams()
  const router = useRouter()
  const agentCode = params['agent-code'] as string
  const { selectedVehicle, personalInfo, vehicleRegistration } = useCtplInsuranceStateStore()
  const price = PRICES[selectedVehicle?.code ?? 'PRIVATECAR'] ?? 599
  const today = new Date()
  const expiry = addYears(today, 1)
  const policyNo = 'POCTPL001'
  const proposalNo = 'PICTPL002'

  const row = (label: string, value: string) => (
    <div className="flex justify-between py-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value || '—'}</span>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F3F5FC] py-10 px-4">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Image src="/images/logo.png" alt="One Insurance" width={120} height={40} className="h-8 w-auto" />
          <div className="text-center">
            <h1 className="text-2xl font-black text-primary">Cover Note</h1>
            <p className="text-sm text-gray-600">Sum Insured Coverage</p>
            <span className="mt-1 inline-block rounded-full bg-green-500 px-4 py-1 text-xs font-bold text-white">Active Policy</span>
          </div>
          <Image src="/images/IFRC.png" alt="IFRC" width={80} height={30} className="h-8 w-auto" />
        </div>

        <hr className="mb-6" />

        {/* Policy Information */}
        <div className="mb-6">
          <h3 className="text-primary mb-3 font-bold">Policy Information</h3>
          {row('Policy Number', policyNo)}
          {row('Proposal Number', proposalNo)}
          {row('Carrier Policy', vehicleRegistration.plateNumber || '34567890')}
          {row('Product Code', 'CTPL')}
          {row('Plan Code', `CTPL-${selectedVehicle?.code ?? 'PRIVATECAR'}-01`)}
        </div>

        <hr className="mb-6" />

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {/* Premium Information */}
          <div>
            <h3 className="text-primary mb-3 font-bold">Premium Information</h3>
            {row('Annual Premium', 'N/A')}
            {row('Gross Premium', `₱ ${price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`)}
            {row('Due Premium', `₱ ${price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`)}
            {row('Renewable', 'Yes')}
          </div>

          {/* Carrier Information */}
          <div>
            <h3 className="text-primary mb-3 font-bold">Carrier Information</h3>
            {row('Carrier Code', 'MALAYAN')}
            {row('Carrier Plan', `CTPL-${selectedVehicle?.code ?? 'PRIVATECAR'}-01`)}
            {row('Product Code', 'CTPL')}
            {row('Issue Date', format(today, 'MMMM d, yyyy'))}
            {row('Proposal Date', format(today, 'MMMM d, yyyy'))}
          </div>
        </div>

        <hr className="mb-6" />

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {/* Insured Information */}
          <div>
            <h3 className="text-primary mb-3 font-bold">Insured Information</h3>
            {row('ID Type', personalInfo.idType || 'PhilHealth ID')}
            {row('ID Number', personalInfo.idNumber || '123-4567-8910')}
          </div>

          {/* Policy Reference Numbers */}
          <div>
            <h3 className="text-primary mb-3 font-bold">Policy Reference Numbers</h3>
            {row('Business Object ID', '123456789A')}
            {row('Carrier Proposal Number', '123456789B')}
          </div>
        </div>

        <hr className="mb-6" />

        {/* Coverage Period */}
        <div className="mb-8">
          <h3 className="text-primary mb-3 font-bold">Coverage Period</h3>
          <p className="text-sm text-gray-700">
            {format(today, 'MMMM d, yyyy')} to {format(expiry, 'MMMM d, yyyy')}
          </p>
        </div>

        <div className="flex gap-3 mb-6">
          <Button variant="outline" className="rounded-full px-6">Send to Email</Button>
          <Button variant="outline" className="rounded-full px-6">Download</Button>
        </div>

        <hr className="mb-4" />

        <div className="flex justify-between">
          <Button variant="outline" className="rounded-full px-6" onClick={() => router.push(`/${agentCode}/products/motor-insurance/invoice`)}>
            View Invoice
          </Button>
          <Button className="from-primary to-accent rounded-full bg-gradient-to-r px-8 text-white" onClick={() => router.push(`/${agentCode}`)}>
            Home
          </Button>
        </div>
      </div>
    </div>
  )
}
