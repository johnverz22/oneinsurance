import { cn } from '@/lib/utils'

const TONES: Record<string, string> = {
  active: 'bg-[#eaf4e9] text-[#006838] dark:bg-[#2d4433] dark:text-[#d0e3c8]',
  approved: 'bg-[#eaf4e9] text-[#006838] dark:bg-[#2d4433] dark:text-[#d0e3c8]',
  completed: 'bg-[#eaf4e9] text-[#006838] dark:bg-[#2d4433] dark:text-[#d0e3c8]',
  successful: 'bg-[#eaf4e9] text-[#006838] dark:bg-[#2d4433] dark:text-[#d0e3c8]',
  paid: 'bg-[#eaf4e9] text-[#006838] dark:bg-[#2d4433] dark:text-[#d0e3c8]',
  pending: 'bg-[#fdf3e0] text-[#92580a] dark:bg-[#423520] dark:text-[#e4c27f]',
  'for interview': 'bg-[#e8f0fb] text-[#1d4f91] dark:bg-[#26324a] dark:text-[#9db9e2]',
  inactive: 'bg-[#f0f1ee] text-[var(--text-sub)] dark:bg-[#2b2e2b] dark:text-[var(--text-muted)]',
  rejected: 'bg-[#fdeaea] text-[#b91c1c] dark:bg-[#462626] dark:text-[#eba3a3]',
  declined: 'bg-[#fdeaea] text-[#b91c1c] dark:bg-[#462626] dark:text-[#eba3a3]',
}

export function StatusPill({ status }: { status?: string | null }) {
  const key = (status ?? '').toLowerCase()
  const tone = TONES[key] ?? TONES.inactive
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
        tone
      )}
    >
      {(status ?? 'N/A').toUpperCase()}
    </span>
  )
}
