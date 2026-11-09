import { create } from 'zustand'

type TopBarSearchState = {
  query: string
  setQuery: (query: string) => void
}

/**
 * Query string for the top bar's dashboard quick search.
 * Written by PortalTopBar on /dashboard; read by the dashboard page to
 * filter its navigation areas. Not persisted.
 */
export const useTopBarSearchStore = create<TopBarSearchState>((set) => ({
  query: '',
  setQuery: (query) => set({ query }),
}))
