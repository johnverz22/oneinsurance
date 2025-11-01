'use client'

import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import { Card, CardContent } from '@/components/ui/card'
import { Application } from '@/types/application'
import { cn } from '@/lib/utils'

const APPLICATIONS: Application[] = [
  {
    id: '1',
    name: 'John Doe',
    type: 'Life',
    submittedDate: new Date('2025-07-10'),
    status: 'Pending',
  },
  {
    id: '2',
    name: 'Jane Smith',
    type: 'Health',
    submittedDate: new Date('2025-07-12'),
    status: 'Approved',
  },
  {
    id: '3',
    name: 'Carlos Reyes',
    type: 'Business',
    submittedDate: new Date('2025-07-14'),
    status: 'Rejected',
  },
  {
    id: '4',
    name: 'Angela Cruz',
    type: 'Travel',
    submittedDate: new Date('2025-07-18'),
    status: 'In Review',
  },
  {
    id: '5',
    name: 'Robert Chan',
    type: 'Life',
    submittedDate: new Date('2025-07-20'),
    status: 'Pending',
  },
  {
    id: '6',
    name: 'Mia Lim',
    type: 'CPTL',
    submittedDate: new Date('2025-07-22'),
    status: 'Approved',
  },
  {
    id: '7',
    name: 'Liam Tan',
    type: 'Health',
    submittedDate: new Date('2025-07-25'),
    status: 'Pending',
  },
  {
    id: '8',
    name: 'Sophia Torres',
    type: 'Business',
    submittedDate: new Date('2025-07-28'),
    status: 'In Review',
  },
  {
    id: '9',
    name: 'Ethan Ramos',
    type: 'Travel',
    submittedDate: new Date('2025-08-01'),
    status: 'Approved',
  },
  {
    id: '10',
    name: 'Isabella Perez',
    type: 'Life',
    submittedDate: new Date('2025-08-03'),
    status: 'Rejected',
  },
  {
    id: '11',
    name: 'Noah Dizon',
    type: 'CPTL',
    submittedDate: new Date('2025-08-05'),
    status: 'In Review',
  },
  {
    id: '12',
    name: 'Ava Mendoza',
    type: 'Health',
    submittedDate: new Date('2025-08-07'),
    status: 'Approved',
  },
]

const applicationColumns: ColumnDef<Application>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'type', header: 'Type' },
  {
    accessorKey: 'submittedDate',
    header: 'Submitted Date',
    cell: ({ row }) =>
      new Date(row.original.submittedDate).toLocaleDateString(),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status
      const color =
        status === 'Approved'
          ? { text: 'text-green-600', bg: 'bg-green-600' }
          : status === 'In Review'
            ? { text: 'text-yellow-600', bg: 'bg-yellow-600' }
            : status === 'Pending'
              ? { text: 'text-blue-600', bg: 'bg-blue-600' }
              : { text: 'text-red-600', bg: 'bg-red-600' }
      return (
        <div className="flex items-center gap-2">
          <div className={cn('size-2.5 rounded-full', color.bg)} />
          <span className={color.text}>{status.toUpperCase()}</span>
        </div>
      )
    },
  },
]

export default function ApplicationsPage() {
  return (
    <div className="relative mx-auto w-full space-y-6">
      {/* Header */}
      <header className="mb-8 flex flex-col items-start justify-between sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Applications</h1>
        </div>
      </header>

      <Card className="bg-background shadow-sm">
        <CardContent className="p-6">
          <DataTable<Application, unknown>
            columns={applicationColumns}
            data={APPLICATIONS}
            searchKey="name"
            enableRowSelection
            actions={[
              {
                label: 'View Details',
                onClick: (client) => alert(`Viewing ${client.id}`),
              },
              {
                label: 'Delete',
                variant: 'destructive',
                onClick: (client) => alert(`Deleting ${client.name}`),
              },
            ]}
            onRowClick={(client) => console.log('Clicked row:', client)}
            pageSize={5}
          />
        </CardContent>
      </Card>
    </div>
  )
}
