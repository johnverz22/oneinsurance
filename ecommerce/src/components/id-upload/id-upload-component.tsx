'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, X, FileImage, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IdUploadComponentProps {
  onDataExtracted: (data: any) => void
  onProcessingStart?: () => void
  onIdUploaded?: (frontFile: File | null, backFile: File | null) => void
  initialFrontFile?: File | null
  initialBackFile?: File | null
}

// Convert a File to a stable base64 data URL that never gets revoked
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function IdUploadComponent({
  onDataExtracted,
  onProcessingStart,
  onIdUploaded,
  initialFrontFile,
  initialBackFile,
}: IdUploadComponentProps) {
  const [frontFile, setFrontFile] = useState<File | null>(() => initialFrontFile ?? null)
  const [backFile, setBackFile] = useState<File | null>(() => initialBackFile ?? null)
  // Preview URLs — object URLs for newly dropped files, data URLs for initial files
  const [frontPreviewUrl, setFrontPreviewUrl] = useState<string | null>(null)
  const [backPreviewUrl, setBackPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Track object URLs created by new drops in this mount so we can revoke them on unmount
  const ownedUrlsRef = useRef<Set<string>>(new Set())

  // On mount, convert initial files to data URLs (stable, never revoked)
  useEffect(() => {
    if (initialFrontFile) {
      fileToDataUrl(initialFrontFile).then(setFrontPreviewUrl)
    }
    if (initialBackFile) {
      fileToDataUrl(initialBackFile).then(setBackPreviewUrl)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup only the object URLs we created via drops in this mount
  useEffect(() => {
    const owned = ownedUrlsRef.current
    return () => {
      owned.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  const onDropFront = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      // Revoke previous owned front URL if any
      if (frontPreviewUrl && ownedUrlsRef.current.has(frontPreviewUrl)) {
        URL.revokeObjectURL(frontPreviewUrl)
        ownedUrlsRef.current.delete(frontPreviewUrl)
      }
      const url = URL.createObjectURL(file)
      ownedUrlsRef.current.add(url)
      setFrontFile(file)
      setFrontPreviewUrl(url)
      setError(null)
      onIdUploaded?.(file, backFile)
    }
  }, [backFile, frontPreviewUrl, onIdUploaded])

  const onDropBack = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
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
    }
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
    if (isProcessing) return
    if (frontPreviewUrl && ownedUrlsRef.current.has(frontPreviewUrl)) {
      URL.revokeObjectURL(frontPreviewUrl)
      ownedUrlsRef.current.delete(frontPreviewUrl)
    }
    setFrontFile(null)
    setFrontPreviewUrl(null)
    setError(null)
    onIdUploaded?.(null, backFile)
  }

  const removeBackFile = () => {
    if (isProcessing) return
    if (backPreviewUrl && ownedUrlsRef.current.has(backPreviewUrl)) {
      URL.revokeObjectURL(backPreviewUrl)
      ownedUrlsRef.current.delete(backPreviewUrl)
    }
    setBackFile(null)
    setBackPreviewUrl(null)
    setError(null)
    onIdUploaded?.(frontFile, null)
  }

  const processImage = async () => {
    if (!frontFile) {
      setError('Please upload front ID first')
      return
    }
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64 = reader.result?.toString().split(',')[1]
      if (!base64) return
      setIsProcessing(true)
      try {
        const res = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 }),
        })
        const data = await res.json()
        onDataExtracted(data)
      } catch {
        setError('Failed to process image. Please try again.')
      } finally {
        setIsProcessing(false)
      }
    }
    reader.readAsDataURL(frontFile)
  }

  return (
    <Card className="w-full shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileImage className="h-5 w-5" />
          Upload Valid ID <span className="text-red-500">*</span>
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Upload clear photos of both the front and back of your valid ID.
          <br />
          Please double-check the extracted information for accuracy.
          <br />
          Your ID will not be stored or shared and is used solely for data extraction.
        </p>
      </CardHeader>
      <CardContent className="relative space-y-6 overflow-visible">
        {/* Front ID Upload */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-primary">Front of ID <span className="text-red-500">*</span></h3>
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
              <div className="relative w-full overflow-hidden rounded-lg border bg-gray-50" style={{ height: '160px', maxHeight: '160px' }}>
                {frontPreviewUrl ? (
                  <img
                    src={frontPreviewUrl}
                    alt="Front ID Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                <Button variant="destructive" size="sm" className="absolute top-2 right-2 z-10" onClick={removeFrontFile} disabled={isProcessing}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">{frontFile.name}</p>
                  <p className="text-muted-foreground text-xs">{(frontFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Back ID Upload */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-primary">Back of ID <span className="text-primary text-xs font-normal">(Optional)</span></h3>
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
              <div className="relative w-full overflow-hidden rounded-lg border bg-gray-50" style={{ height: '160px', maxHeight: '160px' }}>
                {backPreviewUrl ? (
                  <img
                    src={backPreviewUrl}
                    alt="Back ID Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                <Button variant="destructive" size="sm" className="absolute top-2 right-2 z-10" onClick={removeBackFile} disabled={isProcessing}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">{backFile.name}</p>
                  <p className="text-muted-foreground text-xs">{(backFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Extract Button */}
        {frontFile && (
          <Button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); processImage() }}
            disabled={isProcessing}
            className="from-primary to-accent relative flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r font-semibold text-white hover:from-primary/90 hover:to-accent/90 dark:text-white"
            type="button"
            size="lg"
          >
            {isProcessing ? (<><Loader2 className="h-4 w-4 animate-spin" />Processing...</>) : 'Extract Information from Front ID'}
          </Button>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>
        )}

        {isProcessing && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-600">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="font-medium">Processing your ID...</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
