'use client'

import dynamic from 'next/dynamic'
import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  CheckCircle2,
  AlertCircle,
  ClipboardCopy,
  Trash2,
  ChevronDown,
  ChevronUp,
  ScanText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { IdOcrResult } from '@/utils/paddle-ocr-types'

// Dynamically loaded — never in SSR bundle
const IdUploadWithOcr = dynamic(
  () => import('@/components/id-upload/id-upload-with-ocr'),
  { ssr: false }
)

const ID_TYPE_OPTIONS = [
  { value: 'PAS', label: 'Philippine Passport' },
  { value: 'DRI', label: "Driver's License" },
  { value: 'UMI', label: 'UMID' },
  { value: 'SSS', label: 'SSS ID' },
  { value: 'PID', label: 'PhilHealth' },
  { value: 'VOT', label: "Voter's ID" },
  { value: 'POS', label: 'Postal ID' },
  { value: 'TIN', label: 'TIN ID' },
  { value: 'PRC', label: 'PRC ID' },
  { value: 'PHI', label: 'PhilSys National ID' },
  { value: 'BID', label: 'Barangay ID' },
  { value: 'SCC', label: "Senior Citizen's ID" },
  { value: 'OTH', label: 'Other / Unknown' },
]

interface CalibrationEntry {
  id: string
  imageUrl: string | null
  raw: IdOcrResult | null
  corrected: Partial<IdOcrResult>
  showRaw: boolean
  status: 'scanning' | 'done' | 'error'
  error?: string
}

let idCounter = 0
const newEntry = (): CalibrationEntry => ({
  id: String(++idCounter),
  imageUrl: null,
  raw: null,
  corrected: {},
  showRaw: false,
  status: 'scanning',
})

function FieldRow({
  label,
  fieldKey,
  raw,
  value,
  onChange,
}: {
  label: string
  fieldKey: string
  raw?: string
  value: string
  onChange: (v: string) => void
}) {
  const isDifferent = raw !== undefined && value !== raw && raw !== ''
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label htmlFor={fieldKey} className="text-xs font-medium">
          {label}
        </Label>
        {isDifferent && (
          <span className="text-[10px] text-warning font-medium">corrected</span>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          id={fieldKey}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'h-8 text-sm',
            isDifferent && 'border-warning bg-warning/10/40'
          )}
          placeholder="—"
        />
        {raw && raw !== value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-muted-foreground shrink-0"
            title={`OCR said: "${raw}"`}
            onClick={() => onChange(raw)}
          >
            ↩ {raw.slice(0, 12)}{raw.length > 12 ? '…' : ''}
          </Button>
        )}
      </div>
    </div>
  )
}

