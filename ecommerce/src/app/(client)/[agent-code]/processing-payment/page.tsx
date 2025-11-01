'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getEcho } from '@/lib/echo'

export default function ProcessingPaymentPage() {
  const router = useRouter()

  useEffect(() => {
    const echo = getEcho()
    const channel = echo.channel('transaction-channel')
    console.log('Subscribing to channel: transaction-channel', channel)
    channel
      .listen('.transaction.message', (data: any) => {
        console.log('Message received:', data)
      })
      .error((err: Error) => {
        console.error('Channel error:', err)
      })
    return () => {
      echo.leave('transaction-channel')
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-24">
      <svg width="60" height="60" viewBox="0 0 50 50" className="mb-6">
        <circle
          cx="25"
          cy="25"
          r="20"
          stroke="#0070f3"
          strokeWidth="5"
          fill="none"
          strokeDasharray="31.4 31.4"
          strokeDashoffset="0"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 25 25"
            to="360 25 25"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
      <h2 className="mb-3 text-xl font-semibold text-gray-800">
        Processing your payment...
      </h2>
      <p className="max-w-xs text-center text-gray-500">
        Please wait while we process your payment. You will be redirected
        automatically once the payment is successful.
      </p>
    </div>
  )
}
