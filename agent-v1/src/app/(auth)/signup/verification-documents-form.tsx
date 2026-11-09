'use client'

import { useForm } from '@tanstack/react-form'
import {
  verificationDocumentsSchema,
  VerificationDocuments,
  RegisterAgent,
} from '@/types/agent/auth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PH_ID_TYPES, PhilippineIdTypeEnum } from '@/types/id-types'
import { LoaderIcon, Plus } from 'lucide-react'
import { useState } from 'react'
import { FieldInfo } from '@/components/ui/form'
import { useAgentRegistrationStore } from '@/store/agent-registration-store'
import { useRegisterAgent } from '@/app/data/mutations/agent/auth-agent'
import { useRouter } from 'next/navigation'

export default function VerificationDocumentsForm() {
  const router = useRouter()
  const [idFile, setIdFile] = useState<File | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [licenseFile, setLicenseFile] = useState<File | null>(null)
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const {
    credentials,
    verificationDocuments,
    decreaseStep,
    setVerificationDocuments,
    setRegistrationResult,
  } = useAgentRegistrationStore()
  const { mutateAsync: registerAgent } = useRegisterAgent()

  const form = useForm({
    defaultValues: verificationDocuments,
    validators: {
      onChange: verificationDocumentsSchema,
    },
    onSubmit: async ({ value }) => {
      setIsRegistering(true)
      setVerificationDocuments(value)
      // Call the API
      const result = await registerAgent({ data: credentials as RegisterAgent })

      // Store the result
      setRegistrationResult(result)
      setIsRegistering(false)

      router.push('/verify-email')
    },
  })

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      setter(file)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* ID Type */}
        <form.Field name="idType">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="idType" className="text-sm sm:text-base">
                ID Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(value as PhilippineIdTypeEnum)
                }
              >
                <SelectTrigger id="idType" className="rounded-ful h-12 w-full">
                  <SelectValue placeholder="Select ID Type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PH_ID_TYPES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>

        {/* ID Number */}
        <form.Field name="idNumber">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="idNumber" className="text-sm sm:text-base">
                ID Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="idNumber"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Enter ID Number"
                className="h-12 w-full rounded-full"
              />
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>
      </div>

      {/* ID File Upload */}
      <div className="flex justify-end">
        <div className="relative">
          <input
            type="file"
            id="idFile"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => handleFileChange(e, setIdFile)}
          />
          <label htmlFor="idFile">
            <Button
              type="button"
              variant="outline"
              className="h-11 cursor-pointer rounded-full border-2 px-6 font-semibold"
              onClick={() => document.getElementById('idFile')?.click()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Choose File
            </Button>
          </label>
          {idFile && <p className="mt-1 text-xs">{idFile.name}</p>}
        </div>
      </div>

      {/* License Number */}
      <form.Field name="licenseNumber">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="licenseNumber" className="text-sm sm:text-base">
              License Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="licenseNumber"
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Enter License Number"
              className="h-12 w-full rounded-full"
            />
            <FieldInfo field={field} />
          </div>
        )}
      </form.Field>

      {/* License File Upload */}
      <div className="flex justify-end">
        <div className="relative">
          <input
            type="file"
            id="licenseFile"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => handleFileChange(e, setLicenseFile)}
          />
          <label htmlFor="licenseFile">
            <Button
              type="button"
              variant="outline"
              className="h-11 cursor-pointer rounded-full border-2 px-6 font-semibold"
              onClick={() => document.getElementById('licenseFile')?.click()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Choose File
            </Button>
          </label>
          {licenseFile && (
            <p className="mt-1 text-xs text-gray-600">{licenseFile.name}</p>
          )}
        </div>
      </div>

      {/* Certificate Number */}
      <form.Field name="certificateNumber">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="certificateNumber" className="text-sm sm:text-base">
              Certificate Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="certificateNumber"
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Enter Certificate Number"
              className="h-12 w-full rounded-full"
            />
            <FieldInfo field={field} />
          </div>
        )}
      </form.Field>

      {/* Certificate File Upload */}
      <div className="flex justify-end">
        <div className="relative">
          <input
            type="file"
            id="certificateFile"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => handleFileChange(e, setCertificateFile)}
          />
          <label htmlFor="certificateFile">
            <Button
              type="button"
              variant="outline"
              className="h-11 cursor-pointer rounded-full border-2 px-6 font-semibold"
              onClick={() =>
                document.getElementById('certificateFile')?.click()
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Choose File
            </Button>
          </label>
          {certificateFile && (
            <p className="mt-1 text-xs text-gray-600">{certificateFile.name}</p>
          )}
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-4 pt-4">
        {/* Confirm Information */}
        <form.Field name="confirmInfo">
          {(field) => (
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="confirmInfo"
                  checked={field.state.value}
                  onCheckedChange={(checked) =>
                    field.handleChange(checked === true)
                  }
                  className="mt-0.5 h-5 w-5 rounded-full border-2"
                />
                <Label
                  htmlFor="confirmInfo"
                  className="cursor-pointer text-base leading-tight font-normal"
                >
                  I confirm that the above information is true and accurate.
                </Label>
              </div>
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>

        {/* Authorize Company */}
        <form.Field name="authorizeCompany">
          {(field) => (
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="authorizeCompany"
                  checked={field.state.value}
                  onCheckedChange={(checked) =>
                    field.handleChange(checked === true)
                  }
                  className="mt-0.5 h-5 w-5 rounded-full border-2"
                />
                <Label
                  htmlFor="authorizeCompany"
                  className="cursor-pointer text-base leading-tight font-normal"
                >
                  I authorize the company to use my bank details solely for
                  commission payouts.
                </Label>
              </div>
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => decreaseStep()}
          className="min-w-[120px] rounded-full border-2 px-8 py-2 text-base font-semibold"
        >
          Back
        </Button>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting || isRegistering}
              className="from-primary to-lilac hover:from-primary/90 hover:to-lilac/90 focus:from-primary/90 focus:to-lilac/90 rounded-full bg-gradient-to-r text-white"
            >
              {isRegistering ? (
                <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <span className="px-5">Sign Up</span>
              )}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
