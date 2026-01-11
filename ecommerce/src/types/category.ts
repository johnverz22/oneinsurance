import { type LucideIcon } from 'lucide-react'

export type Category = {
  id: 'hmo' | 'travel' | 'general' | 'medical' | 'ctgl'
  title: string
  link: string
  description: string
  checkoutLink: string
  overview: string
  icon: LucideIcon
}
