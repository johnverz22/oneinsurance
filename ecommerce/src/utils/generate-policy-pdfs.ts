import { jsPDF } from 'jspdf'
import { BRAND, CARD, DIVIDER, INK, MARGIN, MUTED, WHITE, clean, money, type Rgb } from '@/utils/generate-quote-pdf'

export interface PolicyDocData {
  policyNo: string
  proposalNo: string
  paymentRef: string
  planName: string
  insurer: string
  route: string
  dates: string
  duration: string
  travellers: string
  recipient: string
  groups: { title: string; rows: { label: string; value: string }[] }[]
  total: number
  paidAt: string
  method: string
}

const PAGE_W = 210
const PAGE_H = 297
const W = PAGE_W - MARGIN * 2

class Writer {
  doc = new jsPDF({ unit: 'mm', format: 'a4' })
  y = 0

  constructor(eyebrow: string, title: string, sub: string) {
    const d = this.doc
    d.setFillColor(...BRAND)
    d.rect(0, 0, PAGE_W, 34, 'F')
    d.setTextColor(...WHITE)
    d.setFont('helvetica', 'bold')
    d.setFontSize(8)
    d.text(eyebrow.toUpperCase(), MARGIN, 12)
    d.setFontSize(18)
    d.text(title, MARGIN, 21)
    d.setFont('helvetica', 'normal')
    d.setFontSize(9)
    d.text(clean(sub), MARGIN, 28)
    this.y = 44
  }

  ensure(h: number) {
    if (this.y + h > PAGE_H - 20) {
      this.doc.addPage()
      this.y = 20
    }
  }

  text(s: string, size: number, color: Rgb, bold = false, x = MARGIN, maxW = W) {
    const d = this.doc
    d.setFont('helvetica', bold ? 'bold' : 'normal')
    d.setFontSize(size)
    d.setTextColor(...color)
    const lines = d.splitTextToSize(clean(s) || '-', maxW) as string[]
    this.ensure(lines.length * size * 0.5 + 1)
    d.text(lines, x, this.y)
    this.y += lines.length * size * 0.5
  }

  section(title: string) {
    this.ensure(14)
    this.y += 4
    this.text(title.toUpperCase(), 8.5, BRAND, true)
    this.doc.setDrawColor(...DIVIDER)
    this.doc.line(MARGIN, this.y + 1.5, PAGE_W - MARGIN, this.y + 1.5)
    this.y += 6
  }

  row(label: string, value: string, bold = false) {
    const d = this.doc
    d.setFont('helvetica', bold ? 'bold' : 'normal')
    d.setFontSize(9.5)
    const left = d.splitTextToSize(clean(label), W * 0.62) as string[]
    const right = d.splitTextToSize(clean(value), W * 0.34) as string[]
    const h = Math.max(left.length, right.length) * 4.6
    this.ensure(h + 3)
    d.setTextColor(...INK)
    d.text(left, MARGIN, this.y)
    d.setFont('helvetica', 'bold')
    d.text(right, PAGE_W - MARGIN, this.y, { align: 'right' })
    this.y += h + 1.6
    d.setDrawColor(...DIVIDER)
    d.line(MARGIN, this.y - 2.4, PAGE_W - MARGIN, this.y - 2.4)
  }

  note(s: string) {
    const d = this.doc
    const lines = d.splitTextToSize(clean(s), W - 8) as string[]
    const h = lines.length * 4.4 + 7
    this.ensure(h + 4)
    this.y += 4
    d.setFillColor(...CARD)
    d.roundedRect(MARGIN, this.y - 4, W, h, 1.5, 1.5, 'F')
    d.setFont('helvetica', 'normal')
    d.setFontSize(8.5)
    d.setTextColor(...MUTED)
    d.text(lines, MARGIN + 4, this.y + 1)
    this.y += h
  }

  save(name: string) {
    const n = this.doc.getNumberOfPages()
    for (let i = 1; i <= n; i++) {
      this.doc.setPage(i)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setFontSize(8)
      this.doc.setTextColor(...MUTED)
      this.doc.text(`One Insurance  |  Page ${i} of ${n}`, PAGE_W / 2, PAGE_H - 10, { align: 'center' })
    }
    this.doc.save(name)
  }
}

const slug = (s: string) => s.replace(/[^A-Za-z0-9-]+/g, '-')

export function downloadCoverageSummary(d: PolicyDocData) {
  const w = new Writer('Policy issued', 'Coverage summary', `${d.planName} | ${d.insurer}`)
  w.section('Policy')
  w.row('Policy number', d.policyNo, true)
  w.row('Proposal number', d.proposalNo)
  w.row('Insured', d.recipient)
  w.row('Destination', d.route)
  w.row('Travel dates', `${d.dates} (${d.duration})`)
  w.row('Travellers', d.travellers)
  d.groups.forEach((g) => {
    w.section(g.title)
    g.rows.forEach((r) => w.row(r.label, r.value))
  })
  w.note(
    'This summary is for easy reference only. It is not the official eCOC, which is delivered by email. The insurer’s official eCOC and policy wording govern your cover. Amounts are in Philippine pesos unless stated otherwise; conditions and exclusions apply.',
  )
  w.save(`coverage-summary-${slug(d.policyNo)}.pdf`)
}

export function downloadReceipt(d: PolicyDocData) {
  const w = new Writer('Payment confirmation', 'Acknowledgement receipt', `Payment reference ${d.paymentRef}`)
  w.section('Payment')
  w.row('Received from', d.recipient)
  w.row('Payment date', d.paidAt)
  w.row('Payment method', d.method)
  w.row('Payment reference', d.paymentRef)
  w.row('Policy number', d.policyNo)
  w.row('Proposal number', d.proposalNo)
  w.row('Currency', 'PHP - Philippine peso')
  w.section('Charges')
  w.row(`Travel insurance premium - ${d.planName} (${d.dates}, ${d.travellers})`, money(d.total))
  w.row('Total amount received', money(d.total), true)
  w.note(
    'This acknowledgement records payment. It does not replace the insurer’s invoice or your eCOC.',
  )
  w.save(`acknowledgement-receipt-${slug(d.paymentRef)}.pdf`)
}
