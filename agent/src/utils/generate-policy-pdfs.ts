import { jsPDF } from 'jspdf'

// Shared PDF primitives ported from the ecommerce app's generate-quote-pdf.ts
// (docs: ../ecommerce/src/utils/generate-quote-pdf.ts). Only the pieces the
// policy documents need are included here.

export const SUPPORT_PHONE = '(02) 8633 5681'
export const SUPPORT_EMAIL = 'sales@ifrcinsurance.com'
export const SUPPORT_WEB = 'oneinsurance.shop'

// One Insurance design-system colours (docs/ui-theme-design.md)
export type Rgb = [number, number, number]
export const BRAND: Rgb = [0, 104, 56]
export const INK_GREEN: Rgb = [0, 104, 56]
export const INK: Rgb = [24, 61, 44]
export const MUTED: Rgb = [92, 99, 95]
export const CARD: Rgb = [241, 242, 240]
export const CARD_BORDER: Rgb = [223, 231, 223]
export const DIVIDER: Rgb = [223, 231, 223]
export const WHITE: Rgb = [255, 255, 255]
// Summary band: pale green fill + green border (print-friendly, low ink)
export const BAND_BG: Rgb = [226, 237, 219] // #e2eddb  Pale Green token
export const BAND_BORDER: Rgb = [170, 200, 160] // slightly deeper than card border

// Type scale (pt) and metrics (mm). 8px spacing scale ~= 2.1mm.
export const FS = { body: 10, label: 8.5, title: 12, total: 22, min: 8 }
export const MM = 0.3528
export const MARGIN = 14
export const PAD = 4.2
export const GAP = 6.4

export const lh = (pt: number) => pt * MM * 1.3

export interface PdfImage {
  data: string
  aspect: number
}

/** Loads any same-origin image (PNG/SVG/WebP) and rasterises it to a PNG data URL for jsPDF. */
export async function loadImage(url: string): Promise<PdfImage | null> {
  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
      img.src = encodeURI(decodeURI(url))
    })
    const w = img.naturalWidth || 400
    const h = img.naturalHeight || 160
    const scale = Math.min(2, 1200 / w)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(w * scale)
    canvas.height = Math.round(h * scale)
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    return { data: canvas.toDataURL('image/png'), aspect: w / h }
  } catch {
    return null
  }
}

export const clean = (s: string) => s.replace(/₱/g, 'PHP ').replace(/\s+/g, ' ').trim()

