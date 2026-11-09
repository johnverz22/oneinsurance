'use client'

import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

type SearchInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className,
}: SearchInputProps) {
  return (
    <div className={cn('relative w-full', className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#9bb09f] dark:text-[#b2b7b4]"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="block min-h-11 w-full rounded-md border border-[#c7d4c9] bg-white py-2 pr-3 pl-9 text-sm text-[#183d2c] placeholder-[#9bb09f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] dark:border-[#565c58] dark:bg-[#1c1e1e] dark:text-[#f4f5f2]"
      />
    </div>
  )
}
