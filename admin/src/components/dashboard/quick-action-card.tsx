'use client'

import { Card, CardContent } from '@/components/ui/card'

export function QuickActionCard({
  icon,
  title,
  description,
  destination,
}: {
  icon: string
  title: string
  description: string
  destination: string
}) {
  return (
    <Card
      className="border-[#B7B7B7] hover:cursor-pointer hover:shadow-lg"
      onClick={() => (window.location.href = destination)}
    >
      <CardContent className="flex flex-col items-center justify-center">
        <p className="text-6xl">{icon}</p>
        <p className="text-lg font-semibold">{title}</p>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  )
}
