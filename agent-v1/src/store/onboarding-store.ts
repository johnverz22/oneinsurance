import { Onboarding } from '@/types/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type OnboardingState = Partial<Onboarding> & {
  setData: (data: Partial<Onboarding>) => void
}

export const useOnboardingStateStore = create<OnboardingState>()(
  persist(
    (set) => ({
      setData: (data: Partial<OnboardingState>) => set(data),
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

interface OnboardingStepState {
  step: number
  increaseStep: () => void
  decreaseStep: () => void
}

export const useOnboardingStepStateStore = create<OnboardingStepState>()(
  persist(
    (set) => ({
      step: 0,
      increaseStep: () => set((state) => ({ step: state.step + 1 })),
      decreaseStep: () => set((state) => ({ step: state.step - 1 })),
    }),
    {
      name: 'onboarding-step-state',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
