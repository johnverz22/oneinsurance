'use client'

import Fade from 'embla-carousel-fade'
import AutoPlay from 'embla-carousel-autoplay'
import { InsuranceCard } from '@/components/insurance-card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'
import { INSURANCES } from '@/constants/insurances'

export const ProductSlides = () => {
  return (
    <Carousel
      plugins={[Fade(), AutoPlay({ delay: 8000 })]}
      className="relative m-auto h-full w-full px-4"
    >
      <CarouselContent className="m-auto h-full w-full items-center justify-center">
        <CarouselItem />
        <CarouselItem />
        {INSURANCES.filter((insurance) => insurance.tag).map(
          (product, index) => (
            <CarouselItem key={index}>
              <InsuranceCard variant="expanded" {...product} />
            </CarouselItem>
          )
        )}
      </CarouselContent>
    </Carousel>
  )
}
