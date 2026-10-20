import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

declare global {
  interface Window {
    Pusher: typeof Pusher
    Echo: Echo<'reverb'> | null
  }
}

let echoInstance: Echo<'reverb'> | null = null

export const getEcho = (): Echo<'reverb'> => {
  if (typeof window === 'undefined') {
    throw new Error('Echo can only be initialized on the client side')
  }

  if (!echoInstance) {
    window.Pusher = Pusher
    Pusher.logToConsole = process.env.NODE_ENV === 'development'

    const config = {
      broadcaster: 'reverb' as const,
      key: process.env.NEXT_PUBLIC_REVERB_APP_KEY || '',
      wsHost: process.env.NEXT_PUBLIC_REVERB_HOST || 'localhost',
      wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT) || 8080,
      wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT) || 8080,
      forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME || 'http') === 'https',
      enabledTransports: ['ws', 'wss'] as ('ws' | 'wss')[],
    }

    echoInstance = new Echo(config)
    window.Echo = echoInstance
  }

  return echoInstance
}
