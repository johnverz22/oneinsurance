import { create } from 'zustand'

interface TeamSearchStore {
  query: string
  setQuery: (query: string) => void
}

export const useTeamSearchStore = create<TeamSearchStore>((set) => ({
  query: '',
  setQuery: (query: string) => set({ query }),
}))
