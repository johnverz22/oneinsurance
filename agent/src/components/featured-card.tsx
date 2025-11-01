import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'

type FeaturedCardProps = React.HTMLAttributes<HTMLDivElement> & {
  icon: LucideIcon
  label: string
  description: string
}

export const FeaturedCard = ({
  icon: Icon,
  label,
  description,
  ...props
}: FeaturedCardProps) => {
  return (
    <div
      {...props}
      className={cn(
        'border-lilac min-w-32 flex-1 rounded-lg border px-4 py-6 lg:min-w-48',
        props.className
      )}
    >
      <Icon strokeWidth={0.75} className="text-lilac h-16 w-16 pb-4" />
      <h3 className="text-lilac pb-1 text-2xl font-bold">{label}</h3>
      <p className="text-muted-foreground font-medium">{description}</p>
    </div>
  )
}
