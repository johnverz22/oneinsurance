'use client'

import * as React from 'react'
import { z } from 'zod'
import { signupSchema } from '@/types/signup-schema'
import { useForm } from '@tanstack/react-form'
import { Button } from '@/components/ui/button'
import {
  useSignUpStateStore,
  useSignUpStepStateStore,
} from '@/store/signup-store'
import { ChevronDownIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  FIELD_CONTAINER_STYLE,
  REQUIRED_FIELD_INDICATOR_STYLE,
} from './form-style'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { FieldInfo } from '../ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Calendar } from '../ui/calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

const personalInformationSchema = signupSchema.pick({
  firstName: true,
  lastName: true,
  dateOfBirth: true,
  gender: true,
})

type PersonalInformationSchema = z.infer<typeof personalInformationSchema>

export default function PersonalInformationForm() {
  const [open, setOpen] = React.useState(false)
  const [date, setBirthOfDate] = React.useState<Date | undefined>(undefined)

  const setData = useSignUpStateStore((state) => state.setData)
  const increaseStep = useSignUpStepStateStore((state) => state.increaseStep)
  const decreaseStep = useSignUpStepStateStore((state) => state.decreaseStep)

  const firstName = useSignUpStateStore((state) => state.firstName)
  const lastName = useSignUpStateStore((state) => state.lastName)
  const dateOfBirth = useSignUpStateStore((state) => state.dateOfBirth)
  const gender = useSignUpStateStore((state) => state.gender)

  const form = useForm({
    defaultValues: {
      firstName: firstName ?? '',
      lastName: lastName ?? '',
      dateOfBirth: dateOfBirth ?? new Date(),
      gender: gender ?? 'male',
    },
    validators: {
      onChange: personalInformationSchema,
    },
    onSubmit: async ({ value }: { value: PersonalInformationSchema }) => {
      setData({ ...value })
      increaseStep()
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await form.handleSubmit()
  }

  return (
    <>
      <section className="flex w-full flex-col gap-4 p-[10%]">
        <span className="text-xs font-extralight tracking-normal">
          Step 2 of 4: Personal Information
        </span>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* first name input */}
          <form.Field name="firstName">
            {(field) => (
              <>
                <div className={FIELD_CONTAINER_STYLE}>
                  <Label htmlFor={field.name} className="capitalize">
                    First Name{' '}
                    <span className={REQUIRED_FIELD_INDICATOR_STYLE}>*</span>
                  </Label>
                  <Input
                    type="text"
                    name={field.name}
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    required
                  />
                  <FieldInfo field={field} />
                </div>
              </>
            )}
          </form.Field>

          {/* last name input */}
          <form.Field name="lastName">
            {(field) => (
              <>
                <div className={FIELD_CONTAINER_STYLE}>
                  <Label htmlFor={field.name} className="capitalize">
                    Last Name{' '}
                    <span className={REQUIRED_FIELD_INDICATOR_STYLE}>*</span>
                  </Label>
                  <Input
                    type="text"
                    name={field.name}
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    required
                  />
                  <FieldInfo field={field} />
                </div>
              </>
            )}
          </form.Field>

          {/* date of birth input */}
          <form.Field name="dateOfBirth">
            {(field) => (
              <>
                <div className={FIELD_CONTAINER_STYLE}>
                  <Label htmlFor={field.name} className="capitalize">
                    Date of Birth{' '}
                    <span className={REQUIRED_FIELD_INDICATOR_STYLE}>*</span>
                  </Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="date"
                        className="w-full justify-between font-normal"
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
                        required
                        captionLayout="dropdown"
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        onSelect={(date) => {
                          setBirthOfDate(date)
                          field.handleChange(date)
                          setOpen(false)
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <FieldInfo field={field} />
                </div>
              </>
            )}
          </form.Field>

          {/* Gender input */}
          <form.Field name="gender">
            {(field) => (
              <>
                <div className={FIELD_CONTAINER_STYLE}>
                  <Label htmlFor={field.name} className="capitalize">
                    Gender{' '}
                    <span className={REQUIRED_FIELD_INDICATOR_STYLE}>*</span>
                  </Label>
                  <Select
                    name={field.name}
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value as any)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="prefer not to say">
                        Prefer not to say
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldInfo field={field} />
                </div>
              </>
            )}
          </form.Field>

          <form.Subscribe>
            <div className="mt-4 grid grid-cols-2 place-content-around gap-3">
              <Button
                variant={'ghost'}
                className="text-gray-600"
                onClick={decreaseStep}
              >
                <ChevronLeft />
                Back
              </Button>
              <Button type="submit">
                Next <ChevronRight />
              </Button>
            </div>
          </form.Subscribe>
        </form>
      </section>
    </>
  )
}
