'use client'

import { useState, useCallback, useRef } from 'react'
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, ClipboardCopy, Download, Plus, ScanText, Trash2 } from 'lucide-react'
import { IdUpload } from '@/components/travel-insurance/id-upload'
import type { IdOcrResult } from '@/utils/paddle-ocr-types'

// ── Constants ────────────────────────────────────────────────────────────────

const ID_TYPE_OPTIONS = [
  { value: 'PAS', label: 'Philippine Passport' },
  { value: 'DRI', label: "Driver's License (LTO)" },
  { value: 'UMI', label: 'UMID / Pag-IBIG' },
  { value: 'SSS', label: 'SSS ID' },
  { value: 'PID', label: 'PhilHealth (PID)' },
  { value: 'VOT', label: "Voter's ID (COMELEC)" },
  { value: 'POS', label: 'Postal ID' },
  { value: 'TIN', label: 'TIN ID (BIR)' },
  { value: 'PRC', label: 'PRC ID' },
  { value: 'PHI', label: 'PhilSys National ID' },
  { value: 'BID', label: 'Barangay ID' },
  { value: 'SCC', label: "Senior Citizen's ID" },
  { value: 'OTH', label: 'Other / Unknown' },
] as const

/** Fields that must be reviewed (same as FIELD_LABELS in id-upload.tsx) */
const REVIEW_FIELDS: Array<{ key: keyof IdOcrResult; label: string }> = [
  { key: 'first_name',    label: 'First name' },
  { key: 'middle_name',   label: 'Middle name' },
  { key: 'last_name',     label: 'Last name' },
  { key: 'date_of_birth', label: 'Date of birth (MM/DD/YYYY)' },
  { key: 'id_number',     label: 'ID number' },
]

// ── Types ────────────────────────────────────────────────────────────────────

type EntryStatus = 'idle' | 'scanning' | 'done' | 'partial' | 'error'

interface CalibrationEntry {
  id: string
  raw: IdOcrResult | null
  corrected: Partial<IdOcrResult>
  showRaw: boolean
  status: EntryStatus
}

// ── Helpers ──────────────────────────────────────────────────────────────────

let _counter = 0
const mkEntry = (): CalibrationEntry => ({
  id: String(++_counter),
  raw: null,
  corrected: {},
  showRaw: false,
  status: 'idle',
})

// ── Sub-components ───────────────────────────────────────────────────────────

/** Single editable field row with corrected-amber highlight and revert button */
function FieldRow({
  label,
  rawValue,
  value,
  onChange,
}: {
  label: string
  rawValue: string
  value: string
  onChange: (v: string) => void
}) {
  const corrected = value !== rawValue && rawValue !== ''
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-xs font-medium text-[var(--text-sub)]">{label}</label>
        {corrected && (
          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">corrected</span>
        )}
      </div>
      <div className="flex gap-1.5">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="—"
          className={`ui-form-field flex-1 min-h-9 text-sm${corrected ? ' border-amber-500 outline-amber-500 bg-amber-50 dark:bg-amber-950/20' : ''}`}
        />
        {corrected && (
          <button
            type="button"
            title={`Revert to OCR value: "${rawValue}"`}
            onClick={() => onChange(rawValue)}
            className="shrink-0 inline-flex min-h-9 items-center gap-1 rounded-md border border-[var(--border)] px-2 text-xs text-[var(--text-muted)] hover:bg-[var(--subtle)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
          >
            ↩ {rawValue.slice(0, 10)}{rawValue.length > 10 ? '…' : ''}
          </button>
        )}
      </div>
    </div>
  )
}

