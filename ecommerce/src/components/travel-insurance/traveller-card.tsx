'use client'

import { useMemo, useState } from 'react'
import { format, subYears } from 'date-fns'
import { AlertCircle, CheckCircle2, ChevronDown, Info, UserCheck } from 'lucide-react'
import { idFilesStore } from '@/store/travel-insurance-store'
import {
  PH_ID_TYPES,
  PersonalInfoFormData,
  SuffixEnum,
} from '@/types/travel-insurance/travel-insurance-request'
import { provinces } from '@/constants/phil-prov'
import { citiesMunicipalities } from '@/constants/phil-city-mun'
import { getZipCodeByCityCode } from '@/utils/address-util'
import { setPath, TravellerFieldRules } from '@/utils/traveller-form'
import type { IdOcrResult } from '@/utils/paddle-ocr-types'
import { IdUpload } from '@/components/travel-insurance/id-upload'

const toInput = (d?: Date | null) =>
  d instanceof Date && !isNaN(d.getTime()) ? format(d, 'yyyy-MM-dd') : ''
const fromInput = (v: string) => {
  if (!v) return null
  const [y, m, d] = v.split('-').map(Number)
  return new Date(y, m - 1, d)
}

interface TravellerCardProps {
  index: number
  isAdult: boolean
  data: PersonalInfoFormData
  errors: Record<string, string>
  showErrors: boolean
  open: boolean
  onToggle: (open: boolean) => void
  onChange: (update: (prev: PersonalInfoFormData) => PersonalInfoFormData) => void
  onOpenAgreement: () => void
  /** Whether this traveller is the principal applicant */
  isPrincipal: boolean
  /** Called when the user clicks "Principal" to make this traveller the principal */
  onSetPrincipal: () => void
  /** Principal traveller data for copying address/contact (omit for the principal card itself) */
  principalTraveller?: PersonalInfoFormData
  /** Selected insurer's field rules — drive required vs optional marking */
  rules: TravellerFieldRules
  /**
   * Called when the ID scan lock changes for this traveller.
   * Parent form should disable the submit button while any scan is in-flight.
   */
  onScanningChange?: (scanning: boolean) => void
}

/* ── Small helpers ── */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <p className="shrink-0 text-xs font-semibold uppercase tracking-wider text-[var(--primary)] dark:text-[#d0e3c8]">
        {children}
      </p>
      <div className="h-px flex-1 bg-[var(--border)]" aria-hidden />
    </div>
  )
}

