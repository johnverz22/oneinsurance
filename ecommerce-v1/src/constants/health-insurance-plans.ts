export type PlanTier = {
  name: string
  subtitle: string
  description: string
  premium: number
  maxBenefit: number
  benefits: string[]
}

export type HealthPlan = {
  id: string
  slug: string
  provider: string
  providerSlug: string
  providerLogo: string
  name: string
  description: string
  fullDescription: string
  image: string
  gallery: string[]
  issueAge: string
  waitingPeriod: string
  tagline: string
  category: 'emergency' | 'outpatient' | 'comprehensive' | 'specialized'
  tiers: PlanTier[]
}

export type HealthProvider = {
  slug: string
  name: string
  logo: string
  image: string
  description: string
}

export const HEALTH_PROVIDERS: HealthProvider[] = [
  {
    slug: 'pacific-cross',
    name: 'Pacific Cross',
    logo: '/images/providers/5 Pacific Cross.svg',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop',
    description:
      'Trusted health and travel coverage that safeguards your well-being across every journey, offering dependable protection, responsive assistance, and comprehensive care wherever you are. With solutions designed to support you through life\'s planned adventures and unexpected moments, Pacific Cross gives you the confidence to explore, live fully, and stay secure no matter where life leads you.',
  },
  {
    slug: 'oona',
    name: 'Oona',
    logo: '/images/providers/1 Oona.svg',
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop',
    description:
      'Smart, flexible insurance solutions that fit your lifestyle and evolving needs. Oona Insurance is committed to making insurance simple, accessible, and relevant for every Filipino family.',
  },
]

