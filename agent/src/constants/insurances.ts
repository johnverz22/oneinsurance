import { Insurance } from '@/types/insurance'

export const INSURANCES = [
  {
    id: 'comprehensive-motor-insurance',
    categoryId: 'general',
    companyId: 'malayan-insurance',
    title: 'Comprehensive Motor Insurance',
    description:
      'Get full protection for cars, motorcycles, trucks, or even fleets—covering theft, accidents, and natural disasters. This is the go-to insurance for private and commercial vehicle owners.',
    image: '/images/logo.png',
    tag: 'Featured',
    more: {
      overview: 'Full protection for various vehicles.',
      explanation:
        'Covers theft, accidents, and natural disasters for private and commercial vehicles.',
      eligibleAge: 'N/A (for vehicles)',
      notes: [
        'Mandatory for all private and commercial vehicle owners.',
        'Consider adding acts of nature coverage for comprehensive protection.',
      ],
      faqs: [
        {
          question: "What is covered under 'natural disasters'?",
          answer:
            'Natural disasters typically include coverage for damages caused by floods, typhoons, earthquakes, and other similar acts of nature.',
        },
        {
          question: 'Does this policy cover damage to my own vehicle?',
          answer:
            'Yes, Comprehensive Motor Insurance covers damages to your own vehicle, in addition to third-party liability.',
        },
      ],
    },
    plans: [
      {
        name: 'Standard Coverage',
        coverage: [
          'Cars',
          'Motorcycles',
          'Trucks',
          'Fleets',
          'Thefts',
          'Accidents',
        ],
        benefits: ['Peace of mind for vehicle owners.'],
        mbl: 'Varies by vehicle value and chosen plan',
        price: 15000,
      },
      {
        name: 'Comprehensive Plus',
        coverage: [
          'Cars',
          'Motorcycles',
          'Trucks',
          'Fleets',
          'Thefts',
          'Accidents',
          'Natural Disasters',
        ],
        benefits: [
          'Peace of mind for vehicle owners.',
          'Protection against a wide range of risks.',
        ],
        mbl: 'Varies by vehicle value and chosen plan',
        price: 25000,
      },
    ],
  },
  {
    id: 'comprehensive-general-liability',
    categoryId: 'general',
    companyId: 'malayan-insurance',
    title: 'Comprehensive General Liability (CGL)',
    description:
      'CGL protects your business from third-party claims involving bodily injury, property damage, and legal liabilities—especially important for those in retail, hospitality, and services.',
    image: '/images/logo.png',
    more: {
      overview: 'Protects businesses from third-party claims.',
      explanation:
        'Covers bodily injury, property damage, and legal liabilities, particularly for retail, hospitality, and services.',

      eligibleAge: 'N/A (for businesses)',
      notes: [
        'This policy is crucial for businesses interacting with the public or operating on client premises.',
        "Ensure your coverage limits are sufficient for your business's potential risks.",
      ],
      faqs: [
        {
          question: "What is considered 'third-party' in this policy?",
          answer:
            'Third parties are individuals or entities who are not directly involved in your business but are affected by your business operations, such as customers, visitors, or other businesses.',
        },
        {
          question: 'Does CGL cover employee injuries?',
          answer:
            "No, CGL typically covers third-party bodily injury. Employee injuries are usually covered under Workers' Compensation Insurance.",
        },
      ],
    },
    plans: [
      {
        name: 'CGL Standard',
        coverage: ['Bodily injury claims', 'Property damage claims'],
        benefits: ['Business protection from lawsuits.'],
        mbl: 'PHP 1,000,000',
        price: 12000,
      },
      {
        name: 'CGL Extended',
        coverage: [
          'Bodily injury claims',
          'Property damage claims',
          'Legal liabilities',
        ],
        benefits: [
          'Business protection from lawsuits.',
          'Financial security against unexpected claims.',
        ],
        mbl: 'PHP 5,000,000',
        price: 25000,
      },
    ],
  },
  {
    id: 'marine-cargo-insurance',
    categoryId: 'general',
    companyId: 'malayan-insurance',
    title: 'Marine Cargo Insurance',
    description:
      'Shipping goods by air, land, or sea? This policy covers you against loss or damage during transit, giving you peace of mind for every shipment.',
    image: '/images/logo.png',
    more: {
      overview: 'Covers loss or damage to goods during transit.',
      explanation:
        'Provides peace of mind for shipments transported by air, land, or sea.',

      eligibleAge: 'N/A (for cargo)',
      notes: [
        'Tailor your policy to cover specific types of cargo and transportation methods.',
        'Declare the accurate value of your goods to ensure proper coverage.',
      ],
      faqs: [
        {
          question: 'Does this policy cover international shipments?',
          answer:
            'Yes, Marine Cargo Insurance typically covers both domestic and international shipments, whether by air, land, or sea.',
        },
        {
          question: 'What happens if my goods are delayed?',
          answer:
            "While the primary coverage is for loss or damage, some policies may offer extensions for specific types of delays or related costs. It's best to check your policy's terms.",
        },
      ],
    },
    plans: [
      {
        name: 'Domestic Cargo',
        coverage: [
          'Loss during transit (land)',
          'Damage during transit (land)',
        ],
        benefits: ['Protection for your goods during shipment.'],
        mbl: 'Varies by declared cargo value',
        price: 1500,
      },
      {
        name: 'International Cargo',
        coverage: [
          'Loss during transit (air, land, sea)',
          'Damage during transit (air, land, sea)',
        ],
        benefits: [
          'Protection for your goods during shipment.',
          'Reduced financial risk for businesses involved in shipping.',
        ],
        mbl: 'Varies by declared cargo value',
        price: 5000,
      },
    ],
  },
  {
    id: 'engineering-insurance',
    categoryId: 'general',
    companyId: 'pacific-cross',
    title: 'Engineering Insurance (Engineering Lines)',
    description:
      'Shield your construction and industrial projects from risks such as equipment damage or project delays.',
    image: '/images/logo.png',
    more: {
      overview:
        'Protects construction and industrial projects from various risks.',
      explanation:
        'Covers risks like equipment damage or project delays for engineering projects.',
      eligibleAge: 'N/A (for projects/equipment)',
      notes: [
        'Crucial for mitigating risks in complex construction and industrial undertakings.',
        'Different engineering insurance policies cater to specific project phases and equipment types.',
      ],
      faqs: [
        {
          question: "What is Contractor's All Risk (CAR) insurance?",
          answer:
            'CAR insurance provides comprehensive coverage for civil engineering projects, including unforeseen and sudden damages during construction.',
        },
        {
          question: 'Does this cover mechanical breakdown of machinery?',
          answer:
            'Yes, policies like Boiler & Pressure Vessel Insurance or specific endorsements within CAR/EAR can cover mechanical breakdown of machinery and equipment.',
        },
      ],
    },
    plans: [
      {
        name: "Contractor's All Risk",
        coverage: ["Contractor's All Risk (CAR)"],
        benefits: ['Minimizes financial losses from project risks.'],
        mbl: 'Varies by project value and equipment value',
        price: 20000,
      },
      {
        name: 'Comprehensive Engineering',
        coverage: [
          "Contractor's All Risk (CAR)",
          'Erection All Risk (EAR)',
          'Boiler & Pressure Vessel Insurance',
          'And more...',
        ],
        benefits: [
          'Minimizes financial losses from project risks.',
          'Ensures smooth execution of construction and industrial projects.',
        ],
        mbl: 'Varies by project value and equipment value',
        price: 35000,
      },
    ],
  },
  {
    id: 'mandatory-specialized-insurance-coverage',
    categoryId: 'general',
    companyId: 'malayan-insurance',
    title: 'Mandatory & Specialized Insurance Coverage',
    description:
      'Required by the LTO for all vehicle registrations and renewals, CTPL covers death or bodily injury caused to third parties in the event of a road accident.',
    image: '/images/logo.png',
    more: {
      overview: 'Compulsory Third-Party Liability (CTPL).',
      explanation:
        'Required by the LTO for vehicle registrations, covering death or bodily injury to third parties in road accidents.',
      eligibleAge: 'N/A (for vehicles)',
      notes: [
        'This is a fundamental requirement for all vehicle owners in the Philippines.',
        'CTPL only covers third-party damages, not damages to your own vehicle.',
      ],
      faqs: [
        {
          question: 'Is CTPL enough for vehicle insurance?',
          answer:
            'CTPL is only the minimum mandatory coverage. For comprehensive protection for your own vehicle, you would need additional motor insurance.',
        },
        {
          question: 'How often do I need to renew my CTPL?',
          answer:
            'CTPL needs to be renewed annually in conjunction with your vehicle registration.',
        },
      ],
    },
    plans: [
      {
        name: 'CTPL Standard',
        coverage: [
          'Death of third parties in road accidents',
          'Bodily injury to third parties in road accidents',
        ],
        benefits: ['Compliance with LTO requirements.'],
        mbl: 'Mandatory minimum as per LTO regulations (e.g., PHP 100,000)',
        price: 1200,
      },
    ],
  },
  {
    id: 'product',
    categoryId: 'medical',
    companyId: 'malayan-insurance',
    title: 'Medical Insurance',
    description:
      "Because staying healthy shouldn't come with financial stress. We get it—medical bills can be overwhelming. Whether it's a quick trip to the ER or a major procedure, healthcare costs add up fast. That's why having the right medical insurance isn't just a nice-to-have—it's a must. We're here to help you find a plan that fits your life, your needs, and your budget.",
    image: '/images/logo.png',
    more: {
      overview:
        'We offer a variety of medical insurance plans for different lifestyles.',
      explanation:
        "No two people—or families—are the same. That's why we offer a variety of medical insurance plans for different lifestyles.",
      eligibleAge: '0-65 years old (renewable up to 70)',
      notes: [
        'We work with top medical insurance partners to make sure you get real value, not just another premium to pay.',
        "Whether you're looking for basic protection or full coverage with international access, we'll help you find what works best for you.",
        'Regularly review your policy to ensure it still meets your evolving healthcare needs.',
      ],
      faqs: [
        {
          question:
            'What is the difference between HMO and traditional medical insurance?',
          answer:
            'HMOs typically provide coverage through a network of contracted healthcare providers, often requiring you to choose a primary care physician. Traditional medical insurance offers more flexibility in choosing providers but may have higher out-of-pocket costs.',
        },
        {
          question: 'Are pre-existing conditions covered?',
          answer:
            "Coverage for pre-existing conditions varies by policy and insurer. Some policies may have waiting periods or exclusions for certain conditions. It's crucial to disclose all pre-existing conditions when applying.",
        },
        {
          question: 'Can I use my medical insurance abroad?',
          answer:
            'Some medical insurance plans offer local and international coverage. Check your specific policy details to see if you are covered when traveling abroad.',
        },
      ],
    },
    plans: [
      {
        name: 'Personal Medical Plan',
        coverage: [
          'Personal & Family Plans: Coverage that gives you peace of mind, knowing your loved ones are protected.',
        ],
        benefits: ['Peace of mind for your loved ones.'],
        mbl: 'Up to PHP 500,000 per illness/injury',
        price: 8000,
      },
      {
        name: 'Comprehensive Medical Plan',
        coverage: [
          'Personal & Family Plans: Coverage that gives you peace of mind, knowing your loved ones are protected.',
          'Local & International Coverage: Whether you’re at home or traveling abroad, we’ve got your back.',
          'Flexible & Affordable Options: Choose from plans that work with your budget—no hidden fees, no complicated terms.',
        ],
        benefits: [
          'Peace of mind for your loved ones.',
          'Coverage at home or while traveling.',
          'Affordable plans with no hidden fees.',
          'Customized plans for individuals, families, SMEs, and BPO companies.',
        ],
        mbl: 'Up to PHP 1,000,000 per illness/injury',
        price: 15000,
      },
    ],
  },
  {
    id: 'engineering-insurance',
    categoryId: 'general',
    companyId: 'oona-insurance',
    title: 'Engineering Insurance (Engineering Lines)',
    description:
      'Shield your construction and industrial projects from risks such as equipment damage or project delays.',
    image: '/images/logo.png',
    more: {
      overview:
        'Protects construction and industrial projects from various risks.',
      explanation:
        'Covers risks like equipment damage or project delays for engineering projects.',
      eligibleAge: 'N/A (for projects/equipment)',
      notes: [
        'Crucial for mitigating risks in complex construction and industrial undertakings.',
        'Different engineering insurance policies cater to specific project phases and equipment types.',
      ],
      faqs: [
        {
          question: "What is Contractor's All Risk (CAR) insurance?",
          answer:
            'CAR insurance provides comprehensive coverage for civil engineering projects, including unforeseen and sudden damages during construction.',
        },
        {
          question: 'Does this cover mechanical breakdown of machinery?',
          answer:
            'Yes, policies like Boiler & Pressure Vessel Insurance or specific endorsements within CAR/EAR can cover mechanical breakdown of machinery and equipment.',
        },
      ],
    },
    plans: [
      {
        name: "Contractor's All Risk",
        coverage: ["Contractor's All Risk (CAR)"],
        benefits: ['Minimizes financial losses from project risks.'],
        mbl: 'Varies by project value and equipment value',
        price: 20000,
      },
      {
        name: 'Comprehensive Engineering',
        coverage: [
          "Contractor's All Risk (CAR)",
          'Erection All Risk (EAR)',
          'Boiler & Pressure Vessel Insurance',
          'And more...',
        ],
        benefits: [
          'Minimizes financial losses from project risks.',
          'Ensures smooth execution of construction and industrial projects.',
        ],
        mbl: 'Varies by project value and equipment value',
        price: 35000,
      },
    ],
  },
  {
    id: 'comprehensive-motor-insurance',
    categoryId: 'general',
    companyId: 'mercantile-insurance',
    title: 'Comprehensive Motor Insurance',
    description:
      'Get full protection for cars, motorcycles, trucks, or even fleets—covering theft, accidents, and natural disasters. This is the go-to insurance for private and commercial vehicle owners.',
    image: '/images/logo.png',
    tag: 'Featured',
    more: {
      overview: 'Full protection for various vehicles.',
      explanation:
        'Covers theft, accidents, and natural disasters for private and commercial vehicles.',
      eligibleAge: 'N/A (for vehicles)',
      notes: [
        'Mandatory for all private and commercial vehicle owners.',
        'Consider adding acts of nature coverage for comprehensive protection.',
      ],
      faqs: [
        {
          question: "What is covered under 'natural disasters'?",
          answer:
            'Natural disasters typically include coverage for damages caused by floods, typhoons, earthquakes, and other similar acts of nature.',
        },
        {
          question: 'Does this policy cover damage to my own vehicle?',
          answer:
            'Yes, Comprehensive Motor Insurance covers damages to your own vehicle, in addition to third-party liability.',
        },
      ],
    },
    plans: [
      {
        name: 'Standard Coverage',
        coverage: [
          'Cars',
          'Motorcycles',
          'Trucks',
          'Fleets',
          'Thefts',
          'Accidents',
        ],
        benefits: ['Peace of mind for vehicle owners.'],
        mbl: 'Varies by vehicle value and chosen plan',
        price: 15000,
      },
      {
        name: 'Comprehensive Plus',
        coverage: [
          'Cars',
          'Motorcycles',
          'Trucks',
          'Fleets',
          'Thefts',
          'Accidents',
          'Natural Disasters',
        ],
        benefits: [
          'Peace of mind for vehicle owners.',
          'Protection against a wide range of risks.',
        ],
        mbl: 'Varies by vehicle value and chosen plan',
        price: 25000,
      },
    ],
  },
  {
    id: 'public-liability-insurance',
    companyId: 'mercantile-insurance',
    categoryId: 'general',
    title: 'Public Liability Insurance',
    description:
      'Need a business permit? Most LGUs require this policy to protect the public from accidents or damages caused within your business premises.',
    image: '/images/logo.png',
    more: {
      overview:
        'Protects the public from accidents or damages within business premises.',
      explanation:
        'Required by most LGUs for business permits, covering accidents or damages caused to the public within your business premises.',

      eligibleAge: 'N/A (for businesses)',
      notes: [
        'This policy is vital for businesses that have public access to their premises.',
        'Review your policy to ensure it adequately covers all potential risks associated with your business operations.',
      ],
      faqs: [
        {
          question:
            'Is Public Liability Insurance the same as Professional Indemnity Insurance?',
          answer:
            'No, Public Liability Insurance covers physical injury or property damage to third parties on your premises, while Professional Indemnity Insurance covers claims arising from professional negligence or errors in advice/services.',
        },
        {
          question:
            'What if an accident happens off my business premises but is related to my business operations?',
          answer:
            "Some Public Liability policies may extend to cover incidents occurring off-site if they are directly related to your business activities. It's essential to discuss your specific operational needs with your insurer.",
        },
      ],
    },
    plans: [
      {
        name: 'Basic Public Liability',
        coverage: [
          'Accidents within business premises causing harm to the public',
        ],
        benefits: [
          'Ensures compliance with LGU requirements for business permits.',
        ],
        mbl: 'PHP 500,000',
        price: 5000,
      },
      {
        name: 'Extended Public Liability',
        coverage: [
          'Accidents within business premises causing harm to the public',
          'Damages within business premises causing harm to the public',
        ],
        benefits: [
          'Ensures compliance with LGU requirements for business permits.',
          'Protects your business from claims arising from public accidents on your premises.',
        ],
        mbl: 'PHP 2,000,000',
        price: 10000,
      },
    ],
  },
  {
    id: 'product',
    categoryId: 'medical',
    companyId: 'mercantile-insurance',
    title: 'Medical Insurance',
    description:
      "Because staying healthy shouldn't come with financial stress. We get it—medical bills can be overwhelming. Whether it's a quick trip to the ER or a major procedure, healthcare costs add up fast. That's why having the right medical insurance isn't just a nice-to-have—it's a must. We're here to help you find a plan that fits your life, your needs, and your budget.",
    image: '/images/logo.png',
    more: {
      overview:
        'We offer a variety of medical insurance plans for different lifestyles.',
      explanation:
        "No two people—or families—are the same. That's why we offer a variety of medical insurance plans for different lifestyles.",
      eligibleAge: '0-65 years old (renewable up to 70)',
      notes: [
        'We work with top medical insurance partners to make sure you get real value, not just another premium to pay.',
        "Whether you're looking for basic protection or full coverage with international access, we'll help you find what works best for you.",
        'Regularly review your policy to ensure it still meets your evolving healthcare needs.',
      ],
      faqs: [
        {
          question:
            'What is the difference between HMO and traditional medical insurance?',
          answer:
            'HMOs typically provide coverage through a network of contracted healthcare providers, often requiring you to choose a primary care physician. Traditional medical insurance offers more flexibility in choosing providers but may have higher out-of-pocket costs.',
        },
        {
          question: 'Are pre-existing conditions covered?',
          answer:
            "Coverage for pre-existing conditions varies by policy and insurer. Some policies may have waiting periods or exclusions for certain conditions. It's crucial to disclose all pre-existing conditions when applying.",
        },
        {
          question: 'Can I use my medical insurance abroad?',
          answer:
            'Some medical insurance plans offer local and international coverage. Check your specific policy details to see if you are covered when traveling abroad.',
        },
      ],
    },
    plans: [
      {
        name: 'Personal Medical Plan',
        coverage: [
          'Personal & Family Plans: Coverage that gives you peace of mind, knowing your loved ones are protected.',
        ],
        benefits: ['Peace of mind for your loved ones.'],
        mbl: 'Up to PHP 500,000 per illness/injury',
        price: 8000,
      },
      {
        name: 'Comprehensive Medical Plan',
        coverage: [
          'Personal & Family Plans: Coverage that gives you peace of mind, knowing your loved ones are protected.',
          'Local & International Coverage: Whether you’re at home or traveling abroad, we’ve got your back.',
          'Flexible & Affordable Options: Choose from plans that work with your budget—no hidden fees, no complicated terms.',
        ],
        benefits: [
          'Peace of mind for your loved ones.',
          'Coverage at home or while traveling.',
          'Affordable plans with no hidden fees.',
          'Customized plans for individuals, families, SMEs, and BPO companies.',
        ],
        mbl: 'Up to PHP 1,000,000 per illness/injury',
        price: 15000,
      },
    ],
  },
  {
    id: 'ofw-insurance',
    companyId: 'mercantile-insurance',
    categoryId: 'general',
    title: 'OFW Insurance',
    description:
      'Tailored for our modern-day heroes. This policy provides financial protection for Overseas Filipino Workers, including accidental death, medical benefits, educational support, and more.',
    image: '/images/logo.png',
    tag: 'Popular',
    more: {
      overview: 'Financial protection for Overseas Filipino Workers.',
      explanation:
        'Provides various benefits including accidental death, medical benefits, and educational support.',

      eligibleAge: '18-60 years old',
      notes: [
        'This policy is designed to address the specific needs and risks faced by Overseas Filipino Workers.',
        'Ensure your beneficiaries are updated for seamless claims processing.',
      ],
      faqs: [
        {
          question: 'What kind of educational support is provided?',
          answer:
            "Educational support can include benefits for the education of the OFW's dependents, such as tuition assistance or scholarships, depending on the policy.",
        },
        {
          question: 'Is this insurance mandatory for OFWs?',
          answer:
            'While not always mandatory by all employers, it is highly recommended for all OFWs to have this type of protection.',
        },
      ],
    },
    plans: [
      {
        name: 'OFW Basic',
        coverage: ['Accidental death', 'Medical benefits'],
        benefits: ['Support for OFWs and their families.'],
        mbl: 'PHP 200,000',
        price: 3000,
      },
      {
        name: 'OFW Comprehensive',
        coverage: [
          'Accidental death',
          'Medical benefits',
          'Educational support',
        ],
        benefits: [
          'Support for OFWs and their families.',
          'Financial security for those working abroad.',
        ],
        mbl: 'PHP 500,000',
        price: 6000,
      },
    ],
  },
  {
    id: 'marine-cargo-insurance',
    categoryId: 'general',
    companyId: 'oona-insurance',
    title: 'Marine Cargo Insurance',
    description:
      'Shipping goods by air, land, or sea? This policy covers you against loss or damage during transit, giving you peace of mind for every shipment.',
    image: '/images/logo.png',
    more: {
      overview: 'Covers loss or damage to goods during transit.',
      explanation:
        'Provides peace of mind for shipments transported by air, land, or sea.',

      eligibleAge: 'N/A (for cargo)',
      notes: [
        'Tailor your policy to cover specific types of cargo and transportation methods.',
        'Declare the accurate value of your goods to ensure proper coverage.',
      ],
      faqs: [
        {
          question: 'Does this policy cover international shipments?',
          answer:
            'Yes, Marine Cargo Insurance typically covers both domestic and international shipments, whether by air, land, or sea.',
        },
        {
          question: 'What happens if my goods are delayed?',
          answer:
            "While the primary coverage is for loss or damage, some policies may offer extensions for specific types of delays or related costs. It's best to check your policy's terms.",
        },
      ],
    },
    plans: [
      {
        name: 'Domestic Cargo',
        coverage: [
          'Loss during transit (land)',
          'Damage during transit (land)',
        ],
        benefits: ['Protection for your goods during shipment.'],
        mbl: 'Varies by declared cargo value',
        price: 1500,
      },
      {
        name: 'International Cargo',
        coverage: [
          'Loss during transit (air, land, sea)',
          'Damage during transit (air, land, sea)',
        ],
        benefits: [
          'Protection for your goods during shipment.',
          'Reduced financial risk for businesses involved in shipping.',
        ],
        mbl: 'Varies by declared cargo value',
        price: 5000,
      },
    ],
  },
  {
    id: 'comprehensive-general-liability',
    categoryId: 'general',
    companyId: 'oona-insurance',
    title: 'Comprehensive General Liability (CGL)',
    description:
      'CGL protects your business from third-party claims involving bodily injury, property damage, and legal liabilities—especially important for those in retail, hospitality, and services.',
    image: '/images/logo.png',
    more: {
      overview: 'Protects businesses from third-party claims.',
      explanation:
        'Covers bodily injury, property damage, and legal liabilities, particularly for retail, hospitality, and services.',

      eligibleAge: 'N/A (for businesses)',
      notes: [
        'This policy is crucial for businesses interacting with the public or operating on client premises.',
        "Ensure your coverage limits are sufficient for your business's potential risks.",
      ],
      faqs: [
        {
          question: "What is considered 'third-party' in this policy?",
          answer:
            'Third parties are individuals or entities who are not directly involved in your business but are affected by your business operations, such as customers, visitors, or other businesses.',
        },
        {
          question: 'Does CGL cover employee injuries?',
          answer:
            "No, CGL typically covers third-party bodily injury. Employee injuries are usually covered under Workers' Compensation Insurance.",
        },
      ],
    },
    plans: [
      {
        name: 'CGL Standard',
        coverage: ['Bodily injury claims', 'Property damage claims'],
        benefits: ['Business protection from lawsuits.'],
        mbl: 'PHP 1,000,000',
        price: 12000,
      },
      {
        name: 'CGL Extended',
        coverage: [
          'Bodily injury claims',
          'Property damage claims',
          'Legal liabilities',
        ],
        benefits: [
          'Business protection from lawsuits.',
          'Financial security against unexpected claims.',
        ],
        mbl: 'PHP 5,000,000',
        price: 25000,
      },
    ],
  },
  {
    id: 'personal-accident-insurance',
    companyId: 'oona-insurance',
    categoryId: 'general',
    title: 'Personal Accident Insurance',
    description:
      'A policy that covers you in case of accidental injuries or death. Get medical reimbursements, compensation for disability, and support for the unexpected.',
    image: '/images/logo.png',
    tag: 'Popular',
    more: {
      overview: 'Covers accidental injuries or death.',
      explanation:
        'Provides medical reimbursements, disability compensation, and support for unexpected events.',

      eligibleAge: '18-65 years old',
      notes: [
        'This policy provides a lump sum payment for specific accidental events.',
        'Consider adding this as a supplement to your health insurance for added protection.',
      ],
      faqs: [
        {
          question: 'Is illness covered by Personal Accident Insurance?',
          answer:
            'No, Personal Accident Insurance specifically covers injuries or death resulting from accidents, not illnesses.',
        },
        {
          question: 'How soon can I claim benefits after an accident?',
          answer:
            'Claim procedures vary, but generally, you should notify your insurer as soon as possible after the accident.',
        },
      ],
    },
    plans: [
      {
        name: 'Basic PA Plan',
        coverage: ['Accidental injuries', 'Accidental death'],
        benefits: ['Financial support during accidental injuries.'],
        mbl: 'PHP 100,000',
        price: 2000,
      },
      {
        name: 'Enhanced PA Plan',
        coverage: [
          'Accidental injuries',
          'Accidental death',
          'Medical reimbursements',
          'Disability compensation',
        ],
        benefits: [
          'Financial support during accidental injuries.',
          'Peace of mind for you and your family.',
        ],
        mbl: 'PHP 500,000',
        price: 5000,
      },
    ],
  },
  {
    id: 'comprehensive-motor-insurance',
    categoryId: 'general',
    companyId: 'oona-insurance',
    title: 'Comprehensive Motor Insurance',
    description:
      'Get full protection for cars, motorcycles, trucks, or even fleets—covering theft, accidents, and natural disasters. This is the go-to insurance for private and commercial vehicle owners.',
    image: '/images/logo.png',
    tag: 'Featured',
    more: {
      overview: 'Full protection for various vehicles.',
      explanation:
        'Covers theft, accidents, and natural disasters for private and commercial vehicles.',
      eligibleAge: 'N/A (for vehicles)',
      notes: [
        'Mandatory for all private and commercial vehicle owners.',
        'Consider adding acts of nature coverage for comprehensive protection.',
      ],
      faqs: [
        {
          question: "What is covered under 'natural disasters'?",
          answer:
            'Natural disasters typically include coverage for damages caused by floods, typhoons, earthquakes, and other similar acts of nature.',
        },
        {
          question: 'Does this policy cover damage to my own vehicle?',
          answer:
            'Yes, Comprehensive Motor Insurance covers damages to your own vehicle, in addition to third-party liability.',
        },
      ],
    },
    plans: [
      {
        name: 'Standard Coverage',
        coverage: [
          'Cars',
          'Motorcycles',
          'Trucks',
          'Fleets',
          'Thefts',
          'Accidents',
        ],
        benefits: ['Peace of mind for vehicle owners.'],
        mbl: 'Varies by vehicle value and chosen plan',
        price: 15000,
      },
      {
        name: 'Comprehensive Plus',
        coverage: [
          'Cars',
          'Motorcycles',
          'Trucks',
          'Fleets',
          'Thefts',
          'Accidents',
          'Natural Disasters',
        ],
        benefits: [
          'Peace of mind for vehicle owners.',
          'Protection against a wide range of risks.',
        ],
        mbl: 'Varies by vehicle value and chosen plan',
        price: 25000,
      },
    ],
  },
  {
    id: 'ofw-insurance',
    companyId: 'mercantile-insurance',
    categoryId: 'general',
    title: 'OFW Insurance',
    description:
      'Tailored for our modern-day heroes. This policy provides financial protection for Overseas Filipino Workers, including accidental death, medical benefits, educational support, and more.',
    image: '/images/logo.png',
    tag: 'Popular',
    more: {
      overview: 'Financial protection for Overseas Filipino Workers.',
      explanation:
        'Provides various benefits including accidental death, medical benefits, and educational support.',

      eligibleAge: '18-60 years old',
      notes: [
        'This policy is designed to address the specific needs and risks faced by Overseas Filipino Workers.',
        'Ensure your beneficiaries are updated for seamless claims processing.',
      ],
      faqs: [
        {
          question: 'What kind of educational support is provided?',
          answer:
            "Educational support can include benefits for the education of the OFW's dependents, such as tuition assistance or scholarships, depending on the policy.",
        },
        {
          question: 'Is this insurance mandatory for OFWs?',
          answer:
            'While not always mandatory by all employers, it is highly recommended for all OFWs to have this type of protection.',
        },
      ],
    },
    plans: [
      {
        name: 'OFW Basic',
        coverage: ['Accidental death', 'Medical benefits'],
        benefits: ['Support for OFWs and their families.'],
        mbl: 'PHP 200,000',
        price: 3000,
      },
      {
        name: 'OFW Comprehensive',
        coverage: [
          'Accidental death',
          'Medical benefits',
          'Educational support',
        ],
        benefits: [
          'Support for OFWs and their families.',
          'Financial security for those working abroad.',
        ],
        mbl: 'PHP 500,000',
        price: 6000,
      },
    ],
  },
  {
    id: 'public-liability-insurance',
    companyId: 'mercantile-insurance',
    categoryId: 'general',
    title: 'Public Liability Insurance',
    description:
      'Need a business permit? Most LGUs require this policy to protect the public from accidents or damages caused within your business premises.',
    image: '/images/logo.png',
    more: {
      overview:
        'Protects the public from accidents or damages within business premises.',
      explanation:
        'Required by most LGUs for business permits, covering accidents or damages caused to the public within your business premises.',

      eligibleAge: 'N/A (for businesses)',
      notes: [
        'This policy is vital for businesses that have public access to their premises.',
        'Review your policy to ensure it adequately covers all potential risks associated with your business operations.',
      ],
      faqs: [
        {
          question:
            'Is Public Liability Insurance the same as Professional Indemnity Insurance?',
          answer:
            'No, Public Liability Insurance covers physical injury or property damage to third parties on your premises, while Professional Indemnity Insurance covers claims arising from professional negligence or errors in advice/services.',
        },
        {
          question:
            'What if an accident happens off my business premises but is related to my business operations?',
          answer:
            "Some Public Liability policies may extend to cover incidents occurring off-site if they are directly related to your business activities. It's essential to discuss your specific operational needs with your insurer.",
        },
      ],
    },
    plans: [
      {
        name: 'Basic Public Liability',
        coverage: [
          'Accidents within business premises causing harm to the public',
        ],
        benefits: [
          'Ensures compliance with LGU requirements for business permits.',
        ],
        mbl: 'PHP 500,000',
        price: 5000,
      },
      {
        name: 'Extended Public Liability',
        coverage: [
          'Accidents within business premises causing harm to the public',
          'Damages within business premises causing harm to the public',
        ],
        benefits: [
          'Ensures compliance with LGU requirements for business permits.',
          'Protects your business from claims arising from public accidents on your premises.',
        ],
        mbl: 'PHP 2,000,000',
        price: 10000,
      },
    ],
  },
  {
    id: 'bonds-insurance',
    companyId: 'oona-insurance',
    categoryId: 'general',
    title: 'Bonds Insurance',
    description:
      'Guarantee your contracts and commitments. Bond insurance ensures that obligations are fulfilled—ideal for construction projects, suppliers, or financial commitments.',
    image: '/images/logo.png',
    more: {
      overview: 'Guarantees contracts and commitments.',
      explanation:
        'Ensures that obligations are fulfilled, suitable for construction projects, suppliers, or financial commitments.',
      eligibleAge: 'N/A (for bonds)',
      notes: [
        'Essential for businesses involved in large-scale projects requiring financial guarantees.',
        'Different types of bonds exist, such as performance bonds or bid bonds, depending on the specific need.',
      ],
      faqs: [
        {
          question: 'What is the difference between a bond and insurance?',
          answer:
            'A bond guarantees that a principal will fulfill an obligation to an obligee, while insurance protects an insured party from specific financial losses.',
        },
        {
          question: 'Who benefits from bond insurance?',
          answer:
            'Both the party requiring the commitment (the obligee) and the party providing the commitment (the principal) benefit from the guarantee provided by bond insurance.',
        },
      ],
    },
    plans: [
      {
        name: 'Performance Bond',
        coverage: ['Construction projects', 'Suppliers'],
        benefits: ['Ensures contractual obligations are met.'],
        mbl: 'Varies by bond amount',
        price: 8000,
      },
      {
        name: 'Financial Guarantee Bond',
        coverage: ['Financial commitments'],
        benefits: [
          'Ensures contractual obligations are met.',
          'Builds trust and reliability in business dealings.',
        ],
        mbl: 'Varies by bond amount',
        price: 10000,
      },
    ],
  },
  {
    id: 'marine-cargo-insurance',
    categoryId: 'general',
    companyId: 'mercantile-insurance',
    title: 'Marine Cargo Insurance',
    description:
      'Shipping goods by air, land, or sea? This policy covers you against loss or damage during transit, giving you peace of mind for every shipment.',
    image: '/images/logo.png',
    more: {
      overview: 'Covers loss or damage to goods during transit.',
      explanation:
        'Provides peace of mind for shipments transported by air, land, or sea.',

      eligibleAge: 'N/A (for cargo)',
      notes: [
        'Tailor your policy to cover specific types of cargo and transportation methods.',
        'Declare the accurate value of your goods to ensure proper coverage.',
      ],
      faqs: [
        {
          question: 'Does this policy cover international shipments?',
          answer:
            'Yes, Marine Cargo Insurance typically covers both domestic and international shipments, whether by air, land, or sea.',
        },
        {
          question: 'What happens if my goods are delayed?',
          answer:
            "While the primary coverage is for loss or damage, some policies may offer extensions for specific types of delays or related costs. It's best to check your policy's terms.",
        },
      ],
    },
    plans: [
      {
        name: 'Domestic Cargo',
        coverage: [
          'Loss during transit (land)',
          'Damage during transit (land)',
        ],
        benefits: ['Protection for your goods during shipment.'],
        mbl: 'Varies by declared cargo value',
        price: 1500,
      },
      {
        name: 'International Cargo',
        coverage: [
          'Loss during transit (air, land, sea)',
          'Damage during transit (air, land, sea)',
        ],
        benefits: [
          'Protection for your goods during shipment.',
          'Reduced financial risk for businesses involved in shipping.',
        ],
        mbl: 'Varies by declared cargo value',
        price: 5000,
      },
    ],
  },
  {
    id: 'engineering-insurance',
    categoryId: 'general',
    companyId: 'mercantile-insurance',
    title: 'Engineering Insurance (Engineering Lines)',
    description:
      'Shield your construction and industrial projects from risks such as equipment damage or project delays.',
    image: '/images/logo.png',
    more: {
      overview:
        'Protects construction and industrial projects from various risks.',
      explanation:
        'Covers risks like equipment damage or project delays for engineering projects.',
      eligibleAge: 'N/A (for projects/equipment)',
      notes: [
        'Crucial for mitigating risks in complex construction and industrial undertakings.',
        'Different engineering insurance policies cater to specific project phases and equipment types.',
      ],
      faqs: [
        {
          question: "What is Contractor's All Risk (CAR) insurance?",
          answer:
            'CAR insurance provides comprehensive coverage for civil engineering projects, including unforeseen and sudden damages during construction.',
        },
        {
          question: 'Does this cover mechanical breakdown of machinery?',
          answer:
            'Yes, policies like Boiler & Pressure Vessel Insurance or specific endorsements within CAR/EAR can cover mechanical breakdown of machinery and equipment.',
        },
      ],
    },
    plans: [
      {
        name: "Contractor's All Risk",
        coverage: ["Contractor's All Risk (CAR)"],
        benefits: ['Minimizes financial losses from project risks.'],
        mbl: 'Varies by project value and equipment value',
        price: 20000,
      },
      {
        name: 'Comprehensive Engineering',
        coverage: [
          "Contractor's All Risk (CAR)",
          'Erection All Risk (EAR)',
          'Boiler & Pressure Vessel Insurance',
          'And more...',
        ],
        benefits: [
          'Minimizes financial losses from project risks.',
          'Ensures smooth execution of construction and industrial projects.',
        ],
        mbl: 'Varies by project value and equipment value',
        price: 35000,
      },
    ],
  },
  {
    id: 'public-liability-insurance',
    companyId: 'mercantile-insurance',
    categoryId: 'general',
    title: 'Public Liability Insurance',
    description:
      'Need a business permit? Most LGUs require this policy to protect the public from accidents or damages caused within your business premises.',
    image: '/images/logo.png',
    more: {
      overview:
        'Protects the public from accidents or damages within business premises.',
      explanation:
        'Required by most LGUs for business permits, covering accidents or damages caused to the public within your business premises.',

      eligibleAge: 'N/A (for businesses)',
      notes: [
        'This policy is vital for businesses that have public access to their premises.',
        'Review your policy to ensure it adequately covers all potential risks associated with your business operations.',
      ],
      faqs: [
        {
          question:
            'Is Public Liability Insurance the same as Professional Indemnity Insurance?',
          answer:
            'No, Public Liability Insurance covers physical injury or property damage to third parties on your premises, while Professional Indemnity Insurance covers claims arising from professional negligence or errors in advice/services.',
        },
        {
          question:
            'What if an accident happens off my business premises but is related to my business operations?',
          answer:
            "Some Public Liability policies may extend to cover incidents occurring off-site if they are directly related to your business activities. It's essential to discuss your specific operational needs with your insurer.",
        },
      ],
    },
    plans: [
      {
        name: 'Basic Public Liability',
        coverage: [
          'Accidents within business premises causing harm to the public',
        ],
        benefits: [
          'Ensures compliance with LGU requirements for business permits.',
        ],
        mbl: 'PHP 500,000',
        price: 5000,
      },
      {
        name: 'Extended Public Liability',
        coverage: [
          'Accidents within business premises causing harm to the public',
          'Damages within business premises causing harm to the public',
        ],
        benefits: [
          'Ensures compliance with LGU requirements for business permits.',
          'Protects your business from claims arising from public accidents on your premises.',
        ],
        mbl: 'PHP 2,000,000',
        price: 10000,
      },
    ],
  },
  {
    id: 'ofw-insurance',
    companyId: 'mercantile-insurance',
    categoryId: 'general',
    title: 'OFW Insurance',
    description:
      'Tailored for our modern-day heroes. This policy provides financial protection for Overseas Filipino Workers, including accidental death, medical benefits, educational support, and more.',
    image: '/images/logo.png',
    tag: 'Popular',
    more: {
      overview: 'Financial protection for Overseas Filipino Workers.',
      explanation:
        'Provides various benefits including accidental death, medical benefits, and educational support.',

      eligibleAge: '18-60 years old',
      notes: [
        'This policy is designed to address the specific needs and risks faced by Overseas Filipino Workers.',
        'Ensure your beneficiaries are updated for seamless claims processing.',
      ],
      faqs: [
        {
          question: 'What kind of educational support is provided?',
          answer:
            "Educational support can include benefits for the education of the OFW's dependents, such as tuition assistance or scholarships, depending on the policy.",
        },
        {
          question: 'Is this insurance mandatory for OFWs?',
          answer:
            'While not always mandatory by all employers, it is highly recommended for all OFWs to have this type of protection.',
        },
      ],
    },
    plans: [
      {
        name: 'OFW Basic',
        coverage: ['Accidental death', 'Medical benefits'],
        benefits: ['Support for OFWs and their families.'],
        mbl: 'PHP 200,000',
        price: 3000,
      },
      {
        name: 'OFW Comprehensive',
        coverage: [
          'Accidental death',
          'Medical benefits',
          'Educational support',
        ],
        benefits: [
          'Support for OFWs and their families.',
          'Financial security for those working abroad.',
        ],
        mbl: 'PHP 500,000',
        price: 6000,
      },
    ],
  },
  {
    id: 'personal-accident-insurance',
    companyId: 'oona-insurance',
    categoryId: 'general',
    title: 'Personal Accident Insurance',
    description:
      'A policy that covers you in case of accidental injuries or death. Get medical reimbursements, compensation for disability, and support for the unexpected.',
    image: '/images/logo.png',
    tag: 'Popular',
    more: {
      overview: 'Covers accidental injuries or death.',
      explanation:
        'Provides medical reimbursements, disability compensation, and support for unexpected events.',

      eligibleAge: '18-65 years old',
      notes: [
        'This policy provides a lump sum payment for specific accidental events.',
        'Consider adding this as a supplement to your health insurance for added protection.',
      ],
      faqs: [
        {
          question: 'Is illness covered by Personal Accident Insurance?',
          answer:
            'No, Personal Accident Insurance specifically covers injuries or death resulting from accidents, not illnesses.',
        },
        {
          question: 'How soon can I claim benefits after an accident?',
          answer:
            'Claim procedures vary, but generally, you should notify your insurer as soon as possible after the accident.',
        },
      ],
    },
    plans: [
      {
        name: 'Basic PA Plan',
        coverage: ['Accidental injuries', 'Accidental death'],
        benefits: ['Financial support during accidental injuries.'],
        mbl: 'PHP 100,000',
        price: 2000,
      },
      {
        name: 'Enhanced PA Plan',
        coverage: [
          'Accidental injuries',
          'Accidental death',
          'Medical reimbursements',
          'Disability compensation',
        ],
        benefits: [
          'Financial support during accidental injuries.',
          'Peace of mind for you and your family.',
        ],
        mbl: 'PHP 500,000',
        price: 5000,
      },
    ],
  },
  {
    id: 'mandatory-specialized-insurance-coverage',
    categoryId: 'general',
    companyId: 'mercantile-insurance',
    title: 'Mandatory & Specialized Insurance Coverage',
    description:
      'Required by the LTO for all vehicle registrations and renewals, CTPL covers death or bodily injury caused to third parties in the event of a road accident.',
    image: '/images/logo.png',
    more: {
      overview: 'Compulsory Third-Party Liability (CTPL).',
      explanation:
        'Required by the LTO for vehicle registrations, covering death or bodily injury to third parties in road accidents.',
      eligibleAge: 'N/A (for vehicles)',
      notes: [
        'This is a fundamental requirement for all vehicle owners in the Philippines.',
        'CTPL only covers third-party damages, not damages to your own vehicle.',
      ],
      faqs: [
        {
          question: 'Is CTPL enough for vehicle insurance?',
          answer:
            'CTPL is only the minimum mandatory coverage. For comprehensive protection for your own vehicle, you would need additional motor insurance.',
        },
        {
          question: 'How often do I need to renew my CTPL?',
          answer:
            'CTPL needs to be renewed annually in conjunction with your vehicle registration.',
        },
      ],
    },
    plans: [
      {
        name: 'CTPL Standard',
        coverage: [
          'Death of third parties in road accidents',
          'Bodily injury to third parties in road accidents',
        ],
        benefits: ['Compliance with LTO requirements.'],
        mbl: 'Mandatory minimum as per LTO regulations (e.g., PHP 100,000)',
        price: 1200,
      },
    ],
  },
  {
    id: 'fire-allied-perils-insurance',
    categoryId: 'general',
    companyId: 'pacific-cross',
    title: 'Fire and Allied Perils Insurance',
    description:
      'Protect your property from fire, lightning, earthquake, flood, explosion, and more. Extended coverage includes burglary, machine breakdown, business interruption, and other specialized risks.',
    image: '/images/logo.png',
    more: {
      overview: 'Protect your property from a wide range of perils.',
      explanation:
        'Covers fire, lightning, earthquake, flood, explosion, and more, with extended coverage for specialized risks.',
      eligibleAge: 'N/A (for property)',
      notes: [
        "Customize your policy with specific allied perils based on your property's location and risk factors.",
        'Business interruption coverage helps replace lost income if your business is forced to close due to a covered event.',
      ],
      faqs: [
        {
          question: 'Is theft included in this policy?',
          answer:
            'Yes, extended coverage can include burglary, protecting your property against theft.',
        },
        {
          question: 'What is business interruption coverage?',
          answer:
            "Business interruption coverage helps compensate your business for lost income and extra expenses if you're forced to temporarily close due to a covered peril.",
        },
      ],
    },
    plans: [
      {
        name: 'Basic Perils',
        coverage: ['Fire', 'Lightning', 'Earthquake', 'Flood', 'Explosion'],
        benefits: ['Comprehensive property protection.'],
        mbl: 'Varies by property value and chosen plan',
        price: 10000,
      },
      {
        name: 'Extended Perils',
        coverage: [
          'Fire',
          'Lightning',
          'Earthquake',
          'Flood',
          'Explosion',
          'Burglary (extended coverage)',
          'Machine Breakdown (extended coverage)',
          'Business Interruption (extended coverage)',
          'Other specialized risks',
        ],
        benefits: [
          'Comprehensive property protection.',
          'Reduced financial loss from unexpected events.',
        ],
        mbl: 'Varies by property value and chosen plan',
        price: 20000,
      },
    ],
  },
  {
    id: 'fire-allied-perils-insurance',
    categoryId: 'general',
    companyId: 'pacific-cross',
    title: 'Fire and Allied Perils Insurance',
    description:
      'Protect your property from fire, lightning, earthquake, flood, explosion, and more. Extended coverage includes burglary, machine breakdown, business interruption, and other specialized risks.',
    image: '/images/logo.png',
    more: {
      overview: 'Protect your property from a wide range of perils.',
      explanation:
        'Covers fire, lightning, earthquake, flood, explosion, and more, with extended coverage for specialized risks.',
      eligibleAge: 'N/A (for property)',
      notes: [
        "Customize your policy with specific allied perils based on your property's location and risk factors.",
        'Business interruption coverage helps replace lost income if your business is forced to close due to a covered event.',
      ],
      faqs: [
        {
          question: 'Is theft included in this policy?',
          answer:
            'Yes, extended coverage can include burglary, protecting your property against theft.',
        },
        {
          question: 'What is business interruption coverage?',
          answer:
            "Business interruption coverage helps compensate your business for lost income and extra expenses if you're forced to temporarily close due to a covered peril.",
        },
      ],
    },
    plans: [
      {
        name: 'Basic Perils',
        coverage: ['Fire', 'Lightning', 'Earthquake', 'Flood', 'Explosion'],
        benefits: ['Comprehensive property protection.'],
        mbl: 'Varies by property value and chosen plan',
        price: 10000,
      },
      {
        name: 'Extended Perils',
        coverage: [
          'Fire',
          'Lightning',
          'Earthquake',
          'Flood',
          'Explosion',
          'Burglary (extended coverage)',
          'Machine Breakdown (extended coverage)',
          'Business Interruption (extended coverage)',
          'Other specialized risks',
        ],
        benefits: [
          'Comprehensive property protection.',
          'Reduced financial loss from unexpected events.',
        ],
        mbl: 'Varies by property value and chosen plan',
        price: 20000,
      },
    ],
  },
  {
    id: 'hmo-plans',
    categoryId: 'medical',
    companyId: 'pacific-cross',
    title: 'HMO Plans',
    description:
      'Looking for affordable HMO coverage for yourself or your company? We’ve got you covered! Through our trusted healthcare partners, we offer customized Health Maintenance Organization (HMO) plans designed for individuals, families, SMEs, and BPO companies. Whether you’re just starting or managing a growing team, we can match you with a plan that fits your needs and budget.',
    image: '/images/logo.png',
    tag: 'Featured',
    more: {
      overview: "HMO Plans – Health Protection That Doesn't Break the Bank.",
      explanation:
        'We offer customized Health Maintenance Organization (HMO) plans designed for individuals, families, SMEs, and BPO companies.',

      eligibleAge: '0-60 years old (renewable up to 65)',
      notes: [
        'HMO plans often emphasize preventive care and may have lower out-of-pocket costs for in-network services.',
        'Ensure the HMO network includes your preferred doctors and hospitals.',
      ],
      faqs: [
        {
          question:
            'Do I need a referral to see a specialist with an HMO plan?',
          answer:
            "In most HMO plans, you typically need a referral from your primary care physician to see a specialist, unless it's an emergency.",
        },
        {
          question: 'Are annual physicals covered by HMO plans?',
          answer:
            'Yes, most HMO plans cover annual physical examinations as part of their preventive care benefits.',
        },
        {
          question: "Can I get an HMO plan if I'm self-employed?",
          answer:
            'Yes, many providers offer HMO plans for individuals, including self-employed individuals, designed to fit their specific needs and budget.',
        },
      ],
    },
    plans: [
      {
        name: 'Individual HMO',
        coverage: ['Coverage for individuals.'],
        benefits: ['Affordable healthcare coverage.'],
        mbl: 'PHP 50,000 per year',
        price: 7000,
      },
      {
        name: 'Family HMO',
        coverage: ['Coverage for families.'],
        benefits: ['Customized plans to fit specific needs and budget.'],
        mbl: 'PHP 250,000 per year',
        price: 18000,
      },
      {
        name: 'Corporate HMO',
        coverage: [
          'Coverage for SMEs (Small and Medium-sized Enterprises).',
          'Coverage for BPO (Business Process Outsourcing) companies.',
        ],
        benefits: ['Access to trusted healthcare partners.'],
        mbl: 'PHP 500,000 per year',
        price: 40000,
      },
    ],
  },
  {
    id: 'travel-insurance',
    categoryId: 'general',
    companyId: 'oona-insurance',
    title: 'Travel Insurance',
    description:
      'Traveling for business or leisure—whether domestic or international—you deserve peace of mind on the go. Our travel insurance plans cover unexpected medical emergencies, accidents, and travel inconveniences like lost baggage or flight delays. We even work with providers that offer COVID-19 coverage, giving you added protection during these uncertain times.',
    image: '/images/logo.png',
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
    plans: [
      {
        name: 'Domestic Travel Plan',
        coverage: [
          'Unexpected medical emergencies',
          'Accidents',
          'Lost baggage',
        ],
        benefits: ['Peace of mind while traveling.'],
        mbl: 'USD 50,000',
        price: 1500,
      },
      {
        name: 'International Travel Plan',
        coverage: [
          'Unexpected medical emergencies',
          'Accidents',
          'Lost baggage',
          'Flight delays',
          'COVID-19 coverage',
        ],
        benefits: [
          'Peace of mind while traveling.',
          'Financial protection against travel mishaps.',
          'Added protection during uncertain times with COVID-19 coverage.',
        ],
        mbl: 'USD 500,000',
        price: 5000,
      },
    ],
  },
  {
    id: 'general-insurance',
    categoryId: 'general',
    companyId: 'mercantile-insurance',
    title: 'General Insurance',
    description:
      'From homes to vehicles, offices to inventory, we help you protect the things you’ve worked hard for. Our general insurance options offer broad protection against damage, loss, liability, and unexpected events—whether personal or business-related. Let us connect you with top-rated insurers who understand your risks and know how to safeguard your assets.',
    image: '/images/logo.png',
    more: {
      overview: 'Total Protection for What Matters.',
      explanation:
        'Offers broad protection for personal and business assets against damage, loss, liability, and unexpected events.',

      eligibleAge: 'N/A (broad category)',
      notes: [
        'General insurance is a broad category; customize your coverage based on your specific assets and risks.',
        'Regularly review your policies to ensure they align with your current needs and asset values.',
      ],
      faqs: [
        {
          question:
            'What is the difference between general insurance and life insurance?',
          answer:
            "General insurance covers non-life assets and liabilities (e.g., property, vehicles), while life insurance provides financial protection to beneficiaries upon the insured's death.",
        },
        {
          question: 'Can I combine different types of general insurance?',
          answer:
            'Yes, many insurers offer bundled packages or allow you to combine different general insurance policies for comprehensive coverage and potential discounts.',
        },
      ],
    },
    plans: [
      {
        name: 'Personal Asset Protection',
        coverage: ['Homes', 'Vehicles', 'Damage', 'Loss'],
        benefits: ['Protection for valuable assets.'],
        mbl: 'Varies widely by asset value and policy type',
        price: 8000,
      },
      {
        name: 'Business Asset & Liability',
        coverage: [
          'Offices',
          'Inventory',
          'Damage',
          'Loss',
          'Liability',
          'Unexpected events (business-related)',
        ],
        benefits: [
          'Protection for valuable assets.',
          'Connects you with top-rated insurers.',
          'Safeguards against various risks.',
        ],
        mbl: 'Varies widely by asset value and policy type',
        price: 20000,
      },
    ],
  },
  {
    id: 'comprehensive-motor-insurance',
    categoryId: 'general',
    companyId: 'pacific-cross',
    title: 'Comprehensive Motor Insurance',
    description:
      'Get full protection for cars, motorcycles, trucks, or even fleets—covering theft, accidents, and natural disasters. This is the go-to insurance for private and commercial vehicle owners.',
    image: '/images/logo.png',
    tag: 'Featured',
    more: {
      overview: 'Full protection for various vehicles.',
      explanation:
        'Covers theft, accidents, and natural disasters for private and commercial vehicles.',
      eligibleAge: 'N/A (for vehicles)',
      notes: [
        'Mandatory for all private and commercial vehicle owners.',
        'Consider adding acts of nature coverage for comprehensive protection.',
      ],
      faqs: [
        {
          question: "What is covered under 'natural disasters'?",
          answer:
            'Natural disasters typically include coverage for damages caused by floods, typhoons, earthquakes, and other similar acts of nature.',
        },
        {
          question: 'Does this policy cover damage to my own vehicle?',
          answer:
            'Yes, Comprehensive Motor Insurance covers damages to your own vehicle, in addition to third-party liability.',
        },
      ],
    },
    plans: [
      {
        name: 'Standard Coverage',
        coverage: [
          'Cars',
          'Motorcycles',
          'Trucks',
          'Fleets',
          'Thefts',
          'Accidents',
        ],
        benefits: ['Peace of mind for vehicle owners.'],
        mbl: 'Varies by vehicle value and chosen plan',
        price: 15000,
      },
      {
        name: 'Comprehensive Plus',
        coverage: [
          'Cars',
          'Motorcycles',
          'Trucks',
          'Fleets',
          'Thefts',
          'Accidents',
          'Natural Disasters',
        ],
        benefits: [
          'Peace of mind for vehicle owners.',
          'Protection against a wide range of risks.',
        ],
        mbl: 'Varies by vehicle value and chosen plan',
        price: 25000,
      },
    ],
  },
] satisfies Array<Insurance>
