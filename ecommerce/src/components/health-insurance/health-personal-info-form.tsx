'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useParams } from 'next/navigation'
import { useHealthAvailStore } from '@/store/health-avail-store'
import { useHealthCartStore } from '@/store/health-cart-store'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import { IdUploadComponent } from '@/components/id-upload/id-upload-component'
import { provinces } from '@/constants/phil-prov'
import { citiesMunicipalities } from '@/constants/phil-city-mun'

import { getZipCodeByCityCode } from '@/utils/address-util'

const ID_TYPES = [
  { value: 'PAS', label: 'Passport', hint: 'Format: A0123456B or AB1234567', regex: /^[A-Z][A-Z0-9]\d{6}[A-Z0-9]$/ },
  { value: 'DRV', label: "Driver's License", hint: 'Format: A00-00-000000', regex: /^[A-Z]\d{2}-\d{2}-\d{6}$/ },
  { value: 'SSS', label: 'SSS', hint: 'Format: 00-0000000-0', regex: /^\d{2}-\d{7}-\d{1}$/ },
  { value: 'TIN', label: 'TIN', hint: 'Format: 000-000-000-000', regex: /^\d{3}-\d{3}-\d{3}-\d{3}$/ },
  { value: 'PHI', label: 'PhilHealth', hint: 'Format: 0000-0000-0000-0000', regex: /^\d{4}-\d{4}-\d{4}-\d{4}$/ },
]

const SUFFIXES = ['No Suffix', 'Jr.', 'Sr.', 'II', 'III', 'IV', 'V']

export type PersonalInfoData = {
  firstName: string
  middleName: string
  lastName: string
  suffix: string
  gender: 'M' | 'F'
  dateOfBirth: string
  email: string
  phone: string
  idTypeCode: string
  idNo: string
  province: string
  city: string
  postCode: string
  addressLine1: string
  addressLine2: string
  placeOfBirth: string
  isCovidVaccinated: boolean
  isDataSharingConsent: boolean
}

interface Props {
  data: PersonalInfoData
  onChange: (data: PersonalInfoData) => void
  errors: Record<string, string>
  onErrorsChange: (errors: Record<string, string>) => void
  onContinue: () => void
}

