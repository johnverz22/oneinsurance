import { z } from 'zod'

/** Admin user shape returned by the API */
export type AdminUser = {
  id: number
  name: string
  email: string
  role: string
  designation: string
  status: string
  profile_photo_url?: string | null
  created_at: string
  updated_at: string
}

/** Login API response shape */
export type LoginAdminResponse = {
  success: true
  message: string
  data: {
    access_token: string
    token_type: string
    user: AdminUser
  }
}

export const LoginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})
export type Login = z.infer<typeof LoginSchema>

/** Agent statistics payload used by the dashboard overview */
export type AgentStatistics = {
  total_sales: number
  number_of_sales: number
  gross_commissions: number
  net_commissions: number
  average_payout: number
  number_of_products: number
  product_sales_ranking: Array<{
    product_id: number
    product_name: string
    total_cases: number
    total_sales: number
  }>
}
