'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReportFilters } from '@/components/reports/report-filters'
import { MetricCard } from '@/components/reports/metric-card'
import { ChartCard } from '@/components/reports/chart-card'
import {
  BarChart3,
  FileText,
  Download,
  Calendar,
  TrendingUp,
} from 'lucide-react'
import type {
  Report,
  ReportFilter,
  ReportMetric,
  ChartData,
} from '@/types/report'

const generateMockReport = (filters: ReportFilter): Report => {
  const baseMetrics: ReportMetric[] = [
    {
      id: '1',
      title: 'Total Revenue',
      value: 2450000,
      change: 12.5,
      changeType: 'increase',
      icon: 'dollar',
      description: 'Total premium revenue collected',
    },
    {
      id: '2',
      title: 'Active Policies',
      value: 15420,
      change: 8.2,
      changeType: 'increase',
      icon: 'file',
      description: 'Currently active insurance policies',
    },
    {
      id: '3',
      title: 'New Clients',
      value: 1250,
      change: -3.1,
      changeType: 'decrease',
      icon: 'users',
      description: 'New clients acquired this period',
    },
    {
      id: '4',
      title: 'Claims Processed',
      value: 890,
      change: 15.7,
      changeType: 'increase',
      icon: 'alert',
      description: 'Total claims processed and resolved',
    },
  ]

  const baseCharts: ChartData[] = [
    {
      id: 'revenue-trend',
      title: 'Revenue Trend',
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Revenue',
            data: [380000, 420000, 390000, 450000, 480000, 520000],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
          },
        ],
      },
      description: 'Monthly revenue trend over time',
    },
    {
      id: 'policy-distribution',
      title: 'Policy Distribution',
      type: 'pie',
      data: {
        labels: ['Health', 'Life', 'Auto', 'Home', 'Business'],
        datasets: [
          {
            label: 'Policy',
            data: [35, 25, 20, 15, 5],
            backgroundColor: [
              '#3B82F6',
              '#10B981',
              '#F59E0B',
              '#EF4444',
              '#8B5CF6',
            ],
          },
        ],
      },
      description: 'Distribution of policies by type',
    },
    {
      id: 'claims-by-month',
      title: 'Claims by Month',
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Claims Filed',
            data: [120, 150, 180, 140, 160, 190],
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
          },
          {
            label: 'Claims Resolved',
            data: [110, 140, 170, 135, 155, 185],
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
          },
        ],
      },
      description: 'Monthly claims filed vs resolved',
    },
    {
      id: 'client-growth',
      title: 'Client Growth',
      type: 'area',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Total Clients',
            data: [12000, 12500, 13200, 13800, 14500, 15200],
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            fill: true,
          },
        ],
      },
      description: 'Cumulative client growth over time',
    },
  ]

  return {
    id: 'report-1',
    title: `${filters.reportType.charAt(0).toUpperCase() + filters.reportType.slice(1)} Report`,
    description: `Comprehensive ${filters.reportType} analytics for the selected time period`,
    type: filters.reportType,
    metrics: baseMetrics,
    charts: baseCharts,
    generatedAt: new Date().toISOString(),
    timeRange: filters.timeRange,
  }
}

export default function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilter>({
    timeRange: '30d',
    reportType: 'overview',
  })
  const [report, setReport] = useState<Report | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadReport = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const newReport = generateMockReport(filters)
    setReport(newReport)
    setIsLoading(false)
  }

  useEffect(() => {
    loadReport()
  }, [filters])

  const handleExport = () => {
    const dataStr = JSON.stringify(report, null, 2)
    const dataUri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
    const exportFileDefaultName = `report-${filters.reportType}-${new Date().toISOString().split('T')[0]}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const handleRefresh = () => {
    loadReport()
  }

  if (!report) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
            <p className="text-muted-foreground">Loading report...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive business insights and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button onClick={handleRefresh} disabled={isLoading}>
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      <ReportFilters
        filters={filters}
        onFiltersChange={setFilters}
        onExport={handleExport}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {report.title}
              </CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                {report.description}
              </p>
            </div>
            <div className="text-muted-foreground text-right text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Generated: {new Date(report.generatedAt).toLocaleString()}
              </div>
              <div className="mt-1">Time Range: {filters.timeRange}</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {report.metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard chart={report.charts[0]} />
            <ChartCard chart={report.charts[1]} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard chart={report.charts[2]} />
            <ChartCard chart={report.charts[3]} />
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4">
            <ChartCard chart={report.charts[0]} className="col-span-full" />
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Premium Collections</span>
                      <span className="font-semibold">$2,100,000</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Investment Income</span>
                      <span className="font-semibold">$250,000</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Other Revenue</span>
                      <span className="font-semibold">$100,000</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Health Insurance</span>
                      <span className="font-semibold">$850,000</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Life Insurance</span>
                      <span className="font-semibold">$620,000</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto Insurance</span>
                      <span className="font-semibold">$490,000</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard chart={report.charts[1]} />
            <Card>
              <CardHeader>
                <CardTitle>Policy Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Policies</span>
                    <span className="font-semibold">15,420</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">New Policies (This Month)</span>
                    <span className="font-semibold">1,250</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Renewed Policies</span>
                    <span className="font-semibold">890</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cancelled Policies</span>
                    <span className="font-semibold">120</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="claims" className="space-y-4">
          <ChartCard chart={report.charts[2]} className="col-span-full" />
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Claims Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Claims</span>
                    <span className="font-semibold">1,240</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Approved</span>
                    <span className="font-semibold text-green-600">890</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pending</span>
                    <span className="font-semibold text-yellow-600">250</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Rejected</span>
                    <span className="font-semibold text-red-600">100</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Average Processing Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-primary text-3xl font-bold">5.2</div>
                  <div className="text-muted-foreground text-sm">days</div>
                  <div className="mt-2 flex items-center justify-center gap-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">15% faster</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Claims Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-primary text-3xl font-bold">$1.8M</div>
                  <div className="text-muted-foreground text-sm">
                    total paid out
                  </div>
                  <div className="mt-2">
                    <span className="text-muted-foreground text-sm">
                      Avg: $2,025 per claim
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <ChartCard chart={report.charts[3]} className="col-span-full" />
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Client Demographics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Age 18-30</span>
                    <span className="font-semibold">25%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Age 31-45</span>
                    <span className="font-semibold">35%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Age 46-60</span>
                    <span className="font-semibold">30%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Age 60+</span>
                    <span className="font-semibold">10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Client Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-primary text-3xl font-bold">4.7</div>
                  <div className="text-muted-foreground text-sm">
                    out of 5.0
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-green-600">
                      +0.3 from last quarter
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
