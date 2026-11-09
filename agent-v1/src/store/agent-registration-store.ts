import {
  RegisterAgent,
  SuccesRegisterAgent,
  RegisterAgentValidationError,
  BankDetails,
  VerificationDocuments,
} from '@/types/agent/auth'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type AgentRegistrationState = {
  step: number
  credentials: Partial<RegisterAgent>
  registrationResult: SuccesRegisterAgent | null
  isRegistering: boolean
  registrationError: string | null
  registrationSuccess: string | null
  validationErrors: Record<string, string[]> | null
  emailVerificationSent: boolean
  isEmailVerified: boolean

  bankDetails: BankDetails
  verificationDocuments: VerificationDocuments
}

type AgentRegistrationActions = {
  setCredentials: (credentials: Partial<RegisterAgent>) => void
  updateCredentials: (field: keyof RegisterAgent, value: string) => void
  clearCredentials: () => void
  setRegistrationResult: (result: SuccesRegisterAgent) => void
  clearRegistrationResult: () => void
  setIsRegistering: (isRegistering: boolean) => void
  setRegistrationError: (error: string | null) => void
  setRegistrationSuccess: (success: string | null) => void
  setValidationErrors: (errors: Record<string, string[]> | null) => void
  clearValidationErrors: () => void
  getFieldErrors: (fieldName: string) => string[]
  setEmailVerificationSent: (sent: boolean) => void
  setIsEmailVerified: (verified: boolean) => void
  resetAll: () => void

  increaseStep: () => void
  decreaseStep: () => void
  setBankDetails: (data: BankDetails) => void
  setVerificationDocuments: (data: VerificationDocuments) => void
}

const initialState: AgentRegistrationState = {
  step: 0,
  credentials: {
    firstName: '',
    lastName: '',
    email: '',
    token: '',
    password: '',
    confirmPassword: '',
    phone: '',
  },
  registrationResult: null,
  isRegistering: false,
  registrationError: null,
  registrationSuccess: null,
  validationErrors: null,
  emailVerificationSent: false,
  isEmailVerified: false,
  bankDetails: {
    bankName: '',
    bankCode: '',
    routingNumber: '',
    accountHolderName: '',
    accountNumber: '',
    accountType: 'savings' as 'savings' | 'current',
  },
  verificationDocuments: {
    idType: 'PAS' as any,
    idNumber: '',
    licenseNumber: '',
    certificateNumber: '',
    confirmInfo: false,
    authorizeCompany: false,
  },
}

export const useAgentRegistrationStore = create<
  AgentRegistrationState & AgentRegistrationActions
>()(
  persist(
    (set, get) => ({
      // Initial state
      ...initialState,

      // Credentials management
      setCredentials: (credentials: Partial<RegisterAgent>) =>
        set((state) => ({
          credentials: { ...state.credentials, ...credentials },
        })),

      updateCredentials: (field: keyof RegisterAgent, value: string) =>
        set((state) => ({
          credentials: { ...state.credentials, [field]: value },
        })),

      clearCredentials: () =>
        set({
          credentials: initialState.credentials,
        }),

      // Registration result management
      setRegistrationResult: (result: SuccesRegisterAgent) =>
        set({ registrationResult: result }),
      clearRegistrationResult: () => set({ registrationResult: null }),

      // Registration status management
      setIsRegistering: (isRegistering: boolean) => set({ isRegistering }),

      // Error management
      setRegistrationError: (error: string | null) =>
        set({ registrationError: error, registrationSuccess: null }),

      // Success management
      setRegistrationSuccess: (success: string | null) =>
        set({ registrationSuccess: success, registrationError: null }),

      // Validation error management
      setValidationErrors: (errors: Record<string, string[]> | null) =>
        set({ validationErrors: errors }),
      clearValidationErrors: () => set({ validationErrors: null }),
      getFieldErrors: (fieldName: string) => {
        const { validationErrors } = get()
        return validationErrors?.[fieldName] || []
      },

      // Email verification management
      setEmailVerificationSent: (sent: boolean) =>
        set({ emailVerificationSent: sent }),
      setIsEmailVerified: (verified: boolean) =>
        set({ isEmailVerified: verified }),

      // Helper methods
      resetAll: () =>
        set({
          ...initialState,
        }),

      increaseStep: () =>
        set((state) => ({
          step: state.step + 1,
        })),
      decreaseStep: () =>
        set((state) => ({
          step: state.step - 1,
        })),
      setBankDetails: (data: BankDetails) =>
        set((state) => ({
          ...state,
          bankDetails: { ...state.bankDetails, ...data },
        })),
      setVerificationDocuments: (data: VerificationDocuments) =>
        set((state) => ({
          ...state,
          verificationDocuments: { ...state.verificationDocuments, ...data },
        })),
    }),
    {
      name: 'agent-registration-storage',
      storage: createJSONStorage(() => sessionStorage),
      // Only persist credentials and registration result, not loading states
      partialize: (state) => ({
        step: state.step,
        credentials: state.credentials,
        registrationResult: state.registrationResult,
        emailVerificationSent: state.emailVerificationSent,
        isEmailVerified: state.isEmailVerified,
        bankDetails: state.bankDetails,
        verificationDocuments: state.verificationDocuments,
      }),
    }
  )
)

// Helper function to clear the store from sessionStorage
export const clearAgentRegistrationStore = () => {
  sessionStorage.removeItem('agent-registration-storage')
}
