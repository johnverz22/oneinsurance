'use client'

import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { PageLoader } from '@/components/page-loader'
import { Button } from '@/components/ui/button'
import { FAQsSection } from '@/components/faqs-section'
import { useCtplInsuranceStateStore } from '@/store/ctpl-store'
import { CtplInsuranceProduct } from '@/types/ctpl-insurance'
import { Star, Car, Bike, Truck, Bus } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { removeStorage } from '@/utils/remove-session-storage'

const VEHICLE_TYPES: (CtplInsuranceProduct & { price: number; subtitle: string; emoji: string })[] = [
  { image: '/images/logo.png', title: 'Private Cars', code: 'PRIVATECAR', price: 599, subtitle: 'Ride hailing included', emoji: '🚗' },
  { image: '/images/logo.png', title: 'Motorcycle', code: 'MOTORCYCLE', price: 290, subtitle: 'Ride hailing included', emoji: '🏍️' },
  { image: '/images/logo.png', title: 'Taxi, PUJ and Mini Bus', code: 'TPMB', price: 1150, subtitle: 'Public utility vehicle', emoji: '🚌' },
  { image: '/images/logo.png', title: 'Tourist Car', code: 'ACTC', price: 790, subtitle: 'AC & tourist cars', emoji: '🚙' },
  { image: '/images/logo.png', title: 'Light & Medium Truck', code: 'LMT', price: 660, subtitle: 'Cargo & delivery', emoji: '🚛' },
  { image: '/images/logo.png', title: 'Heavy Truck & Private Bus', code: 'HTPB', price: 1250, subtitle: 'Heavy commercial vehicles', emoji: '🚚' },
]

const MOCK_PLANS = [
  { carrier: 'Malayan Insurance', plan: 'CTPL Basic', price: 599, benefits: ['Third-party bodily injury', 'Third-party property damage', 'Legal liability coverage', 'Unlimited coverage per accident'] },
  { carrier: 'OONA Insurance', plan: 'CTPL Standard', price: 750, benefits: ['All Basic benefits', 'Passenger personal accident', 'Unnamed driver coverage', 'Emergency roadside assistance'] },
  { carrier: 'Pacific Cross', plan: 'CTPL Plus', price: 950, benefits: ['All Standard benefits', 'Medical expense coverage', 'UPPA for driver & passengers', 'Priority claims processing'] },
  { carrier: 'Malayan Insurance', plan: 'CTPL Comprehensive', price: 1200, benefits: ['All Plus benefits', 'Own damage coverage', 'Theft protection', 'Natural disaster coverage'] },
  { carrier: 'OONA Insurance', plan: 'CTPL Shield', price: 850, benefits: ['Third-party liability', 'Unnamed driver & passenger', 'Self-ignition & theft protection', 'Budget-friendly option'] },
  { carrier: 'Pacific Cross', plan: 'CTPL Complete', price: 1100, benefits: ['Comprehensive third-party', 'Own vehicle damage', 'Vandalism & collision', 'UPPA & roadside assistance'] },
]

const CTPL_FAQS = [
  { question: 'What is CTPL Insurance?', answers: ['Compulsory Third Party Liability (CTPL) insurance is mandatory for all motor vehicle owners in the Philippines. It covers third-party bodily injury or death caused by your vehicle.'] },
  { question: 'Is CTPL required by law?', answers: ['Yes. Under Republic Act 10607, all motor vehicles registered with the LTO must have valid CTPL insurance before registration or renewal.'] },
  { question: 'What does CTPL cover?', answers: ['CTPL covers third-party bodily injury, death, and property damage caused by your vehicle. It does not cover damage to your own vehicle.'] },
  { question: 'How long is CTPL valid?', answers: ['CTPL is typically valid for one year, aligned with your vehicle registration period.'] },
  { question: 'Can I get CTPL online?', answers: ['Yes. Through One Insurance, you can get your CTPL insurance online quickly and conveniently without visiting a physical office.'] },
]

export default function CtplInsurancePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CtplInsurance />
    </Suspense>
  )
}

