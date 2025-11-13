import { AppSidebar } from '@/components/layout/sidebar'
import { ADMIN_NAVIGATIONS } from '@/constants/navigations'
import { SidebarInset } from '@/components/ui/sidebar'
import { Header } from '@/components/layout/header'

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex">
      <div className="h-full w-max">
        <Header
          isNavigationVisible={true}
          contentContainerClassName="max-w-screen"
          navigations={ADMIN_NAVIGATIONS}
        />
      </div>

      <main className="mx-auto h-full w-full p-4 pt-28 lg:px-8">
        {children}
      </main>
    </div>
  )
}
