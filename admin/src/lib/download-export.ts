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

  const blob = await res.blob()
  const filename =
    filenameFromDisposition(res.headers.get('Content-Disposition')) ??
    fallbackFilename
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
