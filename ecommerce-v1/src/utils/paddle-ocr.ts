/**
 * On-device OCR powered by @paddleocr/paddleocr-js.
 *
 * IMPORTANT: This module must only ever be imported via dynamic import()
 * from client components. It must NEVER appear in a static import at the
 * top of any file — doing so will pull opencv-js into the SSR bundle and
 * cause a "Can't resolve 'fs'" build error.
 *
 * Usage (inside a 'use client' component or callback):
 *   const { runPaddleOCR } = await import('@/utils/paddle-ocr')
 *   const result = await runPaddleOCR(file)
 */

export type { IdOcrResult } from './paddle-ocr-types'

// ── Philippine ID type detection ─────────────────────────────────────────────

const ID_KEYWORDS: Array<{ keywords: string[]; code: string }> = [
  { keywords: ['philippine passport', 'passport', 'pasaporte', 'p<phl', 'ppphl'], code: 'PAS' },
  { keywords: ['land transportation office', "driver's license", 'drivers license', 'driver license', 'lto', 'non-professional'], code: 'DRI' },
  { keywords: ['unified multi-purpose', 'unified multipurpose', 'umid', 'crn'], code: 'UMI' },
  { keywords: ['social security system', 'sss', 'ss number', 'sss number'], code: 'SSS' },
  { keywords: ['philippine health insurance', 'philhealth', 'insurance card ng bayan', 'pin'], code: 'PID' },
  { keywords: ['pag-ibig', 'pagibig', 'home development mutual fund', 'hdmf', 'mid'], code: 'UMI' }, // using UMI for Pag-IBIG as before
  { keywords: ['commission on elections', 'comelec', 'voter', 'precinct'], code: 'VOT' },
  { keywords: ['philippine postal corporation', 'phlpost', 'postal identity card', 'postal id', 'postal reference number', 'prn'], code: 'POS' },
  { keywords: ['bureau of internal revenue', 'bir', 'taxpayer identification', 'tin'], code: 'TIN' },
  { keywords: ['professional regulation commission', 'prc', 'professional identification card', 'registration no'], code: 'PRC' },
  { keywords: ['philippine identification', 'pambansang pagkakakilanlan', 'philsys', 'philippine statistics authority'], code: 'PHI' },
  { keywords: ['barangay id', 'barangay certification'], code: 'BID' },
  { keywords: ['senior citizen', "senior citizen's id", 'osca'], code: 'SCC' },
]

function detectIdType(text: string): string {
  // Replace newlines with spaces to catch keywords split across lines (e.g., SSS)
  const normalizedText = text.replace(/\n/g, ' ')
  for (const { keywords, code } of ID_KEYWORDS) {
    if (keywords.some((kw) => {
      const escaped = kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
      return new RegExp(`(^|\\W)${escaped}(\\W|$)`, 'i').test(normalizedText)
    })) {
      return code
    }
  }
  return 'OTH'
}

// ── Date parsing ──────────────────────────────────────────────────────────────

const DATE_RE = [
  /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})\b/,
  /\b(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\b/,
  /\b(\d{1,2})\s*([A-Z]{3,10})\s*(\d{4})\b/i, // 14 JUL 1992, 14-JUL-1992
  /\b([A-Z]{3,10})\s*(\d{1,2})[,\s]+(\d{4})\b/i,
  /\b(\d{1,2})\s*([A-Z]{3})\s*(\d{2})\b/i, // 14 Aug 88
]

const MONTH_NAMES: Record<string, string> = {
  january: '01', february: '02', march: '03', april: '04',
  may: '05', june: '06', july: '07', august: '08',
  september: '09', october: '10', november: '11', december: '12',
  jan: '01', feb: '02', mar: '03', apr: '04',
  jun: '06', jul: '07', aug: '08', sep: '09',
  oct: '10', nov: '11', dec: '12',
  julv: '07', // common OCR typo on PhilSys
}

