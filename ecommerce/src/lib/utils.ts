import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function format(date: Date | string): string {
  if (!date) return ''
  if (typeof date === 'string') return date
  if (date instanceof Date && !isNaN(date.getTime())) {
    return date.toISOString().split('T')[0]
  }
  return ''
}

export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word: string) => {
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}
