'use client'

import { useAuthStore } from '@/store/auth-store'
import Image from 'next/image'
import { useEffect, useState } from 'react'

export default function Home() {
  const { isAuthenticated } = useAuthStore()
  const [authChecking, setAuthChecking] = useState(true)

  useEffect(() => {
    // Small delay to let zustand persist/hydrate and avoid redirect flicker
    const t = setTimeout(() => {
      setAuthChecking(false)
      if (!isAuthenticated) {
        window.location.href = '/login'
      } else {
        window.location.href = '/agents'
      }
    }, 250)

    return () => clearTimeout(t)
  }, [isAuthenticated])

  return <div></div>
}
