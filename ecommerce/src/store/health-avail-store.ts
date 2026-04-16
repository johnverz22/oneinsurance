import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type HealthAvailStore = {
  step: number
  highestVisitedStep: number
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  resetSteps: () => void
}

export const useHealthAvailStore = create<HealthAvailStore>()(
  persist(
    (set, get) => ({
      step: 0,
      highestVisitedStep: 0,
      setStep: (step) =>
        set((s) => ({
          step,
          highestVisitedStep: Math.max(s.highestVisitedStep, step),
        })),
      nextStep: () =>
        set((s) => ({
          step: s.step + 1,
          highestVisitedStep: Math.max(s.highestVisitedStep, s.step + 1),
        })),
      prevStep: () => set((s) => ({ step: Math.max(0, s.step - 1) })),
      resetSteps: () => set({ step: 0, highestVisitedStep: 0 }),
    }),
    {
      name: 'health-avail',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
