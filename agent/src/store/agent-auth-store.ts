import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { AgentUser, LoginAgentResponse } from '@/types/agent/auth'
import { getInitials } from '@/lib/utils'

type AgentAuthState = {
  isAuthenticated: boolean
  accessToken: string | null
  tokenType: string | null
  user: AgentUser | null
  /** True once the persisted store has been rehydrated from localStorage. */
  _hasHydrated: boolean

  // Actions
  login: (response: LoginAgentResponse) => void
  logout: () => void
  setUser: (user: AgentUser) => void
  updateUser: (updates: Partial<AgentUser>) => void
  setHasHydrated: (state: boolean) => void

  // Computed helpers (called as functions to stay reactive)
  getInitials: () => string
  getAuthHeader: () => string | null
  isTokenValid: () => boolean
}

const initialState = {
  isAuthenticated: false,
  accessToken: null,
  tokenType: null,
  user: null,
  _hasHydrated: false,
}

export const useAgentAuthStore = create<AgentAuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      login: (response: LoginAgentResponse) => {
        const { access_token, token_type, user } = response.data
        set({ isAuthenticated: true, accessToken: access_token, tokenType: token_type, user })
      },

      logout: () => {
        // Keep _hasHydrated true — logout only runs in an already-hydrated
        // session, and resetting it leaves the store permanently "unhydrated"
        // (portal/auth layouts gate on it) until the next full page load.
        set({ ...initialState, _hasHydrated: true })
      },

      setUser: (user: AgentUser) => set({ user }),

      updateUser: (updates: Partial<AgentUser>) => {
        const current = get().user
        if (current) set({ user: { ...current, ...updates } })
      },

      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

      getInitials: () => getInitials(get().user?.name),

      getAuthHeader: () => {
        const { accessToken, tokenType } = get()
        return accessToken && tokenType ? `${tokenType} ${accessToken}` : null
      },

      isTokenValid: () => {
        const { isAuthenticated, accessToken } = get()
        return isAuthenticated && !!accessToken
      },
    }),
    {
      name: 'agent-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        tokenType: state.tokenType,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

// Convenience selector hooks
export const useAgentUser = () => useAgentAuthStore((s) => s.user)
export const useIsAuthenticated = () => useAgentAuthStore((s) => s.isAuthenticated)
export const useAgentRole = () => useAgentAuthStore((s) => s.user?.role)
export const useHasHydrated = () => useAgentAuthStore((s) => s._hasHydrated)
