import {
  CTPLCompareQuoteResponse,
  CTPLProductType,
} from '@/types/ctpl-insurance/init-compare'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export const useGetCtplCompareQuote = (
  clientRequestId: string,
  productType: CTPLProductType
) => {
  return useQuery({
    queryKey: ['ctpl-compare-quote', clientRequestId],
    queryFn: async () => {
      const url = `/api/ctpl-insurance/get-compare?ClientRequestId=${clientRequestId}`
      const token = `Bearer ${process.env.NEXT_PUBLIC_TOKEN}`
      const response = await axios.get<CTPLCompareQuoteResponse>(url, {
        headers: {
          Authorization: token,
        },
      })
      return response.data
    },
    refetchOnWindowFocus: false,
    retry: false,
  })
}
