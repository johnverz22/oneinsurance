import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import Link from 'next/link'
import { Insurance } from '@/types/insurance'
import { CheckoutRedirect } from './checkout/checkout-redirect'

export type ProductCardProps = {
  insurance: Insurance
  link: string
}

export function ProductCard({ link, insurance }: ProductCardProps) {
  const { image, title, plans } = insurance

  return (
    <div className="border-muted-foreground/10 flex max-w-full min-w-[10rem] flex-col justify-between overflow-hidden rounded-2xl border shadow-xl">
      <div>
        <div className="relative h-52 w-full">
          <Image src={image} fill className="object-contain" alt={title} />
        </div>
        <div className="flex flex-col gap-2 p-6 text-sm text-gray-600 sm:text-lg">
          <h3 className="text-lilac pb-4 text-lg font-bold sm:text-xl">
            {title}
          </h3>

          {plans[plans.length - 1].benefits.map((content, index) => {
            return (
              <div key={index} className="flex gap-3">
                <Check className="text-primary shrink-0" />
                <p className="text-foreground">{content}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-lilac/20 flex flex-col gap-4 p-4">
        <div className="text-foreground">
          <small className="text-muted-foreground w-1/4">Payment Option:</small>

          <ul>
            {plans.map((plan, index) => (
              <li
                key={index}
                className="flex items-center justify-between gap-4"
              >
                <p className="w-3/5 text-left text-sm font-medium tracking-wide">
                  {plan.name}:
                </p>
                <p className="text-right text-sm font-bold tracking-wide">
                  PHP {plan.price.toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-center gap-2">
          <CheckoutRedirect
            insurance={insurance}
            className="bg-background w-full"
          />
          <Link href={link} className="text-lilac text-sm font-medium">
            More Details
          </Link>
        </div>
      </div>
    </div>
  )
}
