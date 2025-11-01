class IdleService {
  private timeoutId: ReturnType<typeof setTimeout> | null = null
  private readonly idleTime: number
  private readonly storageKey: string
  private readonly onIdle?: () => void

  constructor(
    storageKey: string,
    idleTimeMinutes: number = 5,
    onIdle?: () => void
  ) {
    this.storageKey = storageKey
    this.idleTime = idleTimeMinutes * 60 * 1000
    this.onIdle = onIdle
  }

  private resetTimer = () => {
    if (this.timeoutId) clearTimeout(this.timeoutId)

    this.timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(this.storageKey)
        console.log(
          `Cleared sessionStorage key: ${this.storageKey} due to inactivity`
        )
      }

      if (this.onIdle) {
        this.onIdle()
      }
    }, this.idleTime)
  }

  start() {
    if (typeof window === 'undefined') return

    window.addEventListener('mousemove', this.resetTimer)
    window.addEventListener('keydown', this.resetTimer)
    window.addEventListener('click', this.resetTimer)
    window.addEventListener('scroll', this.resetTimer)

    this.resetTimer()
  }

  stop() {
    if (this.timeoutId) clearTimeout(this.timeoutId)

    if (typeof window === 'undefined') return

    window.removeEventListener('mousemove', this.resetTimer)
    window.removeEventListener('keydown', this.resetTimer)
    window.removeEventListener('click', this.resetTimer)
    window.removeEventListener('scroll', this.resetTimer)
  }
}

export default IdleService
