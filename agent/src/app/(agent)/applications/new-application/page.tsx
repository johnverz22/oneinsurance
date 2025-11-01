'use client'

import { z } from 'zod'
import { useForm } from '@tanstack/react-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FieldInfo } from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { ChevronDownIcon, MinusCircleIcon, PlusCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { delay } from '@/utils/delay'
import { toast } from 'sonner'

const beneficiaryDetailsSchema = z.object({
  beneficiaryName: z.string().min(2, 'Beneficiary name is required'),
  beneficiaryRelationship: z
    .string()
    .min(2, 'Beneficiary relationship is required'),
  beneficiaryPhone: z
    .string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number'),
})

// Zod schema for validation
const insuranceApplicationSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  middleName: z.string(),
  suffix: z.string(),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number'),
  dateOfBirth: z.date().max(new Date(), {
    message: `Date must be on or before ${new Date().toLocaleDateString()}`,
  }),
  gender: z.enum(['male', 'female'], {
    required_error: 'Gender is required',
  }),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed'], {
    required_error: 'Marital status is required',
  }),
  tin: z.string().min(2, 'TIN / SSS / GSIS Number is invalid'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().min(2, 'State must be at least 2 characters'),
  zipCode: z.string().regex(/^\d{4}(-\d{4})?$/, 'Invalid ZIP code'),
  country: z.string().min(2, 'Country is required'),

  // Employment Information
  occupation: z.string().min(2, 'Occupation is required'),
  employer: z.string().min(2, 'Employer name is required'),
  annualIncome: z.number().min(0, 'Annual income must not be negative'),

  // Insurance Information
  insuranceType: z.enum(['life', 'health', 'auto', 'home', 'business'], {
    required_error: 'Insurance type is required',
  }),
  coverageAmount: z.number().min(1, 'Coverage amount must be greater than one'),
  deductible: z
    .number({ message: 'Deductible must be a number' })
    .min(0, 'Must be greater than zero'),

  // Health Information (for life/health insurance)
  smokingStatus: z.enum(['never', 'former', 'current'], {
    required_error: 'Smoking status is required',
  }),
  healthConditions: z.string(),
  medications: z.string(),

  // Beneficiary Information
  beneficiaries: z.array(beneficiaryDetailsSchema),
})

type InsuranceApplicationData = z.infer<typeof insuranceApplicationSchema>

