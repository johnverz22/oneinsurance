'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef, useState, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type Tab = {
  value: string
  label: string
}

export const TabNavigation = ({ tabs }: { tabs: Tab[] }) => {
  const router = useRouter()
  const pathname = usePathname()

  const scrollRef = useRef<HTMLDivElement>(null)
  const leftSentinel = useRef<HTMLDivElement>(null)
  const rightSentinel = useRef<HTMLDivElement>(null)

  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(false)

  const centerTab = (tabValue: string) => {
    const el = scrollRef.current
    if (!el) return

    const selected = document.getElementById(tabValue)
    if (!selected) return

    const containerWidth = el.clientWidth
    const tabCenter = selected.offsetLeft + selected.offsetWidth / 2
    const scrollTo = tabCenter - containerWidth / 2

    el.scrollTo({
      left: scrollTo,
      behavior: 'smooth',
    })
  }

  const handleTabChange = async (tab: Tab) => {
    router.push(tab.value)

    requestAnimationFrame(() => {
      centerTab(tab.value)
    })
  }

  const setupObservers = useCallback(() => {
    const container = scrollRef.current
    if (!container) return () => {}

    const left = leftSentinel.current
    const right = rightSentinel.current
    if (!left || !right) return () => {}

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === left) {
            setShowLeft(!entry.isIntersecting)
          } else if (entry.target === right) {
            setShowRight(!entry.isIntersecting)
          }
        })
      },
      { root: container, threshold: 1 }
    )

    observer.observe(left)
    observer.observe(right)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const resizeObserver = new ResizeObserver(() => {
      setupObservers()
    })

    resizeObserver.observe(el)

    return () => resizeObserver.disconnect()
  }, [setupObservers])

  useEffect(() => {
    const disconnectObservers = setupObservers()
    setTimeout(() => centerTab(pathname), 0)
    return disconnectObservers
  }, [tabs, pathname, setupObservers])

  const scrollBy = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' })
  }

  return (
    <div className="relative h-16 w-max">
      {showLeft && (
        <Button
          variant="secondary"
          onClick={() => scrollBy('left')}
          className="absolute top-4 left-2 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      <div
        ref={scrollRef}
        className="no-visible-scrollbar bg-muted-foreground/5 relative flex h-full w-max items-center gap-1 overflow-x-auto rounded-full px-2 py-1.5"
      >
        <div ref={leftSentinel} className="h-full w-px shrink-0" />

        {tabs.map((tab) => (
          <button
            id={tab.value}
            key={tab.value}
            onClick={() => handleTabChange(tab)}
            className="relative w-32 shrink-0 cursor-pointer rounded-full px-4 py-2.5"
          >
            {pathname === tab.value && (
              <motion.div
                layoutId="clickedbutton"
                transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                className="absolute inset-0 rounded-full bg-white"
              />
            )}

            <span
              className={cn('relative block', {
                'text-blue-600': pathname === tab.value,
              })}
            >
              {tab.label}
            </span>
          </button>
        ))}

        <div ref={rightSentinel} className="h-full w-px shrink-0" />
      </div>

      {showRight && (
        <Button
          variant="secondary"
          onClick={() => scrollBy('right')}
          className="absolute top-4 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
