'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { StatusPill } from './status-pill'
import type { SaleStatus } from './status-pill'

export type TransactionCardProps = {
  id: string | number
  policyNumber: string
  paymentRef: string
  productName: string
  planName: string
  premium: number
  commission: number
  commissionIsPending: boolean
  status: SaleStatus
  date: string
  time: string
  href: string
  className?: string
}

/**
 * TransactionCard — mobile/tablet card list item for a single transaction.
 * Used in the < 1024 px breakpoint. The entire card is a link.
 */
export function TransactionCard({
  policyNumber,
  paymentRef,
  productName,
  planName,
  premium,
  commission,
  commissionIsPending,
  status,
  date,
  time,
  href,
  className,
}: TransactionCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-start gap-3 px-4 py-4',
        'transition-colors hover:bg-[var(--subtle)] focus-visible:bg-[var(--subtle)]',
        'focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-[-2px]',
        className
      )}
    >
      <div className="min-w-0 flex-1">
        {/* Top row: plan name + status pill */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--text-main)]">{planName}</p>
            <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">{productName}</p>
          </div>
          <StatusPill status={status} />
        </div>

        {/* Policy & Payment row */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <span className="text-xs text-[var(--text-sub)]">
            Policy: <span className="font-medium">{policyNumber}</span>
          </span>
          <span className="text-xs font-mono text-[var(--text-muted)] tabular-nums">{paymentRef}</span>
        </div>

        {/* Bottom row: date + premium + commission */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
          <p className="text-xs text-[var(--text-muted)]">
            {date}
            {time ? <span className="ml-1 opacity-70">{time}</span> : null}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold tabular-nums text-[var(--text-main)]">
              {formatCurrency(premium)}
            </span>
            {commissionIsPending ? (
              <span className="text-xs text-[#854d0e] dark:text-[#fde047]">Comm. pending</span>
            ) : commission > 0 ? (
              <span className="text-xs text-[#166534] dark:text-[#86efac]">
                +{formatCurrency(commission)}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <ArrowUpRight
        className="mt-1 size-4 shrink-0 text-[var(--primary)] dark:text-[#d0e3c8]"
        aria-hidden="true"
      />
    </Link>
  )
}
