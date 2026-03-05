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
  PersonalInfoFormData,
} from '@/types/travel-insurance/travel-insurance-request'
import { FieldInfo } from '@/components/ui/form'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { provinces } from '@/constants/phil-prov'
import { citiesMunicipalities } from '@/constants/phil-city-mun'
import { useState, useEffect, useRef, useMemo } from 'react'
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
import { useSignInStateStore } from '@/store/signin-store'
import { mapTravelInsuranceStoreToFullQuoteRequest } from '@/utils/travel-insurance-mapper'
import { useFullQuoteRequest } from '@/app/data/mutations/full-quote-request'
import { CircleCheck, OctagonAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const signinState = useSignInStateStore()

  const [selectedProvinceCode, setSelectedProvinceCode] = useState<
    Record<number, string>
  >({})
  const formErrorRefs = useRef<{ [key: string]: HTMLElement | null }>({})
  const [activeTab, setActiveTab] = useState('traveler-0')

  const [hasValidated, setHasValidated] = useState(false)

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
          customFields: {},
        },
        agentCode!,
        // Pass KYC profile only if user has valid email and name
        signinState.email && 
        signinState.email.trim() !== '' && 
        signinState.firstName && 
        signinState.firstName.trim() !== '' &&
        signinState.firstName !== 'Juan' && // Not default value
        signinState.lastName && 
        signinState.lastName.trim() !== '' &&
        signinState.lastName !== 'Dela Cruz' // Not default value
        ? {
          email: signinState.email,
          firstName: signinState.firstName,
          lastName: signinState.lastName,
          dateOfBirth: signinState.dateOfBirth,
          gender: signinState.gender,
          phoneNumber: signinState.phoneNumber,
          country: signinState.country,
          state: signinState.state,
          city: signinState.city,
          zipCode: signinState.zipCode,
          address: signinState.address,
        } : undefined
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
        const INITIAL_TRAVELLER_DATA = {
          firstName: '',
          middleName: '',
          lastName: '',
          suffix: 'No Suffix' as const,
          gender: 'M' as const,
          email: '',
          mobileNumber: '',
          idType: 'PAS' as const,
          idNumber: '',
          idFrontUploaded: false,
          idBackUploaded: false,
          address: {
            province: '',
            city: '',
            zipCode: '',
            line1: '',
            line2: '',
          },
          isCovidVaccinated: false,
          is_data_sharing_consent: false,
          hasBeneficiary: false,
          beneficiary: {
            firstName: '',
            middleName: '',
            lastName: '',
            dateOfBirth: null,
            relationship: '',
          },
          dateOfBirth: new Date('1990-01-01'),
        } satisfies PersonalInfoFormData

        newTravelers.push(INITIAL_TRAVELLER_DATA)
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
  }, [form.state.values?.travelers])

  const FIELD_INDEX_REGEX = /travelers\[(\d+)\]/g
  const indexesWithErrors = useMemo(() => {
    if (!hasValidated)
      return { indexes: [] as number[], fields: [] as string[] }

    const fields = Object.keys(form.state.errorMap.onChange ?? {})
    const indexes = [
      ...new Set(
        fields.flatMap((field) => {
          const matches = [...field.matchAll(FIELD_INDEX_REGEX)]
          return matches.map((m) => Number(m[1]))
        })
      ),
    ]

    return { indexes, fields }
  }, [form.state.errorMap, hasValidated])

  const currentTabIndex = useMemo(
    () => parseInt(activeTab.split('-')[1], 10),
    [activeTab]
  )

  const scrollToFirstError = (errorFields?: string[]) => {
    const fields = errorFields ?? indexesWithErrors.fields
    const { currentTabErrors } = getSortedTravelerErrors(fields)

    if (!currentTabErrors.length) {
      handleSetActiveTab(Math.min(currentTabIndex + 1, totalTravelers - 1))
      return
    }

    const firstErrorField = currentTabErrors[0]
    const element = formErrorRefs.current[firstErrorField]
    handleSetActiveTab(currentTabIndex)

    if (!element) return

    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if ('focus' in element) element.focus()
  }

  const handleNextTraveller = () => {
    if (hasValidated) {
      const { fieldsErrorMap } = form.validateSync('submit')
      const errorFields = Object.keys(fieldsErrorMap ?? {})
      scrollToFirstError(errorFields)

      const { currentTabErrors } = getSortedTravelerErrors(errorFields)
      if (currentTabErrors.length > 0) return
    }

    if (currentTabIndex < totalTravelers - 1) {
      handleSetActiveTab(currentTabIndex + 1)
    }
  }

  const handlePrevTraveller = () => {
    if (currentTabIndex > 0) handleSetActiveTab(currentTabIndex - 1)
  }

  const handleSetActiveTab = (index: number) => {
    setActiveTab(`traveler-${index}`)
    document.getElementById('travelers-info')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const handleTriggerValidation = () => {
    setHasValidated(true)
    form.validateSync('submit')
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

  function fieldHasError(field: any) {
    const isValid = field.state.meta.isTouched && !field.state.meta.isValid
    const errorMessage = field.state.meta.errors[0]?.message

    return isValid && errorMessage && errorMessage.length > 0
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
          <Card id="travelers-info" className="gap-4 shadow-none">
            <CardHeader className="text-2xl font-bold">
              Travelers Information
            </CardHeader>

            <div className="space-y-4 px-6 pb-6">
              <form.Field name="travelers" mode="array">
                {(field) => {
                  return (
                    <Tabs
                      value={activeTab}
                      onValueChange={(value) => {
                        if (hasValidated) handleTriggerValidation()
                        return setActiveTab(value)
                      }}
                      className="w-full"
                    >
                      <div className="relative">
                        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                          <TabsList
                            className="h-auto w-max min-w-full justify-start gap-2 rounded-none border-b border-gray-200 bg-transparent p-0"
                            style={{
                              display: 'inline-flex',
                            }}
                          >
                            {field.state.value?.map((_, index) => {
                              const isAdult =
                                index < (travelDetails.noOfAdults || 0)
                              const travelerType = isAdult ? 'Adult' : 'Child'
                              const hasError =
                                indexesWithErrors.indexes.includes(index)

                              return (
                                <TabsTrigger
                                  key={index}
                                  value={`traveler-${index}`}
                                  className={cn(
                                    'data-[state=active]:border-b-primary data-[state=active]:text-primary flex-shrink-0 rounded-none border-b-2 border-transparent bg-transparent px-3 pt-0 pb-3 text-sm font-semibold text-gray-400 shadow-none transition-colors hover:text-gray-600 data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none',
                                    {
                                      'data-[state=active]:text-destructive data-[state=active]:border-b-destructive':
                                        hasError,
                                    }
                                  )}
                                >
                                  <span className="flex items-center gap-1.5">
                                    {hasError ? (
                                      <OctagonAlert
                                        className="text-destructive flex-shrink-0"
                                        size={16}
                                      />
                                    ) : (
                                      hasValidated && (
                                        <CircleCheck className="text-primary flex-shrink-0" size={16} />
                                      )
                                    )}
                                    <span className="whitespace-nowrap">
                                      Traveler {index + 1}
                                    </span>
                                    <span className="text-xs font-normal opacity-70 whitespace-nowrap">
                                      ({travelerType})
                                    </span>
                                  </span>
                                </TabsTrigger>
                              )
                            })}
                          </TabsList>
                        </div>
                        {/* Scroll indicator shadows */}
                        <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-white to-transparent" />
                        <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white to-transparent" />
                      </div>

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
                                  onIdUploaded={(frontFile, backFile) => {
                                    form.setFieldValue(
                                      `travelers[${index}].idFrontUploaded`,
                                      !!frontFile
                                    )
                                    form.setFieldValue(
                                      `travelers[${index}].idBackUploaded`,
                                      !!backFile
                                    )
                                  }}
                                />
                                {/* Show validation errors for ID uploads */}
                                <form.Field
                                  name={`travelers[${index}].idFrontUploaded`}
                                  children={(field) => (
                                    <FieldInfo field={field} />
                                  )}
                                />
                                <form.Field
                                  name={`travelers[${index}].idBackUploaded`}
                                  children={(field) => (
                                    <FieldInfo field={field} />
                                  )}
                                />
                              </div>

                              {/* Name Fields Row */}
                              <div className="grid gap-4 lg:grid-cols-3">
                                <form.Field
                                  name={`travelers[${index}].firstName`}
                                  children={(nameField) => {
                                    const haveError = fieldHasError(nameField)
                                    return (
                                      <div className="space-y-2">
                                        <Label className="text-primary block">
                                          First Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                          value={nameField.state.value}
                                          onChange={(e) =>
                                            nameField.handleChange(
                                              e.target.value
                                            )
                                          }
                                          onBlur={nameField.handleBlur}
                                          className={`h-12 ${
                                            haveError
                                              ? 'border-destructive'
                                              : ''
                                          }`}
                                          placeholder="Enter first name"
                                        />
                                        <FieldInfo field={nameField} />
                                      </div>
                                    )
                                  }}
                                />

                                <form.Field
                                  name={`travelers[${index}].middleName`}
                                  children={(middleNameField) => (
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
                                        value={
                                          middleNameField.state.value ?? ''
                                        }
                                        onChange={(e) =>
                                          middleNameField.handleChange(
                                            e.target.value
                                          )
                                        }
                                        onBlur={middleNameField.handleBlur}
                                        className="h-12"
                                        placeholder="Enter middle name"
                                      />
                                      <FieldInfo field={middleNameField} />
                                    </div>
                                  )}
                                />

                                <form.Field
                                  name={`travelers[${index}].lastName`}
                                  children={(lastNameField) => {
                                    const haveError =
                                      fieldHasError(lastNameField)
                                    return (
                                      <div className="space-y-2">
                                        <Label className="text-primary block">
                                          Last Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                          value={lastNameField.state.value}
                                          onChange={(e) =>
                                            lastNameField.handleChange(
                                              e.target.value
                                            )
                                          }
                                          onBlur={lastNameField.handleBlur}
                                          className={`h-12 ${
                                            haveError
                                              ? 'border-destructive'
                                              : ''
                                          }`}
                                          placeholder="Enter last name"
                                        />
                                        <FieldInfo field={lastNameField} />
                                      </div>
                                    )
                                  }}
                                />
                              </div>

                              <div className="grid gap-4 md:grid-cols-2">
                                <form.Field
                                  name={`travelers[${index}].suffix`}
                                  children={(sField) => (
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
                                        value={sField.state.value}
                                        defaultValue="No Suffix"
                                        onValueChange={(value) =>
                                          sField.handleChange(value as any)
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
                                      <FieldInfo field={sField} />
                                    </div>
                                  )}
                                />

                                <form.Field
                                  name={`travelers[${index}].gender`}
                                  children={(field) => (
                                    <div className="space-y-2">
                                      <Label className="text-primary block">
                                        Gender <span className="text-red-500">*</span>
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
                                  children={(dobField) => {
                                    const isAdult =
                                      index < (travelDetails.noOfAdults || 0)
                                    const today = new Date()
                                    const eighteenYearsAgo = new Date()
                                    eighteenYearsAgo.setFullYear(
                                      today.getFullYear() - 18
                                    )

                                    const haveError = fieldHasError(dobField)

                                    return (
                                      <div className="space-y-2">
                                        <Label className="text-primary block">
                                          Date of Birth <span className="text-red-500">*</span>
                                        </Label>
                                        <div>
                                          <DateTimePicker
                                            variant="date"
                                            value={
                                              dobField.state.value ?? undefined
                                            }
                                            onChange={(value) =>
                                              dobField.handleChange(value)
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
                                            className={`${haveError && 'border-destructive'}`}
                                          />
                                        </div>
                                        <FieldInfo field={dobField} />
                                      </div>
                                    )
                                  }}
                                />

                                <form.Field
                                  name={`travelers[${index}].email`}
                                  children={(emailField) => {
                                    const haveError = fieldHasError(emailField)
                                    return (
                                      <div className="space-y-2">
                                        <Label className="text-primary block">
                                          Email <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                          value={emailField.state.value}
                                          onChange={(e) =>
                                            emailField.handleChange(
                                              e.target.value
                                            )
                                          }
                                          onBlur={emailField.handleBlur}
                                          className={`h-12 ${
                                            haveError
                                              ? 'border-destructive'
                                              : ''
                                          }`}
                                          placeholder="johndoe@example.com"
                                        />
                                        <FieldInfo field={emailField} />
                                      </div>
                                    )
                                  }}
                                />

                                <form.Field
                                  name={`travelers[${index}].mobileNumber`}
                                  children={(mobileField) => {
                                    const haveError = fieldHasError(mobileField)
                                    return (
                                      <div className="space-y-2">
                                        <Label className="text-primary block">
                                          Mobile Number <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="dark:bg-input/30 border-muted-foreground/30 flex items-center gap-2 rounded-full border pl-2">
                                          <span>+63</span>
                                          <Input
                                            value={mobileField.state.value}
                                            onChange={(e) =>
                                              mobileField.handleChange(
                                                e.target.value
                                              )
                                            }
                                            onBlur={mobileField.handleBlur}
                                            className={`h-12 rounded-l-none bg-none ${
                                              haveError
                                                ? 'border-destructive'
                                                : ''
                                            }`}
                                            placeholder="9123456789"
                                          />
                                        </div>

                                        <FieldInfo field={mobileField} />
                                      </div>
                                    )
                                  }}
                                />

                                <form.Field
                                  name={`travelers[${index}].idType`}
                                  children={(field) => (
                                    <div className="w-full space-y-2">
                                      <Label className="text-primary block">
                                        ID Type <span className="text-red-500">*</span>
                                      </Label>

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
                                  children={(idNumberField) => {
                                    const idType = form.getFieldValue(
                                      `travelers[${index}].idType`
                                    )
                                    const haveError =
                                      fieldHasError(idNumberField)

                                    return (
                                      <div className="w-full space-y-2">
                                        <div className="flex justify-between">
                                          <Label className="text-primary block">
                                            ID Number <span className="text-red-500">*</span>
                                          </Label>
                                          {idType && (
                                            <p className="text-muted-foreground text-xs">
                                              {getIdFormatDescription(idType)}
                                            </p>
                                          )}
                                        </div>

                                        <Input
                                          value={idNumberField.state.value}
                                          onChange={(e) =>
                                            idNumberField.handleChange(
                                              e.target.value
                                            )
                                          }
                                          onBlur={idNumberField.handleBlur}
                                          className={`h-12 ${haveError && 'border-destructive'}`}
                                          placeholder="Enter ID Number"
                                        />

                                        <FieldInfo field={idNumberField} />
                                      </div>
                                    )
                                  }}
                                />

                                <form.Field
                                  name={`travelers[${index}].address.province`}
                                  children={(provinceField) => {
                                    const haveError =
                                      fieldHasError(provinceField)
                                    return (
                                      <div className="space-y-2">
                                        <Label className="text-primary block">
                                          State / Province <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                          value={provinceField.state.value}
                                          onValueChange={(value) => {
                                            provinceField.handleChange(value)
                                            setSelectedProvinceCode((prev) => ({
                                              ...prev,
                                              [index]: value,
                                            }))
                                          }}
                                        >
                                          <SelectTrigger
                                            className={`h-12 w-full ${haveError && 'border-destructive'}`}
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
                                        <FieldInfo field={provinceField} />
                                      </div>
                                    )
                                  }}
                                />

                                <form.Field
                                  name={`travelers[${index}].address.city`}
                                  children={(cityField) => {
                                    const haveError = fieldHasError(cityField)
                                    return (
                                      <div className="space-y-2">
                                        <Label className="text-primary block">
                                          City / Municipality <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                          value={cityField.state.value}
                                          onValueChange={(value) => {
                                            cityField.handleChange(value)
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
                                        >
                                          <SelectTrigger
                                            className={`h-12 w-full ${haveError && 'border-destructive'}`}
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
                                        <FieldInfo field={cityField} />
                                      </div>
                                    )
                                  }}
                                />

                                <form.Field
                                  name={`travelers[${index}].address.zipCode`}
                                  children={(zipField) => {
                                    const haveError = fieldHasError(zipField)
                                    return (
                                      <div className="space-y-2">
                                        <Label className="text-primary block">
                                          ZIP Code <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                          value={zipField.state.value}
                                          onChange={(e) =>
                                            zipField.handleChange(
                                              e.target.value
                                            )
                                          }
                                          className={`h-12 ${haveError && 'border-destructive'}`}
                                          placeholder="Enter ZIP Code"
                                        />
                                        <FieldInfo field={zipField} />
                                      </div>
                                    )
                                  }}
                                />

                                <form.Field
                                  name={`travelers[${index}].address.line1`}
                                  children={(l1Field) => {
                                    const haveError = fieldHasError(l1Field)
                                    return (
                                      <div className="space-y-2">
                                        <Label className="text-primary block">
                                          Address Line 1 <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                          maxLength={45}
                                          value={l1Field.state.value}
                                          onChange={(e) =>
                                            l1Field.handleChange(e.target.value)
                                          }
                                          onBlur={l1Field.handleBlur}
                                          className={`h-12 ${haveError && 'border-destructive'}`}
                                          placeholder="Enter full address line 1"
                                        />
                                        <FieldInfo field={l1Field} />
                                      </div>
                                    )
                                  }}
                                />

                                <form.Field
                                  name={`travelers[${index}].address.line2`}
                                  children={(l2Field) => {
                                    const haveError = fieldHasError(l2Field)
                                    return (
                                      <div className="space-y-2">
                                        <Label className="text-primary block">
                                          Address Line 2
                                        </Label>
                                        <Input
                                          value={l2Field.state.value ?? ''}
                                          onChange={(e) =>
                                            l2Field.handleChange(e.target.value)
                                          }
                                          onBlur={l2Field.handleBlur}
                                          className={`h-12 ${haveError && 'border-destructive'}`}
                                          placeholder="Enter full address line 2"
                                          maxLength={45}
                                        />
                                        <FieldInfo field={l2Field} />
                                      </div>
                                    )
                                  }}
                                />
                              </div>

                              {/* COVID Vaccination Status */}
                              <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                                <form.Field
                                  name={`travelers[${index}].isCovidVaccinated`}
                                  children={(field) => (
                                    <div className="space-y-2">
                                      <div className="flex items-center space-x-3">
                                        <Checkbox
                                          id={`covid-vaccinated-${index}`}
                                          checked={field.state.value || false}
                                          onCheckedChange={(checked) => {
                                            field.handleChange(checked as boolean)
                                          }}
                                        />
                                        <label
                                          htmlFor={`covid-vaccinated-${index}`}
                                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                          I am fully vaccinated against COVID-19
                                        </label>
                                      </div>
                                      <FieldInfo field={field} />
                                    </div>
                                  )}
                                />
                              </div>

                              {/* Data Sharing Consent Agreement */}
                              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                                <form.Field
                                  name={`travelers[${index}].is_data_sharing_consent`}
                                  children={(field) => {
                                    const haveError = fieldHasError(field)
                                    return (
                                      <div className="space-y-2">
                                        <div className="flex items-start space-x-3">
                                          <Checkbox
                                            id={`data-sharing-consent-${index}`}
                                            checked={field.state.value || false}
                                            onCheckedChange={(checked) => {
                                              field.handleChange(checked as boolean)
                                            }}
                                            className={`mt-1 ${haveError ? 'border-destructive' : ''}`}
                                          />
                                          <label
                                            htmlFor={`data-sharing-consent-${index}`}
                                            className="text-sm leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                          >
                                            I agree to the{' '}
                                            <a
                                              href="/data-sharing-consent"
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-primary hover:underline font-medium"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              Data Sharing Consent Agreement
                                            </a>
                                            {' '}<span className="text-red-500">*</span>
                                          </label>
                                        </div>
                                        <FieldInfo field={field} />
                                      </div>
                                    )
                                  }}
                                />
                              </div>

                              {/* Beneficiary form enabled */}
                              {true && (
                              <Card className="mt-6 shadow-none">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                  <div className="text-lg font-semibold">
                                    Beneficiary
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <form.Field
                                      name={`travelers[${index}].hasBeneficiary`}
                                      children={(field) => (
                                        <Checkbox
                                          id={`has-beneficiary-${index}`}
                                          checked={field.state.value}
                                          onCheckedChange={() => {
                                            const value = !field.state.value
                                            field.handleChange(value)

                                            if (!value) {
                                              form.setFieldValue(
                                                `travelers[${index}].beneficiary`,
                                                {
                                                  firstName: '',
                                                  middleName: '',
                                                  lastName: '',
                                                  dateOfBirth: null,
                                                  relationship: '',
                                                }
                                              )
                                            }
                                          }}
                                        />
                                      )}
                                    />

                                    <label
                                      htmlFor={`has-beneficiary-${index}`}
                                      className="text-sm leading-none font-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                      I have a beneficiary
                                    </label>
                                  </div>
                                </CardHeader>
                                <form.Subscribe
                                  selector={(state) =>
                                    state.values.travelers[index].hasBeneficiary
                                  }
                                >
                                  {(hasBeneficiary) => (
                                    <div className="flex flex-col gap-4 space-y-4 px-6 pb-6">
                                      <div className="grid gap-4 md:grid-cols-3">
                                        <form.Field
                                          name={`travelers[${index}].beneficiary.firstName`}
                                          children={(fNameField) => {
                                            const haveError =
                                              fieldHasError(fNameField)
                                            return (
                                              <div className="space-y-2">
                                                <Label className="text-primary block">
                                                  First Name
                                                </Label>
                                                <Input
                                                  value={
                                                    fNameField.state.value ?? ''
                                                  }
                                                  onChange={(e) =>
                                                    fNameField.handleChange(
                                                      e.target.value
                                                    )
                                                  }
                                                  onBlur={fNameField.handleBlur}
                                                  className={`h-12 ${haveError && 'border-destructive'}`}
                                                  placeholder="Enter beneficiary first name"
                                                  disabled={!hasBeneficiary}
                                                  required={hasBeneficiary}
                                                />
                                                <FieldInfo field={fNameField} />
                                              </div>
                                            )
                                          }}
                                        />
                                        <form.Field
                                          name={`travelers[${index}].beneficiary.middleName`}
                                          children={(mNameField) => {
                                            const haveError =
                                              fieldHasError(mNameField)
                                            return (
                                              <div className="space-y-2">
                                                <Label className="text-primary block">
                                                  Middle Name
                                                </Label>
                                                <Input
                                                  value={
                                                    mNameField.state.value ?? ''
                                                  }
                                                  onChange={(e) =>
                                                    mNameField.handleChange(
                                                      e.target.value
                                                    )
                                                  }
                                                  onBlur={mNameField.handleBlur}
                                                  className={`h-12 ${haveError && 'border-destructive'}`}
                                                  placeholder="Enter beneficiary middle name"
                                                  disabled={!hasBeneficiary}
                                                />
                                                <FieldInfo field={mNameField} />
                                              </div>
                                            )
                                          }}
                                        />
                                        <form.Field
                                          name={`travelers[${index}].beneficiary.lastName`}
                                          children={(lNameField) => {
                                            const haveError =
                                              fieldHasError(lNameField)
                                            return (
                                              <div className="space-y-2">
                                                <Label className="text-primary block">
                                                  Last Name
                                                </Label>
                                                <Input
                                                  value={
                                                    lNameField.state.value ?? ''
                                                  }
                                                  onChange={(e) =>
                                                    lNameField.handleChange(
                                                      e.target.value
                                                    )
                                                  }
                                                  onBlur={lNameField.handleBlur}
                                                  className={`h-12 ${haveError && 'border-destructive'}`}
                                                  placeholder="Enter beneficiary last name"
                                                  disabled={!hasBeneficiary}
                                                  required={hasBeneficiary}
                                                />
                                                <FieldInfo field={lNameField} />
                                              </div>
                                            )
                                          }}
                                        />
                                      </div>

                                      <div className="grid gap-4 md:grid-cols-2">
                                        <form.Field
                                          name={`travelers[${index}].beneficiary.dateOfBirth`}
                                          children={(bdobField) => {
                                            const haveError =
                                              fieldHasError(bdobField)
                                            return (
                                              <div className="space-y-2">
                                                <Label className="text-primary block">
                                                  Date of Birth
                                                </Label>
                                                {hasBeneficiary ? (
                                                  <DateTimePicker
                                                    variant="date"
                                                    value={
                                                      bdobField.state.value ??
                                                      undefined
                                                    }
                                                    onChange={(value) =>
                                                      bdobField.handleChange(
                                                        value
                                                      )
                                                    }
                                                    disabled={(date) =>
                                                      date >= new Date()
                                                    }
                                                    required
                                                    className={`${haveError && 'border-destructive'}`}
                                                  />
                                                ) : (
                                                  <DateTimePicker
                                                    variant="date"
                                                    value={
                                                      bdobField.state.value ??
                                                      undefined
                                                    }
                                                    onChange={(value) =>
                                                      bdobField.handleChange(
                                                        value
                                                      )
                                                    }
                                                    disabled={() => true}
                                                  />
                                                )}
                                                <FieldInfo field={bdobField} />
                                              </div>
                                            )
                                          }}
                                        />

                                        <form.Field
                                          name={`travelers[${index}].beneficiary.relationship`}
                                          children={(rField) => {
                                            const haveError =
                                              fieldHasError(rField)
                                            return (
                                              <div className="space-y-2">
                                                <Label className="text-primary block">
                                                  Relationship
                                                </Label>
                                                <Input
                                                  value={
                                                    rField.state.value ?? ''
                                                  }
                                                  onChange={(e) =>
                                                    rField.handleChange(
                                                      e.target.value
                                                    )
                                                  }
                                                  onBlur={rField.handleBlur}
                                                  className={`h-12 ${haveError && 'border-destructive'}`}
                                                  placeholder="e.g., Spouse, Parent, Child"
                                                  disabled={!hasBeneficiary}
                                                  required={hasBeneficiary}
                                                />
                                                <FieldInfo field={rField} />
                                              </div>
                                            )
                                          }}
                                        />
                                      </div>

                                      <div>
                                        <form.Field
                                          name={`travelers[${index}].beneficiary`}
                                          children={(field) => (
                                            <FieldInfo field={field} />
                                          )}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </form.Subscribe>
                              </Card>
                              )}
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

          <div className="sticky bottom-0 flex items-center justify-center gap-3 bg-[#F3F5FC] px-1.5 py-6 lg:justify-start lg:px-0">
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="w-1/2 rounded-full bg-transparent px-12 font-semibold lg:w-max"
              onClick={() => {
                if (currentTabIndex === 0) return prevStep()
                else return handlePrevTraveller()
              }}
            >
              {currentTabIndex === 0 ? 'Back' : 'Previous Traveller'}
            </Button>

            {currentTabIndex < totalTravelers - 1 ? (
              <Button
                type="button"
                size="lg"
                className="from-primary to-accent w-1/2 rounded-full bg-gradient-to-r via-90% px-14 lg:w-max dark:text-white"
                onClick={handleNextTraveller}
              >
                Next Traveller
              </Button>
            ) : (
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button
                    size="lg"
                    className="from-primary to-accent w-1/2 rounded-full bg-gradient-to-r via-90% px-14 lg:w-max dark:text-white"
                    onClick={handleTriggerValidation}
                  >
                    {isSubmitting ? 'Processing...' : 'Request Full Quote'}
                  </Button>
                )}
              />
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
