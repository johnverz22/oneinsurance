import {
  CtplDuration,
  CtplInsuranceProduct,
  PersonalInfoFormData,
  VehicleRegistrationFormData,
} from '@/types/ctpl-insurance'
import { CTPLCoverageOptionFormData } from '@/types/ctpl-insurance/init-compare'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type CptlInsuranceState = {
  step: number
  highestVisitedStep: number
  increaseStep: () => void
  decreaseStep: () => void
  setHighestVisitedStep: (step: number) => void
  selectedVehicle: CtplInsuranceProduct
  setSelectedVehicle: (vehicle: CtplInsuranceProduct) => void
  duration: CtplDuration
  setDuration: (duration: CtplDuration) => void
  vehicleRegistration: VehicleRegistrationFormData
  setVehicleRegistration: (data: VehicleRegistrationFormData) => void
  personalInfo: PersonalInfoFormData
  setPersonalInfo: (data: PersonalInfoFormData) => void
  clientRequestId: string
  setClientRequestId: (id: string) => void
  coverageOption: CTPLCoverageOptionFormData
  updateCoverageOption: (data: Partial<CTPLCoverageOptionFormData>) => void
  reset: () => void
}

const initialCptlInsuranceState = {
  step: 0,
  highestVisitedStep: 0,
  selectedVehicle: {
    image: '',
    title: '',
    code: 'MOTORCYCLE' as const,
  },
  duration: {} as CtplDuration,
  vehicleRegistration: {
    mvFileNumber: '',
    plateNumber: '',
    engineNumber: '',
    chassisNumber: '',
    make: '',
    model: '',
    bodyType: '',
    modelYear: '',
    subModel: '',
    typeOfUse: '',
    dateOfRegistration: new Date(),
    fieldOfficeCode: '',
    agreeToTerms: false,
  } as VehicleRegistrationFormData,
  personalInfo: {
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: 'No Suffix',
    gender: '',
    dateOfBirth: new Date(),
    idType: '',
    idNumber: '',
    province: '',
    city: '',
    zipCode: '',
    addressLine1: '',
    addressLine2: '',
    mobileNumber: '',
    email: '',
  } as PersonalInfoFormData,
  clientRequestId: '',
  coverageOption: {
    selectedPlan: undefined,
    selectedAddonBenefits: undefined,
    carrierCode: '',
  },
} as CptlInsuranceState

export const useCtplInsuranceStateStore = create<CptlInsuranceState>()(
  persist(
    (set) => ({
      ...initialCptlInsuranceState,
      increaseStep: () =>
        set((state) => ({
          step: state.step + 1,
          highestVisitedStep: Math.max(
            state.highestVisitedStep,
            state.step + 1
          ),
        })),
      decreaseStep: () => set((state) => ({ step: state.step - 1 })),
      setHighestVisitedStep: (step) => set({ highestVisitedStep: step }),
      setSelectedVehicle: (product) => set({ selectedVehicle: product }),
      setDuration: (duration) => set({ duration }),
      setVehicleRegistration: (data) => set({ vehicleRegistration: data }),
      setPersonalInfo: (data) => set({ personalInfo: data }),
      setClientRequestId: (id) => set({ clientRequestId: id }),
      updateCoverageOption: (data) =>
        set((state) => ({
          coverageOption: { ...state.coverageOption, ...data },
        })),
      reset: () => set({ ...initialCptlInsuranceState }),
    }),
    {
      name: 'ctpl-insurance-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
