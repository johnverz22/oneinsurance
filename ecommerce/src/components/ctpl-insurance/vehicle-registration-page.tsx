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
    decreaseStep,
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
                    <p className="text-muted-foreground mb-1 text-xs">Format: NCR-MM-001</p>
                    <Input
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="e.g. NCR-MM-001"
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
                    <div className="mb-2 flex items-center justify-between">
                      <Label htmlFor={field.name} className="font-semibold">MV File Number</Label>
                      <span className="text-muted-foreground text-xs">Format: 034-035567</span>
                    </div>
                    <Input
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="e.g. 034-035567"
                      autoComplete="off"
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
              <form.Field name="plateNumber">
                {(field) => (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <Label htmlFor={field.name} className="font-semibold">Plate Number</Label>
                      <span className="text-muted-foreground text-xs">Format: ABC 1234 or ABC123</span>
                    </div>
                    <Input
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="e.g. ABC 1234"
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
                    <div className="mb-2 flex items-center justify-between">
                      <Label htmlFor={field.name} className="font-semibold">Engine Number</Label>
                      <span className="text-muted-foreground text-xs">Format: 2NG-W7V659-321</span>
                    </div>
                    <Input
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="e.g. 2NG-W7V659-321"
                      autoComplete="off"
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
              <form.Field name="chassisNumber">
                {(field) => (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <Label htmlFor={field.name} className="font-semibold">Chassis Number</Label>
                      <span className="text-muted-foreground text-xs">Format: CHS-W746564B9-321</span>
                    </div>
                    <Input
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="e.g. CHS-W7V659-321"
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
                      placeholder="e.g. Toyota"
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
                      placeholder="e.g. Vios"
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
                      placeholder="e.g. Sedan"
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
                      placeholder="e.g. 2020"
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
                    <div className="mb-2 flex items-center justify-between">
                      <Label htmlFor={field.name} className="font-semibold">Sub Model</Label>
                      <span className="text-muted-foreground text-xs">Format: 1.3 E CVT</span>
                    </div>
                    <Input
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="e.g. 1.3 E CVT"
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

      <div className="bg-card border-muted-foreground/20 flex w-full flex-col gap-4 rounded-md border px-6 py-5">
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
                className="data-[state=checked]:border-primary data-[state=checked]:bg-primary h-4 w-4"
              />
              <Label htmlFor={field.name} className="cursor-pointer text-sm">
                I agree to the Terms & Conditions and Privacy Policy
              </Label>
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="rounded-full px-8"
                onClick={decreaseStep}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                type="submit"
                size="lg"
                className="from-primary to-accent rounded-full bg-gradient-to-r px-10 font-semibold text-white"
                disabled={!canSubmit || isSubmitting}
              >
                Continue to Personal Information
              </Button>
            </div>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
