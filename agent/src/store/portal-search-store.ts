import { create } from 'zustand'

type PortalSearchState = {
  searchQuery: string
  setSearchQuery: (query: string) => void
  clearSearch: () => void
}

export const usePortalSearchStore = create<PortalSearchState>((set) => ({
  searchQuery: '',
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  clearSearch: () => set({ searchQuery: '' }),
}))
