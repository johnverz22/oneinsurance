'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Client, ClientStatus } from '@/types/client'
import { ColumnDef } from '@tanstack/react-table'
import { createSortableHeader, DataTable } from '@/components/ui/data-table'
import { cn } from '@/lib/utils'
import { SummaryCard } from '@/components/dashboard/policy-summary'

const mockClients: Client[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    dateOfBirth: new Date('1990-05-14T00:00:00Z'),
    phone: '+63 912 347 6893',
    idType: 'PhilHealth ID',
    idNumber: 'PH-123456789',
    address: {
      street: 'Lapu',
      state: 'Cebu',
      city: 'Mandaue',
      country: 'PH',
      zipCode: '0000',
    },
    status: 'pending',
    occupation: 'Software Engineer',
    annualIncome: 75000,
  },
  {
    id: '2',
    firstName: 'Maria',
    lastName: 'Santos',
    email: 'maria.santos@email.com',
    dateOfBirth: new Date('1990-05-14T00:00:00Z'),
    phone: '+63 917 223 1456',
    idType: 'National ID',
    idNumber: 'NID-9087654321',
    address: {
      street: 'Lapu',
      state: 'Batangas',
      city: 'Lipa',
      country: 'PH',
      zipCode: '0000',
    },
    status: 'approved',
    occupation: 'Software Engineer',
    annualIncome: 75000,
  },
  {
    id: '3',
    firstName: 'Carlos',
    lastName: 'Reyes',
    email: 'carlos.reyes@email.com',
    dateOfBirth: new Date('1990-05-14T00:00:00Z'),
    phone: '+63 927 888 1145',
    idType: 'Driver’s License',
    idNumber: 'DLN-55667788',
    address: {
      street: 'Lapu',
      state: 'Davao del Sur',
      city: 'Davao City',
      country: 'PH',
      zipCode: '0000',
    },
    status: 'rejected',
    occupation: 'Software Engineer',
    annualIncome: 75000,
  },
  {
    id: '4',
    firstName: 'Angela',
    lastName: 'Tan',
    email: 'angela.tan@email.com',
    dateOfBirth: new Date('1990-05-14T00:00:00Z'),
    phone: '+63 915 554 2289',
    idType: 'Passport',
    idNumber: 'P-99887766',
    address: {
      street: 'Lapu',
      state: 'Davao del Sur',
      city: 'Davao City',
      country: 'PH',
      zipCode: '0000',
    },
    status: 'approved',
    occupation: 'Software Engineer',
    annualIncome: 75000,
  },
  {
    id: '5',
    firstName: 'Rafael',
    lastName: 'Cruz',
    email: 'rafael.cruz@email.com',
    dateOfBirth: new Date('1990-05-14T00:00:00Z'),
    phone: '+63 916 332 4421',
    idType: 'National ID',
    idNumber: 'NID-3344556677',
    address: {
      street: 'Lapu',
      state: 'Cebu',
      city: 'Mandaue',
      country: 'PH',
      zipCode: '0000',
    },
    status: 'pending',
    occupation: 'Software Engineer',
    annualIncome: 75000,
  },
  {
    id: '6',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    dateOfBirth: new Date('1990-05-14T00:00:00Z'),
    phone: '+63 912 347 6893',
    idType: 'PhilHealth ID',
    idNumber: 'PH-123456789',
    address: {
      street: 'Lapu',
      state: 'Cebu',
      city: 'Mandaue',
      country: 'PH',
      zipCode: '0000',
    },
    status: 'pending',
    occupation: 'Software Engineer',
    annualIncome: 75000,
  },
  {
    id: '7',
    firstName: 'Maria',
    lastName: 'Santos',
    email: 'maria.santos@email.com',
    dateOfBirth: new Date('1990-05-14T00:00:00Z'),
    phone: '+63 917 223 1456',
    idType: 'National ID',
    idNumber: 'NID-9087654321',
    address: {
      street: 'Lapu',
      state: 'Batangas',
      city: 'Lipa',
      country: 'PH',
      zipCode: '0000',
    },
    status: 'approved',
    occupation: 'Software Engineer',
    annualIncome: 75000,
  },
  {
    id: '8',
    firstName: 'Carlos',
    lastName: 'Reyes',
    email: 'carlos.reyes@email.com',
    dateOfBirth: new Date('1990-05-14T00:00:00Z'),
    phone: '+63 927 888 1145',
    idType: 'Driver’s License',
    idNumber: 'DLN-55667788',
    address: {
      street: 'Lapu',
      state: 'Davao del Sur',
      city: 'Davao City',
      country: 'PH',
      zipCode: '0000',
    },
    status: 'rejected',
    occupation: 'Software Engineer',
    annualIncome: 75000,
  },
  {
    id: '9',
    firstName: 'Angela',
    lastName: 'Tan',
    email: 'angela.tan@email.com',
    dateOfBirth: new Date('1990-05-14T00:00:00Z'),
    phone: '+63 915 554 2289',
    idType: 'Passport',
    idNumber: 'P-99887766',
    address: {
      street: 'Lapu',
      state: 'Davao del Sur',
      city: 'Davao City',
      country: 'PH',
      zipCode: '0000',
    },
    status: 'approved',
    occupation: 'Software Engineer',
    annualIncome: 75000,
  },
  {
    id: '10',
    firstName: 'Rafael',
    lastName: 'Cruz',
    email: 'rafael.cruz@email.com',
    dateOfBirth: new Date('1990-05-14T00:00:00Z'),
    phone: '+63 916 332 4421',
    idType: 'National ID',
    idNumber: 'NID-3344556677',
    address: {
      street: 'Lapu',
      state: 'Cebu',
      city: 'Mandaue',
      country: 'PH',
      zipCode: '0000',
    },
    status: 'pending',
    occupation: 'Software Engineer',
    annualIncome: 75000,
  },
]

