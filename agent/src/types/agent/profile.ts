import type { ProfilePhoto } from './auth'

/** Agent profile (extended from user) */
export type AgentProfile = {
  id: number
  name: string
  email: string
  phone: string
  designation: string
  /** Agent's professional background / bio, or null when unset */
  background?: string | null
  /** True when the agent's email is confirmed and the account is active */
  is_verified?: boolean
  role: string
  status: string
  agent_code: string | null
  profile_photo: ProfilePhoto | null
  created_at: string
  updated_at: string
}

/**
 * All recognised file tags across the system.
 * - profile_photo  : agent profile picture (replaces local-disk storage)
 * - valid_id       : government-issued photo ID or passport
 * - insurance_qual_1/2/3 : qualification certificates by tier
 * - agent_license  : authority-issued agent licence or registration
 */
export type FileTag =
  | 'profile_photo'
  | 'valid_id'
  | 'insurance_qual_1'
  | 'insurance_qual_2'
  | 'insurance_qual_3'
  | 'agent_license'

/** A file stored on Google Drive via the UnoSure backend */
export type AgentFile = {
  id: number | string
  /** Storage name, e.g. "valid_id.jpeg" — not a user-facing label */
  file_name: string
  /** The user's original filename, e.g. "IMG_2041.JPG". May contain a legacy `tag__hex` name. */
  original_name?: string
  /** Typed tag — identifies the file's purpose */
  tag: FileTag | string
  mime_type?: string
  /** File size in bytes */
  size?: number
  status: 'pending' | 'approved' | 'rejected'
  /** Review status from the document review feature (prefer over `status` when present) */
  review_status?: 'pending' | 'approved' | 'rejected'
  /** Admin's rejection reason, otherwise null */
  review_note?: string | null
  /** When the review decision was made, or null */
  reviewed_at?: string | null
  /** Google Drive file ID */
  file_id?: string
  /** Google Drive view URL — do NOT use directly in ; use the /serve proxy instead */
  web_view_link: string
  /** Whether the file is publicly accessible */
  is_public?: boolean
  created_at: string
  updated_at?: string
}

/**
 * @deprecated Prefer AgentFile.
 * Kept for backward-compatibility while the documents route still exists.
 */
export type AgentDocument = {
  id: number
  name: string
  tag: string
  status: 'pending' | 'approved' | 'rejected'
  file_url: string
  created_at: string
}

/** Bank account / payout method */
export type PaymentMethod = {
  id: number
  type: 'bank' | 'ewallet'
  provider: string
  account_name: string
  /** Masked — only last 4 digits visible */
  account_number_masked: string
  branch?: string
  swift_code?: string
  email?: string
  phone?: string
  is_primary: boolean
}
