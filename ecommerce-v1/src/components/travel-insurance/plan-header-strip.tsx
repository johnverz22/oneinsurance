'use client'

import Image from 'next/image'
import { CARRIER_BRAND_COLORS } from '@/constants/companies'

interface PlanHeaderStripProps {
  provider: { carrierCode: string; companyName: string; image?: string }
  planName?: string
  premium?: number | string
}

export function PlanHeaderStrip({ provider, planName, premium }: PlanHeaderStripProps) {
  const logo = (CARRIER_BRAND_COLORS[provider.carrierCode] as any)?.planCardLogo || provider.image
  const price =
    typeof premium === 'number'
      ? `₱${premium.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
      : premium

  return (
    <div className="border-border grid overflow-hidden rounded-2xl border sm:grid-cols-[220px_1fr] sm:rounded-[28px]">
      {/* Logo panel */}
      <div className="bg-card border-border flex items-center justify-start border-b p-5 sm:justify-center sm:border-r sm:border-b-0 sm:p-7">
        {logo && (
          <Image
            src={logo}
            alt={provider.companyName}
            width={160}
            height={56}
            className="h-10 w-auto max-w-full object-contain sm:h-14"
          />
        )}
      </div>

      {/* Details panel */}
      <div className="bg-muted/40 flex min-w-0 flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-7">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-medium">{provider.companyName}</p>
          <h3 className="text-foreground text-base font-bold text-wrap sm:text-lg">
            {planName}
          </h3>
        </div>
        {price && (
          <div className="shrink-0 text-left sm:text-right">
            <p className="text-muted-foreground text-xs font-medium">Premium</p>
            <p className="text-primary text-xl font-black">{price}</p>
          </div>
        )}
      </div>
    </div>
  )
}
