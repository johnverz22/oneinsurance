import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { AdminUser, LoginAdminResponse } from '@/types/admin/auth'
import { getInitials } from '@/lib/utils'

type AdminAuthState = {
  isAuthenticated: boolean
  accessToken: string | null
  tokenType: string | null
  user: AdminUser | null
  /** True once the persisted store has been rehydrated from localStorage. */
  _hasHydrated: boolean

  // Actions
  login: (response: LoginAdminResponse) => void
  logout: () => void
  setUser: (user: AdminUser) => void
  updateUser: (updates: Partial<AdminUser>) => void
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

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      login: (response: LoginAdminResponse) => {
        const { access_token, token_type, user } = response.data
        set({ isAuthenticated: true, accessToken: access_token, tokenType: token_type, user })
      },

      logout: () => {
        // Keep _hasHydrated true — logout only runs in an already-hydrated
        // session, and resetting it leaves the store permanently "unhydrated"
        // (portal/auth layouts gate on it) until the next full page load.
        set({ ...initialState, _hasHydrated: true })
      },

      setUser: (user: AdminUser) => set({ user }),

      updateUser: (updates: Partial<AdminUser>) => {
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
      name: 'admin-auth-storage',
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
export const useAdminUser = () => useAdminAuthStore((s) => s.user)
export const useIsAuthenticated = () => useAdminAuthStore((s) => s.isAuthenticated)
export const useAdminRole = () => useAdminAuthStore((s) => s.user?.role)
export const useHasHydrated = () => useAdminAuthStore((s) => s._hasHydrated)
