import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--canvas)] p-6 text-center">
      <div className="portal-page-card flex max-w-md flex-col items-center gap-4 py-12">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dc2626]/10 text-[#dc2626]">
          <AlertCircle className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-main)]">404 - Page Not Found</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            The page you are looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="btn-primary mt-2 inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
