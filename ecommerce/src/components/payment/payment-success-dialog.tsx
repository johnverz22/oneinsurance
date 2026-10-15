'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle,
  Download,
  FileText,
  CreditCard,
  Smartphone,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  Shield,
} from 'lucide-react'
import { PaymentBrand, PaymentSubmitResponse } from '@/types/payment'
import { FullQuoteResponse, TravelPolicyData } from '@/types/travel-insurance/policy-types'
import { CoverageOfConfirmation } from './coverage-of-confirmation'

interface PaymentSuccessDialogProps {
  open: boolean
  onContinue: () => void
  paymentMethod: PaymentBrand
  policyData: TravelPolicyData | null | undefined
  quoteData: FullQuoteResponse['data']
  paymentSubmit: PaymentSubmitResponse['data']
}

export function PaymentSuccessDialog({
  open,
  onContinue,
  paymentMethod,
  policyData,
  quoteData,
}: PaymentSuccessDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [showCertificate, setShowCertificate] = useState(true)

  const handleDownloadInvoice = async () => {
    setIsDownloading(true)
    // Simulate download process
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Create a simple PDF-like content for download
    const invoiceContent = generateInvoiceText()
    const blob = new Blob([invoiceContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `travel-insurance-invoice-${policyData?.CarrierPolicyNo || 'N/A'}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setIsDownloading(false)
  }

  const handlePrintInvoice = () => {
    setIsPrinting(true)
    // Create a new window with invoice content for printing
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(generatePrintableInvoice())
      printWindow.document.close()
      printWindow.print()
    }
    setIsPrinting(false)
  }

  const generateInvoiceText = () => {
    return `
TRAVEL INSURANCE INVOICE
========================

Policy Number: ${policyData?.CarrierPolicyNo || 'N/A'}
Proposal Number: ${policyData?.ProposalNo}
Invoice Date: ${format(new Date(), 'PPP')}

CUSTOMER INFORMATION
--------------------
Name: ${quoteData.PolicyCustomerList?.[0]?.FirstName} ${quoteData.PolicyCustomerList?.[0]?.LastName}
Email: ${quoteData.PolicyCustomerList?.[0]?.Email}
Phone: ${quoteData.PolicyCustomerList?.[0]?.Mobile}
Address: ${quoteData.PolicyCustomerList?.[0]?.AddressLine1}, ${quoteData.PolicyCustomerList?.[0]?.City}

TRAVEL DETAILS
--------------
Travel Type: ${quoteData.TravelType}
Departure: ${format(new Date(quoteData.EffectiveDate), 'PPP')}
Return: ${format(new Date(quoteData.ExpiryDate), 'PPP')}
Duration: ${quoteData.TravelDays} days
Destination: ${quoteData.TravelDetailList?.[0]?.TravelCountry}

POLICY DETAILS
--------------
Carrier: ${quoteData.CarrierCode}
Plan: ${quoteData.CarrierPlanCode}
Coverage Area: ${quoteData.TravelDetailList?.[0]?.TravelCoverageArea}

PAYMENT SUMMARY
---------------
Base Premium: ₱${quoteData.BeforeVatPremium?.toLocaleString()}${
      quoteData.LGT > 0
        ? `
Local Government Tax (LGT): ₱${quoteData.LGT?.toLocaleString()}`
        : ''
    }
VAT (12%): ₱${(quoteData.DuePremium - quoteData.BeforeVatPremium || 0).toLocaleString()}${
      quoteData.GrossPremium !== quoteData.BeforeVatPremium
        ? `
Processing Fees: ₱${(quoteData.GrossPremium - quoteData.BeforeVatPremium || 0).toLocaleString()}`
        : ''
    }
---
Total Amount: ₱${quoteData.DuePremium?.toLocaleString()}
Payment Method: ${paymentMethod.value}

POLICY STATUS
-------------
Status: Active
Issue Date: ${format(new Date(), 'PPP')}
Effective Date: ${format(new Date(quoteData.EffectiveDate), 'PPP')}
Expiry Date: ${format(new Date(quoteData.ExpiryDate), 'PPP')}

Thank you for choosing our travel insurance service!
`
  }

  const generatePrintableInvoice = () => {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Travel Insurance Invoice</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 20px; }
        .section h3 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        .info-row { display: flex; justify-content: space-between; margin: 5px 0; }
        .amount { font-weight: bold; font-size: 18px; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>Travel Insurance Invoice</h1>
        <p>Policy Number: ${policyData?.CarrierPolicyNo || 'N/A'}</p>
        <p>Invoice Date: ${format(new Date(), 'PPP')}</p>
    </div>
    
    <div class="section">
        <h3>Customer Information</h3>
        <div class="info-row">
            <span>Name:</span>
            <span>${quoteData.PolicyCustomerList?.[0]?.FirstName} ${quoteData.PolicyCustomerList?.[0]?.LastName}</span>
        </div>
        <div class="info-row">
            <span>Email:</span>
            <span>${quoteData.PolicyCustomerList?.[0]?.Email}</span>
        </div>
        <div class="info-row">
            <span>Phone:</span>
            <span>${quoteData.PolicyCustomerList?.[0]?.Mobile}</span>
        </div>
    </div>

    <div class="section">
        <h3>Travel Details</h3>
        <div class="info-row">
            <span>Travel Type:</span>
            <span>${quoteData.TravelType}</span>
        </div>
        <div class="info-row">
            <span>Departure:</span>
            <span>${format(new Date(quoteData.EffectiveDate), 'PPP')}</span>
        </div>
        <div class="info-row">
            <span>Return:</span>
            <span>${format(new Date(quoteData.ExpiryDate), 'PPP')}</span>
        </div>
        <div class="info-row">
            <span>Destination:</span>
            <span>${quoteData.TravelDetailList?.[0]?.TravelCountry}</span>
        </div>
    </div>

    <div class="section">
        <h3>Payment Summary</h3>
        <div class="info-row">
            <span>Base Premium:</span>
            <span>₱${quoteData.BeforeVatPremium?.toLocaleString()}</span>
        </div>${
          quoteData.LGT > 0
            ? `
        <div class="info-row">
            <span>Local Government Tax (LGT):</span>
            <span>₱${quoteData.LGT?.toLocaleString()}</span>
        </div>`
            : ''
        }
        <div class="info-row">
            <span>VAT (12%):</span>
            <span>₱${(quoteData.DuePremium - quoteData.BeforeVatPremium || 0).toLocaleString()}</span>
        </div>${
          quoteData.GrossPremium !== quoteData.BeforeVatPremium
            ? `
        <div class="info-row">
            <span>Processing Fees:</span>
            <span>₱${(quoteData.GrossPremium - quoteData.BeforeVatPremium || 0).toLocaleString()}</span>
        </div>`
            : ''
        }
        <div class="info-row amount">
            <span>Total Amount:</span>
            <span>₱${quoteData.DuePremium?.toLocaleString()}</span>
        </div>
        <div class="info-row">
            <span>Payment Method:</span>
            <span>${paymentMethod.value}</span>
        </div>
    </div>
</body>
</html>
`
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-h-[95vh] min-w-[95%] overflow-y-auto p-3 sm:p-6 md:w-[90%] lg:w-[80%]"
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <div className="mb-3 flex justify-center sm:mb-4">
            <div className="rounded-full bg-success/10 p-2 sm:p-3">
              <CheckCircle className="h-6 w-6 text-success sm:h-8 sm:w-8" />
            </div>
          </div>
          <DialogTitle className="text-xl font-bold text-success sm:text-2xl">
            Payment Successful!
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Your travel insurance policy has been successfully issued.
          </DialogDescription>
        </DialogHeader>

        {/* Toggle Buttons */}
        <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:justify-center">
          <Button
            variant={showCertificate ? 'default' : 'outline'}
            onClick={() => setShowCertificate(true)}
            className="flex items-center gap-2 py-3 text-sm sm:text-base"
          >
            <FileText className="h-4 w-4" />
            Cover Note
          </Button>
          <Button
            variant={!showCertificate ? 'default' : 'outline'}
            onClick={() => setShowCertificate(false)}
            className="flex items-center gap-2 py-3 text-sm sm:text-base"
          >
            <Shield className="h-4 w-4" />
            Invoice Details
          </Button>
        </div>

        {showCertificate ? (
          /* Cover Note Display */
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-base font-semibold sm:text-lg">
                Cover Note
              </h3>
              <Badge className="self-start border-success/50 bg-success/10 text-success sm:self-auto">
                Active Policy
              </Badge>
            </div>
            <div className="rounded-lg border bg-muted/50 p-2 sm:p-4">
              <CoverageOfConfirmation
                policyData={policyData}
                quoteData={quoteData}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const certificateContent = `
COVER NOTE
=======================

Policy Number: ${policyData?.CarrierPolicyNo || 'N/A'}
Proposal Number: ${policyData?.ProposalNo}
Issue Date: ${format(new Date(), 'PPP')}

POLICY INFORMATION
------------------
Carrier Policy: ${quoteData.CarrierPlanCode || '34567890'}
Product Code: ${quoteData.CarrierProductCode || 'TRAVEL'}
Plan Code: ${quoteData.CarrierPlanCode || 'TRVL-AXA-001'}

COVERAGE DETAILS
----------------
Travel Type: ${quoteData.TravelType || 'Family'}
Trip Type: ${quoteData.TripType || 'Single Trip'}
Number of travelers: ${quoteData.NoOfTravellers || '2'}
Adults: ${quoteData.NoOfAdults || '1'}
Children: ${quoteData.NoOfChildren || '1'}

PREMIUM INFORMATION
-------------------
Annual Premium: ₱${(quoteData.AnnualPremium || 5000).toLocaleString()}
Gross Premium: ₱${(quoteData.GrossPremium || 11000).toLocaleString()}
Due Premium: ₱${(quoteData.DuePremium || 11000).toLocaleString()}
Age: ${quoteData.Age || 25}
Renewable: Yes

CARRIER INFORMATION
-------------------
Carrier Code: ${quoteData.CarrierCode || 'AXASMRTTR'}
Carrier Plan: ${quoteData.CarrierPlanCode || 'TRVL-TRVL-01'}
Product Code: ${quoteData.CarrierProductCode || 'AZATRVL'}
Issue Date: ${format(new Date(), 'MMMM dd, yyyy')}
Proposal Date: ${format(new Date(), 'MMMM dd, yyyy')}

INSURED INFORMATION
-------------------
ID Type: ${quoteData.PolicyCustomerList?.[0]?.IdTypeCode || 'PhilHealth ID'}
ID Number: ${quoteData.PolicyCustomerList?.[0]?.IdNo || '123-4567-8910'}

POLICY REFERENCE NUMBERS
-------------------------
Business Object ID: ${quoteData.BusinessObjectId || '123456789A'}
Carrier Proposal Number: ${policyData?.ProposalNo || '123456789B'}

COVERAGE DATES
--------------
Effective Date: ${format(new Date(quoteData.EffectiveDate), 'MMMM dd, yyyy')}
Expiry Date: ${format(new Date(quoteData.ExpiryDate), 'MMMM dd, yyyy')}

STATUS: ACTIVE POLICY

This certificate serves as proof of coverage for the above-mentioned travel insurance policy.
`
                  const blob = new Blob([certificateContent], {
                    type: 'text/plain',
                  })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `certificate-of-coverage-${policyData?.CarrierPolicyNo || 'N/A'}.txt`
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  URL.revokeObjectURL(url)
                }}
                className="flex items-center justify-center gap-2 py-3 text-sm sm:text-base"
              >
                <Download className="h-4 w-4" />
                Download Certificate
              </Button>
            </div>
          </div>
        ) : (
          /* Invoice Details Display */
          <div className="space-y-6">
            {/* Policy Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Policy Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Policy Number
                  </span>
                  <Badge variant="outline" className="font-mono text-sm">
                    {policyData?.CarrierPolicyNo || 'N/A'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Proposal Number
                  </span>
                  <span className="font-medium">{policyData?.ProposalNo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Issue Date
                  </span>
                  <span className="font-medium">
                    {format(new Date(), 'PPP')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Status</span>
                  <Badge className="border-success/50 bg-success/10 text-success">
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Name</span>
                  <span className="font-medium">
                    {quoteData.PolicyCustomerList?.[0]?.FirstName}{' '}
                    {quoteData.PolicyCustomerList?.[0]?.LastName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1 text-sm">
                    <Mail className="h-3 w-3" />
                    Email
                  </span>
                  <span className="font-medium">
                    {quoteData.PolicyCustomerList?.[0]?.Email}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1 text-sm">
                    <Phone className="h-3 w-3" />
                    Phone
                  </span>
                  <span className="font-medium">
                    {quoteData.PolicyCustomerList?.[0]?.Mobile}
                  </span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-muted-foreground flex items-center gap-1 text-sm">
                    <MapPin className="h-3 w-3" />
                    Address
                  </span>
                  <span className="max-w-xs text-right font-medium">
                    {quoteData.PolicyCustomerList?.[0]?.AddressLine1},{' '}
                    {quoteData.PolicyCustomerList?.[0]?.City}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Travel Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Travel Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Travel Type
                  </span>
                  <Badge variant="secondary">{quoteData.TravelType}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Departure Date
                  </span>
                  <span className="font-medium">
                    {format(new Date(quoteData.EffectiveDate), 'PPP')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Return Date
                  </span>
                  <span className="font-medium">
                    {format(new Date(quoteData.ExpiryDate), 'PPP')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Duration
                  </span>
                  <span className="font-medium">
                    {quoteData.TravelDays} days
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Destination
                  </span>
                  <span className="font-medium">
                    {quoteData.TravelDetailList?.[0]?.TravelCountry}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Coverage Area
                  </span>
                  <span className="font-medium">
                    {quoteData.TravelDetailList?.[0]?.TravelCoverageArea}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {paymentMethod.is_card ? (
                    <CreditCard className="h-5 w-5" />
                  ) : (
                    <Smartphone className="h-5 w-5" />
                  )}
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Payment Method
                  </span>
                  <div className="flex items-center gap-2">
                    <img
                      src={paymentMethod.image}
                      alt={paymentMethod.value}
                      className="h-6 w-10 object-contain"
                    />
                    <span className="font-medium">{paymentMethod.value}</span>
                  </div>
                </div>
                <Separator />

                {/* Detailed Cost Breakdown */}
                <div className="space-y-2 rounded-lg bg-muted/50 p-3 dark:bg-gray-800/50">
                  <h4 className="text-sm font-semibold text-foreground dark:text-muted-foreground">
                    Cost Breakdown
                  </h4>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Base Premium
                    </span>
                    <span className="font-medium">
                      ₱{(quoteData.BeforeVatPremium || 0).toLocaleString()}
                    </span>
                  </div>

                  {quoteData.LGT > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Local Government Tax (LGT)
                      </span>
                      <span className="font-medium">
                        ₱{quoteData.LGT.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      VAT (12%)
                    </span>
                    <span className="font-medium">
                      ₱
                      {(
                        quoteData.DuePremium - quoteData.BeforeVatPremium || 0
                      ).toLocaleString()}
                    </span>
                  </div>

                  {/* Additional fees if available */}
                  {quoteData.GrossPremium !== quoteData.BeforeVatPremium && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Processing Fees
                      </span>
                      <span className="font-medium">
                        ₱
                        {(
                          quoteData.GrossPremium - quoteData.BeforeVatPremium ||
                          0
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <Separator />
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total Paid</span>
                  <span className="text-success">
                    ₱{quoteData.DuePremium?.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Policy Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Policy Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Insurance Carrier
                  </span>
                  <span className="font-medium">{quoteData.CarrierCode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Plan Code
                  </span>
                  <span className="font-medium">
                    {quoteData.CarrierPlanCode}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Product Code
                  </span>
                  <span className="font-medium">
                    {quoteData.CarrierProductCode}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter className="flex flex-col gap-3 pt-4 sm:flex-row sm:gap-2 sm:pt-6">
          {!showCertificate && (
            <>
              <Button
                variant="outline"
                onClick={handleDownloadInvoice}
                disabled={isDownloading}
                className="flex items-center justify-center gap-2 py-3 text-sm sm:text-base"
              >
                <Download className="h-4 w-4" />
                {isDownloading ? 'Downloading...' : 'Download Invoice'}
              </Button>
              <Button
                variant="outline"
                onClick={handlePrintInvoice}
                disabled={isPrinting}
                className="flex items-center justify-center gap-2 py-3 text-sm sm:text-base"
              >
                <Download className="h-4 w-4" />
                Print Invoice
              </Button>
            </>
          )}
          <Button
            onClick={onContinue}
            className="flex-1 py-3 text-sm font-medium sm:text-base"
          >
            Continue to Policy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
