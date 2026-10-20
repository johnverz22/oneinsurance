'use client'

import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export type DialogFormWrapperProps = {
  title: string
  open: boolean
  setOpen: (value: boolean) => void
  children: React.ReactNode
  showTrigger?: boolean
  showTitle?: boolean
  icon?: React.ReactNode
  className?: string
  contentContainerClassName?: string
  modal?: boolean
}

export const DialogFormWrapper = ({
  title,
  open,
  setOpen,
  children,
  icon = <Plus />,
  showTrigger = true,
  showTitle = true,
  className,
  contentContainerClassName,
  modal,
}: DialogFormWrapperProps) => {
  return (
    <>
      {!modal && open && (
        <div className="fixed inset-0 z-50 h-full w-full bg-black/50" />
      )}

      <Dialog open={open} onOpenChange={setOpen} modal={modal}>
        {showTrigger && (
          <div
            className={cn(
              'bg-muted-foreground/10 relative flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border py-4 text-center',
              className
            )}
          >
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-12 w-12 rounded-full"
              >
                {icon}
              </Button>
            </DialogTrigger>
            {showTitle && <h3 className="text-sm font-semibold">{title}</h3>}
          </div>
        )}

        <DialogContent
          className={cn(
            'max-h-[80vh] overflow-y-auto sm:max-w-md lg:max-w-screen-lg',
            contentContainerClassName
          )}
        >
          <VisuallyHidden>
            <DialogTitle>{title}</DialogTitle>
          </VisuallyHidden>

          {children}
        </DialogContent>
      </Dialog>
    </>
  )
}
