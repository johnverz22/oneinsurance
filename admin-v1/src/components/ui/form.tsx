import { X } from 'lucide-react'
import type { AnyFieldApi } from '@tanstack/react-form'

export const FieldInfo = ({ field }: { field: AnyFieldApi }) => {
  const error = field.state.meta.errors[0]

  return (
    <>
      {field.state.meta.isTouched && !field.state.meta.isValid ? (
        <div className="flex w-full items-center gap-2">
          <X className="h-2.5 w-2.5 shrink-0 text-red-400" />
          <p className="text-destructive text-xs">{error.message}</p>
        </div>
      ) : null}

      {field.state.meta.isValidating ? 'Validating...' : null}
    </>
  )
}
