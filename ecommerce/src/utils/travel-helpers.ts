export function getSortedTravelerErrors(errors: string[], currentTabIndex = 0) {
  const sortedErrors: Record<number, string[]> = {}

  const travelerIndexes = Array.from(
    new Set(
      errors
        .map((error) => {
          const match = error.match(/travelers\[(\d+)\]/)
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
      `travelers[${i}].beneficiary`,
      `travelers[${i}].beneficiary.firstName`,
      `travelers[${i}].beneficiary.middleName`,
      `travelers[${i}].beneficiary.lastName`,
      `travelers[${i}].beneficiary.dateOfBirth`,
      `travelers[${i}].beneficiary.relationship`,
    ]

    const travelerErrorKeys = errors.filter((key) =>
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

  const currentTabErrors = sortedErrors[currentTabIndex] ?? []

  return { allErrors: sortedErrors, currentTabErrors }
}
