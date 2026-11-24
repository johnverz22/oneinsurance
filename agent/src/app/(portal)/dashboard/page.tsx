import type { Metadata } from 'next'
import { DashboardClient } from './dashboard-client'

export const metadata: Metadata = {
  title: 'Dashboard — UnoSure Agent Portal',
}

export default function DashboardPage() {
  return <DashboardClient />
}
