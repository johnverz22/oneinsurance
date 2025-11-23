'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, ExternalLink, Share2, Loader2, Check } from 'lucide-react'
import { BASE_REFERRAL_URL } from '@/constants/app'
import { Referral } from '@/types/agent/product'

type ReferralCardProps = {
  referral: Referral
  isCopied: boolean
  agentCode: string
  onCopyLink: (referral: Referral) => void
}

export const ReferralCard = ({
  referral,
  isCopied,
  agentCode,
  onCopyLink,
}: ReferralCardProps) => {
  const link = `${BASE_REFERRAL_URL}/${agentCode}/${referral.link}`

  const handleCopyLink = () => {
    onCopyLink({ ...referral, link })
  }

  return (
    <Card>
      <CardContent>
        <div className="flex w-full items-start justify-between gap-3">
          <div className="space-y-1.5">
            <h3 className="text-base font-semibold md:text-lg lg:text-xl">
              {referral.description} by {referral.provider}
            </h3>
            <p className="text-sm font-medium">
              Commission Rate:{' '}
              <span className="font-light">{referral.commissionRate}%</span>
            </p>
          </div>
          <div className="text-muted-foreground space-y-0.5 text-right text-sm">
            <p className="font-normal">Clicks: {referral.clicks}</p>
            <p className="font-normal">Conversions: {referral.conversions}</p>
          </div>
        </div>

        <div className="mt-6 flex items-end gap-3">
          <div className="w-full space-y-1.5">
            <p className="text-sm font-medium">Referral Link:</p>
            <Input value={link} readOnly />
          </div>
          <Button
            className="h-11 w-max min-w-24 bg-blue-600 px-6 text-white hover:bg-blue-700"
            onClick={() => handleCopyLink()}
          >
            {isCopied ? <Check /> : 'Copy'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
