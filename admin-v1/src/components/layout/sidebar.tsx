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
                    <div className="text-muted-foreground flex items-center gap-2 px-4 py-2 text-sm font-medium tracking-wide uppercase">
                      {navigation.label}
                    </div>

                    <SidebarGroup>
                      <SidebarGroupContent className="ml-2 flex flex-col gap-1">
                        {navigation.items.map((item, itemIndex) => (
                          <SidebarMenuItem key={itemIndex}>
                            <SidebarMenuButton
                              asChild
                              className={cn(
                                'text-muted-foreground hover:text-foreground hover:bg-accent/50 h-12 px-4',
                                {
                                  'bg-accent text-white':
                                    pathname === item.link,
                                }
                              )}
                            >
                              <Link
                                href={item.link}
                                className="flex items-center gap-3"
                              >
                                {getIcon(item.title)}
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarGroupContent>
                    </SidebarGroup>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        'text-muted-foreground hover:text-foreground hover:bg-accent/50 h-12 px-4',
                        { 'bg-accent text-white': pathname === navigation.link }
                      )}
                    >
                      <Link
                        href={navigation.link ?? '/'}
                        className="flex items-center gap-3"
                      >
                        {getIcon(navigation.label)}
                        <span>{navigation.label}</span>
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
