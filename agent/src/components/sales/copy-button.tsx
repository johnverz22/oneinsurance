'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type CopyButtonProps = {
  value: string
  /** Optional accessible label override. Defaults to "Copy {value}" */
  label?: string
  className?: string
}

/**
 * CopyButton — icon button that copies `value` to clipboard.
 * Shows a checkmark for 1.5 s after a successful copy.
 * Visible on hover/focus of the parent row; always visible on focus itself.
 */
export function CopyButton({ value, label, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Silently fail — clipboard API blocked in insecure contexts
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label ?? `Copy ${value}`}
      title={copied ? 'Copied!' : (label ?? `Copy ${value}`)}
      className={cn(
        // Base: 32px hit target, icon-button style
        'inline-flex size-8 shrink-0 items-center justify-center rounded-md',
        'text-[var(--text-muted)] transition-colors',
        // Visible on focus, hidden until hover/focus on parent (parent adds group class)
        'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
        'hover:bg-[var(--subtle)] hover:text-[var(--primary)]',
        'focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-1',
        className
      )}
    >
      {copied ? (
        <Check className="size-3.5 text-[#166534] dark:text-[#86efac]" aria-hidden="true" />
      ) : (
        <Copy className="size-3.5" aria-hidden="true" />
      )}
    </button>
  )
}
