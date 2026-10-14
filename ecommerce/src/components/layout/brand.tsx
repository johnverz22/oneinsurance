import Link from 'next/link'
import { cn } from '@/lib/utils'
import Image from 'next/image'

type BrandProps = React.HTMLAttributes<HTMLHeadingElement> & {
  href?: string
}

export const Brand = ({ className, href = '/', ...props }: BrandProps) => {
  return (
    <Link href={href}>
      <h1 {...props} className={cn('text-lilac text-xl font-bold', className)}>
        <Image
          src="/images/logo.png"
          alt="brand-logo"
          width={256}
          height={63}
          className="h-9 w-auto"
        />
      </h1>
    </Link>
  )
}
