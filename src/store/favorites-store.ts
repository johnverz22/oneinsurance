import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { Insurance } from '@/types/insurance'

type Item = Pick<Insurance, 'id' | 'companyId'>

type FavoritesStoreState = {
  items: Item[]
}

type FavoritesStoreActions = {
  reset: () => void
  addItem: (item: Item) => void
  removeItem: (item: Item['id']) => void
}

type FavoritesStore = FavoritesStoreState & FavoritesStoreActions

const DEFAULT_FAVORITES_STORE_STATE: FavoritesStoreState = {
  items: [],
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set) => ({
      ...DEFAULT_FAVORITES_STORE_STATE,
      reset: () => set(DEFAULT_FAVORITES_STORE_STATE),
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      removeItem: (itemToRemove) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemToRemove),
        })),
    }),
    {
      name: '__favorites_storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