export const HEALTH_PLANS: HealthPlan[] = [
  {
    id: 'pc-select-er',
    slug: 'select-er',
    provider: 'Pacific Cross',
    providerSlug: 'pacific-cross',
    providerLogo: '/images/providers/5 Pacific Cross.svg',
    name: 'Select ER',
    description: 'Essential emergency care coverage when you need it most. Designed to cover urgent treatments, diagnostic tests, and emergency room visits.',
    fullDescription: 'Select ER provides critical emergency care coverage for unexpected medical situations. It covers urgent treatments, diagnostic tests, and emergency room visits so you can get the care you need without worrying about the cost.',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=400&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200&h=140&fit=crop',
      'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=200&h=140&fit=crop',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=200&h=140&fit=crop',
    ],
    issueAge: '15 Days - 65 Years Old',
    waitingPeriod: '7 Days',
    tagline: 'Emergency care when you need it most',
    category: 'emergency',
    tiers: [
      {
        name: 'Plan A',
        subtitle: 'Basic Coverage',
        description: 'Entry-level protection for simple, everyday emergency needs.',
        premium: 1299,
        maxBenefit: 10000,
        benefits: ['Emergency Room Visits', 'Basic Diagnostic Tests', 'Ambulance Coverage', 'Minor Surgery', 'Emergency Medication'],
      },
      {
        name: 'Plan B',
        subtitle: 'Enhanced Coverage',
        description: 'Stronger support with wider access to emergency care.',
        premium: 2299,
        maxBenefit: 20000,
        benefits: ['All Plan A Benefits', 'Specialist Emergency Consultations', 'Advanced Diagnostics', 'Extended Hospitalization', 'Emergency Dental Care'],
      },
      {
        name: 'Plan C',
        subtitle: 'Comprehensive Coverage',
        description: 'Highest level of emergency protection with broader medical flexibility.',
        premium: 3499,
        maxBenefit: 30000,
        benefits: ['All Plan B Benefits', 'Unlimited ER Visits', 'ICU Coverage', 'Full Surgical Coverage', 'International Emergency Assistance'],
      },
    ],
  },
  {
    id: 'pc-select-assist',
    slug: 'select-assist',
    provider: 'Pacific Cross',
    providerSlug: 'pacific-cross',
    providerLogo: '/images/providers/5 Pacific Cross.svg',
    name: 'Select Assist',
    description: 'Affordable health coverage for everyday medical needs. From doctor consultations to basic diagnostic tests and outpatient procedures.',
    fullDescription: 'Select Assist offers practical and budget-friendly health protection for everyday medical needs. From doctor consultations to essential diagnostic tests and outpatient treatments, it provides reliable access to care when you need it most. With simple, affordable benefits designed to support your routine healthcare, Select Assist helps you stay healthy, prepared, and protected—without straining your budget.',
    image: 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=600&h=400&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=200&h=140&fit=crop',
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200&h=140&fit=crop',
      'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=200&h=140&fit=crop',
    ],
    issueAge: '15 Days - 65 Years Old',
    waitingPeriod: '7 Days',
    tagline: 'Affordable outpatient care made simple and accessible',
    category: 'outpatient',
    tiers: [
      {
        name: 'Plan A',
        subtitle: 'Basic Coverage',
        description: 'Entry-level protection for simple, everyday healthcare needs.',
        premium: 1499,
        maxBenefit: 10000,
        benefits: ['Basic Doctor Consultation', 'Initial Diagnostic Tests', 'Basic Outpatient Treatment', 'Prescription Assistance', 'Clinic-Based Emergency Care'],
      },
      {
        name: 'Plan B',
        subtitle: 'Enhanced Coverage',
        description: 'Stronger support with wider access to outpatient care and diagnostics.',
        premium: 2699,
        maxBenefit: 20000,
        benefits: ['General & Specialist Consultations', 'Expanded Diagnostic Tests', 'Outpatient Treatment for Illnesses', 'Prescription Medication Coverage', 'Emergency Outpatient Care'],
      },
      {
        name: 'Plan C',
        subtitle: 'Comprehensive Coverage',
        description: 'Highest level of outpatient protection with broader medical flexibility.',
        premium: 3899,
        maxBenefit: 30000,
        benefits: ['Unlimited General Consultations', 'Advanced Diagnostics', 'Full Outpatient Treatment Support', 'Enhanced Prescription Benefits', 'Extended Emergency Outpatient Care'],
      },
    ],
  },
  {
    id: 'pc-medsecure',
    slug: 'select-medsecure',
    provider: 'Pacific Cross',
    providerSlug: 'pacific-cross',
    providerLogo: '/images/providers/5 Pacific Cross.svg',
    name: 'Select MedSecure',
    description: 'Comprehensive health coverage for long-term peace of mind. Benefits include inpatient care, surgeries, and specialist consultations.',
    fullDescription: 'Select MedSecure delivers comprehensive health coverage designed for long-term peace of mind. It covers inpatient care, surgeries, specialist consultations, and more — giving you and your family the protection you deserve.',
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&h=400&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=200&h=140&fit=crop',
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200&h=140&fit=crop',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=200&h=140&fit=crop',
    ],
    issueAge: '15 Days - 70 Years Old',
    waitingPeriod: '30 Days',
    tagline: 'Comprehensive protection for you and your family',
    category: 'comprehensive',
    tiers: [
      {
        name: 'Plan A',
        subtitle: 'Basic Coverage',
        description: 'Essential inpatient and surgical coverage.',
        premium: 2999,
        maxBenefit: 50000,
        benefits: ['Inpatient Hospitalization', 'Basic Surgery Coverage', 'Specialist Consultations', 'Diagnostic Tests', 'Prescription Drugs'],
      },
      {
        name: 'Plan B',
        subtitle: 'Enhanced Coverage',
        description: 'Broader protection including maternity and dental.',
        premium: 4999,
        maxBenefit: 100000,
        benefits: ['All Plan A Benefits', 'Maternity Coverage', 'Dental Care', 'Vision Care', 'Mental Health Support'],
      },
      {
        name: 'Plan C',
        subtitle: 'Comprehensive Coverage',
        description: 'Maximum protection with international coverage.',
        premium: 7999,
        maxBenefit: 200000,
        benefits: ['All Plan B Benefits', 'International Coverage', 'Cancer Treatment', 'Organ Transplant', 'Lifetime Renewal Guarantee'],
      },
    ],
  },
  {
    id: 'pc-dengueguard',
    slug: 'select-dengueguard',
    provider: 'Pacific Cross',
    providerSlug: 'pacific-cross',
    providerLogo: '/images/providers/5 Pacific Cross.svg',
    name: 'Select DengueGuard',
    description: 'Focused protection from dengue-related medical expenses. A smart, affordable way to stay protected during dengue season.',
    fullDescription: 'Select DengueGuard provides targeted protection against dengue-related medical expenses. Affordable and easy to get, it covers hospitalization, diagnostics, and treatment costs so you can focus on recovery.',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=400&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=140&fit=crop',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=200&h=140&fit=crop',
      'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=200&h=140&fit=crop',
    ],
    issueAge: '1 Year - 65 Years Old',
    waitingPeriod: '14 Days',
    tagline: 'Stay protected during dengue season',
    category: 'specialized',
    tiers: [
      {
        name: 'Plan A',
        subtitle: 'Basic Coverage',
        description: 'Essential dengue hospitalization coverage.',
        premium: 499,
        maxBenefit: 5000,
        benefits: ['Dengue Hospitalization', 'Diagnostic Tests', 'Medication Coverage', 'Doctor Consultations', 'Daily Hospital Allowance'],
      },
      {
        name: 'Plan B',
        subtitle: 'Enhanced Coverage',
        description: 'Extended dengue protection with ICU coverage.',
        premium: 899,
        maxBenefit: 10000,
        benefits: ['All Plan A Benefits', 'ICU Coverage', 'Blood Transfusion', 'Extended Hospitalization', 'Follow-up Consultations'],
      },
      {
        name: 'Plan C',
        subtitle: 'Comprehensive Coverage',
        description: 'Maximum dengue protection for the whole family.',
        premium: 1499,
        maxBenefit: 20000,
        benefits: ['All Plan B Benefits', 'Family Coverage Option', 'Outpatient Dengue Care', 'Platelet Transfusion', 'Post-Hospitalization Benefits'],
      },
    ],
  },
  {
    id: 'pc-covidcare',
    slug: 'select-covidcare',
    provider: 'Pacific Cross',
    providerSlug: 'pacific-cross',
    providerLogo: '/images/providers/5 Pacific Cross.svg',
    name: 'Select CovidCare',
    description: 'Specialized coverage for COVID-19 treatment and support. Offers peace of mind during health uncertainties.',
    fullDescription: 'Select CovidCare provides specialized coverage for COVID-19 treatment and support. From testing to hospitalization and recovery, it offers comprehensive protection during health uncertainties.',
    image: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=600&h=400&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=200&h=140&fit=crop',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=200&h=140&fit=crop',
      'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=200&h=140&fit=crop',
    ],
    issueAge: '15 Days - 65 Years Old',
    waitingPeriod: '14 Days',
    tagline: 'Peace of mind during health uncertainties',
    category: 'specialized',
    tiers: [
      {
        name: 'Plan A',
        subtitle: 'Basic Coverage',
        description: 'Essential COVID-19 testing and treatment coverage.',
        premium: 599,
        maxBenefit: 5000,
        benefits: ['COVID-19 Testing', 'Quarantine Allowance', 'Telemedicine Consultations', 'Basic Medication', 'Home Care Support'],
      },
      {
        name: 'Plan B',
        subtitle: 'Enhanced Coverage',
        description: 'Hospitalization and extended COVID-19 care.',
        premium: 1099,
        maxBenefit: 15000,
        benefits: ['All Plan A Benefits', 'Hospitalization Coverage', 'ICU Benefits', 'Oxygen Therapy', 'Post-COVID Rehabilitation'],
      },
      {
        name: 'Plan C',
        subtitle: 'Comprehensive Coverage',
        description: 'Full COVID-19 protection including long COVID support.',
        premium: 1899,
        maxBenefit: 30000,
        benefits: ['All Plan B Benefits', 'Long COVID Treatment', 'Mental Health Support', 'Specialist Consultations', 'Family Coverage Option'],
      },
    ],
  },
  {
    id: 'oona-basic',
    slug: 'oona-basic-care',
    provider: 'Oona',
    providerSlug: 'oona',
    providerLogo: '/images/providers/1 Oona.svg',
    name: 'Oona Basic Care',
    description: 'Smart, flexible insurance solutions that fit your lifestyle and evolving needs. Covers consultations and basic medical services.',
    fullDescription: 'Oona Basic Care is designed for individuals who want reliable, affordable health coverage without complexity. It covers doctor consultations, basic diagnostics, and essential outpatient services.',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=200&h=140&fit=crop',
      'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=200&h=140&fit=crop',
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=200&h=140&fit=crop',
    ],
    issueAge: '18 Years - 60 Years Old',
    waitingPeriod: '30 Days',
    tagline: 'Simple, affordable health coverage for everyone',
    category: 'outpatient',
    tiers: [
      {
        name: 'Plan A',
        subtitle: 'Starter',
        description: 'Basic health coverage for individuals.',
        premium: 999,
        maxBenefit: 8000,
        benefits: ['Doctor Consultations', 'Basic Lab Tests', 'Pharmacy Discounts', 'Telemedicine Access', 'Annual Check-up'],
      },
      {
        name: 'Plan B',
        subtitle: 'Standard',
        description: 'Enhanced coverage for more comprehensive care.',
        premium: 1999,
        maxBenefit: 15000,
        benefits: ['All Starter Benefits', 'Specialist Consultations', 'Advanced Lab Tests', 'Minor Procedures', 'Dental Check-up'],
      },
      {
        name: 'Plan C',
        subtitle: 'Premium',
        description: 'Full outpatient coverage with added benefits.',
        premium: 3499,
        maxBenefit: 25000,
        benefits: ['All Standard Benefits', 'Unlimited Consultations', 'Full Diagnostic Coverage', 'Vision Care', 'Wellness Programs'],
      },
    ],
  },
  {
    id: 'oona-plus',
    slug: 'oona-plus',
    provider: 'Oona',
    providerSlug: 'oona',
    providerLogo: '/images/providers/1 Oona.svg',
    name: 'Oona Plus',
    description: 'Enhanced coverage with broader network access. Ideal for families seeking reliable protection against major illnesses and hospitalization.',
    fullDescription: 'Oona Plus provides enhanced health coverage with access to a broader network of hospitals and clinics. Ideal for families, it covers major illnesses, hospitalization, and specialist care.',
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=200&h=140&fit=crop',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=200&h=140&fit=crop',
      'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=200&h=140&fit=crop',
    ],
    issueAge: '15 Days - 65 Years Old',
    waitingPeriod: '30 Days',
    tagline: 'Comprehensive family health protection',
    category: 'comprehensive',
    tiers: [
      {
        name: 'Plan A',
        subtitle: 'Family Basic',
        description: 'Essential family health coverage.',
        premium: 3999,
        maxBenefit: 75000,
        benefits: ['Family Hospitalization', 'Surgical Coverage', 'Specialist Consultations', 'Diagnostic Tests', 'Maternity Benefits'],
      },
      {
        name: 'Plan B',
        subtitle: 'Family Plus',
        description: 'Broader family protection with dental and vision.',
        premium: 6999,
        maxBenefit: 150000,
        benefits: ['All Family Basic Benefits', 'Dental Coverage', 'Vision Care', 'Mental Health', 'Preventive Care'],
      },
      {
        name: 'Plan C',
        subtitle: 'Family Premium',
        description: 'Maximum family protection with international benefits.',
        premium: 11999,
        maxBenefit: 300000,
        benefits: ['All Family Plus Benefits', 'International Coverage', 'Cancer Treatment', 'Critical Illness Benefit', 'Lifetime Renewal'],
      },
    ],
  },
  {
    id: 'oona-family',
    slug: 'oona-family-shield',
    provider: 'Oona',
    providerSlug: 'oona',
    providerLogo: '/images/providers/1 Oona.svg',
    name: 'Oona Family Shield',
    description: 'Protect your entire family under one plan. Covers all members with flexible benefits for consultations, hospitalization, and wellness.',
    fullDescription: 'Oona Family Shield is the ultimate family health plan. Cover all your family members under one convenient plan with flexible benefits including consultations, hospitalization, and wellness programs.',
    image: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=600&h=400&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=200&h=140&fit=crop',
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=200&h=140&fit=crop',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=200&h=140&fit=crop',
    ],
    issueAge: '0 - 65 Years Old',
    waitingPeriod: '30 Days',
    tagline: 'One plan for the whole family',
    category: 'comprehensive',
    tiers: [
      {
        name: 'Plan A',
        subtitle: 'Shield Basic',
        description: 'Core family protection for up to 4 members.',
        premium: 4999,
        maxBenefit: 100000,
        benefits: ['Up to 4 Family Members', 'Hospitalization', 'Outpatient Care', 'Pediatric Coverage', 'Annual Physical Exam'],
      },
      {
        name: 'Plan B',
        subtitle: 'Shield Plus',
        description: 'Extended family coverage for up to 6 members.',
        premium: 8999,
        maxBenefit: 200000,
        benefits: ['Up to 6 Family Members', 'All Shield Basic Benefits', 'Dental & Vision', 'Maternity', 'Senior Care Benefits'],
      },
      {
        name: 'Plan C',
        subtitle: 'Shield Premium',
        description: 'Maximum family protection with no member limit.',
        premium: 14999,
        maxBenefit: 500000,
        benefits: ['Unlimited Family Members', 'All Shield Plus Benefits', 'International Coverage', 'Critical Illness', 'Lifetime Guarantee'],
      },
    ],
  },
  {
    id: 'pc-wellness',
    slug: 'select-wellness',
    provider: 'Pacific Cross',
    providerSlug: 'pacific-cross',
    providerLogo: '/images/providers/5 Pacific Cross.svg',
    name: 'Select Wellness',
    description: 'Preventive care and wellness benefits to keep you healthy year-round. Includes annual check-ups, vaccinations, and health screenings.',
    fullDescription: 'Select Wellness focuses on keeping you healthy before illness strikes. With annual check-ups, vaccinations, health screenings, and wellness programs, it is the proactive approach to healthcare.',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=140&fit=crop',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=200&h=140&fit=crop',
      'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=200&h=140&fit=crop',
    ],
    issueAge: '18 Years - 60 Years Old',
    waitingPeriod: '0 Days',
    tagline: 'Prevention is better than cure',
    category: 'outpatient',
    tiers: [
      {
        name: 'Plan A',
        subtitle: 'Wellness Basic',
        description: 'Essential preventive care coverage.',
        premium: 799,
        maxBenefit: 5000,
        benefits: ['Annual Physical Exam', 'Basic Vaccinations', 'Blood Tests', 'BMI & BP Monitoring', 'Dental Cleaning'],
      },
      {
        name: 'Plan B',
        subtitle: 'Wellness Plus',
        description: 'Comprehensive wellness and preventive care.',
        premium: 1599,
        maxBenefit: 12000,
        benefits: ['All Wellness Basic Benefits', 'Cancer Screening', 'Eye Exam', 'Nutritional Counseling', 'Stress Management Programs'],
      },
      {
        name: 'Plan C',
        subtitle: 'Wellness Premium',
        description: 'Full wellness program with lifestyle benefits.',
        premium: 2799,
        maxBenefit: 20000,
        benefits: ['All Wellness Plus Benefits', 'Gym Membership Subsidy', 'Mental Wellness Sessions', 'Advanced Health Screenings', 'Personalized Health Coach'],
      },
    ],
  },
]