/** A single ID scan card */
function EntryCard({
  entry,
  entryNum,
  onResult,
  onUpdate,
  onIdTypeChange,
  onToggleRaw,
  onRemove,
  onScanningChange,
}: {
  entry: CalibrationEntry
  entryNum: number
  onResult: (id: string, result: IdOcrResult) => void
  onUpdate: (id: string, field: keyof IdOcrResult, value: string) => void
  onIdTypeChange: (id: string, value: string) => void
  onToggleRaw: (id: string) => void
  onRemove: (id: string) => void
  onScanningChange: (id: string, scanning: boolean) => void
}) {
  // Get current value: prefer corrected, fall back to OCR raw
  const get = (field: keyof IdOcrResult): string => {
    const c = entry.corrected[field]
    return c !== undefined ? c : (entry.raw?.[field] ?? '')
  }

  const idTypeLabel = ID_TYPE_OPTIONS.find((o) => o.value === get('id_type'))?.label ?? 'Unknown'
  const rawLineCount = entry.raw?.raw_text.split('\n').filter(Boolean).length ?? 0

  // Status chip
  const chip = entry.status === 'scanning' ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--subtle)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-muted)]">
      <ScanText className="size-3 animate-pulse" aria-hidden /> Scanning…
    </span>
  ) : entry.status === 'done' || entry.status === 'partial' ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#e2eddb] px-2.5 py-0.5 text-xs font-semibold text-[var(--primary)] dark:bg-[#1c3020] dark:text-[#d0e3c8]">
      <CheckCircle2 className="size-3" aria-hidden /> {idTypeLabel}
      {entry.status === 'partial' && <span className="text-amber-600 dark:text-amber-400 ml-1">(partial)</span>}
    </span>
  ) : entry.status === 'error' ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/20 dark:text-red-300">
      <AlertCircle className="size-3" aria-hidden /> Scan failed
    </span>
  ) : null

  return (
    <div className="travel-applicant-card space-y-5">
      {/* Card header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-base font-semibold">ID #{entryNum}</h3>
          {chip}
        </div>
        <button
          type="button"
          onClick={() => onRemove(entry.id)}
          aria-label={`Remove ID #${entryNum}`}
          className="inline-flex size-8 items-center justify-center rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>

      {/* ID upload (drives the OCR) */}
      <IdUpload
        label={`Upload ID for slot #${entryNum}`}
        required={false}
        onChange={() => {/* files tracked by IdUpload internally */}}
        onOcrResult={(result) => onResult(entry.id, result)}
        onScanningChange={(scanning) => onScanningChange(entry.id, scanning)}
      />

      {/* Fields — shown once at least partial result is available */}
      {(entry.status === 'done' || entry.status === 'partial') && entry.raw && (
        <div className="space-y-4 rounded-lg border border-[var(--border)] bg-[var(--subtle)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Review &amp; correct extracted fields
          </p>

          {/* ID type */}
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-medium text-[var(--text-sub)]">ID type</label>
              {entry.corrected.id_type && entry.corrected.id_type !== entry.raw.id_type && (
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">corrected</span>
              )}
            </div>
            <select
              value={get('id_type')}
              onChange={(e) => onIdTypeChange(entry.id, e.target.value)}
              className="ui-form-field min-h-9 w-full text-sm"
            >
              {ID_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.value} — {o.label}
                </option>
              ))}
            </select>
            {entry.corrected.id_type && entry.corrected.id_type !== entry.raw.id_type && (
              <p className="text-[10px] text-[var(--text-muted)]">
                OCR detected: <span className="font-mono">{entry.raw.id_type}</span>
              </p>
            )}
          </div>

          {/* Text fields */}
          <div className="grid gap-3 sm:grid-cols-2">
            {REVIEW_FIELDS.map(({ key, label }) => (
              <div key={key} className={key === 'id_number' ? 'sm:col-span-2' : ''}>
                <FieldRow
                  label={label}
                  rawValue={entry.raw![key] ?? ''}
                  value={get(key)}
                  onChange={(v) => onUpdate(entry.id, key, v)}
                />
              </div>
            ))}
          </div>

          {/* Raw OCR text toggle */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onToggleRaw(entry.id)}
              className="flex w-full min-h-8 items-center justify-between gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-sub)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
            >
              <span className="flex items-center gap-1.5">
                <ScanText className="size-3.5" aria-hidden />
                Raw OCR text ({rawLineCount} lines)
              </span>
              {entry.showRaw ? <ChevronUp className="size-3.5" aria-hidden /> : <ChevronDown className="size-3.5" aria-hidden />}
            </button>
            {entry.showRaw && (
              <textarea
                readOnly
                value={entry.raw.raw_text}
                rows={10}
                className="block w-full resize-none rounded-md border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-emerald-400 focus:outline-none"
                aria-label="Raw OCR text output"
              />
            )}
          </div>
        </div>
      )}

      {entry.status === 'error' && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="inline size-3.5 mr-1.5 shrink-0" aria-hidden />
          OCR scan failed. Upload a clearer, well-lit image or check the browser console for details.
        </div>
      )}
    </div>
  )
}

// ── Main page component ──────────────────────────────────────────────────────

