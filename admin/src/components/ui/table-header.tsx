import { cn } from '@/lib/utils'

type TableHeaderProps = {
  /** Table/section name, e.g. "Agent management". */
  title: string
  /** Live record count; renders "{count} {noun} found" when provided. */
  count?: number | null
  /** Singular noun for the count line, e.g. "agent". */
  noun?: string
  /** Plural noun when it isn't `noun + "s"`, e.g. "lines of business". */
  nounPlural?: string
  className?: string
  titleClassName?: string
}

/**
 * Shared portal table header — the table/section name with its live record
 * count, rendered above the filters and data table. For tabular record lists
 * only; do not use it for non-tabular card/section intros.
 */
export function TableHeader({
  title,
  count,
  noun,
  nounPlural,
  className,
  titleClassName,
}: TableHeaderProps) {
  const plural = noun ? (nounPlural ?? `${noun}s`) : null
  return (
    <div className={cn('min-w-0', className)}>
      <h3
        className={cn(
          'text-lg font-semibold tracking-tight text-[var(--text-main)]',
          titleClassName
        )}
      >
        {title}
      </h3>
      {count != null && noun && (
        <p className="mt-1 text-sm text-[var(--text-sub)]" aria-live="polite">
          {count} {count === 1 ? noun : plural} found
        </p>
      )}
    </div>
  )
}
