'use client'

import { cn } from '@/lib/utils'
import { fieldCls } from '@/lib/ui-classes'

type SelectFieldProps = React.SelectHTMLAttributes<HTMLSelectElement>

/**
 * Select styled like the shared field. The chevron comes from the
 * `select.ui-form-field` rule in globals.css; `pr-9` restores the right
 * padding that Tailwind's px-3 would otherwise override.
 */
export function SelectField({
  className,
  children,
  ...props
}: SelectFieldProps) {
  return (
    <select {...props} className={cn(fieldCls, 'pr-9', className)}>
      {children}
    </select>
  )
}
