import type { Metadata } from 'next'
import { SettingsClient } from '@/components/settings/settings-client'

export const metadata: Metadata = {
  title: 'User settings — One Insurance Admin Portal',
}

export default function SettingsPage() {
  return <SettingsClient />
}
