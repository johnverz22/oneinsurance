import type { ApiResponse, Paginated } from './catalog'

/** Profile photo object returned by the API (agent profile) */
export type ProfilePhoto = {
  id: number
  mime_type: string
  updated_at: string
  /** Proxy URL with cache-busting query string, e.g. /api/admin/agents/{id}/profile-photo?v=42 */
  url: string
}

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
  /** Professional background captured during agent onboarding */
  background?: string | null
  phone?: string | null
  telephone?: string | null
  address?: string | null
  agent_code?: string | null
  avatar?: string | null
  /** Structured profile photo, or null when the agent has no photo */
  profile_photo?: ProfilePhoto | null
  /**
   * Legacy flat photo URL returned by GET /admin/agents/{id} on environments
   * that have not adopted the structured `profile_photo` object yet.
   */
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
 * photo), normalised by /api/admin/agents/[id]/documents.
 */
export type AgentDocument = {
  id: number | string
  /** Storage name, e.g. "valid_id.jpeg" — not user-facing */
  file_name?: string
  /** The user's original filename. May contain a legacy `tag__hex` name. */
  original_name?: string
  tag: string
  mime_type?: string
  /** File size in bytes */
  size?: number
  status?: string
  /** Document review status: pending | approved | rejected (backend hand-off) */
  review_status?: 'pending' | 'approved' | 'rejected'
  /** Admin's rejection reason, otherwise null */
  review_note?: string | null
  /** When the review decision was made, or null */
  reviewed_at?: string | null
  /** The admin user id who decided. Admin responses only. */
  reviewed_by?: number | null
  /** Id of the file it replaced. null on a first upload. */
  previous_file_id?: number | null
  /** pending | approved | rejected. null on a first upload. */
  previous_review_status?: 'pending' | 'approved' | 'rejected' | null
  /** The reason the previous file was rejected, or null */
  previous_review_note?: string | null
  /** When the previous file was decided, or null */
  previous_reviewed_at?: string | null
  /** Google Drive link to the previous file, or null */
  previous_web_view_link?: string | null
  /** Id of the file that replaced it. null on a current file. */
  replaced_by_file_id?: number | null
  created_at?: string | null
  updated_at?: string | null
}

export type Invitation = {
  id: number
  email: string
  role?: string
  status?: string
  invitation_url?: string
  created_at?: string
}
