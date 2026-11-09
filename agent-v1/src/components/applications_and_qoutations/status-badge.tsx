import { ApplicationStatus } from '@/types/application'
import { QuoteStatus } from '@/types/quotation'
import { Badge } from '../ui/badge'

export default function StatusBadge({
  status,
}: {
  status: ApplicationStatus | QuoteStatus
}) {
  switch (status) {
    case 'Pending':
      return <Badge className="bg-orange-500">{status}</Badge>
    case 'Approved':
      return <Badge className="bg-green-500">{status}</Badge>
    case 'In Review':
      return <Badge className="bg-purple-500">{status}</Badge>
    case 'Rejected':
      return <Badge className="bg-red-500">{status}</Badge>
    case 'Sent':
      return <Badge className="bg-blue-500">{status}</Badge>
    case 'Accepted':
      return <Badge className="bg-teal-500">{status}</Badge>
    case 'Expired':
      return <Badge className="bg-gray-500">{status}</Badge>
    case 'Draft':
      return <Badge className="bg-yellow-500">{status}</Badge>
    default:
      return <Badge className="bg-amber-50">{status}</Badge>
  }
}
