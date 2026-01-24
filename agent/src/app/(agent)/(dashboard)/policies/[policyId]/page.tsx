'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Download, 
  Shield, 
  User, 
  Calendar, 
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Building,
  Printer
} from 'lucide-react'
import { toast } from 'sonner'

// Mock data - In real implementation, this would come from an API
const mockPolicyData = {
  policyNumber: 'POTRAVEL00000115',
  proposalNumber: 'PROP-2024-001234',
  status: 'Active',
  effectiveDate: '2024-01-15',
  expiryDate: '2024-12-15',
  premiumAmount: 25000,
  commission: 2500,
  paymentMethod: 'Credit Card',
  transactionId: 'TXN-20240115-001',
  
  // Customer Information
  customer: {
    name: 'John Michael Doe',
    email: 'john.doe@email.com',
    phone: '+63 917 123 4567',
    address: '123 Main Street, Makati City, Metro Manila',
    dateOfBirth: '1985-06-15',
    gender: 'Male',
    idType: 'Driver\'s License',
    idNumber: 'N01-85-123456'
  },

  // Coverage Details
  coverages: [
    { name: 'Medical Expenses', limit: '₱1,000,000', premium: '₱5,000' },
    { name: 'Emergency Evacuation', limit: '₱500,000', premium: '₱3,000' },
    { name: 'Trip Cancellation', limit: '₱100,000', premium: '₱2,000' },
    { name: 'Baggage Protection', limit: '₱50,000', premium: '₱1,500' },
    { name: 'Personal Accident', limit: '₱2,000,000', premium: '₱8,000' },
    { name: 'Flight Delay', limit: '₱25,000', premium: '₱1,000' }
  ],

  // Payment Information
  payment: {
    method: 'Credit Card',
    cardNumber: '**** **** **** 1234',
    transactionDate: '2024-01-15T10:30:00Z',
    receiptNumber: 'RCP-20240115-001',
    status: 'Paid'
  }
}

