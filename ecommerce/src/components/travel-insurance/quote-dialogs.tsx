'use client'

import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { Loader2, X } from 'lucide-react'
import { PH_ID_TYPES, PersonalInfoFormData } from '@/types/travel-insurance/travel-insurance-request'
import { getCityNameByCityCode, getProvinceNameByProvCode } from '@/utils/address-util'
import { titleCase } from '@/utils/trip-summary'

const outlineBtn =
  'inline-flex min-h-11 items-center justify-center rounded-md border border-[#006838] px-4 py-2 text-sm font-semibold text-[#006838] hover:bg-[#f1f2f0] dark:border-[#707873] dark:text-[#f4f5f2] dark:hover:bg-[#303232]'

function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.addEventListener('close', onClose)
    return () => el.removeEventListener('close', onClose)
  }, [onClose])
  return ref
}

function CloseX({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      autoFocus
      onClick={onClick}
      aria-label={label}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-md hover:bg-[#f1f2f0] focus-visible:outline-2 focus-visible:outline-[#006838] dark:hover:bg-[#303232]"
    >
      <X className="size-5" aria-hidden />
    </button>
  )
}

export function DataSharingDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useDialog(open, onClose)
  return (
    <dialog
      ref={ref}
      aria-labelledby="data-sharing-title"
      aria-describedby="data-sharing-intro"
      className="travel-plan-dialog"
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="flex items-start justify-between gap-4">
        <h2 id="data-sharing-title" className="text-xl font-semibold">
          Data sharing agreement
        </h2>
        <CloseX label="Close data sharing agreement" onClick={onClose} />
      </div>
      <p id="data-sharing-intro" className="mt-4 text-sm leading-6">
        By agreeing, you authorise the use and sharing of the information provided for this insurance application,
        subject to the following:
      </p>
      <ol className="mt-5 list-decimal space-y-4 pl-5 text-sm leading-6">
        <li><strong>Purpose.</strong> Information may be used to assess the application, verify identity, administer cover and process claims.</li>
        <li><strong>Recipients.</strong> Relevant information may be shared with the selected insurer and authorised service providers only as needed for these purposes or as required by law.</li>
        <li><strong>Protection.</strong> Information should be handled securely and retained only for the applicable service and legal requirements.</li>
        <li><strong>Your choices.</strong> You may request access or corrections, or ask about withdrawing consent, by contacting One Insurance. Withdrawal may affect the services that can be provided.</li>
        <li><strong>Other travellers.</strong> When providing information for another person, you confirm that you have their authority or are authorised to act for a minor.</li>
      </ol>
      <button type="button" onClick={onClose} className={`${outlineBtn} mt-6`}>
        Close
      </button>
    </dialog>
  )
}

export interface ReviewTrip {
  route: string
  dates: string
  duration: string
  travellers: string
  tripType: string
  planType: string
}

interface ReviewDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: () => void
  submitting: boolean
  error: { message: string; details: string[] } | null
  trip: ReviewTrip
  travellers: PersonalInfoFormData[]
  adults: number
  insurer: string
  planName: string
  addons: string[]
}

const Row = ({ label, value, wide }: { label: string; value?: string | null; wide?: boolean }) => (
  <div className={`min-w-0 ${wide ? 'sm:col-span-2' : ''}`}>
    <dt className="text-[#808080] dark:text-[#c4c7c5]">{label}</dt>
    <dd className="mt-1 break-words font-medium">{value || 'Not provided'}</dd>
  </div>
)

