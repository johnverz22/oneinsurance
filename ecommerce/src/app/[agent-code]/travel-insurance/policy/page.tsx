'use client'

import { useMemo, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowUpRight, ChevronDown, CircleHelp, Clock, CreditCard, FileCheck2, FileText, FileX, Mail, PlaneTakeoff, Receipt } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { idFilesStore, useFullQuoteResponseStore, useTravelInsuranceStore } from '@/store/travel-insurance-store'
import { COMPANIES, CARRIER_BRAND_COLORS } from '@/constants/companies'
import { COUNTRIES } from '@/constants/countries'
import { groupPlanBenefits } from '@/utils/travel-benefits-helpers'
import { groupBenefits } from '@/utils/travel-benefits'
import { getPrincipal } from '@/utils/traveller-form'
import { benefitNote, formatBenefitLimit } from '@/utils/travel-benefits'
import { KeyConditions } from '@/components/travel-insurance/key-conditions'
import { formatDays, formatTravelers, formatTripRange, getTripDays, countryLabel } from '@/utils/trip-summary'
import type { PolicyDocData } from '@/utils/generate-policy-pdfs'

const money = (n: number) => n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtPaidAt = (iso?: string | null) => {
  const d = iso ? new Date(iso) : null
  if (!d || isNaN(d.getTime())) return '—'
  return `${d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Manila',
  })} PHT`
}

type Doc = 'coverage' | 'receipt'

export default function PolicyIssuedPage() {
  const params = useParams()
  const agentCode = (params['agent-code'] as string) || 'ckO6uNx2O6'
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  return (
    <>
      <Header agentCode={agentCode} />
      {hydrated ? (
        <PolicyContent agentCode={agentCode} />
      ) : (
        <main id="main" className="travel-results w-full" aria-busy="true">
          <div className="w-full mx-auto h-96 max-w-7xl animate-pulse rounded-lg bg-[var(--border)]" />
        </main>
      )}
    </>
  )
}

// ── Insurer-hosted document card ─────────────────────────────────────────────

type DocStatus = 'available' | 'pending' | 'unavailable'

function docStatus(url: string | null | undefined): DocStatus {
  if (url) return 'available'
  // null = explicitly absent; undefined = not yet known (treat as pending)
  if (url === null) return 'unavailable'
  return 'pending'
}

function InsurerDocuments({
  certUrl,
  invoiceUrl,
  insurer,
  policyNo,
  email,
}: {
  certUrl: string | null
  invoiceUrl: string | null
  insurer: string
  policyNo: string
  email: string
}) {
  const certStatus = docStatus(certUrl)
  const invoiceStatus = docStatus(invoiceUrl)

  // If both are explicitly unavailable we can skip the entire block.
  if (certStatus === 'unavailable' && invoiceStatus === 'unavailable') return null

  return (
    <section className="issued-insurer-docs" aria-labelledby="insurer-docs-title">
      <div className="issued-insurer-docs__header">
        <div>
          <h2 id="insurer-docs-title" className="text-base font-semibold">
            {insurer} documents
          </h2>
          <p className="issued-muted mt-1 text-xs leading-5">
            Official documents issued by the insurer. Your eCOC is also sent to{email ? ` ${email}` : ' your email'}.
          </p>
        </div>
      </div>

      <div className="issued-insurer-docs__grid">
        <DocCard
          status={certStatus}
          url={certUrl}
          icon={FileCheck2}
          label="Electronic Certificate of Cover"
          hint="eCOC · PDF"
          accessibleLabel={`Open electronic Certificate of Cover for policy ${policyNo}, opens in new tab`}
          pendingNote="The eCOC will appear here once the insurer finalises the policy. It will also be emailed to you."
          unavailableNote="The eCOC is not available via link. Check your email or contact the insurer."
        />
        <DocCard
          status={invoiceStatus}
          url={invoiceUrl}
          icon={Receipt}
          label="Insurer invoice"
          hint="Invoice · PDF"
          accessibleLabel={`Open insurer invoice for policy ${policyNo}, opens in new tab`}
          pendingNote="The insurer invoice will appear here once it has been generated."
          unavailableNote="An invoice is not available via link for this policy."
        />
      </div>
    </section>
  )
}

