import { LucideIcon } from 'lucide-react'

interface DetailsOptionProps {
  icon: LucideIcon
  title: string
  onClick: (value: 'scan' | 'manual') => void
  description?: string
  isFaster?: boolean
}

export default function DetailsOptionCard({
  icon: Icon,
  title,
  description,
  onClick,
  isFaster = false,
}: DetailsOptionProps) {
  return (
    <div
      className="relative cursor-pointer rounded-lg border-2 p-6 transition-all duration-200 hover:shadow-lg"
      onClick={() => {
        isFaster ? onClick('scan') : onClick('manual')
      }}
    >
      {/* Tag */}
      {isFaster && (
        <div className="absolute -top-2 -left-2">
          <div className="bg-primary rounded-full px-2 py-1 text-xs font-semibold text-white">
            FASTER
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="bg-primary/30 h-fit w-fit rounded-full p-4">
          <Icon />
        </div>
        <div>
          <p className="text-primary text-sm font-semibold">{title}</p>
          {description && <p className="text-xs font-light">{description}</p>}
        </div>
      </div>
    </div>
  )
}
