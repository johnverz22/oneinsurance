'use client'

import type { ChartData } from '@/types/report'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Chart } from '@/components/ui/chart'

interface ChartCardProps {
  chart: ChartData
  className?: string
}

export function ChartCard({ chart, className }: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{chart.title}</CardTitle>
        {chart.description && (
          <p className="text-muted-foreground text-sm">{chart.description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-max">
          <Chart type={chart.type} data={chart.data} />
        </div>
      </CardContent>
    </Card>
  )
}
