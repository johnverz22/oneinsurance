import type { Metadata } from 'next'
import { Open_Sans, Montserrat } from 'next/font/google'
import './globals.css'

import { cn } from '@/lib/utils'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/sonner'

const openSans = Open_Sans({
  variable: '--font-open-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
})

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'E-commerce',
  description: 'One Insurance',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('antialiased', montserrat.variable)}>
        <Providers>{children}</Providers>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  )
}
