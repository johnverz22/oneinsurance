export const formatPHPAmount = (amount: number) => {
  const formatted = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    currencyDisplay: 'code',
  }).format(amount)

  return formatted.replace('PHP', 'PHP ')
}

export const formatCapitalizeFirstLetter = (word: string) => {
  const firstLetter = word.slice(0, 1).toUpperCase()
  const others = word.slice(1)

  return firstLetter + others
}
