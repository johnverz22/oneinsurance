'use client'

/**
 * OCR Calibration Page — /test/ocr-calibration
 *
 * DEV / STAGING ONLY — this page is disabled in production.
 *
 * Purpose: let a team member scan real Philippine IDs, review what PaddleOCR
 * extracted, correct any errors, and export a JSON payload to send to the
 * developer for offline regression-testing the OCR pipeline.
 *
 * OCR runs entirely on-device.  No image bytes or personal data leave the
 * browser.  Do NOT link to or deploy this route in production.
 */

import { notFound } from 'next/navigation'
import OcrCalibrationClient from './client'

export default function OcrCalibrationPage() {
  // Hard-kill in production: renders a 404 at the Next.js level so the page
  // is not even included in the build route manifest when NODE_ENV=production.
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  return <OcrCalibrationClient />
}
