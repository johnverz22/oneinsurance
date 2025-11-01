import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Brand } from '@/components/layout/brand'
import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react'

export const Footer = () => {
  return (
    <footer className="relative bg-[#0e1e0c]">
      <div className="mx-auto grid h-full max-w-7xl gap-4 px-4 py-16 lg:grid-cols-2">
        <div className="space-y-2 text-white">
          <Brand className="pb-2 text-3xl text-white" />
          <p className="text-justify font-normal sm:text-left lg:max-w-[75%]">
            Insurance Made Simple. Coverage Made Easy
          </p>

          <div className="flex items-center gap-3 py-4">
            <span className="pr-4">Follow us on social</span>
            <Button className="bg-white text-black hover:text-white">
              <Facebook />
            </Button>

            <Button className="bg-white text-black hover:text-white">
              <Instagram />
            </Button>

            <Button className="bg-white text-black hover:text-white">
              <Linkedin />
            </Button>
            <Button className="bg-white text-black hover:text-white">
              <Youtube />
            </Button>
          </div>
        </div>

        <form className="space-y-2">
          <p className="font-bold text-white">
            Don&apos;t miss out on any updates
          </p>

          <div className="flex gap-3">
            <Input
              type="email"
              placeholder="Enter email address"
              className="h-12 border-zinc-600 text-white dark:bg-transparent"
              required
            />
            <Button className="h-12 rounded-lg px-8 text-white">Submit</Button>
          </div>
        </form>
      </div>
    </footer>
  )
}
