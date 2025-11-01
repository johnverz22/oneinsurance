export function calculateAge(dob: Date | string | undefined): number {
  // Handle different input types and convert to Date
  let dateOfBirth: Date

  if (!dob) {
    throw new Error('Date of birth is required')
  }

  if (dob instanceof Date) {
    dateOfBirth = dob
  } else if (typeof dob === 'string') {
    dateOfBirth = new Date(dob)
  } else {
    throw new Error('Invalid date of birth format')
  }

  // Validate that we have a valid date
  if (isNaN(dateOfBirth.getTime())) {
    throw new Error('Invalid date of birth')
  }

  const today = new Date()
  let currentAge = today.getFullYear() - dateOfBirth.getFullYear()
  const m = today.getMonth() - dateOfBirth.getMonth()

  if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) {
    currentAge--
  }

  return currentAge
}
