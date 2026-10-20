import { useEffect, useRef, useState, useCallback } from 'react'
import axios from 'axios'

interface PaymentVerificationData {
  proposal_number: string
  transaction_status_code: string
  is_verified: boolean
  status: string
  transaction_status: string
  amount: string
  transaction_date: string
}

interface PaymentVerificationResponse {
  success: boolean
  message: string
  data: PaymentVerificationData
}

interface PaymentPollingConfig {
  proposalNumber: string
  interval?: number
  maxAttempts?: number
  timeout?: number
  onSuccess: (data: PaymentVerificationData) => void
  onError: (error: Error) => void
  onTimeout: () => void
}

export function usePaymentPolling(config: PaymentPollingConfig) {
  const [isPolling, setIsPolling] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  const {
    proposalNumber,
    interval = 2000,
    maxAttempts = 150,
    timeout = 300000,
    onSuccess,
    onError,
    onTimeout,
  } = config

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsPolling(false)
  }, [])

  const checkPaymentStatus = useCallback(async () => {
    try {
      // Call the BFF route — the server adds the backend Authorization header.
      // This keeps BACKEND_ACCESS_TOKEN out of the browser entirely.
      const response = await axios.post<PaymentVerificationResponse>(
        '/api/payment/verify-status',
        {
          proposal_number: proposalNumber,
        }
      )

      setAttemptCount((prev) => prev + 1)

      // Check for success
      if (
        response.data.success &&
        response.data.data.is_verified &&
        response.data.data.transaction_status_code === 'OK.00.00'
      ) {
        stopPolling()
        onSuccess(response.data.data)
        return
      }

      // Check for failure
      if (
        response.data.data.transaction_status_code &&
        response.data.data.transaction_status_code.startsWith('FAILED')
      ) {
        stopPolling()
        onError(new Error(response.data.message))
        return
      }

      // Check timeout conditions
      const elapsedTime = Date.now() - startTimeRef.current
      if (attemptCount >= maxAttempts || elapsedTime >= timeout) {
        stopPolling()
        onTimeout()
        return
      }

      // Continue polling (status is pending)
    } catch (error: any) {
      // Network error - log but continue polling
      console.error('Payment verification error:', error)

      // Check if we should timeout due to elapsed time
      const elapsedTime = Date.now() - startTimeRef.current
      if (elapsedTime >= timeout) {
        stopPolling()
        onTimeout()
      }
    }
  }, [
    proposalNumber,
    attemptCount,
    maxAttempts,
    timeout,
    onSuccess,
    onError,
    onTimeout,
    stopPolling,
  ])

  const startPolling = useCallback(() => {
    if (isPolling) return

    setIsPolling(true)
    setAttemptCount(0)
    startTimeRef.current = Date.now()

    // Check immediately
    checkPaymentStatus()

    // Then check at intervals
    intervalRef.current = setInterval(checkPaymentStatus, interval)
  }, [isPolling, interval, checkPaymentStatus])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  return {
    isPolling,
    attemptCount,
    startPolling,
    stopPolling,
  }
}
