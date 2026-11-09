import { AlertTriangle, AlertCircle, Info, Bell } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface AlertCardProps {
  title: string
  description: string
  variant?: 'info' | 'remind' | 'warning' | 'destructive'
}

export default function AlertCard({
  title,
  description,
  variant,
}: AlertCardProps) {
  switch (variant) {
    case 'info':
      return (
        <Alert className="border-blue-700 bg-blue-200">
          <Info color="#1447e6" />
          <AlertTitle className="font-bold text-blue-900">{title}</AlertTitle>
          <AlertDescription className="text-gray-700">
            {description}
          </AlertDescription>
        </Alert>
      )

    case 'remind':
      return (
        <Alert className="border-purple-700 bg-purple-200">
          <Bell color="#8200db" />
          <AlertTitle className="font-bold text-purple-900">{title}</AlertTitle>
          <AlertDescription className="text-gray-700">
            {description}
          </AlertDescription>
        </Alert>
      )

    case 'warning':
      return (
        <Alert className="border-amber-700 bg-amber-200">
          <AlertTriangle color="#bb4d00" />
          <AlertTitle className="font-bold text-amber-900">{title}</AlertTitle>
          <AlertDescription className="text-gray-700">
            {description}
          </AlertDescription>
        </Alert>
      )

    case 'destructive':
      return (
        <Alert className="border-red-700 bg-red-200">
          <AlertCircle color="#c10007" />
          <AlertTitle className="font-bold text-red-900">{title}</AlertTitle>
          <AlertDescription className="text-gray-700">
            {description}
          </AlertDescription>
        </Alert>
      )

    default:
      return (
        <Alert>
          <Info />
          <AlertTitle className="font-bold">{title}</AlertTitle>
          <AlertDescription>{description}</AlertDescription>
        </Alert>
      )
  }
}
