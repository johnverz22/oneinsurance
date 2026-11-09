import Link from 'next/link'
import Image from 'next/image'

export const BlogCard = () => {
  return (
    <div className="relative min-w-48 flex-1 overflow-hidden rounded-xs">
      <Link href="/">
        <Image
          src="/insurance-rejection.webp"
          alt="blog"
          className="h-48 w-full object-cover object-top"
          height={240}
          width={240}
        />

        <div className="z-10 bg-transparent pt-2">
          <h3 className="pb-3 text-xl font-bold">
            7 Common Mistakes That Can Get Your Car Insurance Claim Rejected
          </h3>
          <p className="text-muted-foreground max-w-64 text-sm font-bold lg:max-w-full">
            {new Date().toDateString()}
          </p>
        </div>
      </Link>
    </div>
  )
}
