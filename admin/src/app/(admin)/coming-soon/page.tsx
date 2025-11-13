import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Bell, Calendar, Clock } from 'lucide-react'
import Image from 'next/image'

export default function ComingSoonPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center px-4 py-16">
      {/* Background Pattern */}
      <div className="from-primary/5 to-tertiary/5 absolute inset-0 -z-10 bg-gradient-to-br via-transparent" />

      <div className="mx-auto w-full max-w-4xl">
        {/* Main Content */}
        <div className="space-y-8 text-center">
          {/* Icon/Image */}
          <div className="from-primary/20 to-tertiary/20 mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br p-8">
            <Clock className="text-primary h-full w-full" />
          </div>

          {/* Heading */}
          <div className="space-y-4">
            <h1 className="from-primary to-tertiary bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent sm:text-5xl lg:text-6xl">
              Coming Soon
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-600 sm:text-xl dark:text-gray-400">
              We're working hard to bring you something amazing. This feature
              will be available soon!
            </p>
          </div>

          {/* Features Preview */}
          <div className="mx-auto grid max-w-3xl gap-6 py-8 sm:grid-cols-3">
            <div className="flex flex-col items-center space-y-3 rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-800">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
                <Bell className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-semibold">Get Notified</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Be the first to know when we launch
              </p>
            </div>

            <div className="flex flex-col items-center space-y-3 rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-800">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
                <Calendar className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-semibold">Coming Soon</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                New features in development
              </p>
            </div>

            <div className="flex flex-col items-center space-y-3 rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-800">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
                <Clock className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-semibold">Stay Tuned</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Exciting updates on the way
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          {/* <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
            <Button
              size="lg"
              className="from-primary to-tertiary hover:from-primary/90 hover:to-tertiary/90 w-full bg-gradient-to-r sm:w-auto"
              asChild
            >
              <Link href="/">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back to Home
              </Link>
            </Button>
          </div> */}

          {/* Additional Info */}
          {/* <div className="pt-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Have questions?{' '}
              <Link
                href="/"
                className="from-primary to-tertiary bg-gradient-to-r bg-clip-text font-semibold text-transparent hover:underline"
              >
                Contact us
              </Link>
            </p>
          </div> */}
        </div>
      </div>
    </div>
  )
}
