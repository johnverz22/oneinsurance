import { Star, User } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'

interface TestimonialCardProps {
  rating?: number
  title: string
  content: string
  userName: string
  userRole: string
  userImage?: string
}

export const TestimonialCard = ({
  rating = 5,
  title,
  content,
  userName,
  userRole,
  userImage,
}: TestimonialCardProps) => {
  return (
    <div className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-800">
      {/* Star Rating */}
      <div className="mb-4 flex gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className="h-5 w-5"
            fill={index < rating ? '#FCD34D' : 'none'}
            stroke="#FCD34D"
          />
        ))}
      </div>

      {/* Title */}
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>

      {/* Testimonial Text */}
      <p className="mb-6 flex-1 text-sm text-gray-600 dark:text-gray-400">
        "{content}"
      </p>

      <Separator className="mb-2" />

      {/* User Info */}
      <div className="flex items-center gap-3">
        {userImage ? (
          <div className="relative h-12 w-12 overflow-hidden rounded-full">
            <Image
              src={userImage}
              alt={userName}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
            <User className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </div>
        )}
        <div>
          <p className="font-semibold">{userName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{userRole}</p>
        </div>
      </div>
    </div>
  )
}
