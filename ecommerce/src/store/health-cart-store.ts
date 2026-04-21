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
  carrierCode?: string
  carrierPlanCode?: string
  carrierProductCode?: string
}

export type HealthInsuredInfo = {
  insuredName: string
  email: string
  mobile: string
  dateOfBirth: string
  genderCode: 'M' | 'F'
  isSmoker: 'Y' | 'N'
  effectiveDate: string
}

export type CompareQuotePlan = {
  CarrierCode?: string
  CarrierPlanCode: string
  CarrierPlanDesc: string
  CarrierProductCode: string
  CarrierProductName: string
  GrossPremium: string
  DuePremium: string
  SumInsured: string
  MainBenefits: Array<{
    BenefitCode: string
    BenefitDesc: string
    CoverageName: string
    DefaultLimitDesc: string
  }>
}

type HealthCartStore = {
  items: CartItem[]
  proposalNo: string | null
  insuredInfo: HealthInsuredInfo | null
  compareQuotePlans: CompareQuotePlan[]
  isLoadingPlans: boolean
  plansError: string | null
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  setProposalNo: (proposalNo: string) => void
  setInsuredInfo: (info: HealthInsuredInfo) => void
  setCompareQuotePlans: (plans: CompareQuotePlan[]) => void
  setIsLoadingPlans: (loading: boolean) => void
  setPlansError: (error: string | null) => void
}

export const useHealthCartStore = create<HealthCartStore>()(
  persist(
    (set, get) => ({
      items: [],
      proposalNo: null,
      insuredInfo: null,
      compareQuotePlans: [],
      isLoadingPlans: false,
      plansError: null,
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
      clearCart: () => set({ items: [], proposalNo: null }),
      setProposalNo: (proposalNo) => set({ proposalNo }),
      setInsuredInfo: (info) => set({ insuredInfo: info }),
      setCompareQuotePlans: (plans) => set({ compareQuotePlans: plans }),
      setIsLoadingPlans: (loading) => set({ isLoadingPlans: loading }),
      setPlansError: (error) => set({ plansError: error }),
    }),
    {
      name: 'health-cart',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