function parseDate(text: string): string {
  // Replace newlines with spaces to catch dates split across lines
  const normalizedText = text.replace(/\n/g, ' ')
  
  // Remove registration/issue dates to avoid false positives for DOB
  const textWithoutIssueDates = normalizedText.replace(/(REGISTRATION DATE|DATE OF ISSUE|ISSUE DATE)[\s:]*\d{1,2}[\/\-.A-Z\s]+\d{2,4}/gi, '')

  for (const re of DATE_RE) {
    const m = textWithoutIssueDates.match(re)
    if (!m) continue
    if (isNaN(Number(m[2])) || isNaN(Number(m[1]))) {
      const [, a, b, c] = m
      const monthStr = (isNaN(Number(a)) ? a : b).toLowerCase()
      const dayStr = isNaN(Number(a)) ? b : a
      const month = MONTH_NAMES[monthStr]
      if (month) {
        let year = c
        if (year.length === 2) year = (parseInt(year) > 50 ? '19' : '20') + year
        return `${month}/${dayStr.padStart(2, '0')}/${year}`
      }
    }
    if (m[1].length === 4) {
      const [, yyyy, mm, dd] = m
      return `${mm.padStart(2, '0')}/${dd.padStart(2, '0')}/${yyyy}`
    }
    const [, a, b, yyyy] = m
    const aNum = parseInt(a, 10)
    if (aNum > 12) return `${b.padStart(2, '0')}/${a.padStart(2, '0')}/${yyyy}`
    return `${a.padStart(2, '0')}/${b.padStart(2, '0')}/${yyyy}`
  }
  return ''
}

// ── ID number extraction ──────────────────────────────────────────────────────

const ID_NUMBER_RE = [
  // Voter's VIN (long)
  /\b([A-Z0-9]{4}-\d{4}[A-Z]-[A-Z0-9]{14}-\d)\b/i,
  // PhilSys Card Number (PCN): 16 digits
  /\b(\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4})\b/,
  // PhilHealth PIN: 12 digits
  /\b(\d{2}[-\s]?\d{9}[-\s]?\d)\b/,
  // UMID CRN: 12 digits (tolerating O/L/I OCR typos for 1 and 0)
  /\b([0O1LI]{4}[-\s]?\d{7}[-\s]?\d)\b/,
  // Pag-IBIG MID: 12 digits
  /\b(\d{4}[-\s]?\d{4}[-\s]?\d{4})\b/,
  // PWD ID number: 2-4-3-3 (12 digits)
  /\b(\d{2}-\d{4}-\d{3}-\d{3})\b/,
  // TIN: 9 or 12 digits
  /\b(\d{3}[-\s]?\d{3}[-\s]?\d{3}(?:[-\s]?\d{3,5})?)\b/,
  // Postal PRN: 12 digits
  /\b(?:PRN\s*)?(\d{12})[A-Z]?\b/i,
  // Driver's license number: ANN-NN-NNNNNN (11 chars)
  /\b([A-Z]\d{2}-\d{2}-\d{6})\b/i,
  // SSS number: 9-10 digits (tolerating 6 or 7 middle digits)
  /\b(\d{2}[-\s]?\d{6,7}[-\s]?\d)\b/,
  // Passport number: A + 7 digits (+ optional trailing letter)
  /\b([A-Z]{1,2}\d{7}[A-Z]?)\b/i,
  // PRC registration number: 6-8 digits
  /\b(\d{6,8})\b/,
]

function extractIdNumber(text: string): string {
  const normalizedText = text.replace(/\n/g, ' ')
  for (const re of ID_NUMBER_RE) {
    const m = normalizedText.match(re)
    if (m) {
      let val = m[1].toUpperCase().replace(/\s+/g, '-')
      // Fix common UMID typo
      if (val.match(/^[0O1LI]{4}-/)) {
        val = val.replace(/^O/, '0').replace(/^[LI]/, '1').replace(/^0[LI]{3}/, '0111')
      }
      return val
    }
  }
  return ''
}

