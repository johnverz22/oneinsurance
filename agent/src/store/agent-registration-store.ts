import {
  RegisterAgent,
  SuccesRegisterAgent,
  RegisterAgentValidationError,
} from '@/types/agent/auth'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type AgentRegistrationState = {
  // Agent credentials being entered
  credentials: Partial<RegisterAgent>
  setCredentials: (credentials: Partial<RegisterAgent>) => void
  updateCredentials: (field: keyof RegisterAgent, value: string) => void
  clearCredentials: () => void

  // Registration result
  registrationResult: SuccesRegisterAgent | null
  setRegistrationResult: (result: SuccesRegisterAgent) => void
  clearRegistrationResult: () => void

  // Registration status
  isRegistering: boolean
  setIsRegistering: (isRegistering: boolean) => void

  // Registration error
  registrationError: string | null
  setRegistrationError: (error: string | null) => void

  // Validation errors (422)
  validationErrors: Record<string, string[]> | null
  setValidationErrors: (errors: Record<string, string[]> | null) => void
  clearValidationErrors: () => void
  getFieldErrors: (fieldName: string) => string[]

  // Email verification tracking
  emailVerificationSent: boolean
  setEmailVerificationSent: (sent: boolean) => void
  isEmailVerified: boolean
  setIsEmailVerified: (verified: boolean) => void

  // Helper methods
  resetAll: () => void
  isFormValid: () => boolean
}

export const useAgentRegistrationStore = create<AgentRegistrationState>()(
  persist(
    (set, get) => ({
      // Initial state
      credentials: {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
      },
      registrationResult: null,
      isRegistering: false,
      registrationError: null,
      validationErrors: null,
      emailVerificationSent: false,
      isEmailVerified: false,

      // Credentials management
      setCredentials: (credentials) =>
        set((state) => ({
          credentials: { ...state.credentials, ...credentials },
        })),

      updateCredentials: (field, value) =>
        set((state) => ({
          credentials: { ...state.credentials, [field]: value },
        })),

      clearCredentials: () =>
        set({
          credentials: {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: '',
            phone: '',
          },
        }),

      // Registration result management
      setRegistrationResult: (result) => set({ registrationResult: result }),
      clearRegistrationResult: () => set({ registrationResult: null }),

      // Registration status management
      setIsRegistering: (isRegistering) => set({ isRegistering }),

      // Error management
      setRegistrationError: (error) => set({ registrationError: error }),

      // Validation error management
      setValidationErrors: (errors) => set({ validationErrors: errors }),
      clearValidationErrors: () => set({ validationErrors: null }),
      getFieldErrors: (fieldName) => {
        const { validationErrors } = get()
        return validationErrors?.[fieldName] || []
      },

      // Email verification management
      setEmailVerificationSent: (sent) => set({ emailVerificationSent: sent }),
      setIsEmailVerified: (verified) => set({ isEmailVerified: verified }),

      // Helper methods
      resetAll: () =>
        set({
          credentials: {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: '',
            phone: '',
          },
          registrationResult: null,
          isRegistering: false,
          registrationError: null,
          validationErrors: null,
          emailVerificationSent: false,
          isEmailVerified: false,
        }),

      isFormValid: () => {
        const { credentials } = get()
        return !!(
          credentials.firstName &&
          credentials.lastName &&
          credentials.email &&
          credentials.password &&
          credentials.confirmPassword &&
          credentials.phone &&
          credentials.password === credentials.confirmPassword &&
          credentials.email.includes('@') &&
          credentials.phone.length >= 11
        )
      },
    }),
    {
      name: 'agent-registration-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist credentials and registration result, not loading states
      partialize: (state) => ({
        credentials: state.credentials,
        registrationResult: state.registrationResult,
        emailVerificationSent: state.emailVerificationSent,
        isEmailVerified: state.isEmailVerified,
      }),
    }
  )
)

// Helper function to clear the store from localStorage
export const clearAgentRegistrationStore = () => {
  localStorage.removeItem('agent-registration-storage')
}
