'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--canvas)] p-6 text-center">
      <div className="portal-page-card flex max-w-md flex-col items-center gap-4 py-12">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-main)]">Something went wrong</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            An unexpected error occurred while loading this page. Please try again.
          </p>
        </div>
        <button
          type="button"
          onClick={() => reset()}
          className="btn-primary mt-2 inline-flex items-center gap-2 text-sm"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    </div>
  )
}
