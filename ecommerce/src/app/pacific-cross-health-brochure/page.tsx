'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const plans = [
  {
    name: 'Select ER',
    description: 'Coverage for the treatment of an emergency medical condition in the Emergency Room as Out-Patient or as In-Patient.',
    issueAge: '15 days - 65 years old',
    waitingPeriod: '7 days',
    options: [
      { label: 'Plan A', maxBenefit: '₱5,000.00', premium: '499' },
      { label: 'Plan B', maxBenefit: '₱10,000.00', premium: '849' },
      { label: 'Plan C', maxBenefit: '₱20,000.00', premium: '1,199' },
    ],
  },
  {
    name: 'Select Assist',
    description: 'Coverage for the treatment of emergency medical condition as In-Patient.',
    issueAge: '15 days - 65 years old',
    waitingPeriod: '7 days',
    options: [
      { label: 'Plan A', maxBenefit: '₱10,000.00', premium: '1,499' },
      { label: 'Plan B', maxBenefit: '₱20,000.00', premium: '2,699' },
      { label: 'Plan C', maxBenefit: '₱30,000.00', premium: '3,899' },
    ],
  },
  {
    name: 'Select MedSecure',
    description: 'Coverage for post-hospitalization prescribed medicines.',
    issueAge: '15 days - 60 years old',
    waitingPeriod: '15 days',
    options: [
      { label: 'Plan A', maxBenefit: '₱2,000.00', premium: '549' },
      { label: 'Plan B', maxBenefit: '₱2,500.00', premium: '649' },
      { label: 'Plan C', maxBenefit: '₱5,000.00', premium: '950' },
    ],
  },
  {
    name: 'Select DengueGuard',
    description: 'Coverage for medically diagnosed Dengue.',
    issueAge: 'Any age',
    waitingPeriod: '15 days',
    options: [
      { label: 'Single Plan', maxBenefit: '₱10,000.00', premium: '325' },
    ],
  },
  {
    name: 'Select COVID-19 Care',
    description: 'Coverage for the In-Patient treatment of COVID-19 and Serious Adverse Effects of COVID-19 vaccination.',
    issueAge: '15 days - 65 years old',
    waitingPeriod: '15 days',
    options: [
      { label: 'Plan 30', maxBenefit: '₱30,000.00', premium: '579' },
      { label: 'Plan 100', maxBenefit: '₱100,000.00', premium: '1,999' },
      { label: 'Plan 500', maxBenefit: '₱500,000.00', premium: '4,670 - 11,850' },
    ],
  },
]

const faqs = [
  { q: 'What is the eligibility age in order to avail of a Select Prepaid Insurance Plan?', a: 'Eligibility age refers to the Issue Age specified under each Prepaid Plan. The issue age is the age of the Insured Person at the time of purchase and registration.' },
  { q: 'Can I use my Select Prepaid Insurance Plan for claims incurred immediately after successful registration?', a: 'No. Please refer to the specific Effective Date after successful registration indicated under each Prepaid Plan as well as other information described under Plan Benefits and Limitations.' },
  { q: 'Can I get insured under several Select Prepaid Insurance Plans?', a: 'Yes. An Insured Person can have all 5 Prepaid Insurance Plans but only 1 Plan Option can be chosen per Period of Insurance. You can buy multiple Prepaid Insurance Plans that should be registered under the name of an Insured Person.' },
  { q: 'How do I file a claim?', a: 'Please submit the necessary claims requirements to Pacific Cross Customer Services team via e-mail claims@pacificcross.com.ph.' },
  { q: 'How will I receive my claims reimbursements?', a: 'Pacific Cross will credit the approved claims reimbursement of the Client to his/her nominated bank account.' },
  { q: 'What happens to my coverage if my claim was denied?', a: 'If the claim was denied, the Select Prepaid Insurance will remain active within the Period of Insurance. Period of Insurance means a validity of 1 year from Effective Date but Policy terminates once claim is approved.' },
]

export default function PacificCrossHealthBrochurePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="flex items-center gap-3">
            <Image src="/images/providers/5 Pacific Cross.svg" alt="Pacific Cross" width={100} height={40} className="h-8 w-auto" />
            <h1 className="text-lg font-bold text-gray-900">Select Prepaid Insurance Plans</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 space-y-10">
        {/* Hero */}
        <section className="text-center space-y-3">
          <h2 className="text-3xl font-black text-gray-900 sm:text-4xl">Pacific Cross Select Prepaid Insurance Plans</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Get yours today and avail of reimbursement or cash assistance for COVID-19, medical emergencies, dengue and post-hospitalization prescribed medications.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">Philippine availment only</span>
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">Valid for 1 year</span>
            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">Terminates once claim is approved</span>
          </div>
        </section>

        {/* Important Notes */}
        <section className="rounded-xl border border-blue-200 bg-blue-50 p-5 space-y-2">
          <h3 className="font-bold text-blue-900">Important Notes</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li><strong>Period of Insurance:</strong> Valid for 1 year from Effective Date but Policy will be terminated once claim is approved.</li>
            <li><strong>Waiting Period:</strong> Number of days from the date of purchase and registration of the Insured Person before the Effective Date indicated in the Policy.</li>
            <li>For every Insured Person, you can buy all 5 Prepaid Insurance Plans by choosing 1 Plan Option per Period of Insurance.</li>
          </ul>
        </section>

        {/* Plans */}
        <section className="space-y-6">
          <h3 className="text-2xl font-bold text-gray-900">Available Plans</h3>
          {plans.map((plan) => (
            <div key={plan.name} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="bg-gradient-to-r from-[#1a3a6b] to-[#2a5298] px-5 py-3">
                <h4 className="text-lg font-bold text-white">{plan.name}</h4>
                <p className="text-blue-100 text-sm">{plan.description}</p>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                  <span>Issue Age: <strong className="text-gray-700">{plan.issueAge}</strong></span>
                  <span>Waiting Period: <strong className="text-gray-700">{plan.waitingPeriod}</strong></span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="py-2 text-left font-medium text-gray-500">Plan Option</th>
                        <th className="py-2 text-left font-medium text-gray-500">Max Benefit Limit (Up to)</th>
                        <th className="py-2 text-right font-medium text-gray-500">Premium</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.options.map((opt) => (
                        <tr key={opt.label} className="border-b border-gray-50 last:border-0">
                          <td className="py-2 font-medium text-gray-900">{opt.label}</td>
                          <td className="py-2 text-gray-700">{opt.maxBenefit}</td>
                          <td className="py-2 text-right font-bold text-primary">₱{opt.premium}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Plan Benefits */}
        <section className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-900">Plan Benefits and Limitations</h3>
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3 text-sm text-gray-700">
            <ul className="list-disc list-inside space-y-2">
              <li>Defrays the out-patient or in-patient medical treatment cost for an eligible emergency condition occurring during the Period of Insurance. Once claim is approved, the limit is considered fully exhausted, and Policy is automatically terminated.</li>
              <li>Effective Date is on the 7th day after successful registration.</li>
              <li>Coverage for single occurrence of an eligible emergency condition happening within the Period of Insurance and availed of through either:
                <ul className="list-[lower-alpha] list-inside ml-4 mt-1 space-y-1">
                  <li>Reimbursement or direct settlement of actual medical cost incurred in the Emergency Room Department of an accredited Hospital, or</li>
                  <li>Reimbursement of lump sum cash assistance for the Emergency In-Patient treatment regardless of the incurred medical cost.</li>
                </ul>
              </li>
              <li>Only 1 Plan Option per Period of Insurance is allowed.</li>
              <li>This Prepaid Plan does not cover claims related to confinement purely for diagnostic purposes, epidemic/pandemic, congenital, STD, AIDS/HIV, Pregnancy, autoimmune conditions, mental or nervous/anxiety disorder, degenerative brain disorder, suicide and accidents resulting from hazardous activity or substance abuse, professional sports and contact sports, among others.</li>
            </ul>
          </div>
        </section>

        {/* FAQs */}
        <section className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h3>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="font-semibold text-gray-900 text-sm">{faq.q}</p>
                <p className="mt-1 text-sm text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 text-center space-y-2">
          <p className="text-sm text-gray-600">For full list of exclusions, terms, and conditions, please ask for a specimen Policy via e-mail</p>
          <p className="font-semibold text-primary">client_services@pacificcross.com.ph</p>
          <p className="text-sm text-gray-500">Pacific Cross Hotline: +63 2 8230-8511</p>
          <a href="/files/pacific-cross-select-er-brochure.pdf" target="_blank" className="inline-block mt-3 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary/90">
            Download PDF Brochure
          </a>
        </section>
      </div>
    </div>
  )
}
