/** A single referral link entry */
export type ReferralLink = {
  id: number
  product_name: string
  product_slug: string
  url: string
  is_active: boolean
}

/** API response for referral links */
export type ReferralLinksResponse = {
  success: true
  message: string
  data: ReferralLink[]
}
