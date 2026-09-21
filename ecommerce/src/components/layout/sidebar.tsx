'use client'

import Link from 'next/link'
import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  Building2,
  Percent,
  FileBarChart,
  Shield,
  HelpCircle,
  Settings,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Brand } from '@/components/layout/brand'
import { isSingedin } from '@/utils/is-sigin'
import { NavigationItem } from '@/types/navigation'
import { useIsMobile } from '@/hooks/use-mobile'
import { usePathname } from 'next/navigation'
import { useAgentCodeStore } from '@/store/agent-code-store'

// Icon mapping for navigation items
const iconMap: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  clients: Users,
  applications: FileText,
  quotations: MessageSquare,
  finance: Building2,
  commissions: Percent,
  reports: FileBarChart,
  policies: Shield,
  support: HelpCircle,
  settings: Settings,
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  navigations: NavigationItem[]
  isBrandVisible?: boolean
}

export const AppSidebar = ({
  navigations,
  isBrandVisible = true,
  ...props
}: AppSidebarProps) => {
  const isSignIn = isSingedin()
  const isMobile = useIsMobile()

  const pathname = usePathname()
  const { agentCode } = useAgentCodeStore()
  const { setOpenMobile } = useSidebar()

  // Ensure the mobile menu is never left open after a route change.
  React.useEffect(() => {
    setOpenMobile(false)
  }, [pathname, setOpenMobile])

  const closeMobile = () => setOpenMobile(false)

  const prefixLink = (link: string) => agentCode ? `/${agentCode}${link}` : link

  const getIcon = (label: string) => {
    const key = label.toLowerCase()
    const Icon = iconMap[key]
    return Icon ? <Icon className="h-5 w-5 shrink-0" /> : null
  }

  return (
    <Sidebar
      collapsible="offcanvas"
      {...props}
      className={cn('!bg-background border-r', props.className)}
    >
      <div className={cn('px-4', { 'py-8': isBrandVisible })}>
        {isBrandVisible && <Brand />}

        <SidebarTrigger
          size="lg"
          variant="outline"
          className={cn(
            '!bg-background absolute top-4 -right-5 h-10 w-10 rounded-full p-2',
            {
              hidden: isMobile,
            }
          )}
        />

        <SidebarContent className="py-8">
          {navigations.map((navigation, index) => {
            const isList = navigation.type === 'multiple'

            return (
              <SidebarMenu key={index} className="px-0">
                {isList ? (
                  <Collapsible
                    defaultOpen
                    className="group/collapsible text-foreground"
                  >
                    <div className="flex items-center gap-2 px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      <span>{navigation.label}</span>
                      <span className="h-px flex-1 bg-border" aria-hidden="true" />
                    </div>

                    <SidebarGroup>
                      <SidebarGroupContent className="flex flex-col gap-px">
                        {navigation.items.map((item, itemIndex) => {
                          const icon = getIcon(item.title)
                          const isActive = pathname === item.link
                          return (
                            <SidebarMenuItem key={itemIndex}>
                              <SidebarMenuButton
                                asChild
                                className={cn(
                                  'group/link relative h-auto min-h-9 items-start overflow-visible rounded-lg py-1.5 pl-4 pr-3 text-sm font-medium leading-snug text-foreground transition-colors',
                                  'hover:bg-primary/10 hover:text-primary',
                                  '[&>span:last-child]:overflow-visible [&>span:last-child]:whitespace-normal',
                                  {
                                    'bg-primary/10 font-semibold text-primary':
                                      isActive,
                                  }
                                )}
                              >
                                <Link
                                  href={prefixLink(item.link)}
                                  onClick={closeMobile}
                                  className="flex items-start gap-3"
                                >
                                  <span
                                    aria-hidden="true"
                                    className={cn(
                                      'absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-opacity',
                                      isActive
                                        ? 'opacity-100'
                                        : 'opacity-0 group-hover/link:opacity-60'
                                    )}
                                  />
                                  {icon && (
                                    <span className="mt-0.5 shrink-0 text-current">
                                      {icon}
                                    </span>
                                  )}
                                  <span className="!overflow-visible !whitespace-normal break-words">
                                    {item.title}
                                  </span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          )
                        })}
                      </SidebarGroupContent>
                    </SidebarGroup>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        'group/link relative h-auto min-h-9 items-start overflow-visible rounded-lg py-1.5 pl-4 pr-3 text-sm font-medium leading-snug text-foreground transition-colors',
                        'hover:bg-primary/10 hover:text-primary',
                        '[&>span:last-child]:overflow-visible [&>span:last-child]:whitespace-normal',
                        {
                          'bg-primary/10 font-semibold text-primary':
                            pathname === navigation.link,
                        }
                      )}
                    >
                      <Link
                        href={prefixLink(navigation.link ?? '/')}
                        onClick={closeMobile}
                        className="flex items-start gap-3"
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            'absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-opacity',
                            pathname === navigation.link
                              ? 'opacity-100'
                              : 'opacity-0 group-hover/link:opacity-60'
                          )}
                        />
                        {getIcon(navigation.label) && (
                          <span className="mt-0.5 shrink-0 text-current">
                            {getIcon(navigation.label)}
                          </span>
                        )}
                        <span className="!overflow-visible !whitespace-normal break-words">
                          {navigation.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            )
          })}
        </SidebarContent>
      </div>
    </Sidebar>
  )
}
