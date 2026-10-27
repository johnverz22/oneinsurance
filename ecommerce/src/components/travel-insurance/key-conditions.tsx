import { cn } from '@/lib/utils'
import { KEY_CONDITIONS } from '@/utils/travel-benefits'

export function KeyConditions({ className }: { className?: string }) {
  return (
    <section className={cn('travel-key-conditions', className)} aria-label="Key conditions and exclusions">
      <h4>Key conditions and exclusions (summary)</h4>
      <ul>
        {KEY_CONDITIONS.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <p>The insurer&rsquo;s policy wording lists all conditions and exclusions and prevails.</p>
    </section>
  )
}
