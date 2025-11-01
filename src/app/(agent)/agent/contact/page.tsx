'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent } from '@/components/ui/card'
import { FieldInfo } from '@/components/ui/form'
import {
  CheckCircle,
  MessageSquare,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  MoveUpRight,
} from 'lucide-react'
import { inquirySchema } from '@/types/inquiry'
import { delay } from '@/utils/delay'
import { INQUIRY_TYPES } from '@/constants/inquiry-types'

export default function NewInquiryPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)

  const form = useForm({
    defaultValues: {
      type: 'agent-enrollment',
      message: '',
      customerInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        preferredContact: 'email',
      },
    },
    onSubmit: async ({ value }) => {
      // TODO: implement API
      console.log('🚀 ~ onSubmit: ', value)
      await delay(3000)
      setIsSubmitted(true)
    },
    validators: {
      onChange: inquirySchema,
    },
  })

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-green-700 p-4">
        <Card className="w-full max-w-md border-0 bg-white text-center shadow-lg">
          <CardContent className="pt-12 pb-8">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-gray-900">
              Inquiry Submitted!
            </h2>
            <p className="mb-4 leading-relaxed text-gray-600">
              Thank you for contacting us. We've received your inquiry and will
              get back to you soon.
            </p>

            <Button className="mt-4 h-11 bg-black px-8 text-white" asChild>
              <Link href="/">
                Go to dashboard
                <MoveUpRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="border-background flex min-h-screen flex-col-reverse overflow-hidden rounded-sm border bg-white lg:flex-row">
      <div className="flex w-full flex-col justify-between bg-gray-200 p-8 text-gray-700 lg:w-1/3 lg:p-12 dark:bg-white">
        <div className="flex-1 space-y-12">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-green-700">
              <MessageSquare className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Chat to us</h3>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              Our friendly team is here to help.
            </p>
            <p className="text-sm font-medium">support@oneinsurance.com</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-green-700">
              <MapPin className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Visit us</h3>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              Come say hello at our office HQ.
            </p>
            <div className="text-sm">
              <p className="font-medium">One Insurance Street</p>
              <p className="text-gray-600">Manila, Philippines</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-green-700">
              <Phone className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Call us</h3>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              Mon-Fri from 8am to 5pm.
            </p>
            <p className="text-sm font-medium">+1 (555) 000-0000</p>
          </div>
        </div>

        <div className="flex gap-4 pt-8">
          <Facebook className="h-5 w-5 cursor-pointer text-gray-400 hover:text-gray-600" />
          <Twitter className="h-5 w-5 cursor-pointer text-gray-400 hover:text-gray-600" />
          <Linkedin className="h-5 w-5 cursor-pointer text-gray-400 hover:text-gray-600" />
        </div>
      </div>

      <div className="flex flex-1 items-center bg-green-700 p-8 lg:p-12">
        <div className="w-full max-w-2xl">
          <div className="mb-12">
            <h1 className="mb-4 text-2xl leading-tight font-bold text-gray-200 lg:text-4xl">
              Got questions? We've got
              <br />
              the answers. Let's connect.
            </h1>
            <p className="text-base text-gray-400 lg:text-lg">
              Tell us more about yourself and what you need help with.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            className="space-y-8"
          >
            <div className="grid gap-8 lg:grid-cols-2">
              <form.Field
                name="customerInfo.firstName"
                children={(field) => (
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-300">First Name</Label>
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="John"
                      className="rounded-none border-0 border-b-[1px] border-gray-800 bg-transparent px-0 py-4 text-lg text-white shadow-none placeholder:text-gray-400 focus:border-gray-900 focus-visible:ring-0 dark:bg-transparent"
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              />

              <form.Field
                name="customerInfo.lastName"
                children={(field) => (
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-300">Last Name</Label>
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Doe"
                      className="rounded-none border-0 border-b-[1px] border-gray-800 bg-transparent px-0 py-4 text-lg text-white shadow-none placeholder:text-gray-400 focus:border-gray-900 focus-visible:ring-0 dark:bg-transparent"
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              />
            </div>

            <form.Field
              name="customerInfo.email"
              children={(field) => (
                <div className="space-y-2">
                  <Label className="text-xs text-gray-300">Email</Label>
                  <Input
                    type="email"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="johndoe@company.com"
                    className="rounded-none border-0 border-b-[1px] border-gray-800 bg-transparent px-0 py-4 text-lg text-white shadow-none placeholder:text-gray-400 focus:border-gray-900 focus-visible:ring-0 dark:bg-transparent"
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            />

            <form.Field
              name="customerInfo.phone"
              children={(field) => (
                <div className="space-y-2">
                  <Label className="text-xs text-gray-300">Phone Number</Label>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="+63 9123 876 543"
                    className="rounded-none border-0 border-b-[1px] border-gray-800 bg-transparent px-0 py-4 text-lg text-white shadow-none placeholder:text-gray-400 focus:border-gray-900 focus-visible:ring-0 dark:bg-transparent"
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            />

            <form.Field
              name="message"
              children={(field) => (
                <div className="space-y-2">
                  <Label className="text-xs text-gray-300">Message</Label>
                  <Textarea
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Tell us a little about what you need help with..."
                    className="resize-none rounded-none border-0 border-b-[1px] border-gray-800 bg-transparent px-0 py-4 text-lg shadow-none placeholder:text-gray-400 focus:border-gray-900 focus-visible:ring-0 dark:bg-transparent"
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            />

            <div className="space-y-6">
              <Label className="text-gray-300">How can we help?</Label>
              <form.Field
                name="type"
                mode="array"
                children={(field) => (
                  <RadioGroup
                    defaultValue={field.state.value}
                    onValueChange={(value) => field.handleChange(value)}
                    className="text-white"
                  >
                    <div className="grid gap-4 lg:grid-cols-2">
                      {INQUIRY_TYPES.map((type, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <RadioGroupItem
                            value={type.value}
                            id={type.value}
                            className="border-white"
                          />
                          <div className="space-y-px">
                            <Label htmlFor={type.value}>{type.label}</Label>
                            <small className="text-gray-400">
                              {type.description}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}
              />
            </div>

            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  className="h-11 bg-black px-8 text-white"
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : "Let's get started!"}
                </Button>
              )}
            />
          </form>
        </div>
      </div>
    </div>
  )
}
