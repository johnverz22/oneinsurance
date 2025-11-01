'use client'

import {
  useOnboardingStateStore,
  useOnboardingStepStateStore,
} from '@/store/onboarding-store'
import { contactPersonSchema, ContactPerson } from '@/types/onboarding'
import { delay } from '@/utils/delay'
import { useForm } from '@tanstack/react-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FieldInfo } from '@/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Button } from '../ui/button'
import React from 'react'
import {
  ChevronDownIcon,
  ChevronLeft,
  ChevronRight,
  Loader2Icon,
} from 'lucide-react'
import { Calendar } from '../ui/calendar'

export default function ContactPersonDetailsForm() {
  const { increaseStep, decreaseStep } = useOnboardingStepStateStore()
  const {
    setData,
    lastName,
    firstName,
    middleName,
    designation,
    dateOfBirth,
    nickname,
    mobileNumber,
    telephoneNumber,
    email,
  } = useOnboardingStateStore()
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date>()

  const form = useForm({
    defaultValues: {
      lastName: lastName || '',
      firstName: firstName || '',
      middleName: middleName || '',
      designation: designation || '',
      dateOfBirth: dateOfBirth || new Date(),
      nickname: nickname || '',
      mobileNumber: mobileNumber || '',
      telephoneNumber: telephoneNumber || '',
      email: email || '',
    } as ContactPerson,
    validators: {
      onChange: contactPersonSchema,
    },
    onSubmit: async ({ value }) => {
      await delay(3000)
      setData({ ...value })
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
      <div className="grid gap-2 md:grid-cols-3">
        <form.Field name="lastName">
          {(field) => (
            <div className="flex w-full flex-col gap-2">
              <Label htmlFor={field.name}>Last Name</Label>
              <Input
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>

        <form.Field name="firstName">
          {(field) => (
            <div className="flex w-full flex-col gap-2">
              <Label htmlFor={field.name}>First Name</Label>
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
            <div className="flex w-full flex-col gap-2">
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
      </div>

      <div className="grid gap-2 md:grid-cols-4">
        <form.Field name="designation">
          {(field) => (
            <div className="flex w-full flex-col gap-2 md:col-span-2">
              <Label htmlFor={field.name}>
                Designation / Position in the Company
              </Label>
              <Input
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
            <div className="flex h-full w-full flex-col gap-2">
              <Label htmlFor={field.name} className="capitalize">
                Date of Birth
              </Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="date"
                    className="h-11 w-full justify-between font-normal"
                  >
                    {date
                      ? date.toLocaleDateString()
                      : dateOfBirth
                        ? dateOfBirth instanceof Date
                          ? dateOfBirth.toLocaleDateString()
                          : new Date(dateOfBirth).toLocaleDateString()
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
                    selected={date ?? dateOfBirth}
                    defaultMonth={date ?? dateOfBirth}
                    captionLayout="dropdown"
                    disabled={(date) => {
                      const today = new Date()
                      return (
                        date.getFullYear() > today.getFullYear() - 18 ||
                        date < new Date('1900-01-01')
                      )
                    }}
                    onSelect={(date) => {
                      setDate(date)
                      field.handleChange(date!)
                      setOpen(false)
                    }}
                  />
                </PopoverContent>
              </Popover>
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>

        <form.Field name="nickname">
          {(field) => (
            <div className="flex w-full flex-col gap-2">
              <Label htmlFor={field.name}>Nickname</Label>
              <Input
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>

        <form.Field name="mobileNumber">
          {(field) => (
            <div className="flex w-full flex-col gap-2">
              <Label htmlFor={field.name}>Mobile Number</Label>
              <Input
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>

        <form.Field name="telephoneNumber">
          {(field) => (
            <div className="flex w-full flex-col gap-2">
              <Label htmlFor={field.name}>Telephone Number</Label>
              <Input
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>

        <form.Field name="email">
          {(field) => (
            <div className="flex w-full flex-col gap-2 md:col-span-2">
              <Label htmlFor={field.name}>Email Address</Label>
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
