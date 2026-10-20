import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import { differenceInCalendarDays, format } from 'date-fns'
import { TravelInsuranceFormData, PersonalInfoFormData, PH_ID_TYPES } from '@/types/travel-insurance/travel-insurance-request'
import { FullQuoteResponse } from '@/types/travel-insurance/policy-types'
import { InsuranceBenefit } from '@/types/plan'
import { getCityNameByCityCode, getProvinceNameByProvCode } from '@/utils/address-util'
import { getCanonicalConfigForBenefit, resolveLimitDisplay } from '@/utils/travel-benefits-helpers'
import { buildProposalUrl, PROPOSAL_VALIDITY_HOURS } from '@/utils/proposal-loader'

interface QuotePDFData {
  travelDetails: TravelInsuranceFormData
  travelersInfo?: PersonalInfoFormData[]
  apiResponse: FullQuoteResponse
  planName?: string
  providerName?: string
  addons?: string[]
  mainBenefits?: InsuranceBenefit[]
  addonBenefits?: InsuranceBenefit[]
  agentCode?: string
  providerLogoUrl?: string | null
  limitsUnavailable?: boolean
  taxes?: { premiumTax?: number | string | null; stampDuty?: number | string | null }
}


export const SUPPORT_PHONE = '(02) 8633 5681'
export const SUPPORT_EMAIL = 'sales@ifrcinsurance.com'
export const SUPPORT_WEB = 'oneinsurance.shop'
const DISCLAIMER =
  'This is a generated proposal only, not a policy or proof of coverage. Subject to payment, insurer underwriting and full policy terms.'

// One Insurance design-system colours (docs/ui-theme-design.md)
export type Rgb = [number, number, number]
type Align = 'left' | 'right'
export const BRAND: Rgb = [0, 104, 56]
export const INK_GREEN: Rgb = [0, 104, 56]
export const INK: Rgb = [24, 61, 44]
export const MUTED: Rgb = [92, 99, 95]
export const CARD: Rgb = [241, 242, 240]
export const CARD_BORDER: Rgb = [223, 231, 223]
export const DIVIDER: Rgb = [223, 231, 223]
export const HEAD_RULE: Rgb = [199, 212, 201]
export const WHITE: Rgb = [255, 255, 255]
export const WARN_BG: Rgb = [255, 244, 229]
export const WARN_BORDER: Rgb = [180, 83, 9]
export const WARN_TEXT: Rgb = [124, 45, 18]

// Type scale (pt) and metrics (mm). 8px spacing scale ~= 2.1mm.
export const FS = { body: 10, label: 8.5, title: 12, total: 22, min: 8 }
export const MM = 0.3528
export const LINE = 1.3
export const MARGIN = 14
export const TOP = 14
export const FOOTER_SPACE = 24
export const PAD = 4.2
export const GAP = 6.4
export const CELL_PAD = 1.3

export const lh = (pt: number) => pt * MM * LINE
export const PHT = 'Asia/Manila'

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

let quiet = false
const logError = (msg: string, ctx?: unknown) => {
  if (!quiet) console.error(`[quote-pdf] ${msg}`, ctx ?? '')
}

export const clean = (s: string) => s.replace(/\u20B1/g, 'PHP ').replace(/\s+/g, ' ').trim()