export default function OcrCalibrationClient() {
  const [entries, setEntries] = useState<CalibrationEntry[]>([mkEntry()])
  const [copied, setCopied] = useState(false)
  // Track per-entry scanning to disable the export area while busy
  const [scanningSet, setScanningSet] = useState<Set<string>>(() => new Set())
  const anyScanning = scanningSet.size > 0

  // ── Handlers ──

  const handleResult = useCallback((entryId: string, result: IdOcrResult) => {
    const missing = (['first_name', 'last_name', 'date_of_birth', 'id_number', 'id_type'] as const)
      .filter((k) => !result[k] || String(result[k]).trim() === '').length
    const status: EntryStatus = missing === 5 ? 'error' : missing > 0 ? 'partial' : 'done'
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? { ...e, raw: result, corrected: {}, status, showRaw: false }
          : e
      )
    )
  }, [])

  const handleUpdate = useCallback((entryId: string, field: keyof IdOcrResult, value: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId ? { ...e, corrected: { ...e.corrected, [field]: value } } : e
      )
    )
  }, [])

  const handleIdTypeChange = useCallback((entryId: string, value: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId ? { ...e, corrected: { ...e.corrected, id_type: value } } : e
      )
    )
  }, [])

  const handleToggleRaw = useCallback((entryId: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, showRaw: !e.showRaw } : e))
    )
  }, [])

  const handleRemove = useCallback((entryId: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== entryId))
  }, [])

  const handleScanningChange = useCallback((entryId: string, scanning: boolean) => {
    setScanningSet((prev) => {
      const next = new Set(prev)
      if (scanning) next.add(entryId)
      else next.delete(entryId)
      return next
    })
    // Mark entry as scanning in the card too
    if (scanning) {
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId && e.status === 'idle' ? { ...e, status: 'scanning' } : e))
      )
    }
  }, [])

  const addEntry = () => setEntries((prev) => [...prev, mkEntry()])

  // ── Export data ──

  const exportData = entries
    .filter((e) => (e.status === 'done' || e.status === 'partial') && e.raw)
    .map((e, i) => {
      const raw = e.raw!
      const corrected = e.corrected as Record<string, string>
      const get = (k: string) => corrected[k] !== undefined ? corrected[k] : (raw as unknown as Record<string, string>)[k] ?? ''

      const fields = ['id_type', 'last_name', 'first_name', 'middle_name', 'date_of_birth', 'id_number']
        .reduce<Record<string, string>>((acc, k) => ({ ...acc, [k]: get(k) }), {})

      const corrections: Record<string, { ocr: string; corrected: string }> = {}
      for (const [k, v] of Object.entries(corrected)) {
        const ocr = (raw as unknown as Record<string, string>)[k] ?? ''
        if (v !== ocr) corrections[k] = { ocr, corrected: v }
      }

      return {
        slot: i + 1,
        ...fields,
        _corrections: corrections,
        _ocr_line_count: raw.raw_text.split('\n').filter(Boolean).length,
        _raw_lines: raw.raw_text.split('\n').filter(Boolean),
      }
    })

  const exportJson = JSON.stringify(exportData, null, 2)
  const hasDone = exportData.length > 0

  const handleCopy = () => {
    navigator.clipboard.writeText(exportJson).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const handleDownload = () => {
    const blob = new Blob([exportJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ocr-calibration-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Render ──

  return (
    <div className="min-h-screen bg-[var(--page-bg,var(--card))]">
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">

        {/* ── Page header ── */}
        <header className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-white">
              <ScanText className="size-5" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">OCR Calibration</h1>
              <p className="text-sm text-[var(--text-muted)]">
                Scan real IDs, review extracted fields, correct errors, then export the results.
              </p>
            </div>
          </div>

          {/* Dev-only warning */}
          <div
            role="alert"
            className="flex gap-2.5 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300"
          >
            <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden />
            <div>
              <span className="font-semibold">Developer tool — disabled in production.</span>{' '}
              Do not link to, share, or expose this URL to end users. OCR runs entirely
              on-device; no image data leaves the browser.
            </div>
          </div>
        </header>

        {/* ── Instructions ── */}
        <section aria-labelledby="calibration-instructions">
          <h2 id="calibration-instructions" className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            How to calibrate
          </h2>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-[var(--text-sub)]">
            <li>Click <strong>Add another ID</strong> to add a new scan slot (one per ID card).</li>
            <li>Upload a clear photo of the front of each Philippine ID.</li>
            <li>Wait for scanning to complete — fields will pre-fill automatically.</li>
            <li>Review every field. Correct anything the OCR got wrong (corrected fields turn <span className="text-amber-600 font-semibold">amber</span>).</li>
            <li>Use the <em>↩ revert</em> button next to a field to restore the original OCR value.</li>
            <li>Expand <em>Raw OCR text</em> to see the exact lines the engine returned for debugging.</li>
            <li>
              When done, click <strong>Copy JSON</strong> or <strong>Download</strong> and{' '}
              <strong>send the file to the developer</strong>.
            </li>
          </ol>
        </section>

        {/* ── Entry cards ── */}
        <div className="space-y-6">
          {entries.map((entry, i) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              entryNum={i + 1}
              onResult={handleResult}
              onUpdate={handleUpdate}
              onIdTypeChange={handleIdTypeChange}
              onToggleRaw={handleToggleRaw}
              onRemove={handleRemove}
              onScanningChange={handleScanningChange}
            />
          ))}
        </div>

        {/* ── Add another ── */}
        <button
          type="button"
          onClick={addEntry}
          className="flex w-full min-h-11 items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--primary)] text-sm font-semibold text-[var(--primary)] hover:bg-[color-mix(in_srgb,var(--primary)_6%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)] dark:border-[#707873] dark:text-[#f4f5f2]"
        >
          <Plus className="size-4" aria-hidden />
          Add another ID
        </button>

        {/* ── Export panel ── */}
        <section aria-labelledby="export-heading" className="travel-applicant-card space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 id="export-heading" className="text-base font-semibold flex items-center gap-2">
              <ClipboardCopy className="size-4" aria-hidden />
              Calibration Output
            </h2>
            {hasDone && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e2eddb] px-2.5 py-0.5 text-xs font-semibold text-[var(--primary)] dark:bg-[#1c3020] dark:text-[#d0e3c8]">
                <CheckCircle2 className="size-3" aria-hidden />
                {exportData.length} ID{exportData.length !== 1 ? 's' : ''} ready
              </span>
            )}
          </div>

          {hasDone ? (
            <>
              <textarea
                readOnly
                value={exportJson}
                rows={14}
                className="block w-full resize-none rounded-md border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-emerald-400 focus:outline-none"
                aria-label="Calibration JSON output"
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={anyScanning || copied}
                  className="btn-primary flex-1 inline-flex min-h-11 items-center justify-center gap-2 text-sm font-semibold disabled:opacity-50"
                >
                  {copied ? (
                    <><CheckCircle2 className="size-4" aria-hidden /> Copied!</>
                  ) : (
                    <><ClipboardCopy className="size-4" aria-hidden /> Copy JSON</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={anyScanning}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--subtle)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)] disabled:opacity-50 dark:border-[#707873] dark:text-[#f4f5f2]"
                >
                  <Download className="size-4" aria-hidden />
                  Download
                </button>
              </div>

              {/* Instructions for recipient */}
              <div className="rounded-lg border border-[var(--border)] bg-[var(--subtle)] px-4 py-3 text-xs text-[var(--text-muted)] space-y-1">
                <p className="font-semibold text-[var(--text-sub)]">📩 Instructions for the developer</p>
                <p>
                  Email or Slack the downloaded <code className="font-mono bg-[var(--border)] px-1 rounded">ocr-calibration-*.json</code> file
                  to the developer along with a note about any ID types that were scanned.
                  Each entry in the JSON contains:
                </p>
                <ul className="list-disc list-inside space-y-0.5 mt-1">
                  <li><code className="font-mono">id_type</code>, <code className="font-mono">first_name</code>, <code className="font-mono">last_name</code>, <code className="font-mono">middle_name</code>, <code className="font-mono">date_of_birth</code>, <code className="font-mono">id_number</code> — the <strong>ground-truth</strong> values.</li>
                  <li><code className="font-mono">_corrections</code> — a diff of every field the OCR got wrong.</li>
                  <li><code className="font-mono">_raw_lines</code> — the raw text the engine returned (for debugging).</li>
                </ul>
                <p className="mt-1 text-[var(--text-muted)]">
                  ⚠ Do not include images or the ID holder&apos;s full personal data in the email.
                  Only send the JSON file.
                </p>
              </div>
            </>
          ) : (
            <p className="py-8 text-center text-sm text-[var(--text-muted)]">
              Scan at least one ID above to generate calibration output.
            </p>
          )}
        </section>

      </div>
    </div>
  )
}
