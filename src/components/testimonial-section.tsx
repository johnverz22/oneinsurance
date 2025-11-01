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
  const testimonials = [
    {
      rating: 5,
      title: 'Excellent Service and Support',
      content:
        'The insurance process was incredibly smooth. The team was professional and helped me understand every detail of my policy. Highly recommended!',
      userName: 'Maria Santos',
      userRole: 'Business Owner',
    },
    {
      rating: 5,
      title: 'Best Insurance Experience',
      content:
        'Fast claim processing and excellent customer service. They made everything so easy and straightforward. Will definitely recommend to friends and family.',
      userName: 'Juan Dela Cruz',
      userRole: 'Teacher',
    },
    {
      rating: 5,
      title: 'Reliable and Trustworthy',
      content:
        'Been with them for 3 years now. Their coverage is comprehensive and the premiums are very reasonable. Peace of mind guaranteed!',
      userName: 'Anna Reyes',
      userRole: 'IT Professional',
    },
    {
      rating: 5,
      title: 'Great Value for Money',
      content:
        'Amazing service! They processed my claim quickly and without hassle. The team is very responsive and professional.',
      userName: 'Carlos Rodriguez',
      userRole: 'Engineer',
    },
    {
      rating: 5,
      title: 'Highly Professional Team',
      content:
        'Very satisfied with their service. The agents are knowledgeable and always ready to help. Made the right choice choosing them.',
      userName: 'Sofia Martinez',
      userRole: 'Marketing Manager',
    },
  ]

  return (
    <section className="h-full w-full px-4 py-16">
      <div className="mx-auto h-full max-w-7xl overflow-hidden rounded-3xl bg-zinc-50 p-8 lg:p-12 dark:bg-zinc-900">
        {/* Header */}
        <div className="mb-12 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <div className="space-y-4">
            <h2 className="from-primary to-tertiary bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent lg:text-5xl">
              Testimonials
            </h2>
            <p className="max-w-2xl text-lg font-normal">
              Hear it from our satisfied customers — real stories and
              experiences from people who've trusted us to protect what matters
              most.
            </p>
          </div>
          <Button
            variant="link"
            className="group flex items-center gap-2 !px-0 text-lg font-semibold"
            asChild
          >
            <Link href="/coming-soon">
              Read More
              <ChevronRight className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {/* Carousel */}
        <Carousel className="relative w-full">
          <CarouselContent className="-ml-4">
            {testimonials.map((testimonial, index) => (
              <CarouselItem
                key={index}
                className="pl-4 md:basis-1/2 lg:basis-1/4"
              >
                <TestimonialCard
                  rating={testimonial.rating}
                  title={testimonial.title}
                  content={testimonial.content}
                  userName={testimonial.userName}
                  userRole={testimonial.userRole}
                />
              </CarouselItem>
            ))}
          </CarouselContent>

          <div className="mt-8 flex justify-center gap-4">
            <CarouselPrevious className="relative left-0 translate-x-0 translate-y-0" />
            <CarouselNext className="relative right-0 translate-x-0 translate-y-0" />
          </div>
        </Carousel>
      </div>
    </section>
  )
}
