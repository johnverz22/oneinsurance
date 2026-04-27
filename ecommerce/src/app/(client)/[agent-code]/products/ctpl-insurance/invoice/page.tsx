'use client'

import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useCtplInsuranceStateStore } from '@/store/ctpl-store'
import { format, addYears } from 'date-fns'

const PRICES: Record<string, number> = {
  PRIVATECAR: 599, MOTORCYCLE: 290, TPMB: 1150, ACTC: 790, LMT: 660, HTPB: 1250, PTB: 1100,
}

export default function CtplInvoicePage() {
  const params = useParams()
  const router = useRouter()
  const agentCode = params['agent-code'] as string
  const { selectedVehicle, personalInfo } = useCtplInsuranceStateStore()
  const price = PRICES[selectedVehicle?.code ?? 'PRIVATECAR'] ?? 599
  const today = new Date()
  const invoiceNo = `#CTPL${Date.now().toString().slice(-6)}-01`

  return (
    <div className="min-h-screen bg-[#F3F5FC] py-10 px-4">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <Image src="/images/logo.png" alt="One Insurance" width={120} height={40} className="h-8 w-auto mb-2" />
            <p className="text-xs text-gray-500">www.oneinsurance.com</p>
            <p className="text-xs text-gray-500">oneinsurance@gmail.com</p>
            <p className="text-xs text-gray-500">+63912 345 6789</p>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-black text-gray-900 mb-1">Invoice</h1>
            <Image src="/images/IFRC.png" alt="IFRC" width={80} height={30} className="h-8 w-auto ml-auto" />
            <p className="text-xs text-gray-500 mt-1">Business Address</p>
            <p className="text-xs text-gray-500">City, State</p>
            <p className="text-xs text-gray-500">TIN ID 000 000 000 0000</p>
          </div>
        </div>

        <hr className="mb-6" />

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-xs text-gray-400 mb-1">Billed To</p>
            <p className="font-bold text-gray-900">{`${personalInfo.firstName} ${personalInfo.lastName}`}</p>
            <p className="text-sm text-gray-600">+63{personalInfo.mobileNumber}</p>
            <p className="text-sm text-gray-600">{personalInfo.email}</p>
          </div>
          <div className="text-right">
            <div className="mb-2">
              <p className="text-xs text-gray-400">Invoice Number</p>
              <p className="font-bold text-gray-900">{invoiceNo}</p>
            </div>
            <div className="mb-2">
              <p className="text-xs text-gray-400">Invoice of (PHP)</p>
              <p className="text-2xl font-black text-gray-900">₱ {price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Reference</p>
              <p className="text-sm text-gray-600">{invoiceNo}</p>
            </div>
          </div>
        </div>

        <hr className="mb-4" />

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="text-xs text-gray-400">Insurance Plan</p>
            <p className="font-semibold">{selectedVehicle?.title}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Invoice Date</p>
            <p className="font-semibold">{format(today, 'MMMM d, yyyy')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Due Date</p>
            <p className="font-semibold">{format(today, 'MMMM d, yyyy')}</p>
          </div>
        </div>

        <hr className="mb-4" />

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="text-gray-400 text-xs">
              <th className="text-left pb-2">Plan</th>
              <th className="text-left pb-2">Coverage</th>
              <th className="text-right pb-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 font-semibold">{selectedVehicle?.title}</td>
              <td className="py-2 text-gray-600">CTPL Coverage</td>
              <td className="py-2 text-right font-semibold">₱ {price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        <hr className="mb-4" />

        <div className="flex justify-end gap-8 text-sm mb-8">
          <div className="text-right space-y-1">
            <div className="flex justify-between gap-12">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold">₱ {price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between gap-12">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-black text-gray-900">₱ {price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <Button variant="outline" className="rounded-full px-6">Send to Email</Button>
          <Button variant="outline" className="rounded-full px-6">Download</Button>
        </div>

        <hr className="mb-4" />

        <div className="flex justify-between">
          <Button variant="outline" className="rounded-full px-6" onClick={() => router.push(`/${agentCode}/products/ctpl-insurance/certificate`)}>
            View Cover Note
          </Button>
          <Button className="from-primary to-accent rounded-full bg-gradient-to-r px-8 text-white" onClick={() => router.push(`/${agentCode}`)}>
            Home
          </Button>
        </div>
      </div>
    </div>
  )
}