const columns: ColumnDef<Client>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => createSortableHeader('Name', column),
    cell: ({ row }) => {
      const { firstName, lastName } = row.original
      return `${firstName} ${lastName}`
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'phone',
    header: 'Phone Number',
  },
  {
    accessorKey: 'idType',
    header: 'ID Type',
  },
  {
    accessorKey: 'idNumber',
    header: 'ID Number',
  },
  {
    accessorKey: 'address.state',
    header: 'state',
    cell: ({ row }) => row.original.address?.state ?? '—',
  },
  {
    accessorKey: 'address.city',
    header: 'city',
    cell: ({ row }) => row.original.address?.city ?? '—',
  },
  {
    accessorKey: 'status',
    header: ({ column }) => createSortableHeader('Status', column),
    cell: ({ row }) => {
      const status = row.original.status
      const color =
        status === 'approved'
          ? { text: 'text-green-600', bg: 'bg-green-600' }
          : status === 'pending'
            ? { text: 'text-yellow-600', bg: 'bg-yellow-600' }
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

export default function ClientManagementPage() {
  const clientCounts = {
    all: mockClients.length,
    pending: mockClients.filter((c) => c.status === 'pending').length,
    approved: mockClients.filter((c) => c.status === 'approved').length,
    rejected: mockClients.filter((c) => c.status === 'rejected').length,
  }

  return (
    <div className="relative mx-auto w-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Clients</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Total Clients" value={clientCounts.all} />
        <SummaryCard title="Pending" value={clientCounts.pending} />
        <SummaryCard title="Approved" value={clientCounts.approved} />
        <SummaryCard title="Rejected" value={clientCounts.rejected} />
      </div>

      <Card className="bg-background shadow-sm">
        <CardContent className="p-6">
          <DataTable<Client, unknown>
            columns={columns}
            data={mockClients}
            searchKey="name"
            enableRowSelection
            actions={[
              {
                label: 'View Details',
                onClick: (client) => alert(`Viewing ${client.firstName}`),
              },
              {
                label: 'Delete',
                variant: 'destructive',
                onClick: (client) => alert(`Deleting ${client.firstName}`),
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
