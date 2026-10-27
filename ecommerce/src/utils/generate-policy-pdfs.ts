import { jsPDF } from 'jspdf'
import {
  BRAND,
  CARD,
  CARD_BORDER,
  DIVIDER,
  FS,
  INK,
  INK_GREEN,
  MARGIN,
  MM,
  MUTED,
  PAD,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  SUPPORT_WEB,
  WHITE,
  clean,
  lh,
  loadImage,
  money,
  type PdfImage,
  type Rgb,
} from '@/utils/generate-quote-pdf'

export interface PolicyDocData {
  policyNo: string
  proposalNo: string
  paymentRef: string
  planName: string
  insurer: string
  insurerLogoUrl?: string | null
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

type Row = { label: string; value: string; bold?: boolean }
type Field = { label: string; value: string; full?: boolean }

const PAGE_W = 210
const PAGE_H = 297
const W = PAGE_W - MARGIN * 2
const LIMIT_Y = PAGE_H - 24
const TOP = 14
const GAP = 6.4
const INNER_X = MARGIN + PAD
const INNER_W = W - 2 * PAD
const VALUE_FS = 11.5

class Writer {
  doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  y = TOP

  constructor(
    private tag: string,
    private refLabel: string,
    private refValue: string,
    private generated: string,
    private logo: PdfImage | null,
    private footerNote: string,
    private providerLogo: PdfImage | null = null,
  ) {
    this.doc.setLineHeightFactor(1.3)
    this.header()
  }

  private font(fs: number, bold: boolean, color: Rgb) {
    this.doc.setFont('helvetica', bold ? 'bold' : 'normal')
    this.doc.setFontSize(fs)
    this.doc.setTextColor(...color)
  }

  private base = (top: number, fs: number) => top + fs * MM * 0.9

  private wrap(text: string, w: number, fs: number, bold = false) {
    this.doc.setFont('helvetica', bold ? 'bold' : 'normal')
    this.doc.setFontSize(fs)
    return this.doc.splitTextToSize(clean(text) || '-', w) as string[]
  }

  private ensure(h: number) {
    if (this.y + h > LIMIT_Y) {
      this.doc.addPage()
      this.y = TOP
    }
  }

  private header() {
    const d = this.doc
    const logoH = 11
    if (this.logo) d.addImage(this.logo.data, 'PNG', MARGIN, this.y, logoH * this.logo.aspect, logoH, 'logo', 'FAST')
    else {
      this.font(18, true, INK_GREEN)
      d.text('One Insurance', MARGIN, this.y + 8)
    }
    const tagH = 6.4
    const tagY = this.y + logoH + 3
    this.font(FS.label, true, INK_GREEN)
    const tagW = d.getTextWidth(this.tag.toUpperCase()) + 8
    d.setDrawColor(...INK_GREEN)
    d.setLineWidth(0.35)
    d.roundedRect(MARGIN, tagY, tagW, tagH, 1, 1, 'S')
    d.text(this.tag.toUpperCase(), MARGIN + tagW / 2, this.base(tagY + (tagH - lh(FS.label)) / 2 + 0.3, FS.label), { align: 'center' })

    const rx = MARGIN + W
    let hy = this.y
    this.font(FS.label, true, MUTED)
    d.text(this.refLabel.toUpperCase(), rx, this.base(hy, FS.label), { align: 'right' })
    hy += lh(FS.label)
    this.font(14, true, INK)
    d.text(clean(this.refValue), rx, this.base(hy, 14), { align: 'right' })
    hy += lh(14) + 1
    this.font(FS.body, false, INK)
    d.text(`Generated: ${clean(this.generated)}`, rx, this.base(hy, FS.body), { align: 'right' })
    hy += lh(FS.body)

    this.y = Math.max(tagY + tagH, hy) + 3
    d.setDrawColor(...BRAND)
    d.setLineWidth(0.7)
    d.line(MARGIN, this.y, MARGIN + W, this.y)
    this.y += GAP * 0.75
  }

