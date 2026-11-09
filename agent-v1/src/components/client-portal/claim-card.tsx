'use client'

import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader } from '../ui/card'
import ClaimStatusBadge from './claim-status-badge'

interface ClaimCardProps {
  policyName: string
  platform: string
  claimId: string
  status:
    | 'submitted'
    | 'under-review'
    | 'additional-info'
    | 'in-process'
    | 'approved'
    | 'denied'
    | 'settled'
    | 'closed'
  policyNumber: string
  dateFiled: Date
  incidentDate: Date
  claimAmount: number
}

export default function ClaimCard({
  policyName,
  platform,
  claimId,
  status,
  policyNumber,
  dateFiled,
  incidentDate,
  claimAmount,
}: ClaimCardProps) {
  const handleClaimCardClick = () => {
    toast.info('Under Contruction')
  }

  return (
    <Card
      className="cursor-pointer filter hover:brightness-95"
      onClick={handleClaimCardClick}
    >
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div>
            <p className="text-xl font-extrabold">{policyName}</p>
            <p className="text-base text-gray-700">{platform}</p>
          </div>
          <div>
            {/* Claim number */}
            <p className="font-bold">{claimId}</p>
          </div>
          <ClaimStatusBadge variant={status} />
        </div>
        <div className="w-full gap-2">
          <ClaimDetail label="Policy Number" value={policyNumber} />
          <ClaimDetail
            label="Date Filed"
            value={dateFiled.toLocaleDateString()}
          />
          <ClaimDetail
            label="Incident Date"
            value={incidentDate.toLocaleDateString()}
          />
          <ClaimDetail
            label="Claim Amount"
            value={`PHP ${claimAmount.toLocaleString()}`}
          />
        </div>
      </CardContent>
    </Card>
  )
}

const ClaimDetail = ({ label, value }: { label: string; value: string }) => (
  <div className="flex w-full items-center justify-between border-b-1 border-gray-500 p-2">
    <p className="font-bold">{label}</p>
    <p>{value}</p>
  </div>
)
