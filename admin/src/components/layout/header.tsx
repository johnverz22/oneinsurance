'use client'

import Link from 'next/link'
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
import { useAuthStore } from '@/store/auth-store'
import { toast } from 'sonner'
import { removeLocalStorage } from '@/utils/remove-session-storage'
import { useLogoutAdmin } from '@/app/data/mutations/auth'

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
} & (WithNavigationProps | NoNavigationProps)

export const Header = ({
  isLoggedIn = false,
  isNavigationVisible = true,
  className,
  contentContainerClassName,
  ...rest
}: HeaderProps) => {
  const navigations = isNavigationVisible
    ? (rest as WithNavigationProps).navigations
    : []
  const { user, isAuthenticated } = useAuthStore()
  const { mutateAsync: logoutAdmin } = useLogoutAdmin()

  const { isMobile } = useSidebar()
  const isSingIn = isAuthenticated

  const handleLogout = async () => {
    await logoutAdmin()
    window.location.href = '/login'
  }

  return (
    <header
      className={cn(
        'bg-background fixed top-0 z-40 h-20 w-full border-b px-4 py-4 lg:px-8',
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
          <SidebarTrigger
            size="lg"
            variant="ghost"
            className={cn('h-10 w-10 rounded-full p-2', {
              hidden: !isMobile,
            })}
          />

          <Brand />
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
                  {navigations.map((navigation, index) => {
                    const isList = navigation.type === 'multiple'

                    return (
                      <NavigationMenuItem key={index}>
                        {isList ? (
                          <>
                            <NavigationMenuTrigger>
                              {navigation.label}
                            </NavigationMenuTrigger>
                            {navigation.items && (
                              <NavigationMenuContent className="z-10">
                                <ul className="grid w-[300px] gap-4">
                                  {navigation.items.map((item, index) => (
                                    <ListItem
                                      key={index}
                                      href={item.link}
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
                            className={navigationMenuTriggerStyle()}
                          >
                            <Link href={navigation.link ?? '/'}>
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

          <ThemeToggle />

          {isSingIn ? (
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="icon" className="relative py-2">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
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
                    <span className="text-sm">{user?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button variant="secondary" className="px-8" asChild>
              <Link href="/sign-in">Login</Link>
            </Button>
          )}
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
