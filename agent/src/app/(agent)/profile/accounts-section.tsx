'use client'

import { Eye, EyeOff, Lock, Plus, Pencil } from 'lucide-react'
import { useState } from 'react'
import { useGetAccounts } from '@/app/data/queries/accounts'
import { EWalletForm } from '@/components/accounts/ewallet-details-form'
import { BankDetailsForm } from '@/components/accounts/bank-details-form'
import { DialogFormWrapper } from '@/components/ui/dialog-form-wrapper'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AccountMutationArgs,
  useAddAccountDetails,
  useEditAccountDetails,
} from '@/app/data/mutations/agent/accounts'
import { HoverDropdownButton } from '@/components/ui/hover-dropdown-button'
import { useAgentAuthStore } from '@/store/agent-auth-store'
import { toast } from 'sonner'

type AccountDetailsForm = Partial<AccountMutationArgs> & {
  isVisible?: boolean
}

// Mask sensitive value — show only last 4 chars
const mask = (value: string | undefined | null, keepLast = 4): string => {
  if (!value) return '—'
  if (value.length <= keepLast) return '•'.repeat(value.length)
  return '•'.repeat(value.length - keepLast) + value.slice(-keepLast)
}

// Reveal dialog — asks for password then either shows details or calls onVerified
function RevealDialog({
  open,
  onClose,
  title,
  rows,
  onVerified,
  mode = 'reveal',
}: {
  open: boolean
  onClose: () => void
  title: string
  rows: { label: string; value: string }[]
  onVerified?: () => void
  mode?: 'reveal' | 'edit'
}) {
  const { user } = useAgentAuthStore()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [error, setError] = useState('')

  const handleReveal = async () => {
    if (!password.trim()) {
      setError('Please enter your password')
      return
    }
    try {
      const res = await fetch('/api/agent/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email, password }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        if (mode === 'edit' && onVerified) {
          onVerified()
          handleClose()
        } else {
          setRevealed(true)
          setError('')
        }
      } else {
        setError('Incorrect password. Please try again.')
      }
    } catch {
      setError('Unable to verify password. Please try again.')
    }
  }

  const handleClose = () => {
    setPassword('')
    setShowPassword(false)
    setRevealed(false)
    setError('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {revealed
              ? 'Full account details are now visible.'
              : 'Enter your password to view the full account details.'}
          </DialogDescription>
        </DialogHeader>

        {!revealed ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  placeholder="Enter your account password"
                  onKeyDown={(e) => e.key === 'Enter' && handleReveal()}
                  className={error ? 'border-destructive' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleReveal}>Reveal Details</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row, i) => (
              <div key={i} className="flex justify-between border-b pb-2 last:border-0">
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className="text-sm font-medium">{row.value || '—'}</span>
              </div>
            ))}
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={handleClose}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export const AccountsSection = () => {
  const {
    data: accounts,
    isFetching: isAccountsFetching,
  } = useGetAccounts()
  const { mutateAsync: submitEditedDetails } = useEditAccountDetails()
  const { mutateAsync: submitNewDetails } = useAddAccountDetails()

  const [accountDetailsForm, setAccountDetailsForm] = useState<AccountDetailsForm>({
    type: undefined,
    values: undefined,
    isVisible: false,
  })

  const [editGate, setEditGate] = useState<{
    open: boolean
    row: { type: 'Bank' | 'E-Wallet'; name: string; formType: 'bank' | 'ewallet'; raw: any } | null
  }>({ open: false, row: null })

  const [revealDialog, setRevealDialog] = useState<{
    open: boolean
    title: string
    rows: { label: string; value: string }[]
  }>({ open: false, title: '', rows: [] })

  const handleOpenAccountsForm = (data: AccountDetailsForm) => {
    setAccountDetailsForm({ ...data, isVisible: true })
  }

  const handleSubmitAccountDetails = async (data: AccountMutationArgs) => {
    if (data.values.id) {
      await submitEditedDetails(data)
    } else {
      await submitNewDetails(data)
    }
    setAccountDetailsForm((prev) => ({ ...prev, isVisible: false }))
  }

  const ACTIONS = [
    { label: 'Bank', onClick: () => handleOpenAccountsForm({ type: 'bank' }) },
    { label: 'E-Wallet', onClick: () => handleOpenAccountsForm({ type: 'ewallet' }) },
  ]

  // Combine all accounts into a flat list for the table
  const bankRows = (accounts?.data?.bank_details ?? []).map((d) => ({
    id: d.id,
    type: 'Bank' as const,
    name: d.bank_name,
    accountName: d.account_name,
    accountNumber: d.account_number,
    extra1Label: 'Branch',
    extra1Value: d.branch,
    extra2Label: 'Swift Code',
    extra2Value: d.swift_code,
    isPrimary: d.is_primary,
    raw: d,
    formType: 'bank' as const,
  }))

  const ewalletRows = (accounts?.data?.e_wallets ?? []).map((d) => ({
    id: d.id,
    type: 'E-Wallet' as const,
    name: d.provider,
    accountName: d.account_name,
    accountNumber: d.account_number,
    extra1Label: 'Email',
    extra1Value: d.email,
    extra2Label: 'Phone',
    extra2Value: d.phone,
    isPrimary: d.is_primary,
    raw: d,
    formType: 'ewallet' as const,
  }))

  const allRows = [...bankRows, ...ewalletRows]

  return (
    <div className="border-muted-foreground/20 rounded-xl border px-8 py-3.5">
      <div className="flex items-center justify-between border-b">
        <h3 className="py-4 text-xl font-bold lg:text-2xl">Payment Details</h3>
        <HoverDropdownButton
          label="Add"
          icon={Plus}
          enableHover={false}
          buttonProps={{ variant: 'default', className: '!px-8' }}
          menus={ACTIONS}
        />
      </div>

      <div className="py-4">
        {isAccountsFetching ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : allRows.length > 0 ? (
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Type</TableHead>
                  <TableHead className="font-semibold text-gray-700">Provider / Bank</TableHead>
                  <TableHead className="font-semibold text-gray-700">Account Name</TableHead>
                  <TableHead className="font-semibold text-gray-700">Account Number</TableHead>
                  <TableHead className="font-semibold text-gray-700">Details</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRows.map((row) => (
                  <TableRow key={`${row.type}-${row.id}`} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">{row.type}</span>
                        {row.isPrimary && (
                          <Badge className="bg-blue-500 px-2 py-0.5 text-xs text-white">Primary</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-gray-900">{row.name}</TableCell>
                    <TableCell className="text-sm text-gray-600">{row.accountName}</TableCell>
                    <TableCell className="font-mono text-sm text-gray-500">
                      {mask(row.accountNumber)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      <span className="text-xs text-gray-400">{row.extra1Label}:</span>{' '}
                      {mask(row.extra1Value)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-500 hover:text-primary"
                          title="View full details"
                          onClick={() =>
                            setRevealDialog({
                              open: true,
                              title: `${row.type} — ${row.name}`,
                              rows: [
                                { label: 'Account Name', value: row.accountName },
                                { label: 'Account Number', value: row.accountNumber },
                                { label: row.extra1Label, value: row.extra1Value },
                                { label: row.extra2Label, value: row.extra2Value },
                              ],
                            })
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                          title="Edit"
                          onClick={() =>
                            setEditGate({ open: true, row: { type: row.type, name: row.name, formType: row.formType, raw: row.raw } })
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-muted-foreground py-12 text-center text-lg">
            No accounts found.
          </div>
        )}
      </div>

      {/* Edit / Add form dialog */}
      <DialogFormWrapper
        title={accountDetailsForm.values ? 'Edit' : 'Add'}
        open={!!accountDetailsForm.isVisible}
        showTrigger={false}
        setOpen={(value) =>
          setAccountDetailsForm((prev) => ({ ...prev, isVisible: value }))
        }
      >
        {accountDetailsForm.type === 'ewallet' ? (
          <EWalletForm
            defaultValues={accountDetailsForm.values}
            onSubmit={(values) => handleSubmitAccountDetails({ type: 'ewallet', values })}
          />
        ) : (
          accountDetailsForm.type === 'bank' && (
            <BankDetailsForm
              defaultValues={accountDetailsForm.values}
              onSubmit={(values) => handleSubmitAccountDetails({ type: 'bank', values })}
            />
          )
        )}
      </DialogFormWrapper>

      {/* Reveal sensitive details dialog */}
      <RevealDialog
        open={revealDialog.open}
        onClose={() => setRevealDialog((prev) => ({ ...prev, open: false }))}
        title={revealDialog.title}
        rows={revealDialog.rows}
      />

      {/* Edit gate — password required before opening edit form */}
      <RevealDialog
        open={editGate.open}
        mode="edit"
        onClose={() => setEditGate({ open: false, row: null })}
        title={`Edit — ${editGate.row?.name ?? ''}`}
        rows={[]}
        onVerified={() => {
          if (editGate.row) {
            handleOpenAccountsForm({ type: editGate.row.formType, values: editGate.row.raw })
          }
          setEditGate({ open: false, row: null })
        }}
      />
    </div>
  )
}
