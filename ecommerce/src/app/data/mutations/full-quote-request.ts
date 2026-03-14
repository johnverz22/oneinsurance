import { FullQuoteRequest } from '@/types/full-quote-request'
import { FullQuoteResponseSchema } from '@/types/travel-insurance/policy-types'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

export interface IdImage {
  fileName: string
  frontId: File
  backId: File
}

// Flatten a nested object into FormData using bracket notation
// e.g. { PolicyCustomerList: [{ FirstName: 'John' }] }
// becomes PolicyCustomerList[0][FirstName] = 'John'
function flattenToFormData(formData: FormData, obj: any, prefix = '') {
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue
    const value = obj[key]
    const formKey = prefix ? `${prefix}[${key}]` : key

    if (value === null || value === undefined) continue

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'object' && item !== null && !(item instanceof File)) {
          flattenToFormData(formData, item, `${formKey}[${index}]`)
        } else {
          formData.append(`${formKey}[${index}]`, item instanceof File ? item : String(item))
        }
      })
    } else if (typeof value === 'object' && !(value instanceof File)) {
      flattenToFormData(formData, value, formKey)
    } else {
      formData.append(formKey, value instanceof File ? value : String(value))
    }
  }
}

export function useFullQuoteRequest() {
  return useMutation({
    mutationFn: async ({
      fullQuoteRequest,
      idImages = [],
    }: {
      fullQuoteRequest: FullQuoteRequest
      idImages?: IdImage[]
    }) => {
      try {
        const formData = new FormData()

        // Flatten the entire payload directly into FormData (bracket notation)
        flattenToFormData(formData, fullQuoteRequest)

        // Append ID images under CustomField[IdImages]
        idImages.forEach((idImage, index) => {
          formData.append(`CustomField[IdImages][${index}][file_name]`, idImage.fileName)
          formData.append(`CustomField[IdImages][${index}][front_id]`, idImage.frontId)
          formData.append(`CustomField[IdImages][${index}][back_id]`, idImage.backId)
        })

        // Do NOT set Content-Type manually — axios sets it with the correct boundary
        const response = await axios.post(
          `/api/travel-insurance/full-quote`,
          formData
        )

        if (FullQuoteResponseSchema.safeParse(response.data).success) {
          const validatedData = FullQuoteResponseSchema.safeParse(response.data).data

          if (validatedData?.success && validatedData.data?.ProposalNo) {
            try {
              const proposalKey = `proposal_${validatedData.data.ProposalNo}`
              localStorage.setItem(proposalKey, JSON.stringify(validatedData.data))
              console.log('Saved proposal to localStorage:', validatedData.data.ProposalNo)
            } catch (storageError) {
              console.warn('Failed to save proposal to localStorage:', storageError)
            }
          }

          return validatedData
        }

        return response.data
      } catch (error: any) {
        return error.response.data
      }
    },
    retry: false,
  })
}
