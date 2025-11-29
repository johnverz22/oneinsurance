import { useGetProducts } from '@/app/data/queries/products'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { ProductAssignment } from '@/types/products'

interface ProductsMainContentProps {
  productAssignments: ProductAssignment[]
}

export default function ProductsMainContent({
  productAssignments,
}: ProductsMainContentProps) {
  return (
    <div className="relative z-10 min-h-screen rounded-tl-none rounded-tr-3xl rounded-b-3xl border border-t-0 p-6 shadow-sm md:p-8">
      {/* Section Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h2 className="text-xl font-bold">Insurance Products</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage and organize all available insurance products for easy
            assignment and monitoring.
          </p>
        </div>
        <div className="relative min-w-[200px]">
          <button className="text-muted-foreground w-full rounded-full border border-gray-300 px-4 py-2 pr-10 text-left text-sm focus:ring-1 focus:ring-green-500 focus:outline-none">
            Select Category
          </button>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronDown className="text-muted-foreground h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Cards Grid Container */}
      <div
        className="flex min-h-0 flex-col"
        style={{ height: 'calc(100vh - 200px)' }}
      >
        {/* Scrollable Cards Area */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {productAssignments?.map((assignment) => (
              <div
                key={assignment.product.id}
                className="flex flex-col justify-between rounded-2xl border p-5 transition-shadow duration-200 hover:shadow-md"
              >
                <div className="mb-1 flex items-start justify-between">
                  <h3 className="text-lg font-bold">
                    {assignment.product.name}
                  </h3>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      assignment.product.status.toLowerCase() === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-600'
                    }`}
                  >
                    {assignment.product.status.toUpperCase()}
                  </span>
                </div>

                <p className="mb-4 text-sm">
                  {assignment.product.provider.name}
                </p>
                <div className="mb-5 flex items-center gap-6 text-sm">
                  <div>
                    <span className="font-bold">Price: </span>
                    <span className="text-muted-foreground">
                      {assignment.product.price}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold">Commission: </span>
                    <span className="text-muted-foreground">
                      {`${assignment.commission_rate}%`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground text-sm font-semibold">
                    Assigned to:
                  </span>
                  <div className="flex -space-x-2">
                    {assignment.agents.map((agent, index) => (
                      <div
                        key={index}
                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 bg-blue-300 text-xs font-bold`}
                        title={agent.first_name + ' ' + agent.last_name}
                      >
                        {agent.first_name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
