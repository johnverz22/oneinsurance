'use client'

import React from 'react'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { Button } from '../ui/button'
import { ChevronLeft, ChevronRight, Loader2Icon } from 'lucide-react'
import { useOnboardingStepStateStore } from '@/store/onboarding-store'
import { Label } from '../ui/label'
import { Checkbox } from '../ui/checkbox'

// Zod schema for form validation
const medicalInsuranceSchema = z.object({
  dollarPlans: z.boolean(),
  pesoPlans: z.boolean(),
})

const nonLifeGeneralInsuranceSchema = z.object({
  aviation: z.boolean(),
  motor: z.boolean(),
  bonds: z.boolean(),
  personalAccident: z.boolean(),
  casualtyLines: z.boolean(),
  fireProperty: z.boolean(),
  engineering: z.boolean(),
  hullMachinery: z.boolean(),
})

const othersBusinessLineSchema = z.object({
  internationalInvestmentPlans: z.boolean(),
  internationalProtectionPlans: z.boolean(),
})

const businessInterestSchema = z.object({
  medicalInsurance: medicalInsuranceSchema,
  hmoPlans: z.boolean(),
  travelInsurance: z.boolean(),
  nonLifeGeneralInsurance: nonLifeGeneralInsuranceSchema,
  others: othersBusinessLineSchema,
})

type MedicalInsurance = z.infer<typeof medicalInsuranceSchema>
type NonLifeGeneralInsurance = z.infer<typeof nonLifeGeneralInsuranceSchema>
type BusinessInterestFormData = z.infer<typeof businessInterestSchema>

