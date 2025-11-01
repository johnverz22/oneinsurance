'use client'

import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { FieldInfo } from '@/components/ui/form'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DialogFormWrapper } from '@/components/ui/dialog-form-wrapper'
import { clientSchema, type Client } from '@/types/client'

type AddClientFormProps = {
  onAddClient: (client: Omit<Client, 'id' | 'submittedAt'>) => void
}

export const AddClientForm = ({ onAddClient }: AddClientFormProps) => {
  const [open, setOpen] = useState(false)

  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: new Date(),
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'PH',
      },
      occupation: '',
      annualIncome: 0,
    },
    onSubmit: async ({ value }) => {
      const newClient: Omit<Client, 'id' | 'submittedAt'> = {
        ...value,
        status: 'pending',
        // documents: [],
        idType: '',
        idNumber: '',
      }
      onAddClient(newClient)
      setOpen(false)
      form.reset()
    },
    validators: {
      onChange: clientSchema,
    },
  })

  return (
    <DialogFormWrapper
      open={open}
      setOpen={setOpen}
      title="Add Client"
      className="flex flex-row px-6 lg:w-max"
      contentContainerClassName="overflow-hidden p-8"
    >
      <ScrollArea className="relative h-full max-h-[80vh]">
        <form
          className="space-y-6 pb-24"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <form.Field
                  name="firstName"
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>First Name</Label>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
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
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
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
                      <Label htmlFor={field.name}>Email</Label>
                      <Input
                        id={field.name}
                        type="email"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                />
                <form.Field
                  name="phone"
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Phone</Label>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="+1 (555) 123-4567"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                />
              </div>

              <form.Field
                name="dateOfBirth"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Date of Birth</Label>
                    <DateTimePicker
                      variant="date"
                      value={field.state.value}
                      modal={true}
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Address Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field
                name="address.street"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Street Address</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <form.Field
                  name="address.city"
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>City</Label>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                />
                <form.Field
                  name="address.state"
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>State</Label>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <form.Field
                  name="address.zipCode"
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>ZIP Code</Label>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                />
                <form.Field
                  name="address.country"
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Country</Label>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Professional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <form.Field
                  name="occupation"
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Occupation</Label>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                />
                <form.Field
                  name="annualIncome"
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Annual Income</Label>
                      <Input
                        id={field.name}
                        type="number"
                        value={field.state.value}
                        onChange={(e) =>
                          field.handleChange(Number(e.target.value))
                        }
                        onBlur={field.handleBlur}
                        placeholder="0"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="bg-card fixed inset-x-0 -bottom-2 z-30 flex w-full justify-end gap-3 border-t px-8 py-4 pb-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  className="text-white"
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? 'Adding...' : 'Add Client'}
                </Button>
              )}
            />
          </div>
        </form>
      </ScrollArea>
    </DialogFormWrapper>
  )
}
