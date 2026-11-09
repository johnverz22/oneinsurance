/** Agent profile (extended from user) */
export type AgentProfile = {
  id: number
  name: string
  email: string
  phone: string
  designation: string
  role: string
  status: string
  agent_code: string | null
  profile_photo_url: string | null
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

/** A file stored on Google Drive via the One Insurance backend */
export type AgentFile = {
  id: number | string
  file_name: string
  /** Typed tag — identifies the file's purpose */
  tag: FileTag | string
  mime_type?: string
  status: 'pending' | 'approved' | 'rejected'
  /** Google Drive view URL — do NOT use directly in <img>; use the /serve proxy instead */
  web_view_link: string
  created_at: string
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
