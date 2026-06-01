'use client'

import Image from 'next/image'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/page-loader'
import { COMPANIES } from '@/constants/companies'
import { CheckCircle } from 'lucide-react'

function InvoiceContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const agentCode = params['agent-code'] as string
  const name = searchParams.get('name') || 'Insured'
  const total = parseFloat(searchParams.get('total') || '0')
  const proposalNo = searchParams.get('proposal') || ''
  const isSuccess = searchParams.get('success') === 'true'

  const [policyData, setPolicyData] = useState<any>(null)
  const [showSuccessBanner, setShowSuccessBanner] = useState(isSuccess)

  useEffect(() => {
    if (!proposalNo) return
    fetch('/api/health-insurance/load-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ProposalNo: proposalNo }),
    })
      .then((r) => r.json())
      .then((data) => setPolicyData(data))
      .catch(console.error)
  }, [proposalNo])

  const invoiceNumber = proposalNo || `#AB${Date.now().toString().slice(-6)}-01`
  const today = new Date()
  const dueDate = new Date(today)
  dueDate.setDate(dueDate.getDate() + 1)

  const displayTotal = policyData?.GrossPremium ?? total
  const carrierName = COMPANIES.find(c => c.carrierCode === policyData?.CarrierCode)?.companyName ?? policyData?.CarrierProductName ?? ''

  return (
    <div className="min-h-screen bg-[#eef2f7] px-4 py-8">
      <div className="mx-auto max-w-3xl">
        {/* Success Banner */}
        {showSuccessBanner && (
          <div className="mb-6 space-y-4 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-primary text-3xl font-bold">Payment Successful!</h1>
              <p className="text-lg text-gray-600">Your health insurance policy has been successfully issued.</p>
              <p className="text-sm text-gray-500">
                Please note that this serves as a cover note only. The official policy document will be issued directly by the insurance carrier and made available to you shortly.
              </p>
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-white p-8 shadow-sm">
          {/* Invoice header */}
          <div className="mb-6 flex items-center justify-between">
            <Image src="/images/logo.png" alt="One Insurance" width={120} height={40} className="h-10 w-auto" />
            <h1 className="text-2xl font-bold text-gray-700">Invoice</h1>
            <Image src="/images/IFRC.png" alt="IFRC" width={60} height={40} className="h-10 w-auto" />
          </div>

          <hr className="mb-6" />

          {/* Company + billing info */}
          <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-gray-900">One Insurance</p>
              <p className="text-gray-500">www.oneinsurance.com</p>
              <p className="text-gray-500">oneinsurance@gmail.com</p>
              <p className="text-gray-500">+63912 345 67890</p>
            </div>
            <div className="text-right text-gray-500">
              <p>Business Address</p>
              <p>City, State</p>
              <p>TIN ID 000 000 000 0000</p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="from-primary to-accent mb-1 bg-gradient-to-r bg-clip-text text-xs font-bold text-transparent">Billed To</p>
              <p className="font-semibold text-gray-900">{policyData?.InsuredName ?? name}</p>
              <p className="text-gray-500">{policyData?.Mobile ?? ''}</p>
              <p className="text-gray-500">{policyData?.Email ?? ''}</p>
            </div>
            <div>
              <p className="from-primary to-accent mb-1 bg-gradient-to-r bg-clip-text text-xs font-bold text-transparent">Invoice Number</p>
              <p className="font-semibold text-gray-900">{invoiceNumber}</p>
              <div className="mt-3">
                <p className="from-primary to-accent mb-1 bg-gradient-to-r bg-clip-text text-xs font-bold text-transparent">Reference</p>
                <p className="font-semibold text-gray-900">{invoiceNumber}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="from-primary to-accent mb-1 bg-gradient-to-r bg-clip-text text-xs font-bold text-transparent">Invoice of (PHP)</p>
              <p className="text-2xl font-black text-gray-900">
                ₱ {displayTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-1 text-xs">
                <div>
                  <p className="from-primary to-accent bg-gradient-to-r bg-clip-text font-bold text-transparent">Invoice Date</p>
                  <p className="font-semibold text-gray-900">{format(today, 'MMMM dd, yyyy')}</p>
                </div>
                <div className="text-right">
                  <p className="from-primary to-accent bg-gradient-to-r bg-clip-text font-bold text-transparent">Due Date</p>
                  <p className="font-semibold text-gray-900">{format(dueDate, 'MMMM dd, yyyy')}</p>
                </div>
              </div>
            </div>
          </div>

          <hr className="mb-4" />

          {/* Line items table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400">
                <th className="pb-3 font-medium">Plan</th>
                <th className="pb-3 text-center font-medium">Quantity</th>
                <th className="pb-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="py-3 text-gray-700">
                  {policyData?.ProductName ?? 'Health Insurance'} — {carrierName}
                </td>
                <td className="py-3 text-center text-gray-700">1</td>
                <td className="py-3 text-right text-gray-700">
                  ₱ {displayTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>

          <hr className="my-4" />

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-48 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Subtotal</span>
                <span className="text-gray-700">₱ {displayTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-gray-900">₱ {displayTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex items-center justify-between">
            <div className="flex gap-3">
              <Button variant="outline" className="rounded-full">Send to Email</Button>
              <Button variant="outline" className="rounded-full">Download</Button>
            </div>
            <Button
              className="from-primary to-accent rounded-full bg-gradient-to-r text-white"
              onClick={() => router.push(`/${agentCode}`)}
            >
              Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function InvoicePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <InvoiceContent />
    </Suspense>
  )
}
