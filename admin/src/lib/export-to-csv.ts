/** Export an array of flat objects to a CSV file download. */
export function exportToCSV(
  rows: Array<Record<string, unknown>>,
  filename: string
) {
  if (rows.length === 0) return

  const headers = Object.keys(rows[0])

  /**
   * Serialize a cell value to a CSV-safe string.
   *
   * Excel silently converts long pure-numeric strings (≥12 digits) to
   * scientific notation (e.g. policy number 3802608000643 → 3.8E+12).
   * To prevent this we prefix such values with a tab character inside
   * quotes — a widely-supported trick that forces Excel to treat the cell
   * as text while keeping the value readable.
   */
  const escape = (value: unknown): string => {
    // Coerce to string
    const s = value === null || value === undefined ? '' : String(value)

    // Pure-numeric strings with 12+ digits (IDs, policy/certificate numbers,
    // phone numbers, etc.) would be mangled by Excel into scientific notation.
    // Prefix with \t inside quotes to force text interpretation.
    if (/^\d{12,}$/.test(s)) {
      return `"\t${s.replace(/"/g, '""')}"`
    }

    // Standard quoting: wrap in double-quotes when the value contains a
    // double-quote, comma, or newline.
    if (/[",\n]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`
    }

    return s
  }

  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ].join('\n')

  // UTF-8 BOM (\uFEFF) causes Excel to auto-detect the encoding correctly,
  // preventing mojibake on special characters (₱, accented names, etc.).
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
