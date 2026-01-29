'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Download, 
  Printer
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

// Mock data based on the images you provided
const mockTransactionData = {
  // Use consistent reference IDs with Certificate of Coverage
  policyNumber: 'P0086998', // CarrierPolicyNo - same as Certificate
  proposalNumber: 'PTRAVEL0000000919', // ProposalNo - same as Certificate
  carrierProposalNo: 'POTRAVEL00000428', // CarrierProposalNo
  planName: 'TM CSL ASIAN W/ COVID 500K',
  
  // Customer Information
  customer: {
    name: 'asf asdf',
    address: 'adasf',
    additionalInfo: 'asdfs',
    code: '6341',
    email: 'a@gmail.com',
    phone: '(+63) 9933232333'
  },

  // Travel Details
  travel: {
    destination: 'PHILIPPINES → JAPAN',
    type: 'INDIVIDUAL',
    duration: '3 days'
  },

  // Coverage List
  coverages: [
    'Accidental Death, Dismemberment and Disablement',
    'Unprovoked Murder and Assault',
    'Sabotage and Terrorism',
    'Accidental Death',
    'COVID-19 Overseas Medical Costs',
    'Coronavirus -19 (perday , maximum of 7days)',
    'Sickness (perday , maximum of 10days)',
    'Accidents (perday, maximum of 10days)',
    'Cashless Hospitalization',
    'Follow-up Care',
    'Civil/Personal Liability',
    'Trip Cancellation',
    'Emergency Trip Termination',
    'Loss of Cash',
    'Loss of Travel Documents abroad',
    'Loss Of Checked In Baggage',
    'Baggage Delay Benefit (After First 12 hrs)',
    'Flight Delay',
    'Damage of Checked in Baggage',
    'Loss of Laptop',
    'Aircraft Hijacking',
    'Damage to Laptop',
    'Emergency Repatriation Expense',
    'Medical Evacuation',
    'Return of Mortal Remains',
    'Escort of dependent child',
    'Travel Of One Immediate Family Member/Compassionate Visit',
    'Car Hire Excess Waiver',
    'Sports Equipment and Cycle Insurance'
  ],

  // Policy Details
  policy: {
    status: 'Active',
    issueDate: 'Jan 21, 2026',
    coveragePeriod: 'Jan 21, 2026 - Jan 23, 2026'
  },

  // Invoice Details
  invoice: {
    paymentMethod: 'Digital Payment',
    from: {
      company: 'IFRC Digitech Online Payment Gateway',
      address: '6th Floor Padilla Building',
      street: 'F. Ortigas Jr. Road, Ortigas Center, Pasig City',
      phone: 'TEL: +632 8633 5681',
      email: 'concierge@ifrcinsurance.com'
    },
    description: 'TMPHPC2',
    route: 'PHILIPPINES → JAPAN',
    duration: '2 Days • INDIVIDUAL',
    amount: 'PHP 258.00',
    totalAmount: 'PHP 258.00'
  }
}

