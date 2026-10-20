'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'

const plans = [
  {
    name: 'Select ER',
    description: 'Emergency room — out-patient or in-patient',
    fullDescription: 'Coverage for the treatment of an emergency medical condition in the Emergency Room as Out-Patient or as In-Patient.',
    issueAge: '15 days – 65 years old',
    waitingPeriod: '7 days',
    accentColor: 'from-primary to-primary/80',
    options: [
      { label: 'Plan A', maxBenefit: '₱5,000', premium: '499' },
      { label: 'Plan B', maxBenefit: '₱10,000', premium: '849' },
      { label: 'Plan C', maxBenefit: '₱20,000', premium: '1,199' },
    ],
  },
  {
    name: 'Select Assist',
    description: 'Emergency medical condition — in-patient',
    fullDescription: 'Coverage for the treatment of emergency medical condition as In-Patient.',
    issueAge: '15 days – 65 years old',
    waitingPeriod: '7 days',
    accentColor: 'from-primary to-primary/80',
    options: [
      { label: 'Plan A', maxBenefit: '₱10,000', premium: '1,499' },
      { label: 'Plan B', maxBenefit: '₱20,000', premium: '2,699' },
      { label: 'Plan C', maxBenefit: '₱30,000', premium: '3,899' },
    ],
  },
  {
    name: 'Select MedSecure',
    description: 'Post-hospitalization prescribed medicines',
    fullDescription: 'Coverage for post-hospitalization prescribed medicines.',
    issueAge: '15 days – 60 years old',
    waitingPeriod: '15 days',
    accentColor: 'from-primary to-primary/80',
    options: [
      { label: 'Plan A', maxBenefit: '₱2,000', premium: '549' },
      { label: 'Plan B', maxBenefit: '₱2,500', premium: '649' },
      { label: 'Plan C', maxBenefit: '₱5,000', premium: '950' },
    ],
  },
  {
    name: 'Select DengueGuard',
    description: 'Medically diagnosed dengue — any age',
    fullDescription: 'Coverage for medically diagnosed Dengue.',
    issueAge: 'Any age',
    waitingPeriod: '15 days',
    accentColor: 'from-primary to-primary/80',
    options: [
      { label: 'Single Plan', maxBenefit: '₱10,000', premium: '325' },
    ],
  },
  {
    name: 'Select COVID-19 Care',
    description: 'In-patient COVID-19 treatment + vaccine adverse effects',
    fullDescription: 'Coverage for the In-Patient treatment of COVID-19 and Serious Adverse Effects of COVID-19 vaccination.',
    issueAge: '15 days – 65 years old',
    waitingPeriod: '15 days',
    accentColor: 'from-primary to-primary/80',
    options: [
      { label: 'Plan 30', maxBenefit: '₱30,000', premium: '579' },
      { label: 'Plan 100', maxBenefit: '₱100,000', premium: '1,999' },
      { label: 'Plan 500', maxBenefit: '₱500,000', premium: '4,670 – 11,850' },
    ],
  },
]

const benefits = [
  {
    icon: '🏥',
    title: 'ER & in-patient coverage',
    desc: 'Covers actual medical cost in the Emergency Room of an accredited hospital — as out-patient or in-patient, via reimbursement or direct settlement.',
    color: 'bg-primary/10 text-blue-700',
    border: 'border-l-primary',
  },
  {
    icon: '💵',
    title: 'Lump-sum cash assistance',
    desc: 'In-patient emergency treatment qualifies for lump-sum reimbursement regardless of actual medical cost incurred.',
    color: 'bg-success/10 text-success',
    border: 'border-l-green-500',
  },
  {
    icon: '🔄',
    title: 'All 5 plans allowed',
    desc: 'One insured person may hold all 5 prepaid plans simultaneously — only 1 option per plan per period of insurance.',
    color: 'bg-primary/10 text-blue-700',
    border: 'border-l-primary',
  },
  {
    icon: '📅',
    title: '1-year validity',
    desc: 'Coverage runs for 1 full year from the Effective Date. If no claim is filed, the policy stays active until expiry.',
    color: 'bg-warning/10 text-warning',
    border: 'border-l-amber-500',
  },
]

const exclusions = [
  'Diagnostic confinement', 'Epidemic / pandemic', 'Congenital conditions',
  'STD', 'AIDS / HIV', 'Pregnancy', 'Autoimmune', 'Mental / anxiety disorders',
  'Degenerative brain disorder', 'Suicide', 'Hazardous activities',
  'Substance abuse', 'Professional sports', 'Contact sports',
]

const timelineSteps = [
  { icon: '🛒', label: 'Purchase & register', sub: '' },
  { icon: '⏱', label: 'Wait 7–15 days', sub: 'per plan' },
  { icon: '🛡', label: 'Coverage active', sub: 'up to 1 year' },
  { icon: '📋', label: 'File a claim', sub: '' },
  { icon: '⚡', label: 'Policy terminates', sub: 'on approval' },
]

