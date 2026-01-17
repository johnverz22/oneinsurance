'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { getReferralCode } from '@/app/data/queries/referral'
import { useGetAgentLOBs } from '@/app/data/queries/agent-lobs'
import { DataTable } from '@/components/ui/data-table'
import { Referral } from '@/types/agent/product'
import { ColumnDef } from '@tanstack/react-table'
import { ReferralCard } from '@/components/agent/referral-card'
import { Skeleton } from '@/components/ui/skeleton'

const REFERRAL_COLUMNS: ColumnDef<Referral>[] = [
  { accessorKey: 'id' },
  { accessorKey: 'description' },
  { accessorKey: 'status' },
  { accessorKey: 'link' },
]

export default function ReferralsPage() {
  const [copiedId, setCopiedId] = useState<string>('')
  const { data: referralCode, isSuccess: isReferralSuccess } = getReferralCode()
  const { data: agentLOBs, isLoading: isLOBsLoading } = useGetAgentLOBs()

  const referrals = useMemo(() => {
    if (!referralCode || !agentLOBs) return []

    return agentLOBs
      .filter((agentLOB) => agentLOB.status === 'active' && agentLOB.line_of_business)
      .map((agentLOB) => ({
        id: agentLOB.line_of_business!.slug,
        description: agentLOB.line_of_business!.name,
        status: (agentLOB.status === 'active' ? 'Active' : 'Inactive') as 'Active' | 'Inactive',
        link: `/${referralCode}/products/${agentLOB.line_of_business!.slug}`,
      }))
  }, [referralCode, agentLOBs])

  const handleCopyLink = (referral: Referral) => {
    navigator.clipboard.writeText(referral.link)
    setCopiedId(referral.id)
    toast.success('Link Copied!', {
      description: `${referral.description} referral link copied to clipboard.`,
    })
    setTimeout(() => setCopiedId(''), 2000)
  }

  const handleShare = async (referral: Referral) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${referral.description} Insurance`,
          text: `Get insurance coverage with ${referral.description}`,
          url: referral.link,
        })
      } catch (error) {
        // Error sharing
      }
    } else {
      handleCopyLink(referral)
    }
  }

  return (
    <div className="relative mx-auto space-y-6 overflow-hidden">
      <div className="border-muted-foreground/20 rounded-xl border px-8 py-3.5">
        {referrals.length === 0 && !isLOBsLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-lg mb-2">No referral links available</p>
            <p className="text-muted-foreground text-sm">
              You don't have any Lines of Business assigned yet. Please contact your administrator to get LOBs assigned to your account.
            </p>
          </div>
        ) : (
          <DataTable<Referral, unknown>
            header="Referral Links"
            data={referrals}
            columns={REFERRAL_COLUMNS}
            renderMode="list"
            numColumns={2}
            contentRenderer={(row) =>
              isReferralSuccess && !isLOBsLoading ? (
                <ReferralCard
                  referral={row.original}
                  isCopied={copiedId === row.original.id}
                  onCopyLink={handleCopyLink}
                />
              ) : (
                <Skeleton className="h-full min-h-40 w-full" />
              )
            }
            searchKey="description"
            searchPlaceholder="Product"
            actions={[]}
            isLoading={isLOBsLoading}
            onRowClick={(client) => {}}
          />
        )}
      </div>
    </div>
  )
}
