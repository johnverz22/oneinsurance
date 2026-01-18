const STORAGE_KEY = 'payment_proposal_number'

export function saveProposalNumber(proposalNumber: string): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, proposalNumber)
  } catch (error) {
    console.error('Failed to save proposal number:', error)
  }
}

export function getProposalNumber(): string | null {
  if (typeof window === 'undefined') return null

  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to get proposal number:', error)
    return null
  }
}

export function clearProposalNumber(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear proposal number:', error)
  }
}

export function hasProposalNumber(): boolean {
  return getProposalNumber() !== null
}
