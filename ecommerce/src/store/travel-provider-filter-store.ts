import { create } from 'zustand'

interface TravelProviderFilterState {
  providerFilter: string | null // CarrierCode to filter by (e.g., 'OONAPH', 'PACIFIC', 'MALAYAN')
  setProviderFilter: (filter: string | null) => void
}

export const useTravelProviderFilter = create<TravelProviderFilterState>((set) => ({
  providerFilter: null,
  setProviderFilter: (filter) => set({ providerFilter: filter }),
}))
