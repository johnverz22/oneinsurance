export default function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ 'agent-code': string }>
}) {
  return <main className="h-full w-full">{children}</main>
}
