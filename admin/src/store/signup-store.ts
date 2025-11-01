import { SignUpType } from '@/types/signup-schema'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type SignUpStepState = {
  step: number
  increaseStep: () => void
  decreaseStep: () => void
}

export const useSignUpStepStateStore = create<SignUpStepState>()(
  persist(
    (set) => ({
      step: 0,
      increaseStep: () => set((state) => ({ step: state.step + 1 })),
      decreaseStep: () => set((state) => ({ step: state.step - 1 })),
    }),
    {
      name: 'step-page-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

type SignUpState = Partial<SignUpType> & {
  setData: (data: Partial<SignUpType>) => void
}

export const useSignUpStateStore = create<SignUpState>()(
  persist(
    (set) => ({
      setData: (data) => set(data),
    }),
    {
      name: 'signup-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export const deleteSignUpStateStore = () => {
  localStorage.removeItem('signup-storage')
}

export const deleteSignUpStepStateStore = () => {
  localStorage.removeItem('step-page-storage')
}
