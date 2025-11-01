import { InsuranceCompany } from '@/types/insurance-company'

export const COMPANIES = [
  {
    id: 'malayan-insurance',
    carrierCode: 'MALAYAN',
    companyName: 'Malayan Insurance',
    tagLine: 'Your Future, Our Priority',
    image: '/images/providers/2 Malayan.svg',
    description: `Established in 1930, <strong>Malayan Insurance Co., Inc.</strong> is one of the leading non-life insurance
companies in the Philippines. It has consistently been ranked number one in non-life
insurance in terms of Gross Premiums Written since 1970. Malayan Insurance provides
various non-life insurance products, such as motorcar, fire, marine, and travel insurance, and
is known for its commitment to prompt claims settlement.`,
  },
  // {
  //   id: 'mercantile-insurance',
  //   companyName: 'Mercantile Insurance',
  //   tagLine: 'Protection That Matters',
  //   image: '/images/Mercantile.svg',
  //   description: `Mercantile Insurance Co., Inc. is a Philippine-based non-life insurance company that has been providing reliable and comprehensive insurance solutions since 1962. The company offers a wide range of products, including motor car insurance, fire insurance, marine cargo insurance, personal accident insurance, and other general insurance services. Known for its strong financial stability, personalized customer service, and commitment to protecting individuals and businesses, Mercantile Insurance has earned a solid reputation in the local insurance industry. With decades of experience, it continues to uphold its mission of providing security and peace of mind to its clients.`,
  // },
  {
    id: 'oona-insurance',
    carrierCode: 'OONAPH',
    companyName: 'Oona Insurance',
    tagLine: 'Peace of Mind, Guaranteed',
    image: '/images/providers/1 Oona.svg',
    description: `Oona Insurance is a general insurance company in the Philippines focused on becoming a
customer-driven provider in Southeast Asia. It offers a range of products, including motor,
property, and personal accident insurance. A key aspect of its strategy is leveraging
technology to make transactions more efficient and customer-centric, emphasizing a
digital-first approach.`,
  },
  {
    id: 'pacific-cross',
    carrierCode: 'PACIFIC',
    companyName: 'Pacific Cross',
    tagLine: 'Insurance Without Borders',
    image: '/images/providers/5 Pacific Cross.svg',
    description: `<strong>Pioneer Insurance & Surety Corporation</strong>, founded in 1954, is a well-established insurance
company in the Philippines. It holds a strong market position in various general insurance
lines, particularly in marine, hull, aviation, and casualty insurance. Pioneer is known for its
corporate governance and for its wide range of financial solutions for both individual and
corporate clients.`,
  },
  {
    id: 'standard-insurance',
    carrierCode: 'STANDARD',
    companyName: 'Standard Insurance',
    tagLine: '',
    image: '/images/providers/3 standard ins.svg',
    description: `<strong>Standard Insurance Co., Inc.</strong> is a top non-life insurance provider in the Philippines,
particularly a leader in <strong>motorcar insurance</strong>. They offer a wide array of property and general
insurance products for individuals and businesses. The company is committed to providing
world-class solutions and has an extensive network of branches across the country.`,
  },
  {
    id: 'pioneer-insurance',
    carrierCode: 'PIONEER',
    companyName: 'Pioneer Insurance',
    tagLine: '',
    image: '/images/providers/4 pioneer ins.svg',
    description: `<strong>Pioneer Insurance & Surety Corporation</strong>, founded in 1954, is a well-established insurance
company in the Philippines. It holds a strong market position in various general insurance
lines, particularly in marine, hull, aviation, and casualty insurance. Pioneer is known for its
corporate governance and for its wide range of financial solutions for both individual and
corporate clients.`,
  },
  {
    id: 'paramount-life-and-general-insurance',
    carrierCode: 'PARAMOUNT',
    companyName: 'Paramount Life & General Insurance',
    tagLine: '',
    image: '/images/providers/6 paramount ins.svg',
    description: `<strong>Paramount Life & General Insurance Corporation (PLGIC)</strong> has been operating in the
Philippines since 1950. It began as a non-life insurer and has since expanded to offer life
insurance. PLGIC is particularly recognized as a <strong>frontrunner in providing insurance for
Overseas Filipino Workers (OFWs)</strong>, offering a convenient, easy-to-use online platform for
policy applications.`,
  },
  {
    id: 'axa-philippines',
    carrierCode: 'AXAPH',
    companyName: 'AXA Philippines',
    tagLine: '',
    image: '/images/providers/7 axa phils.svg',
    description: `<strong>AXA Philippines</strong> is a joint venture between the <strong>global AXA Group</strong> and the <strong>Metrobank
Group</strong>. It's one of the largest and fastest-growing insurance companies in the country,
providing a comprehensive suite of products including life insurance, investment-linked
plans, health coverage, and general insurance. AXA is known for its strong distribution
network and for its diverse product offerings.`,
  },
  {
    id: 'philcare',
    carrierCode: 'PHILCARE',
    companyName: 'PhilCare',
    tagLine: '',
    image: '/images/providers/8 philcare.svg',
    description: `<strong>PhilhealthCare, Inc. (PhilCare)</strong> is one of the country's pioneering <strong>Health Maintenance
Organizations (HMOs)</strong>, established in 1982. It offers a wide range of health plans and is
known for its use of technology to enhance member experience, such as the PhilCare Snap
(NFC-enabled) membership cards and the AI-powered chatbot, HeyPhil, to make healthcare
more accessible.`,
  },
  {
    id: 'maxicare',
    carrierCode: 'MAXICARE',
    companyName: 'Maxicare',
    tagLine: '',
    image: '/images/providers/9 maxicare.svg',
    description: `<strong>Maxicare Healthcare Corporation</strong> is a leading HMO in the Philippines, founded in 1987. It
provides comprehensive healthcare programs for individuals, families, and businesses. With
a vast network of affiliated doctors and hospitals, Maxicare is committed to offering quality
healthcare services and innovative solutions, and is consistently ranked as a top HMO in the
country.`,
  },
] satisfies Array<InsuranceCompany>
