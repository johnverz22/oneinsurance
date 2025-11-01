import { CATEGORIES } from '@/constants/categories'
import { NavigationItem } from '@/types/navigation'

export const NAVIGATIONS = [
  {
    type: 'multiple',
    label: 'Products',
    items: [
      ...CATEGORIES.map((c) => ({ title: c.title, link: c.link })),
      {
        title: 'All Products',
        link: '/products',
        description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit.',
      },
    ],
  },
  {
    type: 'single',
    label: 'Pay Premium',
    link: '/payment',
  },
  {
    type: 'multiple',
    label: 'Claims',
    items: [
      {
        title: 'How to claim',
        link: '/',
        description:
          'Lorem ipsum dolor sit amet consectetur adipisicing elit. ',
      },
      {
        title: 'Make a claim',
        link: '/',
        description:
          'Lorem ipsum dolor sit amet consectetur adipisicing elit. ',
      },
    ],
  },
  {
    type: 'single',
    label: 'Favorites',
    link: '/favorites',
  },
  {
    type: 'single',
    label: 'Providers',
    link: '/provider',
  },
] satisfies NavigationItem[]

export const AGENT_NAVIGATIONS = [
  { type: 'single', label: 'Dashboard', link: '/' },
  { type: 'single', label: 'Transactions', link: '/transactions' },
  {
    type: 'multiple',
    label: 'Clients',
    items: [
      {
        title: 'Clients',
        link: '/client-management',
      },
      {
        title: 'Applications',
        link: '/applications',
      },
      {
        title: 'Quotations',
        link: '/quotations',
      },
    ],
  },
  {
    type: 'multiple',
    label: 'Finance',
    items: [
      {
        title: 'Commissions',
        link: '/commissions',
      },
      {
        title: 'Reports',
        link: '/reports',
      },
    ],
  },

  { type: 'single', label: 'Policies', link: '/product-management' },
  { type: 'single', label: 'Referral Links', link: '/referrals' },
  { type: 'single', label: 'Support', link: '/contact' },
  { type: 'single', label: 'Settings', link: '/settings' },
] satisfies NavigationItem[]

export const ADMIN_NAVIGATIONS = [
  { type: 'single', label: 'Inquiries', link: '/inquiries' },
] satisfies NavigationItem[]