// ── Name extraction ───────────────────────────────────────────────────────────

function toTitleCase(s: string): string {
  return s.replace(/\b\w+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

function isLabelLine(line: string): boolean {
  return /^(SURNAME|LAST NAME|APELLIDO|APELLIDOS|A?PELYIDO|PLEYIDO|GIVEN NAMES?|FIRST NAME|PANGALAN|NOMBRE|NOMBRES|MIDDLE NAME|GITNANG PANGALAN|SEGUNDO NOMBRE|GITNANG APELYIDO|PANGGITNANG APELYIDO|MIDDLE INITIAL\/NAME)/i.test(line)
}

function extractLabeledNames(lines: string[]): { first: string; middle: string; last: string } {
  const result = { first: '', middle: '', last: '' }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toUpperCase()
    
    if (line.includes('LAST NAME') && line.includes('FIRST NAME') && line.includes('MIDDLE NAME')) continue

    // Determine value: try next line, if it's a label, try previous line (UMID/TIN style)
    let next = lines[i + 1]?.trim() || ''
    if (!next || isLabelLine(next) || next === 'MALE' || next === 'FEMALE') {
      const prev = lines[i - 1]?.trim() || ''
      if (prev && !isLabelLine(prev) && !prev.includes('ID') && !prev.includes('NO.')) {
        next = prev
      }
    }

    if (/^(SURNAME|LAST NAME|APELLIDO|APELLIDOS|A?PELYIDO|PLEYIDO)($|[\s/:]+)/.test(line)) {
      result.last = toTitleCase(next)
    } else if (/^(GIVEN NAMES?|FIRST NAME|PANGALAN|NOMBRE|NOMBRES)($|[\s/:]+)/.test(line)) {
      // Gather all non-label lines after Given Name for cases where it's split
      let firstParts = [next]
      if (next === lines[i + 1]?.trim()) {
        let j = i + 2
        while (lines[j] && !isLabelLine(lines[j]) && !lines[j].includes('MALE') && !lines[j].includes('FEMALE')) {
          firstParts.push(lines[j].trim())
          j++
        }
      }
      result.first = toTitleCase(firstParts.join(' '))
    } else if (/^(MIDDLE NAME|GITNANG PANGALAN|SEGUNDO NOMBRE|GITNANG APELYIDO|PANGGITNANG APELYIDO|MIDDLE INITIAL\/NAME)($|[\s/:]+)/.test(line)) {
      result.middle = toTitleCase(next)
    } else if (/SURNAME|LAST NAME|APELLIDOS|A?PELYIDO|PLEYIDO/.test(line)) {
      const v = line.replace(/.*(?:SURNAME|LAST NAME|APELLIDO|APELLIDOS|A?PELYIDO|PLEYIDO)\s*[:./]\s*/i, '').trim()
      if (v) result.last = toTitleCase(v)
    } else if (/GIVEN NAME|FIRST NAME|NOMBRES/.test(line)) {
      const v = line.replace(/.*(?:GIVEN NAMES?|FIRST NAME|NOMBRE|NOMBRES)\s*[:./]\s*/i, '').trim()
      if (v) {
        const parts = v.split(/\s+/)
        result.first = toTitleCase(parts[0])
        if (!result.middle && parts.length > 1) result.middle = toTitleCase(parts.slice(1).join(' '))
      }
    }
  }
  return result
}

function extractNames(lines: string[], idType: string): { first: string; middle: string; last: string } {
  const labeled = extractLabeledNames(lines)
  if (labeled.last || labeled.first) return labeled
  
  // VOT fallback (usually lines 4,5,6 or right after VIN)
  if (idType === 'VOT') {
    const vinIdx = lines.findIndex(l => l.toUpperCase().includes('VIN'))
    if (vinIdx !== -1 && lines.length >= vinIdx + 4) {
       return {
         last: toTitleCase(lines[vinIdx + 1].trim()),
         first: toTitleCase(lines[vinIdx + 2].trim()),
         middle: toTitleCase(lines[vinIdx + 3].trim()),
       }
    }
  }

  // POS fallback
  if (idType === 'POS') {
    const headerIdx = lines.findIndex(l => l.toUpperCase().includes('FIRST NAME, MIDDLE NAME, SUMAME'))
    if (headerIdx !== -1 && lines.length >= headerIdx + 4) {
       return {
         first: toTitleCase(lines[headerIdx + 1].trim()),
         middle: toTitleCase(lines[headerIdx + 2].trim()),
         last: toTitleCase(lines[headerIdx + 3].trim() + ' ' + lines[headerIdx + 4].trim()),
       }
    }
  }

  for (const line of lines) {
    const upper = line.trim().toUpperCase()
    if (upper.includes('LAST NAME') && upper.includes('FIRST NAME') && upper.includes('MIDDLE NAME')) continue

    const m = line.match(/^([A-Z][A-Z\s'-]+),\s+([A-Z][A-Z\s'-]+)$/)
    if (m) {
      const parts = m[2].trim().split(/\s+/)
      return { last: toTitleCase(m[1].trim()), first: toTitleCase(parts[0] || ''), middle: toTitleCase(parts.slice(1).join(' ')) }
    }
  }
  return { first: '', middle: '', last: '' }
}

// ── Image preprocessing ───────────────────────────────────────────────────────

const MAX_LONG_SIDE = 1600

async function preprocessImage(file: File): Promise<ImageData> {
  const bitmap = await createImageBitmap(file)
  const { width, height } = bitmap
  const scale = Math.min(1, MAX_LONG_SIDE / Math.max(width, height))
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)
  const canvas = new OffscreenCanvas(w, h)
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D
  ctx.drawImage(bitmap, 0, 0, w, h)
  const imageData = ctx.getImageData(0, 0, w, h)
  bitmap.close()
  return imageData
}

