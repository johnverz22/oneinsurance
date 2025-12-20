'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DialogFormWrapper } from '@/components/ui/dialog-form-wrapper'
import { DocumentUploadForm } from '@/components/agent/documents-upload-form'

export const DocumentsSection = () => {
  const [documentDetailsForm, setDocumentDetailsForm] = useState({
    values: undefined,
    isVisible: false,
  })

  const handleOpenForm = () => {
    setDocumentDetailsForm((prev) => ({ ...prev, isVisible: true }))
  }

  return (
    <div className="border-muted-foreground/20 rounded-xl border px-8 py-3.5">
      <div className="flex items-center justify-between border-b">
        <h3 className="py-4 text-xl font-bold lg:text-2xl">Documents</h3>

        <Button variant="default" className="!px-8" onClick={handleOpenForm}>
          <Plus /> Add
        </Button>
      </div>

      <div className="text-muted-foreground col-span-2 py-12 text-center text-lg">
        No documents found.
      </div>

      <DialogFormWrapper
        title={'Add'}
        open={!!documentDetailsForm.isVisible}
        showTrigger={false}
        setOpen={(value) =>
          setDocumentDetailsForm((prev) => ({ ...prev, isVisible: value }))
        }
      >
        <DocumentUploadForm />
      </DialogFormWrapper>
    </div>
  )
}
