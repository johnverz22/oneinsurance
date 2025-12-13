'use client'

import Link from 'next/link'
import Image from 'next/image'
import Marquee from 'react-fast-marquee'
import { Button } from '@/components/ui/button'
import { ChevronRight, ArrowRight } from 'lucide-react'
import { InsuranceCard } from '@/components/insurance-card'
import { TestimonialCard } from '@/components/testimonial-card'
import { BlogCard } from '@/components/blog-card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { INSURANCES } from '@/constants/insurances'
import { COMPANIES } from '@/constants/companies'
import { AGENT_CODE } from '@/constants/agent-code'

export default function Home() {
  // Sample testimonials data
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

  // Sample blog posts data
  const blogPosts = [
    {
      image: '/images/newsroom/nw1.png',
      date: 'October 4, 2025',
      day: 'Fri',
      title: '7 Common Mistakes That Can Get Your Car Insurance Claim Rejected',
      description:
        'Understanding the claim process is key to avoiding rejections. This article outlines the most common errors policyholders make and provides practical tips to ensure a...',
      href: '/coming-soon',
    },
    {
      image: '/images/newsroom/nw2.png',
      date: 'September 25, 2025',
      day: 'Thurs',
      title: 'Why Comprehensive Car Insurance Is Worth Every Peso',
      description:
        'Comprehensive coverage offers protection beyond basic insurance. Learn how it safeguards you from theft, damage, and unforeseen events...',
      href: '/coming-soon',
    },
    {
      image: '/images/newsroom/nw3.png',
      date: 'September 14, 2025',
      day: 'Sun',
      title: 'The Importance of Motorcycle Insurance in the Philippines',
      description:
        'With the increasing number of motorcycle owners nationwide, adequate insurance coverage has become essential...',
      href: '/coming-soon',
    },
    {
      image: '/images/newsroom/nw4.png',
      date: 'August 30, 2025',
      day: 'Sat',
      title: 'A Step-by-Step Guide to Filing an Insurance Claim',
      description:
        'Filing an insurance claim can be straightforward when you know the process. This guide walks you through each step to ensure a smooth experience...',
      href: '/coming-soon',
    },
  ]

  // Sample FAQ data
  const faqs = [
    {
      question: 'What does travel insurance cover?',
      answer:
        'Travel insurance typically covers trip cancellation, medical emergencies, lost luggage, flight delays, and emergency evacuation. Coverage varies by policy, so review your specific plan details.',
    },
    {
      question: 'How do I get emergency assistance?',
      answer:
        'Contact our 24/7 emergency hotline immediately. Keep your policy number ready and provide details about your situation. Our team will guide you through the necessary steps and coordinate assistance.',
    },
    {
      question: 'What is trip protection?',
      answer:
        'Trip protection includes coverage for trip cancellation, interruption, and delays due to covered reasons such as illness, severe weather, or other unforeseen circumstances. It helps protect your travel investment.',
    },
    {
      question: 'Are family plans available?',
      answer:
        'Yes, we offer family plans that cover multiple travelers under one policy. Family plans are cost-effective and provide comprehensive coverage for all family members traveling together.',
    },
    {
      question: 'Is COVID-19 covered?',
      answer:
        'COVID-19 coverage varies by policy. Many of our plans include coverage for COVID-19 related medical expenses and trip cancellations. Check your specific policy terms for detailed information.',
    },
  ]

  // useEffect(() => {
  //   redirect(INSURANCES[0].checkoutLink)
  // }, [])

  return (
    <div className="relative h-full w-full">
      <section className="relative h-full w-full px-4 py-16 lg:py-20">
        {/* Background Image Container with max-width and rounded edges */}
        <div className="relative mx-auto h-full max-w-7xl overflow-hidden rounded-3xl lg:h-[35rem]">
          <Image
            src="/images/hero-bg.png"
            alt="Hero background"
            fill
            className="object-cover"
            priority
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />

          {/* Content */}
          <div className="relative z-10 flex h-full items-center px-8 lg:px-16">
            <div className="max-w-2xl space-y-4">
              <h1 className="text-3xl font-bold text-black sm:text-4xl lg:text-5xl xl:text-6xl">
                Insurance Made Simple.
              </h1>
              <h2 className="text-3xl font-bold text-black sm:text-4xl lg:text-5xl xl:text-6xl">
                Coverage Made Easy.
              </h2>
              <p className="text-base text-black sm:text-lg lg:text-xl">
                Your one-stop shop to compare, choose,
                <br />
                and get insured — fast.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="h-fit w-full px-4 py-16">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Header */}
          <div className="space-y-4 text-center">
            <h2 className="from-primary to-tertiary bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent lg:text-5xl">
              Our Trusted Providers
            </h2>
            <p className="text-lg font-normal">
              Partner with industry-leading companies that deliver exceptional
              <br className="hidden sm:block" />
              solutions and services
            </p>
          </div>

          {/* Logo Marquee */}
          <Marquee autoFill pauseOnHover direction="right" className="py-4">
            {COMPANIES.map((company, index) => (
              <Link
                href={`/provider/${company.id}`}
                key={index}
                className="relative mx-4 flex h-24 w-40 items-center justify-center transition-opacity hover:opacity-75"
              >
                <div className="relative h-full w-full">
                  <Image
                    src={company.image}
                    alt={company.companyName}
                    fill
                    className="object-contain grayscale transition-all hover:grayscale-0"
                    style={{ background: 'transparent' }}
                  />
                </div>
              </Link>
            ))}
          </Marquee>
        </div>
      </section>

      <section className="mx-auto grid h-full max-w-7xl items-center gap-4 px-4 py-16">
        <div className="flex w-full flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full space-y-4 text-center">
            <h2 className="from-primary to-tertiary bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent lg:text-5xl">
              Our Products
            </h2>
            <p className="text-lg font-normal">
              <span className="font-semibold">
                Protect what matters to you:
              </span>{' '}
              Trusted by over 1 million Filipinos, we provide a wide
              <br />
              range of general insurance products tailored to your needs.
            </p>
          </div>
        </div>

        <div className="grid w-full items-center justify-between gap-4 md:grid-cols-5">
          {INSURANCES.slice(0, 5).map((product, index) => (
            <InsuranceCard key={index} {...product} />
          ))}
        </div>

        {/* View All Button */}
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            className="hover:bg-primary rounded-full border-2 px-8 py-6 text-base font-semibold transition-all hover:text-white"
            asChild
          >
            <Link href={`/${AGENT_CODE}/products`}>View All</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto h-full max-w-7xl px-4 py-16">
        {/* Header */}
        <div className="mb-12 space-y-4 text-center">
          <h2 className="from-primary to-tertiary bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent lg:text-5xl">
            Why Choose Us?
          </h2>
          <p className="mx-auto max-w-4xl text-lg font-semibold">
            We put people first. We're committed to doing the right thing, the
            right way. Choose Insurance for its simplicity and online ease,
            backed by more than 80 years of expertise. We lead with innovation
            and a commitment to you.
          </p>
        </div>

        {/* Feature Cards with Images */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Card 1 - People Who Trust Us */}
          <div className="group relative overflow-hidden rounded-2xl">
            <div className="relative h-80 w-full">
              <Image
                src="/images/choose/trust.png"
                alt="People Who Trust Us"
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>

          {/* Card 2 - Claims Settlement */}
          <div className="group relative overflow-hidden rounded-2xl">
            <div className="relative h-80 w-full">
              <Image
                src="/images/choose/claim-settlement.png"
                alt="Claims Settlement"
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>

          {/* Card 3 - Partner Network */}
          <div className="group relative overflow-hidden rounded-2xl">
            <div className="relative h-80 w-full">
              <Image
                src="/images/choose/partner.png"
                alt="Partner Network"
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>
        </div>
      </section>

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
                experiences from people who've trusted us to protect what
                matters most.
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

      <section className="mx-auto grid h-full max-w-7xl items-center gap-8 px-4 py-16">
        {/* Header */}
        <div className="space-y-4 text-center">
          <h2 className="from-primary to-tertiary bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent lg:text-5xl">
            News Room
          </h2>
          <p className="text-muted-foreground mx-auto max-w-3xl text-base">
            Stay informed with the latest updates, insights, and stories from
            us.
          </p>
        </div>

        {/* Blog Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {blogPosts.map((post, index) => (
            <BlogCard
              key={index}
              image={post.image}
              date={post.date}
              day={post.day}
              title={post.title}
              description={post.description}
              href={post.href}
            />
          ))}
        </div>

        {/* View All Button */}
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            className="hover:bg-primary rounded-full border-2 px-8 py-6 text-base font-semibold transition-all hover:text-white"
            asChild
          >
            <Link href="/coming-soon">View All</Link>
          </Button>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mx-auto h-full max-w-7xl px-4 py-16 pb-24">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left Side - Header */}
          <div className="space-y-6">
            <h2 className="from-primary to-tertiary bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent lg:text-5xl">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Find quick and reliable answers to the most frequently asked
              questions.
            </p>
            <Button
              variant="link"
              className="group flex items-center gap-2 !px-0 text-lg font-semibold"
              asChild
            >
              <Link href="/coming-soon">
                Read other FAQs
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          {/* Right Side - Accordion */}
          <div>
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="data-[state=open]:border-primary rounded-full border-2 border-gray-200 px-6 transition-colors"
                >
                  <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-base text-gray-600">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </div>
  )
}
