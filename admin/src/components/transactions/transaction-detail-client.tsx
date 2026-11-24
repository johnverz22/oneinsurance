'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { PortalContentHeader } from '@/components/layout/portal-content-header'
import { StatusPill } from '@/components/ui/status-pill'
import { CardSkeleton } from '@/components/ui/skeleton'
import { useAuthFetch } from '@/hooks/use-auth-fetch'
import { useHasHydrated, useIsAuthenticated } from '@/store/admin-auth-store'
import { formatPersonName } from '@/lib/utils'
import { panelTitleCls } from '@/lib/ui-classes'
import {
  formatAmount,
  formatTxDate,
  txLineOfBusiness,
  txPaymentRef,
  txPremium,
  txProductName,
  txStatus,
  type Transaction,
} from '@/lib/transactions'

const panelCls =
  'min-w-0 rounded-lg border border-[#dfe7df] bg-white p-5 dark:border-[#3d4140] dark:bg-[#171919] sm:p-6'
const dtCls = 'text-sm text-[var(--text-sub)]'
const ddCls = 'mt-1 font-medium text-[var(--text-main)]'

function DlRow({
  label,
  value,
  mono,
}: {
  label: string
  value?: React.ReactNode
  mono?: boolean
}) {
  return (
    <div>
      <dt className={dtCls}>{label}</dt>
      <dd className={ddCls + (mono ? ' break-all font-mono text-xs' : '')}>
        {value ?? '—'}
      </dd>
    </div>
  )
}

