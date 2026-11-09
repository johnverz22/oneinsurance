export type LOB = {
  id: number
  name: string
  slug: string
  description: string
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type AgentLOB = {
  id: number
  agent_id: number
  lob_id: number
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  updated_at: string
  deleted_at: string | null
  line_of_business?: LOB // The API uses line_of_business, not lob
}

export type AgentLOBDetail = {
  id: number
  agent_id: number
  lob_id: number
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  updated_at: string
  deleted_at: string | null
  line_of_business: LOB
  agent?: {
    id: number
    company_id: number | null
    role: number
    username: string | null
    first_name: string
    middle_name: string | null
    last_name: string
    designation: string
    job_description: string | null
    avatar: string | null
    email: string
    email_verified_at: string | null
    status: string
    phone: string
    phone_verified_at: string | null
    phone_description: string | null
    telephone: string | null
    address: string | null
    is_super_admin: number
    birth_date: string | null
    created_at: string
    updated_at: string
  }
}

export type AgentLOBsResponse = {
  success: boolean
  message: string
  data: {
    data: AgentLOB[]
    current_page: number
    per_page: number
    total: number
    last_page: number
  }
}

export type AgentLOBDetailResponse = {
  success: boolean
  message: string
  data: AgentLOBDetail
}
