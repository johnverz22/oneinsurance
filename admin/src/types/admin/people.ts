import type { ApiResponse, Paginated } from './catalog'

export type Agent = {
  id: number
  name?: string
  first_name?: string
  middle_name?: string | null
  last_name?: string
  email: string
  status: string
  role?: number | string
  designation?: string | null
  phone?: string | null
  telephone?: string | null
  address?: string | null
  agent_code?: string | null
  avatar?: string | null
  profile_photo_url?: string | null
  created_at: string
  updated_at: string
  settings?: {
    id: number
    agent_id: number
    code: string
  }
  bank_details?: Array<Record<string, unknown>>
  ewallets?: Array<Record<string, unknown>>
  files?: Array<Record<string, unknown>>
}

export type AgentsResponse = ApiResponse<Paginated<Agent>>

export type Applicant = {
  id: number
  first_name: string
  last_name: string
  email: string
  contact_number: string
  application_type: string
  status: string
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/**
 * A file an agent uploaded to Google Drive (verification document or profile
 * photo), normalised by /api/admin/agents/[id]/documents. The `tag` identifies
 * the document's purpose (e.g. valid_id, agent_license, profile_photo); it is
 * recovered from the encoded upload filename because the backend does not
 * persist tags.
 */
export type AgentDocument = {
  id: number | string
  tag: string
  mime_type?: string
  status?: string
  created_at?: string | null
}

export type Invitation = {
  id: number
  email: string
  role?: string
  status?: string
  invitation_url?: string
  created_at?: string
}
