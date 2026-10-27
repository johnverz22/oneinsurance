'use client'

import { useEffect } from 'react'
import { ThemeProvider } from 'next-themes'

import './globals.css'

import { ErrorPage } from '@/components/error-page'

export default function GlobalError({ error }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh bg-[#fcfdfb] text-[#183d2c] antialiased dark:bg-[#1c1e1e] dark:text-[#f4f5f2]">
        <title>One Insurance — 500 · Server error</title>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <ErrorPage code={500} />
        </ThemeProvider>
      </body>
    </html>
  )
}
