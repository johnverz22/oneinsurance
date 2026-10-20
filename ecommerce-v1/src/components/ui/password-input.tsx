import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  ref?: React.Ref<HTMLInputElement>
}

export const PasswordInput = ({ ref, ...props }: PasswordInputProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false)

  const handleToggle = () => setIsPasswordVisible((prev) => !prev)

  return (
    <div className="relative flex h-11 items-center">
      <Input
        type={isPasswordVisible ? 'text' : 'password'}
        className="h-11"
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
