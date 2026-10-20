import { subYears } from 'date-fns'
import {
  PersonalInfoFormData,
  formatValidators,
  travelersInfoSchema,
} from '@/types/travel-insurance/travel-insurance-request'

export const emptyTraveller = (): PersonalInfoFormData => ({
  firstName: '',
  middleName: '',
  lastName: '',
  suffix: 'No Suffix',
  // Empty string so the user must explicitly choose; cast is safe because
  // validateTravellers enforces 'M' | 'F' before submission.
  gender: '' as 'M' | 'F',
  email: '',
  mobileNumber: '',
  idType: 'PAS',
  idNumber: '',
  idFrontUploaded: false,
  idBackUploaded: false,
  address: { province: '', city: '', zipCode: '', line1: '', line2: '' },
  isCovidVaccinated: false,
  is_data_sharing_consent: false,
  hasBeneficiary: false,
  beneficiary: { firstName: '', middleName: '', lastName: '', dateOfBirth: null, relationship: '' },
  dateOfBirth: null as unknown as Date,
})

export const isAdultAt = (index: number, adults: number) => index < adults

export const adultCutoff = () => subYears(new Date(), 18)

export function setPath<T>(obj: T, path: string, value: unknown): T {
  const [head, ...rest] = path.split('.')
  const source = obj as Record<string, unknown>
  return {
    ...source,
    [head]: rest.length ? setPath(source[head], rest.join('.'), value) : value,
  } as T
}

/** Flat `"<index>.<field path>"` → message. First message per field wins. */
export function validateTravellers(
  travellers: PersonalInfoFormData[],
  adults: number
): Record<string, string> {
  const errors: Record<string, string> = {}
  const add = (key: string, message: string) => {
    if (!(key in errors)) errors[key] = message
  }

  const result = travelersInfoSchema.safeParse(travellers)
  if (!result.success) {
    for (const issue of result.error.issues) {
      const path = issue.path.map(String)
      const isBeneficiaryGroup = path[1] === 'beneficiary' && (path.length === 2 || path[2] === 'name')
      add(isBeneficiaryGroup ? `${path[0]}.beneficiary` : path.join('.'), issue.message)
    }
  }

  const cutoff = adultCutoff()
  travellers.forEach((t, i) => {
    // Gender must be explicitly selected
    if (!t.gender) add(`${i}.gender`, 'Gender is required')

    // Date of birth: must be set and a valid date
    if (!(t.dateOfBirth instanceof Date) || isNaN(t.dateOfBirth.getTime())) {
      add(`${i}.dateOfBirth`, 'Date of birth is required')
    } else {
      if (isAdultAt(i, adults) && t.dateOfBirth > cutoff) add(`${i}.dateOfBirth`, 'Adult travellers must be 18 or older')
      if (!isAdultAt(i, adults) && (t.dateOfBirth <= cutoff || t.dateOfBirth >= new Date()))
        add(`${i}.dateOfBirth`, 'Child travellers must be under 18')
    }

    const validator = formatValidators[t.idType]
    if (t.idNumber && validator) {
      const idResult = validator.safeParse(t.idNumber)
      if (!idResult.success) add(`${i}.idNumber`, idResult.error.issues[0]?.message ?? 'Invalid ID number')
    }
    if (!t.idFrontUploaded) add(`${i}.idFrontUploaded`, 'Front ID upload is required')
  })

  return errors
}

export const travellerOf = (key: string) => Number(key.split('.')[0])
