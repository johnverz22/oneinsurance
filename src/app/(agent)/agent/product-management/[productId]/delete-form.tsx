'use client'

import { MouseEvent, useState } from 'react'
import { Loader2, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useRouter } from 'next/navigation'
import { Insurance } from '@/types/insurance'
import { delay } from '@/utils/delay'

type DeleteProductFormProps = {
  productId: Insurance['id']
}

export const DeleteProductForm = ({ productId }: DeleteProductFormProps) => {
  const router = useRouter()
  const [isPendingAction, setIsPendingAction] = useState(false)

  const handleOnDelete = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setIsPendingAction(true)

    // TODO: IMPLEMENT DELETE API
    await delay(3000)

    setIsPendingAction(false)

    router.replace('/product-management')
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <div className="bg-muted-foreground/10 relative flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border py-4 text-center">
          <Button
            type="button"
            variant="outline"
            className="h-12 w-12 rounded-full"
          >
            <Trash className="text-destructive" />
          </Button>

          <h3 className="text-sm font-semibold">Delete Product</h3>
        </div>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            Product.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => handleOnDelete(e)}
            className="btn-primary text-white"
          >
            {isPendingAction && <Loader2 className="animate-spin" />} Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