function CtplInsurance() {
  const router = useRouter()
  const params = useParams()
  const agentCode = params['agent-code'] as string
  const { reset } = useCtplInsuranceStateStore()
  const [showAll, setShowAll] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    reset()
    removeStorage('ctpl-insurance-storage')
  }, [])

  const handleBuyNow = (vehicle: typeof VEHICLE_TYPES[0]) => {
    const start = new Date()
    const end = new Date()
    end.setFullYear(end.getFullYear() + 1)
    useCtplInsuranceStateStore.getState().reset()
    useCtplInsuranceStateStore.getState().setSelectedVehicle({ image: vehicle.image, title: vehicle.title, code: vehicle.code })
    useCtplInsuranceStateStore.getState().setDuration({ duration: 1, effectiveDate: start, expiryDate: end })
    router.push(`/${agentCode}/products/ctpl-insurance/avail`)
  }

  const displayedVehicles = showAll ? VEHICLE_TYPES : VEHICLE_TYPES.slice(0, 2)

  const filteredPlans = MOCK_PLANS.filter(p =>
    p.plan.toLowerCase().includes(search.toLowerCase()) ||
    p.carrier.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <div className="relative h-[25rem] w-full md:h-[35rem] lg:h-[45rem]">
        <div className="relative h-full w-full">
          <Image
            src="/our-products-motorvehicle.webp"
            alt="ctpl-hero"
            className="aspect-video object-cover opacity-75"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            fill
          />
          <div className="absolute inset-0 bg-black/60 dark:bg-black/40" />
        </div>

        <div
          tabIndex={0}
          role="button"
          onClick={() => router.push('/')}
          className="absolute top-8 left-4 z-10 cursor-pointer gap-3 rounded-tl-full rounded-br-full bg-white px-12 py-1 shadow-lg lg:left-28 xl:left-32"
        >
          <Image src="/images/logo.png" alt="One Insurance" width={140} height={45} className="h-10 w-auto" priority />
        </div>

        <div className="absolute top-0 right-4 max-h-24 max-w-24 rounded-b-2xl bg-white px-3 py-2 sm:right-8 sm:max-h-32 sm:max-w-32 sm:px-4 sm:py-3 md:right-12 md:max-h-36 md:max-w-36 md:px-6 md:py-4 lg:right-20 lg:max-h-40 lg:max-w-40 lg:px-8 lg:py-4">
          <Image src="/images/IFRC.png" alt="IFRC Logo" width={1920} height={1240} className="h-full w-full object-contain" />
        </div>

        <div className="absolute inset-0 mx-auto -mt-8 flex h-full w-full max-w-7xl flex-col justify-center space-y-2.5 px-4 text-white lg:-mt-16">
          <h1 className="text-3xl font-black md:text-4xl lg:text-5xl xl:text-6xl">
            Compulsory Third Party
          </h1>
          <h2 className="text-xl font-semibold md:text-2xl lg:text-3xl xl:text-4xl">
            Liability (CTPL) Insurance
          </h2>
          <p className="max-w-4/5 text-sm md:text-base lg:max-w-2/5">
            Secure dependable CTPL insurance that handles third-party liabilities and protects you during road incidents—giving you confidence every time you drive.
          </p>
        </div>
      </div>

      {/* Vehicle Classification */}
      <div className="relative mx-auto -mt-20 flex w-full max-w-7xl flex-col px-1.5 lg:-mt-40">
        <div className="rounded-2xl bg-white p-6 shadow-2xl">
          <h2 className="mb-1 text-xl font-bold text-gray-900">Vehicle Classification</h2>
          <p className="mb-5 text-sm text-gray-500">Let our experts recommend the best plan for you</p>

          <div className="grid gap-4 sm:grid-cols-2">
            {displayedVehicles.map((v) => (
              <div key={v.code} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{v.emoji}</span>
                  <div>
                    <p className="font-bold text-gray-900">{v.title}</p>
                    <p className="text-xs text-gray-500">{v.subtitle}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="text-primary font-bold">₱ {v.price.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Includes all taxes & fees</p>
                  <Button
                    size="sm"
                    className="from-primary to-accent rounded-full bg-gradient-to-r px-5 text-white"
                    onClick={() => handleBuyNow(v)}
                  >
                    Buy Now
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {!showAll && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" className="rounded-full px-8" onClick={() => setShowAll(true)}>
                View All
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="mx-auto mt-16 w-full max-w-7xl px-4">
        <div className="mb-8 text-center">
          <h2 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-3xl font-black text-transparent md:text-4xl lg:text-5xl">
            Choose Your CTPL Plans
          </h2>
          <p className="mt-2 text-gray-500">
            Explore reliable CTPL plans from trusted providers—so you can drive with confidence, knowing you're covered.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search Plans..."
            className="h-10 w-64 rounded-full border border-gray-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Button size="sm" className="from-primary to-accent rounded-full bg-gradient-to-r text-white gap-1.5">
            <span className="text-xs">↑↓</span> Recommended
          </Button>
          <Button size="sm" variant="outline" className="rounded-full gap-1.5">
            All
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlans.map((plan, i) => (
            <div key={i} className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-16 w-32 items-center justify-center rounded-xl border border-gray-200 bg-white p-2">
                <span className="text-xs font-semibold text-gray-400 text-center leading-tight">{plan.carrier}</span>
              </div>
              <span className="mb-2 w-fit rounded-full border border-gray-200 px-3 py-0.5 text-xs text-gray-600">{plan.carrier}</span>
              <div className="mb-4 flex items-start justify-between gap-3">
                <h3 className="text-base font-black leading-snug text-gray-900 uppercase">{plan.plan}</h3>
                <span className="shrink-0 rounded-full bg-[#F5A623] px-3 py-1.5 text-sm font-bold text-white whitespace-nowrap">
                  ₱ {plan.price.toLocaleString()}
                </span>
              </div>
              <hr className="mb-3 border-gray-100" />
              <ul className="mb-4 space-y-2.5 flex-1">
                {plan.benefits.map((b, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <svg className="text-primary mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-700">{b}</span>
                  </li>
                ))}
              </ul>
              <hr className="mb-4 border-gray-100" />
              <Button
                className="from-primary to-accent w-full rounded-full bg-gradient-to-r py-2.5 text-sm font-semibold text-white"
                onClick={() => handleBuyNow(VEHICLE_TYPES[0])}
              >
                Get Started
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="mx-auto mt-16 w-full max-w-7xl px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900">What Our Customers Say</h2>
            <p className="text-sm text-gray-500">Real stories from real Filipino families we've protected</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { name: 'Juan Dela Cruz', role: 'Driver', text: 'Napakadali ng proseso! Nakuha ko ang aking CTPL sa loob ng ilang minuto. Highly recommended!' },
            { name: 'Maria Santos', role: 'Nurse', text: 'Affordable and reliable. One Insurance made getting CTPL so convenient for me.' },
            { name: 'Mark Rivera', role: 'Engineer', text: 'Great service! The online process was seamless and the coverage is comprehensive.' },
            { name: 'Carlo Fernandez', role: 'Teacher', text: 'I renewed my CTPL here and it was so much faster than going to the office. Salamat!' },
          ].map((t, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
              <div className="flex">
                {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4" stroke="0.5" fill="#FFA500" />)}
              </div>
              <p className="text-sm text-gray-600 italic">"{t.text}"</p>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://avatar.iran.liara.run/public/${i % 2 === 0 ? 'boy' : 'girl'}/${i + 1}`} />
                  <AvatarFallback>{t.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <section className="mt-16 w-full bg-[#eef2f7] py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 md:grid-cols-3 md:gap-12">
            <div className="space-y-4">
              <h2 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-3xl font-black text-transparent leading-tight">
                Got a question about CTPL Insurance in the Philippines?
              </h2>
              <p className="text-muted-foreground text-sm">
                Find answers to the most common questions about our CTPL insurance plans
              </p>
              <div className="pt-6">
                <button className="from-primary to-accent rounded-full bg-gradient-to-r px-5 py-2.5 text-sm font-medium text-white">
                  Ask an Expert
                </button>
              </div>
            </div>
            <div className="md:col-span-2">
              <FAQsSection faqs={CTPL_FAQS} title="" description="" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
