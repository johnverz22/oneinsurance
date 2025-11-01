import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { COMPANIES } from '@/constants/companies'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'One Insurance | Providers',
  description: 'One Insurance',
}

export default function ProviderPage() {
  return (
    <div className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center lg:mb-16">
          <h2 className="mb-4 text-3xl font-bold lg:text-4xl">
            Our Trusted Providers
          </h2>
          <p className="mx-auto max-w-3xl text-xl">
            Partner with industry-leading companies that deliver exceptional
            solutions and services
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 lg:gap-8">
          {COMPANIES.map((company) => (
            <Link
              key={company.id}
              href={`/provider/${company.id}`}
              className="group"
            >
              <div className="transform cursor-pointer rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl lg:p-8">
                <div className="relative mb-4 h-20 w-full lg:h-24">
                  <Image
                    src={company.image}
                    alt={`${company.companyName} logo`}
                    fill
                    className="object-contain grayscale filter transition-all duration-300 group-hover:grayscale-0"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                  />
                </div>
                <h3 className="text-center text-sm leading-tight font-semibold text-gray-800 transition-colors duration-300 group-hover:text-blue-600 lg:text-base">
                  {company.companyName}
                </h3>
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
