import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { CtplInsuranceProduct } from '@/types/ctpl-insurance'

interface CtplPlanCardProps {
  ctplProduct: CtplInsuranceProduct
  buyNowBtnClick?: (value: CtplInsuranceProduct) => void
}

export function CtplPlanCard({
  ctplProduct,
  buyNowBtnClick,
}: CtplPlanCardProps) {
  return (
    <Card
      className="aspect-square cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={() => buyNowBtnClick?.(ctplProduct)}
    >
      <CardContent>
        <div className="h-full space-y-3">
          <div className="relative m-auto h-40 w-40">
            <Image
              src={ctplProduct.image}
              alt={ctplProduct.title}
              fill
              className="object-contain"
            />
          </div>

          <div>
            <p className="text-lg font-semibold">{ctplProduct.title}</p>
            <span className="text-xs font-light">
              Includes all taxes & fees
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
