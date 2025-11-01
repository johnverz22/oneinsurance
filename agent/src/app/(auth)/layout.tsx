'use client'

import { ThemeToggle } from '@/components/theme/toggle'
import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen w-screen overflow-hidden">
      <Image
        className=""
        src="/images/agent-auth-bg.png"
        alt="bg"
        fill
        style={{ objectFit: 'cover' }}
      />

      <div className="absolute inset-0 z-5 bg-black/50" />

      <div className="relative z-10 grid min-h-screen w-full lg:grid-cols-2">
        {/* Left column: auth card (on large screens this will be on the left) */}
        <div className="flex min-h-screen w-full items-center justify-center px-4 py-8">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-10 lg:max-w-[30rem] dark:bg-black">
            <div className="mb-6 flex items-center justify-between">
              <Image
                src="/images/logo.png"
                alt="Company Logo"
                width={150}
                height={100}
                className="object-contain"
              />

              <Image
                src="/images/IFRC.png"
                alt="IFRC Logo"
                width={100}
                height={100}
                className="object-contain"
              />
            </div>

            <div className="flex w-full items-center justify-center">
              {children}
            </div>
          </div>
        </div>

        {/* Right column: decorative / empty (keeps background visible) */}
        <div className="hidden lg:block" />
      </div>

      <div className="bg-background absolute top-4 right-4 z-10 flex size-12 items-center justify-center rounded-full lg:top-8 lg:right-8">
        <ThemeToggle className="text-foreground rounded-full" />
      </div>
    </div>
  )
}
