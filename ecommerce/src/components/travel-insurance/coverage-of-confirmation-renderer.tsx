import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  PDFDownloadLink,
} from '@react-pdf/renderer'
import { Button } from '@/components/ui/button'
import { Coverage } from '../payment/coverage-of-confirmation'
import { COMPANIES } from '@/constants/companies'

type COCRendererProps = {
  cocData: {
    policyNumber: string // IMO Policy No. (internal use only)
    carrierPolicyNumber: string // Carrier Policy No. (for client documents)
    proposalNumber: string
    invoiceDate: string
    customers: {
      name: string
      email: string
      phone: string
      address: string
    }[]
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
    coverage: Coverage[]
    status: {
      issueDate: string
      status: string
      effectiveDate: string
      expiryDate: string
    }
    plan?: {
      code?: string
    }
  }
}

export const COCRenderer = ({ cocData }: COCRendererProps) => {
  const carrierName = COMPANIES.find(c => c.carrierCode === cocData.policy.carrier)?.companyName || cocData.policy.carrier || ''

  return (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Cover Note</Text>
          <Text style={styles.subtitle}>Issued by One Insurance</Text>
          <Text style={styles.policyNo}>#{(typeof window !== 'undefined' ? localStorage.getItem('payment_transaction_id') : null) || cocData.policyNumber}</Text>
        </View>
        <Image src={`${typeof window !== 'undefined' ? window.location.origin : ''}/images/IFRC.png`} style={styles.logo} />
      </View>

      <View style={styles.section}>
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.label}>Insurance Provider</Text>
            <Text style={[styles.value, { fontWeight: 'bold' }]}>{carrierName}</Text>

            <Text style={styles.label}>Plan</Text>
            <Text style={styles.value}>
              {cocData.policy.plan} (
              {cocData.plan?.code || cocData.policy.carrier})
            </Text>

            <Text style={styles.label}>Issued Date</Text>
            <Text style={styles.value}>{cocData.status.issueDate}</Text>

            <Text style={styles.label}>Travel Period</Text>
            <Text style={styles.value}>
              {cocData.travel.departureDate} - {cocData.travel.returnDate}
            </Text>

            <Text style={styles.label}>Duration</Text>
            <Text style={styles.value}>{cocData.travel.duration}</Text>

            <Text style={styles.label}>Destinations</Text>
            <Text style={styles.value}>{cocData.travel.destinations}</Text>
          </View>

          <View style={styles.col}>
            <Text style={styles.label}>Travel Type</Text>
            <Text style={styles.value}>{cocData.travel.type}</Text>

            <Text style={[styles.sectionSubTitle, { marginTop: 10 }]}>
              Insured Individuals
            </Text>
            {cocData.customers.map((c, i) => (
              <View key={i} style={styles.customerBlock}>
                <Text style={styles.customerName}>{c.name.toUpperCase()}</Text>
                <Text style={styles.customerText}>{c.address}</Text>
                <Text style={styles.customerText}>{c.email}</Text>
                <Text style={styles.customerText}>(+63) {c.phone}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Coverage Details</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, styles.thLeft]}>Coverage Name</Text>
          <Text style={[styles.tableCell, styles.thRight]}>Sum Insured</Text>
        </View>
        {cocData.coverage.map((item, i) => (
          <View
            key={i}
            style={[
              styles.tableRow,
              i % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
            ]}
          >
            <Text style={[styles.tableCell, styles.tdLeft]}>
              {item.coverageName}
            </Text>
            <Text style={[styles.tableCell, styles.tdRight]}>
              {typeof item.sumInsured === 'number'
                ? `PHP ${item.sumInsured.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                : item.sumInsured}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.summary}>
        <Text style={styles.sectionTitle}>Policy Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.label}>Status</Text>
            <Text style={[styles.value, styles.statusValue]}>
              {cocData.status.status}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.label}>Coverage Period</Text>
            <Text style={styles.value}>
              {cocData.status.effectiveDate} - {cocData.status.expiryDate}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.label}>Coverage Area</Text>
            <Text style={styles.value}>{cocData.policy.coverageArea}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Thank you for choosing One Insurance. Stay protected and travel with
          confidence.
        </Text>
        <Text style={styles.footerSub}>
          This document is electronically generated and valid without signature.
        </Text>
      </View>
    </Page>
  </Document>
  )
}

export const GenerateAndDownloadCoverNote = ({ cocData }: COCRendererProps) => {
  return (
    <PDFDownloadLink
      document={<COCRenderer cocData={cocData} />}
      fileName="cover-note.pdf"
    >
      {(({ loading }: { loading: boolean }) => (
        <Button className="w-full font-bold" variant="outline" size="lg">
          {loading
            ? 'Generating Cover Note...'
            : 'Generate And Download Cover Note'}
        </Button>
      )) as any}
    </PDFDownloadLink>
  )
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#222',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    marginBottom: 24,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111' },
  subtitle: { fontSize: 10, color: '#666', marginTop: 2 },
  policyNo: { fontSize: 9, color: '#333', marginTop: 4 },
  logo: { width: 80, height: 28 },
  section: { marginBottom: 20 },
  twoCol: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { width: '48%' },
  label: { fontSize: 8, color: '#666', marginTop: 6 },
  value: { fontSize: 9, color: '#222', marginTop: 1 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 8,
  },
  sectionSubTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  customerBlock: {
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
  },
  customerName: { fontSize: 9, fontWeight: 'bold', color: '#000' },
  customerText: { fontSize: 8, color: '#444' },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 6,
  },
  tableRow: { flexDirection: 'row', paddingVertical: 6 },
  tableRowEven: { backgroundColor: '#f9f9f9' },
  tableRowOdd: { backgroundColor: '#fff' },
  tableCell: { flex: 1, fontSize: 9 },
  thLeft: { fontWeight: 'bold', color: '#444' },
  thRight: { fontWeight: 'bold', color: '#444', textAlign: 'right' },
  tdLeft: { textAlign: 'left' },
  tdRight: { textAlign: 'right' },
  summary: {
    backgroundColor: '#f7f7f7',
    padding: 12,
    borderRadius: 4,
  },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  summaryItem: { width: '50%', marginBottom: 6 },
  statusValue: { color: '#008000', fontWeight: 'bold' },
  footer: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  footerText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 9,
    fontStyle: 'italic',
  },
  footerSub: {
    textAlign: 'center',
    color: '#999',
    fontSize: 8,
    marginTop: 2,
  },
})
