'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { getReferralCode } from '@/app/data/queries/referral'
import { DataTable } from '@/components/ui/data-table'
import { Referral } from '@/types/agent/product'
import { ColumnDef } from '@tanstack/react-table'
import { ReferralCard } from '@/components/agent/referral-card'
import { Skeleton } from '@/components/ui/skeleton'
import { PRODUCTS } from '../products/products'

const REFERRALS: Referral[] = PRODUCTS.map((product, index) => ({
  ...product,
  id: product.code,
  clicks: 16 + index * 8,
  conversions: 9 + index * 5,
}))

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
