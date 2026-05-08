'use client'

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import { useCtplInsuranceStateStore } from '@/store/ctpl-store'
import { Button } from '../ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { DateTimePicker } from '../ui/date-time-picker'
import { useState, useEffect } from 'react'

type Option = { code: string; label: string }

export default function VehicleRegistration() {
  const { setVehicleRegistration, vehicleRegistration, selectedVehicle, increaseStep, decreaseStep } = useCtplInsuranceStateStore()

  const vehicleType = selectedVehicle?.code || 'MOTORCYCLE'

  // Text field state
  const [fieldOfficeCode, setFieldOfficeCode] = useState(vehicleRegistration.fieldOfficeCode || '')
  const [dateOfRegistration, setDateOfRegistration] = useState<Date | null>(
    vehicleRegistration.dateOfRegistration ? new Date(vehicleRegistration.dateOfRegistration) : null
  )
  const [mvFileNumber, setMvFileNumber] = useState(vehicleRegistration.mvFileNumber || '')
  const [plateNumber, setPlateNumber] = useState(vehicleRegistration.plateNumber || '')
  const [engineNumber, setEngineNumber] = useState(vehicleRegistration.engineNumber || '')
  const [chassisNumber, setChassisNumber] = useState(vehicleRegistration.chassisNumber || '')
  const [agreeToTerms, setAgreeToTerms] = useState(vehicleRegistration.agreeToTerms || false)

  // Cascading dropdown state
  const [makeOptions, setMakeOptions] = useState<Option[]>([])
  const [modelOptions, setModelOptions] = useState<Option[]>([])
  const [bodyTypeOptions, setBodyTypeOptions] = useState<Option[]>([])
  const [yearOptions, setYearOptions] = useState<Option[]>([])
  const [subModelOptions, setSubModelOptions] = useState<Option[]>([])
  const [usageOptions, setUsageOptions] = useState<Option[]>([])
  const [loadingField, setLoadingField] = useState<string | null>(null)

  const [selectedMake, setSelectedMake] = useState(vehicleRegistration.make || '')
  const [selectedModel, setSelectedModel] = useState(vehicleRegistration.model || '')
  const [selectedBodyType, setSelectedBodyType] = useState(vehicleRegistration.bodyType || '')
  const [selectedYear, setSelectedYear] = useState(vehicleRegistration.modelYear ? String(vehicleRegistration.modelYear) : '')
  const [selectedSubModel, setSelectedSubModel] = useState(vehicleRegistration.subModel || '')
  const [selectedUsage, setSelectedUsage] = useState(vehicleRegistration.typeOfUse || '')

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const load = async () => {
      setLoadingField('make')
      try {
        const res = await fetch(`/api/motor-insurance/vehicle-data/makes?vehicleType=${vehicleType}`)
        const data = await res.json()
        if (data.success) setMakeOptions(data.data)
      } catch {}
      setLoadingField(null)
    }
    load()
  }, [vehicleType])

  const fetchModels = async (makeCode: string) => {
    setLoadingField('model'); setModelOptions([]); setBodyTypeOptions([]); setYearOptions([]); setSubModelOptions([]); setUsageOptions([])
    try {
      const res = await fetch(`/api/motor-insurance/vehicle-data/models?vehicleType=${vehicleType}&makeCode=${makeCode}`)
      const data = await res.json()
      if (data.success) setModelOptions(data.data)
    } catch {}
    setLoadingField(null)
  }

  const fetchBodyTypes = async (makeCode: string, modelCode: string) => {
    setLoadingField('bodyType'); setBodyTypeOptions([]); setYearOptions([]); setSubModelOptions([]); setUsageOptions([])
    try {
      const res = await fetch(`/api/motor-insurance/vehicle-data/body-types?vehicleType=${vehicleType}&makeCode=${makeCode}&modelCode=${modelCode}`)
      const data = await res.json()
      if (data.success) setBodyTypeOptions(data.data)
    } catch {}
    setLoadingField(null)
  }

  const fetchYears = async (makeCode: string, modelCode: string, btCode: string) => {
    setLoadingField('year'); setYearOptions([]); setSubModelOptions([]); setUsageOptions([])
    try {
      const res = await fetch(`/api/motor-insurance/vehicle-data/years?vehicleType=${vehicleType}&makeCode=${makeCode}&modelCode=${modelCode}&bodyTypeCode=${btCode}`)
      const data = await res.json()
      if (data.success) setYearOptions(data.data)
    } catch {}
    setLoadingField(null)
  }

  const fetchSubModels = async (makeCode: string, modelCode: string, btCode: string, year: string) => {
    setLoadingField('subModel'); setSubModelOptions([]); setUsageOptions([])
    try {
      const res = await fetch(`/api/motor-insurance/vehicle-data/submodels?vehicleType=${vehicleType}&makeCode=${makeCode}&modelCode=${modelCode}&bodyTypeCode=${btCode}&year=${year}`)
      const data = await res.json()
      if (data.success) setSubModelOptions(data.data)
    } catch {}
    setLoadingField(null)
  }

  const fetchUsages = async (makeCode: string, modelCode: string, btCode: string, year: string, smCode: string) => {
    setLoadingField('usage'); setUsageOptions([])
    try {
      const res = await fetch(`/api/motor-insurance/vehicle-data/usages?vehicleType=${vehicleType}&makeCode=${makeCode}&modelCode=${modelCode}&bodyTypeCode=${btCode}&year=${year}&subModelCode=${smCode}`)
      const data = await res.json()
      if (data.success) setUsageOptions(data.data)
    } catch {}
    setLoadingField(null)
  }

  const clr = (key: string) => { setErrors(p => { const n = {...p}; delete n[key]; return n }) }

  const handleSubmit = () => {
    const e: Record<string, string> = {}
    if (!mvFileNumber.trim()) e.mvFileNumber = 'MV File Number is required'
    if (!plateNumber.trim()) e.plateNumber = 'Plate Number is required'
    if (!engineNumber.trim()) e.engineNumber = 'Engine Number is required'
    if (!chassisNumber.trim()) e.chassisNumber = 'Chassis Number is required'
    if (!selectedMake) e.make = 'Please select a make'
    if (!selectedModel) e.model = 'Please select a model'
    if (!selectedBodyType) e.bodyType = 'Please select a body type'
    if (!selectedYear) e.year = 'Please select a model year'
    if (!selectedSubModel) e.subModel = 'Please select a sub model'
    if (!selectedUsage) e.usage = 'Please select a vehicle usage'
    if (!agreeToTerms) e.agreeToTerms = 'You must agree to the terms'
    setErrors(e)
    if (Object.keys(e).length > 0) return

    setVehicleRegistration({
      fieldOfficeCode,
      dateOfRegistration: dateOfRegistration ?? new Date(),
      mvFileNumber,
      plateNumber,
      engineNumber,
      chassisNumber,
      make: selectedMake,
      model: selectedModel,
      bodyType: selectedBodyType,
      modelYear: selectedYear,
      subModel: selectedSubModel,
      typeOfUse: selectedUsage,
      agreeToTerms,
    })
    increaseStep()
  }

  const sel = (key: string) =>
    `w-full rounded-full border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 ${errors[key] ? 'border-red-400' : 'border-input'}`

  const inputCls = (key: string) =>
    errors[key] ? 'border-red-400' : ''

  return (
    <div className="w-full space-y-4">
      <Card className="mx-auto max-w-7xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg md:text-2xl">Vehicle Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4 md:flex-row">
            <div className="relative h-14 w-36">
              <Image src={selectedVehicle!.image} alt="" fill className="object-contain" />
            </div>
            <span className="text-center text-lg font-semibold md:text-left">{selectedVehicle!.title}</span>
          </div>

          <div className="space-y-6">
            {/* Field Office Code + Date of Registration */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label className="mb-2 block font-semibold">Field Office Code</Label>
                <p className="text-muted-foreground mb-1 text-xs">Format: NCR-MM-001</p>
                <Input value={fieldOfficeCode} onChange={e => setFieldOfficeCode(e.target.value)} placeholder="e.g. NCR-MM-001" autoComplete="off" />
              </div>
              <div>
                <Label className="mb-2 font-semibold">Date of Registration</Label>
                <p className="text-muted-foreground mb-1 text-xs">&nbsp;</p>
                <DateTimePicker variant="date" value={dateOfRegistration ?? undefined} onChange={(date) => setDateOfRegistration(date ?? null)} disabled={(date) => date > new Date()} />
              </div>
            </div>

            <Separator />

            {/* MV File + Plate */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label className="font-semibold">MV File Number <span className="text-destructive">*</span></Label>
                  <span className="text-muted-foreground text-xs">Format: 034-035567</span>
                </div>
                <Input value={mvFileNumber} onChange={e => { setMvFileNumber(e.target.value); clr('mvFileNumber') }} placeholder="e.g. 034-035567" autoComplete="off" className={inputCls('mvFileNumber')} />
                {errors.mvFileNumber && <p className="mt-1 text-xs text-destructive">{errors.mvFileNumber}</p>}
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label className="font-semibold">Plate Number <span className="text-destructive">*</span></Label>
                  <span className="text-muted-foreground text-xs">Format: ABC 1234 or ABC123</span>
                </div>
                <Input value={plateNumber} onChange={e => { setPlateNumber(e.target.value); clr('plateNumber') }} placeholder="e.g. ABC 1234" autoComplete="off" className={inputCls('plateNumber')} />
                {errors.plateNumber && <p className="mt-1 text-xs text-destructive">{errors.plateNumber}</p>}
              </div>
            </div>

            {/* Engine + Chassis */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label className="font-semibold">Engine Number <span className="text-destructive">*</span></Label>
                  <span className="text-muted-foreground text-xs">Format: 2NG-W7V659-321</span>
                </div>
                <Input value={engineNumber} onChange={e => { setEngineNumber(e.target.value); clr('engineNumber') }} placeholder="e.g. 2NG-W7V659-321" autoComplete="off" className={inputCls('engineNumber')} />
                {errors.engineNumber && <p className="mt-1 text-xs text-destructive">{errors.engineNumber}</p>}
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label className="font-semibold">Chassis Number <span className="text-destructive">*</span></Label>
                  <span className="text-muted-foreground text-xs">Format: CHS-W746564B9-321</span>
                </div>
                <Input value={chassisNumber} onChange={e => { setChassisNumber(e.target.value); clr('chassisNumber') }} placeholder="e.g. CHS-W7V659-321" autoComplete="off" className={inputCls('chassisNumber')} />
                {errors.chassisNumber && <p className="mt-1 text-xs text-destructive">{errors.chassisNumber}</p>}
              </div>
            </div>

            <Separator />

            {/* Cascading dropdowns */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label className="mb-2 block font-semibold">Make <span className="text-destructive">*</span></Label>
                <select value={selectedMake} disabled={loadingField === 'make'} className={sel('make')}
                  onChange={e => { const v = e.target.value; setSelectedMake(v); setSelectedModel(''); setSelectedBodyType(''); setSelectedYear(''); setSelectedSubModel(''); setSelectedUsage(''); clr('make'); if (v) fetchModels(v) }}>
                  <option value="">{loadingField === 'make' ? 'Loading...' : 'Select Make'}</option>
                  {makeOptions.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
                </select>
                {errors.make && <p className="mt-1 text-xs text-destructive">{errors.make}</p>}
              </div>
              <div>
                <Label className="mb-2 block font-semibold">Model <span className="text-destructive">*</span></Label>
                <select value={selectedModel} disabled={!selectedMake || loadingField === 'model'} className={sel('model')}
                  onChange={e => { const v = e.target.value; setSelectedModel(v); setSelectedBodyType(''); setSelectedYear(''); setSelectedSubModel(''); setSelectedUsage(''); clr('model'); if (v) fetchBodyTypes(selectedMake, v) }}>
                  <option value="">{loadingField === 'model' ? 'Loading...' : 'Select Model'}</option>
                  {modelOptions.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
                </select>
                {errors.model && <p className="mt-1 text-xs text-destructive">{errors.model}</p>}
              </div>
              <div>
                <Label className="mb-2 block font-semibold">Body Type <span className="text-destructive">*</span></Label>
                <select value={selectedBodyType} disabled={!selectedModel || loadingField === 'bodyType'} className={sel('bodyType')}
                  onChange={e => { const v = e.target.value; setSelectedBodyType(v); setSelectedYear(''); setSelectedSubModel(''); setSelectedUsage(''); clr('bodyType'); if (v) fetchYears(selectedMake, selectedModel, v) }}>
                  <option value="">{loadingField === 'bodyType' ? 'Loading...' : 'Select Body Type'}</option>
                  {bodyTypeOptions.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
                </select>
                {errors.bodyType && <p className="mt-1 text-xs text-destructive">{errors.bodyType}</p>}
              </div>
              <div>
                <Label className="mb-2 block font-semibold">Model Year <span className="text-destructive">*</span></Label>
                <select value={selectedYear} disabled={!selectedBodyType || loadingField === 'year'} className={sel('year')}
                  onChange={e => { const v = e.target.value; setSelectedYear(v); setSelectedSubModel(''); setSelectedUsage(''); clr('year'); if (v) fetchSubModels(selectedMake, selectedModel, selectedBodyType, v) }}>
                  <option value="">{loadingField === 'year' ? 'Loading...' : 'Select Year'}</option>
                  {yearOptions.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
                </select>
                {errors.year && <p className="mt-1 text-xs text-destructive">{errors.year}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label className="mb-2 block font-semibold">Sub Model <span className="text-destructive">*</span></Label>
                <select value={selectedSubModel} disabled={!selectedYear || loadingField === 'subModel'} className={sel('subModel')}
                  onChange={e => { const v = e.target.value; setSelectedSubModel(v); setSelectedUsage(''); clr('subModel'); if (v) fetchUsages(selectedMake, selectedModel, selectedBodyType, selectedYear, v) }}>
                  <option value="">{loadingField === 'subModel' ? 'Loading...' : 'Select Sub Model'}</option>
                  {subModelOptions.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
                </select>
                {errors.subModel && <p className="mt-1 text-xs text-destructive">{errors.subModel}</p>}
              </div>
              <div>
                <Label className="mb-2 block font-semibold">Vehicle Usage <span className="text-destructive">*</span></Label>
                <select value={selectedUsage} disabled={!selectedSubModel || loadingField === 'usage'} className={sel('usage')}
                  onChange={e => { setSelectedUsage(e.target.value); clr('usage') }}>
                  <option value="">{loadingField === 'usage' ? 'Loading...' : 'Select Usage'}</option>
                  {usageOptions.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
                </select>
                {errors.usage && <p className="mt-1 text-xs text-destructive">{errors.usage}</p>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-card border-muted-foreground/20 flex w-full flex-col gap-4 rounded-md border px-6 py-5">
        <div className="flex items-center gap-2">
          <Checkbox checked={agreeToTerms} onCheckedChange={(v) => { setAgreeToTerms(!!v); clr('agreeToTerms') }}
            className="data-[state=checked]:border-primary data-[state=checked]:bg-primary h-4 w-4" />
          <Label className="cursor-pointer text-sm">I agree to the Terms & Conditions and Privacy Policy</Label>
        </div>
        {errors.agreeToTerms && <p className="text-xs text-destructive">{errors.agreeToTerms}</p>}

        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" size="lg" className="rounded-full px-8" onClick={decreaseStep}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button type="button" size="lg"
            className="from-primary to-accent rounded-full bg-gradient-to-r px-10 font-semibold text-white"
            onClick={handleSubmit}>
            Continue to Personal Information
          </Button>
        </div>
      </div>
    </div>
  )
}
