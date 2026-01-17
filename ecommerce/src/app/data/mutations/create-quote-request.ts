import axios from 'axios'
import { useMutation } from '@tanstack/react-query'
import { InitCompareQuote, TravelPolicy } from '@/types/plan'
import {
  PersonalInfoFormData,
  TravelInsuranceFormData,
  InitTravelInsuranceRequest,
} from '@/types/travel-insurance/travel-insurance-request'
import { travelInsuranceSchemaToInitCompareQuote } from '@/utils/mappers/travel-insurance/init-compare-quote'

export type TravelQuoteRequestArgs = {
  values: TravelInsuranceFormData & PersonalInfoFormData
}

export const initCompareQuote = async (data: InitTravelInsuranceRequest) => {
  try {
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/quote/travel/compare-quote`
    const token = `Bearer ${process.env.NEXT_PUBLIC_ACCESS_TOKEN}`

    const result = await axios.post<InitCompareQuote>(url, data, {
      headers: { Authorization: token },
    })
    return result.data
  } catch (error) {
    throw error
  }
}

export const useCreateQuoteRequest = () => {
  return useMutation({
    mutationFn: async (values: TravelInsuranceFormData) => {
      const initCompareQuoteRequoteBody =
        travelInsuranceSchemaToInitCompareQuote(values)
      try {
        const response = await initCompareQuote(initCompareQuoteRequoteBody)

        return response.data.ClientRequestId
      } catch (error) {
        throw error
      }
    },
  })
}
