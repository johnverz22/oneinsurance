import Image from 'next/image'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ApplyForm } from './form'
import {
  Banknote,
  BarChart3,
  LayoutDashboard,
  Package,
  Users,
  Link2,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'

const ICON_CHIP = 'bg-[#e2eddb] text-[#006838] dark:bg-[#304538] dark:text-[#d0e3c8]'

const PLATFORM_FEATURES = [
  {
    title: 'Commission Setup',
    desc: 'Configure commission percentages for agents, overriders, and admin splits per product.',
    icon: Banknote,
  },
  {
    title: 'Commission Analytics',
    desc: 'Track commission payouts, sales performance, and revenue distribution in real time.',
    icon: BarChart3,
  },
  {
    title: 'Agent Dashboard',
    desc: 'Personal dashboard for agents to manage clients, policies, quotations, and earnings.',
    icon: LayoutDashboard,
  },
  {
    title: 'Product Assignment',
    desc: 'Assign insurance products to agents and teams with instant access control.',
    icon: Package,
  },
  {
    title: 'Team Management',
    desc: 'Manage agent hierarchies, downline structure, team performance, and overrides.',
    icon: Users,
  },
  {
    title: 'Referral Links',
    desc: 'Generate branded referral links with built-in attribution and conversion tracking.',
    icon: Link2,
  },
]

export default function AgentApplicationPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--canvas)] text-[var(--text-main)]">
      <Header agentCode="ckO6uNx2O6" currentProductName="Agent Application" />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-[#171919] text-white">
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/agent-application.jpg"
              alt="Insurance Platform Background"
              fill
              priority
              className="object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/80 to-black/70" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
              {/* Left Column: Platform Pitch */}
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold text-[#d0e3c8] backdrop-blur-sm">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>One Insurance Distribution Network</span>
                </div>

                <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                  Insurance Management Platform
                </h1>

                <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#c4c7c5] sm:text-lg">
                  Streamline product assignments, commission tracking, and team management with an all-in-one digital sales infrastructure.
                </p>

                <div className="mt-8 space-y-3.5 text-sm text-[#f1f2f0]">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#d0e3c8]" />
                    <span>Instant quotation links and digital affiliate tracking</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#d0e3c8]" />
                    <span>Automated multi-tier commission calculation and transparent splits</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#d0e3c8]" />
                    <span>Direct access to leading travel, health, and motor insurers</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Application Form Card */}
              <div className="lg:col-span-5">
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl sm:p-8">
                  <h2 className="text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
                    Become an Agent
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                    Provide your details below to register your interest and join our network.
                  </p>

                  <div className="mt-6">
                    <ApplyForm />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Features */}
        <section className="border-t border-[var(--border)] bg-[var(--header)] py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-main)] sm:text-3xl">
                Platform Features
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-[var(--text-muted)] sm:text-base">
                Comprehensive tools built for independent insurance advisors, agencies, and broker networks.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {PLATFORM_FEATURES.map(({ title, desc, icon: Icon }) => (
                <div
                  key={title}
                  className="flex flex-col items-start rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 transition hover:shadow-md"
                >
                  <div
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-lg ${ICON_CHIP}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold text-base text-[var(--text-main)]">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Commission Distribution Section */}
        <section className="border-t border-[var(--border)] bg-[var(--canvas)] py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-main)] sm:text-3xl">
                How Commission Distribution Works
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-[var(--text-muted)] sm:text-base">
                Transparent payout flows connecting products, direct producers, downlines, and managing overrides.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Agent Flow */}
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
                <h3 className="font-semibold text-lg text-[var(--text-main)]">
                  IFRC × Agents (30% Pool)
                </h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Distribution breakdown for certified insurance agent submissions.
                </p>

                <ul className="mt-6 space-y-2.5 text-sm">
                  <li className="flex items-center justify-between rounded-md bg-[#e2eddb] px-4 py-3 font-medium text-[#006838] dark:bg-[#304538] dark:text-[#d0e3c8]">
                    <span>Agent / Advisor Commission</span>
                    <span className="font-semibold">15%</span>
                  </li>
                  <li className="flex items-center justify-between rounded-md bg-[var(--subtle)] px-4 py-3 font-medium text-[var(--text-sub)]">
                    <span>Agent Overriders (Downlines)</span>
                    <span className="font-semibold">10%</span>
                  </li>
                  <li className="flex items-center justify-between rounded-md bg-[var(--subtle)] px-4 py-3 font-medium text-[var(--text-sub)]">
                    <span>IFRC Admin</span>
                    <span className="font-semibold">15%</span>
                  </li>
                  <li className="flex items-center justify-between rounded-md bg-[var(--subtle)] px-4 py-3 font-medium text-[var(--text-sub)]">
                    <span>IFRC Overriders</span>
                    <span className="font-semibold">10%</span>
                  </li>
                </ul>
              </div>

              {/* Referral Flow */}
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
                <h3 className="font-semibold text-lg text-[var(--text-main)]">
                  IFRC × Referrals (30% Pool)
                </h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Distribution breakdown for non-licensed referral and affiliate partners.
                </p>

                <ul className="mt-6 space-y-2.5 text-sm">
                  <li className="flex items-center justify-between rounded-md bg-[#e2eddb] px-4 py-3 font-medium text-[#006838] dark:bg-[#304538] dark:text-[#d0e3c8]">
                    <span>Referral (Direct Producer)</span>
                    <span className="font-semibold">25%</span>
                  </li>
                  <li className="flex items-center justify-between rounded-md bg-[var(--subtle)] px-4 py-3 font-medium text-[var(--text-sub)]">
                    <span>Referral Overriders</span>
                    <span className="font-semibold">10%</span>
                  </li>
                  <li className="flex items-center justify-between rounded-md bg-[var(--subtle)] px-4 py-3 font-medium text-[var(--text-sub)]">
                    <span>IFRC Admin</span>
                    <span className="font-semibold">15%</span>
                  </li>
                  <li className="flex items-center justify-between rounded-md bg-[var(--subtle)] px-4 py-3 font-medium text-[var(--text-sub)]">
                    <span>IFRC Overriders</span>
                    <span className="font-semibold">10%</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800 dark:border-red-800/40 dark:bg-red-900/10 dark:text-red-300">
              <strong className="font-semibold">Important:</strong> Overrider commissions are deducted from their upline&apos;s share. This guarantees precise commission distribution while strictly maintaining the overall percentage structure.
            </div>
          </div>
        </section>
      </main>

      <Footer agentCode="ckO6uNx2O6" />
    </div>
  )
}