export default function BusinessInterestForm() {
  const { increaseStep, decreaseStep } = useOnboardingStepStateStore()

  const form = useForm({
    defaultValues: {
      medicalInsurance: {
        dollarPlans: false,
        pesoPlans: false,
      },
      hmoPlans: false,
      travelInsurance: false,
      nonLifeGeneralInsurance: {
        aviation: false,
        motor: false,
        bonds: false,
        personalAccident: false,
        casualtyLines: false,
        fireProperty: false,
        engineering: false,
        hullMachinery: false,
      },
      others: {
        internationalInvestmentPlans: false,
        internationalProtectionPlans: false,
      },
    } as BusinessInterestFormData,
    onSubmit: async ({ value }) => {
      // Handle form submission
      console.log('Form submitted:', value)

      // Get selected interests
      const selectedInterests: string[] = []

      if (value.medicalInsurance.dollarPlans)
        selectedInterests.push('Medical Insurance - Dollar Plans')
      if (value.medicalInsurance.pesoPlans)
        selectedInterests.push('Medical Insurance - Peso Plans')
      if (value.hmoPlans) selectedInterests.push('HMO Plans')
      if (value.travelInsurance) selectedInterests.push('Travel Insurance')

      if (value.nonLifeGeneralInsurance.aviation)
        selectedInterests.push('Non-Life - Aviation')
      if (value.nonLifeGeneralInsurance.motor)
        selectedInterests.push('Non-Life - Motor')
      if (value.nonLifeGeneralInsurance.bonds)
        selectedInterests.push('Non-Life - Bonds')
      if (value.nonLifeGeneralInsurance.personalAccident)
        selectedInterests.push('Non-Life - Personal Accident')
      if (value.nonLifeGeneralInsurance.casualtyLines)
        selectedInterests.push('Non-Life - Casualty Lines')
      if (value.nonLifeGeneralInsurance.fireProperty)
        selectedInterests.push('Non-Life - Fire & Property')
      if (value.nonLifeGeneralInsurance.engineering)
        selectedInterests.push('Non-Life - Engineering')
      if (value.nonLifeGeneralInsurance.hullMachinery)
        selectedInterests.push('Non-Life - Hull & Machinery')

      if (value.others.internationalInvestmentPlans)
        selectedInterests.push('International Investment Plans')
      if (value.others.internationalProtectionPlans)
        selectedInterests.push('International Protection Plans')

      console.log('Selected interests:', selectedInterests)

      increaseStep()
    },
    validators: {
      onChange: businessInterestSchema,
    },
  })

  const NestedCheckboxField = ({
    parentName,
    childName,
    label,
    disabled = false,
  }: {
    parentName: 'medicalInsurance' | 'nonLifeGeneralInsurance' | 'others'
    childName: string
    label: string
    disabled?: boolean
  }) => (
    <form.Field name={`${parentName}.${childName}` as any}>
      {(field) => (
        <Label
          className={`flex cursor-pointer items-center space-x-2 ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <Checkbox
            checked={field.state.value}
            onCheckedChange={(checked) => {
              return checked
                ? field.handleChange(true)
                : field.handleChange(false)
            }}
            disabled={disabled}
            className="h-4 w-4 rounded disabled:opacity-50"
          />
          <span className={`text-sm`}>{label}</span>
        </Label>
      )}
    </form.Field>
  )

  const CheckboxField = ({
    name,
    label,
    disabled = false,
  }: {
    name: 'hmoPlans' | 'travelInsurance'
    label: string
    disabled?: boolean
  }) => (
    <form.Field name={name}>
      {(field) => (
        <Label
          className={`flex cursor-pointer items-center space-x-2 ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <Checkbox
            checked={field.state.value}
            onCheckedChange={(checked) => {
              return checked
                ? field.handleChange(true)
                : field.handleChange(false)
            }}
            disabled={disabled}
            className="h-4 w-4 rounded disabled:opacity-50"
          />
          <span className={`text-sm`}>{label}</span>
        </Label>
      )}
    </form.Field>
  )

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-6"
    >
      {/* Medical Insurance Section */}
      <div className="space-y-3">
        <h3 className="font-semibold">Medical Insurance</h3>
        <div className="ml-6 space-y-2">
          <NestedCheckboxField
            parentName="medicalInsurance"
            childName="dollarPlans"
            label="Dollar Plans"
          />
          <NestedCheckboxField
            parentName="medicalInsurance"
            childName="pesoPlans"
            label="Peso Plans"
          />
        </div>
      </div>

      {/* Other Insurance Types */}
      <div className="space-y-3">
        <CheckboxField name="hmoPlans" label="HMO Plans" />
        <CheckboxField name="travelInsurance" label="Travel Insurance" />
      </div>

      {/* Non-Life General Insurance Section */}
      <div className="space-y-3">
        <h3 className="font-semibold">Non-Life General Insurance</h3>
        <div className="ml-6 grid grid-cols-1 gap-2 md:grid-cols-2">
          <NestedCheckboxField
            parentName="nonLifeGeneralInsurance"
            childName="aviation"
            label="Aviation"
          />
          <NestedCheckboxField
            parentName="nonLifeGeneralInsurance"
            childName="motor"
            label="Motor"
          />
          <NestedCheckboxField
            parentName="nonLifeGeneralInsurance"
            childName="bonds"
            label="Bonds"
          />
          <NestedCheckboxField
            parentName="nonLifeGeneralInsurance"
            childName="personalAccident"
            label="Personal Accident"
          />
          <NestedCheckboxField
            parentName="nonLifeGeneralInsurance"
            childName="casualtyLines"
            label="Casualty Lines"
          />
          <NestedCheckboxField
            parentName="nonLifeGeneralInsurance"
            childName="fireProperty"
            label="Fire & Property"
          />
          <NestedCheckboxField
            parentName="nonLifeGeneralInsurance"
            childName="engineering"
            label="Engineering"
          />
          <NestedCheckboxField
            parentName="nonLifeGeneralInsurance"
            childName="hullMachinery"
            label="Hull & Machinery"
          />
        </div>
      </div>

      {/* Others Section */}
      <div className="space-y-3">
        <h3 className="font-semibold">Others</h3>
        <div className="ml-6 space-y-2">
          <NestedCheckboxField
            parentName="others"
            childName="internationalInvestmentPlans"
            label="International Investment Plans"
          />
          <NestedCheckboxField
            parentName="others"
            childName="internationalProtectionPlans"
            label="International Protection Plans"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="grid gap-4 md:grid-cols-2">
        <Button
          type="button"
          onClick={() => decreaseStep()}
          variant={'secondary'}
        >
          <ChevronLeft />
          Back
        </Button>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <>
                  Next <ChevronRight />
                </>
              )}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
