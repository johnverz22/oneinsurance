'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DownloadIcon, Edit2 } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

interface PolicyCardProps {
  image: string
  policyName: string
  platform: string
  policyNumber: string
}

export default function PolicyCard({
  image,
  policyName,
  platform,
  policyNumber,
}: PolicyCardProps) {
  const handleDownloadButtonClick = () => {
    toast.info('Under Construction')
  }

  const handleUpdateButtonClick = () => {
    toast.info('Under Construction')
  }

  const handleCardClick = () => {
    toast.info('Under Construction')
  }

  return (
    <Card
      className="flex h-fit w-full flex-row items-center gap-2 pl-4 filter hover:cursor-pointer hover:brightness-95"
      onClick={handleCardClick}
    >
      <div className="relative h-15 w-15 overflow-hidden">
        <Image
          src={'/images/logo.png'}
          alt="logo"
          fill
          className="object-cover"
        />
      </div>
      <div className="flex w-full items-center justify-between">
        <CardHeader className="w-full">
          <CardTitle>{policyName}</CardTitle>
          <CardDescription>
            <p>{platform}</p>
            <p>{policyNumber}</p>
          </CardDescription>
        </CardHeader>
        <CardContent className="items-center justify-center pr-0">
          <Button variant={'ghost'} onClick={handleDownloadButtonClick}>
            <DownloadIcon />
          </Button>
          <Button variant={'ghost'} onClick={handleUpdateButtonClick}>
            <Edit2 />
          </Button>
        </CardContent>
      </div>
    </Card>
  )
}
