'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Download, 
  Printer,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import axios from 'axios'

interface TransactionData {
  id: string
  policy_details: any
  customer_name: string
  amount: string
  status: string
  transaction_date: string
  merchant_transaction_id: string
  carrier_policy_no: string
  product: {
    name: string
  }
  plan_name: string
}

export default function TransactionDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const transactionId = params.transactionId as string
  const [activeTab, setActiveTab] = useState<'coverage' | 'invoice'>('coverage')
  const [transactionData, setTransactionData] = useState<TransactionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTransactionData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch transaction data from the backend
        const response = await axios.get(`/api/transactions/${transactionId}`)
        
        if (response.data?.success && response.data?.data) {
          setTransactionData(response.data.data)
        } else {
          setError('Transaction not found')
        }
      } catch (error: any) {
        console.error('Error fetching transaction data:', error)
        setError(error.response?.data?.message || 'Failed to load transaction data')
      } finally {
        setIsLoading(false)
      }
    }

    if (transactionId) {
      fetchTransactionData()
    }
  }, [transactionId])

  const handleDownloadPDF = () => {
    if (activeTab === 'coverage') {
      toast.success('Downloading Certificate of Coverage PDF...')
    } else {
      toast.success('Downloading Invoice PDF...')
    }
    // TODO: Implement actual PDF generation
  }

  const handlePrint = () => {
    window.print()
  }

  // Parse policy details if available
  let policyDetails = null
  if (transactionData?.policy_details) {
    try {
      policyDetails = typeof transactionData.policy_details === 'string' 
        ? JSON.parse(transactionData.policy_details) 
        : transactionData.policy_details
    } catch (e) {
      console.log('Failed to parse policy_details:', e)
    }
  }

  // Extract policy holder information
  const policyHolder = policyDetails?.PolicyCustomerList?.find((customer: any) => customer.IsPolicyHolder === 'Y') 
    || policyDetails?.PolicyCustomerList?.[0]

  // Extract travel details
  const travelDetails = policyDetails?.TravelDetailList?.[0]
  
  // Extract coverage list
  const coverages = policyDetails?.PolicyLobList?.[0]?.PolicyRiskList?.[0]?.PolicyCoverageList || []

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading transaction details...</span>
        </div>
      </div>
    )
  }

  if (error || !transactionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Transaction not found'}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Transactions
          </Button>
        </div>
      </div>
    )
  }

  // Get policy number (CarrierPolicyNo with N/A fallback)
  const policyNumber = policyDetails?.CarrierPolicyNo || transactionData.carrier_policy_no || 'N/A'

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
            // Certificate of Coverage Document
            <div className="p-8">
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Certificate of Coverage</h1>
                  <div className="space-y-1 text-gray-600">
                    <p>Policy Number: #{policyNumber}</p>
                    <p>Proposal Number: #{policyDetails?.ProposalNo || 'N/A'}</p>
                    <p>Transaction ID: #{transactionData.merchant_transaction_id || 'N/A'}</p>
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
                  <p className="text-lg font-semibold">{policyNumber}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Plan Name</h3>
                  <p className="text-lg font-semibold">{transactionData.plan_name || policyDetails?.CarrierPlanCode || 'N/A'}</p>
                </div>
              </div>

              {/* Customer and Travel Information */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-4">Issued To</h3>
                  <div className="space-y-1">
                    {policyHolder ? (
                      <>
                        <p className="font-medium uppercase">
                          {[policyHolder.FirstName, policyHolder.MiddleName, policyHolder.LastName]
                            .filter(Boolean).join(' ')}
                        </p>
                        <p>{policyHolder.AddressLine1 || 'N/A'}</p>
                        <p>{policyHolder.AddressLine2 || ''}</p>
                        <p>{policyHolder.PostCode || ''}</p>
                        <p>{policyHolder.Email || 'N/A'}</p>
                        <p>{policyHolder.Mobile || 'N/A'}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium uppercase">{transactionData.customer_name || 'N/A'}</p>
                        <p>N/A</p>
                        <p>N/A</p>
                        <p>N/A</p>
                        <p>N/A</p>
                        <p>N/A</p>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-4">Travel Details</h3>
                  <div className="space-y-1">
                    <p><span className="font-medium">Destination/s:</span> {
                      travelDetails ? `${travelDetails.PlaceOfOrgin || 'N/A'} → ${travelDetails.TravelCountry || 'N/A'}` : 'N/A'
                    }</p>
                    <p><span className="font-medium">Travel Type:</span> {policyDetails?.TravelType || 'N/A'}</p>
                    <p><span className="font-medium">Duration:</span> {
                      policyDetails?.TravelDays ? `${policyDetails.TravelDays} days` : 'N/A'
                    }</p>
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
                  {coverages.length > 0 ? (
                    coverages.map((coverage: any, index: number) => (
                      <div key={index} className="flex justify-between items-center py-2">
                        <p className="text-gray-900">{coverage.CoverageName}</p>
                        <p className="text-gray-600">Included</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No coverage details available</p>
                    </div>
                  )}
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
                    <p className="font-semibold text-green-600">{transactionData.status || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Issue Date</p>
                    <p className="font-semibold">
                      {policyDetails?.IssueDate ? new Date(policyDetails.IssueDate).toLocaleDateString() : 
                       transactionData.transaction_date ? new Date(transactionData.transaction_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Coverage Period</p>
                    <p className="font-semibold">
                      {policyDetails?.EffectiveDate && policyDetails?.ExpiryDate ? 
                        `${new Date(policyDetails.EffectiveDate).toLocaleDateString()} - ${new Date(policyDetails.ExpiryDate).toLocaleDateString()}` : 
                        'N/A'}
                    </p>
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
                  Generate And Download Certificate of Coverage
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
                    <p>Policy Number: #{policyNumber}</p>
                    <p>Proposal Number: #{policyDetails?.ProposalNo || 'N/A'}</p>
                    <p>Transaction ID: #{transactionData.merchant_transaction_id || 'N/A'}</p>
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
                  <p className="text-lg font-semibold">{policyNumber}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Payment Method</h3>
                  <p className="text-lg font-semibold">Digital Payment</p>
                </div>
              </div>

              {/* From and To Information */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-4">From</h3>
                  <div className="space-y-1">
                    <p className="font-semibold">IFRC Digitech Online Payment Gateway</p>
                    <p>6th Floor Padilla Building</p>
                    <p>F. Ortigas Jr. Road, Ortigas Center, Pasig City</p>
                    <p>TEL: +632 8633 5681</p>
                    <p>concierge@ifrcinsurance.com</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-4">To</h3>
                  <div className="space-y-1">
                    {policyHolder ? (
                      <>
                        <p className="font-medium uppercase">
                          {[policyHolder.FirstName, policyHolder.MiddleName, policyHolder.LastName]
                            .filter(Boolean).join(' ')}
                        </p>
                        <p>{policyHolder.AddressLine1 || 'N/A'}, {policyHolder.AddressLine2 || ''}</p>
                        <p>{policyHolder.Email || 'N/A'}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium uppercase">{transactionData.customer_name || 'N/A'}</p>
                        <p>N/A</p>
                        <p>N/A</p>
                      </>
                    )}
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
                      <p className="font-semibold">{transactionData.plan_name || policyDetails?.CarrierPlanCode || 'N/A'}</p>
                      <p className="text-gray-600">
                        {travelDetails ? `${travelDetails.PlaceOfOrgin || 'N/A'} → ${travelDetails.TravelCountry || 'N/A'}` : 'N/A'}
                      </p>
                      <p className="text-gray-600">
                        {policyDetails?.TravelDays ? `${policyDetails.TravelDays} Days` : 'N/A'} • {policyDetails?.TravelType || 'N/A'}
                      </p>
                    </div>
                    <p className="font-semibold text-lg">
                      {transactionData.amount ? `PHP ${Number(transactionData.amount).toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t mt-6">
                  <p className="text-lg font-semibold">Total Amount</p>
                  <p className="text-xl font-bold">
                    {transactionData.amount ? `PHP ${Number(transactionData.amount).toLocaleString()}` : 'N/A'}
                  </p>
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
                    <p className="font-semibold text-green-600">{transactionData.status || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Issue Date</p>
                    <p className="font-semibold">
                      {policyDetails?.IssueDate ? new Date(policyDetails.IssueDate).toLocaleDateString() : 
                       transactionData.transaction_date ? new Date(transactionData.transaction_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Coverage Period</p>
                    <p className="font-semibold">
                      {policyDetails?.EffectiveDate && policyDetails?.ExpiryDate ? 
                        `${new Date(policyDetails.EffectiveDate).toLocaleDateString()} - ${new Date(policyDetails.ExpiryDate).toLocaleDateString()}` : 
                        'N/A'}
                    </p>
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