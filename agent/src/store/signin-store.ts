import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type SignInProps = {
  email: string
  firstName: string
  lastName: string
  dateOfBirth: Date
  gender: 'male' | 'female' | 'prefer not to say'
  phoneNumber: string
  country: string
  state: string
  city: string
  zipCode: string
  address: string
  occupation: string
  annualIncome: number
}

interface SignInState extends SignInProps {
  setEmail: (email: string) => void
  setFirstName: (firstName: string) => void
  setLastName: (lastName: string) => void
  setDateOfBirth: (dateOfBirth: Date) => void
  setGender: (gender: 'male' | 'female' | 'prefer not to say') => void
  setPhoneNumber: (phoneNumber: string) => void
  setCountry: (country: string) => void
  setState: (state: string) => void
  setCity: (city: string) => void
  setZipCode: (zipCode: string) => void
  setAddress: (address: string) => void
  setOccupation: (occupation: string) => void
  setAnnualIncome: (annualIncome: number) => void
}

type SignInStore = ReturnType<typeof useSignInStateStore>

export const useSignInStateStore = create<SignInState>()(
  persist(
    (set) => ({
      email: '',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      dateOfBirth: new Date(2000, 0, 1),
      gender: 'male',
      phoneNumber: '09365214752',
      country: 'Philippines',
      state: 'La Union',
      city: 'San Juan',
      zipCode: '2514',
      address: 'Urbiztondo, San Juan, La Union',
      occupation: 'Entrepreneur',
      annualIncome: 100_000,
      setEmail: (email: string) => set({ email: email }),
      setFirstName: (firstName: string) => set({ firstName: firstName }),
      setLastName: (lastName: string) => set({ lastName: lastName }),
      setDateOfBirth: (dateOfBirth: Date) => set({ dateOfBirth: dateOfBirth }),
      setGender: (gender: 'male' | 'female' | 'prefer not to say') =>
        set({ gender: gender }),
      setPhoneNumber: (phoneNumber: string) =>
        set({ phoneNumber: phoneNumber }),
      setCountry: (country: string) => set({ country: country }),
      setState: (state: string) => set({ state: state }),
      setCity: (city: string) => set({ city: city }),
      setZipCode: (zipCode: string) => set({ zipCode: zipCode }),
      setAddress: (address: string) => set({ address: address }),
      setOccupation: (occupation: string) => set({ occupation: occupation }),
      setAnnualIncome: (annualIncome: number) =>
        set({ annualIncome: annualIncome }),
    }),
    {
      name: 'sign-in-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export const clearSignInStateStore = () => {
  localStorage.removeItem('sign-in-storage')
}
