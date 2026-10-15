import { create } from 'zustand'

type PaymentPhase = 'idle' | 'finalizing' | 'error' | 'success'

interface PaymentPhaseStore {
  phase: PaymentPhase
  setPhase: (phase: PaymentPhase) => void
}

export const usePaymentPhaseStore = create<PaymentPhaseStore>((set) => ({
  phase: 'idle',
  setPhase: (phase) => set({ phase }),
}))
