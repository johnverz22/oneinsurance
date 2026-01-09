import { Footer } from '@/components/layout/footer'
import Image from 'next/image'
import Link from 'next/link'

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white dark:bg-gray-900">
        <div className="container mx-auto flex items-center justify-between px-6 py-6 lg:px-20">
          <div className="flex items-center">
            <Image
              src="/images/logo.png"
              alt="OneInsurance Logo"
              width={120}
              height={40}
              className="object-contain"
            />
          </div>
          <div className="flex items-center">
            <Image
              src="/images/IFRC.png"
              alt="IFRC Logo"
              width={120}
              height={40}
              className="object-contain"
            />
          </div>
        </div>
      </header>
      <main className="relative flex flex-1 flex-col lg:flex-row">
        {/* Background Image for entire main area */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/login-bg.png"
            alt="Background"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Left Side - Promotional Content */}
        <div className="relative z-10 flex w-full overflow-hidden py-12 lg:w-1/2 lg:py-0">
          <div className="relative z-10 flex w-full flex-col items-center justify-center px-6 text-center text-white sm:px-12 lg:items-start lg:text-left xl:px-20">
            <h1 className="mb-6 text-3xl leading-tight font-bold sm:text-4xl xl:text-5xl">
              Insurance Commission Management Platform
            </h1>
            <p className="mb-8 text-base leading-relaxed text-gray-300 sm:text-lg xl:text-xl">
              Streamline product assignments, commission tracking, and team
              management
            </p>
            <Link
              href="https://ifrc.intel-soln.com.ph/agent-application"
              className="inline-flex w-fit items-center justify-center rounded-lg border-2 border-white px-6 py-3 font-semibold text-white transition-colors hover:bg-white hover:text-gray-900"
            >
              Become an Agent
            </Link>
          </div>
        </div>

        {/* Right Side - Form Area */}
        <div className="relative z-10 flex min-h-[calc(100vh-theme(spacing.32))] w-full items-center justify-center px-6 py-8 lg:w-1/2 lg:py-12">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl lg:p-10 dark:bg-gray-900">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
