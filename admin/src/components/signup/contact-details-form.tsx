'use client'

import { z } from 'zod'
import { signupSchema } from '@/types/signup-schema'
import {
  useSignUpStateStore,
  useSignUpStepStateStore,
} from '@/store/signup-store'
import { useForm } from '@tanstack/react-form'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  FIELD_CONTAINER_STYLE,
  REQUIRED_FIELD_INDICATOR_STYLE,
} from './form-style'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { FieldInfo } from '../ui/form'

const contactDetailsSchema = signupSchema.pick({
  phoneNumber: true,
  country: true,
  state: true,
  city: true,
  zipCode: true,
  address: true,
})

type ContactDetailsSchema = z.infer<typeof contactDetailsSchema>

export default function ContactDetailsForm() {
  const setData = useSignUpStateStore((state) => state.setData)
  const increaseStep = useSignUpStepStateStore((state) => state.increaseStep)
  const decreaseStep = useSignUpStepStateStore((state) => state.decreaseStep)

  const phoneNumber = useSignUpStateStore((state) => state.phoneNumber)
  const country = useSignUpStateStore((state) => state.country)
  const state = useSignUpStateStore((state) => state.state)
  const city = useSignUpStateStore((state) => state.city)
  const zipCode = useSignUpStateStore((state) => state.zipCode)
  const address = useSignUpStateStore((state) => state.address)

  const form = useForm({
    defaultValues: {
      phoneNumber: phoneNumber ?? '',
      country: country ?? '',
      state: state ?? '',
      city: city ?? '',
      zipCode: zipCode ?? '',
      address: address ?? '',
    },
    validators: {
      onChange: contactDetailsSchema,
    },
    onSubmit: async ({ value }: { value: ContactDetailsSchema }) => {
      setData({ ...value })
      increaseStep()
    },
  })

  return (
    <>
      <section className="flex w-full flex-col gap-4 p-[10%]">
        <span className="text-xs font-extralight tracking-normal">
          Step 3 of 5: Contact Details
        </span>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            await form.handleSubmit()
          }}
          className="flex flex-col gap-3"
        >
          {/* Phome Number input */}
          <form.Field name="phoneNumber">
            {(field) => {
              return (
                <>
                  <div className={FIELD_CONTAINER_STYLE}>
                    <Label htmlFor={field.name} className="capitalize">
                      Phone Number{' '}
                      <span className={REQUIRED_FIELD_INDICATOR_STYLE}>*</span>
                    </Label>
                    <Input
                      type="tel"
                      name={field.name}
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldInfo field={field} />
                  </div>
                </>
              )
            }}
          </form.Field>

          {/* country input */}
          <form.Field name="country">
            {(field) => {
              return (
                <>
                  <div className={FIELD_CONTAINER_STYLE}>
                    <Label htmlFor={field.name} className="capitalize">
                      Country{' '}
                      <span className={REQUIRED_FIELD_INDICATOR_STYLE}>*</span>
                    </Label>
                    <Input
                      type="text"
                      name={field.name}
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldInfo field={field} />
                  </div>
                </>
              )
            }}
          </form.Field>

          {/* state input */}
          <form.Field name="state">
            {(field) => {
              return (
                <>
                  <div className={FIELD_CONTAINER_STYLE}>
                    <Label htmlFor={field.name} className="capitalize">
                      State / Province{' '}
                      <span className={REQUIRED_FIELD_INDICATOR_STYLE}>*</span>
                    </Label>
                    <Input
                      type="text"
                      name={field.name}
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldInfo field={field} />
                  </div>
                </>
              )
            }}
          </form.Field>

          {/* city input */}
          <form.Field name="city">
            {(field) => {
              return (
                <>
                  <div className={FIELD_CONTAINER_STYLE}>
                    <Label htmlFor={field.name} className="capitalize">
                      City / Municipality{' '}
                      <span className={REQUIRED_FIELD_INDICATOR_STYLE}>*</span>
                    </Label>
                    <Input
                      type="text"
                      name={field.name}
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldInfo field={field} />
                  </div>
                </>
              )
            }}
          </form.Field>

          {/* zipCode input */}
          <form.Field name="zipCode">
            {(field) => {
              return (
                <>
                  <div className={FIELD_CONTAINER_STYLE}>
                    <Label htmlFor={field.name} className="capitalize">
                      Zip Code{' '}
                      <span className={REQUIRED_FIELD_INDICATOR_STYLE}>*</span>
                    </Label>
                    <Input
                      type="text"
                      name={field.name}
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldInfo field={field} />
                  </div>
                </>
              )
            }}
          </form.Field>

          {/* address input */}
          <form.Field name="address">
            {(field) => {
              return (
                <>
                  <div className={FIELD_CONTAINER_STYLE}>
                    <Label htmlFor={field.name} className="capitalize">
                      Address{' '}
                      <span className={REQUIRED_FIELD_INDICATOR_STYLE}>*</span>
                    </Label>
                    <Input
                      type="text"
                      name={field.name}
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldInfo field={field} />
                  </div>
                </>
              )
            }}
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
