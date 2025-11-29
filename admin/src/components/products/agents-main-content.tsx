export default function AgentsMainContent() {
  const agents = [
    {
      id: 1,
      name: 'John Santos',
      email: 'john.santos@gmail.com',
      role: 'Senior Agent',
      location: 'Metro Manila',
      commission: '₱ 2,450,000',
      status: 'Active',
      assignedProducts: ['Travel Insurance', 'Medical/Health'],
    },
    {
      id: 2,
      name: 'Maria Garcia',
      email: 'maria.garcia@gmail.com',
      role: 'Agent',
      location: 'Cebu',
      commission: '₱ 1,890,000',
      status: 'Active',
      assignedProducts: ['Travel Insurance', 'General Lines'],
    },
    {
      id: 3,
      name: 'Carlos Rodriguez',
      email: 'carlos.rodriguez@gmail.com',
      role: 'Senior Agent',
      location: 'Davao',
      commission: '₱ 3,120,000',
      status: 'Active',
      assignedProducts: ['General Lines'],
    },
    {
      id: 4,
      name: 'Anna Reyes',
      email: 'annareyes@gmail.com',
      role: 'Senior Agent',
      location: 'Metro Manila',
      commission: '₱ 3,000,000',
      status: 'Inactive',
      assignedProducts: ['Travel Insurance'],
    },
    {
      id: 5,
      name: 'Jasper Rivera',
      email: 'jasperrivera@gmail.com',
      role: 'Overrider',
      location: 'Ilocos Sur',
      commission: '₱ 2,120,000',
      status: 'Active',
      assignedProducts: ['General Lines'],
    },
    {
      id: 6,
      name: 'Roberto Cruz',
      email: 'robertocruz@gmail.com',
      role: 'Senior Agent',
      location: 'Tagaytay',
      commission: '₱ 1,000,000',
      status: 'Inactive',
      assignedProducts: [], // Assuming empty if Assigned to: is blank in design
    },
    {
      id: 7,
      name: 'Juan Miguel',
      email: 'juanmiguel@gmail.com',
      role: 'Senior Agent',
      location: 'Davao',
      commission: '₱ 3,120,000',
      status: 'Active',
      assignedProducts: ['Travel Insurance'],
    },
    {
      id: 8,
      name: 'Clarisse Valdez',
      email: 'clarissevaldez@gmail.com',
      role: 'Overrider',
      location: 'Metro Manila',
      commission: '₱ 3,000,000',
      status: 'Inactive',
      assignedProducts: [],
    },
  ]

  return (
    <div className="relative z-10 -mt-[1px] min-h-[600px] rounded-tl-none rounded-tr-3xl rounded-b-3xl border border-t-0 p-6 shadow-sm md:p-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h2 className="text-xl font-bold">Agents & Teams</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage product assignments across your agents and teams to
            streamline operations.
          </p>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="flex h-full flex-col rounded-2xl border p-6 transition-shadow duration-200 hover:shadow-md"
          >
            {/* Header: Name + Status */}
            <div className="mb-1 flex items-start justify-between">
              <h3 className="text-lg font-bold">{agent.name}</h3>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  agent.status === 'Active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-50 text-red-500'
                }`}
              >
                {agent.status}
              </span>
            </div>

            {/* Email */}
            <p className="mb-3 text-sm font-normal text-gray-400">
              {agent.email}
            </p>

            {/* Role / Location / Commission Row */}
            <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="font-semibold">{agent.role}</span>
              <span className="hidden sm:inline">•</span>
              <span>{agent.location}</span>
              <span className="hidden sm:inline">•</span>
              <span>Commission: {agent.commission}</span>
            </div>

            {/* Assigned Products Section */}
            <div className="mt-auto flex items-start gap-3 sm:items-center">
              <span className="pt-1 text-sm font-medium whitespace-nowrap sm:pt-0">
                Assigned to:
              </span>
              <div className="flex flex-wrap gap-2">
                {agent.assignedProducts.length > 0 ? (
                  agent.assignedProducts.map((prod, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600"
                    >
                      {prod}
                    </span>
                  ))
                ) : (
                  <span className="pt-1 text-xs text-gray-400 italic sm:pt-0">
                    No assignments
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