function summaryPolicyDetails(tx: Transaction): Record<string, unknown> | null {
  if (!tx.policy_details) return null
  try {
    return typeof tx.policy_details === 'string'
      ? JSON.parse(tx.policy_details)
      : tx.policy_details
  } catch {
    return null
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

  const details = tx ? summaryPolicyDetails(tx) : null
  const premium = tx ? txPremium(tx) : null
  const product = tx ? txProductName(tx) : null
  const lineOfBusiness = tx ? txLineOfBusiness(tx) : null
  const ref = tx
    ? (txPaymentRef(tx) ?? `Transaction #${tx.id}`)
    : `Transaction #${id}`
  const holder = formatPersonName(tx?.policy_holder ?? tx?.customer_name)
  const netCommission = tx?.net_commission ?? tx?.commission_log?.net_commission
  const agentCode = (tx?.agent?.code ?? tx?.agent_code_used ?? '')?.toUpperCase()
  const plan = tx?.plan_name ?? tx?.plan

  return (
    <>
      <PortalContentHeader
        title={ref}
        description={
          tx ? (
            [plan, product].filter(Boolean).join(' · ')
          ) : (
            <span
              aria-hidden="true"
              className="skeleton inline-block h-4 w-48 align-middle"
            />
          )
        }
        breadcrumbs={[
          { label: 'Transactions', href: '/transactions' },
          { label: ref },
        ]}
        actions={tx ? <StatusPill status={txStatus(tx)} /> : undefined}
      />
      <div className="mx-auto w-full max-w-7xl">
        {isLoading ? (
          <div
            className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]"
            aria-busy="true"
            aria-label="Loading transaction"
          >
            <div className="min-w-0 space-y-5">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
            <div className="min-w-0 space-y-5">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          </div>
        ) : isError || !tx ? (
          <div className={`${panelCls} mt-4 text-center text-[#991b1b] dark:text-[#fca5a5]`}>
            Failed to load this transaction. It may not exist or you may not
            have access.
          </div>
        ) : (
          <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]">
            <div className="min-w-0 space-y-5">
              <section className={panelCls} aria-labelledby="policy-overview-title">
                <h2 id="policy-overview-title" className={panelTitleCls}>
                  Policy overview
                </h2>
                <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                  <DlRow
                    label="Policy number"
                    value={tx.policy_number}
                    mono
                  />
                  <DlRow
                    label="Certificate number"
                    value={tx.certificate_number}
                    mono
                  />
                  <DlRow label="Plan" value={plan} />
                  <DlRow label="Product" value={product} />
                  <DlRow label="Line of business" value={lineOfBusiness} />
                  <DlRow
                    label="Coverage start"
                    value={formatTxDate(
                      tx.coverage_start ??
                        (details?.EffectiveDate as string | undefined)
                    )}
                  />
                  <DlRow
                    label="Coverage end"
                    value={formatTxDate(
                      tx.coverage_end ??
                        (details?.ExpiryDate as string | undefined)
                    )}
                  />
                </dl>
              </section>

              <section className={panelCls} aria-labelledby="holder-title">
                <h2 id="holder-title" className={panelTitleCls}>
                  Policy holder
                </h2>
                <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                  <DlRow label="Name" value={holder || null} />
                  <DlRow
                    label="Email"
                    value={
                      tx.client_email ? (
                        <a
                          href={`mailto:${tx.client_email}`}
                          className="text-[#006838] hover:underline dark:text-[#d0e3c8]"
                        >
                          {tx.client_email}
                        </a>
                      ) : null
                    }
                  />
                  <DlRow
                    label="Phone"
                    value={
                      tx.client_phone ? (
                        <a
                          href={`tel:${tx.client_phone.replace(/\s+/g, '')}`}
                          className="text-[#006838] hover:underline dark:text-[#d0e3c8]"
                        >
                          {tx.client_phone}
                        </a>
                      ) : null
                    }
                  />
                </dl>
              </section>

              <section className={panelCls} aria-labelledby="travel-title">
                <h2 id="travel-title" className={panelTitleCls}>
                  Travel details
                </h2>
                <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                  <DlRow
                    label="Trip route"
                    value={
                      (details?.TripRoute as string | undefined) ??
                      (details?.Destination as string | undefined)
                    }
                  />
                  <DlRow
                    label="Travellers"
                    value={
                      Array.isArray(details?.PolicyCustomerList)
                        ? details.PolicyCustomerList.length || null
                        : ((details?.TravelDays as string | undefined) ?? null)
                    }
                  />
                </dl>
              </section>
            </div>

            <div className="min-w-0 space-y-5">
              <section className={panelCls} aria-labelledby="payment-summary-title">
                <h2 id="payment-summary-title" className={panelTitleCls}>
                  Payment summary
                </h2>
                <div className="mt-5 rounded-md bg-[#eff6ef] p-5 dark:bg-[#38483b]">
                  <p className="text-sm font-medium text-[#006838] dark:text-[#d0e3c8]">
                    Premium
                  </p>
                  <p className="mt-1 text-3xl font-semibold tabular-nums text-[var(--text-main)]">
                    {premium !== null
                      ? `${tx.currency ? `${tx.currency} ` : ''}${formatAmount(premium)}`
                      : '—'}
                  </p>
                </div>
                <dl className="mt-5 divide-y divide-[#dfe7df] dark:divide-[#3d4140]">
                  {[
                    { label: 'Payment reference', value: txPaymentRef(tx) },
                    {
                      label: 'Date',
                      value: formatTxDate(
                        tx.transaction_date ?? tx.created_at
                      ),
                    },
                    {
                      label: 'Method',
                      value: tx.payment_brand ?? tx.payment_method,
                    },
                    { label: 'Currency', value: tx.currency },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex flex-wrap justify-between gap-2 py-3"
                    >
                      <dt className={dtCls}>{row.label}</dt>
                      <dd className="break-all text-sm font-medium text-[var(--text-main)]">
                        {row.value ?? '—'}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className={panelCls} aria-labelledby="commission-title">
                <h2 id="commission-title" className={panelTitleCls}>
                  Commission
                </h2>
                <p className="mt-5 text-sm text-[var(--text-sub)]">
                  Net commission
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--text-main)]">
                  {netCommission !== null && netCommission !== undefined
                    ? `${tx.currency ? `${tx.currency} ` : ''}${formatAmount(Number(netCommission))}`
                    : '—'}
                </p>
                <dl className="mt-5 grid gap-4 border-t border-[#dfe7df] pt-4 dark:border-[#3d4140]">
                  <div className="flex justify-between gap-3">
                    <dt className={dtCls}>Agent</dt>
                    <dd className="text-right text-sm font-medium text-[var(--text-main)]">
                      {tx.agent_id ? (
                        <Link
                          href={`/agents/${tx.agent_id}/profile`}
                          className="text-[#006838] hover:underline dark:text-[#d0e3c8]"
                        >
                          {formatPersonName(tx.agent?.name) ||
                            `Agent #${tx.agent_id}`}
                        </Link>
                      ) : (
                        (formatPersonName(tx.agent?.name) ?? '—')
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className={dtCls}>Agent code</dt>
                    <dd className="text-right text-sm font-medium text-[var(--text-main)]">
                      {agentCode ? (
                        <code className="rounded-md bg-[#eff6ef] px-2 py-0.5 font-mono text-xs text-[#006838] dark:bg-[#38483b] dark:text-[#d0e3c8]">
                          {agentCode}
                        </code>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                </dl>
              </section>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
