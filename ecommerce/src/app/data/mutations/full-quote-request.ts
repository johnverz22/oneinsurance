import { FullQuoteRequest } from '@/types/full-quote-request'
import { FullQuoteResponseSchema } from '@/types/travel-insurance/policy-types'
import { FullQuoteResponseValidationError } from '@/types/travel-insurance/error-travel-response'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

export interface IdImage {
  fileName: string
  frontId: File
  backId: File
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
        // Create FormData for multipart/form-data submission
        const formData = new FormData()
        
        // Add the main payload as JSON string
        formData.append('payload', JSON.stringify(fullQuoteRequest))
        
        // Add ID images count
        formData.append('id_images_count', idImages.length.toString())
        
        // Add each ID image with its files
        idImages.forEach((idImage, index) => {
          formData.append(`id_images[${index}][file_name]`, idImage.fileName)
          formData.append(`id_images[${index}][front_id]`, idImage.frontId)
          formData.append(`id_images[${index}][back_id]`, idImage.backId)
        })

        const response = await axios.post(
          `/api/travel-insurance/full-quote`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        )

        if (FullQuoteResponseSchema.safeParse(response.data).success) {
          const validatedData = FullQuoteResponseSchema.safeParse(response.data).data
          
          // Save proposal to localStorage for offline access
          if (validatedData && validatedData.success && validatedData.data?.ProposalNo) {
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
