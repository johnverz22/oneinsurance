import {
  CalendarClock,
  FileClock,
  LucideIcon,
  ShieldCheck,
  ShieldX,
} from 'lucide-react'
import { FC } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

const policySummaryData = {
  active: 124,
  renewals: 18,
  pending: 5,
  expired: 2,
}

interface SummaryCardProps {
  title: string
  value: number | string
  icon?: LucideIcon
}

export const SummaryCard: FC<SummaryCardProps> = ({
  icon: Icon,
  title,
  value,
}) => (
  <Card className="bg-card flex-1 gap-2">
    <CardHeader>
      <CardTitle className="flex flex-wrap items-center gap-2 text-base font-bold text-[#B4975A]">
        {Icon && <Icon className="size-6 shrink-0" />} {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="flex items-end justify-end">
      <p className="text-2xl font-bold lg:text-3xl">{value}</p>
    </CardContent>
  </Card>
)

export const PolicySummary: FC = () => (
  <Card className="bg-card">
    <CardHeader>
      <CardTitle>Policy Summary</CardTitle>
    </CardHeader>
    <CardContent className="grid grid-cols-2 gap-4">
      <SummaryCard
        icon={ShieldCheck}
        title="Active Policies"
        value={policySummaryData.active}
      />
      <SummaryCard
        icon={CalendarClock}
        title="Upcoming Renewals"
        value={policySummaryData.renewals}
      />
      <SummaryCard
        icon={FileClock}
        title="Pending Applications"
        value={policySummaryData.pending}
      />
      <SummaryCard
        icon={ShieldX}
        title="Expired / Lapsed"
        value={policySummaryData.expired}
      />
    </CardContent>
  </Card>
)
