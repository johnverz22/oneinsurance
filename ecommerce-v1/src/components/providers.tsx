'use client'

import { ThemeProvider } from '@/components/theme/theme-provider'
import { SidebarProvider } from '@/components/ui/sidebar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export const Providers = ({ children }: { children: React.ReactNode }) => {
  // QueryClient must be stable across renders — instantiating it outside
  // useState would create a new client (and destroy the cache) on every render.
  const [queryClient] = useState(() => new QueryClient())
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <SidebarProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </SidebarProvider>
    </ThemeProvider>
  )
}
