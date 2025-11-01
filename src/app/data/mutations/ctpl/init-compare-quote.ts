import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import {
  InitCompareCTPLRequest,
  CTPLInitCompareResponse,
  CTPLProductType,
} from '@/types/ctpl-insurance/ctpl-types'

export function ctplInitCompareQuote() {
  return useMutation({
    mutationFn: async ({
      data,
      productType,
    }: {
      data: InitCompareCTPLRequest
      productType: CTPLProductType
    }) => {
      try {
        const url = '/api/ctpl-insurance/init-compare'
        const token = `Bearer ${process.env.NEXT_PUBLIC_TOKEN}`
        const response = await axios.post<CTPLInitCompareResponse>(
          url,
          {
            data,
            productType,
          },
          {
            headers: { Authorization: token },
          }
        )

        const result = response.data
        return result
      } catch (error) {
        console.error(`ctpl init ${productType} error:`, error)
        throw error
      }
    },
  })
}
