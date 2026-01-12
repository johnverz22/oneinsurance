import Image from 'next/image'
import { Header } from '@/components/layout/header'
import {
  Banknote,
  BarChart3,
  LayoutDashboard,
  Package,
  Users,
  Link2,
  LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ApplyForm } from './form'

const PLATFORM_FEATURES = [
  {
    title: 'Commission Setup',
    desc: 'Configure commission percentages for agents, overriders, and admin splits per product.',
    icon: Banknote,
    color: 'green',
  },
  {
    title: 'Commission Analytics',
    desc: 'Track commission payouts, sales performance, and revenue distribution.',
    icon: BarChart3,
    color: 'orange',
  },
  {
    title: 'Agent Dashboard',
    desc: 'Personal dashboard for agents to track sales, commissions, and performance.',
    icon: LayoutDashboard,
    color: 'indigo',
  },
  {
    title: 'Product Assignment',
    desc: 'Assign insurance products to agents and teams with access control.',
    icon: Package,
    color: 'blue',
  },
  {
    title: 'Team Management',
    desc: 'Manage agent hierarchies, team performance, and overrides.',
    icon: Users,
    color: 'purple',
  },
  {
    title: 'Referral Links',
    desc: 'Generate referral links with built-in conversion tracking.',
    icon: Link2,
    color: 'red',
  },
] satisfies Array<{
  title: string
  desc: string
  icon: LucideIcon
  color: keyof typeof FEATURE_COLORS
}>

const FEATURE_COLORS = {
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-600 dark:text-green-400',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-600 dark:text-orange-400',
  },
  indigo: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-600 dark:text-indigo-400',
  },
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400',
  },
} as const

const AgentApplicationPage = () => {
  return (
    <div className="relative mx-auto">
      <Header isNavigationVisible={false} />

      <section className="relative">
        <div className="relative h-dvh lg:h-[56rem]">
          <Image
            src="/images/agent-application.jpg"
            alt="Insurance Platform"
            className="object-cover opacity-60"
            fill
            priority
          />
          <div className="absolute inset-0 bg-black/70" />

          <div className="absolute inset-0 mx-auto flex h-full w-full max-w-7xl items-center px-4">
            <div className="grid w-full grid-cols-1 place-items-center items-center gap-8 lg:grid-cols-2">
              <div className="space-y-4 text-white">
                <h1 className="text-3xl font-extrabold md:text-4xl lg:text-5xl">
                  Insurance Commission
                  <br />
                  Management Platform
                </h1>
                <p className="max-w-xl text-sm text-white/90 md:text-base lg:text-lg">
                  Streamline product assignments, commission tracking, and team
                  management
                </p>
              </div>

              <div className="flex justify-start lg:justify-end">
                <div className="w-full max-w-md rounded-2xl bg-white p-12 shadow-xl">
                  <h3 className="bg-gradient-to-r from-green-600 to-white bg-clip-text text-lg font-black text-transparent md:text-xl lg:text-2xl">
                    Become an Agent
                  </h3>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Provide your details in the form to proceed.
                  </p>

                  <ApplyForm />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h3 className="bg-gradient-to-r from-green-600 to-yellow-400 bg-clip-text text-3xl font-black text-transparent lg:text-4xl xl:text-5xl">
            Platform Features
          </h3>
          <p className="text-muted-foreground mt-2 text-sm md:text-base lg:text-lg">
            Comprehensive tools for managing insurance sales and commissions
          </p>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PLATFORM_FEATURES.map(({ title, desc, icon: Icon, color }) => {
              const styles = FEATURE_COLORS[color]

              return (
                <div
                  key={title}
                  className="border-muted-foreground/10 flex flex-col items-start rounded-xl border bg-zinc-50 p-6 transition hover:shadow-md dark:bg-zinc-900"
                >
                  <div
                    className={cn(
                      'mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md',
                      styles.bg
                    )}
                  >
                    <Icon className={cn('h-5 w-5', styles.text)} />
                  </div>

                  <h4 className="font-semibold">{title}</h4>
                  <p className="text-muted-foreground mt-2 text-left text-sm">
                    {desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl space-y-8 px-4">
          <div className="text-center">
            <h3 className="bg-gradient-to-r from-green-600 to-yellow-400 bg-clip-text text-3xl font-black text-transparent lg:text-4xl xl:text-5xl">
              How Commission Distribution Works
            </h3>
            <p className="text-muted-foreground mt-2 text-sm md:text-base lg:text-lg">
              Understanding the commission flow from products to agents and
              overriders
            </p>
          </div>

          <div className="border-muted-foreground/10 grid gap-8 rounded-xl border bg-zinc-50 p-12 lg:grid-cols-2 dark:bg-zinc-900">
            <div className="space-y-2">
              <h4 className="mb-4 font-semibold">IFRC × Agents (30%)</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between rounded-full bg-blue-200 p-4 px-8 text-black">
                  <span>Agent / Advisor Commission</span>
                  <span className="font-medium">15%</span>
                </li>
                <li className="flex justify-between rounded-full bg-green-200 p-4 px-8 text-black">
                  <span>Agent Overriders (Downlines)</span>
                  <span>10%</span>
                </li>
                <li className="flex justify-between rounded-full bg-purple-200 p-4 px-8 text-black">
                  <span>IFRC Admin</span>
                  <span>15%</span>
                </li>
                <li className="flex justify-between rounded-full bg-orange-200 p-4 px-8 text-black">
                  <span>IFRC Overriders</span>
                  <span>10%</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="mb-4 font-semibold">IFRC × Referrals (30%)</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between rounded-full bg-blue-200 p-4 px-8 text-black">
                  <span>Referral (Direct)</span>
                  <span className="font-medium">25%</span>
                </li>
                <li className="flex justify-between rounded-full bg-green-200 p-4 px-8 text-black">
                  <span>Referral Overriders</span>
                  <span>10%</span>
                </li>
                <li className="flex justify-between rounded-full bg-purple-200 p-4 px-8 text-black">
                  <span>IFRC Admin</span>
                  <span>15%</span>
                </li>
                <li className="flex justify-between rounded-full bg-orange-200 p-4 px-8 text-black">
                  <span>IFRC Overriders</span>
                  <span>10%</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 rounded-lg border-l-4 border-red-700 bg-red-50 p-4 text-sm text-red-600">
            <strong>Important:</strong> Overrider commissions are deducted from
            their upline&apos;s share. This ensures proper commission
            distribution while maintaining the overall percentage structure.
          </div>
        </div>
      </section>
    </div>
  )
}

export default AgentApplicationPage