export default function PolicyDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const policyId = params.policyId as string

  const handleDownloadCertificate = async () => {
    try {
      // Import jsPDF
      const jsPDF = (await import('jspdf')).default

      const pdf = new jsPDF('p', 'mm', 'a4')
      let yPosition = 20

      // Header
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text('POLICY CERTIFICATE', 20, yPosition)
      
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      pdf.text('One Insurance Company', 20, yPosition + 10)
      
      yPosition += 25

      // Policy Information
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('POLICY INFORMATION', 20, yPosition)
      yPosition += 10

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      
      const policyInfo = [
        `Policy Number: ${mockPolicyData.policyNumber}`,
        `Proposal Number: ${mockPolicyData.proposalNumber}`,
        `Status: ${mockPolicyData.status}`,
        `Effective Date: ${new Date(mockPolicyData.effectiveDate).toLocaleDateString()}`,
        `Expiry Date: ${new Date(mockPolicyData.expiryDate).toLocaleDateString()}`,
        `Premium Amount: PHP ${mockPolicyData.premiumAmount.toLocaleString()}`,
        `Commission: PHP ${mockPolicyData.commission.toLocaleString()}`,
        `Transaction ID: ${mockPolicyData.transactionId}`
      ]

      policyInfo.forEach(info => {
        pdf.text(info, 20, yPosition)
        yPosition += 5
      })

      yPosition += 10

      // Customer Information
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('CUSTOMER INFORMATION', 20, yPosition)
      yPosition += 10

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      
      const customerInfo = [
        `Full Name: ${mockPolicyData.customer.name}`,
        `Email: ${mockPolicyData.customer.email}`,
        `Phone: ${mockPolicyData.customer.phone}`,
        `Date of Birth: ${new Date(mockPolicyData.customer.dateOfBirth).toLocaleDateString()}`,
        `ID Type: ${mockPolicyData.customer.idType}`,
        `ID Number: ${mockPolicyData.customer.idNumber}`,
        `Address: ${mockPolicyData.customer.address}`
      ]

      customerInfo.forEach(info => {
        pdf.text(info, 20, yPosition)
        yPosition += 5
      })

      yPosition += 10

      // Coverage Details
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('COVERAGE DETAILS', 20, yPosition)
      yPosition += 10

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')

      mockPolicyData.coverages.forEach(coverage => {
        pdf.text(`Coverage: ${coverage.name}`, 20, yPosition)
        pdf.text(`Limit: ${coverage.limit}`, 20, yPosition + 4)
        pdf.text(`Premium: ${coverage.premium}`, 20, yPosition + 8)
        yPosition += 15
      })

      yPosition += 10

      // Payment Information
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('PAYMENT INFORMATION', 20, yPosition)
      yPosition += 10

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      
      const paymentInfo = [
        `Payment Method: ${mockPolicyData.payment.method}`,
        `Card Number: ${mockPolicyData.payment.cardNumber}`,
        `Transaction Date: ${new Date(mockPolicyData.payment.transactionDate).toLocaleDateString()}`,
        `Receipt Number: ${mockPolicyData.payment.receiptNumber}`,
        `Payment Status: ${mockPolicyData.payment.status}`
      ]

      paymentInfo.forEach(info => {
        pdf.text(info, 20, yPosition)
        yPosition += 5
      })

      // Footer
      const pageHeight = pdf.internal.pageSize.getHeight()
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'italic')
      pdf.text('This is an official policy certificate issued by One Insurance Company.', 20, pageHeight - 20)
      pdf.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, pageHeight - 15)
      
      // Save the PDF
      const fileName = `Policy_Certificate_${mockPolicyData.policyNumber}.pdf`
      pdf.save(fileName)
      
      toast.success('Policy certificate downloaded successfully!')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF. Please try again.')
    }
  }

  const handlePrintPolicy = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Policies
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Policy Details</h1>
            <p className="text-muted-foreground">Policy #{policyId}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDownloadCertificate}>
            <Download className="h-4 w-4 mr-2" />
            Download Certificate
          </Button>
          <Button onClick={handlePrintPolicy}>
            <Printer className="h-4 w-4 mr-2" />
            Print Policy
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Policy Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Policy Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Policy Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Policy Number</p>
                  <p className="font-semibold text-blue-600">{mockPolicyData.policyNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Proposal Number</p>
                  <p className="font-semibold">{mockPolicyData.proposalNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {mockPolicyData.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Transaction ID</p>
                  <p className="font-semibold">{mockPolicyData.transactionId}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Effective Date</p>
                  <p className="font-semibold">{new Date(mockPolicyData.effectiveDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Expiry Date</p>
                  <p className="font-semibold">{new Date(mockPolicyData.expiryDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Premium Amount</p>
                  <p className="font-semibold text-lg">₱{mockPolicyData.premiumAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Commission Earned</p>
                  <p className="font-semibold text-lg text-green-600">₱{mockPolicyData.commission.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Policy Holder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Policy Holder
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="font-semibold">{mockPolicyData.customer.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                  <p className="font-semibold">{new Date(mockPolicyData.customer.dateOfBirth).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="font-semibold">{mockPolicyData.customer.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p className="font-semibold">{mockPolicyData.customer.phone}</p>
                  </div>
                </div>
                <div className="md:col-span-2 flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                    <p className="font-semibold">{mockPolicyData.customer.address}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID Type</p>
                  <p className="font-semibold">{mockPolicyData.customer.idType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID Number</p>
                  <p className="font-semibold">{mockPolicyData.customer.idNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coverage Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Coverage Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockPolicyData.coverages.map((coverage, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{coverage.name}</p>
                      <p className="text-sm text-muted-foreground">Coverage Limit: {coverage.limit}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{coverage.premium}</p>
                      <p className="text-xs text-muted-foreground">Premium</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                <p className="font-semibold">{mockPolicyData.payment.method}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Card Number</p>
                <p className="font-semibold">{mockPolicyData.payment.cardNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Transaction Date</p>
                <p className="font-semibold">
                  {new Date(mockPolicyData.payment.transactionDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receipt Number</p>
                <p className="font-semibold">{mockPolicyData.payment.receiptNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment Status</p>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {mockPolicyData.payment.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={handleDownloadCertificate}>
                <Download className="h-4 w-4 mr-2" />
                Download Certificate
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={handlePrintPolicy}>
                <Printer className="h-4 w-4 mr-2" />
                Print Policy
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Review
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}