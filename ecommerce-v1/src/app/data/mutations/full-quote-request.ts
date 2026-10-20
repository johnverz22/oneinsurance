import {
  IgwFullQuoteRequest,
  IgwFullQuoteResponse,
} from '@/utils/mappers/travel-insurance/full-quote'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

export interface IdImage {
  fileName: string
  frontId: File
  backId: File
}

// Flatten a nested object into FormData using bracket notation
// e.g. { travellers: [{ first_name: 'John' }] }
// becomes travellers[0][first_name] = 'John'
// Booleans become 1/0 — the IGW gateway rejects literal 'true'/'false'
// in multipart bodies.
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
    } else if (typeof value === 'boolean') {
      formData.append(formKey, value ? '1' : '0')
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
      fullQuoteRequest: IgwFullQuoteRequest
      idImages?: IdImage[]
    }): Promise<IgwFullQuoteResponse> => {
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

        return response.data
      } catch (error: any) {
        // Backend error bodies ({ success:false, message, errors{} }) are
        // returned to the caller so field errors can be shown in the form.
        return error.response?.data ?? {
          success: false,
          message: error.message ?? 'Unexpected error',
        }
      }
    },
    retry: false,
  })
}