export function TravellerCard({
  index,
  isAdult,
  data,
  errors,
  showErrors,
  open,
  onToggle,
  onChange,
  onOpenAgreement,
  isPrincipal,
  onSetPrincipal,
  principalTraveller,
  rules,
  onScanningChange,
}: TravellerCardProps) {
  const prefix = `traveller-${index}`

  const err = (path: string) => (showErrors ? errors[`${index}.${path}`] : undefined)
  const missingCount = Object.keys(errors).filter((k) => k.startsWith(`${index}.`)).length

  const set = (path: string, value: unknown) => onChange((d) => setPath(d, path, value))

  /* same-address / same-contact toggles (only for T2+) */
  const [sameAddress, setSameAddress] = useState(false)
  const [sameContact, setSameContact] = useState(false)

  const eighteenAgo = subYears(new Date(), 18)
  const dobMax = toInput(isAdult ? eighteenAgo : new Date())
  const dobMin = isAdult ? undefined : toInput(new Date(eighteenAgo.getTime() + 86400000))

  const cities = useMemo(
    () => citiesMunicipalities.filter((c) => c.provCode === data.address.province),
    [data.address.province]
  )

  /* ── field / label / error helpers ── */
  const field = (path: string, opts?: { optional?: boolean }) => ({
    id: `${prefix}-${path}`,
    'data-field': `${index}.${path}`,
    required: opts?.optional ? undefined : true,
    'aria-invalid': err(path) ? (true as const) : undefined,
    'aria-describedby': err(path) ? `${prefix}-${path}-error` : undefined,
    className: `ui-form-field mt-1.5 block min-h-11 w-full text-base sm:text-sm${err(path) ? ' border-red-600 outline-red-600' : ''}`,
  })

  const lbl = (path: string, text: string, optional?: boolean) => (
    <label htmlFor={`${prefix}-${path}`} className="block text-sm font-medium">
      {text}{' '}
      {optional ? (
        <span className="text-xs font-normal text-[var(--text-muted)]">(optional)</span>
      ) : (
        <span aria-hidden className="text-red-600">*</span>
      )}
    </label>
  )

  const errText = (path: string) =>
    err(path) ? (
      <p
        id={`${prefix}-${path}-error`}
        role="alert"
        className="mt-1 flex items-center gap-1 text-xs text-red-700 dark:text-red-300"
      >
        <AlertCircle className="size-3.5 shrink-0" aria-hidden /> {err(path)}
      </p>
    ) : null

  /* ── OCR apply ── */
  const applyOcr = (r: IdOcrResult) =>
    onChange((d) => {
      let next = d
      if (r.first_name) next = setPath(next, 'firstName', r.first_name)
      if (r.middle_name) next = setPath(next, 'middleName', r.middle_name)
      if (r.last_name) next = setPath(next, 'lastName', r.last_name)
      if (r.id_number) next = setPath(next, 'idNumber', r.id_number)
      if (r.id_type && r.id_type in PH_ID_TYPES) next = setPath(next, 'idType', r.id_type)
      if (r.date_of_birth) {
        const [mm, dd, yyyy] = r.date_of_birth.split('/')
        const dob = new Date(Number(yyyy), Number(mm) - 1, Number(dd))
        if (mm && dd && yyyy && !isNaN(dob.getTime())) next = setPath(next, 'dateOfBirth', dob)
      }
      return next
    })

  const onIdChange = (front: File | null, back: File | null) => {
    idFilesStore.set(index, { frontId: front, backId: back })
    onChange((d) => ({ ...d, idFrontUploaded: !!front, idBackUploaded: !!back }))
  }

  const type = isAdult ? 'Adult' : 'Child'

  /* ── Copy helpers for same-as-T1 ── */
  const copySameAddress = (on: boolean) => {
    setSameAddress(on)
    if (on && principalTraveller) {
      onChange((d) => ({ ...d, address: { ...principalTraveller.address } }))
    }
  }

  const copySameContact = (on: boolean) => {
    setSameContact(on)
    if (on && principalTraveller) {
      onChange((d) => ({ ...d, email: principalTraveller.email, mobileNumber: principalTraveller.mobileNumber }))
    }
  }

  /* ── Status chip label ── */
  const chipLabel =
    !showErrors
      ? null
      : missingCount > 0
      ? `${missingCount} field${missingCount === 1 ? '' : 's'} incomplete`
      : 'Complete'

  return (
    <div
      className="travel-applicant-card travel-kyc-disclosure"
      data-applicant-index={index}
    >
      {/* ── Accordion header (button for a11y) ── */}
      <button
        type="button"
        onClick={() => onToggle(!open)}
        aria-expanded={open}
        aria-controls={`${prefix}-body`}
        className="flex w-full min-h-11 cursor-pointer items-center justify-between gap-4 text-left"
      >
        <h3 className="text-lg font-semibold">
          Traveller {index + 1} <span className="font-normal text-[var(--text-muted)]">· {type}</span>
        </h3>
        <span className="flex shrink-0 items-center gap-3">
          {showErrors && chipLabel && (
            missingCount > 0 ? (
              <span className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/20 dark:text-red-300">
                <AlertCircle className="size-3.5" aria-hidden />
                {chipLabel}
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-[#e2eddb] px-2.5 py-0.5 text-xs font-semibold text-[var(--primary)] dark:bg-[#1c3020] dark:text-[#d0e3c8]">
                <CheckCircle2 className="size-3.5" aria-hidden />
                Complete
              </span>
            )
          )}

          {/* ── Principal checkbox ── */}
          {/* Stopgap: prevent the accordion toggle button from receiving this click */}
          <span
            role="none"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center"
          >
            <label
              className={`flex min-h-8 cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold select-none transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-[#006838]
                ${isPrincipal
                  ? 'bg-[#e2eddb] text-[var(--primary)] dark:bg-[#1c3020] dark:text-[#d0e3c8]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--subtle)]'
                }`}
            >
              <input
                type="radio"
                name="principal-applicant"
                checked={isPrincipal}
                onChange={onSetPrincipal}
                aria-label={`Traveller ${index + 1} is the principal applicant`}
                className="sr-only"
              />
              <UserCheck className="size-4 shrink-0" aria-hidden />
              <span>{isPrincipal ? 'Principal' : 'Make principal'}</span>
            </label>
          </span>

          <ChevronDown
            className={`size-5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </span>
      </button>

      {/* ── Collapsible body ── */}
      <div
        id={`${prefix}-body`}
        hidden={!open}
        className="pt-6"
      >
        <fieldset>
          <legend className="sr-only">
            Details for Traveller {index + 1} ({type})
          </legend>

          {/* ──────────────────── Section 1: ID ──────────────────── */}
          <SectionHeading>1 &middot; ID</SectionHeading>

          <IdUpload
            label={`ID images for traveller ${index + 1}`}
            required={rules.requiresIdFront}
            backRequired={rules.requiresIdBack}
            initialFront={idFilesStore.get(index)?.frontId ?? null}
            initialBack={idFilesStore.get(index)?.backId ?? null}
            onChange={onIdChange}
            onOcrResult={applyOcr}
            onScanningChange={onScanningChange}
          />
          {showErrors && err('idFrontUploaded') && (
            <p
              role="alert"
              data-field={`${index}.idFrontUploaded`}
              tabIndex={-1}
              className="mt-1.5 flex items-center gap-1 text-xs text-red-700 dark:text-red-300"
            >
              <AlertCircle className="size-3.5 shrink-0" aria-hidden /> {err('idFrontUploaded')}
            </p>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              {lbl('idType', 'ID type')}
              <select {...field('idType')} value={data.idType} onChange={(e) => set('idType', e.target.value)}>
                {Object.entries(PH_ID_TYPES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {errText('idType')}
            </div>
            <div>
              {lbl('idNumber', 'ID number')}
              <input {...field('idNumber')} maxLength={50} autoComplete="off" value={data.idNumber} onChange={(e) => set('idNumber', e.target.value)} />
              {errText('idNumber')}
            </div>
          </div>

          {/* ──────────────────── Section 2: Personal details ──────────────────── */}
          <div className="mt-6">
            <SectionHeading>2 &middot; Personal details</SectionHeading>

            {/* First / Middle / Last — 3 cols on desktop */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                {lbl('firstName', 'First name')}
                <input {...field('firstName')} value={data.firstName} maxLength={100} autoComplete="off" onChange={(e) => set('firstName', e.target.value)} />
                {errText('firstName')}
              </div>
              <div>
                {lbl('middleName', 'Middle name', true)}
                <input {...field('middleName', { optional: true })} value={data.middleName ?? ''} maxLength={100} autoComplete="off" onChange={(e) => set('middleName', e.target.value)} />
              </div>
              <div>
                {lbl('lastName', 'Last name')}
                <input {...field('lastName')} value={data.lastName} maxLength={100} autoComplete="off" onChange={(e) => set('lastName', e.target.value)} />
                {errText('lastName')}
              </div>
            </div>

            {/* Suffix / Gender / DOB */}
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                {lbl('suffix', 'Suffix', true)}
                <select {...field('suffix', { optional: true })} value={data.suffix ?? 'No Suffix'} onChange={(e) => set('suffix', e.target.value)}>
                  {SuffixEnum.options.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                {lbl('gender', 'Gender')}
                <select {...field('gender')} value={data.gender} onChange={(e) => set('gender', e.target.value)}>
                  <option value="" disabled>Select gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
                {errText('gender')}
              </div>
              <div className="col-span-2 sm:col-span-1">
                {lbl('dateOfBirth', 'Date of birth')}
                <input
                  {...field('dateOfBirth')}
                  type="date"
                  min={dobMin}
                  max={dobMax}
                  value={toInput(data.dateOfBirth)}
                  onChange={(e) => e.target.value && set('dateOfBirth', fromInput(e.target.value))}
                />
                {errText('dateOfBirth')}
              </div>
            </div>
          </div>

          {/* ──────────────────── Section 3: Contact ──────────────────── */}
          <div className="mt-6">
            <SectionHeading>3 &middot; Contact</SectionHeading>

            {/* Same-contact toggle for T2+ */}
            {index > 0 && principalTraveller && (
              <label className="mb-4 flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={sameContact}
                  onChange={(e) => copySameContact(e.target.checked)}
                  className="size-4 accent-[var(--primary)]"
                />
                Same contact details as primary traveller
              </label>
            )}

            {!sameContact && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  {lbl('email', 'Email')}
                  <input {...field('email')} type="email" autoComplete="off" placeholder="traveller@example.com" value={data.email} onChange={(e) => set('email', e.target.value)} />
                  {errText('email')}
                </div>
                <div>
                  {lbl('mobileNumber', 'Mobile number')}
                  <div className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 select-none text-sm text-[var(--text-muted)]">+63</span>
                    <input
                      {...field('mobileNumber')}
                      className={`ui-form-field mt-1.5 block min-h-11 w-full pl-12 text-base sm:text-sm${err('mobileNumber') ? ' border-red-600 outline-red-600' : ''}`}
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="9171234567"
                      value={data.mobileNumber}
                      onChange={(e) => set('mobileNumber', e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                  {errText('mobileNumber')}
                </div>
              </div>
            )}
          </div>

          {/* ──────────────────── Section 4: Address ──────────────────── */}
          <div className="mt-6">
            <SectionHeading>4 &middot; Address</SectionHeading>

            {/* Same-address toggle for T2+ */}
            {index > 0 && principalTraveller && (
              <label className="mb-4 flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={sameAddress}
                  onChange={(e) => copySameAddress(e.target.checked)}
                  className="size-4 accent-[var(--primary)]"
                />
                Same address as primary traveller
              </label>
            )}

            {!sameAddress && (
              <div className="space-y-4">
                {/* Line 1 + Line 2 — each full-width on mobile, side-by-side at lg */}
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    {lbl('address.line1', 'Address line 1')}
                    <input {...field('address.line1')} maxLength={40} placeholder="House / Unit / Street" value={data.address.line1} onChange={(e) => set('address.line1', e.target.value)} />
                    {errText('address.line1')}
                  </div>
                  <div>
                    {lbl('address.line2', 'Address line 2', !rules.requiresAddressLine2)}
                    <input {...field('address.line2', { optional: !rules.requiresAddressLine2 })} maxLength={40} placeholder="Barangay / Subdivision / Details" value={data.address.line2 ?? ''} onChange={(e) => set('address.line2', e.target.value)} />
                    {errText('address.line2')}
                  </div>
                </div>

                {/* Province / City / ZIP — single row */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    {lbl('address.province', 'Province')}
                    <select
                      {...field('address.province')}
                      value={data.address.province}
                      onChange={(e) =>
                        onChange((d) => ({
                          ...d,
                          address: { ...d.address, province: e.target.value, city: '', zipCode: '' },
                        }))
                      }
                    >
                      <option value="">Select province</option>
                      {provinces.map((p) => (
                        <option key={p.code} value={p.code}>{p.province}</option>
                      ))}
                    </select>
                    {errText('address.province')}
                  </div>

                  <div>
                    {lbl('address.city', 'City / Municipality')}
                    <select
                      {...field('address.city')}
                      value={data.address.city}
                      disabled={!data.address.province}
                      onChange={(e) => {
                        const zip = getZipCodeByCityCode(e.target.value)
                        onChange((d) => ({
                          ...d,
                          address: { ...d.address, city: e.target.value, zipCode: zip ? String(zip) : '' },
                        }))
                      }}
                    >
                      <option value="">Select city</option>
                      {cities.map((c, i) => (
                        <option key={`${c.cityCode}-${i}`} value={c.cityCode}>{c.city}</option>
                      ))}
                    </select>
                    {errText('address.city')}
                  </div>

                  <div>
                    {lbl('address.zipCode', 'ZIP code')}
                    <input {...field('address.zipCode')} maxLength={12} value={data.address.zipCode} onChange={(e) => set('address.zipCode', e.target.value)} />
                    {errText('address.zipCode')}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ──────────────────── Section 5: Consent & Beneficiary ──────────────────── */}
          <div className="mt-6">
            <SectionHeading>5 &middot; Consent &amp; beneficiary</SectionHeading>

            {/* COVID vaccination checkbox */}
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={!!data.isCovidVaccinated}
                onChange={(e) => set('isCovidVaccinated', e.target.checked)}
                className="size-4 accent-[var(--primary)]"
              />
              I am fully vaccinated against COVID-19{' '}
              <span className="text-xs font-normal text-[var(--text-muted)]">(optional)</span>
            </label>

            {/* Data sharing consent */}
            <div className="mt-3 flex min-h-11 items-center justify-between gap-3">
              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <input
                  data-field={`${index}.is_data_sharing_consent`}
                  type="checkbox"
                  required
                  checked={data.is_data_sharing_consent}
                  aria-invalid={err('is_data_sharing_consent') ? true : undefined}
                  aria-describedby={err('is_data_sharing_consent') ? `${prefix}-is_data_sharing_consent-error` : undefined}
                  onChange={(e) => set('is_data_sharing_consent', e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
                />
                <span>
                  I agree to the Data sharing agreement.{' '}
                  <span aria-hidden className="text-red-600">*</span>
                </span>
              </label>
              <button
                type="button"
                onClick={onOpenAgreement}
                aria-haspopup="dialog"
                className="shrink-0 inline-flex min-h-11 items-center justify-center rounded-md px-3 text-sm font-semibold text-[var(--primary)] underline underline-offset-4 hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)] dark:text-[#d0e3c8]"
              >
                Read agreement
              </button>
            </div>
            {errText('is_data_sharing_consent')}

            {/* Beneficiary toggle (switch row) */}
            <div className="mt-4 flex min-h-11 items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Add a beneficiary</p>
                <p className="text-xs text-[var(--text-muted)]">Optional — designate someone to receive the benefit</p>
              </div>
              {/* Toggle switch */}
              <button
                type="button"
                role="switch"
                aria-checked={data.hasBeneficiary}
                onClick={() => {
                  const next = !data.hasBeneficiary
                  onChange((d) => ({
                    ...d,
                    hasBeneficiary: next,
                    beneficiary: next
                      ? d.beneficiary
                      : { firstName: '', middleName: '', lastName: '', dateOfBirth: null, relationship: '' },
                  }))
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] ${
                  data.hasBeneficiary ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'
                }`}
              >
                <span className="sr-only">{data.hasBeneficiary ? 'Remove beneficiary' : 'Add beneficiary'}</span>
                <span
                  aria-hidden
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform ${
                    data.hasBeneficiary ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Beneficiary fields — revealed inline */}
            {data.hasBeneficiary && (
              <div id={`${prefix}-beneficiary`} className="mt-4 rounded-lg border border-[var(--border)] p-4">
                <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  <Info className="size-3.5" aria-hidden />
                  Beneficiary details
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor={`${prefix}-beneficiary.firstName`} className="block text-sm font-medium">First name <span aria-hidden className="text-red-600">*</span></label>
                    <input {...field('beneficiary.firstName')} maxLength={100} value={data.beneficiary.firstName ?? ''} onChange={(e) => set('beneficiary.firstName', e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor={`${prefix}-beneficiary.middleName`} className="block text-sm font-medium">
                      Middle name <span className="text-xs font-normal text-[var(--text-muted)]">(optional)</span>
                    </label>
                    <input {...field('beneficiary.middleName', { optional: true })} maxLength={100} value={data.beneficiary.middleName ?? ''} onChange={(e) => set('beneficiary.middleName', e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor={`${prefix}-beneficiary.lastName`} className="block text-sm font-medium">Last name <span aria-hidden className="text-red-600">*</span></label>
                    <input {...field('beneficiary.lastName')} maxLength={100} value={data.beneficiary.lastName ?? ''} onChange={(e) => set('beneficiary.lastName', e.target.value)} />
                  </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`${prefix}-beneficiary.dateOfBirth`} className="block text-sm font-medium">Date of birth <span aria-hidden className="text-red-600">*</span></label>
                    <input {...field('beneficiary.dateOfBirth')} type="date" max={toInput(new Date())} value={toInput(data.beneficiary.dateOfBirth)} onChange={(e) => set('beneficiary.dateOfBirth', fromInput(e.target.value))} />
                  </div>
                  <div>
                    <label htmlFor={`${prefix}-beneficiary.relationship`} className="block text-sm font-medium">Relationship <span aria-hidden className="text-red-600">*</span></label>
                    <input {...field('beneficiary.relationship')} placeholder="e.g. Spouse, Parent, Child" value={data.beneficiary.relationship ?? ''} onChange={(e) => set('beneficiary.relationship', e.target.value)} />
                  </div>
                </div>
                {err('beneficiary') && (
                  <p role="alert" data-field={`${index}.beneficiary`} tabIndex={-1} className="mt-3 flex items-center gap-1 text-xs text-red-700 dark:text-red-300">
                    <AlertCircle className="size-3.5 shrink-0" aria-hidden /> {err('beneficiary')}
                  </p>
                )}
              </div>
            )}
          </div>
        </fieldset>
      </div>
    </div>
  )
}