  band(plan: string, sub: string, totalLabel: string, total: string, totalNote: string, facts: { label: string; value: string }[]) {
    const d = this.doc
    const bp = 5
    const inner = W - 2 * bp
    const rightW = 68
    const logoBoxW = this.providerLogo ? 30 : 0
    const logoGap = this.providerLogo ? 4 : 0
    const leftW = inner - rightW - 6 - logoBoxW - logoGap
    const planLines = this.wrap(plan, leftW, 14, true).slice(0, 2)
    const subLines = this.wrap(sub, leftW, FS.min)
    const topH = Math.max(
      lh(FS.label) + planLines.length * lh(14) + subLines.length * lh(FS.min) + 1,
      lh(FS.label) + lh(FS.total) + lh(FS.min) + 1,
    )
    const cw = inner / facts.length
    const factLines = facts.map((f) => this.wrap(f.value, cw - 3, FS.body, true).slice(0, 2))
    const factsH = lh(FS.label) + Math.max(...factLines.map((l) => l.length)) * lh(FS.body) + 1
    const h = bp + topH + 3.5 + factsH + bp
    this.ensure(h)

    d.setFillColor(...INK_GREEN)
    d.roundedRect(MARGIN, this.y, W, h, 2.5, 2.5, 'F')
    const bx = MARGIN + bp
    const x0 = bx + logoBoxW + logoGap
    const y0 = this.y + bp
    if (this.providerLogo) {
      const boxH = Math.min(topH, 14)
      d.setFillColor(...WHITE)
      d.roundedRect(bx, y0, logoBoxW, boxH, 1.5, 1.5, 'F')
      const lw = Math.min(logoBoxW - 4, (boxH - 3) * this.providerLogo.aspect)
      const lhh = lw / this.providerLogo.aspect
      d.addImage(this.providerLogo.data, 'PNG', bx + (logoBoxW - lw) / 2, y0 + (boxH - lhh) / 2, lw, lhh, 'provider', 'FAST')
    }
    this.font(FS.label, true, WHITE)
    d.text('PLAN', x0, this.base(y0, FS.label))
    this.font(14, true, WHITE)
    d.text(planLines, x0, this.base(y0 + lh(FS.label), 14))
    this.font(FS.min, false, WHITE)
    d.text(subLines, x0, this.base(y0 + lh(FS.label) + planLines.length * lh(14) + 0.8, FS.min))

    const rxb = MARGIN + W - bp
    this.font(FS.label, true, WHITE)
    d.text(totalLabel.toUpperCase(), rxb, this.base(y0, FS.label), { align: 'right' })
    this.font(FS.total, true, WHITE)
    d.text(clean(total), rxb, this.base(y0 + lh(FS.label), FS.total), { align: 'right' })
    this.font(FS.min, false, WHITE)
    d.text(clean(totalNote), rxb, this.base(y0 + lh(FS.label) + lh(FS.total) + 0.4, FS.min), { align: 'right' })

    const ly = y0 + topH + 1.75
    d.setDrawColor(...WHITE)
    d.setLineWidth(0.26)
    d.line(x0, ly, MARGIN + W - bp, ly)
    facts.forEach((f, i) => {
      const fx = x0 + cw * i
      this.font(FS.label, true, WHITE)
      d.text(f.label.toUpperCase(), fx, this.base(ly + 1.75, FS.label))
      this.font(FS.body, true, WHITE)
      d.text(factLines[i], fx, this.base(ly + 1.75 + lh(FS.label), FS.body))
    })
    this.y += h + GAP
  }

  private cardBg(top: number, h: number) {
    this.doc.setFillColor(...CARD)
    this.doc.setDrawColor(...CARD_BORDER)
    this.doc.setLineWidth(0.26)
    this.doc.roundedRect(MARGIN, top, W, h, 2, 2, 'FD')
  }

  private title(text: string, cont: boolean) {
    this.font(FS.title, true, INK_GREEN)
    this.doc.text(cont ? `${text} (continued)` : text, INNER_X, this.base(this.y, FS.title))
    this.y += lh(FS.title) + 2.1
  }

  private card(title: string, heights: number[], draw: (i: number) => void) {
    const titleH = lh(FS.title) + 2.1
    let i = 0
    let cont = false
    while (i < heights.length) {
      this.ensure(PAD * 2 + titleH + heights[i])
      let end = i
      let used = PAD * 2 + titleH
      while (end < heights.length && this.y + used + heights[end] <= LIMIT_Y) used += heights[end++]
      if (end === i) end = i + 1
      this.cardBg(this.y, used)
      this.y += PAD
      this.title(title, cont)
      for (let k = i; k < end; k++) draw(k)
      this.y += PAD + GAP
      i = end
      cont = true
      if (i < heights.length) {
        this.doc.addPage()
        this.y = TOP
      }
    }
  }

