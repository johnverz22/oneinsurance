'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { useState } from 'react'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={false}
        storageKey="oi-ui-theme"
      >
        {children}
        <Toaster
          position="bottom-right"
          style={
            {
              '--normal-bg': '#ffffff',
              '--normal-border': '#c7d4c9',
              '--normal-text': '#183d2c',
              '--success-bg': '#ffffff',
              '--success-border': '#bddac0',
              '--success-text': '#183d2c',
              '--error-bg': '#ffffff',
              '--error-border': '#fecaca',
              '--error-text': '#183d2c',
              '--border-radius': '0.375rem',
            } as React.CSSProperties
          }
          toastOptions={{
            classNames: {
              toast:
                'rounded-md border border-[#c7d4c9] bg-white text-[var(--text-main)] shadow-lg dark:border-[#565c58] dark:bg-[#1c1e1e]',
              title: 'font-semibold text-[var(--text-main)]',
              description: 'text-[var(--text-sub)]',
              success: '[&_[data-icon]]:text-[#006838]',
              error: '[&_[data-icon]]:text-red-600',
              warning: '[&_[data-icon]]:text-[#805c0c]',
              info: '[&_[data-icon]]:text-[#006838]',
              actionButton:
                'rounded-md bg-[#006838] px-3 text-white hover:bg-[#00552e]',
              cancelButton:
                'rounded-md border border-[#c7d4c9] bg-white px-3 text-[var(--text-main)] hover:bg-[#f1f2f0] dark:border-[#565c58] dark:bg-[#1c1e1e] dark:hover:bg-[#303232]',
              closeButton:
                'rounded-md border-[#c7d4c9] bg-white text-[var(--text-sub)] hover:bg-[#f1f2f0] dark:border-[#565c58] dark:bg-[#1c1e1e] dark:hover:bg-[#303232]',
            },
          }}
        />
      </NextThemesProvider>
    </QueryClientProvider>
  )
}
