'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { AlertCircle, CheckCircle2, Loader2, Plus, ScanText, X } from 'lucide-react'
import type { IdOcrResult } from '@/utils/paddle-ocr-types'

const ACCEPT = { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp'] }
const MAX_SIZE = 5 * 1024 * 1024
const fmt = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`

type OcrStatus = 'idle' | 'scanning' | 'done' | 'error'

/** Detect if the device supports capturing from camera (mobile heuristic). */
const isMobile = () =>
  typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)

interface IdUploadProps {
  label: string
  initialFront?: File | null
  initialBack?: File | null
  onChange: (front: File | null, back: File | null) => void
  onOcrResult: (result: IdOcrResult) => void
}

async function scanWithPaddle(file: File): Promise<IdOcrResult> {
  const { runPaddleOCR } = await import('@/utils/paddle-ocr')
  return runPaddleOCR(file)
}

/* ── Single-side dropzone / thumbnail ── */
interface SlotProps {
  side: 'front' | 'back'
  file: File | null
  onFile: (f: File | null) => void
  onReject: (msg: string) => void
  /** OCR status — shown on the front slot only */
  ocrStatus?: OcrStatus
  onRescan?: () => void
}

function Slot({ side, file, onFile, onReject, ocrStatus, onRescan }: SlotProps) {
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
          {onRescan && ocrStatus !== 'scanning' && (
            <button
              type="button"
              onClick={onRescan}
              className="inline-flex min-h-[36px] items-center gap-1 rounded px-2.5 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--border)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
            >
              <ScanText className="size-3.5" aria-hidden />
              {ocrStatus === 'done' ? 'Re-scan' : 'Scan'}
            </button>
          )}
          <button
            type="button"
            onClick={open}
            className="inline-flex min-h-[36px] items-center gap-1 rounded px-2.5 text-xs font-semibold text-[var(--text-sub)] hover:bg-[var(--border)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={() => onFile(null)}
            aria-label={`Remove ${title}`}
            className="inline-flex size-8 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--border)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
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
export function IdUpload({ label, initialFront = null, initialBack = null, onChange, onOcrResult }: IdUploadProps) {
  const [front, setFront] = useState<File | null>(initialFront)
  const [back, setBack] = useState<File | null>(initialBack)
  const [backOpen, setBackOpen] = useState(!!initialBack)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<OcrStatus>('idle')
  const runId = useRef(0)

  const runOcr = useCallback(
    async (file: File) => {
      const id = ++runId.current
      setStatus('scanning')
      try {
        const result = await scanWithPaddle(file)
        if (id !== runId.current) return
        setStatus('done')
        onOcrResult(result)
      } catch (err) {
        console.error('[IdUpload] OCR failed:', err)
        if (id === runId.current) setStatus('error')
      }
    },
    [onOcrResult]
  )

  const setFrontFile = (file: File | null) => {
    setFront(file)
    setError(null)
    setStatus('idle')
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

  return (
    <section aria-label={label} className="space-y-3">
      {/* Title row */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">
          Upload valid ID <span className="text-red-600" aria-hidden>*</span>
        </p>
      </div>

      {/* Front slot */}
      <div>
        <p className="text-xs font-medium text-[var(--text-sub)]">
          Front <span className="text-red-600" aria-hidden>*</span>
        </p>
        <Slot
          side="front"
          file={front}
          onFile={setFrontFile}
          onReject={setError}
          ocrStatus={status}
          onRescan={front ? () => runOcr(front) : undefined}
        />
        {/* OCR status */}
        <div aria-live="polite" className="mt-1.5 min-h-[18px]">
          {status === 'scanning' && (
            <p className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <Loader2 className="size-3.5 animate-spin" aria-hidden /> Scanning ID…
            </p>
          )}
          {status === 'done' && (
            <p className="flex items-center gap-1.5 text-xs text-[var(--primary)]">
              <CheckCircle2 className="size-3.5" aria-hidden /> Fields pre-filled — please review.
            </p>
          )}
          {status === 'error' && (
            <p className="flex items-center gap-1.5 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="size-3.5" aria-hidden /> Scan failed — fill in manually.
            </p>
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
          Add back of ID (optional)
        </button>
      ) : (
        <div>
          <p className="text-xs font-medium text-[var(--text-sub)]">Back <span className="text-[var(--text-muted)]">(optional)</span></p>
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
