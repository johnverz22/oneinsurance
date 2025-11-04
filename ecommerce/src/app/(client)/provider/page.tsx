import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Marquee from 'react-fast-marquee'
import { Metadata } from 'next'
import { cn } from '@/lib/utils'
import { COMPANIES } from '@/constants/companies'

export const metadata: Metadata = {
  title: 'One Insurance | Providers',
  description: 'One Insurance',
}

export default function ProviderPage() {
  return (
    <div className="relative py-16 lg:py-24">
      <div className="mx-auto space-y-8">
        {/* Header */}
        <div className="mx-auto w-full max-w-7xl space-y-4 text-center">
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
        <Marquee
          autoFill
          pauseOnHover
          direction="right"
          className="mx-auto w-full max-w-7xl py-4"
        >
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

        <div className="grid gap-6">
          {COMPANIES.map((company, index) => (
            <Link
              key={company.id}
              href={`/provider/${company.id}`}
              className="group"
            >
              <div
                className={cn(
                  'flex transform cursor-pointer gap-3 p-6 transition-all duration-300 lg:p-8 xl:p-12',
                  {
                    'bg-muted-foreground/5 border-t border-b': index % 2 !== 1,
                  }
                )}
              >
                <div
                  className={cn(
                    'mx-auto flex w-full max-w-7xl flex-row-reverse',
                    {
                      'flex-row': index % 2 !== 1,
                    }
                  )}
                >
                  <div className="relative mb-4 h-20 w-full min-w-1/3 lg:h-24">
                    <Image
                      src={company.image}
                      alt={`${company.companyName} logo`}
                      fill
                      className="object-contain filter transition-all duration-300"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                    />
                  </div>
                  <p
                    className="text-left text-sm leading-tight font-semibold text-gray-800 transition-colors duration-300 group-hover:text-blue-600 lg:text-base"
                    dangerouslySetInnerHTML={{ __html: company.description }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Call to Action */}
        {/* <div className="mt-12 text-center lg:mt-16">
          <p className="mb-6 text-gray-600">
            Want to become a provider partner?
          </p>
          <Link
            href="/become-provider"
            className="inline-flex transform items-center rounded-full bg-blue-600 px-8 py-3 font-semibold text-white shadow-lg transition-colors duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-xl"
          >
            Join Our Network
            <svg
              className="ml-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div> */}
      </div>
    </div>
  )
}
