'use client'

import { useEffect } from 'react'

import { ErrorPage } from '@/components/error-page'

export default function Error({
  error,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error)
  }, [error])

  return (
    <ErrorPage
      code={500}
      heading="Something went wrong on our side."
      description="We couldn’t complete this request. Please try again later, or contact our team if you need help."
    />
  )
}
