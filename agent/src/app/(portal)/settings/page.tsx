import type { Metadata } from 'next'
import { SettingsClient } from './settings-client'

export const metadata: Metadata = {
  title: 'User Settings — One Insurance Agent Portal',
}

export default function SettingsPage() {
  return <SettingsClient />
}
