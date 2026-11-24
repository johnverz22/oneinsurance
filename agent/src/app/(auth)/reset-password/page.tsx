import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ResetPasswordForm } from './reset-password-form'

export const metadata: Metadata = {
  title: 'Reset password · UnoSure',
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[300px] items-center justify-center">
          <p className="text-sm text-[var(--text-sub)]">Loading…</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
