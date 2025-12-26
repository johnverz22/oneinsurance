export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename = 'data.csv'
) {
  if (!data?.length) return

  const headers = Object.keys(data[0])
  const escapeCSV = (value: any) => {
    if (value == null) return ''
    const stringValue =
      value instanceof Date ? value.toISOString() : String(value)
    return /[",\n]/.test(stringValue)
      ? `"${stringValue.replace(/"/g, '""')}"`
      : stringValue
  }

  const csvRows = [
    headers.join(','),
    ...data.map((row) => headers.map((h) => escapeCSV(row[h])).join(',')),
  ]

  const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n')
  const encodedUri = encodeURI(csvContent)

  const link = document.createElement('a')
  link.href = encodedUri
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
