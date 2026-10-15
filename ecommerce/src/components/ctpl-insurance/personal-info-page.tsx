import { PersonalInfoSchema, SuffixEnum } from '@/types/ctpl-insurance'
import { useForm } from '@tanstack/react-form'
import { Card } from '@/components/ui/card'
import { useState } from 'react'
import { FieldInfo } from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { provinces } from '@/constants/phil-prov'
import { citiesMunicipalities } from '@/constants/phil-city-mun'
import { useCtplInsuranceStateStore } from '@/store/ctpl-store'
import {
  getIdFormatDescription,
  PH_ID_TYPES,
} from '@/types/travel-insurance/travel-insurance-request'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ctplInitCompareQuote } from '@/app/data/mutations/ctpl/init-compare-quote'
import { mapCptlStateToInitCompareRequest } from '@/utils/mappers/cptl-insurance/ctpl-insurance'
import { toast } from 'sonner'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import axios from 'axios'
import { cn } from '@/lib/utils'
import { getZipCodeByCityCode } from '@/utils/address-util'

export default function PersonalInformationPage() {
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>()
  const {
    setPersonalInfo,
    personalInfo,
    selectedVehicle,
    vehicleRegistration,
    duration,
    increaseStep,
    decreaseStep,
    setClientRequestId,
  } = useCtplInsuranceStateStore()
  const { mutateAsync } = ctplInitCompareQuote()

  const form = useForm({
    defaultValues: personalInfo,

    validators: {
      onChange: PersonalInfoSchema,
    },

    onSubmit: async ({ value }) => {
      try {
        console.log(value)

        setPersonalInfo(value)

        const initCompareRequest = mapCptlStateToInitCompareRequest({
          personalInfo: value,
          selectedVehicle,
          vehicleRegistration,
          duration,
        })

        console.log('request payload:', initCompareRequest)

        const result = await mutateAsync({
          data: initCompareRequest,
          productType: selectedVehicle.code,
        })

        console.log('Init compare result:', result)
        toast.info(
          `Under Development; Request Successfull ClientRequestId: ${result.data.ClientRequestId}`
        )
        setClientRequestId(result.data.ClientRequestId)
        increaseStep()
      } catch (error: any) {
        console.error('CTPL init compare error:', error)
        if (axios.isAxiosError(error)) {
          switch (error.status) {
            case 500:
              toast.error(`Server is currently down ${error.message}`)
              break
            default:
              toast.error(`Request failed: ${error.message}`)
          }
        }
      }
    },
  })

  return (
    <div className="relative mx-auto max-w-7xl">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log('Submitting form...')
          form.handleSubmit()
        }}
        className="space-y-4"
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* <Card className="grid gap-4 px-6 md:col-span-2 lg:grid-cols-11">
                <div className="flex w-full flex-col justify-center gap-2 lg:col-span-5">
                  <div className="space-y-2">
                    <Label>Upload ID</Label>
                    <p className="text-muted-foreground pb-2 text-sm">
                      Save time by uploading a valid ID—we’ll securely scan and
                      auto-fill the required details for you.
                    </p>
                  </div>

                  <Label
                    htmlFor="dropzone-file"
                    className="bg-muted-foreground/20 flex h-40 w-full cursor-not-allowed flex-col items-center justify-center rounded-lg border-1 border-dashed border-border"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg
                        className="mb-4 h-8 w-8 text-muted-foreground"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 20 16"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                        />
                      </svg>
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">
                          Click to upload ID
                        </span>{' '}
                        or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG / JPG (MAX. 800x400px)
                      </p>
                    </div>
                    <input
                      id="dropzone-file"
                      type="file"
                      className="hidden"
                      disabled
                    />
                  </Label>
                </div>

                <div className="text-muted-foreground flex h-full w-full items-center justify-center text-center">
                  OR
                </div>

                <div className="space-y-4 lg:col-span-5">
                  <div className="space-y-2">
                    <Label>Manual</Label>
                    <p className="text-muted-foreground pb-2 text-sm">
                      Type in your personal details yourself. This option works
                      best if you want full control over the information you
                      provide.
                    </p>
                  </div>

                  <form.Field
                    name="idType"
                    children={(field) => (
                      <div className="space-y-2">
                        <Label className="block">ID Type</Label>

                        <Select
                          value={field.state.value}
                          onValueChange={(value) =>
                            field.handleChange(value as any)
                          }
                        >
                          <SelectTrigger className="h-12 w-full">
                            <SelectValue placeholder="ID Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(PH_ID_TYPES).map(
                              ([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  />

                  <form.Field
                    name="idNumber"
                    children={(field) => {
                      const idType = form.getFieldValue(
                        'idType'
                      )

                      return (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label className="block">ID Number</Label>
                            {idType && (
                              <p className="text-muted-foreground text-xs">
                                {getIdFormatDescription(idType)}
                              </p>
                            )}
                          </div>

                          <Input
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            className="h-12"
                            placeholder="Enter ID Number"
                          />

                          <FieldInfo field={field} />
                        </div>
                      )
                    }}
                  />
                </div>
              </Card> */}

            <Card className="gap-4">
              <div className="w-full px-6">
                <h3 className="flex items-center gap-2 text-lg font-bold">
                  Basic Information
                </h3>
                <p className="text-muted-foreground pb-2 text-sm">
                  Please use the information shown on your official documents
                </p>

                <div className="bg-muted-foreground/20 w-[calc(100%-1.5rem]) h-px" />
              </div>

              <div className="space-y-4 px-6">
                <form.Field
                  name="idType"
                  children={(field) => (
                    <div className="space-y-2">
                      <Label className="block">ID Type</Label>

                      <Select
                        value={field.state.value}
                        onValueChange={(value) =>
                          field.handleChange(value as any)
                        }
                      >
                        <SelectTrigger className="h-12 w-full">
                          <SelectValue placeholder="ID Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PH_ID_TYPES).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />

                <form.Field
                  name="idNumber"
                  children={(field) => {
                    const idType = form.getFieldValue('idType')

                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="block">ID Number</Label>
                          {idType && (
                            <p className="text-muted-foreground text-xs">
                              {getIdFormatDescription(idType as any)}
                            </p>
                          )}
                        </div>

                        <Input
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          className="h-12"
                          placeholder="Enter ID Number"
                        />

                        <FieldInfo field={field} />
                      </div>
                    )
                  }}
                />
                <form.Field
                  name="firstName"
                  children={(field) => (
                    <div className="space-y-2">
                      <Label className="block">First Name</Label>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        className="h-12"
                        placeholder="e.g. Juan"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                />

                <form.Field
                  name="middleName"
                  children={(field) => (
                    <div className="space-y-2">
                      {' '}
                      <div className="flex h-max justify-between">
                        <Label className="block">Middle Name</Label>
                        <span className="text-muted-foreground text-xs">
                          (Optional)
                        </span>
                      </div>
                      <Input
                        value={field.state.value ?? ''}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        className="h-12"
                        placeholder="e.g. Santos"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                />

                <form.Field
                  name="lastName"
                  children={(field) => (
                    <div className="space-y-2">
                      <Label className="block">Last Name</Label>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        className="h-12"
                        placeholder="e.g. dela Cruz"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                />

                <form.Field
                  name="suffix"
                  children={(field) => (
                    <div className="space-y-2">
                      <div className="flex h-max justify-between">
                        <Label className="block">Suffix</Label>
                        <span className="text-muted-foreground text-xs">
                          (Optional)
                        </span>
                      </div>

                      <Select
                        value={field.state.value}
                        defaultValue="No Suffix"
                        onValueChange={(value) =>
                          field.handleChange(value as any)
                        }
                      >
                        <SelectTrigger className="h-12 w-full">
                          <SelectValue placeholder="Select Suffix" />
                        </SelectTrigger>
                        <SelectContent>
                          {SuffixEnum.options.map((suffix) => (
                            <SelectItem key={suffix} value={suffix}>
                              {suffix}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldInfo field={field} />
                    </div>
                  )}
                />

                <form.Field name="dateOfBirth">
                  {(field) => {
                    // Calculate the latest allowed date (today minus 18 years)
                    const today = new Date()
                    const minAllowedDate = new Date(
                      today.getFullYear() - 18,
                      today.getMonth(),
                      today.getDate()
                    )
                    return (
                      <div>
                        <Label
                          htmlFor={field.name}
                          className="mb-2 font-semibold"
                        >
                          Date of Birth
                        </Label>
                        <DateTimePicker
                          variant="date"
                          value={
                            field.state.value
                              ? new Date(field.state.value)
                              : minAllowedDate
                          }
                          defaultValue={minAllowedDate}
                          onChange={(date) => field.handleChange(date ?? null)}
                          disabled={(date) => date > minAllowedDate}
                        />
                        <FieldInfo field={field} />
                      </div>
                    )
                  }}
                </form.Field>

                <form.Field
                  name="gender"
                  children={(field) => (
                    <div className="space-y-2">
                      <Label className="block">Gender</Label>
                      <RadioGroup
                        value={field.state.value}
                        onValueChange={(value) =>
                          field.handleChange(value as any)
                        }
                        className="dark:bg-muted-foreground/10 flex gap-4 rounded-md border bg-white px-3 py-3.5"
                      >
                        <div className="flex gap-2">
                          <RadioGroupItem value="M" />
                          <Label>Male</Label>
                        </div>
                        <div className="flex gap-2">
                          <RadioGroupItem value="F" />
                          <Label>Female</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                />
              </div>
            </Card>

            <div className="space-y-4">
              {/* Contact Information */}
              <Card className="gap-4">
                <div className="w-full px-6">
                  <h3 className="flex items-center gap-2 text-lg font-bold">
                    Cotact Information
                  </h3>
                  <p className="text-muted-foreground pb-2 text-sm">
                    Please enter your present contact information
                  </p>

                  <div className="bg-muted-foreground/20 w-[calc(100%-1.5rem]) h-px" />
                </div>

                <div className="space-y-4 px-6">
                  <form.Field
                    name="email"
                    children={(field) => (
                      <div className="space-y-2">
                        <Label className="block">Email</Label>
                        <Input
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          className="h-12"
                          placeholder="e.g. juan@email.com"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  />

                  <form.Field
                    name="mobileNumber"
                    children={(field) => (
                      <div className="space-y-2">
                        <Label className="block">Mobile Number</Label>
                        <div
                          className={cn(
                            'dark:bg-input/30 flex items-center gap-2 rounded-full border pl-4 transition-[color,box-shadow]',
                            field.state.meta.isTouched && !field.state.meta.isValid
                              ? 'border-destructive ring-destructive/30 dark:ring-destructive/40 ring-[3px]'
                              : 'border-muted-foreground/30 focus-within:border-primary focus-within:ring-primary/30 focus-within:ring-[3px]'
                          )}
                        >
                          <span className="text-muted-foreground">+63</span>
                          <Input
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            aria-invalid={!!field.state.meta.isTouched && !field.state.meta.isValid}
                            className="h-12 rounded-l-none border-0 bg-transparent pl-0 shadow-none ring-0 focus-visible:border-0 focus-visible:ring-0 aria-invalid:border-0 aria-invalid:ring-0 dark:bg-transparent"
                            placeholder="9171234567"
                          />
                        </div>

                        <FieldInfo field={field} />
                      </div>
                    )}
                  />
                </div>
              </Card>

              {/* Address */}
              <Card className="gap-4">
                <div className="w-full px-6">
                  <h3 className="flex items-center gap-2 text-lg font-bold">
                    Address
                  </h3>
                  <p className="text-muted-foreground pb-2 text-sm">
                    Please enter your present address
                  </p>

                  <div className="bg-muted-foreground/20 w-[calc(100%-1.5rem]) h-px" />
                </div>

                <div className="space-y-4 px-6">
                  <form.Field
                    name="province"
                    children={(field) => (
                      <div className="space-y-2">
                        <Label className="block">State / Province</Label>
                        <Select
                          value={field.state.value}
                          onValueChange={(value) => {
                            field.handleChange(value)
                            setSelectedProvinceCode(value)
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {provinces.map((prov) => {
                              return (
                                <SelectItem
                                  value={`${prov.code}`}
                                  key={prov.code}
                                >
                                  {prov.province}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  />

                  <form.Field
                    name="city"
                    children={(field) => (
                      <div className="space-y-2">
                        <Label className="block">City / Municipality</Label>
                        <Select
                          value={field.state.value}
                          onValueChange={(value) => {
                            field.handleChange(value)
                            const zipCode = getZipCodeByCityCode(value)
                            form.setFieldValue('zipCode', zipCode ?? '')
                          }}
                          disabled={form.getFieldValue('province').length === 0}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {citiesMunicipalities
                              .filter(
                                (c) => c.provCode === selectedProvinceCode
                              )
                              .map((city, index) => {
                                return (
                                  <SelectItem
                                    value={`${city.cityCode}`}
                                    key={`${city.cityCode}-${index}`}
                                  >
                                    {city.city}
                                  </SelectItem>
                                )
                              })}
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  />

                  <form.Field
                    name="zipCode"
                    children={(field) => (
                      <div className="space-y-2">
                        <Label className="block">ZIP Code</Label>
                        <Input
                          value={field.state.value ?? ''}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="h-12"
                          placeholder="e.g. 1000"
                        />
                      </div>
                    )}
                  />

                  <form.Field
                    name="addressLine1"
                    children={(field) => (
                      <div className="space-y-2">
                        <Label className="block">Address Line 1</Label>
                        <Input
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          className="h-12"
                          placeholder="e.g. House/Unit/Street"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  />

                  <form.Field
                    name="addressLine2"
                    children={(field) => (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="block">Address Line 2</Label>
                          <span className="text-muted-foreground text-xs">
                            (Optional)
                          </span>
                        </div>

                        <Input
                          value={field.state.value ?? ''}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          className="h-12"
                          placeholder="e.g. Brgy/Subdivision/Details"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  />
                </div>
              </Card>
            </div>
          </div>
        </div>

        <div className="bg-card border-muted-foreground/20 flex w-full items-center justify-end gap-2 rounded-md border px-6 py-5">
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="px-12"
            onClick={decreaseStep}
          >
            Back
          </Button>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                size="lg"
                className="rounded-lg px-12 py-3 font-medium text-white"
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'View Available Plans'}
              </Button>
            )}
          />
        </div>
      </form>
    </div>
  )
}
