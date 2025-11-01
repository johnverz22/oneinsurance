import Link from 'next/link'
import Image from 'next/image'
import { CATEGORIES } from '@/constants/categories'
import { INSURANCES } from '@/constants/insurances'
import { InsuranceCompany } from '@/types/insurance-company'

export default function ProductsPage() {
  const companyId = 'malayan-insurance' satisfies InsuranceCompany['id']
  const insurancesByTenant = INSURANCES.filter(
    (insurance) => insurance.companyId === companyId
  )

  const groupedInsurances = Object.groupBy(
    insurancesByTenant,
    (item) => item.categoryId
  )

  return (
    <div className="relative h-full w-full">
      <h2 className="pb-8 text-2xl lg:text-3xl">Product Management</h2>
      {Object.entries(groupedInsurances).map(([group, insurances]) => {
        const groupName = CATEGORIES.find(
          (category) => category.id === group
        )!.title

        return (
          <div key={group} className="space-y-3">
            <div>
              <h1 className="text-lg">{groupName}</h1>
              <p className="text-muted-foreground w-full text-sm lg:w-2/5">
                Lorem ipsum dolor, sit amet consectetur adipisicing elit. Itaque
                repellendus ipsum aliquam voluptas praesentium iste doloribus
                fugiat perferendis amet tempora
              </p>
            </div>

            <div className="flex h-max w-full flex-wrap items-center justify-start gap-4 py-4">
              {insurances!.map((insurance, index) => (
                <div
                  key={index}
                  className="bg-background border-muted-foreground/10 relative m-auto flex h-64 max-w-7/12 min-w-64 flex-1 flex-col rounded-md border py-4 shadow-lg lg:px-3"
                >
                  <Image
                    src={insurance.image}
                    alt={insurance.title}
                    className="h-full object-contain object-center"
                    width={480}
                    height={480}
                  />

                  <Link
                    href={`/product-management/${insurance.id}`}
                    className="h-max py-2 underline-offset-8 hover:underline"
                  >
                    <h2 className="text-md font-semibold text-gray-900 dark:text-gray-100">
                      {insurance.title}
                    </h2>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
