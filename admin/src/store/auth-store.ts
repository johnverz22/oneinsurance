import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import CryptoJS from 'crypto-js'
import { LoginResponse } from '@/types/auth'

type AgentUser = {
  id: number
  name: string
  email: string
  role: string
  designation: string
  status: string
  created_at: string
  updated_at: string
}

type AgentAuthState = {
  // Authentication status
  isAuthenticated: boolean

  // Token information
  accessToken: string | null
  tokenType: string | null

  // User information
  user: AgentUser | null

  // Authentication actions
  login: (response: LoginResponse) => void
  logout: () => void

  // Token management
  setToken: (token: string, tokenType: string) => void
  clearToken: () => void

  // User information management
  setUser: (user: AgentUser) => void
  updateUser: (updates: Partial<AgentUser>) => void
  clearUser: () => void

  // Helper methods
  getAuthToken: () => string | null
  isTokenValid: () => boolean
  hasRole: (role: string) => boolean
}

const initialState = {
  isAuthenticated: false,
  accessToken: null,
  tokenType: null,
  user: null,
}

export const useAuthStore = create<AgentAuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Authentication actions
      login: (response: LoginResponse) => {
        const { access_token, token_type, user } = response.data
        set({
          isAuthenticated: true,
          accessToken: access_token,
          tokenType: token_type,
          user: user,
        })
      },

      logout: () => {
        set({
          ...initialState,
        })
      },

      // Token management
      setToken: (token: string, tokenType: string) => {
        set({
          accessToken: token,
          tokenType: tokenType,
          isAuthenticated: !!token,
        })
      },

      clearToken: () => {
        set({
          accessToken: null,
          tokenType: null,
          isAuthenticated: false,
        })
      },

      // User information management
      setUser: (user: AgentUser) => {
        set({ user })
      },

      updateUser: (updates: Partial<AgentUser>) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates },
          })
        }
      },

      clearUser: () => {
        set({ user: null })
      },

      // Helper methods
      getAuthToken: () => {
        const { accessToken, tokenType } = get()
        if (accessToken && tokenType) {
          return `${tokenType} ${accessToken}`
        }
        return null
      },

      isTokenValid: () => {
        const { accessToken, isAuthenticated } = get()
        return isAuthenticated && !!accessToken
      },

      hasRole: (role: string) => {
        const { user } = get()
        return user?.role === role || user?.designation === role
      },
    }),
    {
      name: 'admin-auth-storage',
      storage: createJSONStorage(() => {
        // If running on the server (SSR) provide a noop storage to avoid
        // referencing `localStorage` which doesn't exist on the server.
        if (
          typeof window === 'undefined' ||
          typeof localStorage === 'undefined'
        ) {
          return {
            getItem: (_name: string) => null,
            setItem: (_name: string, _value: string) => {},
            removeItem: (_name: string) => {},
          } as Storage
        }

        const secret = process.env.NEXT_PUBLIC_STORAGE_SECRET

        // If no secret is provided, use plain localStorage in the browser.
        if (!secret) {
          return localStorage
        }

        // Encrypted storage wrapper for the browser when a secret is set.
        return {
          getItem: (name: string) => {
            try {
              const cipher = localStorage.getItem(name)
              if (!cipher) return null
              const bytes = CryptoJS.AES.decrypt(cipher, secret)
              const decrypted = bytes.toString(CryptoJS.enc.Utf8)
              return decrypted
            } catch (e) {
              console.error('Failed to decrypt storage item', e)
              return null
            }
          },
          setItem: (name: string, value: string) => {
            try {
              const cipher = CryptoJS.AES.encrypt(value, secret).toString()
              localStorage.setItem(name, cipher)
            } catch (e) {
              console.error('Failed to encrypt storage item', e)
            }
          },
          removeItem: (name: string) => localStorage.removeItem(name),
        } as Storage
      }),
      // Only persist authentication data, not temporary states
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        tokenType: state.tokenType,
        user: state.user,
      }),
    }
  )
)

// Selector hooks for specific parts of the store
export const useAgentUser = () => useAuthStore((state) => state.user)
export const useAgentAuthToken = () =>
  useAuthStore((state) => state.getAuthToken())
export const useIsAgentAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated)
export const useAgentRole = () => useAuthStore((state) => state.user?.role)