const faqs = [
  {
    q: 'What is the eligibility age?',
    a: 'Issue Age is the age of the insured at the time of purchase and registration. Each plan has its own issue age range — from 15 days old up to 60 or 65 years, depending on the plan. DengueGuard accepts any age.',
  },
  {
    q: 'Can I claim immediately after registration?',
    a: 'No. A waiting period applies before coverage begins. Select ER and Select Assist have a 7-day waiting period; Select MedSecure, DengueGuard, and COVID-19 Care have a 15-day waiting period from the date of purchase and registration.',
  },
  {
    q: 'Can I hold multiple plans at once?',
    a: 'Yes — you can purchase all 5 prepaid plans for a single insured person. However, only 1 plan option may be selected per plan per period of insurance. Each plan must be registered under the insured person\'s name.',
  },
  {
    q: 'How do I file a claim?',
    a: 'Submit the required claims documents to Pacific Cross Customer Services via email at claims@pacificcross.com.ph. Once your claim is approved, reimbursement will be credited directly to your nominated bank account.',
  },
  {
    q: 'What happens if my claim is denied?',
    a: 'If your claim is denied, your policy remains active for the full Period of Insurance (up to 1 year from Effective Date). The policy only terminates once a claim is approved — a denial keeps your coverage intact.',
  },
  {
    q: 'How will I receive my reimbursement?',
    a: 'Pacific Cross will credit approved reimbursements directly to your nominated bank account. Make sure your bank details are up to date when filing your claim.',
  },
]

