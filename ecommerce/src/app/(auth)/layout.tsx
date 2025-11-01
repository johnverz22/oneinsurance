'use client'

import Image from 'next/image'
import { Header } from '@/components/layout/header'
import { ProductSlides } from '@/components/product-slides'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <Image
        className=""
        src="/images/agent-auth-bg.png"
        alt="bg"
        fill
        style={{ objectFit: 'cover' }}
      />

      {/* Dark overlay to make background darker */}
      <div className="absolute inset-0 z-5 bg-black/50"></div>

      <div className="relative z-10 grid w-full lg:grid-cols-2">
        <div className="relative flex h-screen w-full flex-col">
          <div className="flex h-full w-full items-center justify-center p-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
