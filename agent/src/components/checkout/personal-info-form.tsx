'use client'

import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { CalendarIcon } from 'lucide-react'
import { useForm } from '@tanstack/react-form'
import { useCheckoutStore } from '@/store/checkout-store'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { personalInfoSchema } from '@/types/checkout'
import { Calendar } from '@/components/ui/calendar'
import { FieldInfo } from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export function PersonalInfoForm() {
  const { formData, updateFormData, nextStep, prevStep } = useCheckoutStore()

  const form = useForm({
    defaultValues: {
      firstName: formData.firstName ?? '',
      lastName: formData.lastName ?? '',
      email: formData.email ?? '',
      phone: formData.phone ?? '',
      dateOfBirth: formData.dateOfBirth,
      address: formData.address ?? '',
      city: formData.city ?? '',
      sex: formData.sex ?? 'male',
      zipCode: formData.zipCode ?? 0,
      emergencyContact: formData.emergencyContact ?? '',
      emergencyPhone: formData.emergencyPhone ?? '',
      idType: formData.idType,
      idNumber: formData.idNumber ?? '',
      agreeToTerms: formData.agreeToTerms ?? false,
    },
    onSubmit: async ({ value }) => {
      updateFormData(value)
      nextStep()
    },
    validators: {
      onChange: personalInfoSchema,
    },
  })

  return (
    <Card className="mx-auto w-full max-w-6xl">
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-2 gap-4">
            <form.Field
              name="firstName"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>First Name</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="John"
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            />

            <form.Field
              name="lastName"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Last Name</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Doe"
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <form.Field
              name="email"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Email Address</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="johndoe@example.com"
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            />

            <form.Field
              name="phone"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Phone Number</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="+63 900 000 0000"
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <form.Field
              name="sex"
              children={(field) => (
                <div className="bg-muted-foreground/5 relative flex items-center justify-center space-y-4 rounded-md border px-4">
                  <Label className="absolute top-3 left-3 font-normal">
                    Sex:
                  </Label>

                  <RadioGroup
                    value={field.state.value}
                    onValueChange={(value) =>
                      field.handleChange(value as 'male' | 'female')
                    }
                    className="grid gap-4 md:grid-cols-2"
                  >
                    <div className="relative flex items-center gap-4">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male" className="font-normal">
                        Male
                      </Label>
                    </div>
                    <div className="relative flex items-center gap-4">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female" className="font-normal">
                        Female
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            />

            <form.Field
              name="dateOfBirth"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Date of Birth</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.state.value && 'text-muted-foreground'
                        )}
                      >
                        {field.state.value ? (
                          format(field.state.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.state.value}
                        onSelect={field.handleChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        captionLayout="dropdown"
                      />
                    </PopoverContent>
                  </Popover>
                  <FieldInfo field={field} />
                </div>
              )}
            />
          </div>

          <Separator />

          <form.Field
            name="address"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Address</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Address"
                />
                <FieldInfo field={field} />
              </div>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <form.Field
              name="city"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>City</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter city"
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            />

            <form.Field
              name="zipCode"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Zip Code</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    type="number"
                    placeholder="Enter zip code"
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <form.Field
              name="emergencyContact"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Emergency Contact Name</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Emergency contact name"
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            />

            <form.Field
              name="emergencyPhone"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Emergency Phone</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Emergency contact phone"
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <form.Field
              name="idType"
              children={(field) => (
                <div className="w-full space-y-2">
                  <Label>ID Type</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) =>
                      field.handleChange(
                        value as
                          | 'Voter'
                          | 'Postal'
                          | 'SSS'
                          | 'UMID'
                          | 'Passport'
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Voter">Voter's ID</SelectItem>
                      <SelectItem value="Postal">Postal ID</SelectItem>
                      <SelectItem value="SSS">SSS ID</SelectItem>
                      <SelectItem value="UMID">UMID</SelectItem>
                      <SelectItem value="Passport">Passport</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldInfo field={field} />
                </div>
              )}
            />

            <form.Field
              name="idNumber"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>ID Number</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter ID number"
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            />
          </div>

          <Separator />

          <form.Field
            name="agreeToTerms"
            children={(field) => (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={field.state.value}
                    onCheckedChange={(value) =>
                      field.handleChange(value as true | false)
                    }
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the terms and conditions and privacy policy
                  </Label>
                </div>
                <FieldInfo field={field} />
              </div>
            )}
          />

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              className="flex-1 bg-transparent"
            >
              Previous
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="flex-1 text-white"
                >
                  {isSubmitting ? 'Processing...' : 'Review Order'}
                </Button>
              )}
            />
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
