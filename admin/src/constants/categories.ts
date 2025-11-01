import { Category } from '@/types/category'
import { Activity, Bed, Plane, ShieldPlus } from 'lucide-react'

export const CATEGORIES = [
  {
    id: 'general',
    title: 'General Insurances',
    link: '/products/general',
    description: `From homes to vehicles, offices to inventory, we help you protect the things you've worked hard for.Our general insurance options offer broad protection against damage, loss, liability, and unexpected events—whether
personal or business-related- Let us connect you with top-rated insurers who understand your risks and know how to
safeguard your assets.`,
    overview:
      'Comprehensive protection for your assets, liabilities, and peace of mind against various risks, from property damage to business continuity.',
    icon: Activity,
  },
  {
    id: 'medical',
    title: 'Medical Insurance',
    link: '/products/medical',
    description: `Because staying healthy shouldn't come with financial stress.
We get it—medical bills can be overwhelming. Whether its a quick trip to the ER or a major procedure, healthcare
costs add up fast. Thats why having the right medical insurance isn't just a nice-to-have—its a must.\n
We're here to help you find a plan that fits your life, your needs, and your budget`,
    overview:
      'Ensuring your health and well-being are protected with comprehensive medical coverage options, offering peace of mind for individuals, families, and organizations.',
    icon: Bed,
  },
  {
    id: 'travel',
    title: 'Travel Insurance',
    link: '/products/travel-insurance',
    description: `Traveling for business or leisure—whether domestic or intemational—you deserve peace of mind on the go.
Our travel insurance plans cover unexpected medical emergencies, accidents, and travel inconveniences like lost
baggage or flight delays. We even work with providers that offer COVID-19 coverage, giving you added protection
during these uncertain times.`,
    overview: 'Worry-Free Trips, Anywhere You Go',
    icon: Plane,
  },
  {
    id: 'hmo',
    title: 'HMO Plans',
    link: '/products/hmo',
    description:
      "Looking for affordable HMO coverage for yourself or your company? We've got you covered! Through our trusted healthcare partners, we offer customized Health Maintenance Organization (HMO) plans designed for individuals, families, SMEs, and BPO companies. Whether you're just starting or managing a growing team, we can match you with a plan that fits your needs and budget.",
    overview:
      'Travel with peace of mind—protect your journey with comprehensive travel insurance',
    icon: ShieldPlus,
  },
] satisfies Array<Category>
