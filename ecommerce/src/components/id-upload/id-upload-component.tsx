'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, X, FileImage, Loader2, ScanText, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { IdOcrResult } from '@/utils/paddle-ocr-types'

export interface IdUploadComponentProps {
  onIdUploaded?: (frontFile: File | null, backFile: File | null) => void
  /**
   * Called once OCR finishes. Provided externally so this component has zero
   * dependency on paddle-ocr / opencv-js (which can't be bundled server-side).
   * When omitted, the scan button is hidden.
   */
  onOcrResult?: (result: IdOcrResult) => void
  /**
   * The actual OCR runner — injected by the parent so this component never
   * imports paddle-ocr. Signature matches runPaddleOCR from '@/utils/paddle-ocr'.
   */
  scanFile?: (file: File) => Promise<IdOcrResult>
  initialFrontFile?: File | null
  initialBackFile?: File | null
}

type OcrStatus = 'idle' | 'scanning' | 'done' | 'error'

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function IdUploadComponent({
  onIdUploaded,
  onOcrResult,
  scanFile,
  initialFrontFile,
  initialBackFile,
}: IdUploadComponentProps) {
  const [frontFile, setFrontFile] = useState<File | null>(() => initialFrontFile ?? null)
  const [backFile, setBackFile] = useState<File | null>(() => initialBackFile ?? null)
  const [frontPreviewUrl, setFrontPreviewUrl] = useState<string | null>(null)
  const [backPreviewUrl, setBackPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ocrStatus, setOcrStatus] = useState<OcrStatus>('idle')
  const [ocrError, setOcrError] = useState<string | null>(null)

  const ownedUrlsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (initialFrontFile) fileToDataUrl(initialFrontFile).then(setFrontPreviewUrl)
    if (initialBackFile) fileToDataUrl(initialBackFile).then(setBackPreviewUrl)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const owned = ownedUrlsRef.current
    return () => { owned.forEach((url) => URL.revokeObjectURL(url)) }
  }, [])

  const runOcr = useCallback(async (file: File) => {
    if (!scanFile || !onOcrResult) return
    setOcrStatus('scanning')
    setOcrError(null)
    try {
      const result = await scanFile(file)
      setOcrStatus('done')
      onOcrResult(result)
    } catch (err) {
      console.error('[IdUpload] OCR failed:', err)
      setOcrStatus('error')
      setOcrError('OCR scan failed — please fill in the details manually.')
    }
  }, [scanFile, onOcrResult])

  const onDropFront = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    if (frontPreviewUrl && ownedUrlsRef.current.has(frontPreviewUrl)) {
      URL.revokeObjectURL(frontPreviewUrl)
      ownedUrlsRef.current.delete(frontPreviewUrl)
    }
    const url = URL.createObjectURL(file)
    ownedUrlsRef.current.add(url)
    setFrontFile(file)
    setFrontPreviewUrl(url)
    setError(null)
    setOcrStatus('idle')
    setOcrError(null)
    onIdUploaded?.(file, backFile)
    if (scanFile) runOcr(file)
  }, [backFile, frontPreviewUrl, onIdUploaded, runOcr, scanFile])

  const onDropBack = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    if (backPreviewUrl && ownedUrlsRef.current.has(backPreviewUrl)) {
      URL.revokeObjectURL(backPreviewUrl)
      ownedUrlsRef.current.delete(backPreviewUrl)
    }
    const url = URL.createObjectURL(file)
    ownedUrlsRef.current.add(url)
    setBackFile(file)
    setBackPreviewUrl(url)
    setError(null)
    onIdUploaded?.(frontFile, file)
  }, [frontFile, backPreviewUrl, onIdUploaded])

  const { getRootProps: getFrontRootProps, getInputProps: getFrontInputProps, isDragActive: isFrontDragActive } = useDropzone({
    onDrop: onDropFront,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp'] },
    maxFiles: 1,
    onDropRejected: () => setError('Please upload a valid image file (JPEG, PNG, GIF, BMP, WebP)'),
  })

  const { getRootProps: getBackRootProps, getInputProps: getBackInputProps, isDragActive: isBackDragActive } = useDropzone({
    onDrop: onDropBack,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp'] },
    maxFiles: 1,
    onDropRejected: () => setError('Please upload a valid image file (JPEG, PNG, GIF, BMP, WebP)'),
  })

  const removeFrontFile = () => {
    if (frontPreviewUrl && ownedUrlsRef.current.has(frontPreviewUrl)) {
      URL.revokeObjectURL(frontPreviewUrl)
      ownedUrlsRef.current.delete(frontPreviewUrl)
    }
    setFrontFile(null)
    setFrontPreviewUrl(null)
    setError(null)
    setOcrStatus('idle')
    setOcrError(null)
    onIdUploaded?.(null, backFile)
  }

  const removeBackFile = () => {
    if (backPreviewUrl && ownedUrlsRef.current.has(backPreviewUrl)) {
      URL.revokeObjectURL(backPreviewUrl)
      ownedUrlsRef.current.delete(backPreviewUrl)
    }
    setBackFile(null)
    setBackPreviewUrl(null)
    setError(null)
    onIdUploaded?.(frontFile, null)
  }

  return (
    <Card className="w-full shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileImage className="h-5 w-5" />
          Upload Valid ID <span className="text-destructive">*</span>
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Upload clear photos of both the front and back of your valid ID.
          Your ID is scanned locally on your device — nothing is sent to any server.
        </p>
      </CardHeader>
      <CardContent className="relative space-y-6 overflow-visible">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Front ID Upload */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-primary">
              Front of ID <span className="text-destructive">*</span>
            </h3>
            {!frontFile ? (
              <div
                {...getFrontRootProps()}
                className={cn(
                  'cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all duration-200',
                  isFrontDragActive
                    ? 'border-primary bg-primary/5 scale-[1.02]'
                    : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
                )}
              >
                <input {...getFrontInputProps()} />
                <Upload className={cn('mx-auto mb-3 h-10 w-10 transition-colors', isFrontDragActive ? 'text-primary' : 'text-muted-foreground')} />
                {isFrontDragActive ? (
                  <p className="text-primary text-base font-semibold">Drop front ID here...</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-base font-semibold">Drag & drop front ID here, or click to select</p>
                    <p className="text-muted-foreground text-xs">Supports: JPEG, PNG, GIF, BMP, WebP</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative w-full overflow-hidden rounded-lg border bg-muted/50" style={{ height: '160px', maxHeight: '160px' }}>
                  {frontPreviewUrl ? (
                    <img src={frontPreviewUrl} alt="Front ID Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  <Button variant="destructive" size="sm" className="absolute top-2 right-2 z-10" onClick={removeFrontFile}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* OCR status — only shown when a scanFile runner was provided */}
                {scanFile && (
                  <>
                    {ocrStatus === 'scanning' && (
                      <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                        <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                        <span>Scanning ID on-device…</span>
                      </div>
                    )}
                    {ocrStatus === 'done' && (
                      <div className="flex items-center gap-2 rounded-md border border-success/50 bg-success/10 px-3 py-2 text-sm text-success">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                        <span>ID scanned — fields auto-filled below. Please review.</span>
                      </div>
                    )}
                    {ocrStatus === 'error' && ocrError && (
                      <div className="flex items-center gap-2 rounded-md border border-warning/50 bg-warning/10 px-3 py-2 text-sm text-warning">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{ocrError}</span>
                      </div>
                    )}
                    {ocrStatus !== 'scanning' && frontFile && (
                      <Button type="button" variant="outline" size="sm" className="w-full gap-2 text-xs"
                        onClick={() => runOcr(frontFile)}>
                        <ScanText className="h-3.5 w-3.5" />
                        {ocrStatus === 'done' ? 'Re-scan ID' : 'Scan ID'}
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Back ID Upload */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-primary">
              Back of ID{' '}
              <span className="text-primary text-xs font-normal">(Optional)</span>
            </h3>
            {!backFile ? (
              <div
                {...getBackRootProps()}
                className={cn(
                  'cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all duration-200',
                  isBackDragActive
                    ? 'border-primary bg-primary/5 scale-[1.02]'
                    : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
                )}
              >
                <input {...getBackInputProps()} />
                <Upload className={cn('mx-auto mb-3 h-10 w-10 transition-colors', isBackDragActive ? 'text-primary' : 'text-muted-foreground')} />
                {isBackDragActive ? (
                  <p className="text-primary text-base font-semibold">Drop back ID here...</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-base font-semibold">Drag & drop back ID here, or click to select</p>
                    <p className="text-muted-foreground text-xs">Supports: JPEG, PNG, GIF, BMP, WebP</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative w-full overflow-hidden rounded-lg border bg-muted/50" style={{ height: '160px', maxHeight: '160px' }}>
                  {backPreviewUrl ? (
                    <img src={backPreviewUrl} alt="Back ID Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  <Button variant="destructive" size="sm" className="absolute top-2 right-2 z-10" onClick={removeBackFile}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
        )}
      </CardContent>
    </Card>
  )
}
