import type { Metadata } from 'next'
import { ReferralsClient } from './referrals-client'

export const metadata: Metadata = {
  title: 'Referral Links — One Insurance Agent Portal',
}

export default function ReferralsPage() {
  return <ReferralsClient />
}
