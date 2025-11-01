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
  { type: 'single', label: 'Dashboard', link: '/agent/dashboard' },
  {
    type: 'multiple',
    label: 'Clients',
    items: [
      {
        title: 'Clients',
        link: '/agent/client-management',
      },
      {
        title: 'Applications',
        link: '/agent/applications',
      },
      {
        title: 'Quotations',
        link: '/agent/quotations',
      },
    ],
  },
  {
    type: 'multiple',
    label: 'Finance',
    items: [
      {
        title: 'Commissions',
        link: '/agent/commissions',
      },
      {
        title: 'Reports',
        link: '/agent/reports',
      },
    ],
  },

  { type: 'single', label: 'Policies', link: '/agent/product-management' },
  { type: 'single', label: 'Support', link: '/agent/contact' },
  { type: 'single', label: 'Settings', link: '/agent/settings' },
] satisfies NavigationItem[]

export const ADMIN_NAVIGATIONS = [
  { type: 'single', label: 'Agents', link: '/agents' },
  { type: 'single', label: 'Transactions', link: '/transactions' },
] satisfies NavigationItem[]
