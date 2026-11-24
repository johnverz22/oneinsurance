import type { Metadata } from 'next'

import { ErrorPage } from '@/components/error-page'

export const metadata: Metadata = {
  title: 'One Insurance Admin — 404 · Page not found',
}

export default function NotFound() {
  return (
    <ErrorPage
      code={404}
      heading="Looks like a wrong turn."
      description="We can’t find the page you’re looking for. It may have moved, or the link may be out of date."
    />
  )
}
