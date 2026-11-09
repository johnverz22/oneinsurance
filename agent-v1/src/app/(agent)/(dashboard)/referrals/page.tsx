'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useGetReferralCode } from '@/app/data/queries/referral'
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
  const { data: referralCode, isSuccess: isReferralSuccess, isLoading: isReferralLoading, error: referralError } = useGetReferralCode()
  const { data: agentLOBs, isLoading: isLOBsLoading, error: lobsError } = useGetAgentLOBs()

  console.log('Referral Debug:', {
    referralCode,
    isReferralSuccess,
    isReferralLoading,
    referralError,
    agentLOBs,
    isLOBsLoading,
    lobsError
  })

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

  const handleCopyLink = async (referral: Referral) => {
    try {
      // Check if clipboard API is available
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(referral.link)
      } else {
        // Fallback method for older browsers or non-HTTPS
        const textArea = document.createElement('textarea')
        textArea.value = referral.link
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        textArea.remove()
      }
      
      setCopiedId(referral.id)
      toast.success('Link Copied!', {
        description: `${referral.description} referral link copied to clipboard.`,
      })
      setTimeout(() => setCopiedId(''), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
      toast.error('Failed to copy link', {
        description: 'Please try copying the link manually.',
      })
    }
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
        // If sharing fails, fallback to copying
        await handleCopyLink(referral)
      }
    } else {
      // If sharing is not supported, copy to clipboard
      await handleCopyLink(referral)
    }
  }

  return (
    <div className="relative mx-auto space-y-6 overflow-hidden">
      <div>
        {(isReferralLoading || isLOBsLoading) ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-lg mb-2">Loading referral links...</p>
          </div>
        ) : (referralError || lobsError) ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-red-500 text-lg mb-2">Error loading referral data</p>
            <p className="text-muted-foreground text-sm">
              {referralError?.message || lobsError?.message || 'Please try refreshing the page'}
            </p>
          </div>
        ) : referrals.length === 0 ? (
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
              isReferralSuccess && !isLOBsLoading && !isReferralLoading ? (
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
            isLoading={isLOBsLoading || isReferralLoading}
            onRowClick={(client) => {}}
          />
        )}
      </div>
    </div>
  )
}
