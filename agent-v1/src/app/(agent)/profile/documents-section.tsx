'use client'

import { useState } from 'react'
import { FileText, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DialogFormWrapper } from '@/components/ui/dialog-form-wrapper'
import { DocumentUploadForm } from '@/components/agent/documents-upload-form'
import { DocumentsList } from '@/components/agent/document-list'

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

      <DocumentsList />

      <DialogFormWrapper
        title={'Add'}
        open={!!documentDetailsForm.isVisible}
        showTrigger={false}
        setOpen={(value) =>
          setDocumentDetailsForm((prev) => ({ ...prev, isVisible: value }))
        }
      >
        <DocumentUploadForm
          onSuccess={() =>
            setDocumentDetailsForm((prev) => ({ ...prev, isVisible: false }))
          }
        />
      </DialogFormWrapper>
    </div>
  )
}
