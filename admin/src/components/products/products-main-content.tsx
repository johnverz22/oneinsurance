import { ChevronDown } from 'lucide-react'

export default function ProductsMainContent() {
  // Mock data based on the provided image
  const products = [
    {
      id: 1,
      title: 'Travel Insurance',
      company: 'Oona',
      price: '₱ 50,000',
      commission: '30%',
      status: 'Active',
      assignedTo: ['J', 'S'],
      type: 'travel',
    },
    {
      id: 2,
      title: 'General Lines',
      company: 'Oona',
      price: '₱ 25,000',
      commission: '25%',
      status: 'Active',
      assignedTo: ['J', 'M', 'C'],
      type: 'general',
    },
    {
      id: 3,
      title: 'Travel Insurance',
      company: 'Malayan',
      price: '₱ 15,000',
      commission: '20%',
      status: 'Active',
      assignedTo: ['K'],
      type: 'travel',
    },
    {
      id: 4,
      title: 'Medical/Health',
      company: 'Oona',
      price: '₱ 25,000',
      commission: '25%',
      status: 'Draft',
      assignedTo: ['Y', 'L', 'R'],
      type: 'health',
    },
    {
      id: 5,
      title: 'Travel Insurance',
      company: 'Pacific Cross',
      price: '₱ 30,000',
      commission: '10%',
      status: 'Active',
      assignedTo: ['V'],
      type: 'travel',
    },
    {
      id: 6,
      title: 'Medical/Health',
      company: 'Pacific Cross',
      price: '₱ 25,000',
      commission: '25%',
      status: 'Active',
      assignedTo: ['J', 'M', 'C'],
      type: 'health',
    },
    {
      id: 7,
      title: 'General Lines',
      company: 'Oona',
      price: '₱ 50,000',
      commission: '30%',
      status: 'Active',
      assignedTo: ['J', 'S'],
      type: 'general',
    },
    {
      id: 8,
      title: 'General Lines',
      company: 'MICO (Malayan Insurance Corporation)',
      price: '₱ 15,000',
      commission: '20%',
      status: 'Active',
      assignedTo: ['K'],
      type: 'general',
    },
  ]

  // Helper to get background color for avatar
  const getAvatarColor = (initial: string): string => {
    const colors: Record<string, string> = {
      J: 'bg-blue-100 text-blue-600',
      S: 'bg-indigo-100 text-indigo-600',
      M: 'bg-sky-100 text-sky-600',
      C: 'bg-blue-100 text-blue-600',
      K: 'bg-blue-100 text-blue-600',
      Y: 'bg-blue-100 text-blue-600',
      L: 'bg-sky-100 text-sky-600',
      R: 'bg-indigo-100 text-indigo-600',
      V: 'bg-blue-100 text-blue-600',
    }
    return colors[initial] || 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="relative z-10 -mt-[1px] min-h-[600px] rounded-tl-none rounded-tr-3xl rounded-b-3xl border border-t-0 border-gray-100 bg-white p-6 shadow-sm md:p-8">
      {/* Section Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Insurance Products
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage and organize all available insurance products for easy
            assignment and monitoring.
          </p>
        </div>

        <div className="relative min-w-[200px]">
          <button className="w-full rounded-full border border-gray-300 bg-white px-4 py-2 pr-10 text-left text-sm text-gray-500 focus:ring-1 focus:ring-green-500 focus:outline-none">
            Select Category
          </button>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 transition-shadow duration-200 hover:shadow-md"
          >
            <div className="mb-1 flex items-start justify-between">
              <h3 className="text-lg font-bold text-slate-800">
                {product.title}
              </h3>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  product.status === 'Active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-orange-100 text-orange-600'
                }`}
              >
                {product.status}
              </span>
            </div>

            <p className="mb-4 text-sm text-gray-500">{product.company}</p>

            <div className="mb-5 flex items-center gap-6 text-sm">
              <div>
                <span className="font-bold text-slate-800">Price: </span>
                <span className="text-gray-600">{product.price}</span>
              </div>
              <div>
                <span className="font-bold text-slate-800">Commission: </span>
                <span className="text-gray-600">{product.commission}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-700">
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
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
