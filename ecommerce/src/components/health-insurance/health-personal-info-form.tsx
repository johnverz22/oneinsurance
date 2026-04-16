'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useParams } from 'next/navigation'
import { useHealthAvailStore } from '@/store/health-avail-store'
import { useHealthCartStore } from '@/store/health-cart-store'

const ID_FORMATS: Record<string, { regex: RegExp; hint: string; placeholder: string }> = {
  PAS: { regex: /^[A-Z][A-Z0-9]\d{6}[A-Z0-9]$/, hint: 'Format: A0123456B or AB1234567', placeholder: 'e.g. A0123456B' },
  DRV: { regex: /^[A-Z]\d{2}-\d{2}-\d{6}$/, hint: 'Format: A00-00-000000', placeholder: 'e.g. A12-34-567890' },
  SSS: { regex: /^\d{2}-\d{7}-\d{1}$/, hint: 'Format: 00-0000000-0', placeholder: 'e.g. 12-3456789-0' },
  TIN: { regex: /^\d{3}-\d{3}-\d{3}-\d{3}$/, hint: 'Format: 000-000-000-000', placeholder: 'e.g. 123-456-789-000' },
  PHI: { regex: /^\d{4}-\d{4}-\d{4}-\d{4}$/, hint: 'Format: 0000-0000-0000-0000', placeholder: 'e.g. 1234-5678-9012-3456' },
}

function validateIdNo(idType: string, value: string): string {
  const format = ID_FORMATS[idType]
  if (!format) return ''
  if (!value) return 'ID number is required'
  if (!format.regex.test(value)) return format.hint
  return ''
}

