'use client'

import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight } from 'lucide-react'
import { STOREFRONT_BASE_URL } from '@/lib/utils'
import { useAgentUser } from '@/store/agent-auth-store'
import { useAuthFetch } from '@/hooks/use-auth-fetch'
import { PortalContentHeader } from '@/components/layout/portal-content-header'
import { StatusBadge } from '@/components/ui/status-badge'

type ReferralLink = {
  id: string
  product_name: string
  url: string
}

// ---- Skeleton (exact mockup parity) ----
function Skeleton() {
  return (
    <div role="status" aria-label="Loading referral links">
      <span className="sr-only">Loading referral links</span>
      <div aria-hidden="true" className="space-y-5 motion-safe:animate-pulse">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(290px,0.65fr)]">
          <section className="agent-dashboard__panel min-w-0 border-border p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="h-6 w-44 rounded bg-leaf-20 dark:bg-ink-31" />
              <div className="h-11 w-64 max-w-full rounded bg-leaf-20 dark:bg-ink-31" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="space-y-4 rounded-lg border border-[var(--border)] p-5 dark:border-[#3d4140]"
              >
                <div className="h-5 w-36 rounded bg-leaf-20 dark:bg-ink-31" />
                <div className="h-4 w-28 rounded bg-leaf-20 dark:bg-ink-31" />
                <div className="h-11 rounded bg-leaf-20 dark:bg-ink-31" />
              </div>
            ))}
          </section>
          <section className="agent-dashboard__panel min-w-0 border-border self-start p-5 sm:p-6 space-y-5">
            <div className="h-6 w-36 rounded bg-leaf-20 dark:bg-ink-31" />
            <div className="h-4 w-full rounded bg-leaf-20 dark:bg-ink-31" />
            <div className="h-4 w-4/5 rounded bg-leaf-20 dark:bg-ink-31" />
            <div className="h-24 rounded bg-leaf-20 dark:bg-ink-31" />
          </section>
        </div>
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
    <article className="rounded-lg border border-[var(--border)] bg-white p-5 dark:border-[#3d4140] dark:bg-transparent sm:p-6">
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
      <div className="mt-2 grid min-w-0 overflow-hidden rounded-md border border-[var(--border)] bg-white focus-within:border-[#006838] focus-within:outline-2 focus-within:outline-[#006838] dark:border-[#3d4140] dark:bg-[#171919] dark:focus-within:border-[#006838] dark:focus-within:outline-[#006838] sm:grid-cols-[minmax(0,1fr)_auto]">
        <input
          id={`referral-link-${link.id}`}
          type="text"
          readOnly
          aria-readonly="true"
          aria-label={`Referral URL for ${link.product_name}`}
          value={link.url}
          className="min-h-11 min-w-0 w-full bg-transparent px-3 text-base text-[var(--text-main)] focus:outline-none"
        />
        <div className="grid grid-cols-3 gap-0.5 border-t border-[var(--border)] p-1 dark:border-[#3d4140] sm:flex sm:border-t-0 sm:border-l">
          <button
            type="button"
            onClick={onCopy}
            aria-label={copied ? 'Copied!' : `Copy ${link.product_name} referral link`}
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-transparent bg-transparent px-2 text-sm font-semibold text-[#006838] hover:bg-[#f1f2f0] active:bg-[#d0e3c8] focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#f4f5f2] dark:hover:bg-[#303232] dark:active:bg-[#282c29] dark:focus-visible:outline-white sm:px-3"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onOpen}
            aria-label={`Open ${link.product_name} link in a new tab`}
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-transparent bg-transparent px-2 text-sm font-semibold text-[#006838] hover:bg-[#f1f2f0] active:bg-[#d0e3c8] focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#f4f5f2] dark:hover:bg-[#303232] dark:active:bg-[#282c29] dark:focus-visible:outline-white sm:px-3"
          >
            Open <span className="sr-only">in a new tab</span>
          </a>
          <button
            type="button"
            onClick={onShare}
            aria-label={`Share ${link.product_name} link`}
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-transparent bg-transparent px-2 text-sm font-semibold text-[#006838] hover:bg-[#f1f2f0] active:bg-[#d0e3c8] focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#f4f5f2] dark:hover:bg-[#303232] dark:active:bg-[#282c29] dark:focus-visible:outline-white sm:px-3"
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
  const [notice, setNotice] = useState('')
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const user = useAgentUser()
  const authFetch = useAuthFetch()

  function showNotice(message: string) {
    setNotice(message)
    if (noticeTimer.current) clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNotice(''), 4000)
  }

  // Referral code query — resolved from the token, no id required.
  const { data: referralCodeData } = useQuery<string | null>({
    queryKey: ['referralCode', user?.id],
    queryFn: async () => {
      try {
        const res = await authFetch('/api/agent/referral')
        if (!res.ok) return null
        const json = await res.json()
        return typeof json.data === 'string' ? json.data : json.data?.referral_code || null
      } catch {
        return null
      }
    },
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

  const code = referralCodeData || user?.agent_code || null
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
            url: code ? `${ecommerceBase}/${code}/${slug}` : '',
          }
        })
    }

    // Default lines of business available in UnoSure
    return [
      {
        id: 'travel',
        product_name: 'Travel Insurance',
        url: code ? `${ecommerceBase}/${code}/travel-insurance` : '',
      },
      {
        id: 'motor',
        product_name: 'Motor Insurance',
        url: code ? `${ecommerceBase}/${code}/motor-insurance` : '',
      },
      {
        id: 'health',
        product_name: 'Health Insurance',
        url: code ? `${ecommerceBase}/${code}/health-insurance` : '',
      },
    ]
  })()

  const filtered = links.filter((l) =>
    l.product_name.toLowerCase().includes(search.toLowerCase())
  )

  const handleCopy = async (link: ReferralLink) => {
    if (!link.url) {
      showNotice('Your referral code is unavailable. Contact your administrator.')
      return
    }
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link.url)
      } else {
        const input = document.getElementById(`referral-link-${link.id}`) as HTMLInputElement
        input?.select()
        document.execCommand('copy')
      }
      setCopiedId(link.id)
      showNotice('Link copied to clipboard')
      setTimeout(() => setCopiedId(null), 2500)
    } catch {
      showNotice('Copy was unavailable. Select the link to copy it manually.')
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
            <StatusBadge
              variant="info"
              label={`${links.length} product${links.length !== 1 ? 's' : ''}`}
            />
          ) : undefined
        }
      />

      {/* Two-column layout */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(290px,0.65fr)]">
        {/* Left: Product links list */}
        <section
          className="agent-dashboard__panel min-w-0 border-border p-5 sm:p-6"
          id="referral-list"
          aria-labelledby="links-title"
        >
          {/* Panel header: title left + search right on desktop, stacked on phone */}
          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
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
              <input
                id="referral-search"
                type="search"
                placeholder="Search by product"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ui-form-field w-full"
              />
            </div>
          </div>

          {/* Product cards */}
          <div className="mt-6 space-y-4 border-t border-[var(--border)] pt-6">
            {isLobsLoading ? (
              <div aria-busy="true" aria-live="polite">
                <Skeleton />
              </div>
            ) : filtered.length === 0 ? (
              <p className="rounded-lg border border-[var(--border)] bg-[#fbfcfa] px-5 py-10 text-center text-base text-[var(--text-sub)] dark:border-[#3d4140] dark:bg-[#1f2320]">
                {search
                  ? 'No sample products match your search.'
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

          {notice && (
            <p
              role="status"
              className="mt-4 rounded-md border border-[#c7d4c9] bg-[#eef4ee] px-4 py-3 text-base text-[#006838] dark:border-[#3d5242] dark:bg-[#1a2e1f] dark:text-[#d0e3c8]"
            >
              {notice}
            </p>
          )}

          {/* Showing X of Y count */}
          {!isLobsLoading && links.length > 0 && (
            <p className="mt-6 border-t border-[var(--border)] pt-4 text-base text-[var(--text-sub)]">
              Showing {filtered.length} of {links.length} product{links.length !== 1 ? 's' : ''}
            </p>
          )}
        </section>

        {/* Right: Sidebar info panel */}
        <section
          className="agent-dashboard__panel min-w-0 border-border self-start p-5 sm:p-6"
          aria-labelledby="about-links-title"
        >
          <h2 id="about-links-title" className="text-xl font-semibold tracking-tight text-[var(--text-main)]">
            Sharing your link
          </h2>
          <p className="mt-3 text-base leading-6 text-[var(--text-sub)]">
            Copy the link and send it to a customer, or open it to preview the product journey.
          </p>
          <div className="mt-6 rounded-md bg-[#eef4ee] p-4 text-base leading-6 text-[var(--text-sub)] dark:bg-[#282c29]">
            <strong className="block text-[#006838] dark:text-[#d0e3c8]">Attribution note</strong>
            Each link includes your unique agent code (
            <span className="font-mono font-semibold text-[#006838] dark:text-[#d0e3c8]">{code ?? 'Not available'}</span>).
            When a client purchases through your link, the policy is attributed to your account automatically.
          </div>
          <p className="mt-5 text-base leading-6 text-[var(--text-sub)]">
            Product assignments and actual referral URLs must come from the live portal.
          </p>
        </section>
      </div>
    </div>
  )
}
