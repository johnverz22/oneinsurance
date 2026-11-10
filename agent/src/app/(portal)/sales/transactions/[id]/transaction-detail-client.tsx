'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  Printer,
  Download,
  Users,
  Shield,
  Plane,
  Receipt,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useAuthFetch } from '@/hooks/use-auth-fetch'
import { PortalContentHeader } from '@/components/layout/portal-content-header'
import { StatusBadge } from '@/components/ui/status-badge'

// ---- Status helpers ----
function StatusIcon({ status }: { status: string }) {
  const s = status.toLowerCase()
  if (s === 'success' || s === 'completed')
    return <CheckCircle2 className="h-5 w-5 text-[#006838]" aria-hidden="true" />
  if (s === 'rejected' || s === 'failed')
    return <XCircle className="h-5 w-5 text-[#dc2626]" aria-hidden="true" />
  return <Clock className="h-5 w-5 text-amber-500" aria-hidden="true" />
}

function StatusLabel({ status }: { status: string }) {
  const s = status.toLowerCase()
  if (s === 'success' || s === 'completed') return <StatusBadge status="success" />
  if (s === 'rejected' || s === 'failed') return <StatusBadge status="rejected" label="Rejected" />
  return <StatusBadge status="pending" />
}

// ---- Section card wrapper ----
function SectionCard({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="portal-page-card space-y-4">
      <div className="flex items-center gap-2">
        {icon && <span className="text-[#006838] dark:text-[#d0e3c8]">{icon}</span>}
        <h2 className="text-base font-semibold text-[var(--text-main)]">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ---- Key-value row ----
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <dt className="text-sm text-[var(--text-muted)]">{label}</dt>
      <dd className="text-sm font-medium text-[var(--text-main)]">{value ?? '—'}</dd>
    </div>
  )
}

