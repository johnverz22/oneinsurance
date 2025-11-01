import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import Image from 'next/image'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { useCtplInsuranceStateStore } from '@/store/ctpl-store'
import { Button } from '../ui/button'
import {
  VehicleRegistrationFormData,
  VehicleRegistrationSchema,
} from '@/types/ctpl-insurance'
import { useForm } from '@tanstack/react-form'
import { FieldInfo } from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { DateTimePicker } from '../ui/date-time-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function VehicleRegistration() {
  const {
    setVehicleRegistration,
    vehicleRegistration,
    selectedVehicle,
    increaseStep,
  } = useCtplInsuranceStateStore()

  const form = useForm({
    defaultValues: vehicleRegistration,
    validators: {
      onChange: VehicleRegistrationSchema,
    },
    onSubmit: async ({ value }: { value: VehicleRegistrationFormData }) => {
      try {
        setVehicleRegistration(value)
        increaseStep()
      } catch (error) {
        console.error('Form submission error:', error)
        throw error
      }
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="w-full space-y-4"
    >
      <Card className="mx-auto max-w-7xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg md:text-2xl">Vehicle Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4 md:flex-row">
            <div className="relative h-14 w-36">
              <Image
                src={selectedVehicle!.image}
                alt=""
                fill
                className="object-contain"
              />
            </div>
            <span className="text-center text-lg font-semibold md:text-left">
              {selectedVehicle!.title}
            </span>
          </div>
          {/* Responsive grid for fields */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <form.Field name="fieldOfficeCode">
                {(field) => (
                  <div>
                    <Label
                      htmlFor={field.name}
                      className="mb-2 block font-semibold"
                    >
                      Field Office Code
                    </Label>
                    <Input
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Enter Field Office Code"
                      autoComplete="off"
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>

              <form.Field name="dateOfRegistration">
                {(field) => (
                  <div>
                    <Label htmlFor={field.name} className="mb-2 font-semibold">
                      Date of Registration
                    </Label>
                    <DateTimePicker
                      variant="date"
                      value={
                        field.state.value
                          ? new Date(field.state.value)
                          : undefined
                      }
                      onChange={(date) => field.handleChange(date ?? null)}
                      disabled={(date) => date > new Date()}
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
            </div>
            <Separator />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <form.Field name="mvFileNumber">
                {(field) => (
                  <div>
                    <Label htmlFor={field.name} className="mb-2 font-semibold">
                      MV File Number
                    </Label>
                    <Input
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Enter MV File Number"
                      autoComplete="off"
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
              <form.Field name="plateNumber">
                {(field) => (
                  <div>
                    <Label htmlFor={field.name} className="mb-2 font-semibold">
                      Plate Number
                    </Label>
                    <Input
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Enter Plate Number"
                      autoComplete="off"
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <form.Field name="engineNumber">
                {(field) => (
                  <div>
                    <Label htmlFor={field.name} className="mb-2 font-semibold">
                      Engine Number
                    </Label>
                    <Input
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Enter Engine Number"
                      autoComplete="off"
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
              <form.Field name="chassisNumber">
                {(field) => (
                  <div>
                    <Label htmlFor={field.name} className="mb-2 font-semibold">
                      Chassis Number
                    </Label>
                    <Input
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Enter Chassis Number"
                      autoComplete="off"
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
            </div>
            <Separator />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <form.Field name="make">
                {(field) => (
                  <div>
                    <Label htmlFor={field.name} className="mb-2 font-semibold">
                      Make
                    </Label>
                    <Input
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Enter make"
                      autoComplete="off"
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
              <form.Field name="model">
                {(field) => (
                  <div>
                    <Label htmlFor={field.name} className="mb-2 font-semibold">
                      Model
                    </Label>
                    <Input
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Enter model"
                      autoComplete="off"
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
              <form.Field name="bodyType">
                {(field) => (
                  <div>
                    <Label htmlFor={field.name} className="mb-2 font-semibold">
                      Body Type
                    </Label>
                    <Input
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Enter body type"
                      autoComplete="off"
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
              <form.Field name="modelYear">
                {(field) => (
                  <div>
                    <Label htmlFor={field.name} className="mb-2 font-semibold">
                      Model Year
                    </Label>
                    <Input
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="YYYY"
                      autoComplete="off"
                      type="number"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <form.Field name="subModel">
                {(field) => (
                  <div>
                    <Label htmlFor={field.name} className="mb-2 font-semibold">
                      Sub Model
                    </Label>
                    <Input
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Enter Sub Model"
                      autoComplete="off"
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>

              <form.Field name="typeOfUse">
                {(field) => (
                  <div>
                    <Label htmlFor={field.name} className="mb-2 font-semibold">
                      Type of Use
                    </Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Type of Use" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRIVATE">Private</SelectItem>
                        <SelectItem value="PUBLIC">Public</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-card border-muted-foreground/20 flex w-full items-center justify-between rounded-md border px-6 py-5">
        <div className="flex flex-col gap-2">
          <form.Field name="agreeToTerms">
            {(field) => (
              <div className="flex items-center gap-2">
                <Checkbox
                  name={field.name}
                  checked={field.state.value}
                  onCheckedChange={(checked) =>
                    checked
                      ? field.handleChange(true)
                      : field.handleChange(false)
                  }
                  className="size-6"
                />
                <Label htmlFor={field.name} className="font-semibold">
                  I agree to the Terms & Conditions and Privacy Policy
                </Label>
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
        </div>

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              size="lg"
              className="text-white"
              disabled={!canSubmit || isSubmitting}
            >
              Next <ArrowRight />
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
