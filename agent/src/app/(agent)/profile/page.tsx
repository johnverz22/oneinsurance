'use client'

import { useGetAccounts } from '@/app/data/queries/accounts'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAgentAuthStore } from '@/store/agent-auth-store'

const ProfilePage = () => {
  const { user, getInitials } = useAgentAuthStore()
  const { data: accounts, isFetching: isAccountsFetching } = useGetAccounts()

  return (
    <div className="relative mx-auto space-y-6 overflow-hidden">
      <div className="border-muted-foreground/20 rounded-xl border px-8 py-3.5">
        <h3 className="border-b py-4 text-xl font-bold lg:text-2xl">
          Profile Information
        </h3>

        <div className="px-16 py-4">
          <div className="flex w-full flex-col gap-5">
            <Avatar className="size-32">
              <AvatarImage src="" />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>

            <div className="grid grid-cols-2">
              <div className="space-y-0.5">
                <p>Name</p>
                <h2 className="text-lg font-bold md:text-xl lg:text-2xl">
                  {user?.name}
                </h2>
              </div>
              <div className="space-y-0.5">
                <p>Phone</p>
                <h2 className="text-lg font-bold md:text-xl lg:text-2xl">
                  {user?.email}
                </h2>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="border-muted-foreground/20 rounded-xl border px-8 py-3.5">
        <h3 className="border-b py-4 text-xl font-bold lg:text-2xl">
          Payment Details
        </h3>

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
          ) : (
            <>
              {accounts?.data.bank_details.map((detail) => (
                <Card key={detail.id} className="py-4">
                  <CardContent className="flex w-full flex-col gap-4 py-6 lg:px-16">
                    <div className="flex items-center justify-between gap-2">
                      <p>Bank Details</p>
                      <Button variant="secondary" className="px-8">
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

              {accounts?.data.e_wallets.map((detail) => (
                <Card key={detail.id} className="py-4">
                  <CardContent className="flex w-full flex-col gap-4 py-6 lg:px-16">
                    <div className="flex items-center justify-between gap-2">
                      <p>E-Wallet</p>
                      <Button variant="secondary" className="px-8">
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
