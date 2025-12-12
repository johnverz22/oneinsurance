import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  ref?: React.Ref<HTMLInputElement>
  leftIcon?: React.ReactNode
}

export const PasswordInput = ({
  ref,
  leftIcon,
  className,
  ...props
}: PasswordInputProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false)

  const handleToggle = () => setIsPasswordVisible((prev) => !prev)

  return (
    <div className="relative flex h-11 items-center">
      {leftIcon && (
        <div className="text-muted-foreground absolute top-1/2 left-3 z-10 -translate-y-1/2">
          {leftIcon}
        </div>
      )}
      <Input
        type={isPasswordVisible ? 'text' : 'password'}
        className={cn('h-11', leftIcon && 'pl-10', className)}
        ref={ref}
        {...props}
      />

      <Button
        variant="ghost"
        type="button"
        className="absolute right-2 h-8"
        onClick={handleToggle}
      >
        {isPasswordVisible ? <Eye /> : <EyeOff />}
      </Button>
    </div>
  )
}
