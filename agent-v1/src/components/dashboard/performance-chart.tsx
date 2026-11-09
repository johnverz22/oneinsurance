'use client'

import { FC, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface PerformanceDataPoint {
  name: string
  sales: number
  clients: number
  rate: number
}

type PerformanceDataType = 'sales' | 'clients' | 'rate'

const performanceChartData: PerformanceDataPoint[] = [
  { name: 'Jan', sales: 4000, clients: 24, rate: 65 },
  { name: 'Feb', sales: 3000, clients: 13, rate: 70 },
  { name: 'Mar', sales: 5200, clients: 38, rate: 75 },
  { name: 'Apr', sales: 4800, clients: 39, rate: 80 },
  { name: 'May', sales: 6100, clients: 42, rate: 78 },
  { name: 'Jun', sales: 5800, clients: 35, rate: 85 },
]

export const PerformanceChart: FC = () => {
  const [dataType, setDataType] = useState<PerformanceDataType>('sales')

  return (
    <Card className="bg-card">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Performance</CardTitle>
        <div className="flex flex-wrap space-x-2">
          <Button
            variant={dataType === 'sales' ? 'default' : 'outline'}
            onClick={() => setDataType('sales')}
            className="h-auto px-3 py-1 text-xs"
          >
            Sales
          </Button>
          <Button
            variant={dataType === 'clients' ? 'default' : 'outline'}
            onClick={() => setDataType('clients')}
            className="h-auto px-3 py-1 text-xs"
          >
            Clients
          </Button>
          <Button
            variant={dataType === 'rate' ? 'default' : 'outline'}
            onClick={() => setDataType('rate')}
            className="h-auto px-3 py-1 text-xs"
          >
            Conversion
          </Button>
        </div>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={performanceChartData}
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="rgba(156, 163, 175, 0.3)"
            />
            <XAxis
              dataKey="name"
              tick={{ fill: 'rgb(107 114 128)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'rgb(107 114 128)' }}
              axisLine={false}
              tickLine={false}
              unit={dataType === 'rate' ? '%' : ''}
            />
            <Tooltip
              cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }}
              contentStyle={{
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(5px)',
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem',
                color: '#1f2937',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '14px' }} />
            <Bar
              dataKey={dataType}
              name={dataType.charAt(0).toUpperCase() + dataType.slice(1)}
              fill={
                dataType === 'sales'
                  ? '#3b82f6'
                  : dataType === 'clients'
                    ? '#10b981'
                    : '#a855f7'
              }
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
