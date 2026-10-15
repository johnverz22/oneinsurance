export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // NOTE: a <div>, not <main> — nested layouts (e.g. [agent-code]) own the
  // single main landmark; a second <main> here produces nested-landmark
  // and duplicate-main a11y violations.
  return <div className="min-h-full w-full">{children}</div>
}
