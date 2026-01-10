import { Insurance } from '@/types/insurance'
import { AGENT_CODE } from './agent-code'

export const INSURANCES = [
  {
    id: 'travel-insurance',
    categoryId: 'general',
    companyId: 'oona-insurance',
    title: 'Travel Insurance',
    description:
      'Get comprehensive travel insurance that protects you from trip cancellations, medical emergencies, and more—wherever your journey takes you.',
    image: '/images/products/travel.jpg',
    checkoutLink: `/products/travel-insurance`,
    tag: 'Popular',
    more: {
      overview: 'Worry-Free Trips, Anywhere You Go.',
      explanation:
        'Covers unexpected medical emergencies, accidents, and travel inconveniences for domestic and international travel, including COVID-19 coverage.',

      eligibleAge: '0-80 years old (with age-specific terms)',
      notes: [
        'Consider the duration and destination of your trip when choosing a policy.',
        'Always keep your policy details and emergency contact numbers accessible during your travel.',
      ],
      faqs: [
        {
          question:
            'Does travel insurance cover pre-existing medical conditions?',
          answer:
            'Some policies may offer coverage for pre-existing medical conditions, but it often requires a specific declaration and may come with additional premiums. Always check with your provider.',
        },
        {
          question: 'What should I do if my baggage is lost?',
          answer:
            'Immediately report the lost baggage to the airline or transportation provider and then contact your travel insurance provider to initiate a claim.',
        },
      ],
    },
  },
  {
    id: 'travel-insurance',
    categoryId: 'general',
    companyId: 'oona-insurance',
    title: 'Comprehensive Third-Party Liability Insurance',
    description:
      'Provides financial protection against legal liabilities arising from injury, loss, or damage caused to third parties.',
    image: '/images/products/ctpl.png',
    checkoutLink: '/coming-soon',
    tag: 'Popular',
    more: {
      overview: 'Worry-Free Trips, Anywhere You Go.',
      explanation:
        'Covers unexpected medical emergencies, accidents, and travel inconveniences for domestic and international travel, including COVID-19 coverage.',

      eligibleAge: '0-80 years old (with age-specific terms)',
      notes: [
        'Consider the duration and destination of your trip when choosing a policy.',
        'Always keep your policy details and emergency contact numbers accessible during your travel.',
      ],
      faqs: [
        {
          question:
            'Does travel insurance cover pre-existing medical conditions?',
          answer:
            'Some policies may offer coverage for pre-existing medical conditions, but it often requires a specific declaration and may come with additional premiums. Always check with your provider.',
        },
        {
          question: 'What should I do if my baggage is lost?',
          answer:
            'Immediately report the lost baggage to the airline or transportation provider and then contact your travel insurance provider to initiate a claim.',
        },
      ],
    },
  },
  {
    id: 'travel-insurance',
    categoryId: 'general',
    companyId: 'oona-insurance',
    title: 'Marine Cargo Insurance',
    description:
      'Protects your cargo from loss or damage during transit by sea, air, or land, from origin to destination.',
    image: '/images/products/marine.png',
    checkoutLink: '/coming-soon',
    tag: 'Popular',
    more: {
      overview: 'Worry-Free Trips, Anywhere You Go.',
      explanation:
        'Covers unexpected medical emergencies, accidents, and travel inconveniences for domestic and international travel, including COVID-19 coverage.',

      eligibleAge: '0-80 years old (with age-specific terms)',
      notes: [
        'Consider the duration and destination of your trip when choosing a policy.',
        'Always keep your policy details and emergency contact numbers accessible during your travel.',
      ],
      faqs: [
        {
          question:
            'Does travel insurance cover pre-existing medical conditions?',
          answer:
            'Some policies may offer coverage for pre-existing medical conditions, but it often requires a specific declaration and may come with additional premiums. Always check with your provider.',
        },
        {
          question: 'What should I do if my baggage is lost?',
          answer:
            'Immediately report the lost baggage to the airline or transportation provider and then contact your travel insurance provider to initiate a claim.',
        },
      ],
    },
  },
  {
    id: 'travel-insurance',
    categoryId: 'general',
    companyId: 'oona-insurance',
    title: 'Engineering Insurance (Engineering Lines)',
    description:
      'Covers engineering projects, machinery, and equipment against construction risks, breakdowns, and unexpected operational losses.',
    image: '/images/products/engineer.png',
    checkoutLink: '/coming-soon',
    tag: 'Popular',
    more: {
      overview: 'Worry-Free Trips, Anywhere You Go.',
      explanation:
        'Covers unexpected medical emergencies, accidents, and travel inconveniences for domestic and international travel, including COVID-19 coverage.',

      eligibleAge: '0-80 years old (with age-specific terms)',
      notes: [
        'Consider the duration and destination of your trip when choosing a policy.',
        'Always keep your policy details and emergency contact numbers accessible during your travel.',
      ],
      faqs: [
        {
          question:
            'Does travel insurance cover pre-existing medical conditions?',
          answer:
            'Some policies may offer coverage for pre-existing medical conditions, but it often requires a specific declaration and may come with additional premiums. Always check with your provider.',
        },
        {
          question: 'What should I do if my baggage is lost?',
          answer:
            'Immediately report the lost baggage to the airline or transportation provider and then contact your travel insurance provider to initiate a claim.',
        },
      ],
    },
  },
  {
    id: 'travel-insurance',
    categoryId: 'general',
    companyId: 'oona-insurance',
    title: 'Mandatory and Specialized Insurance Coverage',
    description:
      'Delivers compliant, industry-specific insurance solutions that meet legal requirements while protecting your business from specialized risks.',
    image: '/images/products/mandatory.png',
    checkoutLink: '/coming-soon',
    tag: 'Popular',
    more: {
      overview: 'Worry-Free Trips, Anywhere You Go.',
      explanation:
        'Covers unexpected medical emergencies, accidents, and travel inconveniences for domestic and international travel, including COVID-19 coverage.',

      eligibleAge: '0-80 years old (with age-specific terms)',
      notes: [
        'Consider the duration and destination of your trip when choosing a policy.',
        'Always keep your policy details and emergency contact numbers accessible during your travel.',
      ],
      faqs: [
        {
          question:
            'Does travel insurance cover pre-existing medical conditions?',
          answer:
            'Some policies may offer coverage for pre-existing medical conditions, but it often requires a specific declaration and may come with additional premiums. Always check with your provider.',
        },
        {
          question: 'What should I do if my baggage is lost?',
          answer:
            'Immediately report the lost baggage to the airline or transportation provider and then contact your travel insurance provider to initiate a claim.',
        },
      ],
    },
  },
] satisfies Array<Insurance>
