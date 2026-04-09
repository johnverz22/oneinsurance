import {
  Page,
  Text,
  View,
  Image,
  Document,
  StyleSheet,
  PDFDownloadLink,
} from '@react-pdf/renderer'
import { Button } from '@/components/ui/button'
import { PaymentSubmitRequest } from '@/types/payment'
import { COMPANIES } from '@/constants/companies'

type InvoiceRendererProps = {
  invoiceData: {
    policyNumber: string
    carrierPolicyNumber?: string
    planName?: string
    proposalNumber: string
    invoiceDate: string
    customer: {
      name: string
      email: string
      phone: string
      address: string
    }
    travel: {
      type: string
      departureDate: string
      returnDate: string
      duration: string
      destinations: string
    }
    policy: {
      carrier: string
      plan: string
      coverageArea: string
    }
    payment: {
      basePremium: number
      method: string
    }
    status: {
      issueDate: string
      status: string
      effectiveDate: string
      expiryDate: string
    }
  }
}

const InsuranceInvoice = ({ invoiceData }: InvoiceRendererProps) => {
  const carrierName = COMPANIES.find(c => c.carrierCode === invoiceData.policy.carrier)?.companyName || invoiceData.policy.carrier || ''

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.invoiceTitle}>Invoice</Text>
            <Text style={styles.invoiceNumber}>
              #{localStorage.getItem('payment_transaction_id') || invoiceData.policyNumber}
            </Text>
          </View>
          <Image style={styles.logo} src="/images/IFRC.png" />
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Policy Number</Text>
            <Text style={styles.infoText}>{invoiceData.carrierPolicyNumber || invoiceData.policyNumber}</Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Insurance Provider</Text>
            <Text style={[styles.infoText, { fontWeight: 'bold' }]}>{carrierName}</Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Payment Method</Text>
            <Text style={styles.infoText}>{invoiceData.payment.method}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>From</Text>
            <Text style={styles.infoTitle}>
              IFRC Digitech Online Payment Gateway
            </Text>
            <Text style={styles.infoText}>6th Floor Padilla Building</Text>
            <Text style={styles.infoText}>
              F. Ortigas Jr. Road, Ortigas Center, Pasig City
            </Text>
            <Text style={styles.infoText}>TEL: +632 8633 5681</Text>
            <Text style={styles.infoText}>concierge@ifrcinsurance.com</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>To</Text>
            <Text style={styles.infoTitle}>{invoiceData.customer.name.toUpperCase()}</Text>
            <Text style={styles.infoText}>{invoiceData.customer.address}</Text>
            <Text style={styles.infoText}>{invoiceData.customer.email}</Text>
            <Text style={styles.infoText}>{invoiceData.customer.phone}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, styles.colDescription]}>
              Description
            </Text>
            <Text style={[styles.headerText, styles.colUnits]}>Units</Text>
            <Text style={[styles.headerText, styles.colPrice]}>Premium</Text>
          </View>

          {/* Travel Insurance Coverage */}
          <View style={styles.tableRow}>
            <View style={styles.colDescription}>
              <Text style={styles.cellText}>{invoiceData.planName || invoiceData.policy.plan}</Text>
              {carrierName ? (
                <Text style={[styles.cellText, { fontSize: 7, color: '#555', marginTop: 1, fontWeight: 'bold' }]}>
                  {carrierName}
                </Text>
              ) : null}
              <Text style={[styles.cellText, { fontSize: 7, color: '#999', marginTop: 2 }]}>
                {invoiceData.travel.destinations}
              </Text>
              <Text style={[styles.cellText, { fontSize: 7, color: '#999' }]}>
                {invoiceData.travel.duration} • {invoiceData.travel.type}
              </Text>
            </View>
            <Text style={[styles.cellText, styles.colUnits]}>1</Text>
            <Text style={[styles.cellText, styles.colPrice]}>
              PHP {invoiceData.payment.basePremium.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>
              PHP {invoiceData.payment.basePremium.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </Text>
          </View>
        </View>

        <Text style={styles.note}>
          {`Note: Policy coverage begins on the effective date. Please ensure payment is completed before departure.
          VAT Inclusive`}
        </Text>

        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Policy Status</Text>
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={styles.cellText}>{invoiceData.status.status}</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.infoLabel}>Issue Date</Text>
              <Text style={styles.cellText}>
                {invoiceData.status.issueDate}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.infoLabel}>Coverage Period</Text>
              <Text style={styles.cellText}>
                {invoiceData.status.effectiveDate} -{' '}
                {invoiceData.status.expiryDate}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.thankYou}>
          Thank you for choosing One Insurance. Have a safe and wonderful
          journey!
        </Text>
      </Page>
    </Document>
  )
}

export const GenerateAndDownloadInvoice = ({
  invoiceData,
}: InvoiceRendererProps) => {
  return (
    <PDFDownloadLink
      document={<InsuranceInvoice invoiceData={invoiceData} />}
      fileName="policy-invoice.pdf"
    >
      {({ loading }) => (
        <Button className="w-full font-bold" variant="outline" size="lg">
          {loading ? 'Generating Invoice...' : 'Generate And Download Invoice'}
        </Button>
      )}
    </PDFDownloadLink>
  )
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  invoiceNumber: {
    fontSize: 10,
    color: '#666666',
  },
  logo: { width: 80, height: 32 },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  infoBlock: {
    width: '48%',
  },
  infoLabel: {
    fontSize: 8,
    color: '#666666',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 9,
    color: '#333333',
    marginBottom: 2,
  },
  dateSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  dateBlock: {
    width: '32%',
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    paddingBottom: 8,
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
    justifyContent: 'space-between',
  },
  colDescription: {
    width: '40%',
  },
  colUnits: {
    width: '12%',
    textAlign: 'center',
  },
  colPrice: {
    width: '16%',
    textAlign: 'right',
  },
  colGST: {
    width: '16%',
    textAlign: 'right',
  },
  colAmount: {
    width: '16%',
    textAlign: 'right',
  },
  headerText: {
    fontSize: 8,
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cellText: {
    fontSize: 9,
    color: '#333333',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    marginRight: 40,
  },
  totalAmount: {
    fontSize: 11,
    fontWeight: 'bold',
    width: '16%',
    textAlign: 'right',
  },
  note: {
    fontSize: 8,
    color: '#666666',
    marginTop: 15,
    marginBottom: 25,
    fontStyle: 'italic',
  },
  paymentSection: {
    marginTop: 25,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  paymentTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  paymentText: {
    fontSize: 8,
    color: '#666666',
    marginBottom: 2,
  },
  signatureSection: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  signatureLine: {
    width: 150,
    borderTopWidth: 1,
    borderTopColor: '#000000',
    paddingTop: 5,
  },
  signatureName: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  signatureNote: {
    fontSize: 7,
    color: '#666666',
    marginTop: 2,
  },
  statusSection: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f8f8f8',
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statusItem: {
    width: '50%',
    marginBottom: 6,
  },
  thankYou: {
    textAlign: 'center',
    fontSize: 9,
    color: '#666666',
    marginTop: 30,
    fontStyle: 'italic',
  },
})
