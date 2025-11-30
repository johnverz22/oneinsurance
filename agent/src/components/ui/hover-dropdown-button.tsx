'use client'

import * as React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button, ButtonProps } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'
import { DropdownMenuItemProps } from '@radix-ui/react-dropdown-menu'

type HoverDropdownButtonProps = {
  label: string
  icon?: LucideIcon
  enableHover?: boolean
  buttonProps: Partial<ButtonProps>
  menus: Array<DropdownMenuItemProps & { label: string }>
}

export function HoverDropdownButton({
  label,
  icon: Icon,
  enableHover = true,
  buttonProps,
  menus,
}: HoverDropdownButtonProps) {
  const [open, setOpen] = React.useState(false)

  const handleMouseEnter = () => {
    if (enableHover) {
      setOpen(true)
    }
  }

  const handleMouseLeave = () => {
    if (enableHover) {
      setOpen(false)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          {...buttonProps}
        >
          {Icon && <Icon />}
          {label}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="w-full max-w-sm"
      >
        {menus.map((menu, index) => {
          const { label, ...props } = menu

          return (
            <DropdownMenuItem key={index} {...props}>
              {label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
