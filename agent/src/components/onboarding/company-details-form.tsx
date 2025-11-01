'use client'

import {
  useOnboardingStateStore,
  useOnboardingStepStateStore,
} from '@/store/onboarding-store'
import { companyDetailsSchema, ComapnyDetails } from '@/types/onboarding'
import { delay } from '@/utils/delay'
import { useForm } from '@tanstack/react-form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { FieldInfo } from '../ui/form'
import { Button } from '../ui/button'
import { Loader, Loader2Icon } from 'lucide-react'

export default function CompanyDetailsForm() {
  const { setData } = useOnboardingStateStore()
  const { increaseStep } = useOnboardingStepStateStore()

  const form = useForm({
    defaultValues: {
      registeredUnder: '',
      companyName: '',
      businessAddress: '',
      contactNumber: '',
      industry: '',
      yearsInOperation: 0,
    } as ComapnyDetails,
    validators: {
      onChange: companyDetailsSchema,
    },
    onSubmit: async ({ value }) => {
      await delay(3000)
      setData({ ...value })
      console.log(value)
      increaseStep()
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="flex flex-col gap-5"
    >
      <form.Field name="registeredUnder">
        {(field) => (
          <div className="flex flex-wrap gap-4">
            <Label htmlFor={field.name}>Business is registered under</Label>
            <RadioGroup
              name={field.name}
              value={field.state.value}
              onValueChange={(value) => field.handleChange(value)}
              className="flex gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="SEC" id="sec" />
                <Label htmlFor="sec">SEC</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="DTI" id="dti" />
                <Label htmlFor="dti">DTI</Label>
              </div>
            </RadioGroup>
            <FieldInfo field={field} />
          </div>
        )}
      </form.Field>

      <form.Field name="companyName">
        {(field) => (
          <div className="flex w-full flex-col gap-2">
            <Label htmlFor={field.name}>Company Name</Label>
            <Input
              name={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldInfo field={field} />
          </div>
        )}
      </form.Field>

      <form.Field name="businessAddress">
        {(field) => (
          <div className="flex w-full flex-col gap-2">
            <Label htmlFor={field.name}>Busieness Address</Label>
            <Input
              name={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldInfo field={field} />
          </div>
        )}
      </form.Field>

      <div className="grid gap-2 md:grid-cols-4">
        <form.Field name="contactNumber">
          {(field) => (
            <div className="flex w-full flex-col gap-2">
              <Label htmlFor={field.name}>Contact Number</Label>
              <Input
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>

        <form.Field name="industry">
          {(field) => (
            <div className="flex w-full flex-col gap-2 md:col-span-2">
              <Label htmlFor={field.name}>Industry</Label>
              <Input
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>

        <form.Field name="yearsInOperation">
          {(field) => (
            <div className="flex w-full flex-col gap-2">
              <Label htmlFor={field.name}>Years in Operation</Label>
              <Input
                type="number"
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(parseInt(e.target.value))}
              />
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>
      </div>

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
      >
        {([canSubmit, isSubmitting]) => (
          <Button type="submit" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? <Loader2Icon className="animate-spin" /> : 'Next'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
