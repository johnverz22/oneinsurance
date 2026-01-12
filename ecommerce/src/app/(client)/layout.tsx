export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <main className="h-full w-full">{children}</main>
}
