'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid,
  FileCheck2,
  Users,
  ArrowUpRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/products', label: 'Products', icon: FileCheck2 },
  { href: '/agents', label: 'Agents', icon: Users },
  { href: '/reports', label: 'Generate report', icon: ArrowUpRight },
]

/**
 * Fixed four-item bottom navigation for mobile/tablet viewports
 * (platform-shell mockup: icon-only items, active pill). Hidden on lg+.
 *
 * Must be rendered *outside* any overflow-hidden ancestor so `fixed` works correctly.
 */
export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Mobile admin portal shortcuts"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-[#dce6dd] bg-white/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-lg dark:border-[#3d4140] dark:bg-[#171919] lg:hidden"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-14 flex-col items-center justify-center gap-[3px] rounded-md text-base font-semibold transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838]',
              active
                ? 'bg-[#e8f3e9] dark:bg-[#006838] dark:text-[#d0e3c8]'
                : 'text-[var(--text-sub)]'
            )}
          >
            <Icon className="size-5 max-sm:size-[18px]" aria-hidden="true" />
            <span className="sr-only">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
