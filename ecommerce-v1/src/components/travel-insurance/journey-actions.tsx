'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

const read = (action: 'back' | 'next') => {
  const el = document.querySelector<HTMLButtonElement>(
    `[data-mobile-action="${action}"]`
  )
  return { exists: !!el, label: el?.textContent?.trim() || '', disabled: !!el?.disabled }
}

/**
 * Desktop Back/Next actions shown under the premium card. The step components
 * keep their own (hidden) buttons carrying `data-mobile-action`; these proxy
 * clicks to them and mirror their current label.
 */
export function JourneyActions({
  backFallback,
  nextFallback,
}: {
  backFallback: string
  nextFallback: string
}) {
  const [state, setState] = useState({
    back: read('back'),
    next: read('next'),
  })

  useEffect(() => {
    const sync = () =>
      setState((prev) => {
        const next = { back: read('back'), next: read('next') }
        return JSON.stringify(prev) === JSON.stringify(next) ? prev : next
      })
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['disabled'],
    })
    return () => observer.disconnect()
  }, [])

  const click = (action: 'back' | 'next') =>
    document
      .querySelector<HTMLButtonElement>(`[data-mobile-action="${action}"]`)
      ?.click()

  return (
    <div className="hidden gap-3 lg:flex">
      {state.back.exists && (
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="flex-1 rounded-full bg-transparent font-semibold"
          onClick={() => click('back')}
        >
          {state.back.label || backFallback}
        </Button>
      )}
      {state.next.exists && (
        <Button
          type="button"
          size="lg"
          className="from-primary to-lilac text-primary-foreground flex-1 rounded-full bg-gradient-to-r font-semibold"
          disabled={state.next.disabled}
          onClick={() => click('next')}
        >
          {state.next.label || nextFallback}
        </Button>
      )}
    </div>
  )
}
