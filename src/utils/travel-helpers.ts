type ErrorMap = Record<string, any>

export function getSortedTravelerErrors(errors: ErrorMap) {
  const sortedErrors: Record<number, string[]> = {}

  // Determine how many travelers exist from error keys
  const travelerIndexes = Array.from(
    new Set(
      Object.keys(errors)
        .map((key) => {
          const match = key.match(/travelers\[(\d+)\]/)
          return match ? parseInt(match[1], 10) : null
        })
        .filter((i): i is number => i !== null)
    )
  )

  // Sort errors for each traveler
  for (const i of travelerIndexes) {
    const fieldPriorityOrder = [
      `travelers[${i}].firstName`,
      `travelers[${i}].lastName`,
      `travelers[${i}].dateOfBirth`,
      `travelers[${i}].email`,
      `travelers[${i}].mobileNumber`,
      `travelers[${i}].idType`,
      `travelers[${i}].idNumber`,
      `travelers[${i}].address.province`,
      `travelers[${i}].address.city`,
      `travelers[${i}].address.zipCode`,
      `travelers[${i}].address.line1`,
      `travelers[${i}].beneficiary.name`,
      `travelers[${i}].beneficiary.dateOfBirth`,
      `travelers[${i}].beneficiary.relationship`,
    ]

    const travelerErrorKeys = Object.keys(errors).filter((key) =>
      key.startsWith(`travelers[${i}]`)
    )

    sortedErrors[i] = travelerErrorKeys.sort((a, b) => {
      const indexA = fieldPriorityOrder.indexOf(a)
      const indexB = fieldPriorityOrder.indexOf(b)
      if (indexA === -1 && indexB === -1) return 0
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA - indexB
    })
  }

  return sortedErrors
}
