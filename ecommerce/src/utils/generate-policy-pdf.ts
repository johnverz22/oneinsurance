import { jsPDF } from 'jspdf'
import {
  BRAND, CARD, CARD_BORDER, CELL_PAD, DIVIDER, FOOTER_SPACE, FS, GAP, HEAD_RULE, INK, INK_GREEN, LINE, LOGO_ASPECT,
  MARGIN, MUTED, PAD, PHT, SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WEB, TOP, WHITE, clean, formatPhone, lh, loadLogo, money,
  type Rgb,
} from '@/utils/generate-quote-pdf'

export interface PolicyParty {
  name: string
  email: string
  phone: string
  address: string
}

interface PolicyTravel {
  type: string
  departureDate: string
  returnDate: string
  duration: string
  destinations: string
}

export interface CoverNotePDFInput {
  policyNumber: string
  carrierPolicyNumber: string
  proposalNumber: string
  customers: PolicyParty[]
  travel: PolicyTravel
  policy: { carrier: string; plan: string; coverageArea: string }
  coverage: { coverageName: string; sumInsured: string | number }[]
  status: { issueDate: string; status: string; effectiveDate: string; expiryDate: string }
  plan?: { code?: string }
}

export interface InvoicePDFInput {
  policyNumber: string
  carrierPolicyNumber?: string
  planName?: string
  proposalNumber: string
  customer: PolicyParty
  travel: PolicyTravel
  policy: { carrier: string; plan: string; coverageArea: string }
  payment: { basePremium: number; method: string; breakdown?: { base: number; lgt: number } }
  status: { issueDate: string; status: string; effectiveDate: string; expiryDate: string }
}

interface DocExtras {
  carrierName: string
  reference: string
  paymentReference?: string
}

interface Row {
  h: number
  draw: (y: number) => void
}
type Field = { label: string; value: string | string[]; full?: boolean }

const short = (s: string) => s.replace(/^([A-Za-z]{3})[a-z]*/, '$1')
const none = (v?: string | null) => clean(v ?? '')
const stamp = () =>
  `${new Intl.DateTimeFormat('en-US', { timeZone: PHT, month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date())} PHT`

function amount(v: string | number | undefined | null) {
  if (typeof v === 'number') return v > 0 ? money(v).replace(/\.00$/, '') : 'Included'
  const s = clean(String(v ?? ''))
  if (!s) return 'Included'
  if (/^[\d,]+(\.\d+)?$/.test(s)) {
    const n = parseFloat(s.replace(/,/g, ''))
    return n > 0 ? money(n).replace(/\.00$/, '') : 'Included'
  }
  return s
}