// ── PaddleOCR singleton ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _instancePromise: Promise<any> | null = null

async function getOcrInstance() {
  if (_instancePromise) return _instancePromise
  _instancePromise = (async () => {
    // Dynamic import keeps opencv-js / onnxruntime-web out of the SSR bundle
    const { PaddleOCR } = await import('@paddleocr/paddleocr-js')
    return PaddleOCR.create({
      textDetectionModelName: 'PP-OCRv5_mobile_det',
      textDetectionModelAsset: { url: '/models/PP-OCRv5_mobile_det_onnx_infer.tar' },
      textRecognitionModelName: 'PP-OCRv5_mobile_rec',
      textRecognitionModelAsset: { url: '/models/PP-OCRv5_mobile_rec_onnx_infer.tar' },
      worker: true,
      ortOptions: {
        backend: 'wasm',
        wasmPaths: '/ort/',
        numThreads: 1,
      },
    })
  })()
  return _instancePromise
}

export async function disposePaddleOCR(): Promise<void> {
  if (!_instancePromise) return
  const instance = await _instancePromise
  _instancePromise = null
  await instance?.dispose?.()
}

// ── Public API ────────────────────────────────────────────────────────────────

import type { IdOcrResult } from './paddle-ocr-types'

export async function runPaddleOCR(file: File): Promise<IdOcrResult> {
  const imageData = await preprocessImage(file)
  const ocr = await getOcrInstance()
  const [result] = await ocr.predict(imageData)
  const lines = (result?.items ?? [])
    .map((item: { text: string }) => item.text.trim())
    .filter(Boolean)
  const fullText = lines.join('\n')
  const idType = detectIdType(fullText)
  const { first, middle, last } = extractNames(lines, idType)
  return {
    id_number: extractIdNumber(fullText),
    first_name: first,
    middle_name: middle,
    last_name: last,
    date_of_birth: parseDate(fullText),
    id_type: idType,
    raw_text: fullText,
  }
}
