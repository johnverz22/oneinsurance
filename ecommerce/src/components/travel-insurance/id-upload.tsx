'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { AlertCircle, CheckCircle2, Loader2, Plus, ScanText, X } from 'lucide-react'
import type { IdOcrResult } from '@/utils/paddle-ocr-types'

const ACCEPT = { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp'] }
const MAX_SIZE = 5 * 1024 * 1024
const fmt = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`

type OcrStatus = 'idle' | 'scanning' | 'done' | 'partial' | 'error'

/**
 * Reason for OCR failure or partial extraction.
 * - file-type      File format not supported.
 * - file-size      File exceeds the 5 MB limit.
 * - unreadable     Image loaded but OCR could not read any text.
 * - partial        OCR ran but some key fields were not extracted.
 * - service        OCR engine threw an unexpected error.
 */
type OcrFailureReason = 'file-type' | 'file-size' | 'unreadable' | 'partial' | 'service'

const OCR_ERROR_MESSAGES: Record<OcrFailureReason, string> = {
  'file-type': 'Unsupported file type. Please upload a JPEG, PNG, GIF, BMP, or WebP image.',
  'file-size': 'Image is larger than 5 MB. Please use a smaller file.',
  'unreadable': 'Could not read the ID. Make sure the image is clear, well-lit, and not cropped.',
  'partial':    'Some fields could not be extracted. Please review the pre-filled fields and fill in the rest manually.',
  'service':    'ID scanning is temporarily unavailable. Please fill in your details manually.',
}

/** The key fields we try to extract — used to show which ones came through */
const FIELD_LABELS: Array<{ key: keyof IdOcrResult; label: string }> = [
  { key: 'first_name',    label: 'First name' },
  { key: 'last_name',     label: 'Last name' },
  { key: 'date_of_birth', label: 'Date of birth' },
  { key: 'id_number',     label: 'ID number' },
  { key: 'id_type',       label: 'ID type' },
]

/** Detect if the device supports capturing from camera (mobile heuristic). */
const isMobile = () =>
  typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)

interface IdUploadProps {
  label: string
  /** Whether the front-of-ID upload is required (drives the required marker). */
  required?: boolean
  /** Whether the back-of-ID upload is required (drives the required marker). */
  backRequired?: boolean
  initialFront?: File | null
  initialBack?: File | null
  onChange: (front: File | null, back: File | null) => void
  onOcrResult: (result: IdOcrResult) => void
  /**
   * Called whenever the scanning lock changes so the parent form can disable
   * its submit button while a scan is in progress.
   */
  onScanningChange?: (scanning: boolean) => void
}

async function scanWithPaddle(file: File): Promise<IdOcrResult> {
  const { runPaddleOCR } = await import('@/utils/paddle-ocr')
  return runPaddleOCR(file)
}

/* ── Single-side dropzone / thumbnail ── */
interface SlotProps {
  side: 'front' | 'back'
  file: File | null
  /** True while OCR is in-flight; disables Replace/Remove/Scan buttons */
  scanning?: boolean
  onFile: (f: File | null) => void
  onReject: (msg: string) => void
  /** OCR status — shown on the front slot only */
  ocrStatus?: OcrStatus
  onRescan?: () => void
}

function Slot({ side, file, scanning = false, onFile, onReject, ocrStatus, onRescan }: SlotProps) {
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  const mobile = typeof window !== 'undefined' ? isMobile() : false

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: ACCEPT,
    maxFiles: 1,
    maxSize: MAX_SIZE,
    noClick: true,         // we handle clicks ourselves so we can show two buttons
    onDrop: (accepted) => accepted[0] && onFile(accepted[0]),
    onDropRejected: (rejections) =>
      onReject(
        rejections[0]?.errors[0]?.code === 'file-too-large'
          ? 'Image is larger than 5 MB.'
          : 'Please upload a valid image (JPEG, PNG, GIF, BMP, WebP).'
      ),
  })

  const title = side === 'front' ? 'Front of ID' : 'Back of ID'

  if (file) {
    /* ── Thumbnail row (after upload) ── */
    return (
      <div className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 rounded-md border border-[var(--border)] bg-[var(--subtle)] px-3 py-2.5 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {preview && (
          <img
            src={preview}
            alt={`${title} preview`}
            className="h-10 w-14 shrink-0 rounded object-cover"
          />
        )}
        <div className="min-w-0">
          <p className="truncate text-xs font-medium">{file.name}</p>
          <p className="text-xs text-[var(--text-muted)]">{fmt(file.size)}</p>
        </div>
        <div className="col-span-2 flex items-center justify-end gap-1 sm:col-span-1">
          {onRescan && !scanning && (
            <button
              type="button"
              onClick={onRescan}
              className="inline-flex min-h-[36px] items-center gap-1 rounded px-2.5 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--border)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
            >
              <ScanText className="size-3.5" aria-hidden />
              {ocrStatus === 'done' || ocrStatus === 'partial' ? 'Re-scan' : 'Scan'}
            </button>
          )}
          {scanning && (
            <span className="inline-flex min-h-[36px] items-center gap-1 px-2.5 text-xs text-[var(--text-muted)]">
              <Loader2 className="size-3.5 animate-spin" aria-hidden /> Scanning…
            </span>
          )}
          <button
            type="button"
            onClick={open}
            disabled={scanning}
            className="inline-flex min-h-[36px] items-center gap-1 rounded px-2.5 text-xs font-semibold text-[var(--text-sub)] hover:bg-[var(--border)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)] disabled:pointer-events-none disabled:opacity-40"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={() => onFile(null)}
            disabled={scanning}
            aria-label={`Remove ${title}`}
            className="inline-flex size-8 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--border)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)] disabled:pointer-events-none disabled:opacity-40"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        {/* hidden file input wired to open() */}
        <input {...getInputProps({ 'aria-label': `Replace ${title}` })} />
      </div>
    )
  }

  /* ── Drop zone (no file yet) ── */
  return (
    <div
      {...getRootProps({
        className: `mt-2 rounded-md border border-dashed transition-colors ${isDragActive ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_6%,transparent)]' : 'border-[var(--border)]'} bg-[var(--subtle)]`,
      })}
    >
      <input {...getInputProps({ 'aria-label': title })} />
      {/* Body */}
      <div className="flex flex-col items-center gap-1.5 px-4 py-4 text-center">
        {isDragActive ? (
          <p className="text-xs font-medium text-[var(--primary)]">Drop the image here</p>
        ) : (
          <p className="text-xs text-[var(--text-muted)] sm:block hidden">
            Drop an image here or select a file
          </p>
        )}
        <p className="text-[11px] text-[var(--text-muted)]">JPEG, PNG, GIF · Max 5 MB</p>
      </div>
      {/* Action buttons */}
      <div className="flex gap-2 border-t border-[var(--border)] px-3 py-2.5">
        {mobile ? (
          <>
            {/* Mobile: camera shortcut */}
            <label className="flex min-h-[40px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-[var(--field-border)] bg-[var(--card)] text-xs font-semibold text-[var(--text-sub)] hover:bg-[var(--subtle)] focus-within:outline focus-within:outline-2 focus-within:outline-[var(--primary)]">
              Take photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) {
                    if (f.size > MAX_SIZE) { onReject('Image is larger than 5 MB.'); return }
                    if (!f.type.startsWith('image/')) { onReject('Please upload a valid image.'); return }
                    onFile(f)
                  }
                }}
              />
            </label>
            <button
              type="button"
              onClick={open}
              className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-md border border-[var(--field-border)] bg-[var(--card)] text-xs font-semibold text-[var(--text-sub)] hover:bg-[var(--subtle)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
            >
              Upload file
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={open}
            className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-md border border-[var(--field-border)] bg-[var(--card)] text-xs font-semibold text-[var(--text-sub)] hover:bg-[var(--subtle)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
          >
            Select a file
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Main export ── */
export function IdUpload({ label, required = true, backRequired = false, initialFront = null, initialBack = null, onChange, onOcrResult, onScanningChange }: IdUploadProps) {
  const [front, setFront] = useState<File | null>(initialFront)
  const [back, setBack] = useState<File | null>(initialBack)
  const [backOpen, setBackOpen] = useState(!!initialBack)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<OcrStatus>('idle')
  const [failureReason, setFailureReason] = useState<OcrFailureReason | null>(null)
  const [extractedResult, setExtractedResult] = useState<IdOcrResult | null>(null)
  const runId = useRef(0)
  // Tracks whether a scan is currently in-flight; used to block concurrent requests.
  const scanningRef = useRef(false)

  const setScanning = (value: boolean) => {
    scanningRef.current = value
    onScanningChange?.(value)
  }

  const runOcr = useCallback(
    async (file: File) => {
      // Block duplicate submissions while a scan is already in-flight
      if (scanningRef.current) return

      const id = ++runId.current
      setScanning(true)
      setStatus('scanning')
      setFailureReason(null)
      setExtractedResult(null)

      try {
        const result = await scanWithPaddle(file)
        if (id !== runId.current) return

        // Detect partial extraction: all key personal fields missing
        const missing = FIELD_LABELS.filter(
          ({ key }) => !result[key] || String(result[key]).trim() === ''
        )
        const extracted = FIELD_LABELS.filter(
          ({ key }) => result[key] && String(result[key]).trim() !== ''
        )

        if (extracted.length === 0) {
          // OCR ran but found nothing useful
          setStatus('error')
          setFailureReason('unreadable')
          setScanning(false)
          return
        }

        if (missing.length > 0) {
          // Some fields extracted, some not — partial
          setStatus('partial')
          setFailureReason('partial')
        } else {
          setStatus('done')
          setFailureReason(null)
        }

        setExtractedResult(result)
        onOcrResult(result)
      } catch (err) {
        console.error('[IdUpload] OCR failed:', err)
        if (id === runId.current) {
          setStatus('error')
          setFailureReason('service')
        }
      } finally {
        // Only clear the lock for the current run
        if (id === runId.current) setScanning(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onOcrResult, onScanningChange]
  )

  const setFrontFile = (file: File | null) => {
    setFront(file)
    setError(null)
    setStatus('idle')
    setFailureReason(null)
    setExtractedResult(null)
    runId.current++
    onChange(file, back)
    if (file) void runOcr(file)
  }

  const setBackFile = (file: File | null) => {
    setBack(file)
    setError(null)
    onChange(front, file)
    if (!file) setBackOpen(false)
  }

  // Derived: which fields were/weren't extracted in the last scan result
  const extractedFields = extractedResult
    ? FIELD_LABELS.filter(({ key }) => extractedResult[key] && String(extractedResult[key]).trim() !== '')
    : []
  const missingFields = extractedResult
    ? FIELD_LABELS.filter(({ key }) => !extractedResult[key] || String(extractedResult[key]).trim() === '')
    : []

  return (
    <section aria-label={label} className="space-y-3">
      {/* Title row */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">
          Upload valid ID{' '}
          {required ? (
            <span className="text-red-600" aria-hidden>*</span>
          ) : (
            <span className="text-xs font-normal text-[var(--text-muted)]">(optional)</span>
          )}
        </p>
      </div>

      {/* Front slot */}
      <div>
        <p className="text-xs font-medium text-[var(--text-sub)]">
          Front{' '}
          {required ? (
            <span className="text-red-600" aria-hidden>*</span>
          ) : (
            <span className="text-[var(--text-muted)]">(optional)</span>
          )}
        </p>
        <Slot
          side="front"
          file={front}
          scanning={status === 'scanning'}
          onFile={setFrontFile}
          onReject={setError}
          ocrStatus={status}
          onRescan={front ? () => runOcr(front) : undefined}
        />

        {/* OCR status banner */}
        <div aria-live="polite" className="mt-1.5 min-h-[18px]">
          {status === 'scanning' && (
            <p className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <Loader2 className="size-3.5 animate-spin" aria-hidden /> Scanning ID…
            </p>
          )}

          {status === 'done' && (
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--primary)]">
                <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
                Fields pre-filled — please review before continuing.
              </p>
              {extractedFields.length > 0 && (
                <p className="text-xs text-[var(--text-muted)]">
                  Extracted:{' '}
                  <span className="font-medium text-[var(--text-sub)]">
                    {extractedFields.map((f) => f.label).join(', ')}
                  </span>
                </p>
              )}
            </div>
          )}

          {status === 'partial' && failureReason === 'partial' && (
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                <AlertCircle className="size-3.5 shrink-0" aria-hidden />
                {OCR_ERROR_MESSAGES['partial']}
              </p>
              {extractedFields.length > 0 && (
                <p className="text-xs text-[var(--text-muted)]">
                  Extracted:{' '}
                  <span className="font-medium text-[var(--text-sub)]">
                    {extractedFields.map((f) => f.label).join(', ')}
                  </span>
                </p>
              )}
              {missingFields.length > 0 && (
                <p className="text-xs text-[var(--text-muted)]">
                  Not found:{' '}
                  <span className="font-medium text-red-700 dark:text-red-400">
                    {missingFields.map((f) => f.label).join(', ')}
                  </span>
                </p>
              )}
            </div>
          )}

          {status === 'error' && failureReason && (
            <div className="space-y-1.5">
              <p className="flex items-center gap-1.5 text-xs font-medium text-red-700 dark:text-red-300">
                <AlertCircle className="size-3.5 shrink-0" aria-hidden />
                {OCR_ERROR_MESSAGES[failureReason]}
              </p>
              {/* Offer retry (only makes sense for unreadable/service failures) */}
              {(failureReason === 'unreadable' || failureReason === 'service') && front && (
                <p className="text-xs text-[var(--text-muted)]">
                  You can{' '}
                  <button
                    type="button"
                    onClick={() => runOcr(front)}
                    className="font-semibold text-[var(--primary)] underline underline-offset-2 hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
                  >
                    try scanning again
                  </button>
                  {' '}or fill in your details manually below.
                </p>
              )}
              {failureReason !== 'unreadable' && failureReason !== 'service' && (
                <p className="text-xs text-[var(--text-muted)]">Fill in your details manually below.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Back slot — collapsed behind a toggle */}
      {!backOpen && !back ? (
        <button
          type="button"
          onClick={() => setBackOpen(true)}
          className="flex min-h-[36px] items-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)] dark:text-[var(--color-brand-sage)]"
        >
          <Plus className="size-3.5" aria-hidden />
          Add back of ID{backRequired ? '' : ' (optional)'}
        </button>
      ) : (
        <div>
          <p className="text-xs font-medium text-[var(--text-sub)]">
            Back{' '}
            {backRequired ? (
              <span className="text-red-600" aria-hidden>*</span>
            ) : (
              <span className="text-[var(--text-muted)]">(optional)</span>
            )}
          </p>
          <Slot
            side="back"
            file={back}
            onFile={setBackFile}
            onReject={setError}
          />
        </div>
      )}

      {/* Upload error */}
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="size-3.5" aria-hidden /> {error}
        </p>
      )}
    </section>
  )
}
