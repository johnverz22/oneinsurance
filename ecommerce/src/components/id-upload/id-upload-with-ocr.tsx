'use client'

/**
 * IdUploadWithOcr
 *
 * This is the ONLY file in the project that imports paddle-ocr (and therefore
 * transitively imports @paddleocr/paddleocr-js and opencv-js).
 *
 * It must ONLY ever be loaded via next/dynamic with { ssr: false } so that
 * Turbopack never bundles it into the SSR or initial client chunk:
 *
 *   const IdUploadWithOcr = dynamic(
 *     () => import('@/components/id-upload/id-upload-with-ocr'),
 *     { ssr: false }
 *   )
 *
 * Do NOT add a static import of this file anywhere.
 */

import { useCallback, useRef } from 'react'
import { IdUploadComponent, type IdUploadComponentProps } from './id-upload-component'
import type { IdOcrResult } from '@/utils/paddle-ocr-types'

// Re-export so callers can import the props type from here if needed
export type { IdUploadComponentProps }

type Props = Omit<IdUploadComponentProps, 'scanFile'> & {
  onOcrResult?: (result: IdOcrResult) => void
}

export default function IdUploadWithOcr(props: Props) {
  // Lazily load the paddle-ocr module the first time a scan is requested.
  // The ref holds the resolved runPaddleOCR function so we don't re-import.
  const runnerRef = useRef<((file: File) => Promise<IdOcrResult>) | null>(null)

  const scanFile = useCallback(async (file: File): Promise<IdOcrResult> => {
    if (!runnerRef.current) {
      const mod = await import('@/utils/paddle-ocr')
      runnerRef.current = mod.runPaddleOCR
    }
    return runnerRef.current(file)
  }, [])

  return (
    <IdUploadComponent
      {...props}
      scanFile={scanFile}
    />
  )
}