function ApprovalForm({
  onClose,
  onSubmit,
  submitting,
  error,
}: Pick<ReviewDialogProps, 'onClose' | 'onSubmit' | 'submitting' | 'error'>) {
  const [approved, setApproved] = useState(false)
  return (
    <form
      className="mt-6 border-t border-[#dfe7df] pt-6 dark:border-[#3d4140]"
      onSubmit={(e) => {
        e.preventDefault()
        if (approved && !submitting) onSubmit()
      }}
    >
      <label className="flex items-start gap-3 text-sm leading-6">
        <input
          type="checkbox"
          checked={approved}
          onChange={(e) => setApproved(e.target.checked)}
          className="mt-1 size-4 shrink-0 accent-[#006838]"
        />
        <span>I have reviewed the details above and approve this application for submission.</span>
      </label>
      <p className="mt-3 text-xs leading-5 text-[#808080] dark:text-[#c4c7c5]">
        Generated proposals cannot be edited. Changes after submission require cancellation and a new quote.
      </p>
      {error && (
        <div role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
          <p>{error.message}</p>
          {error.details.length > 0 && (
            <ul className="mt-1 list-disc pl-5">
              {error.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} disabled={submitting} className={outlineBtn}>
          Back to edit
        </button>
        <button
          type="submit"
          disabled={!approved || submitting}
          className="btn-primary inline-flex min-h-11 items-center justify-center gap-2 px-5 py-3 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden /> Generating quote…
            </>
          ) : (
            'Approve and submit →'
          )}
        </button>
      </div>
    </form>
  )
}

const sectionTitle = 'text-lg font-semibold text-[#006838] dark:text-[#d0e3c8]'

export function ReviewDialog({
  open,
  onClose,
  onSubmit,
  submitting,
  error,
  trip,
  travellers,
  adults,
  insurer,
  planName,
  addons,
}: ReviewDialogProps) {
  const ref = useDialog(open, onClose)
  return (
    <dialog
      ref={ref}
      aria-labelledby="application-review-title"
      aria-describedby="application-review-description"
      className="travel-plan-dialog travel-application-review"
      onClick={(e) => e.target === ref.current && !submitting && onClose()}
    >
      <div className="flex items-start justify-between gap-4">
        <h2 id="application-review-title" className="text-xl font-semibold">
          Review your application
        </h2>
        <CloseX label="Close application review" onClick={onClose} />
      </div>
      <p id="application-review-description" className="mt-3 text-sm leading-6 text-[#808080] dark:text-[#c4c7c5]">
        Check the travel, identity and plan details below before approving and submitting your application.
      </p>

      <div className="mt-6 space-y-6">
        <section aria-labelledby="review-trip-title">
          <h3 id="review-trip-title" className={sectionTitle}>Travel details</h3>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <Row label="Route" value={trip.route} />
            <Row label="Travel dates" value={trip.dates} />
            <Row label="Duration" value={trip.duration} />
            <Row label="Travellers" value={trip.travellers} />
            <Row label="Trip type" value={trip.tripType} />
            <Row label="Plan type" value={trip.planType} />
          </dl>
        </section>

        <section aria-labelledby="review-kyc-title" className="border-t border-[#dfe7df] pt-6 dark:border-[#3d4140]">
          <h3 id="review-kyc-title" className={sectionTitle}>Traveller KYC details</h3>
          <div className="mt-4 space-y-6">
            {travellers.map((t, i) => {
              const name = [t.firstName, t.middleName, t.lastName, t.suffix && t.suffix !== 'No Suffix' ? t.suffix : '']
                .filter(Boolean)
                .join(' ')
              const address = [
                t.address.line1,
                t.address.line2,
                titleCase(getCityNameByCityCode(t.address.city) ?? ''),
                titleCase(getProvinceNameByProvCode(t.address.province) ?? ''),
                t.address.zipCode,
              ]
                .filter(Boolean)
                .join(', ')
              return (
                <div key={i}>
                  <h4 className="font-semibold">
                    Traveller {i + 1} · {i < adults ? 'Adult' : 'Child'}
                  </h4>
                  <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
                    <Row label="Full name" value={name} />
                    <Row label="Gender" value={t.gender === 'M' ? 'Male' : 'Female'} />
                    <Row label="Date of birth" value={t.dateOfBirth ? format(t.dateOfBirth, 'MMM d, yyyy') : ''} />
                    <Row label="Email" value={t.email} />
                    <Row label="Mobile" value={t.mobileNumber ? `+63 ${t.mobileNumber}` : ''} />
                    <Row label="ID type" value={PH_ID_TYPES[t.idType]} />
                    <Row label="ID number" value={t.idNumber} />
                    <Row label="Address" value={address} wide />
                    <Row label="Front of ID" value={t.idFrontUploaded ? 'Uploaded' : ''} />
                    <Row label="Back of ID" value={t.idBackUploaded ? 'Uploaded' : 'Not provided (optional)'} />
                    <Row label="Fully vaccinated against COVID-19" value={t.isCovidVaccinated ? 'Yes' : 'No'} />
                    <Row label="Data sharing agreement" value={t.is_data_sharing_consent ? 'Agreed' : 'Not agreed'} />
                    {t.hasBeneficiary && (
                      <>
                        <Row
                          label="Beneficiary"
                          value={[t.beneficiary.firstName, t.beneficiary.middleName, t.beneficiary.lastName].filter(Boolean).join(' ')}
                        />
                        <Row label="Relationship" value={t.beneficiary.relationship} />
                      </>
                    )}
                  </dl>
                </div>
              )
            })}
          </div>
        </section>

        <section aria-labelledby="review-plan-title" className="border-t border-[#dfe7df] pt-6 dark:border-[#3d4140]">
          <h3 id="review-plan-title" className={sectionTitle}>Plan details</h3>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <Row label="Insurer" value={insurer} />
            <Row label="Selected plan" value={planName} />
          </dl>
          <div className="mt-5">
            <h4 className="font-semibold">Selected add-ons</h4>
            {addons.length ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                {addons.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-[#808080] dark:text-[#c4c7c5]">No add-ons added</p>
            )}
            {addons.length > 0 && (
              <p className="mt-3 text-xs text-[#808080] dark:text-[#c4c7c5]">
                Add-ons are priced when your quote is generated.
              </p>
            )}
          </div>
        </section>
      </div>

      {open && (
        <ApprovalForm onClose={onClose} onSubmit={onSubmit} submitting={submitting} error={error} />
      )}
    </dialog>
  )
}
