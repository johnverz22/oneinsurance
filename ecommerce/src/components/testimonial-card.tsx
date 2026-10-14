import { User } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { StarRating } from '@/components/ui/star-rating'
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
    <Card className="h-full gap-0 rounded-2xl p-6">
      {/* Star Rating */}
      <StarRating rating={rating} className="mb-4" starClassName="h-5 w-5" />

      {/* Title */}
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>

      {/* Testimonial Text */}
      <p className="mb-6 flex-1 text-sm text-muted-foreground">
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
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <User className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div>
          <p className="font-semibold">{userName}</p>
          <p className="text-xs text-muted-foreground">{userRole}</p>
        </div>
      </div>
    </Card>
  )
}