  fields(title: string, items: Field[]) {
    const list = items.filter((f) => f.value)
    if (!list.length) return
    const colW = INNER_W / 2
    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(VALUE_FS)
    const sized = list.map((f) => ({ f, full: !!f.full || this.doc.getTextWidth(clean(f.value)) > colW - 6 }))
    const rows: { f: Field; full: boolean }[][] = []
    for (let i = 0; i < sized.length; i++) {
      const cur = sized[i]
      const nxt = sized[i + 1]
      if (!cur.full && nxt && !nxt.full) rows.push([cur, nxt]), i++
      else rows.push([{ f: cur.f, full: true }])
    }
    const prepared = rows.map((row) =>
      row.map((c, k) => ({ ...c, lines: this.wrap(c.f.value, c.full ? INNER_W : colW - 6, VALUE_FS), x: INNER_X + (c.full ? 0 : colW * k) })),
    )
    const heights = prepared.map((r) => lh(FS.label) + 0.6 + Math.max(...r.map((p) => p.lines.length)) * lh(VALUE_FS) + 4.2)
    this.card(title, heights, (i) => {
      prepared[i].forEach((p) => {
        this.font(9, false, MUTED)
        this.doc.text(p.f.label, p.x, this.base(this.y, 9))
        this.font(VALUE_FS, false, INK)
        this.doc.text(p.lines, p.x, this.base(this.y + lh(9) + 0.6, VALUE_FS))
      })
      this.y += heights[i]
    })
  }

  table(title: string, head: [string, string], items: Row[]) {
    if (!items.length) return
    const valueW = 62
    const labelW = INNER_W - valueW - 4
    const prepared = items.map((r) => ({
      r,
      left: this.wrap(r.label, labelW, FS.body, !!r.bold),
      right: this.wrap(r.value, valueW, FS.body, true),
    }))
    const rowH = (p: (typeof prepared)[number]) => Math.max(p.left.length, p.right.length) * lh(FS.body) + 2.6
    const heights = [lh(FS.label) + 2.6, ...prepared.map(rowH)]
    this.card(title, heights, (i) => {
      const d = this.doc
      if (i === 0) {
        this.font(FS.label, true, MUTED)
        d.text(head[0].toUpperCase(), INNER_X + 1, this.base(this.y + 1.3, FS.label))
        d.text(head[1].toUpperCase(), INNER_X + INNER_W - 1, this.base(this.y + 1.3, FS.label), { align: 'right' })
        this.y += heights[0]
        d.setDrawColor(...CARD_BORDER)
        d.setLineWidth(0.26)
        d.line(INNER_X, this.y, INNER_X + INNER_W, this.y)
        return
      }
      const p = prepared[i - 1]
      this.font(FS.body, !!p.r.bold, INK)
      d.text(p.left, INNER_X + 1, this.base(this.y + 1.3, FS.body))
      this.font(FS.body, true, INK)
      d.text(p.right, INNER_X + INNER_W - 1, this.base(this.y + 1.3, FS.body), { align: 'right' })
      this.y += heights[i]
      d.setDrawColor(...DIVIDER)
      d.setLineWidth(0.26)
      d.line(INNER_X, this.y, INNER_X + INNER_W, this.y)
    })
  }

  note(text: string) {
    const lines = this.wrap(text, INNER_W, FS.body)
    this.card('Important Information', [lines.length * lh(FS.body) + 1], () => {
      this.font(FS.body, false, INK)
      this.doc.text(lines, INNER_X, this.base(this.y, FS.body))
      this.y += lines.length * lh(FS.body) + 1
    })
    this.font(FS.body, true, INK_GREEN)
    const contact = this.wrap(`Emergency & support: ${SUPPORT_PHONE}  ·  ${SUPPORT_EMAIL}`, W, FS.body, true)
    this.ensure(contact.length * lh(FS.body))
    this.doc.text(contact, MARGIN, this.base(this.y, FS.body))
    this.y += contact.length * lh(FS.body)
  }

