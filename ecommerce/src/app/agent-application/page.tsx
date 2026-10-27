import type { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ApplyForm } from './form'
import { Banknote, BarChart3, LayoutDashboard, Package, Users, Link2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Become an agent | One Insurance',
  description:
    'Product assignments, commission tracking and team management in one digital sales platform.',
}

const NAV_ITEMS = [
  { label: 'Platform features', href: '/agent-application#platform' },
  { label: 'How it works', href: '/agent-application#commissions' },
  { label: 'Become an agent', href: '/agent-application#application' },
]

const PLATFORM_FEATURES = [
  {
    title: 'Commission setup',
    desc: 'Organize commission percentages for agents, overriders and administration by product.',
    icon: Banknote,
  },
  {
    title: 'Commission analytics',
    desc: 'Bring sales performance, payouts and revenue distribution into one view.',
    icon: BarChart3,
  },
  {
    title: 'Agent dashboard',
    desc: 'Keep clients, policies, quotations and earnings together in a personal workspace.',
    icon: LayoutDashboard,
  },
  {
    title: 'Product assignment',
    desc: 'Connect insurance products to the agents and teams who sell them.',
    icon: Package,
  },
  {
    title: 'Team management',
    desc: 'Organize agent hierarchies, downlines and team performance.',
    icon: Users,
  },
  {
    title: 'Referral links',
    desc: 'Connect branded quotation links with referral attribution and conversion tracking.',
    icon: Link2,
  },
]

const DISTRIBUTION_STEPS = [
  'Assign the product and distribution roles',
  'Define producer and override shares',
  'Review the commission breakdown',
]

const DISTRIBUTION_GROUPS = [
  { title: 'Agents & advisors', desc: 'For direct insurance sales and agent networks.' },
  { title: 'Referral partners', desc: 'For referral and affiliate distribution.' },
]

export default function AgentApplicationPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--canvas)] text-[var(--text-main)]">
      <Header
        agentCode="ckO6uNx2O6"
        currentProductSlug="agent-application"
        productsLabel="Products"
        customNavItems={NAV_ITEMS}
        cta={{ label: 'Apply now', href: '/agent-application#application' }}
      />

      <main id="main" className="flex-1">
        <section
          className="relative min-h-[700px] overflow-hidden bg-[#006838] bg-cover bg-[position:left_center] text-white"
          style={{ backgroundImage: "url('/storage/img/oi-be-an-agent-1.png')" }}
        >
          <div className="absolute inset-0 bg-[#006838]/90" aria-hidden />
          <div className="relative mx-auto flex min-h-[700px] w-full max-w-7xl flex-col items-stretch gap-10 px-5 py-14 sm:px-8 lg:flex-row lg:items-center lg:gap-16 lg:px-12 lg:py-20">
            <div className="lg:w-[min(39vw,600px)] lg:shrink-0">
              <p className="text-sm font-semibold tracking-wide text-[#d0e3c8]">
                One Insurance Distribution Network
              </p>
              <h1 className="mt-4 text-[clamp(2.75rem,5vw,4.5rem)] font-semibold leading-[1.08] tracking-tight text-white">
                Grow with
                <br />
                One Insurance.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white sm:text-lg">
                Product assignments, commission tracking and team management in one digital sales
                platform.
              </p>
            </div>

            <div
              id="application"
              className="scroll-mt-24 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-[var(--text-main)] shadow-2xl sm:p-8 lg:max-w-xl lg:flex-1"
            >
              <h2 className="text-xl font-semibold sm:text-2xl">Become an agent</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--text-sub)]">
                Register your interest in joining our network.
              </p>
              <div className="mt-5">
                <ApplyForm />
              </div>
            </div>
          </div>
        </section>

        <section id="platform" className="scroll-mt-24 border-t border-[var(--border)] bg-[var(--header)] py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                A clearer view of your business
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-[var(--text-sub)] sm:text-base">
                Platform features for independent insurance advisors, agencies and broker networks.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {PLATFORM_FEATURES.map(({ title, desc, icon: Icon }) => (
                <article
                  key={title}
                  className="group flex flex-col items-start rounded-lg border border-transparent bg-[var(--card)] p-6 transition-[transform,background-color,border-color,box-shadow] duration-[240ms] motion-reduce:transition-none hover:scale-105 hover:border-[#006838] hover:bg-white hover:shadow-lg md:hover:scale-110 dark:hover:bg-[#171919] dark:hover:shadow-none"
                >
                  <div className="inline-flex size-11 items-center justify-center rounded-lg bg-[#e2eddb] text-[#006838] transition-colors duration-[240ms] motion-reduce:transition-none group-hover:text-[#006838] dark:bg-[#304538] dark:text-[#d0e3c8] dark:group-hover:text-white">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-[var(--text-main)] transition-colors duration-[240ms] motion-reduce:transition-none group-hover:text-[#006838] dark:group-hover:text-white">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-sub)] transition-colors duration-[240ms] motion-reduce:transition-none group-hover:text-[#333333] dark:group-hover:text-[#c4c7c5]">
                    {desc}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="commissions" className="scroll-mt-24 border-t border-[var(--border)] bg-[var(--canvas)] py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                How commission distribution works
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-[var(--text-sub)] sm:text-base">
                Connect products, direct producers and managing teams with a clear distribution
                structure.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
              {DISTRIBUTION_GROUPS.map((g) => (
                <div
                  key={g.title}
                  className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8"
                >
                  <h3 className="text-lg font-semibold">{g.title}</h3>
                  <p className="mt-1 text-sm text-[var(--text-sub)]">{g.desc}</p>
                  <ol className="mt-6 space-y-3">
                    {DISTRIBUTION_STEPS.map((step, i) => (
                      <li
                        key={step}
                        className="flex items-center gap-4 rounded-md bg-[var(--subtle)] px-4 py-3 text-sm font-medium text-[var(--text-main)]"
                      >
                        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e2eddb] text-xs font-semibold text-[#006838] dark:bg-[#304538] dark:text-[#d0e3c8]">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer agentCode="ckO6uNx2O6" />
    </div>
  )
}
