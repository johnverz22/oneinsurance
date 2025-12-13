import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Brand } from '@/components/layout/brand'
import {
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  ArrowRight,
} from 'lucide-react'

export const Footer = () => {
  return (
    <footer className="relative bg-[#E8E9F3] dark:bg-zinc-800">
      {/* Newsletter Section */}
      <div className="border-b border-gray-200 py-12 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center justify-center gap-6 lg:flex-row lg:gap-8">
            <form className="flex w-full max-w-md items-center gap-3">
              <div className="relative flex-1">
                <Input
                  type="email"
                  placeholder="Email Address"
                  className="h-14 rounded-full border-0 bg-white pr-16 text-gray-600 shadow-sm placeholder:text-gray-400"
                  required
                />
                <Button
                  type="submit"
                  size="icon"
                  className="bg-primary hover:bg-primary/90 absolute top-2 right-2 h-10 w-10 rounded-full"
                >
                  <ArrowRight className="h-5 w-5 text-white" />
                </Button>
              </div>
            </form>
            <div className="text-center lg:text-left">
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Don&apos;t miss out on the latest updates.
              </p>
              <p className="text-sm text-gray-600">
                Stay informed about new products, tips, and exclusive offers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Content */}
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
          <Brand className="text-2xl" />

          <div className="space-y-1.5">
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-white text-gray-600 hover:bg-white/80 hover:text-gray-900"
                asChild
              >
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-white text-gray-600 hover:bg-white/80 hover:text-gray-900"
                asChild
              >
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-white text-gray-600 hover:bg-white/80 hover:text-gray-900"
                asChild
              >
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-white text-gray-600 hover:bg-white/80 hover:text-gray-900"
                asChild
              >
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                >
                  <Youtube className="h-5 w-5" />
                </a>
              </Button>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <Button
                variant="link"
                className="text-foreground w-full !p-0 lg:!text-left"
                asChild
              >
                <Link href="/agent-application">Become an Agent</Link>
              </Button>
              <Button
                variant="link"
                className="text-foreground w-full !p-0 lg:!text-left"
              >
                Privacy And Policy
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
