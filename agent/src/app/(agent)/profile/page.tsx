'use client'

import { useAgentAuthStore } from '@/store/agent-auth-store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DocumentsSection } from './documents-section'
import { AccountsSection } from './accounts-section'

const ProfilePage = () => {
  const { user, getInitials } = useAgentAuthStore()

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
      <AccountsSection />
    </div>
  )
}

export default ProfilePage
