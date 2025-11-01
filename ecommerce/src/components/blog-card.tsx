import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

interface BlogCardProps {
  image?: string
  date?: string
  day?: string
  title?: string
  description?: string
  href?: string
}

export const BlogCard = ({
  image = '/insurance-rejection.webp',
  date = 'October 4, 2025',
  day = 'Fri',
  title = '7 Common Mistakes That Can Get Your Car Insurance Claim Rejected',
  description = 'Understanding the claim process is key to avoiding rejections. This article outlines the most common errors policyholders make and provides practical tips to ensure a...',
  href = '/',
}: BlogCardProps) => {
  return (
    <div className="group relative flex overflow-hidden rounded-2xl bg-white shadow-md transition-shadow">
      <Link href={href} className="flex w-full">
        {/* Image - Left Side */}
        <div className="relative h-full w-48 flex-shrink-0 overflow-hidden">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Content - Right Side */}
        <div className="flex flex-1 flex-col justify-between space-y-3 p-6">
          {/* Date */}
          <p className="text-muted-foreground text-sm">
            {day} · {date}
          </p>

          {/* Title */}
          <h3 className="line-clamp-2 text-lg leading-tight font-bold text-gray-900">
            {title}
          </h3>

          {/* Description */}
          <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
            {description}
          </p>

          {/* Read More Link */}
          <div className="text-primary group-hover:text-primary/80 flex items-center gap-1 pt-2 text-sm font-semibold transition-colors">
            <span>Read More</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </div>
  )
}
