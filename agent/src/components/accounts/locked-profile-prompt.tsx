'use client'

import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '../ui/button'

export const LockedProfilePrompt = () => {
  const router = useRouter()

  return (
    <div className="relative mx-auto h-full w-full max-w-7xl overflow-hidden">
      <div
        className="pointer-events-none space-y-6 opacity-60 select-none"
        aria-hidden="true"
      >
        <div className="border-muted-foreground/10 flex h-40 items-center gap-4 rounded-lg border bg-white p-4 shadow-xs">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="border-muted-foreground/10 rounded-lg border bg-white p-4 shadow-xs"
            >
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-2 h-5 w-16" />
            </div>
          ))}
        </div>

        <div className="no-visible-scrollbar bg-muted-foreground/10 relative flex h-full w-full items-center gap-4 overflow-x-auto rounded-full px-4 py-2.5 lg:w-max">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>

        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-md" />
          ))}
        </div>
      </div>

      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 flex h-full items-center justify-center gap-4 px-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-xl"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              Profile Locked
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Your account is currently locked and waiting for admin activation.
              Please wait for the confirmation email once your profile is
              approved.
            </p>

            <Button
              onClick={() => router.replace('/profile')}
              className="from-primary to-lilac my-2.5 w-full rounded-full bg-gradient-to-r text-white"
            >
              Finish profile setup
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