const SMALL_WORDS = new Set(['of', 'de', 'del', 'la', 'ng', 'sa', 'y', 'and'])
const titleCase = (s: string) =>
  s
    .toLowerCase()
    .split(/(\s+)/)
    .map((w, i) =>
      /^\s+$/.test(w) || (i > 0 && SMALL_WORDS.has(w))
        ? w
        : w.replace(/(^|[-'.(/])([a-z\u00e0-\u00ff])/g, (_m, p, c) => p + c.toUpperCase())
    )
    .join('')
const normalizeCase = (s: string | undefined | null) => {
  const v = clean(s ?? '')
  return v && v === v.toUpperCase() ? titleCase(v) : v
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
const travelerCounts = (adults: number, children: number) =>
  [plural(adults, 'Adult', 'Adults'), children > 0 ? plural(children, 'Child', 'Children') : ''].filter(Boolean).join(', ')

const fmtDate = (d: Date | string | undefined | null) => {
  if (!d) return 'N/A'
  const date = new Date(d)
  return Number.isNaN(date.getTime()) ? 'N/A' : format(date, 'MMM d, yyyy')
}
const fmtDateTimePHT = (d: Date) =>
  `${new Intl.DateTimeFormat('en-US', { timeZone: PHT, month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(d)} PHT`
const fmtDatePHT = (d: Date) =>
  new Intl.DateTimeFormat('en-US', { timeZone: PHT, month: 'short', day: 'numeric', year: 'numeric' }).format(d)

export const money = (n: number) => `PHP ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const limitMoney = (n: number) => `PHP ${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
const toNum = (v: unknown) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''))
  return Number.isFinite(n) ? n : 0
}

const PLACEHOLDERS = new Set(['n/a', 'na', 'none', 'null', 'undefined', 'no suffix', 'address', 'not provided', '-', '--'])
const isPlaceholder = (v: string | undefined | null) => !v || PLACEHOLDERS.has(clean(v).toLowerCase())
const realValue = (v: string | undefined | null) => (isPlaceholder(v) ? '' : clean(v as string))

const fullName = (first?: string, middle?: string | null, last?: string, suffix?: string) =>
  normalizeCase([first, middle, last, suffix].map(realValue).filter(Boolean).join(' '))

export const formatPhone = (v: string | undefined | null) => {
  const d = (v ?? '').replace(/\D/g, '').replace(/^(63|0)(?=9\d{9}$)/, '')
  return d.length === 10 ? `+63 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : d ? `+63 ${d}` : ''
}

const maskedId = (label: string, v: string | undefined | null) => {
  const s = (v ?? '').replace(/\s+/g, '')
  if (!s) return ''
  return `${label} \u2022\u2022\u2022\u2022${s.length > 4 ? ` ${s.slice(-4)}` : ''}`
}

function formatAddress(a: PersonalInfoFormData['address']) {
  const zip = (a.zipCode || '').trim()
  const strip = (s: string) =>
    (zip ? s.replace(new RegExp(`\\b${zip}\\b`, 'g'), '') : s).replace(/\s*,\s*,/g, ',').replace(/^[,\s]+|[,\s]+$/g, '').trim()
  const city = normalizeCase(strip(getCityNameByCityCode(a.city) ?? a.city ?? ''))
  const province = normalizeCase(strip(getProvinceNameByProvCode(a.province) ?? a.province ?? ''))
  return [
    normalizeCase(strip(realValue(a.line1))),
    normalizeCase(strip(realValue(a.line2))),
    [[city, province].filter(Boolean).join(', '), zip].filter(Boolean).join(' '),
    'Philippines',
  ].filter(Boolean)
}

interface BenefitRow {
  name: string
  limit: string
}
interface BenefitGroup {
  label: string
  order: number
  rows: BenefitRow[]
}

function limitText(b: InsuranceBenefit, name: string, category: string, unavailable = false) {
  const d = resolveLimitDisplay(b)
  if (unavailable && d.kind === 'none') return 'Per policy wording'
  const mode = b.LimitModeDesc && b.LimitModeDesc !== '0' ? clean(b.LimitModeDesc) : ''
  const join = (parts: (string | undefined)[]) => parts.filter(Boolean).join(' \u00b7 ')
  switch (d.kind) {
    case 'amount': {
      const n = toNum(d.value)
      const amt = Number.isNaN(n) || n === 0 ? clean(d.value) : limitMoney(n)
      const isDeductible = /\b(excess|deductible)\b/i.test(name)
      return join([isDeductible ? `Deductible ${amt}` : amt, d.qualifier ? clean(d.qualifier) : mode])
    }
    case 'badge':
      return join([/^included$/i.test(d.label.trim()) ? `Included in ${category} limit` : clean(d.label), d.qualifier ? clean(d.qualifier) : mode])
    case 'text':
      return clean(d.text)
    default:
      return 'Not covered'
  }
}

function buildBenefitGroups(main: InsuranceBenefit[], addons: InsuranceBenefit[], unavailable = false) {
  const groups = new Map<string, BenefitGroup>()
  const seen = new Set<string>()

  const add = (b: InsuranceBenefit, forcedLabel?: string, forcedOrder?: number) => {
    const cfg = getCanonicalConfigForBenefit(b)
    const label = forcedLabel ?? cfg.label
    const categoryRaw = clean(b.CoverageName || '')
    let name = clean(b.BenefitDesc || '')
    const sub = clean(b.SubCoverageName || '')

    if (!name) {
      logError('Benefit skipped: missing benefit name', b)
      return
    }
    const generic = categoryRaw && name.toLowerCase() === categoryRaw.toLowerCase()
    if (generic) {
      if (sub && sub.toLowerCase() !== name.toLowerCase()) name = sub
      else logError(`Benefit "${name}" has no sub-benefit name; rendering category label only`, b)
    }
    let key = `${label}|${name}`.toLowerCase()
    if (seen.has(key) && sub && sub.toLowerCase() !== name.toLowerCase()) {
      name = `${sub} \u2013 ${name}`
      key = `${label}|${name}`.toLowerCase()
    }
    if (seen.has(key)) {
      logError(`Duplicate benefit skipped: "${name}" under "${label}"`, b)
      return
    }
    seen.add(key)
    if (!groups.has(label)) groups.set(label, { label, order: forcedOrder ?? cfg.order, rows: [] })
    groups.get(label)!.rows.push({ name, limit: limitText(b, name, label, unavailable) })
  }

  main.forEach((b) => add(b))
  addons.filter(Boolean).forEach((b) => add(b, 'Selected Add-ons', 100))
  return [...groups.values()].sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
}

export async function createQuotePDF(
  data: QuotePDFData,
  opts: { logo?: PdfImage | null; providerLogo?: PdfImage | null; origin?: string } = {}
) {
  const logo = opts.logo === undefined ? await loadImage('/images/logo-oi-light.png') : opts.logo
  const providerLogo =
    opts.providerLogo === undefined
      ? data.providerLogoUrl
        ? await loadImage(data.providerLogoUrl)
        : null
      : opts.providerLogo
  const origin = opts.origin ?? (typeof window !== 'undefined' ? window.location.origin : `https://${SUPPORT_WEB}`)
  const resumeUrl = buildProposalUrl(origin, data.agentCode || 'DIRECT', data.apiResponse?.data?.ProposalNo || '')
  const qr = await QRCode.toDataURL(resumeUrl, {
    margin: 0,
    width: 256,
    errorCorrectionLevel: 'M',
    color: { dark: '#183d2c', light: '#ffffff' },
  })
  quiet = true
  const { heights } = renderQuote(data, logo, providerLogo, qr, resumeUrl, true, [])
  quiet = false
  return renderQuote(data, logo, providerLogo, qr, resumeUrl, false, heights)
}

export async function generateQuotePDF(data: QuotePDFData) {
  const { doc, proposalNo } = await createQuotePDF(data)
  doc.save(`Travel-Insurance-Proposal-${proposalNo}.pdf`)
}

function renderQuote(
  data: QuotePDFData,
  logo: PdfImage | null,
  providerLogo: PdfImage | null,
  qr: string,
  resumeUrl: string,
  measuring: boolean,
  known: number[]
) {
  const { travelDetails, travelersInfo, apiResponse, planName, providerName, mainBenefits, addonBenefits, agentCode, taxes, limitsUnavailable } = data

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
  const base = (top: number, fs: number) => top + fs * MM * 0.9
  const wrap = (text: string, w: number, fs: number, style: 'normal' | 'bold' = 'normal') => {
    doc.setFont('helvetica', style)
    doc.setFontSize(fs)
    return doc.splitTextToSize(text, w) as string[]
  }
  const ensure = (h: number) => {
    if (!measuring && y + h > limitY) {
      doc.addPage()
      y = TOP
    }
  }

  // ---------- derived data ----------
  const d = apiResponse?.data
  const explicitExpiry = d?.ExpiresAt ? new Date(d.ExpiresAt) : null
  const created = d?.ProposalDate ? new Date(d.ProposalDate) : null
  const now = created && !Number.isNaN(created.getTime()) ? created : new Date()
  const validUntil =
    explicitExpiry && !Number.isNaN(explicitExpiry.getTime())
      ? explicitExpiry
      : new Date(now.getTime() + PROPOSAL_VALIDITY_HOURS * 3600_000)
  const departure = new Date(travelDetails.departureDate)
  const returning = new Date(travelDetails.returnDate ?? travelDetails.departureDate)
  // Inclusive counting: departure and return days both count (Oct 14-21 = 8 days)
  const days = Math.max(1, differenceInCalendarDays(returning, departure) + 1)
  if (d?.TravelDays && d.TravelDays !== days && d.TravelDays !== days - 1) {
    logError(`Backend TravelDays (${d.TravelDays}) disagrees with inclusive day count (${days})`)
  }
  const departsOnOrBeforeIssue = differenceInCalendarDays(departure, new Date()) <= 0
  const proposalNo = d?.ProposalNo || 'N/A'
  if (!d?.ProposalNo) logError('Missing ProposalNo in full-quote response')

  const adults = travelDetails.noOfAdults
  const children = travelDetails.noOfChildren
  const counts = travelerCounts(adults, children)
  const destinations =
    [...new Set(travelDetails.travelDetailList.map((t) => normalizeCase(t.TravelCountry)).filter(Boolean))].join(', ') || 'N/A'
  const origin = normalizeCase(travelDetails.travelDetailList[0]?.PlaceOfOrgin) || 'N/A'
  const coverageAreaRaw = (travelDetails.travelDetailList[0]?.TravelCoverageArea || '').trim()
  const AREA_LABELS: Record<string, string> = { APAC: 'APAC', WORLD: 'Worldwide', SCHENGEN: 'Schengen', DOMESTIC: 'Domestic' }
  const coverageArea = coverageAreaRaw ? (AREA_LABELS[coverageAreaRaw.toUpperCase()] ?? titleCase(coverageAreaRaw)) : 'N/A'

  const holder = travelersInfo?.[0]
  const risks = d?.PolicyLobList?.[0]?.PolicyRiskList ?? []
  const travelers = risks.length
    ? risks.map((r) => {
        const age = r.Age || 0
        const adult = age > 0 ? age >= 18 : r.IsAdultTraveller === 'Y' || r.IsAdultTraveller === '1'
        return {
          name: normalizeCase(r.InsuredName || [r.FirstName, r.MiddleName, r.LastName].filter(Boolean).join(' ')),
          dob: fmtDate(r.DateOfBirth),
          age: r.Age ? String(r.Age) : 'N/A',
          type: adult ? 'Adult' : 'Child',
        }
      })
    : (travelersInfo ?? []).map((t, i) => ({
        name: fullName(t.firstName, t.middleName, t.lastName, t.suffix),
        dob: fmtDate(t.dateOfBirth),
        age: 'N/A',
        type: i < adults ? 'Adult' : 'Child',
      }))
  const holderName = holder ? fullName(holder.firstName, holder.middleName, holder.lastName, holder.suffix) : ''
  const sameAsTraveler = !!holder && travelers.length === 1 && travelers[0].name.toLowerCase() === holderName.toLowerCase()
  const primaryTraveler = travelers[0]?.name || holderName || 'N/A'

  // ---------- document metadata / accessibility ----------
  doc.setProperties({
    title: `Travel Insurance Proposal ${proposalNo}`,
    subject: `Proposal for ${planName || 'travel insurance'}`,
    author: 'One Insurance',
    creator: 'One Insurance',
    keywords: 'travel insurance, proposal',
  })
  doc.setLanguage('en-US')
  doc.viewerPreferences({ DisplayDocTitle: true })

  // ---------- building blocks ----------
  const heights: number[] = []
  let cardIndex = -1
  let cardStart = 0

  const card = (title: string, body: () => void, pad = PAD) => {
    cardIndex++
    const contentH = known[cardIndex]
    if (!measuring && contentH !== undefined) {
      const total = contentH + pad * 2
      if (total <= limitY - TOP) ensure(total)
      fill(CARD)
      stroke(CARD_BORDER, 0.26)
      doc.roundedRect(MARGIN, y, W, Math.min(total, limitY - y), 2, 2, 'FD')
    } else ensure(24)
    cardStart = y
    y += pad
    font(FS.title, 'bold', INK_GREEN)
    doc.text(title, MARGIN + pad, base(y, FS.title))
    y += lh(FS.title) + 2.1
    body()
    heights[cardIndex] = y - cardStart - pad
    y += pad + GAP
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

  type Field = { label: string; value: string | string[]; full?: boolean }
  const GFS = { label: 9, value: 11.5, group: 8.25 }
  const ROW_GAP = 4.2
  const HPAD = 6.35

  const fieldGroup = (title: string, items: Field[], first: boolean, ix: number, iw: number) => {
    const items2 = items.filter((f) => (Array.isArray(f.value) ? f.value.length : f.value))
    if (!items2.length) return
    if (!first) {
      y += 3.2
      stroke(DIVIDER, 0.26)
      doc.line(ix, y, ix + iw, y)
      y += 3.2
    }
    ensure(lh(GFS.group) + 2.1 + lh(GFS.label) + lh(GFS.value))
    font(GFS.group, 'bold', INK_GREEN)
    doc.text(title.toUpperCase(), ix, base(y, GFS.group), { charSpace: 0.4 })
    y += lh(GFS.group) + 2.4

    const colW = iw / 2
    const textW = (f: Field, full: boolean) => (full ? iw : colW - 6)
    const linesOf = (f: Field, full: boolean) =>
      (Array.isArray(f.value) ? f.value : [f.value]).flatMap((v) => wrapHard(v, textW(f, full), GFS.value))
    // Promote any half-width field that would not fit on one line to full width
    const sized = items2.map((f) => {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(GFS.value)
      const single = !Array.isArray(f.value) && doc.getTextWidth(f.value) <= colW - 6
      return { f, full: !!f.full || !(single || Array.isArray(f.value)) }
    })
    const rows: { f: Field; full: boolean }[][] = []
    for (let i = 0; i < sized.length; i++) {
      const cur = sized[i]
      const nxt = sized[i + 1]
      if (!cur.full && nxt && !nxt.full) rows.push([cur, nxt]), i++
      else rows.push([{ f: cur.f, full: true }])
    }
    rows.forEach((row, ri) => {
      const prepared = row.map((c, k) => ({ ...c, lines: linesOf(c.f, c.full), x: ix + (c.full ? 0 : colW * k) }))
      const h = lh(GFS.label) + 0.6 + Math.max(...prepared.map((p) => p.lines.length)) * lh(GFS.value)
      ensure(h + (ri < rows.length - 1 ? ROW_GAP : 0))
      prepared.forEach((p) => {
        font(GFS.label, 'normal', MUTED)
        doc.text(p.f.label, p.x, base(y, GFS.label))
        font(GFS.value, 'normal', INK)
        doc.text(p.lines, p.x, base(y + lh(GFS.label) + 0.6, GFS.value))
      })
      y += h + (ri < rows.length - 1 ? ROW_GAP : 0)
    })
  }

  const table = (
    cols: { label: string; w: number; align?: Align }[],
    rows: { cells: string[]; bold?: boolean }[]
  ) => {
    const xs: number[] = []
    cols.reduce((x, c) => (xs.push(x), x + c.w), innerX)
    const drawCell = (text: string | string[], i: number, top: number, fs: number, style: 'normal' | 'bold', color: Rgb) => {
      const c = cols[i]
      font(fs, style, color)
      const x = c.align === 'right' ? xs[i] + c.w - 1 : xs[i] + 1
      doc.text(text, x, base(top, fs), { align: c.align ?? 'left' })
    }
    const hh = lh(FS.label) + CELL_PAD * 2
    ensure(hh + lh(FS.body) + CELL_PAD * 2)
    cols.forEach((c, i) => drawCell(c.label.toUpperCase(), i, y + CELL_PAD, FS.label, 'bold', MUTED))
    y += hh
    stroke(HEAD_RULE, 0.26)
    doc.line(innerX, y, innerX + innerW, y)
    rows.forEach((r, ri) => {
      const wrapped = r.cells.map((t, i) => wrap(t, cols[i].w - 2, FS.body, r.bold ? 'bold' : 'normal'))
      const h = Math.max(...wrapped.map((l) => l.length)) * lh(FS.body) + CELL_PAD * 2
      ensure(h)
      wrapped.forEach((lines, i) => drawCell(lines, i, y + CELL_PAD, FS.body, r.bold ? 'bold' : 'normal', INK))
      y += h
      if (ri < rows.length - 1) {
        stroke(DIVIDER, 0.26)
        doc.line(innerX, y, innerX + innerW, y)
      }
    })
  }

  // ---------- HEADER ----------
  const logoH = 11
  if (logo) doc.addImage(logo.data, 'PNG', MARGIN, y, logoH * logo.aspect, logoH, 'logo', 'FAST')
  else {
    font(18, 'bold', INK_GREEN)
    doc.text('One Insurance', MARGIN, y + 8)
  }
  const tagW = 25
  const tagH = 6.4
  const tagY = y + logoH + 3
  stroke(INK_GREEN, 0.35)
  doc.roundedRect(MARGIN, tagY, tagW, tagH, 1, 1, 'S')
  font(FS.label, 'bold', INK_GREEN)
  doc.text('PROPOSAL', MARGIN + tagW / 2, base(tagY + (tagH - lh(FS.label)) / 2 + 0.3, FS.label), { align: 'center' })

  const rx = MARGIN + W
  let hy = y
  font(FS.label, 'bold', MUTED)
  doc.text('PROPOSAL NO.', rx, base(hy, FS.label), { align: 'right' })
  hy += lh(FS.label)
  font(14, 'bold', INK)
  doc.text(proposalNo, rx, base(hy, 14), { align: 'right' })
  hy += lh(14) + 1
  font(FS.body, 'normal', INK)
  doc.text(`Generated: ${fmtDateTimePHT(now)}`, rx, base(hy, FS.body), { align: 'right' })
  hy += lh(FS.body)
  doc.text(`Pay by: ${fmtDateTimePHT(validUntil)}`, rx, base(hy, FS.body), { align: 'right' })
  hy += lh(FS.body)
  if (agentCode) {
    doc.text(`Agent code: ${agentCode}`, rx, base(hy, FS.body), { align: 'right' })
    hy += lh(FS.body)
  }

  y = Math.max(tagY + tagH, hy) + 3
  stroke(BRAND, 0.7)
  doc.line(MARGIN, y, MARGIN + W, y)
  y += GAP * 0.75

  // ---------- WARNING ----------
  if (departsOnOrBeforeIssue) {
    const msg = `Check your travel dates: departure (${fmtDate(departure)}) is on or before today (${fmtDate(new Date())}). Coverage may not be available for a trip that has already started.`
    const lines = wrap(msg, W - 2 * PAD - 6, FS.body, 'bold')
    const h = lines.length * lh(FS.body) + 2 * 3
    fill(WARN_BG)
    stroke(WARN_BORDER, 0.35)
    doc.roundedRect(MARGIN, y, W, h, 2, 2, 'FD')
    font(FS.body, 'bold', WARN_TEXT)
    doc.text('!', MARGIN + PAD, base(y + 3, FS.body))
    doc.text(lines, MARGIN + PAD + 4, base(y + 3, FS.body))
    y += h + GAP * 0.75
  }

  // ---------- SUMMARY BAND ----------
  {
    const bp = 5
    const bandInner = W - 2 * bp
    const rightW = 68
    const logoBoxW = providerLogo ? 30 : 0
    const logoGap = providerLogo ? 4 : 0
    const leftW = bandInner - rightW - 6 - logoBoxW - logoGap
    const planTitle = clean(planName || 'Travel Insurance Plan')
    const planLines = wrap(planTitle, leftW, 14, 'bold').slice(0, 2)
    const planCode = d?.CarrierPlanCode || d?.PlanCode
    const sub = [
      providerName ? `Provider: ${normalizeCase(providerName)}` : '',
      planCode ? `Plan code: ${planCode}` : '',
      `Coverage: ${coverageArea}`,
      travelDetails.isAnnualMultiTrip ? 'Annual multi-trip' : 'Single trip',
    ]
      .filter(Boolean)
      .join('  \u00b7  ')
    const subLines = sub ? wrap(sub, leftW, FS.min) : []
    const leftH = lh(FS.label) + planLines.length * lh(14) + subLines.length * lh(FS.min) + 1
    const rightH = lh(FS.label) + lh(FS.total) + lh(FS.min) + 1
    const topH = Math.max(leftH, rightH)

    const cw = bandInner / 3
    const facts: { label: string; lines: string[] }[] = [
      { label: 'Route', lines: wrap(`${origin} to ${destinations}`, cw - 3, FS.body, 'bold').slice(0, 2) },
      { label: 'Travel dates', lines: [`${fmtDate(departure)} \u2013 ${fmtDate(returning)}`, `${days} ${days === 1 ? 'day' : 'days'} (inclusive)`] },
      { label: 'Traveler', lines: [...wrap(primaryTraveler, cw - 6, FS.body, 'bold').slice(0, 1), counts] },
    ]
    const factsH = lh(FS.label) + Math.max(...facts.map((f) => f.lines.length)) * lh(FS.body) + 1
    const h = bp + topH + 3.5 + factsH + bp

    fill(INK_GREEN)
    doc.roundedRect(MARGIN, y, W, h, 2.5, 2.5, 'F')

    const bx = MARGIN + bp
    const x0 = bx + logoBoxW + logoGap
    const y0 = y + bp
    if (providerLogo) {
      const boxH = Math.min(topH, 14)
      fill(WHITE)
      doc.roundedRect(bx, y0, logoBoxW, boxH, 1.5, 1.5, 'F')
      const maxW = logoBoxW - 4
      const maxH = boxH - 3
      const lw = Math.min(maxW, maxH * providerLogo.aspect)
      const lhh = lw / providerLogo.aspect
      doc.addImage(providerLogo.data, 'PNG', bx + (logoBoxW - lw) / 2, y0 + (boxH - lhh) / 2, lw, lhh, 'provider', 'FAST')
    }
    font(FS.label, 'bold', WHITE)
    doc.text('PLAN', x0, base(y0, FS.label))
    font(14, 'bold', WHITE)
    doc.text(planLines, x0, base(y0 + lh(FS.label), 14))
    if (subLines.length) {
      font(FS.min, 'normal', WHITE)
      doc.text(subLines, x0, base(y0 + lh(FS.label) + planLines.length * lh(14) + 0.8, FS.min))
    }

    const rxb = MARGIN + W - bp
    font(FS.label, 'bold', WHITE)
    doc.text('TOTAL PREMIUM', rxb, base(y0, FS.label), { align: 'right' })
    const premium = d?.DuePremium || d?.GrossPremium || 0
    if (!premium) logError('Missing GrossPremium/DuePremium in full-quote response')
    font(FS.total, 'bold', WHITE)
    doc.text(money(premium), rxb, base(y0 + lh(FS.label), FS.total), { align: 'right' })
    font(FS.min, 'normal', WHITE)
    doc.text('Includes taxes and fees', rxb, base(y0 + lh(FS.label) + lh(FS.total) + 0.4, FS.min), { align: 'right' })

    const ly = y0 + topH + 1.75
    stroke(WHITE, 0.26)
    doc.line(x0, ly, MARGIN + W - bp, ly)
    facts.forEach((f, i) => {
      const fx = x0 + cw * i
      font(FS.label, 'bold', WHITE)
      doc.text(f.label.toUpperCase(), fx, base(ly + 1.75, FS.label))
      font(FS.body, 'bold', WHITE)
      doc.text(f.lines[0], fx, base(ly + 1.75 + lh(FS.label), FS.body))
      if (f.lines.length > 1) {
        font(FS.body, 'normal', WHITE)
        doc.text(f.lines.slice(1), fx, base(ly + 1.75 + lh(FS.label) + lh(FS.body), FS.body))
      }
    })
    y += h + GAP
  }

  // ---------- POLICYHOLDER / TRAVELERS ----------
  if (holder) {
    const idLabel = PH_ID_TYPES[holder.idType as keyof typeof PH_ID_TYPES] ?? holder.idType
    const beneficiary = holder.hasBeneficiary ? holder.beneficiary : undefined
    card(
      sameAsTraveler ? 'Policyholder & Traveler' : 'Policyholder',
      () => {
        const ix = MARGIN + HPAD
        const iw = W - 2 * HPAD
        fieldGroup(
          'Personal',
          [
            { label: 'Full name', value: holderName, full: true },
            { label: 'Date of birth', value: fmtDate(holder.dateOfBirth) },
            { label: 'Gender', value: holder.gender === 'M' ? 'Male' : holder.gender === 'F' ? 'Female' : '' },
          ],
          true,
          ix,
          iw
        )
        fieldGroup(
          'Contact',
          [
            { label: 'Mobile', value: formatPhone(holder.mobileNumber) },
            { label: 'Email', value: clean(holder.email || '') },
            { label: 'Address', value: formatAddress(holder.address), full: true },
          ],
          false,
          ix,
          iw
        )
        fieldGroup(
          'Identity & travel documents',
          [{ label: 'Government ID', value: maskedId(idLabel, holder.idNumber) }],
          false,
          ix,
          iw
        )
        if (beneficiary?.firstName)
          fieldGroup(
            'Beneficiary',
            [
              { label: 'Name', value: fullName(beneficiary.firstName, beneficiary.middleName, beneficiary.lastName) },
              { label: 'Relationship', value: normalizeCase(beneficiary.relationship) },
            ],
            false,
            ix,
            iw
          )
      },
      HPAD
    )
  }

  if (!sameAsTraveler && travelers.length > 0) {
    card('Travelers', () => {
      const w = [10, innerW - 10 - 24 - 36 - 16, 24, 36, 16]
      table(
        [
          { label: '#', w: w[0] },
          { label: 'Name', w: w[1] },
          { label: 'Type', w: w[2] },
          { label: 'Date of birth', w: w[3] },
          { label: 'Age', w: w[4], align: 'right' },
        ],
        travelers.map((t, i) => ({ cells: [String(i + 1), t.name, t.type, t.dob, t.age] }))
      )
    })
  }

  // ---------- PREMIUM ----------
  card('Premium Summary', () => {
    const gross = d?.DuePremium || d?.GrossPremium || 0
    const before = d?.BeforeVatPremium || gross
    const lgt = d?.LGT || 0
    const taxTotal = Math.max(0, gross - before - lgt)
    const rows: { cells: string[]; bold?: boolean }[] = [
      { cells: [`Base premium \u00b7 ${counts}`, money(before)] },
    ]
    if (lgt > 0.005) rows.push({ cells: ['Local government tax', money(lgt)] })
    if (taxTotal <= 0.005) rows.push({ cells: ['Taxes & fees', 'Included in premium'] })
    else {
      const named: [string, number][] = [
        ['Premium tax', toNum(taxes?.premiumTax)],
        ['Documentary stamp tax (DST)', toNum(taxes?.stampDuty)],
      ]
      const namedSum = named.reduce((s, [, v]) => s + v, 0)
      if (namedSum > 0.005 && namedSum <= taxTotal + 0.01) {
        named.filter(([, v]) => v > 0.005).forEach(([l, v]) => rows.push({ cells: [l, money(v)] }))
        const other = taxTotal - namedSum
        if (other > 0.005) rows.push({ cells: ['Other taxes & fees', money(other)] })
      } else {
        if (namedSum > taxTotal + 0.01) logError(`Tax components (${namedSum}) exceed computed taxes (${taxTotal})`)
        rows.push({ cells: ['Taxes & fees (VAT, DST, other)', money(taxTotal)] })
      }
    }
    rows.push({ cells: ['Total premium', money(gross)], bold: true })
    table(
      [
        { label: 'Description', w: innerW - 50 },
        { label: 'Amount', w: 50, align: 'right' },
      ],
      rows
    )
  })

  // ---------- PAGE 2: benefits, information, resume ----------
  const groups = buildBenefitGroups(mainBenefits ?? [], addonBenefits ?? [], limitsUnavailable)
  if (/covid/i.test(planName || '') && !groups.some((g) => g.rows.some((r) => /covid/i.test(r.name))))
    logError('Plan name mentions COVID-19 but no COVID-19 benefit with a limit was found')

  if (!measuring && doc.getNumberOfPages() === 1 && y > TOP + 1) {
    doc.addPage()
    y = TOP
  }

  if (groups.length > 0) {
    card('Benefits Summary', () => {
      const limitW = 72
      const w = [innerW - limitW, limitW]
      const hh = lh(FS.label) + CELL_PAD * 2
      ensure(hh + 2 * (lh(FS.body) + CELL_PAD * 2))
      font(FS.label, 'bold', MUTED)
      doc.text('BENEFIT', innerX + 1, base(y + CELL_PAD, FS.label))
      doc.text('COVERAGE LIMIT', innerX + innerW - 1, base(y + CELL_PAD, FS.label), { align: 'right' })
      y += hh
      stroke(HEAD_RULE, 0.26)
      doc.line(innerX, y, innerX + innerW, y)
      groups.forEach((g) => {
        const headH = lh(FS.body) + CELL_PAD * 2 + 0.8
        ensure(headH + lh(FS.body) + CELL_PAD * 2)
        font(FS.body, 'bold', INK_GREEN)
        doc.text(g.label, innerX + 1, base(y + CELL_PAD + 0.8, FS.body))
        y += headH
        g.rows.forEach((r, i) => {
          const nameLines = wrap(r.name, w[0] - 6, FS.body)
          const limitLines = wrap(r.limit, w[1] - 2, FS.body, 'bold')
          const h = Math.max(nameLines.length, limitLines.length) * lh(FS.body) + CELL_PAD * 2
          ensure(h)
          font(FS.body, 'normal', INK)
          doc.text(nameLines, innerX + 5, base(y + CELL_PAD, FS.body))
          font(FS.body, 'bold', INK)
          doc.text(limitLines, innerX + innerW - 1, base(y + CELL_PAD, FS.body), { align: 'right' })
          y += h
          if (i < g.rows.length - 1) {
            stroke(DIVIDER, 0.26)
            doc.line(innerX + 5, y, innerX + innerW, y)
          }
        })
        stroke(HEAD_RULE, 0.26)
        doc.line(innerX, y, innerX + innerW, y)
      })
    })
  } else logError('No benefits available for this plan; Benefits Summary omitted')

  card('Important Information', () => {
    const gutter = 8
    const colW = (innerW - gutter) / 2
    const exclusions = [
      'Pre-existing medical conditions, unless expressly covered by the plan.',
      'Injuries from hazardous or professional sports and activities not listed in the plan.',
      'Losses arising from war, riots, or other events the insurer excludes.',
      'Claims caused by intentional acts, illegal activity, or travel against medical advice.',
    ]
    const claims = [
      'Contact One Insurance support as soon as possible after an incident.',
      'Keep receipts and any medical, police, or airline reports.',
      'Quote your proposal or policy number when you file the claim.',
    ]
    const colLines = (items: string[]) => items.map((t) => wrap(t, colW - 4, FS.body))
    const ex = colLines(exclusions)
    const cl = colLines(claims)
    const count = (l: string[][]) => l.reduce((s, a) => s + a.length, 0) * lh(FS.body) + l.length * 1
    const colsH = lh(FS.label) + 1 + Math.max(count(ex), count(cl))

    const qrSize = 24
    const textW = innerW - qrSize - 8
    const contactLines = wrap(`Emergency & support: ${SUPPORT_PHONE}  \u00b7  ${SUPPORT_EMAIL}`, textW, FS.body, 'bold')
    const lead = wrap('Scan the QR code or open the link to review this proposal and pay online:', textW, FS.body)
    const linkLines = wrap(resumeUrl, textW, FS.body)
    const refLines = wrap(`Proposal number: ${proposalNo}`, textW, FS.body, 'bold')
    const textH = [contactLines, lead, linkLines, refLines].reduce((s, l) => s + l.length * lh(FS.body), 0) + 3
    const ctaH = Math.max(qrSize, textH)
    const noteLines = wrap(
      'Exclusions shown are a summary. The insurer\u2019s policy wording lists all exclusions and prevails. The insurer\u2019s own assistance line is printed on your policy documents once issued.',
      innerW,
      FS.min
    )
    const h = colsH + 3 + 3 + ctaH + 2 + noteLines.length * lh(FS.min)
    ensure(h)

    const drawCol = (label: string, lines: string[][], x: number) => {
      font(FS.label, 'bold', MUTED)
      doc.text(label, x, base(y, FS.label))
      let cy = y + lh(FS.label) + 1
      lines.forEach((l) => {
        font(FS.body, 'normal', INK)
        doc.text('\u2022', x, base(cy, FS.body))
        doc.text(l, x + 4, base(cy, FS.body))
        cy += l.length * lh(FS.body) + 1
      })
    }
    drawCol('KEY EXCLUSIONS (SUMMARY)', ex, innerX)
    drawCol('HOW TO CLAIM', cl, innerX + colW + gutter)

    let cy = y + colsH + 3
    stroke(DIVIDER, 0.26)
    doc.line(innerX, cy, innerX + innerW, cy)
    cy += 3
    font(FS.body, 'bold', INK_GREEN)
    doc.text(contactLines, innerX, base(cy, FS.body))
    let ty = cy + contactLines.length * lh(FS.body) + 1
    font(FS.body, 'normal', INK)
    doc.text(lead, innerX, base(ty, FS.body))
    ty += lead.length * lh(FS.body)
    font(FS.body, 'normal', INK_GREEN)
    linkLines.forEach((l, i) => {
      if (!measuring) doc.textWithLink(l, innerX, base(ty + i * lh(FS.body), FS.body), { url: resumeUrl })
    })
    ty += linkLines.length * lh(FS.body) + 1
    font(FS.body, 'bold', INK)
    doc.text(refLines, innerX, base(ty, FS.body))
    doc.addImage(qr, 'PNG', innerX + innerW - qrSize, cy, qrSize, qrSize, 'qr')
    cy += ctaH + 2
    font(FS.min, 'normal', MUTED)
    doc.text(noteLines, innerX, base(cy, FS.min))
    y += h
  })

  // ---------- FOOTER (every page) ----------
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    const top = pageHeight - FOOTER_SPACE + 6
    stroke(BRAND, 0.5)
    doc.line(MARGIN, top, MARGIN + W, top)
    const lines = wrap(DISCLAIMER, W, FS.min)
    font(FS.min, 'normal', MUTED)
    doc.text(lines, MARGIN, base(top + 1.5, FS.min))
    const fy = top + 1.5 + lines.length * lh(FS.min) + 0.8
    const left = [`${SUPPORT_EMAIL}`, SUPPORT_PHONE, SUPPORT_WEB, agentCode ? `Ref: ${agentCode}` : ''].filter(Boolean).join('  |  ')
    doc.text(left, MARGIN, base(fy, FS.min))
    doc.text(`Page ${i} of ${total}`, MARGIN + W, base(fy, FS.min), { align: 'right' })
  }

  return { doc, heights, proposalNo }
}
