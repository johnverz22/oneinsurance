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

export interface ApplicationData {
  id: string
  clientName: string
  policyType: PolicyType
  submittedDate: string
  status: ApplicationStatus
  agent: string
}

export const APPLICATIONS_DATA: ApplicationData[] = [
  {
    id: 'APP-001',
    clientName: 'Carlos Reyes',
    policyType: 'Term Life',
    submittedDate: '2024-07-10',
    status: 'Approved',
    agent: 'Jane Doe',
  },
  {
    id: 'APP-002',
    clientName: 'Ana Gomez',
    policyType: 'Health Insurance',
    submittedDate: '2024-07-08',
    status: 'Pending',
    agent: 'Jane Doe',
  },
  {
    id: 'APP-003',
    clientName: 'Leo Martinez',
    policyType: 'Auto Insurance',
    submittedDate: '2024-07-05',
    status: 'Rejected',
    agent: 'John Smith',
  },
  {
    id: 'APP-004',
    clientName: 'Sofia Cruz',
    policyType: 'Whole Life',
    submittedDate: '2024-07-11',
    status: 'In Review',
    agent: 'Jane Doe',
  },
  {
    id: 'APP-005',
    clientName: 'David Lee',
    policyType: 'Health Insurance',
    submittedDate: '2024-06-28',
    status: 'Approved',
    agent: 'Jane Doe',
  },
  {
    id: 'APP-006',
    clientName: 'Isabella Chen',
    policyType: 'Term Life',
    submittedDate: '2024-07-12',
    status: 'Pending',
    agent: 'John Smith',
  },
  {
    id: 'APP-007',
    clientName: 'Michael Johnson',
    policyType: 'Auto Insurance',
    submittedDate: '2024-07-15',
    status: 'Approved',
    agent: 'Sarah Wilson',
  },
  {
    id: 'APP-008',
    clientName: 'Elena Rodriguez',
    policyType: 'Health Insurance',
    submittedDate: '2024-07-13',
    status: 'In Review',
    agent: 'Jane Doe',
  },
  {
    id: 'APP-009',
    clientName: 'James Park',
    policyType: 'Whole Life',
    submittedDate: '2024-07-09',
    status: 'Rejected',
    agent: 'John Smith',
  },
  {
    id: 'APP-010',
    clientName: 'Maria Santos',
    policyType: 'Term Life',
    submittedDate: '2024-07-14',
    status: 'Pending',
    agent: 'Sarah Wilson',
  },
  {
    id: 'APP-011',
    clientName: 'Robert Taylor',
    policyType: 'Auto Insurance',
    submittedDate: '2024-07-06',
    status: 'Approved',
    agent: 'Jane Doe',
  },
  {
    id: 'APP-012',
    clientName: 'Lisa Wang',
    policyType: 'Health Insurance',
    submittedDate: '2024-07-16',
    status: 'In Review',
    agent: 'John Smith',
  },
  {
    id: 'APP-013',
    clientName: 'Antonio Garcia',
    policyType: 'Whole Life',
    submittedDate: '2024-07-07',
    status: 'Approved',
    agent: 'Sarah Wilson',
  },
  {
    id: 'APP-014',
    clientName: 'Jennifer Kim',
    policyType: 'Term Life',
    submittedDate: '2024-07-17',
    status: 'Pending',
    agent: 'Jane Doe',
  },
  {
    id: 'APP-015',
    clientName: 'Thomas Brown',
    policyType: 'Auto Insurance',
    submittedDate: '2024-07-04',
    status: 'Rejected',
    agent: 'John Smith',
  },
  {
    id: 'APP-016',
    clientName: 'Amanda Davis',
    policyType: 'Health Insurance',
    submittedDate: '2024-07-01',
    status: 'Approved',
    agent: 'Sarah Wilson',
  },
  {
    id: 'APP-017',
    clientName: 'Pedro Morales',
    policyType: 'Whole Life',
    submittedDate: '2024-06-30',
    status: 'In Review',
    agent: 'Jane Doe',
  },
  {
    id: 'APP-018',
    clientName: 'Rachel Thompson',
    policyType: 'Term Life',
    submittedDate: '2024-07-02',
    status: 'Pending',
    agent: 'John Smith',
  },
  {
    id: 'APP-019',
    clientName: 'Kevin Zhang',
    policyType: 'Auto Insurance',
    submittedDate: '2024-07-03',
    status: 'Approved',
    agent: 'Sarah Wilson',
  },
  {
    id: 'APP-020',
    clientName: 'Stephanie Wilson',
    policyType: 'Health Insurance',
    submittedDate: '2024-06-29',
    status: 'Rejected',
    agent: 'Jane Doe',
  },
  {
    id: 'APP-021',
    clientName: 'Daniel Lopez',
    policyType: 'Whole Life',
    submittedDate: '2024-06-27',
    status: 'Approved',
    agent: 'John Smith',
  },
  {
    id: 'APP-022',
    clientName: 'Michelle Anderson',
    policyType: 'Term Life',
    submittedDate: '2024-06-26',
    status: 'In Review',
    agent: 'Sarah Wilson',
  },
  {
    id: 'APP-023',
    clientName: 'Ryan Clark',
    policyType: 'Auto Insurance',
    submittedDate: '2024-06-25',
    status: 'Pending',
    agent: 'Jane Doe',
  },
  {
    id: 'APP-024',
    clientName: 'Patricia White',
    policyType: 'Health Insurance',
    submittedDate: '2024-06-24',
    status: 'Approved',
    agent: 'John Smith',
  },
  {
    id: 'APP-025',
    clientName: 'Christopher Hall',
    policyType: 'Whole Life',
    submittedDate: '2024-06-23',
    status: 'Rejected',
    agent: 'Sarah Wilson',
  },
  {
    id: 'APP-026',
    clientName: 'Laura Martin',
    policyType: 'Term Life',
    submittedDate: '2024-06-22',
    status: 'Pending',
    agent: 'Jane Doe',
  },
]