function PlanCard({ plan }: { plan: typeof plans[0] }) {
  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <div className={`bg-gradient-to-r ${plan.accentColor} px-5 py-4`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="text-base font-semibold text-white">{plan.name}</h4>
            <p className="text-green-100 text-xs mt-0.5">{plan.description}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
            <span className="text-[10px] font-medium bg-white/10 text-green-50 border border-white/20 rounded-full px-2.5 py-1">
              {plan.issueAge}
            </span>
            <span className="text-[10px] font-medium bg-white/10 text-green-50 border border-white/20 rounded-full px-2.5 py-1">
              {plan.waitingPeriod} wait
            </span>
          </div>
        </div>
      </div>
      <div className="p-5">
        {plan.options.length === 1 ? (
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-foreground">{plan.options[0].label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Up to {plan.options[0].maxBenefit}</p>
            </div>
            <p className="text-xl font-bold text-primary">₱{plan.options[0].premium}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 text-[11px] text-muted-foreground font-medium pb-2 border-b border-border mb-1">
              <span>Option</span>
              <span>Max benefit</span>
              <span className="text-right">Premium</span>
            </div>
            {plan.options.map((opt) => (
              <div key={opt.label} className="grid grid-cols-3 items-center py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm font-medium text-foreground">{opt.label}</span>
                <span className="text-sm text-muted-foreground">{opt.maxBenefit}</span>
                <span className="text-sm font-bold text-primary text-right">₱{opt.premium}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function FaqItem({ faq, index, open, onToggle }: {
  faq: typeof faqs[0]
  index: number
  open: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={`rounded-xl border bg-white overflow-hidden transition-colors ${open ? 'border-primary' : 'border-border'}`}
    >
      <button
        className="w-full flex items-center gap-3 px-4 py-4 text-left"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span
          className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-semibold flex-shrink-0 transition-colors ${open ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}
        >
          {index + 1}
        </span>
        <span className="flex-1 text-sm font-medium text-foreground">{faq.q}</span>
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-transform ${open ? 'rotate-180 text-primary' : 'text-muted-foreground'}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 pl-[52px] border-t border-border pt-3">
          <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
        </div>
      )}
    </div>
  )
}

export default function PacificCrossHealthBrochurePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Sticky header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <span className="text-sm font-semibold text-foreground">Select Prepaid Insurance Plans</span>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 space-y-10">

        {/* ── Hero ── */}
        <section className="relative rounded-2xl bg-primary px-6 py-8 overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-white/[0.03]" />
          <div className="absolute -bottom-12 left-1/3 w-36 h-36 rounded-full bg-white/[0.03]" />

          <p className="text-[10px] font-semibold tracking-widest text-green-300 uppercase mb-2">Pacific Cross · Select Series</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-snug mb-3">
            Select Prepaid Insurance Plans
          </h1>
          <p className="text-green-200 text-sm max-w-xl leading-relaxed mb-5">
            Reimbursement and cash assistance for medical emergencies, COVID-19, dengue, and
            post-hospitalization medicines — valid for 1 year.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-900/60 border border-success px-3 py-1 text-[11px] font-medium text-green-200">
              📍 Philippine availment only
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-900/50 border border-success px-3 py-1 text-[11px] font-medium text-green-200">
              📅 Valid for 1 year
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-900/50 border border-amber-700 px-3 py-1 text-[11px] font-medium text-amber-200">
              ⚡ Terminates once claim is approved
            </span>
          </div>
        </section>

        {/* ── Important Notes ── */}
        <section className="rounded-xl border-l-4 border-primary bg-primary/5 px-5 py-4 space-y-1.5">
          <h3 className="text-sm font-semibold text-primary">Important notes</h3>
          <ul className="text-xs text-foreground space-y-1 list-disc list-inside leading-relaxed">
            <li><strong>Period of Insurance:</strong> Valid for 1 year from Effective Date — terminated once a claim is approved.</li>
            <li><strong>Waiting Period:</strong> Number of days from purchase before coverage begins.</li>
            <li>You may purchase all 5 plans, but only 1 option per plan per period.</li>
          </ul>
        </section>

        {/* ── Plans ── */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Available plans</h2>

          {/* Top 2 plans full-width */}
          {plans.slice(0, 2).map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}

          {/* MedSecure + DengueGuard side by side */}
          <div className="grid sm:grid-cols-2 gap-4">
            {plans.slice(2, 4).map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </div>

          {/* COVID-19 full-width */}
          <PlanCard plan={plans[4]} />
        </section>

        {/* ── Plan Benefits & Limitations ── */}
        <section className="space-y-5">
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-primary uppercase mb-1">Coverage details</p>
            <h2 className="text-xl font-bold text-foreground">Plan benefits &amp; limitations</h2>
          </div>

          {/* How it works timeline */}
          <div className="rounded-xl border border-border bg-white p-5">
            <p className="text-xs font-medium text-muted-foreground mb-5 flex items-center gap-1.5">
              <span className="text-primary">→</span> How your coverage works
            </p>
            <div className="flex items-start gap-0 overflow-x-auto pb-1">
              {timelineSteps.map((step, i) => (
                <div key={step.label} className="flex items-center flex-shrink-0">
                  <div className="flex flex-col items-center w-20 sm:w-24">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg mb-2 ${
                      i === 0 ? 'bg-primary/10' :
                      i === 2 ? 'bg-success/10' :
                      i === 3 ? 'bg-warning/10' :
                      i === 4 ? 'bg-destructive/10' : 'bg-primary/10'
                    }`}>
                      {step.icon}
                    </div>
                    <p className="text-[10px] font-medium text-foreground text-center leading-tight">{step.label}</p>
                    {step.sub && <p className="text-[9px] text-muted-foreground text-center mt-0.5">{step.sub}</p>}
                  </div>
                  {i < timelineSteps.length - 1 && (
                    <div className="w-8 sm:w-12 h-px bg-primary/30 flex-shrink-0 mb-5" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Benefit cards */}
          <div className="grid sm:grid-cols-2 gap-3">
            {benefits.map((b) => (
              <div key={b.title} className={`rounded-xl border border-border border-l-4 ${b.border} bg-white p-4 flex gap-3`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${b.color}`}>
                  {b.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{b.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Exclusions */}
          <div className="rounded-xl bg-destructive/10 border border-red-100 p-4">
            <p className="text-xs font-semibold text-destructive mb-3 flex items-center gap-1.5">
              <span>🚫</span> Not covered under this plan
            </p>
            <div className="flex flex-wrap gap-2">
              {exclusions.map((ex) => (
                <span
                  key={ex}
                  className="inline-block rounded-full bg-white border border-destructive/50 px-3 py-1 text-[10px] font-medium text-destructive"
                >
                  {ex}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="space-y-4">
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-primary uppercase mb-1">Need to know</p>
            <h2 className="text-xl font-bold text-foreground">Frequently asked questions</h2>
          </div>

          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <FaqItem
                key={i}
                faq={faq}
                index={i}
                open={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </div>

          {/* Still have questions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl border border-border bg-white p-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
              ✉️
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Still have questions?</p>
              <p className="text-xs text-muted-foreground mt-0.5">Request a specimen policy or reach Pacific Cross directly</p>
            </div>
            <div className="text-right sm:flex-shrink-0">
              <p className="text-sm font-semibold text-primary">client_services@pacificcross.com.ph</p>
              <p className="text-xs text-muted-foreground">+63 2 8230-8511</p>
            </div>
          </div>
        </section>

        {/* ── Contact / CTA ── */}
        <section className="rounded-xl border border-border bg-white p-6 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            For the full list of exclusions, terms, and conditions, please ask for a specimen Policy via email
          </p>
          <p className="text-base font-semibold text-primary">client_services@pacificcross.com.ph</p>
          <p className="text-sm text-muted-foreground">Pacific Cross Hotline: +63 2 8230-8511</p>
          <a
            href="/files/pacific-cross-select-er-brochure.pdf"
            target="_blank"
            className="inline-block mt-2 rounded-full bg-primary px-7 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            Download PDF Brochure
          </a>
        </section>

      </div>
    </div>
  )
}
