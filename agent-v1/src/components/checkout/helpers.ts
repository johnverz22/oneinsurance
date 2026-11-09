import { INSURANCES } from '@/constants/insurances'
import { Category } from '@/types/category'
import {
  CheckoutForm,
  HMOInsuranceForm,
  TravelInsuranceForm,
  GeneralInsuranceForm,
  generalInsuranceSchema,
  hmoInsuranceSchema,
  medicalInsuranceSchema,
  travelInsuranceSchema,
} from '@/types/checkout'

export const getSchemaAndDefaults = (type: Category['id']) => {
  const schemaMap = {
    hmo: hmoInsuranceSchema,
    travel: travelInsuranceSchema,
    general: generalInsuranceSchema,
    medical: medicalInsuranceSchema,
  }

  const schema = schemaMap[type as keyof typeof schemaMap]
  const minimalObject = { type }

  try {
    const withDefaults = schema.parse(minimalObject)
    return { schema, defaultValues: withDefaults }
  } catch {
    return { schema, defaultValues: minimalObject }
  }
}

export function getInsuranceById(id?: string) {
  const insurance = INSURANCES.find((insurance) => insurance.id === id)

  return insurance
}

export function isHMOInsurance(data: CheckoutForm): data is HMOInsuranceForm {
  return data.type === 'hmo'
}

export function isTravelInsurance(
  data: CheckoutForm
): data is TravelInsuranceForm {
  return data.type === 'travel'
}

export function isGeneralInsurance(
  data: CheckoutForm
): data is GeneralInsuranceForm {
  return data.type === 'general'
}

export function isMedicalInsurance(
  data: CheckoutForm
): data is GeneralInsuranceForm {
  return data.type === 'medical'
}
