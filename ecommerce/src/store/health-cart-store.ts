import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type CartItem = {
  id: string
  planId: string
  planName: string
  planSlug: string
  tierName: string
  tierSubtitle: string
  tierDescription: string
  provider: string
  providerSlug: string
  providerLogo: string
  image: string
  premium: number
  quantity: number
}

type HealthCartStore = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
}

export const useHealthCartStore = create<HealthCartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, qty = 1) => {
        const existing = get().items.find((i) => i.id === item.id)
        if (existing) {
          set((s) => ({
            items: s.items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + qty } : i
            ),
          }))
        } else {
          set((s) => ({ items: [...s.items, { ...item, quantity: qty }] }))
        }
      },
      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          set((s) => ({ items: s.items.filter((i) => i.id !== id) }))
        } else {
          set((s) => ({
            items: s.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
          }))
        }
      },
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'health-cart',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
