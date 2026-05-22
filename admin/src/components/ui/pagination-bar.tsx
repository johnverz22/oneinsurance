'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PaginationBarProps {
  currentPage: number
  lastPage: number
  total: number
  from?: number
  to?: number
  onPageChange: (page: number) => void
  showRowsSelect?: boolean
  rowsPerPage?: number
  onRowsPerPageChange?: (rows: number) => void
  rowOptions?: number[]
  className?: string
}

/**
 * PaginationBar — consistent pagination used across admin portal.
 * Matches the agent portal style: Rows select + << < 1 2 ... N > >>
 * Uses rounded-full circular buttons with green gradient on active page.
 */
export function PaginationBar({
  currentPage,
  lastPage,
  total,
  from,
  to,
  onPageChange,
  showRowsSelect = false,
  rowsPerPage = 10,
  onRowsPerPageChange,
  rowOptions = [5, 10, 15, 30, 50],
  className,
}: PaginationBarProps) {
  if (total === 0) return null

  // Smart page list with ellipsis (max 7 visible)
  const pageList = React.useMemo(() => {
    const pages: (number | -1)[] = []
    if (lastPage <= 7) {
      for (let i = 1; i <= lastPage; i++) pages.push(i)
    } else if (currentPage < 5) {
      pages.push(1, 2, 3, 4, 5, -1, lastPage)
    } else if (currentPage > lastPage - 4) {
      pages.push(1, -1, lastPage - 4, lastPage - 3, lastPage - 2, lastPage - 1, lastPage)
    } else {
      pages.push(1, -1, currentPage - 1, currentPage, currentPage + 1, -1, lastPage)
    }
    return pages
  }, [currentPage, lastPage])

  return (
    <div className={cn('flex flex-col items-center justify-between gap-4 border-t px-5 py-3 md:flex-row', className)}>
      {/* Left: showing info */}
      <div className="text-sm text-muted-foreground">
        {from !== undefined && to !== undefined
          ? `Showing ${from}–${to} of ${total} results`
          : `${total} results`}
      </div>

      {/* Right: rows select + page buttons */}
      <div className="flex items-center gap-3">
        {showRowsSelect && onRowsPerPageChange && (
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-600">Rows</p>
            <Select
              value={`${rowsPerPage}`}
              onValueChange={(v) => onRowsPerPageChange(Number(v))}
            >
              <SelectTrigger className="h-8 w-[70px] rounded-md text-sm">
                <SelectValue placeholder={rowsPerPage} />
              </SelectTrigger>
              <SelectContent side="top">
                {rowOptions.map((r) => (
                  <SelectItem key={r} value={`${r}`}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center gap-1">
          {/* << first */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 rounded-full p-0"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            {'<<'}
          </Button>
          {/* < prev */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 rounded-full p-0"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page numbers */}
          {pageList.map((p, i) =>
            p === -1 ? (
              <span key={`ellipsis-${i}`} className="px-1 text-gray-400">…</span>
            ) : (
              <Button
                key={p}
                variant={currentPage === p ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(p)}
                className={cn('h-8 w-8 rounded-full p-0 text-sm', {
                  'from-primary to-accent bg-gradient-to-r text-white border-transparent': currentPage === p,
                })}
              >
                {p}
              </Button>
            )
          )}

          {/* > next */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 rounded-full p-0"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === lastPage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {/* >> last */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 rounded-full p-0"
            onClick={() => onPageChange(lastPage)}
            disabled={currentPage === lastPage}
          >
            {'>>'}
          </Button>
        </div>
      </div>
    </div>
  )
}
