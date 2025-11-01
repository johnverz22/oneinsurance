import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { Insurance } from '@/types/insurance'

export interface InsuranceItemCardProps {
  item: Insurance
  imageSrc: string
}

export default function InsuranceItemCard({
  item,
  imageSrc,
}: InsuranceItemCardProps) {
  return (
    <div className="bg-card hover:bg-lilac/10 flex h-fit w-full justify-between rounded-lg p-4 shadow-xl sm:p-6">
      <div className="grid w-3/4 grid-cols-1 items-center justify-center gap-2 lg:grid-cols-2">
        <div className="relative h-20 flex-1/3">
          <Image
            src={imageSrc}
            className="object-contain"
            alt="product offer"
            fill
          />
        </div>

        <div className="flex flex-2/3 flex-col">
          <h1 className="mb-3 text-lg font-semibold tracking-wide">
            {item.title}
          </h1>

          <div className="space-y-2">
            <p className="text-sm font-medium tracking-wide">
              MBL: {item.plans[0].mbl}
            </p>
            <p className="text-sm font-medium tracking-wide">
              Eligible Age: {item.more.eligibleAge}
            </p>
            <p className="text-sm font-medium tracking-wide">
              Payment Option: {item.plans[0].price}
            </p>
          </div>
        </div>
      </div>

      {/* right side */}
      <div className="flex w-fit flex-col items-end justify-center gap-4">
        <Button className="w-fit text-white" asChild>
          <Link href={'ctpl-insurance/car-insurance'}>
            <span className="px-4">View Details</span> <ArrowRight />{' '}
          </Link>
        </Button>
      </div>
    </div>
  )
}
