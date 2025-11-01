import Image from 'next/image'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="relative flex h-screen flex-col items-center justify-center text-center">
      <div className="flex items-center gap-4">
        <div className="gap-3 rounded-tl-full rounded-br-full bg-white px-12 py-1 shadow-sm">
          <Image
            src="/images/logo.png"
            alt="One Insurance"
            width={140}
            height={45}
            className="h-10 w-auto"
            priority
          />
        </div>

        <div className="max-h-40 max-w-40 rounded-b-2xl bg-white px-3 py-2">
          <Image
            src="/images/IFRC.png"
            alt="IFRC Logo"
            width={1920}
            height={1240}
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      <h1 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-4xl font-black text-transparent sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
        404
      </h1>
      <p className="text-muted-foreground mt-2">
        Link may be broken. You may request new link from your agent
      </p>
      <Link
        href="/"
        className="text-primary hover:text-primary/80 mt-6 text-sm underline underline-offset-4"
      >
        Go back home
      </Link>
    </div>
  )
}
