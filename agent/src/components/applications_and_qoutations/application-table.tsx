'use client'

import { Application } from '@/types/application'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { useState } from 'react'

interface ApplicationTableProps {
  data: Application[]
  columns: ColumnDef<Application>[]
}

export default function ApplicationTable({
  data,
  columns,
}: ApplicationTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const applicationsTable = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      pagination,
    },
  })

  return (
    <>
      <Table className="bg-card rounded-md p-4">
        <TableHeader>
          {applicationsTable.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {applicationsTable.getRowModel().rows?.length ? (
            applicationsTable.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination className="justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => {
                if (applicationsTable.getCanPreviousPage())
                  applicationsTable.previousPage()
              }}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">{pagination.pageIndex + 1}</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>{applicationsTable.getPageCount()}</PaginationItem>
          <PaginationItem>
            <PaginationNext
              onClick={() => {
                if (applicationsTable.getCanNextPage()) {
                  applicationsTable.nextPage()
                }
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </>
  )
}