export function HealthPersonalInfoForm({ data, onChange, errors, onErrorsChange, onContinue }: Props) {
  const { prevStep } = useHealthAvailStore()
  const { items, insuredInfo, setProposalNo, setDuePremium, setFullQuoteData } = useHealthCartStore()
  const params = useParams()
  const agentCode = params['agent-code'] as string
  const [isRequesting, setIsRequesting] = useState(false)
  const [frontIdFile, setFrontIdFile] = useState<File | null>(null)
  const [backIdFile, setBackIdFile] = useState<File | null>(null)
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('')
  const [selectedCityCode, setSelectedCityCode] = useState('')

  const set = (field: keyof PersonalInfoData, value: string) => {
    onChange({ ...data, [field]: value })
    onErrorsChange({ ...errors, [field]: '' })
  }

  const idType = ID_TYPES.find(t => t.value === data.idTypeCode) ?? ID_TYPES[0]

  const availableCities = selectedProvinceCode
    ? citiesMunicipalities.filter(c => c.provCode === selectedProvinceCode)
    : []
  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!data.firstName.trim()) e.firstName = 'First name is required'
    if (!data.lastName.trim()) e.lastName = 'Last name is required'
    if (!data.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = 'Enter a valid email'
    if (!data.phone.trim()) e.phone = 'Phone number is required'
    else if (!/^9\d{9}$/.test(data.phone.replace(/\s/g, ''))) e.phone = 'Enter a valid PH mobile number (9XXXXXXXXX)'
    if (!data.dateOfBirth) e.dateOfBirth = 'Date of birth is required'
    if (!data.placeOfBirth.trim()) e.placeOfBirth = 'Place of birth is required'
    if (!data.idNo.trim()) e.idNo = 'ID number is required'
    else if (idType.regex && !idType.regex.test(data.idNo)) e.idNo = idType.hint
    if (!data.addressLine1.trim()) e.addressLine1 = 'Address line 1 is required'
    if (!data.province.trim()) e.province = 'Province is required'
    if (!data.city.trim()) e.city = 'City is required'
    if (!data.postCode.trim()) e.postCode = 'ZIP code is required'
    if (!data.isDataSharingConsent) e.isDataSharingConsent = 'You must agree to the Data Sharing Consent Agreement'

    onErrorsChange(e)
    if (Object.keys(e).length > 0) {
      const firstKey = Object.keys(e)[0]
      document.getElementById(`hpi-${firstKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return false
    }
    return true
  }

  const handleRequestFullQuote = async () => {
    if (!validate()) return
    const item = items[0]
    if (!item) { toast.error('No plan selected.'); return }

    setIsRequesting(true)
    try {
      const formatDate = (iso: string) => iso.replace(/\.\d{3}Z$/, '').replace('Z', '')
      const effectiveDate = insuredInfo?.effectiveDate
        ? formatDate(new Date(insuredInfo.effectiveDate).toISOString())
        : formatDate(new Date().toISOString())
      const expiryDate = insuredInfo?.expiryDate
        ? formatDate(new Date(insuredInfo.expiryDate).toISOString())
        : formatDate(new Date().toISOString())

      const payload = {
        AgentCode: agentCode,
        ProductCode: 'HEALTH',
        ProductType: 'CI',
        ProductVersion: '1.0',
        ProductName: 'Health Insurance',
        CarrierCode: item.carrierCode ?? 'OONAPH',
        CarrierPlanCode: item.carrierPlanCode ?? 'FC',
        CarrierProductCode: item.carrierProductCode ?? 'PHCI',
        CarrierProductName: item.planName ?? 'Health Insurance',
        EffectiveDate: effectiveDate,
        ExpiryDate: expiryDate,
        HealthPolicyType: '1',
        PolicyCustomerList: [{
          FirstName: data.firstName,
          MiddleName: data.middleName || '',
          LastName: data.lastName,
          Suffix: data.suffix === 'No Suffix' ? '' : data.suffix,
          PlaceOfBirth: data.placeOfBirth,
          DateOfBirth: data.dateOfBirth || insuredInfo?.dateOfBirth || '',
          IdNo: data.idNo,
          IdTypeCode: data.idTypeCode,
          AddrProvince: data.province,
          City: data.city,
          PostCode: data.postCode,
          Gender: data.gender,
          Mobile: `+63${data.phone.replace(/^(\+63|0)/, '')}`,
          Email: data.email,
          AddressLine1: data.addressLine1,
          AddressLine2: data.addressLine2 || 'N/A',
        }],
        PolicyLobList: [{
          ProductCode: 'HEALTH',
          PolicyRiskList: [{
            ProductElementCode: 'R00001',
            InsuredName: insuredInfo?.insuredName ?? `${data.firstName} ${data.lastName}`,
            GenderCode: data.gender,
            DateOfBirth: data.dateOfBirth || insuredInfo?.dateOfBirth || '',
            IsSmoker: insuredInfo?.isSmoker ?? 'N',
            Suffix: data.suffix === 'No Suffix' ? '' : data.suffix,
            IsMainInsured: 'Y',
            IsAdultFlag: 'Y',
            PolicyCoverageList: [{
              ProductElementCode: 'C0001634',
              EffectiveDate: effectiveDate,
              ExpiryDate: expiryDate,
              SumInsured: 500000,
            }],
          }],
        }],
        CustomField: { PlanName: item.planName ?? '' },
      }

      const res = await fetch('/api/health-insurance/full-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const responseData = await res.json()
      const proposalNo = responseData?.ProposalNo ?? responseData?.proposalNo ?? responseData?.data?.ProposalNo ?? null

      if (!proposalNo) {
        toast.error('Failed to generate proposal. Please try again.')
        return
      }

      // Store DuePremium from full-quote response
      const duePremium = responseData?.DuePremium ?? responseData?.data?.DuePremium ?? null
      if (duePremium != null) {
        setDuePremium(Number(duePremium))
      }

      // Store full-quote metadata (coverage name, dates, coverages)
      const policyCoverageList = responseData?.PolicyLobList?.[0]?.PolicyRiskList?.[0]?.PolicyCoverageList
        ?? responseData?.data?.PolicyLobList?.[0]?.PolicyRiskList?.[0]?.PolicyCoverageList
        ?? []
      const coverages = policyCoverageList.map((c: any) => ({
        coverageName: c.CoverageName || 'Coverage',
        sumInsured: Number(c.SumInsured || 0),
      }))

      setFullQuoteData({
        carrierProductName: responseData?.CarrierProductName ?? responseData?.data?.CarrierProductName ?? undefined,
        expiryDate: responseData?.ExpiryDate ?? responseData?.data?.ExpiryDate ?? undefined,
        effectiveDate: responseData?.EffectiveDate ?? responseData?.data?.EffectiveDate ?? undefined,
        coverages: coverages.length > 0 ? coverages : undefined,
      })

      setProposalNo(proposalNo)
      onContinue()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsRequesting(false)
    }
  }

  const err = (field: string) => errors[field] ? (
    <p className="mt-1 text-xs text-red-500">{errors[field]}</p>
  ) : null

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">
        Personal Information
      </h2>

      {/* ID Upload */}
      <IdUploadComponent
        initialFrontFile={frontIdFile}
        initialBackFile={backIdFile}
        onIdUploaded={(front, back) => {
          setFrontIdFile(front)
          setBackIdFile(back)
        }}
      />

      {/* Name Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-primary">First Name <span className="text-red-500">*</span></Label>
          <Input id="hpi-firstName" value={data.firstName} onChange={e => set('firstName', e.target.value)} placeholder="e.g. Juan" className={`h-12 ${errors.firstName ? 'border-destructive' : ''}`} />
          {err('firstName')}
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <Label className="text-primary">Middle Name</Label>
            <span className="text-primary text-xs">(Optional)</span>
          </div>
          <Input value={data.middleName} onChange={e => set('middleName', e.target.value)} placeholder="e.g. Santos" className="h-12" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-primary">Last Name <span className="text-red-500">*</span></Label>
          <Input id="hpi-lastName" value={data.lastName} onChange={e => set('lastName', e.target.value)} placeholder="e.g. dela Cruz" className={`h-12 ${errors.lastName ? 'border-destructive' : ''}`} />
          {err('lastName')}
        </div>
      </div>

      {/* Suffix + Gender */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <Label className="text-primary">Suffix</Label>
            <span className="text-primary text-xs">(Optional)</span>
          </div>
          <Select value={data.suffix} onValueChange={v => set('suffix', v)}>
            <SelectTrigger className="h-12 w-full">
              <SelectValue placeholder="No Suffix" />
            </SelectTrigger>
            <SelectContent>
              {SUFFIXES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-primary">Gender <span className="text-red-500">*</span></Label>
          <div className="border-muted-foreground/30 flex w-full items-center justify-center gap-2 rounded-full border p-1">
            <div
              className={`w-full rounded-full p-2 text-center cursor-pointer ${data.gender === 'M' ? 'from-primary to-lilac bg-gradient-to-r text-white' : ''}`}
              onClick={() => set('gender', 'M')}
            >Male</div>
            <div
              className={`w-full rounded-full p-2 text-center cursor-pointer ${data.gender === 'F' ? 'from-lilac to-primary bg-gradient-to-r text-white' : ''}`}
              onClick={() => set('gender', 'F')}
            >Female</div>
          </div>
        </div>
      </div>

      {/* DOB + Email */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-primary">Date of Birth <span className="text-red-500">*</span></Label>
          <Input id="hpi-dateOfBirth" type="date" value={data.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} className={`h-12 ${errors.dateOfBirth ? 'border-destructive' : ''}`} />
          {err('dateOfBirth')}
        </div>
        <div className="space-y-1.5">
          <Label className="text-primary">Email <span className="text-red-500">*</span></Label>
          <Input id="hpi-email" type="email" value={data.email} onChange={e => set('email', e.target.value)} placeholder="e.g. juan@email.com" className={`h-12 ${errors.email ? 'border-destructive' : ''}`} />
          {err('email')}
        </div>
      </div>

      {/* Mobile + ID Type */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-primary">Mobile Number <span className="text-red-500">*</span></Label>
          <div className={`flex h-12 items-center overflow-hidden rounded-md border bg-white focus-within:ring-2 focus-within:ring-primary/30 ${errors.phone ? 'border-destructive' : ''}`}>
            <span className="border-r px-3 text-sm text-gray-500">+63</span>
            <Input id="hpi-phone" value={data.phone} onChange={e => set('phone', e.target.value)} placeholder="9171234567" className="h-full flex-1 border-0 shadow-none focus-visible:ring-0" />
          </div>
          {err('phone')}
        </div>
        <div className="space-y-1.5">
          <Label className="text-primary">ID Type <span className="text-red-500">*</span></Label>
          <Select value={data.idTypeCode} onValueChange={v => { set('idTypeCode', v); set('idNo', '') }}>
            <SelectTrigger className="h-12 w-full">
              <SelectValue placeholder="Select ID Type" />
            </SelectTrigger>
            <SelectContent>
              {ID_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ID Number */}
      <div className="space-y-1.5">
        <Label className="text-primary">ID Number <span className="text-red-500">*</span></Label>
        <Input id="hpi-idNo" value={data.idNo} onChange={e => set('idNo', e.target.value)} placeholder={idType.hint} className={`h-12 ${errors.idNo ? 'border-destructive' : ''}`} />
        <p className="text-muted-foreground text-xs">{idType.hint}</p>
        {err('idNo')}
      </div>

      {/* Province + City + ZIP */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-primary">State / Province <span className="text-red-500">*</span></Label>
          <Select
            value={selectedProvinceCode}
            onValueChange={v => {
              const prov = provinces.find(p => p.code === v)
              setSelectedProvinceCode(v)
              setSelectedCityCode('')
              // Single onChange call to avoid stale closure issues
              onChange({ ...data, province: prov?.province ?? v, city: '', postCode: '' })
              onErrorsChange({ ...errors, province: '', city: '' })
            }}
          >
            <SelectTrigger id="hpi-province" className={`h-12 w-full ${errors.province ? 'border-destructive' : ''}`}>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {provinces.map(p => <SelectItem key={p.code} value={p.code}>{p.province}</SelectItem>)}
            </SelectContent>
          </Select>
          {err('province')}
        </div>
        <div className="space-y-1.5">
          <Label className="text-primary">City / Municipality <span className="text-red-500">*</span></Label>
          <Select
            value={selectedCityCode}
            onValueChange={v => {
              const city = availableCities.find(c => c.cityCode === v)
              const zip = getZipCodeByCityCode(v)
              setSelectedCityCode(v)
              // Single onChange call to avoid stale closure issues
              onChange({ ...data, city: city?.city ?? v, postCode: zip || data.postCode })
              onErrorsChange({ ...errors, city: '' })
            }}
            disabled={!selectedProvinceCode}
          >
            <SelectTrigger id="hpi-city" className={`h-12 w-full ${errors.city ? 'border-destructive' : ''}`}>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {availableCities.map(c => <SelectItem key={c.cityCode} value={c.cityCode}>{c.city}</SelectItem>)}
            </SelectContent>
          </Select>
          {err('city')}
        </div>
        <div className="space-y-1.5">
          <Label className="text-primary">ZIP Code <span className="text-red-500">*</span></Label>
          <Input id="hpi-postCode" value={data.postCode} onChange={e => set('postCode', e.target.value)} placeholder="e.g. 1000" className={`h-12 ${errors.postCode ? 'border-destructive' : ''}`} />
          {err('postCode')}
        </div>
      </div>

      {/* Address Lines */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-primary">Address Line 1 <span className="text-red-500">*</span></Label>
          <Input id="hpi-addressLine1" value={data.addressLine1} onChange={e => set('addressLine1', e.target.value)} placeholder="e.g. House/Unit/Street" className={`h-12 ${errors.addressLine1 ? 'border-destructive' : ''}`} />
          {err('addressLine1')}
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <Label className="text-primary">Address Line 2</Label>
            <span className="text-primary text-xs">(Optional)</span>
          </div>
          <Input value={data.addressLine2} onChange={e => set('addressLine2', e.target.value)} placeholder="e.g. Brgy/Subdivision/Details" className="h-12" />
        </div>
      </div>

      {/* Place of Birth */}
      <div className="space-y-1.5">
        <Label className="text-primary">Place of Birth <span className="text-red-500">*</span></Label>
        <Input id="hpi-placeOfBirth" value={data.placeOfBirth} onChange={e => set('placeOfBirth', e.target.value)} placeholder="e.g. Manila, Philippines" className={`h-12 ${errors.placeOfBirth ? 'border-destructive' : ''}`} />
        {err('placeOfBirth')}
      </div>

      {/* COVID + Data Sharing */}
      <div className="space-y-3">
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <Checkbox
            checked={data.isCovidVaccinated}
            onCheckedChange={v => onChange({ ...data, isCovidVaccinated: !!v })}
            className="data-[state=checked]:border-primary data-[state=checked]:bg-primary h-4 w-4"
          />
          <span className="text-sm text-gray-700">I am fully vaccinated against COVID-19</span>
        </label>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <Checkbox
            checked={data.isDataSharingConsent}
            onCheckedChange={v => {
              onChange({ ...data, isDataSharingConsent: !!v })
              onErrorsChange({ ...errors, isDataSharingConsent: '' })
            }}
            className="data-[state=checked]:border-primary data-[state=checked]:bg-primary h-4 w-4"
          />
          <span className="text-sm text-gray-700">
            I agree to the{' '}
            <Link href="/data-sharing-consent" target="_blank" className="text-primary font-medium underline underline-offset-4">
              Data Sharing Consent Agreement
            </Link>{' '}
            <span className="text-red-500">*</span>
          </span>
        </label>
        {errors.isDataSharingConsent && <p className="text-xs text-red-500">{errors.isDataSharingConsent}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" size="lg" className="w-1/2 rounded-full bg-transparent px-12 font-semibold lg:w-max" onClick={prevStep} disabled={isRequesting}>
          Back
        </Button>
        <Button
          size="lg"
          className="from-primary to-accent w-1/2 rounded-full bg-gradient-to-r via-90% px-14 text-sm font-medium text-white lg:w-max dark:text-white"
          onClick={handleRequestFullQuote}
          disabled={isRequesting}
        >
          {isRequesting ? (
            <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Requesting...</span>
          ) : 'Request Full Quote'}
        </Button>
      </div>
    </div>
  )
}
