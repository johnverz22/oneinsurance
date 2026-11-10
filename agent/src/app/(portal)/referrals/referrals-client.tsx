'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, Search, Info } from 'lucide-react'
import { toast } from 'sonner'
import { STOREFRONT_BASE_URL } from '@/lib/utils'
import { useAgentUser } from '@/store/agent-auth-store'
import { useAuthFetch } from '@/hooks/use-auth-fetch'
import { PortalContentHeader } from '@/components/layout/portal-content-header'

type ReferralLink = {
  id: string
  product_name: string
  url: string
}

// ---- Skeleton ----
function Skeleton() {
  return (
    <div className="portal-page-card space-y-5">
      {/* Panel header skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="skeleton h-6 w-44 rounded" />
          <div className="skeleton h-4 w-64 rounded" />
        </div>
        <div className="skeleton h-11 w-64 rounded" />
      </div>
      {/* Card skeletons */}
      <div className="space-y-4 border-t border-[#e0e9e0] pt-6 dark:border-[#3d4140]">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-4 rounded-lg border border-[#dfe7df] p-5 dark:border-[#475049] sm:p-6">
            <div className="flex items-center gap-3">
              <div className="skeleton size-11 rounded-md" />
              <div className="space-y-2">
                <div className="skeleton h-5 w-36 rounded" />
                <div className="skeleton h-4 w-28 rounded" />
              </div>
            </div>
            <div className="skeleton h-11 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- Product referral card ----
function ReferralCard({
  link,
  copied,
  onCopy,
  onOpen,
  onShare,
}: {
  link: ReferralLink
  copied: boolean
  onCopy: () => void
  onOpen: () => void
  onShare: () => void
}) {
  return (
    <article className="rounded-lg border border-[#dfe7df] bg-white p-5 dark:border-[#475049] dark:bg-transparent sm:p-6">
      {/* Header: icon + product name */}
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-[#e6f2e8] text-[#006838] dark:bg-[#3d5242] dark:text-[#d0e3c8]">
          <ArrowUpRight className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-main)]">{link.product_name}</h3>
          <p className="text-base text-[var(--text-sub)]">Sample product link</p>
        </div>
      </div>

      {/* Referral link control */}
      <label htmlFor={`referral-link-${link.id}`} className="mt-6 block text-sm font-medium text-[var(--text-main)]">
        Referral link
      </label>
      <div className="mt-2 grid min-w-0 overflow-hidden rounded-md border border-[#c7d4c9] bg-white focus-within:border-[#006838] focus-within:outline-2 focus-within:outline-[#006838] dark:border-[#565c58] dark:bg-[#282c29] dark:focus-within:border-[#006838] dark:focus-within:outline-[#006838] sm:grid-cols-[minmax(0,1fr)_auto]">
        <input
          id={`referral-link-${link.id}`}
          type="text"
          readOnly
          aria-readonly="true"
          aria-label={`Referral URL for ${link.product_name}`}
          value={link.url}
          className="min-h-11 min-w-0 w-full bg-transparent px-3 text-base text-[var(--text-main)] focus:outline-none dark:text-[var(--text-main)]"
        />
        <div className="grid grid-cols-3 gap-0.5 border-t border-[#dfe7df] p-1 dark:border-[#475049] sm:flex sm:border-t-0 sm:border-l">
          <button
            type="button"
            onClick={onCopy}
            aria-label={copied ? 'Copied!' : `Copy ${link.product_name} referral link`}
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-transparent bg-transparent px-2 text-sm font-semibold text-[#006838] hover:bg-[#f1f2f0] active:bg-[#d0e3c8] focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[var(--text-main)] dark:hover:bg-[#303232] dark:active:bg-[#3d4140] dark:focus-visible:outline-white sm:px-3"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onOpen}
            aria-label={`Open ${link.product_name} link in a new tab`}
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-transparent bg-transparent px-2 text-sm font-semibold text-[#006838] hover:bg-[#f1f2f0] active:bg-[#d0e3c8] focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[var(--text-main)] dark:hover:bg-[#303232] dark:active:bg-[#3d4140] dark:focus-visible:outline-white sm:px-3"
          >
            Open
            <span className="sr-only">in a new tab</span>
          </a>
          <button
            type="button"
            onClick={onShare}
            aria-label={`Share ${link.product_name} link`}
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-transparent bg-transparent px-2 text-sm font-semibold text-[#006838] hover:bg-[#f1f2f0] active:bg-[#d0e3c8] focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[var(--text-main)] dark:hover:bg-[#303232] dark:active:bg-[#3d4140] dark:focus-visible:outline-white sm:px-3"
          >
            Share
          </button>
        </div>
      </div>
    </article>
  )
}

/**
 * Referral links page — product-specific URLs with copy, open, share.
 * Structure matches mockup: two-column layout with product cards and sidebar info.
 * Design spec: /downloads/design/agent-referrals
 */
export function ReferralsClient() {
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const user = useAgentUser()
  const authFetch = useAuthFetch()

  // Referral code query
  const { data: referralCodeData } = useQuery({
    queryKey: ['referralCode', user?.id],
    queryFn: async () => {
      try {
        const res = await authFetch(`/api/agent/referral?id=${user?.id || ''}`)
        if (!res.ok) return null
        const json = await res.json()
        return typeof json.data === 'string' ? json.data : json.data?.referral_code || null
      } catch {
        return null
      }
    },
    enabled: !!user?.id,
  })

  // Agent LOBs query
  const { data: lobsData = [], isLoading: isLobsLoading } = useQuery({
    queryKey: ['agentLOBs'],
    queryFn: async () => {
      try {
        const res = await authFetch('/api/agent/lobs?per_page=100')
        if (!res.ok) return []
        const json = await res.json()
        return Array.isArray(json.data)
          ? json.data
          : Array.isArray(json.data?.data)
            ? json.data.data
            : []
      } catch {
        return []
      }
    },
  })

  const code = referralCodeData || user?.agent_code || 'agent'
  const ecommerceBase = STOREFRONT_BASE_URL

  // Build referral links from active LOBs or defaults
  const links: ReferralLink[] = (() => {
    if (lobsData.length > 0) {
      return lobsData
        .filter((item: any) => item.status === 'active' || item.line_of_business)
        .map((item: any) => {
          const lob = item.line_of_business || item
          const slug = lob.slug || lob.name?.toLowerCase().replace(/\s+/g, '-') || 'travel-insurance'
          const name = lob.name || 'Insurance Product'
          return {
            id: String(item.id || slug),
            product_name: name,
            url: `${ecommerceBase}/${code}/${slug}`,
          }
        })
    }

    // Default lines of business available in One Insurance
    return [
      {
        id: 'travel',
        product_name: 'Travel Insurance',
        url: `${ecommerceBase}/${code}/travel-insurance`,
      },
      {
        id: 'motor',
        product_name: 'Motor Insurance',
        url: `${ecommerceBase}/${code}/motor-insurance`,
      },
      {
        id: 'health',
        product_name: 'Health Insurance',
        url: `${ecommerceBase}/${code}/health-insurance`,
      },
    ]
  })()

  const filtered = links.filter((l) =>
    l.product_name.toLowerCase().includes(search.toLowerCase())
  )

  const handleCopy = async (link: ReferralLink) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link.url)
      } else {
        const input = document.getElementById(`referral-link-${link.id}`) as HTMLInputElement
        input?.select()
        document.execCommand('copy')
      }
      setCopiedId(link.id)
      toast.success('Link copied to clipboard')
      setTimeout(() => setCopiedId(null), 2500)
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const handleOpen = () => {
    // The anchor element already opens in a new tab via target="_blank"
  }

  const handleShare = async (link: ReferralLink) => {
    if (navigator.share) {
      try {
        await navigator.share({ title: link.product_name, url: link.url })
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          await handleCopy(link)
        }
      }
    } else {
      await handleCopy(link)
    }
  }

  return (
    <div className="space-y-6">
      <PortalContentHeader
        title="Referral links"
        description="Find and share links for your assigned products."
        actions={
          !isLobsLoading && links.length > 0 ? (
            <span className="rounded-md bg-[#e1f1e5] px-3 py-2 text-xs font-semibold text-[#006838] dark:bg-[#304535] dark:text-[#d0e3c8]">
              {links.length} product{links.length !== 1 ? 's' : ''}
            </span>
          ) : undefined
        }
      />

      {/* Two-column layout */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(290px,0.65fr)]">
        {/* Left: Product links list */}
        <section
          className="portal-page-card min-w-0 p-5 sm:p-6"
          id="referral-list"
          aria-labelledby="links-title"
        >
          {/* Panel header: title + search */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 id="links-title" className="text-xl font-semibold tracking-tight text-[var(--text-main)]">
                Your product links
              </h2>
              <p className="mt-1 text-base text-[var(--text-sub)]">
                One link is shown for each assigned line of business.
              </p>
            </div>
            <div className="w-full sm:w-64">
              <label htmlFor="referral-search" className="sr-only">
                Search by product
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]"
                  aria-hidden="true"
                />
                <input
                  id="referral-search"
                  type="search"
                  placeholder="Search by product"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="ui-form-field min-h-11 w-full rounded-md bg-white pl-9 text-base dark:bg-[#303530] dark:placeholder:text-[var(--text-muted)]"
                />
              </div>
            </div>
          </div>

          {/* Product cards */}
          <div className="mt-6 space-y-4 border-t border-[#e0e9e0] pt-6 dark:border-[#3d4140]">
            {isLobsLoading ? (
              <div aria-busy="true" aria-live="polite">
                <Skeleton />
              </div>
            ) : filtered.length === 0 ? (
              <p className="rounded-lg border border-[#dfe7df] bg-[#fbfcfa] px-5 py-10 text-center text-base text-[var(--text-sub)] dark:border-[#475049] dark:bg-[#303530]">
                {search
                  ? 'No products match your search.'
                  : 'No referral links assigned yet. Contact your administrator.'}
              </p>
            ) : (
              filtered.map((link) => (
                <ReferralCard
                  key={link.id}
                  link={link}
                  copied={copiedId === link.id}
                  onCopy={() => handleCopy(link)}
                  onOpen={handleOpen}
                  onShare={() => handleShare(link)}
                />
              ))
            )}
          </div>

          {/* Showing X of Y count */}
          {!isLobsLoading && links.length > 0 && (
            <p className="mt-6 border-t border-[#e0e9e0] pt-4 text-base text-[var(--text-muted)] dark:border-[#3d4140]">
              Showing {filtered.length} of {links.length} product{links.length !== 1 ? 's' : ''}
            </p>
          )}
        </section>

        {/* Right: Sidebar info panel */}
        <section
          className="portal-page-card min-w-0 self-start p-5 sm:p-6"
          aria-labelledby="about-links-title"
        >
          <h2 id="about-links-title" className="text-xl font-semibold tracking-tight text-[var(--text-main)]">
            Sharing your link
          </h2>
          <p className="mt-3 text-base leading-6 text-[var(--text-sub)]">
            Copy the link and send it to a customer, or open it to preview the product journey.
          </p>
          <div className="mt-6 rounded-md bg-[#eef4ee] p-4 text-base leading-6 text-[var(--text-sub)] dark:bg-[#363f38]">
            <strong className="block text-[#006838] dark:text-[#d0e3c8]">About attribution</strong>
            These links contain your agent code (
            <span className="font-mono font-semibold text-[#006838] dark:text-[#d0e3c8]">{code}</span>).
            When a customer purchases a policy through your link, the sale is attributed to you and commission
            is calculated automatically.
          </div>
          <p className="mt-5 text-base leading-6 text-[var(--text-muted)]">
            Product assignments and actual referral URLs must come from the live portal.
          </p>
        </section>
      </div>
    </div>
  )
}
