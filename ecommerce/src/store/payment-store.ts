import { create } from 'zustand'
import { PaymentAuthResponse } from '@/types/payment'
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware'
import * as crypto from 'crypto'

function splitEncryptedText(encryptedText: string) {
  return {
    ivString: encryptedText.slice(0, 32),
    encryptedDataString: encryptedText.slice(32),
  }
}

// Generate a proper 32-byte key for AES-256
const secretKey = process.env.SECRET_KEY || ''
const keyInBytes = crypto.createHash('sha256').update(secretKey).digest()

const SecureStorage: StateStorage = {
  getItem: (name: string): string | Promise<string | null> | null => {
    try {
      const encryptedValue = sessionStorage.getItem(name)
      if (!encryptedValue) return null

      const { encryptedDataString, ivString } =
        splitEncryptedText(encryptedValue)
      const iv = Buffer.from(ivString, 'hex')
      const decipher = crypto.createDecipheriv('aes-256-cbc', keyInBytes, iv)
      let decrypted = decipher.update(encryptedDataString, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      return decrypted || null
    } catch (error) {
      console.error('Decryption error:', error)
      // Return the raw value as fallback
      return sessionStorage.getItem(name)
    }
  },
  setItem: (name: string, value: string): unknown | Promise<unknown> => {
    try {
      const iv = crypto.randomBytes(16)
      const cipher = crypto.createCipheriv('aes-256-cbc', keyInBytes, iv)
      let encrypted = cipher.update(value, 'utf8', 'hex')
      encrypted += cipher.final('hex')

      // Combine IV and encrypted data
      const combinedData = iv.toString('hex') + encrypted
      sessionStorage.setItem(name, combinedData)
    } catch (error) {
      console.error('Encryption error:', error)
      // Fallback to plain storage in case of encryption failure
      sessionStorage.setItem(name, value)
    }
    return
  },
  removeItem: (name: string): unknown | Promise<unknown> => {
    sessionStorage.removeItem(name)
    return
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
