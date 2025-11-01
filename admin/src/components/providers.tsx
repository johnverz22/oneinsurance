'use client'

import { ThemeProvider } from '@/components/theme/theme-provider'
import { SidebarProvider } from '@/components/ui/sidebar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient()
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <SidebarProvider className="flex flex-col">
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </SidebarProvider>
    </ThemeProvider>
  )
}
