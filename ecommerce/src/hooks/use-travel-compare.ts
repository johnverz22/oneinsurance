'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getEcho } from '@/lib/echo'
import { TravelInsuranceApiResponse } from '@/types/plan'
import { InitTravelInsuranceRequest } from '@/types/travel-insurance/travel-insurance-request'

const MAX_WAIT_MS = 60_000   // give up after 60 s
const FALLBACK_POLL_MS = 3_000  // safety-net poll if the WS event is missed

export type TravelCompareStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface TravelCompareError {
  code?: number
  message: string
}

export interface UseTravelCompareReturn {
  /** Call this with the mapped IGW payload to start a comparison. */
  compare: (payload: InitTravelInsuranceRequest) => void
  status: TravelCompareStatus
  /**
   * Mapped plan list. Populated once the first successful GET lands and
   * REPLACED on every subsequent `.insurance.plan.received` event — the GET
   * always returns the full cumulative list, so replacement is safe.
   */
  cards: TravelInsuranceApiResponse | null
  /** The ClientRequestId returned by init; also needed for full-quote. */
  clientRequestId: string | null
  error: TravelCompareError | null
}

/**
 * Drives the async compare-quote flow:
 *
 *  1. POST /api/travel-insurance/init-compare        → 202 { ClientRequestId }
 *  2. Subscribe to WebSocket channel <ClientRequestId>
 *     .insurance.plan.received  → GET the cards (may fire more than once)
 *     .insurance.plan.failed    → set error (ignored once cards are shown)
 *  3. GET  /api/travel-insurance/compare-quote?id=   → 200 { cards } | 202 pending
 *
 * Notes on semantics (verified against staging):
 *  - The WS event carries only `{ cache_key }` — never plans.
 *  - The GET returns the complete cumulative card list on 200; each event
 *    just means "fetch again".
 *  - An immediate GET + 3 s fallback poll cover events that fired before
 *    the subscription was active, or a dropped WS connection.
 *  - The subscription stays open after the first 200 so that any further
 *    `plan.received` events still refresh the card list.
 */
export function useTravelCompare(): UseTravelCompareReturn {
  const [status, setStatus] = useState<TravelCompareStatus>('idle')
  const [cards, setCards] = useState<TravelInsuranceApiResponse | null>(null)
  const [clientRequestId, setClientRequestId] = useState<string | null>(null)
  const [error, setError] = useState<TravelCompareError | null>(null)

  // teardown ref survives re-renders and cleans up on unmount
  const cleanupRef = useRef<() => void>(() => {})
  useEffect(() => () => cleanupRef.current(), [])

  const compare = useCallback(async (payload: InitTravelInsuranceRequest) => {
    // Cancel any in-flight comparison before starting a new one
    cleanupRef.current()

    setStatus('loading')
    setCards(null)
    setError(null)
    setClientRequestId(null)

    // ── 1. Init ──────────────────────────────────────────────────────────────
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

    // ── State for this run ───────────────────────────────────────────────────
    let done = false   // terminal: error/timeout reached or cleanup called
    let ready = false  // at least one 200 with cards has landed

    // ── 2. Fetch result cards (called on every WS event, immediate check, poll) ─
    const fetchResult = async () => {
      if (done) return
      let r: Response
      try {
        r = await fetch(`/api/travel-insurance/compare-quote?id=${id}`, {
          headers: { Accept: 'application/json' },
        })
      } catch {
        // Network blip — the poll will retry
        return
      }

      if (r.status === 202) return  // still pending, keep waiting

      const j = await r.json()

      if (r.ok) {
        ready = true
        clearInterval(poll)       // results are in — no need to keep polling
        setCards(j)               // GET returns the full cumulative list
        setStatus('ready')
        // Stay subscribed: a later plan.received event triggers a refetch,
        // which replaces cards with the updated cumulative list.
      } else if (!ready) {
        // Terminal error only if no cards have been shown yet
        done = true
        teardown()
        setError({ code: r.status, message: j?.message ?? 'Failed to retrieve quotes.' })
        setStatus('error')
      }
      // If already ready, a late error response is ignored — shown cards stay.
    }

    // ── 3. Subscribe to WebSocket channel ───────────────────────────────────
    try {
      const echo = getEcho()
      const channel = echo.channel(id)

      channel.listen('.insurance.plan.received', () => {
        fetchResult()
      })

      channel.listen('.insurance.plan.failed', (e: { code: number; message: string }) => {
        if (ready || done) return  // cards already shown — don't revoke them
        done = true
        teardown()
        setError({ code: e.code, message: e.message })
        setStatus('error')
      })
    } catch {
      // Echo unavailable (SSR guard or missing config) — polling will cover it
    }

    // ── 4. Immediate GET (catches events that fired before subscribe) ─────────
    fetchResult()

    // Fallback poll in case the WS event is missed
    const poll = setInterval(fetchResult, FALLBACK_POLL_MS)

    // Hard timeout — errors out if nothing arrived, otherwise just closes the channel
    const timeout = setTimeout(() => {
      done = true
      teardown()
      if (!ready) {
        setError({ code: 504, message: 'Timed out waiting for quotes. Please try again.' })
        setStatus('error')
      }
    }, MAX_WAIT_MS)

    function teardown() {
      clearInterval(poll)
      clearTimeout(timeout)
      try { getEcho().leave(id) } catch { /* ignore if echo not initialised */ }
    }

    cleanupRef.current = () => { done = true; teardown() }
  }, [])

  return { compare, status, cards, clientRequestId, error }
}