function DocCard({
  status,
  url,
  icon: Icon,
  label,
  hint,
  accessibleLabel,
  pendingNote,
  unavailableNote,
}: {
  status: DocStatus
  url: string | null
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  label: string
  hint: string
  accessibleLabel: string
  pendingNote: string
  unavailableNote: string
}) {
  if (status === 'available') {
    return (
      <a
        href={url!}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={accessibleLabel}
        className="issued-doc-card issued-doc-card--available group"
      >
        <span className="issued-doc-card__icon">
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="issued-doc-card__body">
          <span className="issued-doc-card__label">{label}</span>
          <span className="issued-doc-card__hint">{hint}</span>
        </span>
        <ArrowUpRight className="issued-doc-card__arrow size-4 shrink-0" aria-hidden />
      </a>
    )
  }

  if (status === 'pending') {
    return (
      <div className="issued-doc-card issued-doc-card--pending" aria-label={`${label} — pending`}>
        <span className="issued-doc-card__icon">
          <Clock className="size-5" aria-hidden />
        </span>
        <span className="issued-doc-card__body">
          <span className="issued-doc-card__label">{label}</span>
          <span className="issued-doc-card__hint">{pendingNote}</span>
        </span>
        <span className="issued-doc-card__badge">Pending</span>
      </div>
    )
  }

  // unavailable
  return (
    <div className="issued-doc-card issued-doc-card--unavailable" aria-label={`${label} — not available`}>
      <span className="issued-doc-card__icon">
        <FileX className="size-5" aria-hidden />
      </span>
      <span className="issued-doc-card__body">
        <span className="issued-doc-card__label">{label}</span>
        <span className="issued-doc-card__hint">{unavailableNote}</span>
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function PolicyContent({ agentCode }: { agentCode: string }) {
  const router = useRouter()
  const base = `/${agentCode}/travel-insurance`
  const apiData = useFullQuoteResponseStore((s) => s.apiResponse.data)
  const { travelDetails, coverageOption, travelersInfo, issueQuoteResponse, paymentSubmitResponse, paymentBillingDetails, selectedPaymentBrand } =
    useTravelInsuranceStore()
  const plan = coverageOption.selectedPlan
  const issued = issueQuoteResponse?.data
  const proposalNo = apiData?.ProposalNo

  const [doc, setDoc] = useState<Doc>('coverage')
  const [copyStatus, setCopyStatus] = useState('')
  const [busy, setBusy] = useState<Doc | null>(null)
  const [pdfError, setPdfError] = useState('')

  const groups = useMemo(() => {
    if (!plan) return []
    const g = groupBenefits(plan)
    const addons = Object.entries(groupPlanBenefits(plan).groupedAddonBenefits)
      .filter(([code, a]) => a.children.length > 0 && coverageOption.selectedAddonBenefits?.includes(code))
      .flatMap(([, a]) => a.children)
      .map((b) => ({ label: b.BenefitDesc, value: formatBenefitLimit(b), note: benefitNote(b) }))
    return addons.length ? [...g, { title: 'Selected add-ons', rows: addons }] : g
  }, [plan, coverageOption.selectedAddonBenefits])

  // The issue-quote response is the source of truth — a policy exists once
  // the IGW returns a policy_no. We deliberately do NOT cross-check against
  // apiData.ProposalNo: the quote store can hold a stale/absent proposal in
  // recovered sessions while the issued payload is always authoritative.
  const hasPolicy = !!issued?.policy_no

  if (!hasPolicy) {
    return (
      <main id="main" className="travel-results">
        <section className="travel-applicant-card mx-auto max-w-xl text-center" aria-labelledby="no-policy">
          <h1 id="no-policy" className="text-2xl font-semibold text-[#006838] dark:text-[#d0e3c8]">
            We couldn’t find an issued policy
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#333] dark:text-[#c4c7c5]">
            Your session may have ended, or your policy hasn’t been issued yet. If you’ve already paid, check your email
            for the eCOC, or retrieve your proposal with its number.
          </p>
          <Link
            href={`${base}/review`}
            className="btn-primary mt-6 inline-flex min-h-11 items-center justify-center px-5 py-3 text-sm font-semibold"
          >
            Retrieve my proposal
          </Link>
        </section>
      </main>
    )
  }

  // Prefer the issued payload — it's authoritative even when the quote store
  // wasn't hydrated (e.g. recovered session). Store data is the fallback.
  const issuedTrip = issued.trip
  const issuedLead = issued.travellers?.find((t) => t.is_principal_applicant) || issued.travellers?.[0]
  const adults = travelDetails.noOfAdults || 1
  const children = travelDetails.noOfChildren || 0
  const departure = new Date(issuedTrip?.departure_date || travelDetails.departureDate)
  const returning = new Date(issuedTrip?.return_date || travelDetails.returnDate)
  const days = getTripDays(departure, returning)
  const first = travelDetails.travelDetailList[0]
  const origin = countryLabel(first?.PlaceOfOrgin) || 'Philippines'
  const destination = issuedTrip?.destination_countries?.length
    ? issuedTrip.destination_countries
        .map((c) => COUNTRIES.find((x) => x.code === c)?.name || c)
        .join(', ')
    : travelDetails.travelDetailList.map((d) => countryLabel(d.TravelCountry)).filter(Boolean).join(', ')
  const carrierCode = apiData?.CarrierCode || coverageOption.carrierCode
  const provider = COMPANIES.find((c) => c.carrierCode === carrierCode)
  const brand = CARRIER_BRAND_COLORS[carrierCode]
  const insurer =
    provider?.companyName ||
    issued.insurer?.name ||
    apiData?.CarrierCode ||
    coverageOption.carrierCode ||
    '—'
  const planName = plan?.CarrierPlanDesc?.trim() || issued.plan?.name || apiData?.ProductName || 'Travel insurance'
  const customer = apiData?.PolicyCustomerList?.[0]
  const lead = getPrincipal(travelersInfo)
  const recipient =
    [paymentBillingDetails?.first_name, paymentBillingDetails?.last_name].filter(Boolean).join(' ') ||
    [customer?.FirstName, customer?.LastName].filter(Boolean).join(' ') ||
    [lead?.firstName, lead?.lastName].filter(Boolean).join(' ') ||
    [issuedLead?.first_name, issuedLead?.last_name].filter(Boolean).join(' ')
  const email = paymentBillingDetails?.email || customer?.Email || lead?.email || ''
  const policyNo = issued.policy_no || 'Pending'
  const proposalNumber = proposalNo || issued.proposal_number
  const paymentRef = paymentSubmitResponse?.data?.merchant_transaction_id || issued.external_reference || ''
  const total = Number(apiData?.DuePremium) || Number(issued.premium?.amount) || 0
  const method = selectedPaymentBrand?.value || '—'
  const paidAt = fmtPaidAt(issued.issued_at || paymentSubmitResponse?.data?.timestamp)
  const dates = formatTripRange(departure, returning)
  const travellers = issuedTrip?.traveler_count
    ? formatTravelers(issuedTrip.traveler_count, 0)
    : formatTravelers(adults, children)

  const refs = [
    { label: 'Policy number', value: policyNo },
    { label: 'Proposal number', value: proposalNumber },
    ...(paymentRef ? [{ label: 'Payment reference', value: paymentRef }] : []),
  ]

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopyStatus(`${label} copied.`)
    } catch {
      setCopyStatus(`Could not copy the ${label.toLowerCase()}. Select it and copy manually.`)
    }
    window.setTimeout(() => setCopyStatus(''), 3000)
  }

  const docData: PolicyDocData = {
    policyNo,
    proposalNo: proposalNumber,
    paymentRef: paymentRef || '—',
    planName,
    insurer,
    insurerLogoUrl: brand?.cardLogoTight || brand?.planCardLogo || provider?.image || plan?.LogoUrl || null,
    route: [origin, ...destination.split(', ')].join(' - '),
    dates,
    duration: formatDays(days),
    travellers,
    recipient,
    groups,
    total,
    paidAt,
    method,
  }

  const download = async (kind: Doc) => {
    setBusy(kind)
    setPdfError('')
    try {
      const m = await import('@/utils/generate-policy-pdfs')
      if (kind === 'coverage') await m.downloadCoverageSummary(docData)
      else await m.downloadReceipt(docData)
    } catch (err) {
      console.error('Policy PDF failed:', err)
      setPdfError('We could not create the PDF. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  const buyNew = () => {
    useTravelInsuranceStore.getState().resetForm()
    useFullQuoteResponseStore.getState().resetApiResponse()
    idFilesStore.clear()
    router.push(`/${agentCode}/travel-insurance`)
  }

  const downloadCls =
    'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#006838] px-5 py-3 text-sm font-semibold text-white hover:bg-[#00552e] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[#006838]'

  return (
    <main id="main" data-issued-page className="travel-results w-full">
      <div className="w-full mx-auto max-w-7xl">
        <section className="issued-confirmation" aria-labelledby="issued-title">
          <div className="issued-confirmation__icon">
            <FileCheck2 className="size-7" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="issued-eyebrow">Payment complete · Policy issued</p>
            <h1 id="issued-title" className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Your journey is covered.
            </h1>
            <p className="issued-muted mt-3 max-w-2xl text-base leading-7">
              Your travel insurance policy has been issued. Keep your coverage details and payment receipt together,
              wherever you go.
            </p>
            {email && (
              <div className="issued-email mt-5">
                <Mail className="size-5 shrink-0" aria-hidden />
                <p>
                  The official eCOC is sent to <strong className="font-semibold">{email}</strong>.
                </p>
              </div>
            )}
          </div>
        </section>

        <div className="issued-references" aria-label="Policy and payment references">
          {refs.map((r) => (
            <div key={r.label} className="issued-reference">
              <div className="min-w-0">
                <p className="issued-muted text-xs">{r.label}</p>
                <p className="mt-2 select-all break-all text-sm font-semibold">{r.value}</p>
              </div>
              <button
                type="button"
                onClick={() => copy(r.value, r.label)}
                aria-label={`Copy ${r.label.toLowerCase()}`}
                className="issued-copy"
              >
                Copy
              </button>
            </div>
          ))}
        </div>
        <p role="status" aria-live="polite" className="issued-copy-status text-sm">
          {copyStatus}
        </p>

        {/* ── Insurer documents ── */}
        <InsurerDocuments
          certUrl={issued.certificate_url ?? null}
          invoiceUrl={issued.invoice_url ?? null}
          insurer={insurer}
          policyNo={policyNo}
          email={email}
        />

        <div className="issued-layout">
          <section className="travel-applicant-card issued-documents" aria-labelledby="documents-title">
            <div className="issued-section-top">
              <div>
                <h2 id="documents-title" className="text-xl font-semibold">
                  Your documents
                </h2>
                <p className="issued-muted mt-2 text-sm leading-6">View your cover and keep a copy for your records.</p>
              </div>
              <span className="issued-badge">Ready to download</span>
            </div>

            <div className="issued-document-switch" role="group" aria-label="Choose a document">
              {(
                [
                  ['coverage', 'Coverage & benefits', FileCheck2, 'issued-coverage'],
                  ['receipt', 'Acknowledgement receipt', CreditCard, 'issued-receipt'],
                ] as const
              ).map(([key, label, Icon, controls]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDoc(key)}
                  aria-pressed={doc === key}
                  aria-controls={controls}
                  className={`issued-document-button${doc === key ? ' is-selected' : ''}`}
                >
                  <Icon className="size-5" aria-hidden />
                  {label}
                </button>
              ))}
            </div>

            {doc === 'coverage' ? (
              <section id="issued-coverage" aria-labelledby="coverage-title">
                <div className="issued-document-heading">
                  <p className="issued-eyebrow">{insurer}</p>
                  <h3 id="coverage-title" className="mt-2 text-2xl font-semibold">
                    {planName}
                  </h3>
                  <p className="issued-muted mt-2 text-sm">Travel insurance · {travellers}</p>
                </div>
                <dl className="issued-facts">
                  <div>
                    <dt>Recipient</dt>
                    <dd>{recipient || '—'}</dd>
                  </div>
                  <div>
                    <dt>Coverage period</dt>
                    <dd>{dates}</dd>
                  </div>
                  <div>
                    <dt>Trip route</dt>
                    <dd>{docData.route}</dd>
                  </div>
                  <div>
                    <dt>Travellers</dt>
                    <dd>{travellers}</dd>
                  </div>
                  <div>
                    <dt>Total premium paid</dt>
                    <dd>₱{money(total)}</dd>
                  </div>
                </dl>

                <div className="issued-benefits-heading">
                  <h4 className="font-semibold">Benefits and limits</h4>
                  <span className="issued-muted text-xs">Amounts in PHP unless stated</span>
                </div>
                {groups.map((g) => (
                  <details key={g.title} open className="issued-benefit-group">
                    <summary>
                      <h5 className="font-semibold">{g.title}</h5>
                      <ChevronDown className="size-4 shrink-0" aria-hidden />
                    </summary>
                    <div>
                      <dl>
                        {g.rows.map((r, i) => (
                          <div key={i} className="issued-benefit-row">
                            <dt>{r.label}</dt>
                            <dd className="font-semibold">
                              {r.value}
                              {r.note && <span className="travel-benefit-note">{r.note}</span>}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </details>
                ))}
                {groups.length > 0 && <KeyConditions />}
                {!groups.length && (
                  <p className="issued-muted text-sm">Benefit details are listed in your policy wording.</p>
                )}

                <div className="issued-document-note">
                  <CircleHelp className="mt-0.5 size-5 shrink-0" aria-hidden />
                  <p>
                    This summary is for easy reference. The insurer’s official eCOC and policy wording govern your
                    cover. Conditions and exclusions apply.
                  </p>
                </div>
                <button type="button" disabled={busy !== null} onClick={() => download('coverage')} className={downloadCls}>
                  <FileCheck2 className="size-5" aria-hidden />
                  {busy === 'coverage' ? 'Preparing PDF…' : 'Download cover notes (PDF)'}
                </button>
                <p className="issued-muted mt-3 text-center text-xs leading-5">
                  The official eCOC is delivered by email and shown in the insurer documents section above.
                </p>
              </section>
            ) : (
              <section id="issued-receipt" aria-labelledby="receipt-title">
                <div className="issued-receipt-heading">
                  <div>
                    <p className="issued-eyebrow">Payment confirmation</p>
                    <h3 id="receipt-title" className="mt-2 text-2xl font-semibold">
                      Acknowledgement receipt
                    </h3>
                    {paymentRef && <p className="issued-muted mt-2 break-all text-sm">{paymentRef}</p>}
                  </div>
                  <span className="issued-badge">Paid</span>
                </div>
                <dl className="issued-facts">
                  <div>
                    <dt>Received from</dt>
                    <dd>{recipient || '—'}</dd>
                  </div>
                  <div>
                    <dt>Payment date</dt>
                    <dd>{paidAt}</dd>
                  </div>
                  <div>
                    <dt>Payment method</dt>
                    <dd>{method}</dd>
                  </div>
                  <div>
                    <dt>Payment reference</dt>
                    <dd>{paymentRef || '—'}</dd>
                  </div>
                  <div>
                    <dt>Policy number</dt>
                    <dd>{policyNo}</dd>
                  </div>
                  <div>
                    <dt>Currency</dt>
                    <dd>PHP · Philippine peso</dd>
                  </div>
                </dl>
                <div className="issued-receipt-line">
                  <div>
                    <h4 className="font-semibold">Travel insurance premium</h4>
                    <p className="issued-muted mt-2 text-sm leading-6">
                      {planName}
                      <br />
                      {dates} · {travellers}
                    </p>
                  </div>
                  <span className="whitespace-nowrap font-semibold">₱{money(total)}</span>
                </div>
                <div className="issued-receipt-total">
                  <span className="text-base font-semibold">Total amount received</span>
                  <strong className="text-3xl tracking-tight">₱{money(total)}</strong>
                </div>
                <div className="issued-document-note">
                  <CircleHelp className="mt-0.5 size-5 shrink-0" aria-hidden />
                  <p>This acknowledgement records payment. It does not replace the insurer’s invoice or your eCOC.</p>
                </div>
                <button type="button" disabled={busy !== null} onClick={() => download('receipt')} className={downloadCls}>
                  <CreditCard className="size-5" aria-hidden />
                  {busy === 'receipt' ? 'Preparing PDF…' : 'Download acknowledgement receipt (PDF)'}
                </button>
              </section>
            )}
            {pdfError && (
              <p role="alert" className="mt-3 text-sm text-[#b91c1c] dark:text-[#fca5a5]">
                {pdfError}
              </p>
            )}
          </section>

          <aside className="issued-sidebar" aria-label="Your trip and payment summary">
            <section className="travel-applicant-card issued-trip">
              <p className="issued-eyebrow">Your insured trip</p>
              <div className="issued-trip-route">
                <span>{origin}</span>
                <PlaneTakeoff className="size-6" aria-hidden />
                <span>{destination}</span>
              </div>
              <dl className="issued-trip-facts">
                <div>
                  <dt>Travel dates</dt>
                  <dd>{dates}</dd>
                </div>
                <div>
                  <dt>Duration</dt>
                  <dd>{formatDays(days)}</dd>
                </div>
                <div>
                  <dt>Travellers</dt>
                  <dd>{travellers}</dd>
                </div>
                <div>
                  <dt>Insurer</dt>
                  <dd>{insurer}</dd>
                </div>
              </dl>
              <div className="issued-paid">
                <div className="flex items-center justify-between gap-3">
                  <span className="issued-muted text-sm">Total premium paid</span>
                  <span className="issued-badge">Paid</span>
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-tight">₱{money(total)}</p>
              </div>
            </section>
            <section className="issued-next">
              <h2 className="font-semibold">Before you travel</h2>
              <p className="issued-muted mt-2 text-sm leading-7">
                Save your documents offline and check your emailed eCOC for the insurer’s assistance and claims contact
                details.
              </p>
              <button
                type="button"
                onClick={buyNew}
                className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#006838] underline-offset-4 hover:underline dark:text-[#d0e3c8]"
              >
                Buy new travel insurance
                <ArrowUpRight className="size-4" aria-hidden />
              </button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}
