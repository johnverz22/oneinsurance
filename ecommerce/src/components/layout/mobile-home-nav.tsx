'use client'

import { useRouter } from 'next/navigation'
import { Home, Shield, Building2, Menu } from 'lucide-react'
import { useSidebar } from '@/components/ui/sidebar'
import { useAgentCodeStore } from '@/store/agent-code-store'

/**
 * Mobile-only bottom navigation for the home page.
 *
 * Shares the visual style of {@link MobileProductNav} (fixed bottom bar,
 * 44px touch targets, backdrop blur), but is tailored to the home page:
 * - Does NOT hide the desktop header/footer — the home page is built around
 *   the app chrome, and the layout already mounts the header + sidebar here.
 * - Uses home-appropriate destinations: Home / Products / Providers / Menu.
 * - The "Menu" tab toggles the sidebar the layout already mounts on mobile.
 *
 * Render inside a container with `pb-20 md:pb-0` so content clears the bar.
 * Must be used within a SidebarProvider (provided app-wide).
 */
export function MobileHomeNav() {
  const router = useRouter()
  const { toggleSidebar } = useSidebar()
  const { agentCode } = useAgentCodeStore()

  const prefix = (path: string) => (agentCode ? `/${agentCode}${path}` : path)

  const tabClass =
    'flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 text-slate-400 transition-transform hover:text-slate-700 active:scale-95 dark:text-slate-500 dark:hover:text-slate-300'

  return (
    <div className="pb-safe fixed bottom-0 left-0 z-50 flex w-full justify-between border-t border-slate-200 bg-white/95 px-6 py-2 shadow-sm backdrop-blur-lg md:hidden dark:border-slate-800 dark:bg-slate-900/95">
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 text-primary transition-transform active:scale-95"
      >
        <Home size={22} className="fill-primary/20" />
        <span className="text-[10px] font-bold">Home</span>
      </button>

      <button onClick={() => router.push(prefix('/products'))} className={tabClass}>
        <Shield size={22} />
        <span className="text-[10px] font-medium">Products</span>
      </button>

      <button onClick={() => router.push(prefix('/provider'))} className={tabClass}>
        <Building2 size={22} />
        <span className="text-[10px] font-medium">Providers</span>
      </button>

      <button onClick={toggleSidebar} className={tabClass}>
        <Menu size={22} />
        <span className="text-[10px] font-medium">Menu</span>
      </button>
    </div>
  )
}
