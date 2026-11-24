import { extractApiError } from '@/lib/api-error'

type AuthFetch = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>

type ExportResult = { ok: true } | { ok: false; message: string }

function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null
  const encoded = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(header)
  if (encoded?.[1]) {
    try {
      return decodeURIComponent(encoded[1].replace(/^"|"$/g, '').trim())
    } catch {
      return encoded[1].replace(/^"|"$/g, '').trim()
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header)
  return plain?.[1]?.trim() ?? null
}

/**
 * Post-process a backend CSV to prevent Excel mangling:
 *
 * 1. Strips any existing BOM then prepends a UTF-8 BOM so Excel auto-detects
 *    the encoding (prevents ₱ and accented characters becoming garbage).
 * 2. Wraps unquoted pure-numeric cell values with 12+ digits in `"\t..."` so
 *    Excel treats them as text instead of converting to scientific notation
 *    (e.g. policy number 3802608000643 → 3.8E+12).
 */
function sanitizeCsv(raw: string): string {
  // Strip BOM if backend already added one, we'll prepend our own.
  const stripped = raw.startsWith('\uFEFF') ? raw.slice(1) : raw

  // For each line, walk comma-separated tokens and prefix any bare 12+ digit
  // numeric string with a tab so Excel treats the cell as text.
  const lines = stripped.split('\n')
  const fixed = lines.map((line) => {
    // Tokenise respecting quoted fields (RFC 4180).
    const tokens: string[] = []
    let i = 0
    while (i < line.length) {
      if (line[i] === '"') {
        // Quoted field — find closing quote (handle "" escapes).
        let j = i + 1
        while (j < line.length) {
          if (line[j] === '"' && line[j + 1] === '"') { j += 2; continue }
          if (line[j] === '"') break
          j++
        }
        tokens.push(line.slice(i, j + 1))
        i = j + 2 // skip closing quote + comma
      } else {
        const end = line.indexOf(',', i)
        const token = end === -1 ? line.slice(i) : line.slice(i, end)
        // Bare 12+ digit numeric → prefix with tab inside quotes.
        tokens.push(/^\d{12,}$/.test(token) ? `"\t${token}"` : token)
        i = end === -1 ? line.length : end + 1
      }
    }
    return tokens.join(',')
  })

  return '\uFEFF' + fixed.join('\n')
}

/**
 * Fetch an authenticated export from the BFF and save it with the filename
 * supplied by the backend. Returns the upstream message on failure.
 */
export async function downloadExport(
  authFetch: AuthFetch,
  url: string,
  fallbackFilename: string
): Promise<ExportResult> {
  const res = await authFetch(url)

  if (!res.ok) {
    const payload = await res.json().catch(() => null)
    return {
      ok: false,
      message: extractApiError(payload, `Export failed (${res.status})`),
    }
  }

  const contentType = res.headers.get('Content-Type') ?? ''
  const filename =
    filenameFromDisposition(res.headers.get('Content-Disposition')) ??
    fallbackFilename

  let blob: Blob
  if (contentType.includes('csv') || filename.endsWith('.csv')) {
    // Read as text so we can sanitize before saving.
    const text = await res.text()
    blob = new Blob([sanitizeCsv(text)], { type: 'text/csv;charset=utf-8;' })
  } else {
    blob = await res.blob()
  }

  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)

  return { ok: true }
}
