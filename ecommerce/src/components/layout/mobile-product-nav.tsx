'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Home, Shield, Search, Menu } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useSidebar } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/sidebar'
import { NAVIGATIONS } from '@/constants/navigations'

type MobileProductNavProps = {
  /** Content rendered inside the "Find" bottom sheet (e.g. a proposal search form). */
  searchContent: React.ReactNode
  /** Title shown at the top of the search sheet. */
  searchTitle?: string
  /**
   * Element id to scroll to when the "Plans" tab is tapped.
   * If omitted, the button scrolls to the top of the page.
   */
  plansTargetId?: string
}

/**
 * Mobile-only product page navigation.
 *
 * Encapsulates the shared mobile UX used across product landing pages:
 * - Hides the desktop header/footer on small screens.
 * - Mounts the right-hand AppSidebar so the menu toggle works on mobile.
 * - Renders a fixed bottom navigation bar (Home / Plans / Find / Menu) with
 *   44px touch targets, where "Find" opens a bottom sheet containing the
 *   product-specific proposal search.
 *
 * Render this inside a container that has `pb-20 md:pb-0` so page content
 * clears the fixed bar. Must be used within a SidebarProvider (provided app-wide).
 */
export function MobileProductNav({
  searchContent,
  searchTitle = 'Find Proposal',
  plansTargetId,
}: MobileProductNavProps) {
  const router = useRouter()
  const { toggleSidebar } = useSidebar()

  const scrollToPlans = () => {
    if (plansTargetId) {
      document
        .getElementById(plansTargetId)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const tabClass =
    'flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 text-slate-400 transition-transform hover:text-slate-700 active:scale-95 dark:text-slate-500 dark:hover:text-slate-300'

  return (
    <>
      {/* Global override to hide desktop header/footer on mobile */}
      <style>{`
        @media (max-width: 767px) {
          header, footer { display: none !important; }
        }
      `}</style>

      {/* Ensure AppSidebar is mounted on mobile so toggleSidebar works */}
      <div className="md:hidden">
        <AppSidebar side="right" navigations={NAVIGATIONS} />
      </div>

      {/* --- MOBILE: Fixed Bottom Navigation --- */}
      <div className="pb-safe fixed bottom-0 left-0 z-50 flex w-full justify-between border-t border-slate-200 bg-white/95 px-6 py-2 shadow-sm backdrop-blur-lg md:hidden dark:border-slate-800 dark:bg-slate-900/95">
        <button onClick={() => router.push('/')} className={tabClass}>
          <Home size={22} />
          <span className="text-[10px] font-medium">Home</span>
        </button>

        <button
          onClick={scrollToPlans}
          className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 text-primary transition-transform active:scale-95"
        >
          <Shield size={22} className="fill-primary/20" />
          <span className="text-[10px] font-bold">Plans</span>
        </button>

        {/* Proposal search inside a bottom sheet instead of inline on mobile */}
        <Sheet>
          <SheetTrigger asChild>
            <button className={tabClass}>
              <Search size={22} />
              <span className="text-[10px] font-medium">Find</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl px-4 py-6">
            <SheetHeader className="mb-4">
              <SheetTitle>{searchTitle}</SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto">{searchContent}</div>
          </SheetContent>
        </Sheet>

        <button onClick={toggleSidebar} className={tabClass}>
          <Menu size={22} />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </div>
    </>
  )
}
