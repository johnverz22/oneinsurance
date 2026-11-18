/** Extract a human-readable message from a Laravel-style error payload. */
export function extractApiError(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback

  const { message, errors } = payload as {
    message?: unknown
    errors?: unknown
  }

  if (errors && typeof errors === 'object') {
    const parts = Object.entries(errors as Record<string, unknown>).flatMap(
      ([field, value]) => {
        const messages = Array.isArray(value) ? value : [value]
        return messages
          .filter((item): item is string => typeof item === 'string')
          .map((item) => `${field}: ${item}`)
      }
    )
    if (parts.length > 0) return parts.join(' · ')
  }

  return typeof message === 'string' && message ? message : fallback
}