export default function NewApplicationPage() {
  const [open, setOpen] = useState(false)

  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      suffix: '',
      email: '',
      phone: '',
      dateOfBirth: new Date(),
      gender: 'male',
      maritalStatus: 'single',
      tin: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      occupation: '',
      employer: '',
      annualIncome: 0,
      insuranceType: 'life',
      coverageAmount: 1,
      deductible: 0,
      smokingStatus: 'never',
      healthConditions: '',
      medications: '',
      beneficiaries: [],
    } as InsuranceApplicationData,
    validators: {
      onChange: insuranceApplicationSchema,
    },
    onSubmit: async ({ value }) => {
      toast.info('Under Construction')
      await delay(3000)
      console.log(value)
    },
  })

  return (
    <div className="w-full">
      <h1 className="mb-10 text-xl font-bold">New Application</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        className="flex flex-col gap-10"
      >
        {/* Applicant Information */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Applicant Information</h2>
          {/* first row */}
          <div className="grid gap-2 lg:grid-cols-4 lg:gap-5">
            <form.Field name="firstName">
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>First Name *</Label>
                  <Input
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>

            <form.Field name="middleName">
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>Middle Name</Label>
                  <Input
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>

            <form.Field name="lastName">
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>Last Name *</Label>
                  <Input
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>

            <form.Field name="suffix">
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>Suffix (Jr./Sr./III etc.)</Label>
                  <Input
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>
          </div>

          {/* Second row */}
          <div className="grid gap-2 lg:grid-cols-3 lg:gap-5">
            <form.Field name="email">
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>Email *</Label>
                  <Input
                    type="email"
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>

            <form.Field name="phone">
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>Phone *</Label>
                  <Input
                    type="tel"
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>

            <form.Field name="dateOfBirth">
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>Date of Birth *</Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="date"
                        className="w-full justify-between font-normal"
                      >
                        {field.state.value
                          ? field.state.value.toLocaleDateString()
                          : 'Select a Date'}

                        <ChevronDownIcon />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-full overflow-hidden p-0"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={field.state.value}
                        required
                        defaultMonth={field.state.value}
                        captionLayout="dropdown"
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        onSelect={(date) => {
                          field.handleChange(date)
                          setOpen(false)
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>
          </div>

          {/* 3rd row */}
          <div className="grid gap-2 lg:grid-cols-3 lg:gap-5">
            <form.Field name="gender">
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>Gender *</Label>
                  <RadioGroup
                    value={field.state.value}
                    name={field.name}
                    onValueChange={(e) => field.handleChange(e as any)}
                    className="flex justify-around"
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male">Male</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female">Female</Label>
                    </div>
                  </RadioGroup>
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>

            <form.Field name="maritalStatus">
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>Marital Status *</Label>
                  <Select
                    name={field.name}
                    defaultValue=""
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value as any)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a Marital Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>

            <form.Field name="tin">
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>TIN / SSS / GSIS Number *</Label>
                  <Input
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>
          </div>

          <form.Field name="address">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label htmlFor={field.name}>Permanent Address *</Label>
                <Input
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>

          {/* 4th row */}
          <div className="grid gap-2 lg:grid-cols-4 lg:gap-5">
            <form.Field name="city">
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>City *</Label>
                  <Input
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>

            <form.Field name="state">
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>State *</Label>
                  <Input
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>

            <form.Field name="zipCode">
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>ZipCode *</Label>
                  <Input
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>

            <form.Field name="country">
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>Country *</Label>
                  <Input
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>
          </div>

          {/* 6th row */}
          <div className="grid gap-2 lg:grid-cols-3 lg:gap-5">
            <form.Field name="occupation">
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>Occupation *</Label>
                  <Input
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>

            <form.Field name="employer">
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>Employer</Label>
                  <Input
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>

            <form.Field name="annualIncome">
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>Annual Incone *</Label>
                  <Input
                    type="number"
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) =>
                      field.handleChange(parseInt(e.target.value))
                    }
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Policy Details</h2>
          {/* 1st row */}
          <div className="grid lg:grid-cols-3 lg:gap-4">
            <form.Field name="insuranceType">
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>Insurance Type *</Label>
                  <Select
                    name={field.name}
                    defaultValue=""
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value as any)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a Insurane Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="life">Life Insurance</SelectItem>
                        <SelectItem value="health">Health Insurance</SelectItem>
                        <SelectItem value="auto">Auto Insurance</SelectItem>
                        <SelectItem value="home">Home Insurance</SelectItem>
                        <SelectItem value="business">
                          Business Insurance
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>

            <form.Field name="coverageAmount">
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>Coverage Amount *</Label>
                  <Input
                    type="number"
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) =>
                      field.handleChange(parseInt(e.target.value))
                    }
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>

            <form.Field name="deductible">
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>Deductible *</Label>
                  <Input
                    type="number"
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) =>
                      field.handleChange(parseInt(e.target.value))
                    }
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Health Declaration</h2>

          <div className="grid lg:grid-cols-3 lg:gap-4">
            <form.Field name="smokingStatus">
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>Smoking Status *</Label>
                  <Select
                    name={field.name}
                    defaultValue=""
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value as any)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a Smoking Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="never">Never</SelectItem>
                        <SelectItem value="former">Former</SelectItem>
                        <SelectItem value="current">Current</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>

            <form.Field name="healthConditions">
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>Health Conditions</Label>
                  <Input
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>

            <form.Field name="medications">
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>Medications</Label>
                  <Input
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Beneficiaries</h2>
          <form.Field name="beneficiaries" mode="array">
            {(beneficiaryArray) => (
              <>
                {beneficiaryArray.state.value.map((field, index) => (
                  // form contianer
                  <div className="grid lg:grid-cols-3 lg:gap-4" key={index}>
                    <form.Field
                      name={`beneficiaries[${index}].beneficiaryName`}
                    >
                      {(subField) => (
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={subField.name}>
                            Beneficiary Name *
                          </Label>
                          <Input
                            name={subField.name}
                            value={subField.state.value}
                            onChange={(e) =>
                              subField.handleChange(e.target.value)
                            }
                          />
                          <FieldInfo field={subField} />
                        </div>
                      )}
                    </form.Field>

                    <form.Field
                      name={`beneficiaries[${index}].beneficiaryRelationship`}
                    >
                      {(subField) => (
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={subField.name}>
                            Beneficiary Relationship *
                          </Label>
                          <Input
                            name={subField.name}
                            value={subField.state.value}
                            onChange={(e) =>
                              subField.handleChange(e.target.value)
                            }
                          />
                          <FieldInfo field={subField} />
                        </div>
                      )}
                    </form.Field>

                    <form.Field
                      name={`beneficiaries[${index}].beneficiaryPhone`}
                    >
                      {(subField) => (
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={subField.name}>
                            Beneficiary Phone *
                          </Label>
                          <Input
                            name={subField.name}
                            value={subField.state.value}
                            onChange={(e) =>
                              subField.handleChange(e.target.value)
                            }
                          />
                          <FieldInfo field={subField} />
                        </div>
                      )}
                    </form.Field>

                    <Button
                      type="button"
                      className="flex w-fit gap-2"
                      variant={'ghost'}
                      onClick={() => beneficiaryArray.removeValue(index)}
                    >
                      <MinusCircleIcon />
                      Remove Beneficiary
                    </Button>
                  </div>
                  // end of form beneficiaries form
                ))}
                <Button
                  className="flex w-fit gap-2"
                  variant={'secondary'}
                  onClick={() =>
                    beneficiaryArray.pushValue({
                      beneficiaryName: '',
                      beneficiaryRelationship: '',
                      beneficiaryPhone: '',
                    })
                  }
                  type="button"
                >
                  <PlusCircleIcon />
                  Add Beneficiary
                </Button>
              </>
            )}
          </form.Field>
        </div>

        <div className="flex w-full justify-end gap-4">
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                className="text-white"
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            )}
          />
          <Button variant={'secondary'}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