export default function TransactionDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const transactionId = params.transactionId as string
  const [activeTab, setActiveTab] = useState<'coverage' | 'invoice'>('coverage')

  // TODO: Replace with actual API call to fetch transaction details
  // For now, using mock data but with consistent reference IDs
  const transactionData = {
    ...mockTransactionData,
    // These should come from the actual policy API response
    policyNumber: 'P0086998', // CarrierPolicyNo from policy_details
    proposalNumber: 'PTRAVEL0000000919', // ProposalNo from policy_details  
    carrierProposalNo: 'POTRAVEL00000428', // CarrierProposalNo from policy_details
  }

  const handleDownloadPDF = () => {
    if (activeTab === 'coverage') {
      toast.success('Downloading Confirmation of Coverage PDF...')
    } else {
      toast.success('Downloading Invoice PDF...')
    }
    // Here you would implement actual PDF generation
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Transactions
            </Button>
            <div>
              <h1 className="text-xl font-bold">Policy Documents</h1>
              <p className="text-sm text-muted-foreground">Transaction #{transactionId}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === 'coverage' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('coverage')}
            >
              Coverage
            </Button>
            <Button
              variant={activeTab === 'invoice' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('invoice')}
            >
              Invoice
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border min-h-[800px]">
          {activeTab === 'coverage' ? (
            // Confirmation of Coverage Document
            <div className="p-8">
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Confirmation of Coverage</h1>
                  <div className="space-y-1 text-gray-600">
                    <p>Policy Number: #{transactionData.policyNumber}</p>
                    <p>Proposal Number: #{transactionData.proposalNumber}</p>
                    <p>Reference: #{transactionData.carrierProposalNo}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Image
                    src="/images/logo.png"
                    alt="IFRC Logo"
                    width={120}
                    height={60}
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Policy and Plan Information */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Policy Number</h3>
                  <p className="text-lg font-semibold">{transactionData.policyNumber}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Plan Name</h3>
                  <p className="text-lg font-semibold">{transactionData.planName}</p>
                </div>
              </div>

              {/* Customer and Travel Information */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-4">Issued To</h3>
                  <div className="space-y-1">
                    <p className="font-medium">{transactionData.customer.name}</p>
                    <p>{transactionData.customer.address}</p>
                    <p>{transactionData.customer.additionalInfo}</p>
                    <p>{transactionData.customer.code}</p>
                    <p>{transactionData.customer.email}</p>
                    <p>{transactionData.customer.phone}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-4">Travel Details</h3>
                  <div className="space-y-1">
                    <p><span className="font-medium">Destination/s:</span> {transactionData.travel.destination}</p>
                    <p><span className="font-medium">Travel Type:</span> {transactionData.travel.type}</p>
                    <p><span className="font-medium">Duration:</span> {transactionData.travel.duration}</p>
                  </div>
                </div>
              </div>

              {/* Coverage Table */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4 pb-2 border-b">
                  <h3 className="text-sm font-medium text-gray-500">COVERAGE NAME</h3>
                  <h3 className="text-sm font-medium text-gray-500">SUM INSURED</h3>
                </div>
                <div className="space-y-3">
                  {transactionData.coverages.map((coverage, index) => (
                    <div key={index} className="flex justify-between items-center py-2">
                      <p className="text-gray-900">{coverage}</p>
                      <p className="text-gray-600">Included</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 italic">
                  <span className="font-medium">Note:</span> Benefits are subject to the terms and conditions of the policy. 
                  Please ensure your travel coverage is valid within the period stated below.
                </p>
              </div>

              {/* Policy Details */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">POLICY DETAILS</h3>
                <div className="grid grid-cols-3 gap-8">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <p className="font-semibold text-green-600">{mockTransactionData.policy.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Issue Date</p>
                    <p className="font-semibold">{mockTransactionData.policy.issueDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Coverage Period</p>
                    <p className="font-semibold">{mockTransactionData.policy.coveragePeriod}</p>
                  </div>
                </div>
              </div>

              {/* Footer Message */}
              <div className="text-center py-6 border-t">
                <p className="text-gray-600 italic">
                  Thank you for choosing One Insurance. Stay protected and travel with confidence!
                </p>
              </div>

              {/* Download Button */}
              <div className="text-center pt-4">
                <Button onClick={handleDownloadPDF} className="bg-gray-900 hover:bg-gray-800">
                  Generate And Download Confirmation of Coverage
                </Button>
              </div>
            </div>
          ) : (
            // Invoice Document
            <div className="p-8">
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoice</h1>
                  <div className="space-y-1 text-gray-600">
                    <p>Policy Number: #{transactionData.policyNumber}</p>
                    <p>Proposal Number: #{transactionData.proposalNumber}</p>
                    <p>Reference: #{transactionData.carrierProposalNo}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Image
                    src="/images/logo.png"
                    alt="IFRC Logo"
                    width={120}
                    height={60}
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Policy and Payment Information */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Policy Number</h3>
                  <p className="text-lg font-semibold">{transactionData.policyNumber}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Payment Method</h3>
                  <p className="text-lg font-semibold">{transactionData.invoice.paymentMethod}</p>
                </div>
              </div>

              {/* From and To Information */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-4">From</h3>
                  <div className="space-y-1">
                    <p className="font-semibold">{transactionData.invoice.from.company}</p>
                    <p>{transactionData.invoice.from.address}</p>
                    <p>{transactionData.invoice.from.street}</p>
                    <p>{transactionData.invoice.from.phone}</p>
                    <p>{transactionData.invoice.from.email}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-4">To</h3>
                  <div className="space-y-1">
                    <p className="font-medium">{transactionData.customer.name}</p>
                    <p>{transactionData.customer.address}, {transactionData.customer.additionalInfo}</p>
                    <p>{transactionData.customer.email}</p>
                  </div>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4 pb-2 border-b">
                  <h3 className="text-sm font-medium text-gray-500">DESCRIPTION</h3>
                  <h3 className="text-sm font-medium text-gray-500">AMOUNT</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{transactionData.invoice.description}</p>
                      <p className="text-gray-600">{transactionData.invoice.route}</p>
                      <p className="text-gray-600">{transactionData.invoice.duration}</p>
                    </div>
                    <p className="font-semibold text-lg">{transactionData.invoice.amount}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t mt-6">
                  <p className="text-lg font-semibold">Total Amount</p>
                  <p className="text-xl font-bold">{transactionData.invoice.totalAmount}</p>
                </div>
              </div>

              {/* Note */}
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 italic">
                  <span className="font-medium">Note:</span> Policy coverage begins on the effective date. 
                  Please ensure payment is completed before departure. VAT Inclusive
                </p>
              </div>

              {/* Policy Status */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">POLICY STATUS</h3>
                <div className="grid grid-cols-3 gap-8">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <p className="font-semibold text-green-600">{transactionData.policy.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Issue Date</p>
                    <p className="font-semibold">{transactionData.policy.issueDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Coverage Period</p>
                    <p className="font-semibold">{transactionData.policy.coveragePeriod}</p>
                  </div>
                </div>
              </div>

              {/* Footer Message */}
              <div className="text-center py-6 border-t">
                <p className="text-gray-600 italic">
                  Thank you for choosing One Insurance. Have a safe and wonderful journey!
                </p>
              </div>

              {/* Download Button */}
              <div className="text-center pt-4">
                <Button onClick={handleDownloadPDF} className="bg-gray-900 hover:bg-gray-800">
                  Generate And Download Invoice
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}