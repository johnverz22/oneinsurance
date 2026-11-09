import type { Metadata } from 'next'
import { DashboardClient } from './dashboard-client'

export const metadata: Metadata = {
  title: 'Dashboard — One Insurance Admin Portal',
}

export default function DashboardPage() {
  return <DashboardClient />
}
