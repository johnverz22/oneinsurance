'use client'

import { useEffect } from 'react'

import { ErrorPage } from '@/components/error-page'

export default function Error({ error }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return <ErrorPage code={500} />
}
