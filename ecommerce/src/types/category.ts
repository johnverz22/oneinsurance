import { type LucideIcon } from 'lucide-react'

export type Category = {
  id: 'hmo' | 'travel' | 'general' | 'medical'
  title: string
  link: string
  description: string
  checkoutLink: string
  overview: string
  icon: LucideIcon
}
