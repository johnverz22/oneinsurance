import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { TestimonialCard } from '@/components/testimonial-card'

export function TestimonialSection() {
  return (
    <section className="border-muted-foreground/20 mx-2 h-full w-full bg-zinc-50 px-4 py-8 dark:bg-zinc-800">
      <div className="mx-auto grid h-full max-w-7xl items-center gap-4 lg:grid-cols-3">
        <div className="space-y-2">
          <div className="text-muted-foreground flex items-center gap-3">
            <h5>TESTIMONIAL</h5>
            <Link href="/" className="block lg:hidden">
              <ChevronRight />
            </Link>
          </div>
          <h2 className="text-4xl font-bold">
            Hear it from our satisfied customers
          </h2>
          <Button
            variant="link"
            className="text-foreground hidden w-max !px-0 lg:flex"
            asChild
          >
            <Link href="/">
              View All Testimonies <ChevronRight />
            </Link>
          </Button>
        </div>

        <Carousel className="relative w-full px-4 lg:col-span-2">
          <CarouselContent className="max-w-xs sm:max-w-sm lg:max-w-full">
            {Array.from({ length: 5 }).map((_, index) => (
              <CarouselItem key={index} className="lg:basis-1/2">
                <TestimonialCard />
              </CarouselItem>
            ))}
          </CarouselContent>

          <div className="flex w-full justify-end gap-4 py-4">
            <CarouselPrevious className="relative" />
            <CarouselNext className="relative" />
          </div>
        </Carousel>
      </div>
    </section>
  )
}
