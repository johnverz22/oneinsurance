'use client'

import { useForm } from '@tanstack/react-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  useFullQuoteResponseStore,
  useTravelInsuranceStore,
} from '@/store/travel-insurance-store'
import {
  travelersInfoSchema,
  PH_ID_TYPES,
  SuffixEnum,
  getIdFormatDescription,
} from '@/types/travel-insurance/travel-insurance-request'
import { FieldInfo } from '@/components/ui/form'
import { useRouter } from 'next/navigation'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { provinces } from '@/constants/phil-prov'
import { citiesMunicipalities } from '@/constants/phil-city-mun'
import { useState, useEffect, useRef } from 'react'
import { getZipCodeByCityCode } from '@/utils/address-util'
import { IdUploadComponent } from '../id-upload/id-upload-component'
import { z } from 'zod'
import { getSortedTravelerErrors } from '@/utils/travel-helpers'
import { Checkbox } from '@/components/ui/checkbox'
import {
  FullQuoteResponse,
  FullQuoteResponseSchema,
} from '@/types/travel-insurance/policy-types'
import { FullQuoteResponseValidationErrorSchema } from '@/types/travel-insurance/error-travel-response'
import { useAgentCodeStore } from '@/store/agent-code-store'
import { mapTravelInsuranceStoreToFullQuoteRequest } from '@/utils/travel-insurance-mapper'
import { useFullQuoteRequest } from '@/app/data/mutations/full-quote-request'

// Wrapper schema for the form
const travelersFormSchema = z.object({
  travelers: travelersInfoSchema,
})

