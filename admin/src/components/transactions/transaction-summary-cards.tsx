'use client'

import { ChevronDown, CreditCard, Plus, ShieldCheck, Umbrella, Users } from 'lucide-react'
import { StatusPill } from '@/components/ui/status-pill'
import { SummaryCard, SummaryField, SummaryGroup } from '@/components/ui/summary-card'
import { formatCurrency, formatTimestamp, titleCase, type TransactionSummary } from '@/lib/transaction-summary'

/** The five stacked summary cards shared by the case dialog and the transaction details page. */
export function TransactionSummaryCards({ summary }: { summary: TransactionSummary }) {
  const {
    hasNewShape,
    plan,
    product,
    insurer,
    policyNumber,
    proposalNumber,
    certificateNumber,
    holderName,
    holderEmail,
    holderPhone,
    origin,
    destination,
    tripRoute,
    travelDates,
    travelType,
    travellers,
    travellerSummary,
    referenceId,
    amount,
    method,
    currencyCode,
    rawNetCommission,
    rawStatus,
    timestamp,
    agentCode,
    agentName,
    coverageGroups,
    addonItems,
  } = summary

  return (
    <div className="space-y-5">
    {/* Policy overview */}
    <SummaryCard
      icon={ShieldCheck}
      title="Policy overview"
      description="Policy identifiers, cover and trip details."
    >
      <SummaryGroup
        title="Policy details"
        className="border-b border-[var(--border)] pb-6"
      >
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryField label="Plan">{plan}</SummaryField>
          <SummaryField label="Product">{product}</SummaryField>
          <SummaryField label="Insurer">{insurer}</SummaryField>
          <SummaryField label="Policy number">
            <span className="break-all">{policyNumber ?? '—'}</span>
          </SummaryField>
          <SummaryField label="Proposal number">
            <span className="break-all">{proposalNumber ?? '—'}</span>
          </SummaryField>
          <SummaryField label="Certificate number">
            <span className="break-all">{certificateNumber ?? '—'}</span>
          </SummaryField>
          <SummaryField label="Policy holder">{holderName}</SummaryField>
        </dl>
      </SummaryGroup>

      {(origin || destination || travelDates !== '—' || travellerSummary !== '—') && (
        <SummaryGroup title="Trip details" className="mt-6">
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryField label="Trip route">{tripRoute}</SummaryField>
            <SummaryField label="Travel dates">{travelDates}</SummaryField>
            <SummaryField label="Trip type">{travelType}</SummaryField>
            <SummaryField label="Travellers">{travellerSummary}</SummaryField>
          </dl>
        </SummaryGroup>
      )}
    </SummaryCard>

    {/* Payment & commission */}
    <SummaryCard
      icon={CreditCard}
      title="Payment & commission"
      description="Payment records and commission earned on this policy."
    >
      <SummaryGroup
        title="Payment record"
        className="border-b border-[var(--border)] pb-6"
      >
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryField label="Reference ID">
            <span className="break-all">{referenceId}</span>
          </SummaryField>
          <SummaryField label="Amount">
            {formatCurrency(amount, currencyCode)}
          </SummaryField>
          <SummaryField label="Method">{method}</SummaryField>
          <SummaryField label="Status">{titleCase(rawStatus)}</SummaryField>
          <SummaryField label="Timestamp">{formatTimestamp(timestamp)}</SummaryField>
        </dl>
      </SummaryGroup>

      <SummaryGroup title="Commission" className="mt-6">
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryField label="Net commission">
            {formatCurrency(rawNetCommission, currencyCode)}
          </SummaryField>
          {agentName && (
            <SummaryField label="Agent">{agentName}</SummaryField>
          )}
          {agentCode && (
            <SummaryField label="Agent code">
              <span className="break-all font-mono text-sm">{agentCode}</span>
            </SummaryField>
          )}
        </dl>
      </SummaryGroup>
    </SummaryCard>

    {/* Travellers */}
    {travellers.length > 0 && (
      <SummaryCard
        icon={Users}
        title="Travellers"
        description="Insured travellers on this policy."
        badge={
          <StatusPill status={`${travellers.length} traveller${travellers.length === 1 ? '' : 's'}`} />
        }
      >
        <div
          role="table"
          aria-label="Insured travellers"
          className="overflow-x-auto"
        >
          <div role="rowgroup" className="min-w-[480px]">
            <div
              role="row"
              className="grid grid-cols-5 gap-x-6 pb-3 text-[14px] leading-normal text-[#878787] dark:text-[#b2b7b4]"
            >
              <div role="columnheader">#</div>
              <div role="columnheader">Full name</div>
              <div role="columnheader">Birthday</div>
              <div role="columnheader">Gender</div>
              <div role="columnheader">Type</div>
            </div>
          </div>
          <div role="rowgroup" className="min-w-[480px]">
            {travellers.map((t, idx) => (
              <div
                key={idx}
                role="row"
                className="grid grid-cols-5 gap-x-6 border-b border-[var(--border)] py-3 text-[16px] leading-6 last:border-b-0"
              >
                <div role="cell" className="min-w-0 [overflow-wrap:anywhere]">
                  {idx + 1}
                </div>
                <div role="cell" className="min-w-0 [overflow-wrap:anywhere]">
                  {t.name}
                </div>
                <div role="cell" className="min-w-0 [overflow-wrap:anywhere]">
                  {t.birthday}
                </div>
                <div role="cell" className="min-w-0 [overflow-wrap:anywhere]">
                  {t.gender}
                </div>
                <div role="cell" className="min-w-0 [overflow-wrap:anywhere]">
                  {t.type}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SummaryCard>
    )}

    {/* Coverage summary */}
    {coverageGroups.length > 0 && (
      <SummaryCard
        icon={Umbrella}
        title="Coverage summary"
        description="Benefit limits grouped by type of cover."
        badge={
          <StatusPill
            status={`${coverageGroups.length} benefit group${coverageGroups.length === 1 ? '' : 's'}`}
          />
        }
      >
        <div className="grid grid-cols-1">
          {coverageGroups.map((group) => (
            <details
              key={group.name}
              className="travel-faq portal-coverage-group rounded-md"
            >
              <summary className="travel-faq__question flex min-h-16 cursor-pointer list-none items-center gap-3 px-3 py-5 text-xs font-normal uppercase text-[#b88e28] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#006838] dark:text-[#e4c27f]">
                <span className="min-w-0 grow leading-6">{group.name}</span>
                <span className="shrink-0 text-xs font-normal normal-case text-[var(--text-sub)]">
                  {group.items.length}{' '}
                  {group.items.length === 1 ? 'item' : 'items'}
                </span>
                <ChevronDown
                  className="travel-faq__chevron size-5 shrink-0"
                  aria-hidden="true"
                />
              </summary>
              <div className="portal-benefit-list overflow-hidden">
                <dl className="grid">
                  {group.items.map((item, idx) => (
                    <div
                      key={`${item.name}-${idx}`}
                      className="grid min-w-0 items-start gap-1 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(130px,.6fr)] sm:gap-6"
                    >
                      <dt className="text-[14px] leading-normal text-[#878787] dark:text-[#b2b7b4]">
                        {item.name}
                      </dt>
                      <dd className="text-[16px] leading-6 [overflow-wrap:anywhere] text-[var(--text-main)]">
                        {item.limit}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </details>
          ))}
        </div>
      </SummaryCard>
    )}

    {/* Add-ons */}
    <SummaryCard
      icon={Plus}
      title="Add-ons"
      description="Additional cover included with this policy."
      badge={
        addonItems.length > 0 ? (
          <StatusPill
            status={`${addonItems.length} add-on${addonItems.length === 1 ? '' : 's'}`}
          />
        ) : null
      }
    >
      {addonItems.length > 0 ? (
        <SummaryGroup title="Additional benefits">
          <div className="portal-benefit-list overflow-hidden">
            <dl className="grid">
              {addonItems.map((item, idx) => (
                <div
                  key={`${item.name}-${idx}`}
                  className="grid min-w-0 items-start gap-1 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(130px,.6fr)] sm:gap-6"
                >
                  <dt className="text-[14px] leading-normal text-[#878787] dark:text-[#b2b7b4]">
                    {item.name}
                  </dt>
                  <dd className="text-[16px] leading-6 [overflow-wrap:anywhere] text-[var(--text-main)]">
                    {item.limit}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </SummaryGroup>
      ) : (
        <p className="text-base text-[#878787] dark:text-[#b2b7b4]">
          No add-ons selected for this case.
        </p>
      )}
    </SummaryCard>

    {/* Contact info (if not embedded in travellers) */}
    {!hasNewShape && (holderEmail || holderPhone) && (
      <SummaryCard
        icon={Users}
        title="Policy holder contact"
        description="Contact details for this policy."
      >
        <SummaryGroup title="Contact">
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryField label="Name">{holderName}</SummaryField>
            {holderEmail && (
              <SummaryField label="Email">
                <a
                  href={`mailto:${holderEmail}`}
                  className="text-[#006838] hover:underline dark:text-[#d0e3c8]"
                >
                  {holderEmail}
                </a>
              </SummaryField>
            )}
            {holderPhone && (
              <SummaryField label="Phone">
                <a
                  href={`tel:${holderPhone.replace(/\s+/g, '')}`}
                  className="text-[#006838] hover:underline dark:text-[#d0e3c8]"
                >
                  {holderPhone}
                </a>
              </SummaryField>
            )}
          </dl>
        </SummaryGroup>
      </SummaryCard>
    )}
    </div>
  )
}
