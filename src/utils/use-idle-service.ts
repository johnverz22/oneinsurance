// hooks/useIdleService.ts
import { useEffect } from 'react'
import IdleService from '@/utils/idle-service'
import { useRouter } from 'next/navigation'

export function useIdleService(
  storageKey: string,
  idleMinutes: number = 5,
  onIdle: () => void
) {
  const router = useRouter()

  useEffect(() => {
    const idleService = new IdleService(storageKey, idleMinutes, onIdle)
    idleService.start()

    return () => {
      idleService.stop() // cleanup on unmount
    }
  }, [storageKey, idleMinutes, router])
}
