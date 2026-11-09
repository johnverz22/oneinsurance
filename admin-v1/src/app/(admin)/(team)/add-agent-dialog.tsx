import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function AddAgentDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="from-primary to-lilac rounded-full bg-gradient-to-r">
          Add Agent
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Agent</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
