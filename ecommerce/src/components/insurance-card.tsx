import Link from 'next/link'
import Image from 'next/image'
import { Check, ChevronRight, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Insurance } from '@/types/insurance'

type InsuranceCardProps = Insurance & {
  variant?: 'compact' | 'expanded'
  orientation?: 'horizontal' | 'vertical'
  className?: string
  companyName?: string
}

export const InsuranceCard = ({
  variant = 'compact',
  orientation = 'horizontal',
  className,
  companyName,
  ...insurance
}: InsuranceCardProps) => {
  const img = insurance.image ?? '/logo.png'

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'bg-background relative flex h-full w-full flex-col overflow-hidden rounded-2xl shadow-md transition-shadow hover:shadow-lg',
          className
        )}
      >
        {/* Image */}
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={img}
            alt={insurance.title}
            className="object-cover"
            fill
          />
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col space-y-3 p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {insurance.title}
          </h3>

          <p className="flex-1 text-sm text-gray-600 dark:text-gray-400">
            {insurance.description}
          </p>

          <div className="flex w-full justify-end">
            <Button
              size="sm"
              variant="link"
              className="!px-0 py-0 font-semibold"
              asChild
            >
              <Link
                href={insurance.checkoutLink}
                className="from-primary to-tertiary bg-gradient-to-r bg-clip-text text-transparent"
              >
                Learn More
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'bg-background border-muted-foreground/10 relative m-auto h-max min-h-2/5 w-11/12 overflow-visible rounded-md border shadow-sm md:w-[30rem]',
        className
      )}
    >
      {insurance.tag && (
        <div className="absolute top-10 -left-[21px] z-10">
          <div className="border-t-primary absolute -bottom-[16px] -left-px h-0 w-0 rounded-tl-md border-t-[18px] border-l-[22px] border-r-transparent border-l-transparent" />

          <div className="relative">
            <div className="bg-lilac insurances-center z-10 flex gap-1 rounded-sm rounded-bl-xs px-6 py-2 text-xs font-semibold text-white shadow-lg">
              <span>⭐</span>
              <span>{insurance.tag}</span>
            </div>
          </div>
        </div>
      )}

      <div
        className={cn(
          'relative flex h-[16rem] max-h-[20rem] w-full items-center justify-center gap-8',
          {
            'flex-col': orientation === 'vertical',
            'flex-row': orientation === 'horizontal',
          }
        )}
      >
        <div
          className={cn('relative mx-auto h-full w-full overflow-hidden', {
            'max-w-1/3 rounded-l-md': orientation === 'horizontal',
          })}
        >
          <Image
            src={img}
            alt={insurance.title}
            className="object-cover"
            fill
          />
        </div>

        <div className="z-10 p-8">
          <div className="insurances-start mb-2 flex justify-between">
            <h2 className="text-xl font-semibold text-gray-900 lg:text-2xl xl:text-3xl dark:text-gray-100">
              {insurance.title}
            </h2>
          </div>

          <p className="mb-4">{companyName}</p>
          <p className="mb-4 line-clamp-4 text-sm text-gray-500 dark:text-gray-400">
            {insurance.description}
          </p>

          <Button
            size="sm"
            variant="link"
            className="text-foreground !px-0 py-0 underline underline-offset-8"
            asChild
          >
            <Link href={`/coming-soon`}>
              Learn More <ChevronRight />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
