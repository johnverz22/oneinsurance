import {
  IgwFullQuoteRequest,
  IgwFullQuoteResponse,
} from '@/utils/mappers/travel-insurance/full-quote'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

const FULL_QUOTE_TIMEOUT_MS = 60_000

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

        // Append ID images under custom_field[id_images]
        idImages.forEach((idImage, index) => {
          formData.append(`custom_field[id_images][${index}][file_name]`, idImage.fileName)
          formData.append(`custom_field[id_images][${index}][front_id]`, idImage.frontId)
          formData.append(`custom_field[id_images][${index}][back_id]`, idImage.backId)
        })

        // Do NOT set Content-Type manually — axios sets it with the correct boundary
        const response = await axios.post(
          `/api/travel-insurance/full-quote`,
          formData,
          { timeout: FULL_QUOTE_TIMEOUT_MS }
        )

        return response.data
      } catch (error: any) {
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
          return {
            success: false,
            message:
              'Generating your quote is taking longer than expected. Your details are saved — please try again in a moment.',
          }
        }
        const status: number | undefined = error.response?.status
        const data = error.response?.data
        if (!error.response) {
          return {
            success: false,
            message: 'We could not reach the server. Check your internet connection and try again.',
          }
        }
        // Backend error bodies ({ success:false, message, errors{} }) are
        // returned to the caller so field errors can be shown in the form.
        if (data && typeof data === 'object' && (data.message || data.errors)) return data
        return {
          success: false,
          message:
            (data && typeof data === 'object' && typeof data.error === 'string' && status !== 500 && data.error) ||
            (status === 401 || status === 403
              ? 'Your session could not be verified. Please refresh the page and try again.'
              : status && status >= 500
                ? 'Our quote service is temporarily unavailable. Please try again in a few minutes.'
                : error.message ?? 'Unexpected error'),
        }
      }
    },
    retry: false,
  })
}
