import type { Metadata } from 'next'
import { TransactionDetailClient } from './transaction-detail-client'

export const metadata: Metadata = {
  title: 'Transaction Detail — One Insurance Agent Portal',
}

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <TransactionDetailClient id={id} />
}
