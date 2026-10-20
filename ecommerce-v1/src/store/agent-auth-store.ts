import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { LoginAgentResponse } from '@/types/agent/auth'

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
  login: (response: LoginAgentResponse) => void
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

export const useAgentAuthStore = create<AgentAuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Authentication actions
      login: (response: LoginAgentResponse) => {
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
      name: 'agent-auth-storage',
      storage: createJSONStorage(() => localStorage),
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

// Helper function to clear the auth store from localStorage
export const clearAgentAuthStore = () => {
  localStorage.removeItem('agent-auth-storage')
}

// Selector hooks for specific parts of the store
export const useAgentUser = () => useAgentAuthStore((state) => state.user)
export const useAgentAuthToken = () =>
  useAgentAuthStore((state) => state.getAuthToken())
export const useIsAgentAuthenticated = () =>
  useAgentAuthStore((state) => state.isAuthenticated)
export const useAgentRole = () => useAgentAuthStore((state) => state.user?.role)
