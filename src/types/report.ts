export type ReportType =
  | 'overview'
  | 'sales'
  | 'claims'
  | 'clients'
  | 'products'
  | 'financial'

export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all'

export type ChartType = 'line' | 'bar' | 'pie' | 'area'

export type ReportMetric = {
  id: string
  title: string
  value: string | number
  change: number
  changeType: 'increase' | 'decrease' | 'neutral'
  icon: string
  description?: string
}

export type ChartData = {
  id: string
  title: string
  type: ChartType
  data: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      backgroundColor?: string | string[]
      borderColor?: string
      fill?: boolean
    }[]
  }
  description?: string
}

export type Report = {
  id: string
  title: string
  description: string
  type: ReportType
  metrics: ReportMetric[]
  charts: ChartData[]
  generatedAt: string
  timeRange: TimeRange
}

export type ReportFilter = {
  timeRange: TimeRange
  reportType: ReportType
  dateFrom?: string
  dateTo?: string
  productCategory?: string
  clientStatus?: string
}
