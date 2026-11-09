export type ApplicationStatus =
  | 'Approved'
  | 'Pending'
  | 'Rejected'
  | 'In Review'
export type PolicyType =
  | 'Term Life'
  | 'Whole Life'
  | 'Health Insurance'
  | 'Auto Insurance'

export interface Application {
  id: string
  name: string
  type: 'Life' | 'Health' | 'Business' | 'Travel' | 'CPTL'
  submittedDate: Date
  status: ApplicationStatus
}
