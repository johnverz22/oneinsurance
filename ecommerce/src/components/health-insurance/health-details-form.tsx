'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useForm } from '@tanstack/react-form'
import { Card, CardContent } from '@/components/ui/card'
import {
  type HealthDetailsFormType,
  HealthDetailsFormSchema,
} from '@/types/health-insurance/details-schema'
import { fieldHasError } from '@/utils/form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FieldInfo } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { MultiSelect } from '@/components/ui/multi-select'
import { TravelCoverageMap } from '@/constants/travel-coverage'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type HealthDetailsFormProps = {
  className?: string
}

export function HealthDetailsForm({ className }: HealthDetailsFormProps) {
  const form = useForm({
    defaultValues: {
      fullName: '',
      email: '',
      mobileNumber: '',
      countryOfResidency: '',
      travelFrequency: '',
      agreedToTerms: false,
    } as HealthDetailsFormType,
    onSubmit: async ({ value }) => {},
    validators: {
      onChange: HealthDetailsFormSchema,
    },
  })

  return (
    <Card
      data-testid="health-details-form"
      className={cn(
        'w-full space-y-6 rounded-md border shadow-none backdrop-blur-sm lg:rounded-xl lg:shadow-2xl',
        className
      )}
    >
      <CardContent className="space-y-6 px-4 pt-3 pb-6 sm:px-8">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold">Get Personalized Advice</h2>
          <p className="text-muted-foreground font-light">
            Let our experts recommend the best plan for you
          </p>
        </div>

        <div className="grid gap-2.5 lg:grid-cols-3">
          <form.Field
            name="fullName"
            children={(field) => {
              const hasError = fieldHasError(field)

              return (
                <div className="space-y-2">
                  <Label className="block font-light">First Name</Label>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className={cn('h-12', { 'border-destructive': hasError })}
                    placeholder="Enter first name"
                  />
                  <FieldInfo field={field} />
                </div>
              )
            }}
          />

          <form.Field
            name="email"
            children={(field) => {
              const hasError = fieldHasError(field)

              return (
                <div className="space-y-2">
                  <Label className="block font-light">Email Address</Label>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className={cn('h-12', { 'border-destructive': hasError })}
                    placeholder="Enter email address"
                  />
                  <FieldInfo field={field} />
                </div>
              )
            }}
          />

          <form.Field
            name="mobileNumber"
            children={(field) => {
              const hasError = fieldHasError(field)

              return (
                <div className="space-y-2">
                  <Label className="block font-light">Phone Number</Label>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className={cn('h-12', { 'border-destructive': hasError })}
                    placeholder="Enter phone number"
                  />
                  <FieldInfo field={field} />
                </div>
              )
            }}
          />
        </div>

        <div className="grid gap-2.5 lg:grid-cols-2">
          <form.Field
            name="countryOfResidency"
            children={(field) => {
              const options = TravelCoverageMap.WORLD.map((country: any) => ({
                ...country,
                label: `${country.flag} ${country.name}`,
                value: country.code,
              }))

              return (
                <div className="w-full space-y-2">
                  <Label className="block font-light">
                    Country of Residency
                  </Label>

                  <MultiSelect
                    options={options}
                    className="dark:bg-input/30 border-muted-foreground/30 relative flex h-12 w-full items-center gap-1.5 overflow-hidden rounded-full border bg-white px-3 hover:bg-white"
                    hideSelectAll={true}
                    singleLine
                    onValueChange={(values) => {
                      const lastSelected = values[values.length - 1]
                      field.handleChange(lastSelected)
                    }}
                    placeholder="Select your destinations"
                    autoSize={false}
                  />
                  <FieldInfo field={field} />
                </div>
              )
            }}
          />

          <form.Field
            name="travelFrequency"
            children={(field) => {
              const hasError = fieldHasError(field)

              return (
                <div className="space-y-2">
                  <Label className="block font-light">Travel Frequency</Label>

                  <Select
                    onValueChange={(v) => field.handleChange(v)}
                    defaultValue={field.state.value}
                  >
                    <SelectTrigger
                      className={cn('h-12 w-full', {
                        'border-destructive': hasError,
                      })}
                    >
                      <SelectValue placeholder="Select travel frequency" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="rarely">Rarely</SelectItem>
                      <SelectItem value="occasionally">Occasionally</SelectItem>
                      <SelectItem value="frequently">Frequently</SelectItem>
                      <SelectItem value="very-frequently">
                        Very Frequently
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <FieldInfo field={field} />
                </div>
              )
            }}
          />
        </div>

        <div className="relative flex flex-col gap-4 sm:gap-6 md:flex-row md:items-start md:justify-between">
          <form.Field name="agreedToTerms">
            {(field) => (
              <div className="w-full max-w-80 space-y-2 sm:flex-1">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="terms"
                    checked={field.state.value}
                    onCheckedChange={(value) => {
                      field.handleChange(value as boolean)
                    }}
                    className="data-[state=checked]:border-lilac data-[state=checked]:bg-lilac h-5 w-5"
                  />

                  <Label
                    htmlFor="terms"
                    className="flex cursor-pointer flex-wrap text-sm leading-relaxed"
                  >
                    I agree to the{' '}
                    <Link
                      href="/terms-and-condition"
                      target="_blank"
                      className="text-lilac inline font-medium underline underline-offset-8"
                    >
                      Terms & Conditions
                    </Link>
                  </Label>
                </div>
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {(field) => (
              <Button
                type="submit"
                disabled={!form.state.canSubmit}
                onClick={(e) => {
                  e.preventDefault()
                  form.handleSubmit()
                }}
                className="bg-primary from-primary to-accent relative h-12 w-full self-end rounded-full bg-gradient-to-r via-90% px-6 text-sm font-medium text-white shadow-lg hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8 dark:text-white"
                size="lg"
              >
                Get Advice
              </Button>
            )}
          </form.Subscribe>
        </div>
      </CardContent>
    </Card>
  )
}
