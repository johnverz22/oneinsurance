import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  /** Number of filled stars (0 - max). */
  rating?: number
  /** Total stars rendered. */
  max?: number
  className?: string
  /** Classes applied to each star icon (e.g. size overrides). */
  starClassName?: string
}

export function StarRating({
  rating = 5,
  max = 5,
  className,
  starClassName,
}: StarRatingProps) {
  return (
    <div className={cn('flex gap-0.5', className)}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-4 w-4',
            i < rating ? 'fill-rating text-rating' : 'text-rating/40',
            starClassName
          )}
        />
      ))}
    </div>
  )
}
