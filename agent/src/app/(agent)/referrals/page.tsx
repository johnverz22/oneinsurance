'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, ExternalLink, Share2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import Image from 'next/image'
import { getReferralCode } from '@/app/data/queries/referral'

interface ReferralLink {
  id: string
  companyName: string
  image: string
  url: string
  description: string
}

export default function ReferralsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { data: referralCode, isLoading, isError } = getReferralCode()

  // Travel Insurance referral link
  const referralLinks: ReferralLink[] = referralCode
    ? [
        {
          id: 'travel-insurance',
          companyName: 'Travel Insurance',
          image: '/images/IFRC.png',
          url: `https://ifrc.intel-soln.com.ph/${referralCode}/products/travel-insurance`,
          description: 'Insurance Without Borders',
        },
      ]
    : []

  const handleCopyLink = (link: ReferralLink) => {
    navigator.clipboard.writeText(link.url)
    setCopiedId(link.id)
    toast.success('Link Copied!', {
      description: `${link.companyName} referral link copied to clipboard.`,
    })
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleShare = async (link: ReferralLink) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${link.companyName} Insurance`,
          text: `Get insurance coverage with ${link.companyName}`,
          url: link.url,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      handleCopyLink(link)
    }
  }

  return (
    <div className="relative mx-auto w-full space-y-6">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Referral Links</h1>
        <p className="text-muted-foreground mt-2">
          Share these links with your clients to earn commissions on their
          insurance purchases.
        </p>
      </header>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
        </div>
      )}

      {/* Error State */}
      {isError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-6 text-center">
            <p className="text-destructive">
              Failed to load referral code. Please try again later.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Referral Links Grid */}
      {!isLoading && !isError && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {referralLinks.map((link) => (
            <Card
              key={link.id}
              className="bg-background flex flex-col shadow-sm transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-4">
                {/* <div className="mb-4 flex h-20 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-900">
                  <Image
                    src={link.image}
                    alt={link.companyName}
                    width={120}
                    height={60}
                    className="object-contain"
                  />
                </div> */}
                <CardTitle className="text-xl">{link.companyName}</CardTitle>
                {link.description && (
                  <p className="text-muted-foreground text-sm">
                    {link.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="flex flex-grow flex-col justify-between space-y-4">
                <div className="bg-muted rounded-md p-3">
                  <p className="text-muted-foreground font-mono text-xs break-all">
                    {link.url}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleCopyLink(link)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    {copiedId === link.id ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleShare(link)}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(link.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      {!isLoading && !isError && referralLinks.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">How Referrals Work</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-2 text-sm">
            <p>
              • Each link contains your unique agent code to track referrals
            </p>
            <p>
              • Share these links via social media, email, or messaging apps
            </p>
            <p>
              • Earn commissions when clients purchase insurance through your
              links
            </p>
            <p>• Track your referral performance in the Commissions section</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
