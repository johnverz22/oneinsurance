import { useGetProducts } from '@/app/data/queries/products'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'

export default function ProductsMainContent() {
  const [currPage, setCurrPage] = useState(1)

  const { data: products, isLoading, error } = useGetProducts()

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
            {products?.data?.data.map((product) => (
              <div
                key={product.id}
                className="flex flex-col justify-between rounded-2xl border p-5 transition-shadow duration-200 hover:shadow-md"
              >
                <div className="mb-1 flex items-start justify-between">
                  <h3 className="text-lg font-bold">{product.name}</h3>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      product.status.toLowerCase() === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-600'
                    }`}
                  >
                    {product.status.toUpperCase()}
                  </span>
                </div>

                <p className="mb-4 text-sm">{product.provider.name}</p>
                {/* <div className="mb-5 flex items-center gap-6 text-sm">
              <div>
                <span className="font-bold">Price: </span>
                <span className="text-muted-foreground">{product.price}</span>
              </div>
              <div>
                <span className="font-bold">Commission: </span>
                <span className="text-muted-foreground">
                  {product.commission}
                </span>
              </div>
            </div> */}

                {/* <div className="flex items-center gap-3">
              <span className="text-muted-foreground text-sm font-semibold">
                Assigned to:
              </span>
              <div className="flex -space-x-2">
                {product.assignedTo.map((initial, index) => (
                  <div
                    key={index}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-bold ${getAvatarColor(initial)}`}
                  >
                    {initial}
                  </div>
                ))}
              </div>
            </div> */}
              </div>
            ))}
          </div>
        </div>

        {/* Pagination - stays at bottom */}
        <div className="flex-shrink-0 pt-6">
          <div className="flex justify-end gap-2">
            {(() => {
              const links = products?.data.links ?? []

              // Separate prev/next from numbered pages
              const prevLink = links.find(
                (l: any) =>
                  l.label.includes('Previous') || l.label.includes('&laquo;')
              )
              const nextLink = links.find(
                (l: any) =>
                  l.label.includes('Next') || l.label.includes('&raquo;')
              )

              // Get only numbered page links
              const pageLinks = links.filter((l: any) => {
                const cleaned = l.label.replace(/[^0-9]/g, '')
                return cleaned !== '' && !isNaN(Number(cleaned))
              })

              // Find active page index
              const activePageIndex = pageLinks.findIndex((l: any) => l.active)
              const totalPages = pageLinks.length

              // Calculate which pages to show (5 pages max)
              const maxPagesToShow = 5
              let startIndex = Math.max(
                0,
                activePageIndex - Math.floor(maxPagesToShow / 2)
              )
              let endIndex = Math.min(totalPages, startIndex + maxPagesToShow)

              // Adjust if we're near the end
              if (endIndex - startIndex < maxPagesToShow) {
                startIndex = Math.max(0, endIndex - maxPagesToShow)
              }

              const visiblePages = pageLinks.slice(startIndex, endIndex)

              return (
                <>
                  {/* Previous button */}
                  {prevLink && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (prevLink.url) {
                          try {
                            const u = new URL(prevLink.url)
                            const p = u.searchParams.get('page')
                            p && setCurrPage(Number(p))
                          } catch (e) {}
                        }
                      }}
                      disabled={!prevLink.url}
                    >
                      «
                    </Button>
                  )}

                  {/* Page numbers */}
                  {visiblePages.map((linkObj: any, idx: number) => {
                    const { url, label: rawLabel, active } = linkObj
                    const cleanedLabel = rawLabel.replace(/[^0-9]/g, '')

                    let pageNum: number | null = null
                    try {
                      if (url) {
                        const u = new URL(url)
                        const p = u.searchParams.get('page')
                        pageNum = p ? Number(p) : null
                      }
                    } catch (e) {
                      pageNum = null
                    }

                    return (
                      <Button
                        key={`page-${cleanedLabel}-${idx}`}
                        variant={active ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => pageNum && setCurrPage(pageNum)}
                        disabled={!url}
                      >
                        {cleanedLabel}
                      </Button>
                    )
                  })}

                  {/* Next button */}
                  {nextLink && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (nextLink.url) {
                          try {
                            const u = new URL(nextLink.url)
                            const p = u.searchParams.get('page')
                            p && setCurrPage(Number(p))
                          } catch (e) {}
                        }
                      }}
                      disabled={!nextLink.url}
                    >
                      »
                    </Button>
                  )}
                </>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
