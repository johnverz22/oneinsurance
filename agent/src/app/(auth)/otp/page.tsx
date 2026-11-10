import type { Metadata } from 'next'
import { Suspense } from 'react'
import { OtpForm } from './otp-form'

export const metadata: Metadata = {
  title: 'Verify your login · One Insurance',
}

export default function OtpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[300px] items-center justify-center">
          <p className="text-sm text-[var(--text-sub)]">Loading…</p>
        </div>
      }
    >
      <OtpForm />
    </Suspense>
  )
}
