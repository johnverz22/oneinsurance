import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { CheckoutForm } from '@/types/checkout'
import { STEPS } from '@/components/checkout/config'

type CheckoutStoreState = {
  currentStep: number
  formData: Partial<CheckoutForm>
}

type CheckoutStoreActions = {
  setCurrentStep: (step: number) => void
  updateFormData: (data: Partial<CheckoutForm>) => void
  nextStep: () => void
  prevStep: () => void
  resetForm: () => void
}

type CheckoutStore = CheckoutStoreState & CheckoutStoreActions

const DEFAULT_CHECKOUT_STORE_STATE: CheckoutStoreState = {
  currentStep: 0,
  formData: {},
}

export const useCheckoutStore = create<CheckoutStore>()(
  persist(
    (set) => ({
      ...DEFAULT_CHECKOUT_STORE_STATE,
      setCurrentStep: (step) => set({ currentStep: step }),
      updateFormData: (data) =>
        set((state) => ({
          formData: { ...state.formData, ...data },
        })),
      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, STEPS.length),
        })),
      prevStep: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 0),
        })),
      resetForm: () => set(DEFAULT_CHECKOUT_STORE_STATE),
    }),
    {
      name: '__checkout_storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        const { currentStep, ...rest } = state
        return rest
      },
    }
  )
)