function EntryCard({
  entry,
  onOcrResult,
  onUpdate,
  onRemove,
}: {
  entry: CalibrationEntry
  onOcrResult: (id: string, result: IdOcrResult) => void
  onUpdate: (id: string, field: keyof IdOcrResult, value: string) => void
  onRemove: (id: string) => void
}) {
  const corrected = entry.corrected as Record<string, string>
  const raw = entry.raw as Record<string, string> | null

  const getValue = (field: string) =>
    corrected[field] !== undefined ? corrected[field] : raw?.[field] ?? ''

  const idTypeLabel =
    ID_TYPE_OPTIONS.find((o) => o.value === getValue('id_type'))?.label ?? 'Unknown'

  return (
    <Card className="border-2 transition-colors" id={`entry-${entry.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-sm font-semibold">ID #{entry.id}</CardTitle>
            {entry.status === 'scanning' && (
              <Badge variant="secondary" className="text-xs gap-1">
                <ScanText className="h-3 w-3 animate-pulse" />
                Scanning…
              </Badge>
            )}
            {entry.status === 'done' && (
              <Badge className="bg-success/10 text-success hover:bg-success/10 border-success/50 text-xs gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {idTypeLabel}
              </Badge>
            )}
            {entry.status === 'error' && (
              <Badge variant="destructive" className="text-xs gap-1">
                <AlertCircle className="h-3 w-3" />
                Scan failed
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            onClick={() => onRemove(entry.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ID Upload panel */}
        <IdUploadWithOcr
          onOcrResult={(result) => onOcrResult(entry.id, result)}
        />

        {/* Fields — only shown once scan completes */}
        {entry.status === 'done' && entry.raw && (
          <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Review / Correct Fields
            </p>

            {/* ID type */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">
                ID Type
                {entry.raw.id_type !== getValue('id_type') && (
                  <span className="ml-2 text-[10px] text-warning font-medium">corrected</span>
                )}
              </Label>
              <Select
                value={getValue('id_type')}
                onValueChange={(v) => onUpdate(entry.id, 'id_type', v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ID_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-sm">
                      <span className="font-mono text-xs text-muted-foreground mr-2">{o.value}</span>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {entry.raw.id_type !== getValue('id_type') && (
                <p className="text-[10px] text-muted-foreground">
                  OCR detected: <span className="font-mono">{entry.raw.id_type}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FieldRow
                label="Last Name"
                fieldKey={`last-${entry.id}`}
                raw={entry.raw.last_name}
                value={getValue('last_name')}
                onChange={(v) => onUpdate(entry.id, 'last_name', v)}
              />
              <FieldRow
                label="First Name"
                fieldKey={`first-${entry.id}`}
                raw={entry.raw.first_name}
                value={getValue('first_name')}
                onChange={(v) => onUpdate(entry.id, 'first_name', v)}
              />
              <FieldRow
                label="Middle Name"
                fieldKey={`middle-${entry.id}`}
                raw={entry.raw.middle_name}
                value={getValue('middle_name')}
                onChange={(v) => onUpdate(entry.id, 'middle_name', v)}
              />
              <FieldRow
                label="Date of Birth (MM/DD/YYYY)"
                fieldKey={`dob-${entry.id}`}
                raw={entry.raw.date_of_birth}
                value={getValue('date_of_birth')}
                onChange={(v) => onUpdate(entry.id, 'date_of_birth', v)}
              />
              <div className="sm:col-span-2">
                <FieldRow
                  label="ID Number"
                  fieldKey={`idnum-${entry.id}`}
                  raw={entry.raw.id_number}
                  value={getValue('id_number')}
                  onChange={(v) => onUpdate(entry.id, 'id_number', v)}
                />
              </div>
            </div>

            {/* Raw OCR text toggle */}
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-full justify-between text-xs text-muted-foreground"
                onClick={() =>
                  onUpdate(entry.id, 'raw_text', getValue('raw_text'))
                }
                // Toggle using a custom data attr trick — we delegate toggle state to the entry
              >
                <span className="flex items-center gap-1">
                  <ScanText className="h-3 w-3" />
                  Raw OCR text ({entry.raw.raw_text.split('\n').filter(Boolean).length} lines)
                </span>
                {entry.showRaw ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
              {entry.showRaw && (
                <Textarea
                  readOnly
                  value={entry.raw.raw_text}
                  className="font-mono text-xs h-40 resize-none bg-slate-950 text-success border-slate-800"
                />
              )}
            </div>
          </div>
        )}

        {entry.status === 'error' && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {entry.error ?? 'OCR scan failed. Upload a clearer image or check the console.'}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function OcrCalibrationPage() {
  const [entries, setEntries] = useState<CalibrationEntry[]>([newEntry()])
  const [copied, setCopied] = useState(false)

  const handleOcrResult = useCallback((entryId: string, result: IdOcrResult) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? { ...e, raw: result, corrected: {}, status: 'done', showRaw: false }
          : e
      )
    )
  }, [])

  const handleUpdate = useCallback(
    (entryId: string, field: keyof IdOcrResult, value: string) => {
      // Special case: raw_text update is used to toggle the raw panel
      if (field === 'raw_text') {
        setEntries((prev) =>
          prev.map((e) =>
            e.id === entryId ? { ...e, showRaw: !e.showRaw } : e
          )
        )
        return
      }
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entryId
            ? { ...e, corrected: { ...e.corrected, [field]: value } }
            : e
        )
      )
    },
    []
  )

  const handleRemove = useCallback((entryId: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== entryId))
  }, [])

  const addEntry = () => setEntries((prev) => [...prev, newEntry()])

  // Build calibration export
  const exportData = entries
    .filter((e) => e.status === 'done' && e.raw)
    .map((e) => {
      const raw = e.raw!
      const corrected = e.corrected as Record<string, string>
      const fields: Record<string, string> = [
        'id_type',
        'last_name',
        'first_name',
        'middle_name',
        'date_of_birth',
        'id_number',
      ].reduce(
        (acc, k) => ({
          ...acc,
          [k]: corrected[k] !== undefined ? corrected[k] : (raw as unknown as Record<string, string>)[k],
        }),
        {}
      )

      const corrections: Record<string, { ocr: string; corrected: string }> = {}
      for (const [k, v] of Object.entries(corrected)) {
        const ocr = (raw as unknown as Record<string, string>)[k]
        if (v !== ocr) corrections[k] = { ocr, corrected: v }
      }
      return {
        ...fields,
        _corrections: corrections,
        _raw_lines: raw.raw_text.split('\n').filter(Boolean),
      }
    })

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const hasDone = exportData.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
              <ScanText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">OCR Calibration</h1>
              <p className="text-muted-foreground text-sm">
                Upload real IDs, review what the OCR extracted, correct any errors, then copy the results.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-warning/50 bg-warning/10 px-4 py-3 text-sm text-amber-800 flex gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Dev-only page.</span> Do not share, link to, or deploy this page in production.
              OCR runs entirely on-device — no images or data are uploaded.
            </div>
          </div>
        </div>

        {/* Instructions */}
        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground pl-1">
          <li>Click <strong>Add ID</strong> to add a scan slot. You can add as many as you need.</li>
          <li>Upload an ID image. The scanner runs immediately.</li>
          <li>Review each field and correct any mistakes (corrected fields turn amber).</li>
          <li>Use the <em>↩ revert</em> button to put back what the OCR said.</li>
          <li>Expand <em>Raw OCR text</em> to see the exact lines the engine returned.</li>
          <li>When done, click <strong>Copy calibration JSON</strong> and share the output.</li>
        </ol>

        {/* ID entry cards */}
        <div className="space-y-6">
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onOcrResult={handleOcrResult}
              onUpdate={handleUpdate}
              onRemove={handleRemove}
            />
          ))}
        </div>

        {/* Add ID button */}
        <Button variant="outline" className="w-full border-dashed gap-2" onClick={addEntry}>
          + Add another ID
        </Button>

        {/* Export panel */}
        <Card className={cn('border-2 transition-colors', hasDone ? 'border-primary/40' : 'border-muted')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ClipboardCopy className="h-4 w-4" />
              Calibration Output
              {hasDone && (
                <Badge className="ml-auto text-xs">
                  {exportData.length} ID{exportData.length !== 1 ? 's' : ''} ready
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hasDone ? (
              <>
                <Textarea
                  readOnly
                  value={JSON.stringify(exportData, null, 2)}
                  className="font-mono text-xs h-64 resize-none bg-slate-950 text-success border-slate-800"
                />
                <Button
                  className="w-full gap-2"
                  onClick={handleCopy}
                  disabled={copied}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <ClipboardCopy className="h-4 w-4" />
                      Copy calibration JSON
                    </>
                  )}
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                Scan at least one ID to generate calibration output.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
