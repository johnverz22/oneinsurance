'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { PortalContentHeader } from '@/components/layout/portal-content-header'
import { ExportMenu } from '@/components/ui/export-menu'
import { StatusPill } from '@/components/ui/status-pill'
import { SummaryCardsSkeleton } from '@/components/ui/summary-card'
import { TransactionSummaryCards } from '@/components/transactions/transaction-summary-cards'
import { useAuthFetch } from '@/hooks/use-auth-fetch'
import { useHasHydrated, useIsAuthenticated } from '@/store/admin-auth-store'
import { exportToCSV } from '@/lib/export-to-csv'
import {
  buildTransactionSummary,
  formatTimestamp,
  toPolicyPdfData,
  type TransactionSummary,
} from '@/lib/transaction-summary'
import { txStatus, type Transaction } from '@/lib/transactions'

/** Flatten the summary into a single CSV row (one record per download). */
function summaryToCsvRow(s: TransactionSummary): Record<string, unknown> {
  return {
    policy_number: s.policyNumber ?? '',
    proposal_number: s.proposalNumber ?? '',
    certificate_number: s.certificateNumber ?? '',
    plan: s.plan,
    product: s.product,
    insurer: s.insurer,
    policy_holder: s.holderName,
    trip_route: s.tripRoute,
    travel_dates: s.travelDates,
    trip_type: s.travelType,
    travellers: s.travellers.map((t) => t.name).join('; '),
    payment_reference: s.referenceId,
    amount: s.amount ?? '',
    currency: s.currencyCode,
    payment_method: s.method,
    payment_status: s.rawStatus,
    payment_timestamp: formatTimestamp(s.timestamp),
    net_commission: s.rawNetCommission ?? '',
    agent: s.agentName ?? '',
    agent_code: s.agentCode,
    add_ons: s.addonItems.map((a) => a.name).join('; '),
  }
}

async function downloadPdf(summary: TransactionSummary) {
  try {
    const { downloadCoverageSummary } = await import('@/lib/generate-policy-pdfs')
    await downloadCoverageSummary(toPolicyPdfData(summary))
  } catch (err) {
    console.error('Transaction PDF failed:', err)
    toast.error('We could not create the PDF. Please try again.')
  }
}

export function TransactionDetailClient({ id }: { id: string }) {
  const authFetch = useAuthFetch()
  const hasHydrated = useHasHydrated()
  const isAuthenticated = useIsAuthenticated()
  const enabled = hasHydrated && isAuthenticated

  const { data: tx, isLoading, isError } = useQuery<Transaction>({
    queryKey: ['admin-transaction', id],
    queryFn: async () => {
      const res = await authFetch(`/api/admin/transactions/${id}`)
      if (!res.ok) throw new Error('Failed to load transaction')
      const json = await res.json()
      return (json?.data ?? json) as Transaction
    },
    enabled,
  })

  const summary = tx ? buildTransactionSummary(tx, id) : null

  return (
    <>
      <Link
        href="/transactions"
        className="btn-tertiary -ms-3 mb-1 gap-2"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to transactions
      </Link>
      <PortalContentHeader
        title={summary ? (summary.policyNumber ?? 'Not available') : 'Transaction details'}
        description={
          summary ? (
            'Transaction details'
          ) : (
            <span
              aria-hidden="true"
              className="skeleton inline-block h-4 w-48 align-middle"
            />
          )
        }
        actions={
          tx && summary ? (
            <>
              <StatusPill status={txStatus(tx)} />
              <ExportMenu
                label="Download transaction"
                items={[
                  {
                    id: 'pdf',
                    label: 'PDF',
                    onSelect: () => void downloadPdf(summary),
                  },
                  {
                    id: 'csv',
                    label: 'CSV',
                    onSelect: () =>
                      exportToCSV(
                        [summaryToCsvRow(summary)],
                        `transaction-${summary.policyNumber ?? id}.csv`
                      ),
                  },
                ]}
              />
            </>
          ) : undefined
        }
      />
      {isLoading ? (
        <SummaryCardsSkeleton label="Loading transaction" />
      ) : isError || !summary ? (
        <div
          role="alert"
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-center text-[#991b1b] dark:text-[#fecaca]"
        >
          Failed to load this transaction. It may not exist or you may not have
          access.
        </div>
      ) : (
        <TransactionSummaryCards summary={summary} />
      )}
    </>
  )
}
