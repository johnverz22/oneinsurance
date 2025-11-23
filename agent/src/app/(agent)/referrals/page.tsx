'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { getReferralCode } from '@/app/data/queries/referral'
import { DataTable } from '@/components/ui/data-table'
import { Referral } from '@/types/agent/product'
import { ColumnDef } from '@tanstack/react-table'
import { ReferralCard } from '@/components/agent/referral-card'
import { Skeleton } from '@/components/ui/skeleton'

const REFERRALS: Referral[] = [
  {
    id: 'P-001',
    description: 'Travel Insurance',
    provider: 'OONA',
    commissionRate: 30,
    status: 'Active',
    link: 'ref/P-001',
    clicks: 320,
    conversions: 24,
  },
  {
    id: 'P-002',
    description: 'Comprehensive Auto',
    provider: 'OONA',
    commissionRate: 25,
    status: 'Active',
    link: 'ref/P-002',
    clicks: 190,
    conversions: 15,
  },
  {
    id: 'P-003',
    description: 'Travel Insurance',
    provider: 'MALAYAN',
    commissionRate: 30,
    status: 'Active',
    link: 'ref/P-003',
    clicks: 450,
    conversions: 33,
  },
  {
    id: 'P-004',
    description: 'Travel Insurance',
    provider: 'MALAYAN',
    commissionRate: 25,
    status: 'Active',
    link: 'ref/P-004',
    clicks: 270,
    conversions: 18,
  },
  {
    id: 'P-005',
    description: 'Personal Accident',
    provider: 'MICO',
    commissionRate: 30,
    status: 'Active',
    link: 'ref/P-005',
    clicks: 160,
    conversions: 12,
  },
  {
    id: 'P-006',
    description: 'e-CTPL',
    provider: 'OONA',
    commissionRate: 25,
    status: 'Active',
    link: 'ref/P-006',
    clicks: 310,
    conversions: 19,
  },
]

const REFERRAL_COLUMNS: ColumnDef<Referral>[] = [
  { accessorKey: 'id' },
  { accessorKey: 'description' },
  { accessorKey: 'provider' },
  { accessorKey: 'commissionRate' },
  { accessorKey: 'status' },
  { accessorKey: 'link' },
  { accessorKey: 'clicks' },
  { accessorKey: 'conversions' },
]

export default function ReferralsPage() {
  const [copiedId, setCopiedId] = useState<string>('')
  const { data: referralCode, isSuccess, isError } = getReferralCode()

  const handleCopyLink = (referral: Referral) => {
    navigator.clipboard.writeText(referral.link)
    setCopiedId(referral.id)
    toast.success('Link Copied!', {
      description: `${referral.provider} referral link copied to clipboard.`,
    })
    setTimeout(() => setCopiedId(''), 2000)
  }

  const handleShare = async (referral: Referral) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${referral.description} Insurance`,
          text: `Get insurance coverage with ${referral.provider}`,
          url: referral.link,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      handleCopyLink(referral)
    }
  }

  return (
    <div className="relative mx-auto space-y-6 overflow-hidden">
      <div className="border-muted-foreground/20 rounded-xl border px-8 py-3.5">
        <DataTable<Referral, unknown>
          header="Referral Links"
          data={REFERRALS}
          columns={REFERRAL_COLUMNS}
          renderMode="list"
          numColumns={2}
          contentRenderer={(row) =>
            isSuccess ? (
              <ReferralCard
                referral={row.original}
                isCopied={copiedId === row.original.id}
                agentCode={referralCode ?? ''}
                onCopyLink={handleCopyLink}
              />
            ) : (
              <Skeleton className="h-full min-h-40 w-full" />
            )
          }
          searchKey="description"
          searchPlaceholder="Product"
          actions={[]}
          onRowClick={(client) => console.log('Clicked row:', client)}
        />
      </div>
    </div>
  )
}