  save(name: string) {
    const d = this.doc
    const total = d.getNumberOfPages()
    for (let i = 1; i <= total; i++) {
      d.setPage(i)
      const top = PAGE_H - 24 + 6
      d.setDrawColor(...BRAND)
      d.setLineWidth(0.5)
      d.line(MARGIN, top, MARGIN + W, top)
      const lines = this.wrap(this.footerNote, W, FS.min)
      this.font(FS.min, false, MUTED)
      d.text(lines, MARGIN, this.base(top + 1.5, FS.min))
      const fy = top + 1.5 + lines.length * lh(FS.min) + 0.8
      d.text([SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WEB].join('  |  '), MARGIN, this.base(fy, FS.min))
      d.text(`Page ${i} of ${total}`, MARGIN + W, this.base(fy, FS.min), { align: 'right' })
    }
    d.save(name)
  }
}

const slug = (s: string) => s.replace(/[^A-Za-z0-9-]+/g, '-')

export async function downloadCoverageSummary(d: PolicyDocData) {
  const logo = await loadImage('/images/logo-oi-light.png')
  const insurerLogo = d.insurerLogoUrl ? await loadImage(d.insurerLogoUrl) : null
  const w = new Writer(
    'Cover notes',
    'Policy no.',
    d.policyNo,
    d.paidAt,
    logo,
    'This summary is for easy reference only. It is not the official eCOC. The insurer’s official eCOC and policy wording govern your cover.',
    insurerLogo,
  )
  w.band(d.planName, `Provider: ${d.insurer}  ·  Policy issued`, 'Total premium paid', money(d.total), 'Includes taxes and fees', [
    { label: 'Route', value: d.route },
    { label: 'Travel dates', value: `${d.dates} (${d.duration})` },
    { label: 'Travellers', value: d.travellers },
  ])
  w.fields('Policy', [
    { label: 'Policy number', value: d.policyNo },
    { label: 'Proposal number', value: d.proposalNo },
    { label: 'Insured', value: d.recipient, full: true },
    { label: 'Trip route', value: d.route, full: true },
  ])
  d.groups.forEach((g) => w.table(g.title, ['Benefit', 'Coverage limit'], g.rows))
  w.note(
    'This summary is for easy reference only. It is not the official eCOC, which is delivered by email. The insurer’s official eCOC and policy wording govern your cover. Amounts are in Philippine pesos unless stated otherwise; conditions and exclusions apply.',
  )
  w.save(`cover-notes-${slug(d.policyNo)}.pdf`)
}

export async function downloadReceipt(d: PolicyDocData) {
  const logo = await loadImage('/images/logo-oi-light.png')
  const insurerLogo = d.insurerLogoUrl ? await loadImage(d.insurerLogoUrl) : null
  const w = new Writer(
    'Acknowledgement receipt',
    'Payment reference',
    d.paymentRef,
    d.paidAt,
    logo,
    'This acknowledgement records payment. It does not replace the insurer’s invoice or your eCOC.',
    insurerLogo,
  )
  w.band(d.planName, `Provider: ${d.insurer}  ·  Payment received`, 'Total amount received', money(d.total), 'Includes taxes and fees', [
    { label: 'Received from', value: d.recipient },
    { label: 'Payment method', value: d.method },
    { label: 'Policy number', value: d.policyNo },
  ])
  w.fields('Payment', [
    { label: 'Received from', value: d.recipient, full: true },
    { label: 'Payment date', value: d.paidAt },
    { label: 'Payment method', value: d.method },
    { label: 'Payment reference', value: d.paymentRef },
    { label: 'Policy number', value: d.policyNo },
    { label: 'Proposal number', value: d.proposalNo },
    { label: 'Currency', value: 'PHP - Philippine peso' },
  ])
  w.table('Charges', ['Description', 'Amount'], [
    { label: `Travel insurance premium - ${d.planName} (${d.dates}, ${d.travellers})`, value: money(d.total) },
    { label: 'Total amount received', value: money(d.total), bold: true },
  ])
  w.note('This acknowledgement records payment. It does not replace the insurer’s invoice or your eCOC.')
  w.save(`acknowledgement-receipt-${slug(d.paymentRef)}.pdf`)
}
