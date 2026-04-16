import { InsuranceCard } from '@/components/insurance-card'
import Image from 'next/image'
import { COMPANIES } from '@/constants/companies'
import { INSURANCES } from '@/constants/insurances'
import { redirect } from 'next/navigation'

export default async function ProviderSynopsisPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: id } = await params

  const company = COMPANIES.find((company) => company.id === id)
  if (!company) {
    redirect('/')
  }

  // Strip any HTML tags from description as a simple sanitization
  const description = company.description.replace(/<[^>]*>/g, '')

  return (
    <div className="min-h-screen">
      {/* Banner Section */}
      <div className="bg-primary text-white">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
            {/* Company Name - Left Side */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="mb-4 text-4xl leading-tight font-bold lg:text-6xl">
                {company.companyName}
              </h1>
            </div>

            {/* Image - Right Side */}
            <div className="w-full bg-white lg:w-96 lg:flex-none">
              <div className="relative h-64 w-full transform overflow-hidden rounded-2xl shadow-2xl transition-transform duration-300 hover:scale-105 lg:h-80">
                <Image
                  src={company.image}
                  alt="GreenTech Solutions - Sustainable Technology"
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 384px"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Company Description Section */}
      <div className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-center text-3xl font-bold lg:text-4xl">
              About {company.companyName}
            </h2>
            <div className="w-full">
              <div>
                <p
                  className="mb-6 text-lg leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
