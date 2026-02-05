'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Download, 
  Printer
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { useGetTransactions } from '@/app/data/queries/transactions'
import axios from 'axios'

interface PolicyDetails {
  CarrierPolicyNo: string
  [key: string]: any // For other policy data that might come from the API
}

export default function AllPolicyDetailsPage() {
  const router = useRouter()
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [policyDetails, setPolicyDetails] = useState<Record<string, PolicyDetails>>({})
  const [loadingPolicies, setLoadingPolicies] = useState(false)
  
  // Get all transactions for the agent
  const { data: transactionsResponse, isLoading } = useGetTransactions(1, 100)
  const transactions = transactionsResponse?.data?.data || []

  // Load policy details for each transaction
  useEffect(() => {
    const loadPolicyDetails = async () => {
      if (transactions.length === 0) return
      
      setLoadingPolicies(true)
      const details: Record<string, PolicyDetails> = {}
      
      try {
        for (const transaction of transactions) {
          if (transaction.policy_id) {
            try {
              const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/quote/load`, {
                type: "policy",
                CarrierPolicyNo: transaction.policy_id
              }, {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${process.env.NEXT_PUBLIC_TOKEN}`
                }
              })
              
              if (response.data) {
                details[transaction.policy_id] = response.data
              }
            } catch (error: any) {
              // Silently handle errors - API might work in production
              details[transaction.policy_id] = {
                CarrierPolicyNo: transaction.policy_id
              }
            }
          }
        }
        
        setPolicyDetails(details)
      } catch (error) {
        // Silently handle errors
      } finally {
        setLoadingPolicies(false)
      }
    }

    loadPolicyDetails()
  }, [transactions])

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true)
    
    try {
      const jsPDF = (await import('jspdf')).default

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      let yPosition = 20

      // Header
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text('All Policies - Certificate of Coverage', 20, yPosition)
      
      yPosition += 10
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`${transactions.length} Transactions`, 20, yPosition)
      yPosition += 20

      // Process each transaction
      transactions.forEach((transaction, index) => {
        if (yPosition > pageHeight - 60) {
          pdf.addPage()
          yPosition = 20
        }

        const policyData = policyDetails[transaction.policy_id] || {}

        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text(`Transaction ${index + 1}`, 20, yPosition)
        yPosition += 10

        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        
        const details = [
          `Policy Number: ${(() => {
            // First try to get CarrierPolicyNo from policy_details if available
            if (transaction.policy_details) {
              try {
                const policyDetails = typeof transaction.policy_details === 'string' 
                  ? JSON.parse(transaction.policy_details) 
                  : transaction.policy_details;
                
                if (policyDetails?.CarrierPolicyNo) {
                  return policyDetails.CarrierPolicyNo;
                }
              } catch (e) {
                console.log('Failed to parse policy_details for CarrierPolicyNo:', e);
              }
            }
            
            // Fallback to carrier_policy_no field if available
            if (transaction.carrier_policy_no && transaction.carrier_policy_no.trim() !== '') {
              return transaction.carrier_policy_no;
            }
            
            // If no CarrierPolicyNo available, show N/A
            return 'N/A';
          })()}`,
          `Proposal Number: ${transaction.proposal_number}`,
          `Amount: ₱${transaction.amount?.toLocaleString() || 'N/A'}`,
          `Status: ${transaction.status?.toUpperCase() || 'N/A'}`,
          `Date: ${transaction.transaction_date ? new Date(transaction.transaction_date).toLocaleDateString() : 'N/A'}`,
          `Customer ID: ${transaction.customer_id || 'N/A'}`,
          `Transaction ID: ${transaction.merchant_transaction_id || 'N/A'}`,
          `Gross Commission: ₱${transaction.commission_log?.gross_commission ? parseFloat(transaction.commission_log.gross_commission).toFixed(2) : '0.00'}`,
          `Net Commission: ₱${transaction.commission_log?.net_commission ? parseFloat(transaction.commission_log.net_commission).toFixed(2) : '0.00'}`
        ]

        // Add policy-specific details if available
        if (Object.keys(policyData).length > 0) {
          details.push('--- Policy Details ---')
          Object.entries(policyData).forEach(([key, value]) => {
            if (key !== 'CarrierPolicyNo' && value) {
              details.push(`${key}: ${value}`)
            }
          })
        }

        details.forEach(detail => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage()
            yPosition = 20
          }
          pdf.text(detail, 25, yPosition)
          yPosition += 5
        })

        yPosition += 10
      })

      yPosition = pageHeight - 20
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'italic')
      pdf.text('Thank you for choosing One Insurance', 20, yPosition)
      
      const fileName = `All_Policies_Coverage_${new Date().toISOString().split('T')[0]}.pdf`
      
      pdf.save(fileName)
      toast.success(`PDF downloaded successfully!`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF. Please try again.')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (isLoading || loadingPolicies) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isLoading ? 'Loading transactions...' : 'Loading policy details...'}
          </p>
        </div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No transactions found.</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Sales
            </Button>
            <div>
              <h1 className="text-xl font-bold">All Policy Documents</h1>
              <p className="text-sm text-muted-foreground">{transactions.length} Transactions</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownloadPDF} disabled={isGeneratingPDF}>
              <Download className="h-4 w-4 mr-2" />
              {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF'}
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border min-h-[800px]">
          {/* Coverage Document */}
          <div className="p-8">
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">All Policies - Certificate of Coverage</h1>
                  <p className="text-gray-600">{transactions.length} Active Policies</p>
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

              {/* All Transactions */}
              {transactions.map((transaction, index) => {
                const policyData = policyDetails[transaction.policy_id] || {}
                
                return (
                  <div key={transaction.id} className={`mb-12 ${index > 0 ? 'border-t pt-8' : ''}`}>
                    {/* Policy Information */}
                    <div className="grid grid-cols-2 gap-8 mb-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Policy Number</h3>
                        <p className="text-lg font-semibold">{(() => {
                          // First try to get CarrierPolicyNo from policy_details if available
                          if (transaction.policy_details) {
                            try {
                              const policyDetails = typeof transaction.policy_details === 'string' 
                                ? JSON.parse(transaction.policy_details) 
                                : transaction.policy_details;
                              
                              if (policyDetails?.CarrierPolicyNo) {
                                return policyDetails.CarrierPolicyNo;
                              }
                            } catch (e) {
                              console.log('Failed to parse policy_details for CarrierPolicyNo:', e);
                            }
                          }
                          
                          // Fallback to carrier_policy_no field if available
                          if (transaction.carrier_policy_no && transaction.carrier_policy_no.trim() !== '') {
                            return transaction.carrier_policy_no;
                          }
                          
                          // If no CarrierPolicyNo available, show N/A
                          return 'N/A';
                        })()}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Proposal Number</h3>
                        <p className="text-lg font-semibold">{transaction.proposal_number}</p>
                      </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="grid grid-cols-3 gap-8 mb-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Amount</h3>
                        <p className="text-lg font-semibold">₱{transaction.amount?.toLocaleString() || 'N/A'}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
                        <p className={`text-lg font-semibold ${
                          transaction.status === 'completed' ? 'text-green-600' : 
                          transaction.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {transaction.status?.toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Transaction Date</h3>
                        <p className="text-lg font-semibold">
                          {transaction.transaction_date 
                            ? new Date(transaction.transaction_date).toLocaleDateString()
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Commission Details */}
                    <div className="grid grid-cols-2 gap-8 mb-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Gross Commission</h3>
                        <p className="text-lg font-semibold">
                          ₱{transaction.commission_log?.gross_commission 
                            ? parseFloat(transaction.commission_log.gross_commission).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : '0.00'
                          }
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Net Commission</h3>
                        <p className="text-lg font-semibold">
                          ₱{transaction.commission_log?.net_commission 
                            ? parseFloat(transaction.commission_log.net_commission).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : '0.00'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Policy Details from API */}
                    {Object.keys(policyData).length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">POLICY DETAILS</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(policyData).map(([key, value]) => {
                              if (key === 'CarrierPolicyNo' || !value) return null
                              return (
                                <div key={key}>
                                  <p className="text-sm text-gray-500 mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                  <p className="font-medium">{String(value)}</p>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Basic Coverage Information */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">COVERAGE DETAILS</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Customer ID</p>
                            <p className="font-medium">{transaction.customer_id || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Transaction ID</p>
                            <p className="font-medium">{transaction.merchant_transaction_id || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Footer Message */}
              <div className="text-center py-6 border-t">
                <p className="text-gray-600 italic">
                  Thank you for choosing One Insurance. All policies are active and protected!
                </p>
              </div>

              {/* Download Button */}
              <div className="text-center pt-4">
                <Button onClick={handleDownloadPDF} disabled={isGeneratingPDF} className="bg-gray-900 hover:bg-gray-800">
                  {isGeneratingPDF ? 'Generating PDF...' : 'Generate And Download All Coverage Documents'}
                </Button>
              </div>
            </div>
        </div>
      </div>
    </div>
  )
}