function createBuilder(opts: {
  logo: string | null
  tag: string
  docTitle: string
  refLabel: string
  refValue: string
  headerLines: string[]
  footerNote: string
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  doc.setLineHeightFactor(LINE)
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const W = pageWidth - 2 * MARGIN
  const limitY = pageHeight - FOOTER_SPACE
  const innerX = MARGIN + PAD
  const innerW = W - 2 * PAD
  let y = TOP

  const font = (fs: number, style: 'normal' | 'bold', color: Rgb) => {
    doc.setFont('helvetica', style)
    doc.setFontSize(fs)
    doc.setTextColor(color[0], color[1], color[2])
  }
  const fill = (c: Rgb) => doc.setFillColor(c[0], c[1], c[2])
  const stroke = (c: Rgb, w: number) => {
    doc.setDrawColor(c[0], c[1], c[2])
    doc.setLineWidth(w)
  }
  const base = (top: number, fs: number) => top + fs * 0.3528 * 0.9
  const wrap = (text: string, w: number, fs: number, style: 'normal' | 'bold' = 'normal') => {
    doc.setFont('helvetica', style)
    doc.setFontSize(fs)
    return doc.splitTextToSize(text.replace(/\s*\u2192\s*/g, ' to '), w) as string[]
  }
  const wrapHard = (text: string, w: number, fs: number, style: 'normal' | 'bold' = 'normal') => {
    const out: string[] = []
    wrap(text, w, fs, style).forEach((line) => {
      let rest = line
      while (rest && doc.getTextWidth(rest) > w) {
        let n = rest.length
        while (n > 1 && doc.getTextWidth(rest.slice(0, n)) > w) n--
        out.push(rest.slice(0, n))
        rest = rest.slice(n)
      }
      if (rest) out.push(rest)
    })
    return out
  }
  const newPage = () => {
    doc.addPage()
    y = TOP
  }

  doc.setProperties({ title: opts.docTitle, author: 'One Insurance', creator: 'One Insurance', subject: opts.docTitle })
  doc.setLanguage('en-US')
  doc.viewerPreferences({ DisplayDocTitle: true })

  // ---------- header ----------
  const logoH = 11
  if (opts.logo) doc.addImage(opts.logo, 'PNG', MARGIN, y, logoH * LOGO_ASPECT, logoH, 'logo', 'FAST')
  else {
    font(18, 'bold', INK_GREEN)
    doc.text('One Insurance', MARGIN, y + 8)
  }
  const tagW = 32
  const tagH = 6.4
  const tagY = y + logoH + 3
  stroke(INK_GREEN, 0.35)
  doc.roundedRect(MARGIN, tagY, tagW, tagH, 1, 1, 'S')
  font(FS.label, 'bold', INK_GREEN)
  doc.text(opts.tag, MARGIN + tagW / 2, base(tagY + (tagH - lh(FS.label)) / 2 + 0.3, FS.label), { align: 'center' })

  const rx = MARGIN + W
  let hy = y
  font(FS.label, 'bold', MUTED)
  doc.text(opts.refLabel, rx, base(hy, FS.label), { align: 'right' })
  hy += lh(FS.label)
  font(14, 'bold', INK)
  doc.text(opts.refValue, rx, base(hy, 14), { align: 'right' })
  hy += lh(14) + 1
  font(FS.body, 'normal', INK)
  opts.headerLines.forEach((l) => {
    doc.text(l, rx, base(hy, FS.body), { align: 'right' })
    hy += lh(FS.body)
  })
  y = Math.max(tagY + tagH, hy) + 3
  stroke(BRAND, 0.7)
  doc.line(MARGIN, y, MARGIN + W, y)
  y += GAP * 0.75

  // ---------- summary band ----------
  const band = (b: {
    label: string
    title: string
    sub: string
    rightLabel: string
    rightValue: string
    rightSub: string
    facts: { label: string; lines: string[] }[]
  }) => {
    const bp = 5
    const bandInner = W - 2 * bp
    const rightW = 68
    const leftW = bandInner - rightW - 6
    const titleLines = wrap(clean(b.title), leftW, 14, 'bold').slice(0, 2)
    const subLines = b.sub ? wrap(b.sub, leftW, FS.min) : []
    const topH = Math.max(
      lh(FS.label) + titleLines.length * lh(14) + subLines.length * lh(FS.min) + 1,
      lh(FS.label) + lh(FS.total) + lh(FS.min) + 1
    )
    const cw = bandInner / 3
    const facts = b.facts.map((f) => ({
      label: f.label,
      lines: f.lines.flatMap((l, i) => wrap(l, cw - 3, FS.body, i === 0 ? 'bold' : 'normal')).slice(0, 3),
    }))
    const factsH = lh(FS.label) + Math.max(...facts.map((f) => f.lines.length)) * lh(FS.body) + 1
    const h = bp + topH + 3.5 + factsH + bp

    if (y + h > limitY) newPage()
    fill(INK_GREEN)
    doc.roundedRect(MARGIN, y, W, h, 2.5, 2.5, 'F')
    const x0 = MARGIN + bp
    const y0 = y + bp
    font(FS.label, 'bold', WHITE)
    doc.text(b.label, x0, base(y0, FS.label))
    font(14, 'bold', WHITE)
    doc.text(titleLines, x0, base(y0 + lh(FS.label), 14))
    if (subLines.length) {
      font(FS.min, 'normal', WHITE)
      doc.text(subLines, x0, base(y0 + lh(FS.label) + titleLines.length * lh(14) + 0.8, FS.min))
    }
    const rxb = MARGIN + W - bp
    font(FS.label, 'bold', WHITE)
    doc.text(b.rightLabel, rxb, base(y0, FS.label), { align: 'right' })
    font(FS.total, 'bold', WHITE)
    doc.text(b.rightValue, rxb, base(y0 + lh(FS.label), FS.total), { align: 'right' })
    font(FS.min, 'normal', WHITE)
    doc.text(b.rightSub, rxb, base(y0 + lh(FS.label) + lh(FS.total) + 0.4, FS.min), { align: 'right' })

    const ly = y0 + topH + 1.75
    stroke(WHITE, 0.26)
    doc.line(x0, ly, MARGIN + W - bp, ly)
    facts.forEach((f, i) => {
      const fx = x0 + cw * i
      font(FS.label, 'bold', WHITE)
      doc.text(f.label.toUpperCase(), fx, base(ly + 1.75, FS.label))
      font(FS.body, 'bold', WHITE)
      doc.text(f.lines[0] ?? '', fx, base(ly + 1.75 + lh(FS.label), FS.body))
      if (f.lines.length > 1) {
        font(FS.body, 'normal', WHITE)
        doc.text(f.lines.slice(1), fx, base(ly + 1.75 + lh(FS.label) + lh(FS.body), FS.body))
      }
    })
    y += h + GAP
  }

  // ---------- rows ----------
  const GFS = { label: 9, value: 11.5 }
  const ROW_GAP = 3.2

  const fieldRows = (items: Field[]): Row[] => {
    const colW = innerW / 2
    const usable = items.filter((f) => (Array.isArray(f.value) ? f.value.some(Boolean) : f.value))
    const sized = usable.map((f) => {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(GFS.value)
      const single = Array.isArray(f.value) || doc.getTextWidth(f.value.replace(/\s*\u2192\s*/g, ' to ')) <= colW - 6
      return { f, full: !!f.full || !single }
    })
    const lines: { f: Field; full: boolean }[][] = []
    for (let i = 0; i < sized.length; i++) {
      const cur = sized[i]
      const nxt = sized[i + 1]
      if (!cur.full && nxt && !nxt.full) lines.push([cur, nxt]), i++
      else lines.push([{ f: cur.f, full: true }])
    }
    return lines.map((row, ri) => {
      const prepared = row.map((c, k) => ({
        ...c,
        lines: (Array.isArray(c.f.value) ? c.f.value : [c.f.value]).flatMap((v) => wrapHard(v, c.full ? innerW : colW - 6, GFS.value)),
        x: innerX + (c.full ? 0 : colW * k),
      }))
      const h = lh(GFS.label) + 0.6 + Math.max(...prepared.map((p) => p.lines.length)) * lh(GFS.value) + (ri < lines.length - 1 ? ROW_GAP : 0)
      return {
        h,
        draw: (top: number) =>
          prepared.forEach((p) => {
            font(GFS.label, 'normal', MUTED)
            doc.text(p.f.label, p.x, base(top, GFS.label))
            font(GFS.value, 'normal', INK)
            doc.text(p.lines, p.x, base(top + lh(GFS.label) + 0.6, GFS.value))
          }),
      }
    })
  }

  type Col = { label: string; w: number; align?: 'left' | 'right' }
  const tableRows = (cols: Col[], rows: { cells: (string | string[])[]; bold?: boolean; rule?: boolean }[]): Row[] => {
    const xs: number[] = []
    cols.reduce((x, c) => (xs.push(x), x + c.w), innerX)
    const cell = (text: string | string[], i: number, top: number, fs: number, style: 'normal' | 'bold', color: Rgb) => {
      const c = cols[i]
      font(fs, style, color)
      doc.text(text, c.align === 'right' ? xs[i] + c.w - 1 : xs[i] + 1, base(top, fs), { align: c.align ?? 'left' })
    }
    const hh = lh(FS.label) + CELL_PAD * 2
    const out: Row[] = [
      {
        h: hh,
        draw: (top) => {
          cols.forEach((c, i) => cell(c.label.toUpperCase(), i, top + CELL_PAD, FS.label, 'bold', MUTED))
          stroke(HEAD_RULE, 0.26)
          doc.line(innerX, top + hh, innerX + innerW, top + hh)
        },
      },
    ]
    rows.forEach((r, ri) => {
      const style = r.bold ? 'bold' : 'normal'
      const wrapped = r.cells.map((t, i) =>
        (Array.isArray(t) ? t : [t]).flatMap((l) => wrapHard(l, cols[i].w - 2, FS.body, style))
      )
      const h = Math.max(...wrapped.map((l) => l.length)) * lh(FS.body) + CELL_PAD * 2
      out.push({
        h,
        draw: (top) => {
          if (r.rule) {
            stroke(HEAD_RULE, 0.26)
            doc.line(innerX, top, innerX + innerW, top)
          }
          wrapped.forEach((lines, i) => cell(lines, i, top + CELL_PAD, FS.body, style, INK))
          if (ri < rows.length - 1 && !rows[ri + 1].rule) {
            stroke(DIVIDER, 0.26)
            doc.line(innerX, top + h, innerX + innerW, top + h)
          }
        },
      })
    })
    return out
  }

  const textRows = (items: string[], fs = FS.body, bullet = true, style: 'normal' | 'bold' = 'normal'): Row[] =>
    items.map((t) => {
      const lines = wrap(t, innerW - (bullet ? 4 : 0), fs, style)
      return {
        h: lines.length * lh(fs) + 1,
        draw: (top) => {
          font(fs, style, fs < FS.body ? MUTED : INK)
          if (bullet) doc.text('\u2022', innerX, base(top, fs))
          doc.text(lines, innerX + (bullet ? 4 : 0), base(top, fs))
        },
      }
    })

  // ---------- card with page-break aware row flow ----------
  const card = (title: string, rows: Row[]) => {
    if (!rows.length) return
    const head = lh(FS.title) + 2.1
    let i = 0
    let first = true
    while (i < rows.length) {
      const avail = limitY - y - 2 * PAD - head
      if (avail < rows[i].h && y > TOP + 1) {
        newPage()
        continue
      }
      const start = i
      let h = 0
      while (i < rows.length && (i === start || h + rows[i].h <= avail)) h += rows[i++].h
      const total = h + head + 2 * PAD
      fill(CARD)
      stroke(CARD_BORDER, 0.26)
      doc.roundedRect(MARGIN, y, W, total, 2, 2, 'FD')
      font(FS.title, 'bold', INK_GREEN)
      doc.text(first ? title : `${title} (continued)`, innerX, base(y + PAD, FS.title))
      let cy = y + PAD + head
      for (let k = start; k < i; k++) {
        rows[k].draw(cy)
        cy += rows[k].h
      }
      y += total + GAP
      first = false
      if (i < rows.length) newPage()
    }
  }

  const finish = () => {
    const total = doc.getNumberOfPages()
    for (let p = 1; p <= total; p++) {
      doc.setPage(p)
      const top = pageHeight - FOOTER_SPACE + 6
      stroke(BRAND, 0.5)
      doc.line(MARGIN, top, MARGIN + W, top)
      const lines = wrap(opts.footerNote, W, FS.min)
      font(FS.min, 'normal', MUTED)
      doc.text(lines, MARGIN, base(top + 1.5, FS.min))
      const fy = top + 1.5 + lines.length * lh(FS.min) + 0.8
      doc.text([SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WEB].join('  |  '), MARGIN, base(fy, FS.min))
      doc.text(`Page ${p} of ${total}`, MARGIN + W, base(fy, FS.min), { align: 'right' })
    }
    return doc
  }

  return { band, card, fieldRows, tableRows, textRows, finish, innerW, wrap }
}

const partyLines = (p: PolicyParty) =>
  [none(p.email), formatPhone(p.phone.replace(/^\+?63/, '')), none(p.address)].filter(Boolean)

export async function createCoverNotePDF(data: CoverNotePDFInput, extras: DocExtras, logo?: string | null) {
  const b = createBuilder({
    logo: logo === undefined ? await loadLogo() : logo,
    tag: 'COVER NOTE',
    docTitle: `Cover Note ${extras.reference}`,
    refLabel: 'REFERENCE NO.',
    refValue: extras.reference || 'N/A',
    headerLines: [`Issued: ${data.status.issueDate || stamp()}`, `Status: ${data.status.status || 'Active'}`],
    footerNote:
      'This document is electronically generated and valid without signature. Benefits are subject to the terms and conditions of the issued policy.',
  })
  const planName = none(data.plan?.code) || none(data.policy.plan)
  b.band({
    label: 'PLAN',
    title: planName || 'Travel Insurance Plan',
    sub: [extras.carrierName && `Provider: ${extras.carrierName}`, data.policy.coverageArea && `Coverage: ${data.policy.coverageArea}`, data.travel.type]
      .filter(Boolean)
      .join('  \u00b7  '),
    rightLabel: 'COVERAGE PERIOD',
    rightValue: data.status.status || 'Active',
    rightSub: `${data.status.effectiveDate} \u2013 ${data.status.expiryDate}`,
    facts: [
      { label: 'Destination', lines: [data.travel.destinations || 'N/A'] },
      { label: 'Travel dates', lines: [`${short(data.travel.departureDate)} \u2013 ${short(data.travel.returnDate)}`, data.travel.duration] },
      {
        label: 'Insured',
        lines: [
          data.customers[0]?.name || 'N/A',
          data.customers.length > 1 ? `+${data.customers.length - 1} more` : `${data.customers.length} traveler`,
        ],
      },
    ],
  })
  b.card(
    'Policy References',
    b.fieldRows([
      { label: 'Policy number', value: none(data.carrierPolicyNumber) || 'Pending' },
      { label: 'Proposal number', value: none(data.proposalNumber) },
      { label: 'Payment reference', value: none(extras.paymentReference) },
      { label: 'Insurance provider', value: extras.carrierName },
      { label: 'Issue date', value: data.status.issueDate },
    ])
  )
  b.card(
    data.customers.length > 1 ? 'Insured Travelers' : 'Insured Traveler',
    b.tableRows(
      [
        { label: 'Name', w: 52 },
        { label: 'Contact & address', w: b.innerW - 52 },
      ],
      data.customers.map((c) => ({ cells: [none(c.name), partyLines(c)] }))
    )
  )
  b.card(
    'Coverage Details',
    b.tableRows(
      [
        { label: 'Benefit', w: b.innerW - 60 },
        { label: 'Sum insured', w: 60, align: 'right' },
      ],
      data.coverage.map((c) => ({ cells: [none(c.coverageName), amount(c.sumInsured)] }))
    )
  )
  b.card(
    'Policy Summary',
    b.fieldRows([
      { label: 'Status', value: data.status.status || 'Active' },
      { label: 'Coverage area', value: none(data.policy.coverageArea) },
      { label: 'Coverage period', value: `${data.status.effectiveDate} \u2013 ${data.status.expiryDate}`, full: true },
    ])
  )
  b.card(
    'Important Information',
    b.textRows([
      'Benefits are subject to the terms, conditions and exclusions of the issued policy; the policy wording prevails.',
      'Keep this cover note and your policy number for claims. Quote them when contacting support.',
      `Need help or have a claim? ${SUPPORT_PHONE}  \u00b7  ${SUPPORT_EMAIL}`,
    ])
  )
  return b.finish()
}

export async function createInvoicePDF(data: InvoicePDFInput, extras: DocExtras, logo?: string | null) {
  const total = data.payment.basePremium
  const br = data.payment.breakdown && data.payment.breakdown.base > 0 ? data.payment.breakdown : undefined
  const b = createBuilder({
    logo: logo === undefined ? await loadLogo() : logo,
    tag: 'INVOICE',
    docTitle: `Invoice ${extras.reference}`,
    refLabel: 'INVOICE NO.',
    refValue: extras.reference || 'N/A',
    headerLines: [`Issued: ${data.status.issueDate || stamp()}`, 'Status: Paid'],
    footerNote: 'This is a computer-generated invoice and is valid without signature. Premium is VAT inclusive. Coverage begins on the effective date; please ensure payment is completed before departure.',
  })
  const planName = none(data.planName) || none(data.policy.plan)
  b.band({
    label: 'PLAN',
    title: planName || 'Travel Insurance Plan',
    sub: [extras.carrierName && `Provider: ${extras.carrierName}`, data.policy.coverageArea && `Coverage: ${data.policy.coverageArea}`, data.travel.type]
      .filter(Boolean)
      .join('  \u00b7  '),
    rightLabel: 'TOTAL PAID',
    rightValue: money(total),
    rightSub: 'VAT inclusive',
    facts: [
      { label: 'Policy number', lines: [none(data.carrierPolicyNumber) || none(data.policyNumber) || 'Pending'] },
      { label: 'Provider', lines: [extras.carrierName || 'N/A'] },
      { label: 'Payment method', lines: [none(data.payment.method) || 'N/A'] },
    ],
  })
  b.card(
    'Billing',
    b.fieldRows([
      {
        label: 'From',
        value: ['IFRC Digitech Online Payment Gateway', '6th Floor Padilla Building', 'F. Ortigas Jr. Road, Ortigas Center, Pasig City', 'TEL: +632 8633 5681', 'concierge@ifrcinsurance.com'],
      },
      { label: 'Billed to', value: [none(data.customer.name), ...partyLines(data.customer)] },
    ])
  )

  const rows: { cells: (string | string[])[]; bold?: boolean; rule?: boolean }[] = [
    {
      cells: [
        [planName, [extras.carrierName, data.travel.destinations, `${data.travel.duration} \u00b7 ${data.travel.type}`].filter(Boolean).join(' \u00b7 ')],
        money(br?.base ?? total),
      ],
    },
  ]
  if (br) {
    if (br.lgt > 0.005) rows.push({ cells: ['Local government tax', money(br.lgt)] })
    const taxes = total - br.base - br.lgt
    rows.push({ cells: ['Taxes & fees', taxes > 0.005 ? money(taxes) : 'Included in premium'] })
  }
  rows.push({ cells: ['Total amount', money(total)], bold: true, rule: true })
  b.card(
    'Charges',
    b.tableRows(
      [
        { label: 'Description', w: b.innerW - 50 },
        { label: 'Amount', w: 50, align: 'right' },
      ],
      rows
    )
  )
  b.card(
    'Payment & Policy Status',
    b.fieldRows([
      { label: 'Payment reference', value: none(extras.paymentReference) || none(extras.reference) },
      { label: 'Proposal number', value: none(data.proposalNumber) },
      { label: 'Policy status', value: data.status.status || 'Active' },
      { label: 'Coverage period', value: `${data.status.effectiveDate} \u2013 ${data.status.expiryDate}` },
    ])
  )
  return b.finish()
}
