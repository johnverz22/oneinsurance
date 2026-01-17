import {
  FullQuoteCTPLRequest,
  FullQuoteCTPLResponse,
} from '@/types/ctpl-insurance/full-quote'
import { CTPLProductType } from '@/types/ctpl-insurance/init-compare'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

export function useCtplFullQuoteRequest() {
  return useMutation({
    mutationFn: async ({
      data,
      productType,
    }: {
      data: FullQuoteCTPLRequest
      productType: CTPLProductType
    }) => {
      const url = `/api/ctpl-insurance/full-quote`
      const token = `Bearer ${process.env.NEXT_PUBLIC_ACCESS_TOKEN}`

      const response = await axios.post<FullQuoteCTPLResponse>(
        url,
        {
          productType,
          data,
        },
        {
          headers: {
            Authorization: token,
          },
        }
      )

      return response.data
    },
  })
}
