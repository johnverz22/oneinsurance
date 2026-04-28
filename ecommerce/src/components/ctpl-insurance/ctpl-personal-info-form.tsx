'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useCtplInsuranceStateStore } from '@/store/ctpl-store'
import { IdUploadComponent } from '@/components/id-upload/id-upload-component'
import { provinces } from '@/constants/phil-prov'
import { citiesMunicipalities } from '@/constants/phil-city-mun'
import { getZipCodeByCityCode } from '@/utils/address-util'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'

const ID_TYPES = [
  { value: 'PAS', label: 'Passport' },
  { value: 'DRV', label: "Driver's License" },
  { value: 'SSS', label: 'SSS' },
  { value: 'TIN', label: 'TIN' },
  { value: 'PHI', label: 'PhilHealth' },
]

const SUFFIXES = ['No Suffix', 'Jr.', 'Sr.', 'II', 'III', 'IV', 'V']

export default function CtplPersonalInfoForm() {
  const { 
    personalInfo, 
    setPersonalInfo, 
    increaseStep, 
    decreaseStep,
    insuranceType,
    selectedVehicle,
    duration,
    vehicleRegistration,
    coverageOption,
    clientRequestId,
    sumInsured,
    setFullQuoteResponse
  } = useCtplInsuranceStateStore()
  
  const params = useParams()
  const agentCode = params['agent-code'] as string
  
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('')
  const [selectedCityCode, setSelectedCityCode] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')

  const [form, setForm] = useState({
    firstName: personalInfo.firstName || '',
    middleName: personalInfo.middleName || '',
    lastName: personalInfo.lastName || '',
    suffix: personalInfo.suffix || 'No Suffix',
    gender: personalInfo.gender || 'M',
    dateOfBirth: personalInfo.dateOfBirth ? new Date(personalInfo.dateOfBirth).toISOString().split('T')[0] : '',
    idType: personalInfo.idType || 'PAS',
    idNumber: personalInfo.idNumber || '',
    province: personalInfo.province || '',
    city: personalInfo.city || '',
    zipCode: personalInfo.zipCode || '',
    addressLine1: personalInfo.addressLine1 || '',
    addressLine2: personalInfo.addressLine2 || '',
    mobileNumber: personalInfo.mobileNumber || '',
    email: personalInfo.email || '',
  })

  const set = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const availableCities = selectedProvinceCode
    ? citiesMunicipalities.filter(c => c.provCode === selectedProvinceCode)
    : []

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.firstName.trim()) e.firstName = 'First name is required'
    if (!form.lastName.trim()) e.lastName = 'Last name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    if (!form.mobileNumber.trim()) e.mobileNumber = 'Mobile number is required'
    if (!form.dateOfBirth) e.dateOfBirth = 'Date of birth is required'
    if (!form.idNumber.trim()) e.idNumber = 'ID number is required'
    if (!form.addressLine1.trim()) e.addressLine1 = 'Address is required'
    if (!form.province.trim()) e.province = 'Province is required'
    if (!form.city.trim()) e.city = 'City is required'
    if (!form.zipCode.trim()) e.zipCode = 'ZIP code is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = async () => {
    if (!validate()) return
    
    setApiError('')
    setIsSubmitting(true)
    
    try {
      // Save personal info to store first
      setPersonalInfo({
        ...personalInfo,
        firstName: form.firstName,
        middleName: form.middleName,
        lastName: form.lastName,
        suffix: form.suffix,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth) : new Date(),
        idType: form.idType,
        idNumber: form.idNumber,
        province: form.province,
        city: form.city,
        zipCode: form.zipCode,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        mobileNumber: form.mobileNumber,
        email: form.email,
      })

      // Determine API endpoint based on insurance type
      const endpoint = insuranceType === 'CTPL' 
        ? '/api/motor-insurance/ctpl/full-quote'
        : '/api/motor-insurance/comprehensive/full-quote'

      // Build full-quote payload
      const payload: any = {
        CarrierCode: coverageOption.carrierCode,
        CarrierPlanCode: coverageOption.selectedPlan?.CarrierPlanCode,
        CarrierProductCode: coverageOption.selectedPlan?.CarrierProductCode,
        CarrierProductName: (coverageOption.selectedPlan as any)?.CarrierProductName || '',
        CurrencyCode: 'PHP',
        Duration: String(duration.duration),
        EffectiveDate: format(duration.effectiveDate, 'yyyy-MM-dd'),
        ExpiryDate: format(duration.expiryDate, 'yyyy-MM-dd'),
        IsCTPL: insuranceType === 'CTPL' ? 'Y' : 'N',
        PolicyCustomerList: [{
          AddrProvince: selectedProvinceCode || form.province,
          AddressLine1: form.addressLine1,
          AddressLine2: form.addressLine2,
          City: selectedCityCode || form.city,
          CustomerType: 'INDIVIDUAL',
          DateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : new Date().toISOString(),
          Email: form.email,
          FirstName: form.firstName,
          Gender: form.gender,
          IdNo: form.idNumber,
          IdTypeCode: form.idType,
          LastName: form.lastName,
          MiddleName: form.middleName,
          Mobile: form.mobileNumber,
          PostCode: parseInt(form.zipCode) || 0,
          Suffix: form.suffix === 'No Suffix' ? '' : form.suffix,
          Title: form.gender === 'M' ? 'Mr' : form.gender === 'F' ? 'Miss' : ''
        }],
        PolicyLobList: [{
          PolicyRiskList: [{
            BodyType: vehicleRegistration.bodyType,
            ChassisNo: vehicleRegistration.chassisNumber,
            DateOfRegistration: format(new Date(vehicleRegistration.dateOfRegistration), 'yyyy-MM-dd'),
            EngineNo: vehicleRegistration.engineNumber,
            FieldOfficeCode: vehicleRegistration.fieldOfficeCode,
            IsPlateNoAvailable: vehicleRegistration.plateNumber ? 'Y' : 'N',
            LicensePlateNumber: vehicleRegistration.plateNumber,
            ModelYear: String(vehicleRegistration.modelYear),
            MvFileNumber: vehicleRegistration.mvFileNumber,
            ProductElementCode: 'R00004', // Default risk element code
            SubModel: vehicleRegistration.subModel,
            VehicleMake: vehicleRegistration.make,
            VehicleModel: vehicleRegistration.model,
            VehicleUsage: vehicleRegistration.typeOfUse
          }],
          ProductCode: 'MOTOR'
        }],
        ProductCode: 'MOTOR',
        ProductType: selectedVehicle?.code || 'MOTORCYCLE',
        ProductVersion: '1.0',
        AgentCode: agentCode,
        Slug: 'motor-insurance',
        ClientRequestId: clientRequestId,
        CustomField: {
          PlanName: (coverageOption.selectedPlan as any)?.CarrierProductName || (coverageOption.selectedPlan as any)?.CarrierPlanDesc || 'CTPL Plan'
        }
      }

      // Add SumInsured for Comprehensive
      if (insuranceType === 'COMPREHENSIVE' && sumInsured) {
        payload.SumInsured = sumInsured
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to request full quote')
      }

      const data = await response.json()
      console.log('Full quote response:', data)

      // Save full quote response to store
      setFullQuoteResponse(data)

      // Navigate to review page
      increaseStep()
    } catch (error) {
      console.error('Full quote error:', error)
      setApiError(error instanceof Error ? error.message : 'Failed to request full quote. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const err = (field: string) => errors[field] ? <p className="mt-1 text-xs text-red-500">{errors[field]}</p> : null

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm space-y-6">
      <h2 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-2xl font-black text-transparent">
        Your Information
      </h2>
      <p className="text-sm text-gray-500">Upload your ID to automatically fill in the fields below.</p>

      <IdUploadComponent
        initialFrontFile={null}
        initialBackFile={null}
        onIdUploaded={() => {}}
      />

      {/* Name Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-primary">First Name <span className="text-red-500">*</span></Label>
          <Input value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Enter first name" className={`h-12 ${errors.firstName ? 'border-destructive' : ''}`} />
          {err('firstName')}
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <Label className="text-primary">Middle Name</Label>
            <span className="text-primary text-xs">(Optional)</span>
          </div>
          <Input value={form.middleName} onChange={e => set('middleName', e.target.value)} placeholder="Enter middle name" className="h-12" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-primary">Last Name <span className="text-red-500">*</span></Label>
          <Input value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Enter last name" className={`h-12 ${errors.lastName ? 'border-destructive' : ''}`} />
          {err('lastName')}
        </div>
      </div>

      {/* Suffix + Gender */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <Label className="text-primary">Suffix Name</Label>
            <span className="text-primary text-xs">(Optional)</span>
          </div>
          <Select value={form.suffix} onValueChange={v => set('suffix', v)}>
            <SelectTrigger className="h-12 w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{SUFFIXES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-primary">Gender <span className="text-red-500">*</span></Label>
          <div className="border-muted-foreground/30 flex w-full items-center justify-center gap-2 rounded-full border p-1">
            <div className={`w-full rounded-full p-2 text-center cursor-pointer ${form.gender === 'M' ? 'from-primary to-lilac bg-gradient-to-r text-white' : ''}`} onClick={() => set('gender', 'M')}>Male</div>
            <div className={`w-full rounded-full p-2 text-center cursor-pointer ${form.gender === 'F' ? 'from-lilac to-primary bg-gradient-to-r text-white' : ''}`} onClick={() => set('gender', 'F')}>Female</div>
          </div>
        </div>
      </div>

      {/* Email + Phone */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-primary">Email Address <span className="text-red-500">*</span></Label>
          <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="johndoe@example.com" className={`h-12 ${errors.email ? 'border-destructive' : ''}`} />
          {err('email')}
        </div>
        <div className="space-y-1.5">
          <Label className="text-primary">Phone Number <span className="text-red-500">*</span></Label>
          <div className={`flex h-12 items-center overflow-hidden rounded-md border bg-white focus-within:ring-2 focus-within:ring-primary/30 ${errors.mobileNumber ? 'border-destructive' : ''}`}>
            <span className="border-r px-3 text-sm text-gray-500">+63</span>
            <Input value={form.mobileNumber} onChange={e => set('mobileNumber', e.target.value)} placeholder="9123456789" className="h-full flex-1 border-0 shadow-none focus-visible:ring-0" />
          </div>
          {err('mobileNumber')}
        </div>
      </div>

      {/* Gender + DOB */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-primary">Date of Birth <span className="text-red-500">*</span></Label>
          <Input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} className={`h-12 ${errors.dateOfBirth ? 'border-destructive' : ''}`} />
          {err('dateOfBirth')}
        </div>
        <div className="space-y-1.5">
          <Label className="text-primary">ID Type <span className="text-red-500">*</span></Label>
          <Select value={form.idType} onValueChange={v => set('idType', v)}>
            <SelectTrigger className="h-12 w-full"><SelectValue placeholder="Select ID Type" /></SelectTrigger>
            <SelectContent>{ID_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {/* ID Number */}
      <div className="space-y-1.5">
        <Label className="text-primary">ID Number <span className="text-red-500">*</span></Label>
        <Input value={form.idNumber} onChange={e => set('idNumber', e.target.value)} placeholder="Enter ID Number" className={`h-12 ${errors.idNumber ? 'border-destructive' : ''}`} />
        {err('idNumber')}
      </div>

      {/* Province + City + ZIP */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-primary">Province <span className="text-red-500">*</span></Label>
          <Select value={selectedProvinceCode} onValueChange={v => {
            const prov = provinces.find(p => p.code === v)
            setSelectedProvinceCode(v)
            setSelectedCityCode('')
            set('province', prov?.province ?? v)
            set('city', '')
            set('zipCode', '')
          }}>
            <SelectTrigger className={`h-12 w-full ${errors.province ? 'border-destructive' : ''}`}><SelectValue placeholder="Select province" /></SelectTrigger>
            <SelectContent>{provinces.map(p => <SelectItem key={p.code} value={p.code}>{p.province}</SelectItem>)}</SelectContent>
          </Select>
          {err('province')}
        </div>
        <div className="space-y-1.5">
          <Label className="text-primary">City / Municipality <span className="text-red-500">*</span></Label>
          <Select value={selectedCityCode} onValueChange={v => {
            const city = availableCities.find(c => c.cityCode === v)
            const zip = getZipCodeByCityCode(v)
            setSelectedCityCode(v)
            set('city', city?.city ?? v)
            if (zip) set('zipCode', zip)
          }} disabled={!selectedProvinceCode}>
            <SelectTrigger className={`h-12 w-full ${errors.city ? 'border-destructive' : ''}`}><SelectValue placeholder="Select city" /></SelectTrigger>
            <SelectContent>{availableCities.map(c => <SelectItem key={c.cityCode} value={c.cityCode}>{c.city}</SelectItem>)}</SelectContent>
          </Select>
          {err('city')}
        </div>
        <div className="space-y-1.5">
          <Label className="text-primary">ZIP Code <span className="text-red-500">*</span></Label>
          <Input value={form.zipCode} onChange={e => set('zipCode', e.target.value)} placeholder="Enter ZIP Code" className={`h-12 ${errors.zipCode ? 'border-destructive' : ''}`} />
          {err('zipCode')}
        </div>
      </div>

      {/* Address */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-primary">House Address <span className="text-red-500">*</span></Label>
          <Input value={form.addressLine1} onChange={e => set('addressLine1', e.target.value)} placeholder="Enter full address" className={`h-12 ${errors.addressLine1 ? 'border-destructive' : ''}`} />
          {err('addressLine1')}
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <Label className="text-primary">Address 2</Label>
            <span className="text-primary text-xs">(Optional)</span>
          </div>
          <Input value={form.addressLine2} onChange={e => set('addressLine2', e.target.value)} placeholder="Enter address line 2" className="h-12" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" className="rounded-full px-8" onClick={decreaseStep} disabled={isSubmitting}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          size="lg"
          className="from-primary to-accent rounded-full bg-gradient-to-r px-10 font-semibold text-white"
          onClick={handleNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Requesting Quote...
            </>
          ) : (
            'Request Full Quote'
          )}
        </Button>
      </div>

      {/* API Error */}
      {apiError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{apiError}</p>
        </div>
      )}
    </div>
  )
}
