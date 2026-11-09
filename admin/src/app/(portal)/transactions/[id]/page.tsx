import type { Metadata } from 'next'
import { TransactionDetailClient } from '@/components/transactions/transaction-detail-client'

export const metadata: Metadata = {
  title: 'Transaction — One Insurance Admin Portal',
}

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <TransactionDetailClient id={id} />
}
