type ClaimStatusBadgeProps = {
  variant:
    | 'submitted'
    | 'under-review'
    | 'additional-info'
    | 'in-process'
    | 'approved'
    | 'denied'
    | 'settled'
    | 'closed'
}

export default function ClaimStatusBadge({ variant }: ClaimStatusBadgeProps) {
  switch (variant) {
    case 'submitted':
      return (
        <div className="w-fit rounded-full bg-blue-600 px-4 text-white capitalize">
          Submitted
        </div>
      )
    case 'under-review':
      return (
        <div className="w-fit rounded-full bg-yellow-600 px-4 text-white capitalize">
          Under Review
        </div>
      )
    case 'additional-info':
      return (
        <div className="w-fit rounded-full bg-orange-600 px-4 text-white capitalize">
          Additional Information Requested
        </div>
      )
    case 'in-process':
      return (
        <div className="w-fit rounded-full bg-purple-600 px-4 text-white capitalize">
          In Process
        </div>
      )
    case 'approved':
      return (
        <div className="w-fit rounded-full bg-green-600 px-4 text-white capitalize">
          Approved
        </div>
      )
    case 'denied':
      return (
        <div className="w-fit rounded-full bg-red-600 px-4 text-white capitalize">
          Denied
        </div>
      )
    case 'settled':
      return (
        <div className="w-fit rounded-full bg-teal-600 px-4 text-white capitalize">
          Settled
        </div>
      )
    case 'closed':
      return (
        <div className="w-fit rounded-full bg-gray-600 px-4 text-white capitalize">
          Closed
        </div>
      )
  }
}
