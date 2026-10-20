'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ReportFilter, TimeRange, ReportType } from '@/types/report'
import { Calendar, Download, RefreshCw, Filter } from 'lucide-react'

interface ReportFiltersProps {
  filters: ReportFilter
  onFiltersChange: (filters: ReportFilter) => void
  onExport: () => void
  onRefresh: () => void
  isLoading?: boolean
}

export function ReportFilters({
  filters,
  onFiltersChange,
  onExport,
  onRefresh,
  isLoading,
}: ReportFiltersProps) {
  const timeRanges = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' },
    { value: 'all', label: 'All time' },
  ]

  const reportTypes = [
    { value: 'overview', label: 'Overview' },
    { value: 'sales', label: 'Sales' },
    { value: 'claims', label: 'Claims' },
    { value: 'clients', label: 'Clients' },
    { value: 'products', label: 'Products' },
    { value: 'financial', label: 'Financial' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Report Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <div className="w-full space-y-2">
            <Label>Time Range</Label>
            <Select
              value={filters.timeRange}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, timeRange: value as TimeRange })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full space-y-2">
            <Label>Report Type</Label>
            <Select
              value={filters.reportType}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, reportType: value as ReportType })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>From Date</Label>
            <div className="relative">
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) =>
                  onFiltersChange({ ...filters, dateFrom: e.target.value })
                }
              />
              <Calendar className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>To Date</Label>
            <div className="relative">
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) =>
                  onFiltersChange({ ...filters, dateTo: e.target.value })
                }
              />
              <Calendar className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform" />
            </div>
          </div>

          <div className="flex h-11 w-full gap-2">
            <Button
              variant="outline"
              className="h-full"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
            <Button variant="outline" className="h-full" onClick={onExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
