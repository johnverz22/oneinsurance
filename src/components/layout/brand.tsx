import Link from 'next/link'
import { cn } from '@/lib/utils'
import Image from 'next/image'

type BrandProps = React.HTMLAttributes<HTMLHeadingElement>

export const Brand = ({ className, ...props }: BrandProps) => {
  return (
    <Link href="/">
      <h1 {...props} className={cn('text-lilac text-xl font-bold', className)}>
        <Image
          src="/images/logo.png"
          alt="brand-logo"
          width={150}
          height={100}
        />
      </h1>
    </Link>
  )
}
