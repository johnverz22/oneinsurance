import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  PDFDownloadLink,
} from '@react-pdf/renderer'
import { Button } from '@/components/ui/button'

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 9, fontFamily: 'Helvetica' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  logo: { width: 80, height: 40 },
  companyInfo: { fontSize: 8, maxWidth: '60%' },
  title: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    marginVertical: 0,
  },
  clientReq: {
    textAlign: 'center',
    fontSize: 8,
    color: '#403f3f',
    marginVertical: 0,
  },
  box: { border: '1pt solid #000', padding: 6, marginBottom: 6 },
  row: { flexDirection: 'row', borderBottom: '1pt solid #ccc' },
  cell: { flex: 1, padding: 4 },
  label: { fontWeight: 'bold' },
  footer: {
    position: 'absolute',
    textAlign: 'center',
    bottom: 20,
    left: 0,
    right: 0,
    fontSize: 8,
    color: '#403f3f',
  },
})

type Props = { data: any }

export const TravelPolicyPDF: React.FC<Props> = ({ data }) => {
  const travelDetails = data.travelDetailList || []
  const benefits = data.benefits || []
  const breakdown = data.breakdown || []
  const insured = data.mainInsuredInfo || {}
  const fullName = insured.firstName
    ? `${insured.firstName} ${insured.lastName}`
    : '**** ***'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <Image style={styles.logo} src="/images/logo.png" />
          <View style={styles.companyInfo}>
            <Text>IFRC Digitech Online Payment Gateway</Text>
            <Text>
              6th Floor Padilla Building, F. Ortigas Jr. Road, Ortigas Center,
              Pasig City.
            </Text>
            <Text>TEL: +632 8633 5681</Text>
            <Text>concierge@ifrcinsurance.com</Text>
          </View>
        </View>

        {/* TITLE */}
        <View style={{ marginVertical: 10 }}>
          <Text style={styles.title}>
            TRAVEL INSURANCE - {data.coverageArea}
          </Text>
          <Text style={styles.clientReq}>
            Client ID: {data.clientRequestId}
          </Text>
        </View>

        {/* TRIP INFORMATION */}
        {travelDetails.map((t: any, idx: number) => (
          <View key={idx} style={styles.box}>
            <Text style={styles.label}>
              TRIP INFORMATION #{t.DisplaySequence}
            </Text>
            <Text>COUNTRY TO VISIT: {t.TravelCountry}</Text>
            <Text>ORIGIN: {t.PlaceOfOrgin}</Text>
            <Text>AREA: {t.TravelCoverageArea}</Text>
            <Text>
              TRAVEL PERIOD: {new Date(data.departureDate).toLocaleDateString()}{' '}
              - {new Date(data.returnDate).toLocaleDateString()}
            </Text>
          </View>
        ))}

        {/* TRAVELLER DETAILS */}
        <View style={styles.box}>
          <Text style={styles.label}>TRAVELLER&apos;S DETAILS</Text>
          <View style={styles.row}>
            <Text style={[styles.cell, styles.label]}>NAME</Text>
            <Text style={[styles.cell, styles.label]}>BIRTH DATE</Text>
            <Text style={[styles.cell, styles.label]}>GENDER</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cell}>{fullName}</Text>
            <Text style={styles.cell}>
              {new Date(data.dateOfBirth).toLocaleDateString()}
            </Text>
            <Text style={styles.cell}>{insured.gender}</Text>
          </View>
        </View>

        {/* POLICY BENEFITS */}
        <View style={styles.box}>
          <Text style={styles.label}>POLICY BENEFITS</Text>
          {benefits.map((group: any, idx: number) => (
            <View key={idx} style={{ marginBottom: 4 }}>
              <Text style={{ fontWeight: 'bold', marginVertical: 2 }}>
                {group.coverageName}
              </Text>
              <View style={styles.row}>
                <Text style={[styles.cell, styles.label]}>BENEFIT</Text>
                <Text style={[styles.cell, styles.label]}>LIMIT</Text>
              </View>
              {group.benefits.map((b: any, bIdx: number) => (
                <View key={bIdx} style={styles.row}>
                  <Text style={styles.cell}>{b.BenefitDesc}</Text>
                  <Text style={styles.cell}>{b.DefaultLimitDesc || 'N/A'}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* PREMIUM BREAKDOWN */}
        <View style={styles.box}>
          <Text style={styles.label}>PREMIUM BREAKDOWN</Text>
          <View style={styles.row}>
            <Text style={[styles.cell, styles.label]}>ITEM</Text>
            <Text style={[styles.cell, styles.label]}>AMOUNT</Text>
          </View>
          {breakdown.map((b: any, idx: number) => (
            <View key={idx} style={styles.row}>
              <Text style={styles.cell}>{b.label}</Text>
              <Text style={styles.cell}>
                {b.value !== null
                  ? `${b.negative ? '-' : ''}${b.value}`
                  : 'N/A'}
              </Text>
            </View>
          ))}
        </View>

        {/* FOOTER */}
        <Text style={styles.footer}>
          This document is system generated and does not require signature.
        </Text>
      </Page>
    </Document>
  )
}

export const DownloadPDFButton = (travelPolicy: any) => {
  return (
    <PDFDownloadLink
      document={<TravelPolicyPDF data={travelPolicy} />}
      fileName="travel-policy.pdf"
    >
      {({ loading }) => (
        <Button className="w-full font-bold" variant="outline" size="lg">
          {loading ? 'Generating PDF...' : 'View and Download Travel Policy'}
        </Button>
      )}
    </PDFDownloadLink>
  )
}