export function PersonalInfoForm() {
  const {
    travelDetails,
    travelersInfo,
    coverageOption,
    nextStep,
    prevStep,
    updateTravelersInfo,
  } = useTravelInsuranceStore()
  const { agentCode } = useAgentCodeStore()
  const { mutateAsync } = useFullQuoteRequest()
  const { setApiResponse } = useFullQuoteResponseStore()

  const router = useRouter()
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<
    Record<number, string>
  >({})
  const formErrorRefs = useRef<{ [key: string]: HTMLElement | null }>({})
  const [activeTab, setActiveTab] = useState('traveler-0')
  const [hasBeneficiary, setHasBeneficiary] = useState<Record<number, boolean>>(
    {}
  )

  const totalTravelers =
    (travelDetails.noOfAdults || 0) + (travelDetails.noOfChildren || 0)

  const form = useForm({
    defaultValues: {
      travelers: travelersInfo,
    },
    onSubmit: async ({ value }) => {
      updateTravelersInfo(value.travelers)
      const fullQuoteRequestBody = mapTravelInsuranceStoreToFullQuoteRequest(
        {
          travelDetails,
          coverageOption,
          travelersInfo: value.travelers,
        },
        agentCode!
      )

      const fullQuoteResponse = await mutateAsync({
        fullQuoteRequest: fullQuoteRequestBody,
      })

      if (
        FullQuoteResponseValidationErrorSchema.safeParse(fullQuoteResponse)
          .success
      ) {
        const error =
          FullQuoteResponseValidationErrorSchema.safeParse(fullQuoteResponse)
        alert(
          `Validation Error. Code: ${error.data?.data.ValidateResult.ErrorMessage.at(0)?.code} ${error.data?.data.ValidateResult.ErrorMessage.at(0)?.message}`
        )
        return
      }

      if (!fullQuoteResponse?.success) {
        alert(fullQuoteResponse?.message)
        return
      }

      FullQuoteResponseSchema.parse(fullQuoteResponse)

      setApiResponse(fullQuoteResponse as FullQuoteResponse)
      nextStep()
    },
    validators: {
      onChange: travelersFormSchema,
    },
  })

  // Initialize travelers based on travel details
  useEffect(() => {
    const currentTravelers = form.getFieldValue('travelers') || []

    // Always ensure we have the right number of travelers
    if (currentTravelers.length !== totalTravelers) {
      const newTravelers = []

      // Keep existing travelers up to the required count
      for (
        let i = 0;
        i < Math.min(currentTravelers.length, totalTravelers);
        i++
      ) {
        newTravelers.push(currentTravelers[i])
      }

      // Add new empty travelers if needed
      for (let i = currentTravelers.length; i < totalTravelers; i++) {
        newTravelers.push({
          firstName: '',
          middleName: '',
          lastName: '',
          suffix: 'No Suffix' as const,
          gender: 'M' as const,
          email: '',
          mobileNumber: '',
          idType: 'PAS' as const,
          idNumber: '',
          address: {
            province: '',
            city: '',
            zipCode: '',
            line1: '',
            line2: '',
          },
          beneficiary: {
            name: '',
            dateOfBirth: null,
            relationship: '',
          },
          dateOfBirth: new Date('1990-01-01'),
        })
      }

      form.setFieldValue('travelers', newTravelers)
    }
  }, [travelDetails.noOfAdults, travelDetails.noOfChildren, form])

  useEffect(() => {
    const travelers = form.state.values?.travelers
    if (!travelers) return

    const provinceCodes = travelers.reduce(
      (acc, traveler, idx) => {
        if (traveler?.address?.province) {
          acc[idx] = traveler.address.province
        }
        return acc
      },
      {} as Record<number, string>
    )

    setSelectedProvinceCode(provinceCodes)

    // Initialize hasBeneficiary state based on existing data
    const beneficiaryStates = travelers.reduce(
      (acc, traveler, idx) => {
        acc[idx] = !!(
          traveler?.beneficiary?.firstName ||
          traveler?.beneficiary?.lastName ||
          traveler?.beneficiary?.dateOfBirth ||
          traveler?.beneficiary?.relationship
        )
        return acc
      },
      {} as Record<number, boolean>
    )
    setHasBeneficiary(beneficiaryStates)
  }, [form.state.values?.travelers])

  const handleNext = (currentTabIndex: number) => {
    if (currentTabIndex < totalTravelers - 1) {
      setActiveTab(`traveler-${currentTabIndex + 1}`)
      document.getElementById('travelers-info')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

  const scrollToFirstError = async () => {
    const currentTabIndex = parseInt(activeTab.split('-')[1], 10)

    const errors = form.state.errors?.[currentTabIndex] ?? {}
    const sortedTravelerErrors = getSortedTravelerErrors(errors ?? {})

    for (const [index, fields] of Object.entries(sortedTravelerErrors)) {
      const firstErrorField = fields[0]
      if (firstErrorField) {
        if (currentTabIndex !== Number(index)) {
          handleNext(currentTabIndex)
        }

        const element = formErrorRefs.current[firstErrorField]
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' })

        if (element && 'focus' in element) {
          element.focus()
        }

        break
      }
    }
  }

  const handleDataExtracted = (index: number) => (extractedData: any) => {
    if (extractedData.raw.first_name) {
      form.setFieldValue(
        `travelers[${index}].firstName`,
        extractedData.raw.first_name
      )
    }
    if (extractedData.raw.middle_name) {
      form.setFieldValue(
        `travelers[${index}].middleName`,
        extractedData.raw.middle_name
      )
    }
    if (extractedData.raw.last_name) {
      form.setFieldValue(
        `travelers[${index}].lastName`,
        extractedData.raw.last_name
      )
    }
    if (extractedData.raw.id_number) {
      form.setFieldValue(
        `travelers[${index}].idNumber`,
        extractedData.raw.id_number
      )
    }
    if (extractedData.raw.id_type) {
      form.setFieldValue(
        `travelers[${index}].idType`,
        extractedData.raw.id_type
      )
    }
  }

  return (
    <div className="relative w-full space-y-4 border-0">
      <div className="mx-auto w-full max-w-7xl">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit().catch(() => {
              // Scroll to first error when form submission fails
              setTimeout(() => {
                scrollToFirstError()
              }, 100)
            })
          }}
        >
          <Card id="travelers-info" className="gap-4">
            <CardHeader className="text-2xl font-bold">
              Travelers Information
            </CardHeader>

            <div className="space-y-4 px-6 pb-6">
              <form.Field name="travelers" mode="array">
                {(field) => {
                  const travelerCount = field.state.value?.length || 0

                  return (
                    <Tabs
                      value={activeTab}
                      onValueChange={setActiveTab}
                      className="w-full"
                    >
                      <TabsList
                        className="h-auto w-full justify-start gap-6 rounded-none border-b border-gray-200 bg-transparent p-0"
                        style={{
                          display: 'flex',
                        }}
                      >
                        {field.state.value?.map((_, index) => {
                          const isAdult =
                            index < (travelDetails.noOfAdults || 0)
                          const travelerType = isAdult ? 'Adult' : 'Child'

                          return (
                            <TabsTrigger
                              key={index}
                              value={`traveler-${index}`}
                              className="data-[state=active]:border-b-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent bg-transparent px-0 pt-0 pb-3 text-lg font-semibold text-gray-400 shadow-none transition-colors hover:text-gray-600 data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                            >
                              <span className="flex items-center gap-2">
                                Traveler {index + 1}
                                <span className="text-xs font-normal opacity-70">
                                  ({travelerType})
                                </span>
                              </span>
                            </TabsTrigger>
                          )
                        })}
                      </TabsList>

                      {field.state.value?.map((_, index) => {
                        const isAdult = index < (travelDetails.noOfAdults || 0)
                        const travelerType = isAdult ? 'Adult' : 'Child'

                        return (
                          <TabsContent
                            key={index}
                            value={`traveler-${index}`}
                            className="mt-6 space-y-6"
                          >
                            <div className="space-y-4">
                              {/* Traveler Type Badge */}
                              <div className="mb-4 flex items-center gap-2">
                                <span
                                  className={`text-primary rounded-full px-3 py-1 text-sm font-medium ${isAdult ? 'bg-primary/10' : 'bg-accent/10'}`}
                                >
                                  {travelerType} Traveler
                                </span>
                              </div>

                              {/* ID Upload Component */}
                              <div className="w-full">
                                <IdUploadComponent
                                  onDataExtracted={handleDataExtracted(index)}
                                  onProcessingStart={() => {}}
                                />
                              </div>

                              {/* Name Fields Row */}
                              <div className="grid gap-4 lg:grid-cols-3">
                                <form.Field
                                  name={`travelers[${index}].firstName`}
                                  children={(field) => (
                                    <div className="space-y-2">
                                      <Label className="text-primary block">
                                        First Name
                                      </Label>
                                      <Input
                                        ref={(el) => {
                                          formErrorRefs.current[
                                            `travelers[${index}].firstName`
                                          ] = el
                                        }}
                                        value={field.state.value}
                                        onChange={(e) =>
                                          field.handleChange(e.target.value)
                                        }
                                        onBlur={field.handleBlur}
                                        className="h-12"
                                        placeholder="Enter first name"
                                        required
                                      />
                                      <FieldInfo field={field} />
                                    </div>
                                  )}
                                />

                                <form.Field
                                  name={`travelers[${index}].middleName`}
                                  children={(field) => (
                                    <div className="space-y-2">
                                      <div className="flex h-max justify-between">
                                        <Label className="text-primary block">
                                          Middle Name
                                        </Label>
                                        <span className="text-primary text-xs">
                                          (Optional)
                                        </span>
                                      </div>
                                      <Input
                                        value={field.state.value ?? ''}
                                        onChange={(e) =>
                                          field.handleChange(e.target.value)
                                        }
                                        onBlur={field.handleBlur}
                                        className="h-12"
                                        placeholder="Enter middle name"
                                      />
                                      <FieldInfo field={field} />
                                    </div>
                                  )}
                                />

                                <form.Field
                                  name={`travelers[${index}].lastName`}
                                  children={(field) => (
                                    <div className="space-y-2">
                                      <Label className="text-primary block">
                                        Last Name
                                      </Label>
                                      <Input
                                        ref={(el) => {
                                          formErrorRefs.current[
                                            `travelers[${index}].lastName`
                                          ] = el
                                        }}
                                        value={field.state.value}
                                        onChange={(e) =>
                                          field.handleChange(e.target.value)
                                        }
                                        onBlur={field.handleBlur}
                                        className="h-12"
                                        placeholder="Enter last name"
                                        required
                                      />
                                      <FieldInfo field={field} />
                                    </div>
                                  )}
                                />
                              </div>

                              <div className="grid gap-4 md:grid-cols-2">
                                <form.Field
                                  name={`travelers[${index}].suffix`}
                                  children={(field) => (
                                    <div className="space-y-2">
                                      <div className="flex h-max justify-between">
                                        <Label className="text-primary block">
                                          Suffix
                                        </Label>
                                        <span className="text-primary text-xs">
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
                                            <SelectItem
                                              key={suffix}
                                              value={suffix}
                                            >
                                              {suffix}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FieldInfo field={field} />
                                    </div>
                                  )}
                                />

                                <form.Field
                                  name={`travelers[${index}].gender`}
                                  children={(field) => (
                                    <div className="space-y-2">
                                      <Label className="text-primary block">
                                        Gender
                                      </Label>
                                      <div className="border-muted-foreground/30 flex w-full items-center justify-center gap-2 rounded-full border p-1">
                                        <div
                                          className={`w-full rounded-full p-2 text-center hover:cursor-pointer ${field.state.value === 'M' ? 'from-primary to-lilac bg-gradient-to-r text-white' : ''}`}
                                          onClick={() =>
                                            field.handleChange('M')
                                          }
                                        >
                                          Male
                                        </div>
                                        <div
                                          className={`w-full rounded-full p-2 text-center hover:cursor-pointer ${field.state.value === 'F' ? 'from-lilac to-primary bg-gradient-to-r text-white' : ''}`}
                                          onClick={() =>
                                            field.handleChange('F')
                                          }
                                        >
                                          Female
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                />

                                <form.Field
                                  name={`travelers[${index}].dateOfBirth`}
                                  children={(field) => {
                                    const isAdult =
                                      index < (travelDetails.noOfAdults || 0)
                                    const today = new Date()
                                    const eighteenYearsAgo = new Date()
                                    eighteenYearsAgo.setFullYear(
                                      today.getFullYear() - 18
                                    )

                                    return (
                                      <div className="space-y-2">
                                        <Label className="text-primary block">
                                          Date of Birth
                                        </Label>
                                        <div
                                          ref={(el) => {
                                            formErrorRefs.current[
                                              `travelers[${index}].dateOfBirth`
                                            ] = el
                                          }}
                                        >
                                          <DateTimePicker
                                            variant="date"
                                            value={
                                              field.state.value ?? undefined
                                            }
                                            onChange={(value) =>
                                              field.handleChange(value)
                                            }
                                            disabled={(date) => {
                                              if (isAdult) {
                                                // Adults: must be 18 or older (born on or before 18 years ago)
                                                return date > eighteenYearsAgo
                                              } else {
                                                // Children: must be under 18 (born after 18 years ago) and not in the future
                                                return (
                                                  date <= eighteenYearsAgo ||
                                                  date >= today
                                                )
                                              }
                                            }}
                                            required
                                          />
                                        </div>
                                        <FieldInfo field={field} />
                                      </div>
                                    )
                                  }}
                                />

                                <form.Field
                                  name={`travelers[${index}].email`}
                                  children={(field) => (
                                    <div className="space-y-2">
                                      <Label className="text-primary block">
                                        Email
                                      </Label>
                                      <Input
                                        ref={(el) => {
                                          formErrorRefs.current[
                                            `travelers[${index}].email`
                                          ] = el
                                        }}
                                        value={field.state.value}
                                        onChange={(e) =>
                                          field.handleChange(e.target.value)
                                        }
                                        onBlur={field.handleBlur}
                                        className="h-12"
                                        placeholder="johndoe@example.com"
                                        required
                                      />
                                      <FieldInfo field={field} />
                                    </div>
                                  )}
                                />

                                <form.Field
                                  name={`travelers[${index}].mobileNumber`}
                                  children={(field) => (
                                    <div className="space-y-2">
                                      <Label className="text-primary block">
                                        Mobile Number
                                      </Label>
                                      <div className="dark:bg-input/30 border-muted-foreground/30 flex items-center gap-2 rounded-full border pl-2">
                                        <span>+63</span>
                                        <Input
                                          ref={(el) => {
                                            formErrorRefs.current[
                                              `travelers[${index}].mobileNumber`
                                            ] = el
                                          }}
                                          value={field.state.value}
                                          onChange={(e) =>
                                            field.handleChange(e.target.value)
                                          }
                                          onBlur={field.handleBlur}
                                          className="h-12 rounded-l-none bg-none"
                                          placeholder="9123456789"
                                          required
                                        />
                                      </div>

                                      <FieldInfo field={field} />
                                    </div>
                                  )}
                                />

                                <form.Field
                                  name={`travelers[${index}].idType`}
                                  children={(field) => (
                                    <div className="w-full space-y-2">
                                      <Label className="text-primary block">
                                        ID Type
                                      </Label>

                                      <Select
                                        value={field.state.value}
                                        onValueChange={(value) =>
                                          field.handleChange(value as any)
                                        }
                                        required
                                      >
                                        <SelectTrigger
                                          ref={(el) => {
                                            formErrorRefs.current[
                                              `travelers[${index}].idType`
                                            ] = el
                                          }}
                                          className="h-12 w-full"
                                        >
                                          <SelectValue placeholder="ID Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {Object.entries(PH_ID_TYPES).map(
                                            ([value, label]) => (
                                              <SelectItem
                                                key={value}
                                                value={value}
                                              >
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
                                  name={`travelers[${index}].idNumber`}
                                  children={(field) => {
                                    const idType = form.getFieldValue(
                                      `travelers[${index}].idType`
                                    )

                                    return (
                                      <div className="w-full space-y-2">
                                        <div className="flex justify-between">
                                          <Label className="text-primary block">
                                            ID Number
                                          </Label>
                                          {idType && (
                                            <p className="text-muted-foreground text-xs">
                                              {getIdFormatDescription(idType)}
                                            </p>
                                          )}
                                        </div>

                                        <Input
                                          ref={(el) => {
                                            formErrorRefs.current[
                                              `travelers[${index}].idNumber`
                                            ] = el
                                          }}
                                          value={field.state.value}
                                          onChange={(e) =>
                                            field.handleChange(e.target.value)
                                          }
                                          onBlur={field.handleBlur}
                                          className="h-12"
                                          placeholder="Enter ID Number"
                                          required
                                        />

                                        <FieldInfo field={field} />
                                      </div>
                                    )
                                  }}
                                />

                                <form.Field
                                  name={`travelers[${index}].address.province`}
                                  children={(field) => (
                                    <div className="space-y-2">
                                      <Label className="text-primary block">
                                        State / Province
                                      </Label>
                                      <Select
                                        value={field.state.value}
                                        onValueChange={(value) => {
                                          field.handleChange(value)
                                          setSelectedProvinceCode((prev) => ({
                                            ...prev,
                                            [index]: value,
                                          }))
                                        }}
                                        required
                                      >
                                        <SelectTrigger
                                          ref={(el) => {
                                            formErrorRefs.current[
                                              `travelers[${index}].address.province`
                                            ] = el
                                          }}
                                          className="h-12 w-full"
                                        >
                                          <SelectValue placeholder="Select your province" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {provinces.map((prov) => {
                                            return (
                                              <SelectItem
                                                value={prov.code}
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
                                  name={`travelers[${index}].address.city`}
                                  children={(field) => (
                                    <div className="space-y-2">
                                      <Label className="text-primary block">
                                        City / Municipality
                                      </Label>
                                      <Select
                                        value={field.state.value}
                                        onValueChange={(value) => {
                                          field.handleChange(value)
                                          const zipCode =
                                            getZipCodeByCityCode(value)
                                          form.setFieldValue(
                                            `travelers[${index}].address.zipCode`,
                                            zipCode ? String(zipCode) : ''
                                          )
                                        }}
                                        disabled={
                                          !form.getFieldValue(
                                            `travelers[${index}].address.province`
                                          ) ||
                                          form.getFieldValue(
                                            `travelers[${index}].address.province`
                                          ).length === 0
                                        }
                                        required
                                      >
                                        <SelectTrigger
                                          ref={(el) => {
                                            formErrorRefs.current[
                                              `travelers[${index}].address.city`
                                            ] = el
                                          }}
                                          className="h-12 w-full"
                                        >
                                          <SelectValue placeholder="Select your city/municipality" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {citiesMunicipalities
                                            .filter(
                                              (c) =>
                                                c.provCode ===
                                                selectedProvinceCode[index]
                                            )
                                            .map((city, cityIndex) => {
                                              return (
                                                <SelectItem
                                                  value={city.cityCode}
                                                  key={`${city.cityCode}-${cityIndex}`}
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
                                  name={`travelers[${index}].address.zipCode`}
                                  children={(field) => (
                                    <div className="space-y-2">
                                      <Label className="text-primary block">
                                        ZIP Code
                                      </Label>
                                      <Input
                                        ref={(el) => {
                                          formErrorRefs.current[
                                            `travelers[${index}].address.zipCode`
                                          ] = el
                                        }}
                                        value={field.state.value}
                                        onChange={(e) =>
                                          field.handleChange(e.target.value)
                                        }
                                        className="h-12"
                                        placeholder="Enter ZIP Code"
                                        required
                                      />
                                      <FieldInfo field={field} />
                                    </div>
                                  )}
                                />

                                <form.Field
                                  name={`travelers[${index}].address.line1`}
                                  children={(field) => (
                                    <div className="space-y-2">
                                      <Label className="text-primary block">
                                        Address Line 1
                                      </Label>
                                      <Input
                                        ref={(el) => {
                                          formErrorRefs.current[
                                            `travelers[${index}].address.line1`
                                          ] = el
                                        }}
                                        maxLength={45}
                                        value={field.state.value}
                                        onChange={(e) =>
                                          field.handleChange(e.target.value)
                                        }
                                        onBlur={field.handleBlur}
                                        className="h-12"
                                        placeholder="Enter full address line 1"
                                        required
                                      />
                                      <FieldInfo field={field} />
                                    </div>
                                  )}
                                />

                                <form.Field
                                  name={`travelers[${index}].address.line2`}
                                  children={(field) => (
                                    <div className="space-y-2">
                                      <Label className="text-primary block">
                                        Address Line 2
                                      </Label>
                                      <Input
                                        ref={(el) => {
                                          formErrorRefs.current[
                                            `travelers[${index}].address.line2`
                                          ] = el
                                        }}
                                        value={field.state.value ?? ''}
                                        onChange={(e) =>
                                          field.handleChange(e.target.value)
                                        }
                                        onBlur={field.handleBlur}
                                        className="h-12"
                                        placeholder="Enter full address line 2"
                                        maxLength={45}
                                        required
                                      />
                                      <FieldInfo field={field} />
                                    </div>
                                  )}
                                />
                              </div>

                              <Card className="mt-6 shadow-none">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                  <div className="text-lg font-semibold">
                                    Beneficiary
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`has-beneficiary-${index}`}
                                      checked={hasBeneficiary[index] ?? false}
                                      onCheckedChange={(checked) => {
                                        setHasBeneficiary((prev) => ({
                                          ...prev,
                                          [index]: checked as boolean,
                                        }))
                                        // Clear beneficiary data when unchecked
                                        if (!checked) {
                                          form.setFieldValue(
                                            `travelers[${index}].beneficiary.firstName`,
                                            ''
                                          )
                                          form.setFieldValue(
                                            `travelers[${index}].beneficiary.middleName`,
                                            ''
                                          )
                                          form.setFieldValue(
                                            `travelers[${index}].beneficiary.lastName`,
                                            ''
                                          )
                                          form.setFieldValue(
                                            `travelers[${index}].beneficiary.dateOfBirth`,
                                            null
                                          )
                                          form.setFieldValue(
                                            `travelers[${index}].beneficiary.relationship`,
                                            ''
                                          )
                                        }
                                      }}
                                    />
                                    <label
                                      htmlFor={`has-beneficiary-${index}`}
                                      className="text-sm leading-none font-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                      I have a beneficiary
                                    </label>
                                  </div>
                                </CardHeader>
                                <div className="space-y-4 px-6 pb-6">
                                  <div className="flex flex-col gap-4">
                                    <div className="grid gap-4 md:grid-cols-3">
                                      <form.Field
                                        name={`travelers[${index}].beneficiary.firstName`}
                                        children={(field) => (
                                          <div className="space-y-2">
                                            <Label className="text-primary block">
                                              First Name
                                            </Label>
                                            <Input
                                              ref={(el) => {
                                                formErrorRefs.current[
                                                  `travelers[${index}].beneficiary.firstName`
                                                ] = el
                                              }}
                                              value={field.state.value ?? ''}
                                              onChange={(e) =>
                                                field.handleChange(
                                                  e.target.value
                                                )
                                              }
                                              onBlur={field.handleBlur}
                                              className="h-12"
                                              placeholder="Enter beneficiary first name"
                                              disabled={!hasBeneficiary[index]}
                                              required={hasBeneficiary[index]}
                                            />
                                            <FieldInfo field={field} />
                                          </div>
                                        )}
                                      />
                                      <form.Field
                                        name={`travelers[${index}].beneficiary.middleName`}
                                        children={(field) => (
                                          <div className="space-y-2">
                                            <Label className="text-primary block">
                                              Middle Name
                                            </Label>
                                            <Input
                                              ref={(el) => {
                                                formErrorRefs.current[
                                                  `travelers[${index}].beneficiary.middleName`
                                                ] = el
                                              }}
                                              value={field.state.value ?? ''}
                                              onChange={(e) =>
                                                field.handleChange(
                                                  e.target.value
                                                )
                                              }
                                              onBlur={field.handleBlur}
                                              className="h-12"
                                              placeholder="Enter beneficiary middle name"
                                              disabled={!hasBeneficiary[index]}
                                            />
                                            <FieldInfo field={field} />
                                          </div>
                                        )}
                                      />
                                      <form.Field
                                        name={`travelers[${index}].beneficiary.lastName`}
                                        children={(field) => (
                                          <div className="space-y-2">
                                            <Label className="text-primary block">
                                              Last Name
                                            </Label>
                                            <Input
                                              ref={(el) => {
                                                formErrorRefs.current[
                                                  `travelers[${index}].beneficiary.lastName`
                                                ] = el
                                              }}
                                              value={field.state.value ?? ''}
                                              onChange={(e) =>
                                                field.handleChange(
                                                  e.target.value
                                                )
                                              }
                                              onBlur={field.handleBlur}
                                              className="h-12"
                                              placeholder="Enter beneficiary last name"
                                              disabled={!hasBeneficiary[index]}
                                              required={hasBeneficiary[index]}
                                            />
                                            <FieldInfo field={field} />
                                          </div>
                                        )}
                                      />
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                      <form.Field
                                        name={`travelers[${index}].beneficiary.dateOfBirth`}
                                        children={(field) => (
                                          <div className="space-y-2">
                                            <Label className="text-primary block">
                                              Date of Birth
                                            </Label>
                                            {hasBeneficiary[index] ? (
                                              <DateTimePicker
                                                variant="date"
                                                value={
                                                  field.state.value ?? undefined
                                                }
                                                onChange={(value) =>
                                                  field.handleChange(value)
                                                }
                                                disabled={(date) =>
                                                  date >= new Date()
                                                }
                                                required
                                              />
                                            ) : (
                                              <DateTimePicker
                                                variant="date"
                                                value={
                                                  field.state.value ?? undefined
                                                }
                                                onChange={(value) =>
                                                  field.handleChange(value)
                                                }
                                                disabled={() => true}
                                              />
                                            )}
                                            <FieldInfo field={field} />
                                          </div>
                                        )}
                                      />

                                      <form.Field
                                        name={`travelers[${index}].beneficiary.relationship`}
                                        children={(field) => (
                                          <div className="space-y-2">
                                            <Label className="text-primary block">
                                              Relationship
                                            </Label>
                                            <Input
                                              ref={(el) => {
                                                formErrorRefs.current[
                                                  `travelers[${index}].beneficiary.relationship`
                                                ] = el
                                              }}
                                              value={field.state.value ?? ''}
                                              onChange={(e) =>
                                                field.handleChange(
                                                  e.target.value
                                                )
                                              }
                                              onBlur={field.handleBlur}
                                              className="h-12"
                                              placeholder="e.g., Spouse, Parent, Child"
                                              disabled={!hasBeneficiary[index]}
                                              required={hasBeneficiary[index]}
                                            />
                                            <FieldInfo field={field} />
                                          </div>
                                        )}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            </div>
                          </TabsContent>
                        )
                      })}
                    </Tabs>
                  )
                }}
              </form.Field>
            </div>
          </Card>

          <div className="flex items-center justify-center gap-3 px-1.5 pt-6 lg:justify-start lg:px-0">
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="w-1/2 rounded-full bg-transparent px-12 font-semibold lg:w-max"
              onClick={prevStep}
            >
              Back
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([_, isSubmitting]) => (
                <Button
                  onClick={scrollToFirstError}
                  size="lg"
                  className="from-primary to-accent w-1/2 rounded-full bg-gradient-to-r via-90% px-14 lg:w-max dark:text-white"
                >
                  {isSubmitting ? 'Processing...' : 'Request Full Quote'}
                </Button>
              )}
            />
          </div>
        </form>
      </div>
    </div>
  )
}
