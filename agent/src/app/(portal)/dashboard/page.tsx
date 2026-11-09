import type { Metadata } from 'next'
import { DashboardClient } from './dashboard-client'

export const metadata: Metadata = {
  title: 'Dashboard — One Insurance Agent Portal',
}

export default function DashboardPage() {
  return <DashboardClient />
}
