'use client'

import Link from 'next/link'
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
import { NavigationItem } from '@/types/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAgentAuthStore } from '@/store/agent-auth-store'
import { useLogoutAgent } from '@/app/data/mutations/agent/auth-agent'
import { toast } from 'sonner'
import { removeLocalStorage } from '@/utils/remove-session-storage'

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
  const { user, isAuthenticated, getInitials } = useAgentAuthStore()
  const { mutateAsync: logoutAgent } = useLogoutAgent()

  const { isMobile } = useSidebar()

  return (
    <header
      className={cn(
        'bg-background fixed top-0 z-40 h-fit w-full px-4 py-8 lg:px-8',
        className
      )}
    >
      <div
        className={cn(
          'max-w-app relative mx-auto flex h-full items-center justify-between',
          contentContainerClassName
        )}
      >
        <div className="flex w-full items-center">
          <SidebarTrigger
            size="lg"
            variant="ghost"
            className={cn('h-10 w-10 rounded-full p-2', {
              hidden: isMobile ? !isNavigationVisible : true,
            })}
          />

          <Brand />
        </div>

        <div className="flex h-full items-center gap-3">
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
                                <ul className="grid w-auto min-w-[300px] max-w-[500px] gap-4 p-4">
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

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-primary hover:bg-foreground/10 dark:hover:bg-foreground/10 flex items-center gap-4 py-2"
                  >
                    <span className="hidden text-sm md:inline">
                      Welcome, {user?.name}
                    </span>
                    <Avatar>
                      <AvatarImage src="" />
                      <AvatarFallback>{getInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-40">
                  <p className="text-accent flex w-full border-b px-4 py-2.5 font-bold md:hidden">
                    Welcome, {user?.name}!
                  </p>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => (window.location.href = '/profile')}
                  >
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      const response = await logoutAgent()
                      toast.info(response.message)
                      removeLocalStorage('agent-auth-storage')
                      window.location.href = '/login'
                    }}
                  >
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

          <ThemeToggle />
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
        <Link href={href} className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  )
}
