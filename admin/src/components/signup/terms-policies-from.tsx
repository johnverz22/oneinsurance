'use client'

import { z } from 'zod'
import { signupSchema } from '@/types/signup-schema'
import { useForm } from '@tanstack/react-form'
import {
  useSignUpStateStore,
  useSignUpStepStateStore,
} from '@/store/signup-store'
import {
  FIELD_CONTAINER_STYLE,
  REQUIRED_FIELD_INDICATOR_STYLE,
} from './form-style'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Label } from '../ui/label'
import { Checkbox } from '../ui/checkbox'
import { FieldInfo } from '../ui/form'
import { delay } from '@/utils/delay'
import { redirect } from 'next/navigation'
import {
  deleteSignUpStateStore,
  deleteSignUpStepStateStore,
} from '@/store/signup-store'

const termsPlociesSchema = signupSchema.pick({
  agreeToTerms: true,
  agreeToPrivacy: true,
})

type TermsPoliciesSchema = z.infer<typeof termsPlociesSchema>

export default function TermsPoliciesForm() {
  const setData = useSignUpStateStore((state) => state.setData)
  const decreaseStep = useSignUpStepStateStore((state) => state.decreaseStep)

  const agreeToTerms = useSignUpStateStore((state) => state.agreeToTerms)
  const agreeToPrivacy = useSignUpStateStore((state) => state.agreeToPrivacy)

  const form = useForm({
    defaultValues: {
      agreeToTerms: agreeToTerms ?? false,
      agreeToPrivacy: agreeToPrivacy ?? false,
    },
    validators: {
      onChange: termsPlociesSchema,
    },
    onSubmit: async ({ value }: { value: TermsPoliciesSchema }) => {
      setData({ ...value })
      await delay(3000)
      deleteSignUpStateStore()
      deleteSignUpStepStateStore()
      redirect('/sign-in')
      // TODO: put data to backend
    },
  })

  return (
    <>
      <section className="flex w-full flex-col gap-4 p-[10%]">
        <span className="text-xs font-extralight tracking-normal">
          Step 5 of 5: Terms and Policies
        </span>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            await form.handleSubmit()
          }}
          className="flex flex-col gap-3"
        >
          {/* Agreement to terms */}
          <form.Field name="agreeToTerms">
            {(field) => {
              return (
                <>
                  <div className={FIELD_CONTAINER_STYLE}>
                    <Label htmlFor={field.name}>
                      Agreement to Terms{' '}
                      <span className={REQUIRED_FIELD_INDICATOR_STYLE}>*</span>
                    </Label>
                    <div className="flex items-center justify-center gap-10">
                      <Checkbox
                        name={field.name}
                        id={field.name}
                        checked={field.state.value}
                        onCheckedChange={(checked) => {
                          checked
                            ? field.handleChange(true)
                            : field.handleChange(false)
                        }}
                        className={`size-4`}
                      />
                      <p className="text-justify text-sm">
                        By submitting this signup form, you confirm that you
                        have read and agree to our Terms and Policies. If you do
                        not agree, please do not proceed with the signup. Thank
                        you!
                      </p>
                    </div>

                    <FieldInfo field={field} />
                  </div>
                </>
              )
            }}
          </form.Field>

          {/* Privacy policy */}
          <form.Field name="agreeToPrivacy">
            {(field) => {
              return (
                <>
                  <div className={FIELD_CONTAINER_STYLE}>
                    <Label htmlFor={field.name}>
                      Agreement to Privacy{' '}
                      <span className={REQUIRED_FIELD_INDICATOR_STYLE}>*</span>
                    </Label>
                    <div className="flex items-center justify-center gap-10">
                      <Checkbox
                        name={field.name}
                        id={field.name}
                        checked={field.state.value}
                        onCheckedChange={(checked) => {
                          checked
                            ? field.handleChange(true)
                            : field.handleChange(false)
                        }}
                        className={`size-4`}
                      />
                      <p className="text-justify text-sm">
                        By completing this signup form, you acknowledge that you
                        have read and agree to our Privacy Policy, which
                        outlines how we collect, use, and protect your personal
                        information. If you do not agree, please do not proceed
                        with the signup. Thank you for your trust!
                      </p>
                    </div>

                    <FieldInfo field={field} />
                  </div>
                </>
              )
            }}
          </form.Field>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([_, isSubmitting]) => {
              return (
                <div className="mt-4 grid grid-cols-2 place-content-around">
                  <Button
                    variant={'ghost'}
                    className="text-gray-600"
                    onClick={decreaseStep}
                  >
                    <ChevronLeft />
                    Back
                  </Button>
                  <Button type="submit" className="text-white">
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      'Sign Up'
                    )}
                  </Button>
                </div>
              )
            }}
          </form.Subscribe>
        </form>
      </section>
    </>
  )
}
