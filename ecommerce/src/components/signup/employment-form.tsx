'use client'

import {
  useSignUpStateStore,
  useSignUpStepStateStore,
} from '@/store/signup-store'
import { z } from 'zod'
import { signupSchema } from '@/types/signup-schema'
import { useForm } from '@tanstack/react-form'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  FIELD_CONTAINER_STYLE,
  FIELD_INPUT_STYLE,
  REQUIRED_FIELD_INDICATOR_STYLE,
} from './form-style'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { FieldInfo } from '../ui/form'

const employmentSchema = signupSchema.pick({
  occupation: true,
  annualIncome: true,
})

type EmploymentSchema = z.infer<typeof employmentSchema>

export default function EmploymentForm() {
  const setData = useSignUpStateStore((state) => state.setData)
  const increaseStep = useSignUpStepStateStore((state) => state.increaseStep)
  const decreaseStep = useSignUpStepStateStore((state) => state.decreaseStep)

  const occupation = useSignUpStateStore((state) => state.occupation)
  const annualIncome = useSignUpStateStore((state) => state.annualIncome)

  const form = useForm({
    defaultValues: {
      occupation: occupation ?? '',
      annualIncome: annualIncome ?? 0,
    },
    validators: {
      onChange: employmentSchema,
    },
    onSubmit: async ({ value }: { value: EmploymentSchema }) => {
      setData({ ...value })
      increaseStep()
    },
  })

  return (
    <>
      <section className="flex w-full flex-col gap-4 p-[10%]">
        <span className="text-xs font-extralight tracking-normal">
          Step 4 of 5: Employment Details
        </span>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            await form.handleSubmit()
          }}
          className="flex flex-col gap-3"
        >
          {/* Occupation input */}
          <form.Field name="occupation">
            {(field) => {
              return (
                <>
                  <div className={FIELD_CONTAINER_STYLE}>
                    <Label htmlFor={field.name} className="capitalize">
                      Occupation{' '}
                      <span className={REQUIRED_FIELD_INDICATOR_STYLE}>*</span>
                    </Label>
                    <Input
                      type="text"
                      name={field.name}
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className={FIELD_INPUT_STYLE}
                    />
                    <FieldInfo field={field} />
                  </div>
                </>
              )
            }}
          </form.Field>

          {/* Occupation input */}
          <form.Field name="annualIncome">
            {(field) => {
              return (
                <>
                  <div className={FIELD_CONTAINER_STYLE}>
                    <Label htmlFor={field.name} className="capitalize">
                      Annual Income{' '}
                      <span className={REQUIRED_FIELD_INDICATOR_STYLE}>*</span>
                    </Label>
                    <Input
                      type="number"
                      name={field.name}
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(+e.target.value)}
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
