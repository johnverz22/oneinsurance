'use client'

import { InsuranceClaimSchema, InsuranceClaim } from '@/types/claim'
import { useForm } from '@tanstack/react-form'
import { FileUpload } from './file-upload'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { FieldInfo } from '../ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Button } from '../ui/button'
import { CalendarIcon, LoaderIcon } from 'lucide-react'
import { Calendar } from '../ui/calendar'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Textarea } from '../ui/textarea'
import { delay } from '@/utils/delay'
import { toast } from 'sonner'

export default function UploadClaimForm() {
  const form = useForm({
    defaultValues: {
      policyNumber: '',
      dateOfIncident: new Date(),
      estimatedClaimAmount: 0,
      descriptionOfIncident: '',
      locationOfIncident: '',
      supportingDocuments: [],
    } as InsuranceClaim,
    validators: {
      onChange: InsuranceClaimSchema,
    },
    onSubmit: async ({ value }) => {
      await delay(3000)
      console.log(value)
      form.reset()
      toast.info('Under Construction')
    },
  })

  return (
    <div className="flex min-h-screen w-full flex-col px-4 sm:px-6 md:px-[10%] lg:px-[20%]">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        className="flex flex-col gap-6"
      >
        <form.Field name="policyNumber">
          {(field) => (
            <div className="flex w-full flex-col gap-4">
              <Label htmlFor={field.name} className="font-bold">
                Policy Number *
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

        <form.Field name={'dateOfIncident'}>
          {(field) => (
            <div className="flex w-full flex-col gap-4">
              <Label htmlFor={field.name} className="font-bold">
                Date of Incident
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
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
                    defaultMonth={field.state.value}
                    selected={field.state.value}
                    onSelect={(date) => field.handleChange(date!)}
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
        </form.Field>

        <form.Field name="estimatedClaimAmount">
          {(field) => (
            <div className="flex w-full flex-col gap-4">
              <Label htmlFor={field.name} className="font-bold">
                Estimated Claim Amount (PHP) *
              </Label>
              <Input
                type="number"
                name={field.name}
                value={field.state.value || ''}
                onChange={(e) => {
                  const val = e.target.value
                  field.handleChange(val === '' ? 0 : Number(val))
                }}
                placeholder="0.00"
              />
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>

        <form.Field name="descriptionOfIncident">
          {(field) => (
            <div className="flex w-full flex-col gap-4">
              <Label htmlFor={field.name} className="font-bold">
                Description of Incident *
              </Label>
              <Textarea
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Please provide a detailed description of what happened"
              />
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>

        <form.Field name="locationOfIncident">
          {(field) => (
            <div className="flex w-full flex-col gap-4">
              <Label htmlFor={field.name} className="font-bold">
                Location of Incident
              </Label>
              <Input
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="1234 Barangay St. Quezon City, Metro Manila, 1100 Philippines"
              />
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>

        {/* Supporting Documents */}
        <form.Field
          name="supportingDocuments"
          validators={{
            onChange: InsuranceClaimSchema.shape.supportingDocuments,
          }}
          children={(field) => (
            <div className="flex w-full flex-col gap-4">
              <Label htmlFor={field.name} className="font-bold">
                Supporting Documents *
              </Label>
              <p className="text-xs">
                Upload photos, reports, receipts, or other documents that
                support your claim.
              </p>
              <FileUpload
                value={field.state.value}
                onChange={field.handleChange}
                error={
                  field.state.meta.errors.length > 0
                    ? field.state.meta.errors[0]!.message
                    : null
                }
              />
            </div>
          )}
        />

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? (
                <p className="flex">
                  <LoaderIcon /> Uploading
                </p>
              ) : (
                <p>Submit Claim</p>
              )}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  )
}
