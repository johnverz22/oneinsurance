import type { Metadata } from 'next'

import { ErrorPage } from '@/components/error-page'

export const metadata: Metadata = {
  title: 'One Insurance — 403 · Access denied',
}

export default function Forbidden() {
  return <ErrorPage code={403} />
}
