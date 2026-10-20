'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { buildProposalUrl } from '@/utils/proposal-loader'

/** QR encodes only this review-page URL with the proposal number — no personal data. */
export function ProposalQr({ proposalNo, agentCode }: { proposalNo: string; agentCode: string }) {
  const [result, setResult] = useState<{ key: string; src: string | null } | null>(null)
  const key = `${agentCode}:${proposalNo}`

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(buildProposalUrl(window.location.origin, agentCode, proposalNo), {
      margin: 1,
      width: 216,
      errorCorrectionLevel: 'M',
    })
      .then((src) => !cancelled && setResult({ key, src }))
      .catch(() => !cancelled && setResult({ key, src: null }))
    return () => {
      cancelled = true
    }
  }, [agentCode, proposalNo, key])

  const loading = result?.key !== key
  return (
    <div className="travel-review-reference__qr" aria-busy={loading}>
      {loading ? (
        <div className="travel-review-reference__qr-skeleton animate-pulse" role="status">
          <span className="sr-only">Loading proposal QR code</span>
        </div>
      ) : result?.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={result.src}
          alt={`QR code to reopen proposal ${proposalNo}`}
          width={108}
          height={108}
        />
      ) : (
        <span className="text-sm" role="status">
          QR code unavailable
        </span>
      )}
    </div>
  )
}
