'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileSearch, Mail, X } from 'lucide-react'
import {
  ProposalRetrieveForm,
  ResumeOtpPanel,
  type RetrieveNotice,
} from '@/components/travel-insurance/proposal-retrieve'
import { loadProposalIntoStore } from '@/utils/proposal-loader'

/**
 * Landing-page retrieval modal. Holds the whole flow — proposal search, then
 * email-code verification when the resume request can't find a token — and
 * forwards to the review / policy / issuance routes on success.
 */
export function ProposalRetrieveDialog({
  open,
  onClose,
  agentCode,
}: {
  open: boolean
  onClose: () => void
  agentCode: string
}) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)

  const [proposalNo, setProposalNo] = useState('')
  const [notice, setNotice] = useState<RetrieveNotice>(null)
  const [loading, setLoading] = useState(false)
  const [verificationFor, setVerificationFor] = useState<string | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (open) return
    setProposalNo('')
    setNotice(null)
    setLoading(false)
    setVerificationFor(null)
  }, [open])

  const startNewQuote = () => {
    onClose()
    router.push(`/${agentCode}/travel-insurance`)
  }

  const search = async (no: string) => {
    if (loading) return
    setProposalNo(no)
    setNotice(null)
    setLoading(true)
    const result = await loadProposalIntoStore(no)
    setLoading(false)

    if (result.status === 'ok') {
      onClose()
      router.push(
        `/${agentCode}/travel-insurance/review?proposal=${encodeURIComponent(result.proposalNo)}`
      )
      return
    }

    // Already paid/issued elsewhere — continue the post-payment journey.
    if (result.status === 'issued' && result.next === 'policy') {
      onClose()
      router.push(`/${agentCode}/travel-insurance/policy`)
      return
    }
    if (result.status === 'issued' && result.next === 'issuance') {
      onClose()
      router.push(
        `/${agentCode}/travel-insurance/issuance?paid=1${result.paymentRef ? `&txn=${encodeURIComponent(result.paymentRef)}` : ''}`
      )
      return
    }

    if (result.status === 'needs_verification') {
      setVerificationFor(no)
      return
    }

    setNotice({
      kind: result.status,
      message:
        result.status === 'issued' && result.policyNo
          ? `${result.message} Policy number: ${result.policyNo}.`
          : result.message,
    })
  }

  const verified = () => {
    if (verificationFor) void search(verificationFor)
  }

  return (
    <dialog
      ref={dialogRef}
      id="retrieve-modal"
      aria-labelledby="retrieve-dialog-title"
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose()
      }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl border border-[#dfe7df] bg-white p-0 text-[var(--text-main)] shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-xs dark:border-[#3d4140] dark:bg-[#262828] dark:text-[var(--text-main)]"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-5">
          <div className="flex items-start gap-3">
            {verificationFor ? (
              <Mail className="mt-1 size-6 shrink-0 text-[#006838] dark:text-[#d0e3c8]" aria-hidden />
            ) : (
              <FileSearch className="mt-1 size-6 shrink-0 text-[#006838] dark:text-[#d0e3c8]" aria-hidden />
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#006838] dark:text-[#d0e3c8]">
                {verificationFor ? 'One more step' : 'Pick up where you left off'}
              </p>
              <h2 id="retrieve-dialog-title" className="mt-1 text-2xl font-bold tracking-tight">
                {verificationFor ? 'Verify your email.' : 'Retrieve your proposal.'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close proposal retrieval"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[#f1f2f0] hover:text-[var(--text-main)] focus-visible:outline-2 focus-visible:outline-[#006838] dark:hover:bg-[#303232] dark:hover:text-white"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        {verificationFor ? (
          <ResumeOtpPanel
            proposalNo={verificationFor}
            onVerified={verified}
            onCancel={() => setVerificationFor(null)}
            onNewQuote={startNewQuote}
          />
        ) : (
          <>
            <p className="mt-3 text-base leading-6 text-[var(--text-sub)]">
              Enter your proposal reference to review your saved quote and proceed to policy payment.
            </p>
            <ProposalRetrieveForm
              initialValue={proposalNo}
              notice={notice}
              loading={loading}
              onSearch={(no) => void search(no)}
              onNewQuote={startNewQuote}
              onRetry={() => void search(proposalNo)}
            />
          </>
        )}
      </div>
    </dialog>
  )
}