// ---- Skeleton ----
function Skeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="portal-page-card space-y-3">
          <div className="skeleton h-5 w-40 rounded" />
          {Array.from({ length: 4 }).map((_, j) => (
            <div key={j} className="skeleton h-4 w-full rounded" />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Transaction detail page — policy overview, payment info, traveller list, coverage summary.
 * Design spec: /downloads/design/agent-sales (transaction detail section)
 */
export function TransactionDetailClient({ id }: { id: string }) {
  const authFetch = useAuthFetch()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['transaction', id],
    queryFn: async () => {
      const res = await authFetch(`/api/transactions/${id}`)
      if (!res.ok) throw new Error('Transaction not found')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PortalContentHeader
          title="Transaction detail"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'My sales', href: '/sales' },
            { label: id },
          ]}
        />
        <Skeleton />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <PortalContentHeader
          title="Transaction detail"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'My sales', href: '/sales' },
            { label: id },
          ]}
        />
        <div className="portal-page-card flex flex-col items-center gap-4 py-16 text-center">
          <XCircle className="h-10 w-10 text-[#dc2626]" aria-hidden="true" />
          <p className="text-base font-semibold text-[var(--text-main)]">
            Transaction not found
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            The transaction <span className="font-mono">{id}</span> could not be loaded.
          </p>
          <Link href="/sales" className="btn-secondary">
            Back to My sales
          </Link>
        </div>
      </div>
    )
  }

  const tx = data?.data ?? data
  const displayId = tx?.merchant_transaction_id ?? tx?.policy_number ?? tx?.payment_id ?? id

  // Parse policy_details if available (handles both string and parsed object)
  let policyDetails: any = null
  if (tx?.policy_details) {
    try {
      policyDetails =
        typeof tx.policy_details === 'string'
          ? JSON.parse(tx.policy_details)
          : tx.policy_details
    } catch {
      policyDetails = null
    }
  }

  // Extract policy holder & travelers
  const customers = policyDetails?.PolicyCustomerList || []
  const policyHolder =
    customers.find((c: any) => c.IsPolicyHolder === 'Y') || customers[0] || null

  // Extract travel details
  const travelDetails = policyDetails?.TravelDetailList?.[0] || null

  // Extract coverage list
  const coverages =
    policyDetails?.PolicyLobList?.[0]?.PolicyRiskList?.[0]?.PolicyCoverageList || []

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      <PortalContentHeader
        title={
          <div className="flex flex-wrap items-center gap-3">
            <span>Transaction detail</span>
            {(tx.payment_status || tx.status) && (
              <StatusLabel status={tx.payment_status || tx.status} />
            )}
          </div>
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'My sales', href: '/sales' },
          { label: displayId },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/sales"
              className="btn-tertiary min-h-[36px] gap-1.5 px-2 text-xs sm:text-sm"
              aria-label="Back to My sales"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </Link>
            <button
              type="button"
              onClick={handlePrint}
              className="btn-secondary min-h-[36px] gap-2 px-3 text-xs sm:text-sm"
              title="Print transaction details"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              Print
            </button>
          </div>
        }
      />

      {/* Policy overview */}
      <SectionCard title="Policy overview" icon={<Receipt className="h-5 w-5" />}>
        <dl className="divide-y divide-[var(--border)] space-y-0">
          {[
            ['Policy number', tx.policy_number ?? tx.carrier_policy_no ?? policyDetails?.CarrierPolicyNo ?? 'N/A'],
            ['Certificate number', tx.certificate_number ?? 'N/A'],
            ['Proposal number', policyDetails?.ProposalNo ?? tx.proposal_number ?? 'N/A'],
            ['Payment ID', tx.merchant_transaction_id ?? tx.payment_id ?? id],
            ['Date issued', tx.created_at ? tx.created_at.split('T')[0] : '—'],
          ].map(([label, value]) => (
            <div key={label} className="py-3 first:pt-0 last:pb-0">
              <Row label={label as string} value={value as string} />
            </div>
          ))}
        </dl>
      </SectionCard>

      {/* Payment info */}
      <SectionCard title="Payment details">
        <div className="flex items-center gap-3">
          {(tx.payment_status || tx.status) && <StatusIcon status={tx.payment_status || tx.status} />}
          {(tx.payment_status || tx.status) && <StatusLabel status={tx.payment_status || tx.status} />}
        </div>
        <dl className="divide-y divide-[var(--border)]">
          {[
            ['Product', (typeof tx.product === 'object' && tx.product !== null ? tx.product.name : tx.product_name || tx.product) ?? 'N/A'],
            ['Plan', tx.plan_name ?? tx.plan ?? policyDetails?.CarrierPlanCode ?? 'N/A'],
            ['Premium', formatCurrency(tx.amount ?? tx.premium)],
            ['Net commission', formatCurrency(tx.commission_log?.agent_commission ?? tx.commission_log?.net_commission ?? tx.net_commission)],
          ].map(([label, value]) => (
            <div key={label} className="py-3 first:pt-0 last:pb-0">
              <Row label={label as string} value={value as string} />
            </div>
          ))}
        </dl>
      </SectionCard>

      {/* Travel details (if available) */}
      {(travelDetails || policyDetails?.TravelType) && (
        <SectionCard title="Travel details" icon={<Plane className="h-5 w-5" />}>
          <dl className="divide-y divide-[var(--border)]">
            <div className="py-3 first:pt-0">
              <Row
                label="Destination"
                value={
                  travelDetails
                    ? `${travelDetails.PlaceOfOrgin || 'Philippines'} → ${
                        travelDetails.TravelCountry || 'Destination'
                      }`
                    : '—'
                }
              />
            </div>
            <div className="py-3">
              <Row label="Travel type" value={policyDetails?.TravelType ?? '—'} />
            </div>
            <div className="py-3">
              <Row
                label="Duration"
                value={
                  policyDetails?.TravelDays ? `${policyDetails.TravelDays} days` : '—'
                }
              />
            </div>
            <div className="py-3 last:pb-0">
              <Row
                label="Coverage period"
                value={
                  policyDetails?.EffectiveDate && policyDetails?.ExpiryDate
                    ? `${new Date(policyDetails.EffectiveDate).toLocaleDateString()} – ${new Date(
                        policyDetails.ExpiryDate
                      ).toLocaleDateString()}`
                    : '—'
                }
              />
            </div>
          </dl>
        </SectionCard>
      )}

      {/* Travellers / Insured Persons */}
      <SectionCard title="Travellers & Insured Persons" icon={<Users className="h-5 w-5" />}>
        {customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase text-[var(--text-muted)]">
                  <th className="py-2.5">Name</th>
                  <th className="py-2.5">Type</th>
                  <th className="py-2.5">Date of Birth</th>
                  <th className="py-2.5">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {customers.map((c: any, idx: number) => {
                  const fullName = [c.FirstName, c.MiddleName, c.LastName]
                    .filter(Boolean)
                    .join(' ')
                  return (
                    <tr key={idx}>
                      <td className="py-3 font-medium text-[var(--text-main)]">
                        {fullName || c.CustomerName || 'N/A'}
                      </td>
                      <td className="py-3 text-[var(--text-sub)]">
                        {c.IsPolicyHolder === 'Y' ? (
                          <StatusBadge variant="success" label="Policy Holder" icon={null} />
                        ) : (
                          'Insured'
                        )}
                      </td>
                      <td className="py-3 text-[var(--text-muted)]">
                        {c.DateOfBirth ?? c.Dob ?? '—'}
                      </td>
                      <td className="py-3 text-[var(--text-muted)]">
                        {c.Email || c.Mobile || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : policyHolder ? (
          <p className="text-sm text-[var(--text-main)]">
            Policy Holder:{' '}
            {[policyHolder.FirstName, policyHolder.MiddleName, policyHolder.LastName]
              .filter(Boolean)
              .join(' ')}
          </p>
        ) : tx.customer_name ? (
          <p className="text-sm text-[var(--text-main)]">{tx.customer_name}</p>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            No specific traveller details recorded for this transaction.
          </p>
        )}
      </SectionCard>

      {/* Coverage summary */}
      <SectionCard title="Coverage summary" icon={<Shield className="h-5 w-5" />}>
        {coverages.length > 0 ? (
          <div className="space-y-2">
            <div className="flex justify-between border-b border-[var(--border)] pb-2 text-xs font-semibold uppercase text-[var(--text-muted)]">
              <span>Coverage / Benefit</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {coverages.map((cov: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-[var(--text-main)]">{cov.CoverageName}</span>
                  <StatusBadge variant="success" label="Included" icon={null} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            Coverage is determined by the selected plan ({tx.plan_name ?? tx.plan ?? 'Standard'}).
            Benefits and exclusions follow the underwriter policy schedule.
          </p>
        )}
      </SectionCard>
    </div>
  )
}
