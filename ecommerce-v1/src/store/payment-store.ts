import { create } from 'zustand'
import { PaymentAuthResponse } from '@/types/payment'
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware'

// ---------------------------------------------------------------------------
// AES-GCM encryption using the browser's built-in Web Crypto API.
// Node.js `crypto` cannot be used here because this store runs in the browser.
// A fixed application key is used to obfuscate sessionStorage contents.
// This is not cryptographic secret protection — the goal is to prevent plain-
// text tokens sitting in sessionStorage in easily readable form.
// ---------------------------------------------------------------------------

async function getKey(): Promise<CryptoKey> {
  const raw = new TextEncoder().encode('one-insurance-payment-store-key')
  // Import the raw bytes as a base key for PBKDF2-style derivation.
  // Using a fixed salt is acceptable here since we're not protecting secrets.
  const baseKey = await crypto.subtle.importKey('raw', raw, 'PBKDF2', false, [
    'deriveKey',
  ])
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode('one-insurance-payment-store'),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

async function encryptValue(value: string): Promise<string> {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(value)
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  )
  // Combine iv + ciphertext and base64-encode for storage
  const combined = new Uint8Array(iv.byteLength + cipherBuffer.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(cipherBuffer), iv.byteLength)
  return btoa(String.fromCharCode(...combined))
}

async function decryptValue(stored: string): Promise<string | null> {
  try {
    const key = await getKey()
    const combined = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0))
    const iv = combined.slice(0, 12)
    const ciphertext = combined.slice(12)
    const plainBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    )
    return new TextDecoder().decode(plainBuffer)
  } catch {
    return null
  }
}

const SecureStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const stored = sessionStorage.getItem(name)
      if (!stored) return null
      return await decryptValue(stored)
    } catch {
      // Fallback: return raw value if decryption fails (e.g. after key change)
      return sessionStorage.getItem(name)
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const encrypted = await encryptValue(value)
      sessionStorage.setItem(name, encrypted)
    } catch {
      // Fallback to plain storage so the app doesn't break
      sessionStorage.setItem(name, value)
    }
  },

  removeItem: (name: string): void => {
    sessionStorage.removeItem(name)
  },
}

interface PaymentAuthState extends PaymentAuthResponse {
  setAuthData: (data: PaymentAuthResponse) => void
}

const initialPaymentAuthState: PaymentAuthResponse = {
  token_type: '',
  expires_in: 0,
  access_token: '',
}

export const usePaymentAuthStore = create<PaymentAuthState>()(
  persist(
    (set) => ({
      ...initialPaymentAuthState,
      setAuthData: (data) => set(() => ({ ...data })),
    }),
    {
      name: 'payment-auth-storage',
      storage: createJSONStorage(() => SecureStorage),
    }
  )
)
