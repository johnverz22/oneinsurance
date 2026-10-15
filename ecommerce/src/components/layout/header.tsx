'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, User } from 'lucide-react'
import { ThemeToggle } from '@/components/theme/toggle'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { Brand } from '@/components/layout/brand'
import { Button } from '@/components/ui/button'
import { isSingedin } from '@/utils/is-sigin'
import { NavigationItem } from '@/types/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAgentAuthStore } from '@/store/agent-auth-store'
import { toast } from 'sonner'
import { removeLocalStorage } from '@/utils/remove-session-storage'
import { useAgentCodeStore } from '@/store/agent-code-store'

type WithNavigationProps = {
  isNavigationVisible: true
  navigations: NavigationItem[]
}

type NoNavigationProps = {
  isNavigationVisible: false
}

type HeaderProps = {
  isLoggedIn?: boolean
  className?: string
  contentContainerClassName?: string
  /** Show the mobile hamburger (sidebar trigger) in the header. Defaults to true. */
  showSidebarTrigger?: boolean
  /** Show the brand logo. Defaults to true. */
  showBrand?: boolean
  /**
   * Visual theme.
   * - 'default': opaque background with primary-colored nav (light pages).
   * - 'transparent': transparent background with light nav text, for
   *   overlaying dark hero sections.
   */
  variant?: 'default' | 'transparent'
} & (WithNavigationProps | NoNavigationProps)

export const Header = ({
  isLoggedIn = false,
  isNavigationVisible = true,
  className,
  contentContainerClassName,
  showSidebarTrigger = true,
  showBrand = true,
  variant = 'default',
  ...rest
}: HeaderProps) => {
  const navigations = isNavigationVisible
    ? (rest as WithNavigationProps).navigations
    : []

  const {agentCode} = useAgentCodeStore()
  const pathname = usePathname()
  const isTravelSubPage = !!pathname?.includes('/products/travel-insurance/')
  const brandHref = agentCode
    ? isTravelSubPage
      ? `/${agentCode}/products/travel-insurance`
      : `/${agentCode}`
    : '/'

  // Desktop (lg) top-nav layout:
  // - Promote the first 3 "Products" sub-items to top-level menu items
  //   (abbreviating the 3rd — Comprehensive Third-Party Liability — to "CTPL").
  // - Move the remaining Products sub-items under an "Other Insurances" group.
  // The mobile sidebar keeps the original `navigations` structure untouched.
  const desktopNavigations: NavigationItem[] = navigations.flatMap(
    (navigation): NavigationItem[] => {
      if (navigation.type !== 'multiple' || navigation.label !== 'Products') {
        return [navigation]
      }

      const promoted = navigation.items.slice(0, 3)
      const remaining = navigation.items.slice(3)

      const promotedSingles: NavigationItem[] = promoted.map((item, index) => ({
        type: 'single',
        label: index === 2 ? 'CTPL' : item.title,
        link: item.link,
      }))

      const otherGroup: NavigationItem[] =
        remaining.length > 0
          ? [{ type: 'multiple', label: 'Other Insurances', items: remaining }]
          : []

      return [...promotedSingles, ...otherGroup]
    }
  )

  const { isMobile } = useSidebar()
  const isSingIn = isLoggedIn ?? isSingedin()

  const isTransparent = variant === 'transparent'

  return (
    <header
      className={cn(
        'z-40 h-20 w-full px-4 py-4 lg:px-8',
        isTransparent ? 'absolute top-0 bg-transparent' : 'fixed top-0 bg-background',
        className
      )}
    >
      <div
        className={cn(
          'mx-auto flex h-full max-w-7xl items-center justify-between',
          contentContainerClassName
        )}
      >
        <div className="flex items-center">
          {showSidebarTrigger && (
            <SidebarTrigger
              size="lg"
              variant="ghost"
              className={cn('h-10 w-10 rounded-full p-2', {
                hidden: !isMobile,
              })}
            />
          )}

          {showBrand &&
            (isTransparent ? (
              <div className="rounded-tl-full rounded-br-full bg-white px-6 py-1 shadow-lg">
                <Brand href={brandHref} />
              </div>
            ) : (
              <Brand href={brandHref} />
            ))}
        </div>

        <div className="flex h-full items-center gap-8">
          {isNavigationVisible && (
            <div
              className={cn('hidden items-center gap-8', {
                flex: !isMobile,
              })}
            >
              <NavigationMenu viewport={false}>
                <NavigationMenuList>
                  {desktopNavigations.map((navigation, index) => {
                    const isList = navigation.type === 'multiple'

                    return (
                      <NavigationMenuItem key={index}>
                        {isList ? (
                          <>
                            <NavigationMenuTrigger
                              className={cn(
                                'font-bold',
                                isTransparent
                                  ? 'bg-transparent text-white hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white data-[state=open]:bg-white/10 data-[state=open]:text-white data-[state=open]:hover:bg-white/10 data-[state=open]:focus:bg-white/10'
                                  : 'text-primary'
                              )}
                            >
                              {navigation.label}
                            </NavigationMenuTrigger>
                            {navigation.items && (
                              <NavigationMenuContent className="z-10">
                                <ul className="grid w-[300px]">
                                  {navigation.items.map((item, index) => (
                                    <ListItem
                                      key={index}
                                      href={agentCode ? `/${agentCode}${item.link}` : item.link}
                                      title={item.title}
                                      className=""
                                    >
                                      {item.description}
                                    </ListItem>
                                  ))}
                                </ul>
                              </NavigationMenuContent>
                            )}
                          </>
                        ) : (
                          <NavigationMenuLink
                            asChild
                            className={cn(
                              navigationMenuTriggerStyle(),
                              'font-bold',
                              isTransparent
                                ? 'bg-transparent text-white hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white data-[active=true]:bg-white/10 data-[active=true]:text-white data-[active=true]:hover:bg-white/10 data-[active=true]:focus:bg-white/10'
                                : 'text-primary'
                            )}
                          >
                            <Link href={agentCode ? `/${agentCode}${navigation.link ?? '/'}` : navigation.link ?? '/'}>
                              {navigation.label}
                            </Link>
                          </NavigationMenuLink>
                        )}
                      </NavigationMenuItem>
                    )
                  })}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          )}

          {/* <ThemeToggle /> */}

          {/* TEMP: user login temporarily disabled */}
          {/* {isSingIn ? (
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="icon" className="relative py-2">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    className="flex items-center gap-2 py-2"
                  >
                    <Avatar>
                      <AvatarImage src="https://github.com/shadcn.png" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">Agent 1</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button variant="secondary" className="px-8" asChild>
              <Link href="/sign-in">Login</Link>
            </Button>
          )} */}
        </div>
      </div>
    </header>
  )
}

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<'li'> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link href={href}>
          <div className="text-sm leading-none font-medium">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  )
}
