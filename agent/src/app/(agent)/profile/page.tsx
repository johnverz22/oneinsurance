'use client'

import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useGetAccounts } from '@/app/data/queries/accounts'
import { useAgentAuthStore } from '@/store/agent-auth-store'
import { BankDetailsFormValues, EWalletFormValues } from '@/types/account'
import { EWalletForm } from '@/components/accounts/ewallet-details-form'
import { BankDetailsForm } from '@/components/accounts/bank-details-form'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DialogFormWrapper } from '@/components/ui/dialog-form-wrapper'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AccountMutationArgs,
  useAddAccountDetails,
  useEditAccountDetails,
} from '@/app/data/mutations/agent/accounts'
import { HoverDropdownButton } from '@/components/ui/hover-dropdown-button'
import { DocumentsSection } from './documents-section'

type AccountDetailsForm = Partial<AccountMutationArgs> & {
  isVisible?: boolean
}

const ProfilePage = () => {
  const { user, getInitials } = useAgentAuthStore()
  const {
    data: accounts,
    isFetching: isAccountsFetching,
    isSuccess,
  } = useGetAccounts()
  const { mutateAsync: submitEditedDetails } = useEditAccountDetails()
  const { mutateAsync: submitNewDetails } = useAddAccountDetails()

  const [accountDetailsForm, setAccountDetailsForm] =
    useState<AccountDetailsForm>({
      type: undefined,
      values: undefined,
      isVisible: false,
    })

  const hasAccounts = useMemo(() => {
    if (!isSuccess) return false

    return (
      accounts.data.bank_details.length > 0 ||
      accounts.data.e_wallets.length > 0
    )
  }, [])

  const handleOpenAccountsForm = (data: AccountDetailsForm) => {
    setAccountDetailsForm({
      ...data,
      isVisible: true,
    })
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
    {
      label: 'Bank',
      onClick: () => handleOpenAccountsForm({ type: 'bank' }),
    },
    {
      label: 'E-Wallet',
      onClick: () => handleOpenAccountsForm({ type: 'ewallet' }),
    },
  ]

  return (
    <div className="relative mx-auto space-y-6 overflow-hidden">
      <div className="border-muted-foreground/20 rounded-xl border px-8 py-3.5">
        <h3 className="border-b py-4 text-xl font-bold lg:text-2xl">
          Profile Information
        </h3>

        <div className="px-4 py-4 lg:px-16">
          <div className="flex w-full flex-col gap-5">
            <Avatar className="size-32">
              <AvatarImage src="" />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>

            <div className="grid gap-3 lg:grid-cols-3">
              <div className="space-y-0.5">
                <p>Name</p>
                <h2 className="text-lg font-bold md:text-xl lg:text-2xl">
                  {user?.name}
                </h2>
              </div>
              <div className="space-y-0.5">
                <p>Email</p>
                <h2 className="text-lg font-bold md:text-xl lg:text-2xl">
                  {user?.email}
                </h2>
              </div>
              <div className="space-y-0.5">
                <p>Phone</p>
                <h2 className="text-lg font-bold md:text-xl lg:text-2xl">
                  {user?.phone}
                </h2>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DocumentsSection />

      <div className="border-muted-foreground/20 rounded-xl border px-8 py-3.5">
        <div className="flex items-center justify-between border-b">
          <h3 className="py-4 text-xl font-bold lg:text-2xl">
            Payment Details
          </h3>

          <HoverDropdownButton
            label="Add"
            icon={Plus}
            enableHover={false}
            buttonProps={{ variant: 'default', className: '!px-8' }}
            menus={ACTIONS}
          />
        </div>

        <div className="grid gap-4 py-4 lg:grid-cols-2">
          {isAccountsFetching ? (
            <>
              {[...Array(2)].map((_, index) => (
                <Card key={index} className="py-4">
                  <CardContent className="flex w-full flex-col gap-4 py-6 lg:px-16">
                    <Skeleton className="h-16" />
                    <Skeleton className="h-10 w-2/3" />
                    <Skeleton className="h-8 w-2/3" />
                    <Skeleton className="h-8 w-2/3" />
                    <Skeleton className="h-6 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : hasAccounts ? (
            <>
              <div className="space-y-4">
                {accounts?.data.bank_details.map((detail) => (
                  <Card key={detail.id} className="py-4">
                    <CardContent className="flex w-full flex-col gap-4 py-6 lg:px-16">
                      <div className="flex items-center justify-between gap-2">
                        <p>Bank Details</p>

                        <Button
                          variant="secondary"
                          className="px-8"
                          onClick={() =>
                            handleOpenAccountsForm({
                              type: 'bank',
                              values: detail,
                            })
                          }
                        >
                          Edit
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold md:text-xl lg:text-2xl">
                          {detail.bank_name}
                        </h2>
                        {detail.is_primary && (
                          <Badge className="bg-blue-500 px-4 py-1.5 text-white">
                            Primary
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <p className="text-muted-foreground">Acccount Name</p>
                        <h2 className="text-lg">{detail.account_name}</h2>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-muted-foreground">Account Number</p>
                        <h2 className="text-lg">{detail.account_number}</h2>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-muted-foreground">Branch</p>
                        <h2 className="text-lg">{detail.branch}</h2>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-muted-foreground">Swift Code</p>
                        <h2 className="text-lg">{detail.swift_code}</h2>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="space-y-4">
                {accounts?.data.e_wallets.map((detail) => (
                  <Card key={detail.id} className="py-4">
                    <CardContent className="flex w-full flex-col gap-4 py-6 lg:px-16">
                      <div className="flex items-center justify-between gap-2">
                        <p>E-Wallet</p>

                        <Button
                          variant="secondary"
                          className="px-8"
                          onClick={() =>
                            handleOpenAccountsForm({
                              type: 'ewallet',
                              values: detail,
                            })
                          }
                        >
                          Edit
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold md:text-xl lg:text-2xl">
                          {detail.provider}
                        </h2>
                        {detail.is_primary && (
                          <Badge className="bg-blue-500 px-4 py-1.5 text-white">
                            Primary
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <p className="text-muted-foreground">Acccount Name</p>
                        <h2 className="text-lg">{detail.account_name}</h2>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-muted-foreground">Account Number</p>
                        <h2 className="text-lg">{detail.account_number}</h2>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-muted-foreground">Email</p>
                        <h2 className="text-lg">{detail.email}</h2>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-muted-foreground">Phone</p>
                        <h2 className="text-lg">{detail.phone}</h2>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-muted-foreground col-span-2 py-12 text-center text-lg">
              No accounts found.
            </div>
          )}
        </div>

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
              onSubmit={(values) =>
                handleSubmitAccountDetails({ type: 'ewallet', values })
              }
            />
          ) : (
            accountDetailsForm.type === 'bank' && (
              <BankDetailsForm
                defaultValues={accountDetailsForm.values}
                onSubmit={(values) =>
                  handleSubmitAccountDetails({ type: 'bank', values })
                }
              />
            )
          )}
        </DialogFormWrapper>
      </div>
    </div>
  )
}

export default ProfilePage
