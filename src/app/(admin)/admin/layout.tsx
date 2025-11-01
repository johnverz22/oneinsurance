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
          isNavigationVisible={false}
          contentContainerClassName="max-w-screen"
        />
        <AppSidebar
          navigations={ADMIN_NAVIGATIONS}
          className="top-20"
          isBrandVisible={false}
        />
      </div>

      <SidebarInset>
        <main className="mx-auto h-full w-full p-4 pt-28 lg:px-8 lg:pl-20">
          {children}
        </main>
      </SidebarInset>
    </div>
  )
}
