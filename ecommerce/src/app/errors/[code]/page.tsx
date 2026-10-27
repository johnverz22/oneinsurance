import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ErrorPage } from '@/components/error-page'
import { ERROR_PAGE_CODES, ERROR_PAGES } from '@/lib/error-pages'

export const dynamicParams = false

export function generateStaticParams() {
  return ERROR_PAGE_CODES.map((code) => ({ code: String(code) }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>
}): Promise<Metadata> {
  const { code } = await params
  const copy = ERROR_PAGES[Number(code)]
  if (!copy) return {}
  return { title: `One Insurance — ${copy.code} · ${copy.label}` }
}

export default async function ErrorPreviewPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const copy = ERROR_PAGES[Number(code)]
  if (!copy) notFound()
  return <ErrorPage code={copy.code} />
}
