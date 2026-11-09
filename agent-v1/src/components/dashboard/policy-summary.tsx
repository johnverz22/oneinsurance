import {
  CalendarClock,
  FileClock,
  LucideIcon,
  ShieldCheck,
  ShieldX,
} from 'lucide-react'
import { FC } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { useGetAgentStatistics } from '@/app/data/queries/statistics'
import { Skeleton } from '../ui/skeleton'

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

export const PolicySummary: FC = () => {
  const { data: statistics, isLoading } = useGetAgentStatistics()

  if (isLoading) {
    return (
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Policy Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-card flex-1 gap-2">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Policy Summary</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <SummaryCard
          icon={ShieldCheck}
          title="Active Policies"
          value={statistics?.active_policies ?? 0}
        />
        <SummaryCard
          icon={CalendarClock}
          title="Total Cases"
          value={statistics?.total_cases ?? 0}
        />
        <SummaryCard
          icon={FileClock}
          title="Pending Applications"
          value={statistics?.pending_applications ?? 0}
        />
        <SummaryCard
          icon={ShieldX}
          title="Conversion Rate"
          value={`${statistics?.conversion_rate ?? 0}%`}
        />
      </CardContent>
    </Card>
  )
}
