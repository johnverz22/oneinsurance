'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getEcho } from '@/lib/echo'
import { TravelInsuranceApiResponse } from '@/types/plan'
import { InitTravelInsuranceRequest } from '@/types/travel-insurance/travel-insurance-request'

const MAX_WAIT_MS = 60_000 // give up after 60 s
const POLL_DELAYS_MS = [300, 500, 700, 1_000, 1_000, 1_500, 2_000]

export type TravelCompareStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface TravelCompareError {
  code?: number
  message: string
}

export interface UseTravelCompareReturn {
  compare: (payload: InitTravelInsuranceRequest) => void
  status: TravelCompareStatus
  cards: TravelInsuranceApiResponse | null
  clientRequestId: string | null
  error: TravelCompareError | null
}

export function useTravelCompare(): UseTravelCompareReturn {
  const [status, setStatus] = useState<TravelCompareStatus>('idle')
  const [cards, setCards] = useState<TravelInsuranceApiResponse | null>(null)
  const [clientRequestId, setClientRequestId] = useState<string | null>(null)
  const [error, setError] = useState<TravelCompareError | null>(null)

  const cleanupRef = useRef<() => void>(() => {})
  useEffect(() => () => cleanupRef.current(), [])

  const compare = useCallback(async (payload: InitTravelInsuranceRequest) => {
    cleanupRef.current()

    setStatus('loading')
    setCards(null)
    setError(null)
    setClientRequestId(null)

    let initRes: Response
    try {
      initRes = await fetch('/api/travel-insurance/init-compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch {
      setStatus('error')
      setError({ message: 'Unable to connect to the server. Check your connection and try again.' })
      return
    }

    const initBody = await initRes.json()

    if (!initRes.ok) {
      setStatus('error')
      setError({ code: initRes.status, message: initBody?.message ?? initBody?.error ?? 'Failed to start comparison.' })
      return
    }

    const id: string = initBody?.data?.ClientRequestId
    if (!id) {
      setStatus('error')
      setError({ message: 'Unexpected response from server: missing ClientRequestId.' })
      return
    }

    setClientRequestId(id)

    let done = false
    let ready = false

    const fetchResult = async () => {
      if (done) return
      let r: Response
      try {
        r = await fetch(`/api/travel-insurance/compare-quote?id=${id}`, {
          headers: { Accept: 'application/json' },
        })
      } catch {
        return
      }

      if (r.status === 202) return

      const j = await r.json()

      if (r.ok) {
        ready = true
        clearTimeout(pollTimer)
        setCards(j)
        setStatus('ready')
      } else if (!ready) {
        done = true
        teardown()
        setError({ code: r.status, message: j?.message ?? 'Failed to retrieve quotes.' })
        setStatus('error')
      }
    }

    try {
      const echo = getEcho()
      const channel = echo.channel(id)

      channel.listen('.insurance.plan.received', () => {
        fetchResult()
      })

      channel.listen('.insurance.plan.failed', (e: { code: number; message: string }) => {
        if (ready || done) return
        done = true
        teardown()
        setError({ code: e.code, message: e.message })
        setStatus('error')
      })
    } catch {
      // Echo unavailable (missing credentials or SSR) — polling will handle it
    }

    fetchResult()

    let pollTimer: ReturnType<typeof setTimeout>
    let attempt = 0
    const schedulePoll = () => {
      pollTimer = setTimeout(async () => {
        await fetchResult()
        if (!done && !ready) schedulePoll()
      }, POLL_DELAYS_MS[Math.min(attempt++, POLL_DELAYS_MS.length - 1)])
    }
    schedulePoll()

    const timeout = setTimeout(() => {
      done = true
      teardown()
      if (!ready) {
        setError({ code: 504, message: 'Timed out waiting for quotes. Please try again.' })
        setStatus('error')
      }
    }, MAX_WAIT_MS)

    function teardown() {
      clearTimeout(pollTimer)
      clearTimeout(timeout)
      try {
        getEcho().leave(id)
      } catch {
        // ignore
      }
    }

    cleanupRef.current = () => {
      done = true
      teardown()
    }
  }, [])

  return { compare, status, cards, clientRequestId, error }
}
