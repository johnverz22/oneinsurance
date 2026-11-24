import type { Metadata } from 'next'
import { SettingsClient } from './settings-client'

export const metadata: Metadata = {
  title: 'User Settings — UnoSure Agent Portal',
}

export default function SettingsPage() {
  return <SettingsClient />
}
