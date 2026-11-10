'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ActionIcon } from '@/components/ui/action-icon'

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Silently fail — clipboard API blocked in insecure contexts
    }
  }

  return (
    // stopPropagation keeps clicks inside clickable parent rows/cards
    <span className="inline-flex" onClick={(e) => e.stopPropagation()}>
      <ActionIcon
        label={copied ? 'Copied' : (label ?? `Copy ${value}`)}
        hint={copied ? 'Copied!' : (label ?? 'Copy')}
        onClick={() => {
          void handleCopy()
        }}
        className={cn(
          // Visible on focus, hidden until hover/focus on parent (parent adds group class)
          'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
          className
        )}
      >
        {copied ? (
          <Check className="text-[#166534] dark:text-[#86efac]" aria-hidden="true" />
        ) : (
          <Copy aria-hidden="true" />
        )}
      </ActionIcon>
    </span>
  )
}