/** "PHP 1,234.56" — matches the ecommerce money() helper used by the PDF band. */
export const money = (n: number | string) => {
  const num =
    typeof n === 'string' ? Number(n.replace(/,/g, '')) : n
  return `PHP ${(Number.isFinite(num) ? num : 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

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
  /** Overrides the band subtitle (e.g. "Policy issued" / "Payment received"). */
  statusLabel?: string
}

type Row = { label: string; value: string; bold?: boolean }
type Field = { label: string; value: string; full?: boolean }

const PAGE_W = 210
const PAGE_H = 297
const W = PAGE_W - MARGIN * 2
const LIMIT_Y = PAGE_H - 24
const TOP = 14
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
    private providerLogo: PdfImage | null = null
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
    if (this.logo)
      d.addImage(this.logo.data, 'PNG', MARGIN, this.y, logoH * this.logo.aspect, logoH, 'logo', 'FAST')
    else {
      this.font(18, true, INK_GREEN)
      d.text('UnoSure', MARGIN, this.y + 8)
    }
    const tagH = 6.4
    const tagY = this.y + logoH + 3
    this.font(FS.label, true, INK_GREEN)
    const tagW = d.getTextWidth(this.tag.toUpperCase()) + 8
    d.setDrawColor(...INK_GREEN)
    d.setLineWidth(0.35)
    d.roundedRect(MARGIN, tagY, tagW, tagH, 1, 1, 'S')
    d.text(this.tag.toUpperCase(), MARGIN + tagW / 2, this.base(tagY + (tagH - lh(FS.label)) / 2 + 0.3, FS.label), {
      align: 'center',
    })

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

  band(
    plan: string,
    sub: string,
    totalLabel: string,
    total: string,
    totalNote: string,
    facts: { label: string; value: string }[]
  ) {
    const d = this.doc
    const bp = 5
    const inner = W - 2 * bp
    const bx = MARGIN + bp
    const rxb = MARGIN + W - bp

    // ── Layout widths ────────────────────────────────────────────────────
    const rightW = 68
    const logoBoxW = this.providerLogo ? 30 : 0
    const logoGap = this.providerLogo ? 4 : 0
    const leftW = inner - rightW - 6 - logoBoxW - logoGap
    const x0 = bx + logoBoxW + logoGap

    // ── Plan name + sub-info ─────────────────────────────────────────────
    const planLines = this.wrap(plan, leftW, 14, true).slice(0, 2)
    const subLines = sub ? this.wrap(sub, leftW, FS.min) : []

    // ── Height accounting ────────────────────────────────────────────────
    const leftH =
      lh(FS.label) +
      planLines.length * lh(14) +
      (subLines.length ? 1.5 + subLines.length * lh(FS.min) : 0)
    const rightH = lh(FS.label) + lh(FS.total) + 1 + lh(FS.min)
    const topH = Math.max(leftH, rightH, this.providerLogo ? logoBoxW * 0.5 : 0)

    // ── Facts columns ────────────────────────────────────────────────────
    const cw = inner / facts.length
    // For route facts: wrap using ASCII proxy to avoid U+2192 font issue
    const factPrimary = facts.map((f) => {
      const isRoute = f.label.toLowerCase() === 'route'
      const text = isRoute ? f.value.replace(/\s*->\s*/g, ' -> ') : f.value
      return this.wrap(text, cw - 3, FS.body, true).slice(0, 2)
    })
    const maxPrimaryLines = Math.max(...factPrimary.map((l) => l.length))
    const factsH = lh(FS.label) + maxPrimaryLines * lh(FS.body) + lh(FS.body) + 1

    const h = bp + topH + 3.5 + factsH + bp
    this.ensure(h)
    const y0 = this.y + bp

    // ── Band background (pale green + border) ───────────────────────────
    d.setFillColor(...BAND_BG)
    d.setDrawColor(...BAND_BORDER)
    d.setLineWidth(0.4)
    d.roundedRect(MARGIN, this.y, W, h, 2.5, 2.5, 'FD')

    // ── Logo box ─────────────────────────────────────────────────────────
    if (this.providerLogo) {
      const boxH = Math.min(topH, 14)
      d.setFillColor(...WHITE)
      d.setDrawColor(...BAND_BORDER)
      d.setLineWidth(0.3)
      d.roundedRect(bx, y0, logoBoxW, boxH, 1.5, 1.5, 'FD')
      const lw = Math.min(logoBoxW - 4, (boxH - 3) * this.providerLogo.aspect)
      const lhh = lw / this.providerLogo.aspect
      d.addImage(
        this.providerLogo.data,
        'PNG',
        bx + (logoBoxW - lw) / 2,
        y0 + (boxH - lhh) / 2,
        lw,
        lhh,
        'provider',
        'FAST'
      )
    }

    // ── Plan label + plan name (each line drawn individually) ────────────
    this.font(FS.label, true, MUTED)
    d.text('PLAN', x0, this.base(y0, FS.label))
    this.font(14, true, INK)
    planLines.forEach((line, li) => {
      d.text(line, x0, this.base(y0 + lh(FS.label) + li * lh(14), 14))
    })

    // ── Sub-info (plain text, FS.min, regular, MUTED) ────────────────────
    if (subLines.length) {
      this.font(FS.min, false, MUTED)
      subLines.forEach((line, li) => {
        d.text(
          line,
          x0,
          this.base(y0 + lh(FS.label) + planLines.length * lh(14) + 1.5 + li * lh(FS.min), FS.min)
        )
      })
    }

    // ── Total premium (right zone) ────────────────────────────────────────
    // Label
    this.font(FS.label, true, MUTED)
    d.text(totalLabel.toUpperCase(), rxb, this.base(y0, FS.label), { align: 'right' })

    // Amount: strip "PHP " prefix from total string, draw "PHP" separately at FS.body
    const amountNum = clean(total).replace(/^PHP\s*/i, '')
    const amountY = y0 + lh(FS.label)
    const amountBaseline = this.base(amountY, FS.total)

    this.font(FS.total, true, INK_GREEN)
    const amtNumW = d.getTextWidth(amountNum)
    this.font(FS.body, true, MUTED)
    const phpW = d.getTextWidth('PHP')
    const phpGap = PAD / 3 // ~1.4 mm spacing-xs

    this.font(FS.total, true, INK_GREEN)
    d.text(amountNum, rxb, amountBaseline, { align: 'right' })
    this.font(FS.body, true, MUTED)
    d.text('PHP', rxb - amtNumW - phpGap - phpW, amountBaseline)

    this.font(FS.min, false, MUTED)
    d.text(clean(totalNote), rxb, this.base(amountY + lh(FS.total) + 0.6, FS.min), { align: 'right' })

    // ── Divider ───────────────────────────────────────────────────────────
    const ly = y0 + topH + 1.75
    d.setDrawColor(...BAND_BORDER)
    d.setLineWidth(0.4)
    d.line(bx, ly, rxb, ly)

    // ── Facts columns ─────────────────────────────────────────────────────
    facts.forEach((f, i) => {
      const fx = bx + cw * i
      const isRoute = f.label.toLowerCase() === 'route'

      // Label: overline, bold, uppercase
      this.font(FS.label, true, MUTED)
      d.text(f.label.toUpperCase(), fx, this.base(ly + 1.75, FS.label))

      // Primary lines: each drawn as a plain string to avoid jsPDF array letter-spacing
      this.font(FS.body, true, INK)
      factPrimary[i].forEach((line, li) => {
        const baseY = this.base(ly + 1.75 + lh(FS.label) + li * lh(FS.body), FS.body)
        if (isRoute && line.includes('->')) {
          // Draw vector arrow between route parts
          const parts = line.split('->')
          const part1 = parts[0].trimEnd()
          const part2 = (parts[1] || '').trimStart()
          const p1w = d.getTextWidth(part1)
          const arrowGap = 1.2
          const arrowLen = 3.0
          const arrowHead = 0.9
          const arrowCapH = FS.body * MM * 0.55
          const ax = fx + p1w + arrowGap
          const ay = baseY - arrowCapH
          d.setDrawColor(...INK)
          d.setLineWidth(0.4)
          d.line(ax, ay, ax + arrowLen, ay)
          d.line(ax + arrowLen, ay, ax + arrowLen - arrowHead, ay - arrowHead)
          d.line(ax + arrowLen, ay, ax + arrowLen - arrowHead, ay + arrowHead)
          d.text(part1, fx, baseY)
          if (part2) d.text(part2, ax + arrowLen + arrowGap, baseY)
        } else {
          d.text(line, fx, baseY)
        }
      })
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
    const sized = list.map((f) => ({
      f,
      full: !!f.full || this.doc.getTextWidth(clean(f.value)) > colW - 6,
    }))
    const rows: { f: Field; full: boolean }[][] = []
    for (let i = 0; i < sized.length; i++) {
      const cur = sized[i]
      const nxt = sized[i + 1]
      if (!cur.full && nxt && !nxt.full) (rows.push([cur, nxt]), (i++))
      else rows.push([{ f: cur.f, full: true }])
    }
    const prepared = rows.map((row) =>
      row.map((c, k) => ({
        ...c,
        lines: this.wrap(c.f.value, c.full ? INNER_W : colW - 6, VALUE_FS),
        x: INNER_X + (c.full ? 0 : colW * k),
      }))
    )
    const heights = prepared.map(
      (r) => lh(FS.label) + 0.6 + Math.max(...r.map((p) => p.lines.length)) * lh(VALUE_FS) + 4.2
    )
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
    const rowH = (p: (typeof prepared)[number]) =>
      Math.max(p.left.length, p.right.length) * lh(FS.body) + 2.6
    const heights = [lh(FS.label) + 2.6, ...prepared.map(rowH)]
    this.card(title, heights, (i) => {
      const d = this.doc
      if (i === 0) {
        this.font(FS.label, true, MUTED)
        d.text(head[0].toUpperCase(), INNER_X + 1, this.base(this.y + 1.3, FS.label))
        d.text(head[1].toUpperCase(), INNER_X + INNER_W - 1, this.base(this.y + 1.3, FS.label), {
          align: 'right',
        })
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
    const contact = this.wrap(
      `Emergency & support: ${SUPPORT_PHONE}  ·  ${SUPPORT_EMAIL}`,
      W,
      FS.body,
      true
    )
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
  const logo = await loadImage('/images/logo-unosure-light.png')
  const insurerLogo = d.insurerLogoUrl ? await loadImage(d.insurerLogoUrl) : null
  const w = new Writer(
    'Cover notes',
    'Policy no.',
    d.policyNo,
    d.paidAt,
    logo,
    'This summary is for easy reference only. It is not the official eCOC. The insurer’s official eCOC and policy wording govern your cover.',
    insurerLogo
  )
  w.band(
    d.planName,
    `${d.insurer}  ·  ${d.statusLabel ?? 'Policy issued'}`,
    'Total premium paid',
    money(d.total),
    'Includes taxes and fees',
    [
      { label: 'Route', value: d.route.replace(/ - /g, ' -> ') },
      {
        label: 'Travel dates',
        value: `${d.dates}${d.duration ? ` (${d.duration})` : ''}`,
      },
      { label: 'Travellers', value: d.travellers },
    ]
  )
  w.fields('Policy', [
    { label: 'Policy number', value: d.policyNo },
    { label: 'Proposal number', value: d.proposalNo },
    { label: 'Insured', value: d.recipient, full: true },
    { label: 'Trip route', value: d.route, full: true },
  ])
  d.groups.forEach((g) => w.table(g.title, ['Benefit', 'Coverage limit'], g.rows))
  w.note(
    'This summary is for easy reference only. It is not the official eCOC, which is delivered by email. The insurer’s official eCOC and policy wording govern your cover. Amounts are in Philippine pesos unless stated otherwise; conditions and exclusions apply.'
  )
  w.save(`cover-notes-${slug(d.policyNo)}.pdf`)
}

export async function downloadReceipt(d: PolicyDocData) {
  const logo = await loadImage('/images/logo-unosure-light.png')
  const insurerLogo = d.insurerLogoUrl ? await loadImage(d.insurerLogoUrl) : null
  const w = new Writer(
    'Acknowledgement receipt',
    'Payment reference',
    d.paymentRef,
    d.paidAt,
    logo,
    'This acknowledgement records payment. It does not replace the insurer’s invoice or your eCOC.',
    insurerLogo
  )
  w.band(
    d.planName,
    `${d.insurer}  ·  ${d.statusLabel ?? 'Payment received'}`,
    'Total amount received',
    money(d.total),
    'Includes taxes and fees',
    [
      { label: 'Received from', value: d.recipient },
      { label: 'Payment method', value: d.method },
      { label: 'Policy number', value: d.policyNo },
    ]
  )
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
    {
      label: `Travel insurance premium - ${d.planName} (${d.dates}, ${d.travellers})`,
      value: money(d.total),
    },
    { label: 'Total amount received', value: money(d.total), bold: true },
  ])
  w.note('This acknowledgement records payment. It does not replace the insurer’s invoice or your eCOC.')
  w.save(`acknowledgement-receipt-${slug(d.paymentRef)}.pdf`)
}
