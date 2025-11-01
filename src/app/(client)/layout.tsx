import { Header } from '@/components/layout/header'
import { AppSidebar } from '@/components/layout/sidebar'
import { Footer } from '@/components/layout/footer'
import { NAVIGATIONS } from '@/constants/navigations'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <div className="h-full w-full">
        {/* <Header navigations={NAVIGATIONS} isNavigationVisible={true} /> */}
        <div className="sm:hidden">
          <AppSidebar navigations={NAVIGATIONS} />
        </div>
      </div>

      <main className="h-full w-full">{children}</main>

      <Footer />
    </>
  )
}
