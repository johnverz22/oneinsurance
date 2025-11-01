'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, X, FileImage, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface IdUploadComponentProps {
  onDataExtracted: (data: any) => void
  onProcessingStart?: () => void
}

export function IdUploadComponent({
  onDataExtracted,
  onProcessingStart,
}: IdUploadComponentProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setUploadedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setError(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp'],
    },
    maxFiles: 1,
    onDropRejected: () => {
      setError('Please upload a valid image file (JPEG, PNG, GIF, BMP, WebP)')
    },
  })

  const removeFile = () => {
    // Prevent file removal while processing
    if (isProcessing) {
      console.log('Cannot remove file while processing')
      return
    }

    setUploadedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setError(null)
  }

  const processImage = async () => {
    console.log('processImage clicked', { uploadedFile, isProcessing })
    if (!uploadedFile) {
      setError('No file uploaded')
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
      } catch (err) {
        setError('Failed to process image. Please try again.')
      } finally {
        setIsProcessing(false)
      }
    }
    reader.readAsDataURL(uploadedFile)
  }

  return (
    <Card className="w-full shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileImage className="h-5 w-5" />
          Upload ID Card
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Upload a clear photo of your ID to automatically fill the form below.
          <br />
          Please double-check the extracted information for accuracy.
          <br />
          Your ID will not be stored or shared and is used solely for data
          extraction.
        </p>
      </CardHeader>
      <CardContent className="relative space-y-4 overflow-visible">
        {!uploadedFile ? (
          <div
            {...getRootProps()}
            className={cn(
              'cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-all duration-200',
              isDragActive
                ? 'border-primary bg-primary/5 scale-[1.02]'
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
            )}
          >
            <input {...getInputProps()} />
            <Upload
              className={cn(
                'mx-auto mb-4 h-12 w-12 transition-colors',
                isDragActive ? 'text-primary' : 'text-muted-foreground'
              )}
            />
            {isDragActive ? (
              <p className="text-primary text-lg font-semibold">
                Drop your ID here...
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-lg font-semibold">
                  Drag & drop your ID here, or click to select
                </p>
                <p className="text-muted-foreground text-sm">
                  Supports: JPEG, PNG, GIF, BMP, WebP (Max size: 10MB)
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-xs">
                  <span className="bg-primary/10 text-primary rounded-full px-2 py-1">
                    JPG
                  </span>
                  <span className="bg-primary/10 text-primary rounded-full px-2 py-1">
                    PNG
                  </span>
                  <span className="bg-primary/10 text-primary rounded-full px-2 py-1">
                    GIF
                  </span>
                  <span className="bg-primary/10 text-primary rounded-full px-2 py-1">
                    BMP
                  </span>
                  <span className="bg-primary/10 text-primary rounded-full px-2 py-1">
                    WebP
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative z-10 space-y-4">
            <div className="relative">
              <div className="relative h-48 w-full overflow-hidden rounded-lg border">
                <Image
                  src={previewUrl!}
                  alt="ID Preview"
                  fill
                  className="object-contain"
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 z-20"
                onClick={removeFile}
                disabled={isProcessing}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid items-center justify-center rounded-lg border p-4 md:grid-cols-2 md:justify-between">
              <div className="flex-1">
                <p className="font-medium">{uploadedFile.name}</p>
                <p className="text-muted-foreground text-sm">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              <Button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('Extract Information button clicked')
                  processImage()
                }}
                disabled={isProcessing}
                className="relative flex items-center gap-2 text-white"
                type="button"
                size="default"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Extract Information'
                )}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {isProcessing && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-600">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <div>
                <p className="font-medium">Processing your ID...</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
