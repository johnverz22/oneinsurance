import type { Metadata } from 'next'

import { ErrorPage } from '@/components/error-page'

export const metadata: Metadata = {
  title: 'One Insurance — 401 · Authentication required',
}

export default function Unauthorized() {
  return <ErrorPage code={401} />
}