export type PersonalInfoData = {
  fullName: string
  email: string
  phone: string
  placeOfBirth: string
  idTypeCode: string
  idNo: string
  addressLine1: string
  addressLine2: string
  province: string
  city: string
  postCode: string
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
  const { items, insuredInfo, setProposalNo } = useHealthCartStore()
  const params = useParams()
  const agentCode = params['agent-code'] as string
  const [isRequesting, setIsRequesting] = useState(false)

  const set = (field: keyof PersonalInfoData, value: string) => {
    onChange({ ...data, [field]: value })
    onErrorsChange({ ...errors, [field]: '' })
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!data.fullName.trim()) e.fullName = 'Full name is required'
    if (!data.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = 'Enter a valid email'
    if (!data.phone.trim()) e.phone = 'Phone number is required'
    else if (!/^9\d{9}$/.test(data.phone.replace(/\s/g, ''))) e.phone = 'Enter a valid PH mobile number (9XXXXXXXXX)'
    if (!data.placeOfBirth.trim()) e.placeOfBirth = 'Place of birth is required'
    if (!data.idNo.trim()) e.idNo = 'ID number is required'
    else {
      const idErr = validateIdNo(data.idTypeCode, data.idNo)
      if (idErr) e.idNo = idErr
    }
    if (!data.addressLine1.trim()) e.addressLine1 = 'Address line 1 is required'
    if (!data.province.trim()) e.province = 'Province is required'
    if (!data.city.trim()) e.city = 'City is required'
    if (!data.postCode.trim()) e.postCode = 'Post code is required'

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
      const expiryDate = insuredInfo?.effectiveDate
        ? (() => { const d = new Date(insuredInfo.effectiveDate); d.setFullYear(d.getFullYear() + 1); d.setDate(d.getDate() - 1); return formatDate(d.toISOString()) })()
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
          FirstName: data.fullName.split(' ')[0] ?? data.fullName,
          MiddleName: '',
          LastName: data.fullName.split(' ').slice(1).join(' ') || data.fullName,
          Suffix: '',
          PlaceOfBirth: data.placeOfBirth,
          DateOfBirth: insuredInfo?.dateOfBirth ?? '',
          IdNo: data.idNo,
          IdTypeCode: data.idTypeCode,
          AddrProvince: data.province,
          City: data.city,
          PostCode: data.postCode,
          Gender: insuredInfo?.genderCode ?? 'M',
          Mobile: `+63${data.phone.replace(/^(\+63|0)/, '')}`,
          Email: data.email,
          AddressLine1: data.addressLine1,
          AddressLine2: data.addressLine2 || 'N/A',
        }],
        PolicyLobList: [{
          ProductCode: 'HEALTH',
          PolicyRiskList: [{
            ProductElementCode: 'R00001',
            InsuredName: insuredInfo?.insuredName ?? data.fullName,
            GenderCode: insuredInfo?.genderCode ?? 'M',
            DateOfBirth: insuredInfo?.dateOfBirth ?? '',
            IsSmoker: insuredInfo?.isSmoker ?? 'N',
            Suffix: '',
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

      setProposalNo(proposalNo)
      toast.success('Proposal created!')
      onContinue()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsRequesting(false)
    }
  }

  const field = (
    id: keyof PersonalInfoData,
    label: string,
    placeholder: string,
    required = true,
    optional = false
  ) => (
    <div>
      <div className="mb-1 flex justify-between">
        <label className="text-primary text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {optional && <span className="text-primary text-xs">(Optional)</span>}
      </div>
      <Input
        id={`hpi-${id}`}
        value={data[id]}
        onChange={(e) => set(id, e.target.value)}
        placeholder={placeholder}
        className={`h-12 rounded-full ${errors[id] ? 'border-red-500' : ''}`}
      />
      {errors[id] && <p className="mt-1 text-xs text-red-500">{errors[id]}</p>}
    </div>
  )

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="from-primary to-accent mb-6 bg-gradient-to-r bg-clip-text text-2xl font-black text-transparent">
        Personal Information
      </h2>

      <div className="space-y-4">
        {field('fullName', 'Full Name', 'e.g. Juan Dela Cruz')}
        {field('email', 'Email Address', 'e.g. juan@example.com')}

        <div>
          <label className="text-primary mb-1 block text-sm font-medium">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className={`flex h-12 items-center overflow-hidden rounded-full border bg-white focus-within:ring-2 focus-within:ring-primary/30 ${errors.phone ? 'border-red-500' : ''}`}>
            <span className="border-r px-3 text-sm text-gray-500">+63</span>
            <Input
              id="hpi-phone"
              value={data.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="9XXXXXXXXX"
              className="h-full flex-1 border-0 shadow-none focus-visible:ring-0"
            />
          </div>
          {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
        </div>

        {field('placeOfBirth', 'Place of Birth', 'e.g. Manila, Philippines')}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-primary mb-1 block text-sm font-medium">ID Type <span className="text-red-500">*</span></label>
            <select
              value={data.idTypeCode}
              onChange={(e) => set('idTypeCode', e.target.value)}
              className="h-12 w-full rounded-full border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="PAS">Passport</option>
              <option value="DRV">Driver's License</option>
              <option value="SSS">SSS</option>
              <option value="TIN">TIN</option>
              <option value="PHI">PhilHealth</option>
            </select>
          </div>
          <div>
            <label className="text-primary mb-1 block text-sm font-medium">ID Number <span className="text-red-500">*</span></label>
            <Input
              id="hpi-idNo"
              value={data.idNo}
              onChange={(e) => set('idNo', e.target.value)}
              placeholder={ID_FORMATS[data.idTypeCode]?.placeholder ?? 'Enter ID Number'}
              className={`h-12 rounded-full ${errors.idNo ? 'border-red-500' : ''}`}
            />
            {ID_FORMATS[data.idTypeCode] && (
              <p className="text-muted-foreground mt-1 text-xs">{ID_FORMATS[data.idTypeCode].hint}</p>
            )}
            {errors.idNo && <p className="mt-1 text-xs text-red-500">{errors.idNo}</p>}
          </div>
        </div>

        {field('addressLine1', 'Address Line 1', 'e.g. 123 Rizal Street, Barangay San Antonio')}

        <div>
          <div className="mb-1 flex justify-between">
            <label className="text-primary text-sm font-medium">Address Line 2</label>
            <span className="text-primary text-xs">(Optional)</span>
          </div>
          <Input
            value={data.addressLine2}
            onChange={(e) => onChange({ ...data, addressLine2: e.target.value })}
            placeholder="e.g. Unit 4B, Tower 2"
            className="h-12 rounded-full"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {field('province', 'Province', 'e.g. Metro Manila')}
          {field('city', 'City', 'e.g. Makati')}
          {field('postCode', 'Post Code', 'e.g. 1200')}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <Button variant="outline" className="rounded-full px-8" onClick={prevStep} disabled={isRequesting}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          size="lg"
          className="from-primary to-accent rounded-full bg-gradient-to-r px-10 font-semibold text-white"
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
