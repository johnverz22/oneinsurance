import type { Metadata } from 'next'
import { TransactionsClient } from '@/components/transactions/transactions-client'

export const metadata: Metadata = {
  title: 'Transactions — One Insurance Admin Portal',
}

export default function TransactionsPage() {
  return <TransactionsClient />
}
