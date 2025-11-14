import { addDays } from 'date-fns'
import { create } from 'zustand'
import { devtools, createJSONStorage, persist } from 'zustand/middleware'
import {
  CoverageOptionFormData,
  PersonalInfoFormData,
  TravelersInfoFormData,
  TravelInsuranceFormData,
} from '@/types/travel-insurance/travel-insurance-request'
import {
  FullQuoteResponse,
  IssueQuoteResponse,
} from '@/types/travel-insurance/policy-types'
import { TravelInsuranceApiResponse } from '@/types/plan'
import {
  PaymentBrand,
  PaymentSubmitRequest,
  PaymentSubmitResponse,
} from '@/types/payment'

export type ClientRequest = {
  id?: string | undefined
  status: 'success' | 'fetching' | 'error'
}

export type TravelInsuranceStoreState = {
  step: number
  highestVisitedStep: number
  policyNo?: string
  refCode: string | null
  travelDetails: TravelInsuranceFormData
  clientRequest: ClientRequest
  coverageOption: CoverageOptionFormData
  travelersInfo: TravelersInfoFormData
  isFormModified: boolean // Track if form has been modified since last search
  insurancePlans: TravelInsuranceApiResponse | null
  paymentSubmitResponse: PaymentSubmitResponse | null
  issueQuoteResponse: IssueQuoteResponse | null
  selectedPaymentBrand: PaymentBrand | null
  paymentBillingDetails?: PaymentSubmitRequest | null
  quoteRefetchCount: number
}

export type TravelInsuranceStoreActions = {
  nextStep: () => void
  prevStep: () => void
  setStep: (step: number) => void
  updateTravelDetails: (details: Partial<TravelInsuranceFormData>) => void
  setClientRequest: (request: ClientRequest) => void
  updateTravelersInfo: (info: TravelersInfoFormData) => void
  setPolicyNo: (policyNo: string) => void
  resetForm: () => void
  resetAvailForm: () => void
  updateCoverageOption: (data: Partial<CoverageOptionFormData>) => void
  resetCoverageOption: () => void
  setFormModified: (modified: boolean) => void
  setInsurancePlans: (plans: TravelInsuranceApiResponse | null) => void
  setPaymentSubmitResponse: (response: PaymentSubmitResponse | null) => void
  incrementQuoteRefetchCount: () => void
  resetQuoteRefetchCount: () => void
  setIssueQuoteResponse: (response: IssueQuoteResponse | null) => void
  setSelectedPaymentBrand: (brand: PaymentBrand | null) => void
  setPaymentBillingDetails: (details: PaymentSubmitRequest | null) => void
  setRefCode: (refCode: string | null) => void
}

export type TravelInsuranceStore = TravelInsuranceStoreState &
  TravelInsuranceStoreActions

const initialState = {
  step: 1,
  highestVisitedStep: 1,
  travelDetails: {
    travelType: 'INDIVIDUAL',
    travelDetailList: [
      {
        DisplaySequence: 1,
        TravelCountry: 'JAPAN',
        PlaceOfOrgin: 'PHILIPPINES',
        TravelCoverageArea: 'WORLD',
      },
    ],
    departureDate: new Date(),
    returnDate: addDays(new Date(), 3),
    dateOfBirth: new Date('1990-01-01'),
    noOfAdults: 1,
    noOfChildren: 0,
    isAnnualMultiTrip: false,
    agreedToTerms: true,
  },
  clientRequest: {
    id: undefined,
    status: 'fetching',
  },
  coverageOption: {
    selectedPlan: undefined,
    selectedAddonBenefits: undefined,
    carrierCode: '',
  },
  travelersInfo: [
    {
      idType: 'PAS' as const,
      idNumber: '',
      firstName: '',
      lastName: '',
      dateOfBirth: new Date('1990-01-01'),
      suffix: 'No Suffix',
      email: '',
      mobileNumber: '',
      gender: 'M',
      address: {
        city: '',
        province: '',
        zipCode: '',
        line1: '',
        line2: '',
      },
      hasBeneficiary: false,
      beneficiary: {
        firstName: '',
        middleName: '',
        lastName: '',
        dateOfBirth: null,
        relationship: '',
      },
    },
  ],
  isFormModified: false,
  insurancePlans: null,
  paymentSubmitResponse: null,
  issueQuoteResponse: null,
  selectedPaymentBrand: null,
  paymentBillingDetails: null,
  quoteRefetchCount: 0,
  refCode: null,
} satisfies TravelInsuranceStoreState

export const useTravelInsuranceStore = create<TravelInsuranceStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      nextStep: () =>
        set((state) => ({
          step: state.step + 1,
          highestVisitedStep: Math.max(
            state.highestVisitedStep,
            state.step + 1
          ),
        })),
      prevStep: () => set((state) => ({ step: state.step - 1 })),
      setStep: (step) =>
        set((state) => ({
          step: step,
          highestVisitedStep: Math.max(
            state.highestVisitedStep,
            step,
            state.step
          ),
        })),
      updateTravelDetails: (details) =>
        set((state) => ({
          travelDetails: { ...state.travelDetails, ...details },
        })),

      setClientRequest: (value) =>
        set((state) => ({
          clientRequest: { ...state.clientRequest, ...value },
        })),

      updateTravelersInfo: (info) =>
        set((state) => ({
          travelersInfo: info,
        })),

      setPolicyNo: (policyNo) => set({ policyNo }),

      resetForm: () => set(initialState),
      resetAvailForm: () =>
        set({
          step: initialState.step,
          highestVisitedStep: initialState.highestVisitedStep,
          coverageOption: initialState.coverageOption,
          travelersInfo: initialState.travelersInfo,
          paymentSubmitResponse: initialState.paymentSubmitResponse,
          clientRequest: initialState.clientRequest,
          insurancePlans: initialState.insurancePlans,
        }),

      updateCoverageOption: (data) =>
        set((state) => ({
          coverageOption: { ...state.coverageOption, ...data },
        })),
      resetCoverageOption: () =>
        set({ coverageOption: initialState.coverageOption }),

      setFormModified: (modified) => set({ isFormModified: modified }),
      setInsurancePlans: (plans) => set({ insurancePlans: plans }),
      setPaymentSubmitResponse: (response) =>
        set({ paymentSubmitResponse: response }),
      incrementQuoteRefetchCount: () =>
        set((state) => ({ quoteRefetchCount: state.quoteRefetchCount + 1 })),
      resetQuoteRefetchCount: () => set({ quoteRefetchCount: 0 }),
      setIssueQuoteResponse: (response) =>
        set({ issueQuoteResponse: response }),
      setSelectedPaymentBrand: (brand) => set({ selectedPaymentBrand: brand }),
      setPaymentBillingDetails: (details) =>
        set({ paymentBillingDetails: details }),
      setRefCode: (refCode) => set({ refCode }),
    }),
    {
      name: 'travel-insurance-form',
      storage: createJSONStorage(() => sessionStorage, {
        reviver: (key, value) => {
          // Convert date strings back to Date objects
          if (
            key === 'departureDate' ||
            key === 'returnDate' ||
            key === 'dateOfBirth'
          ) {
            return value && typeof value === 'string' ? new Date(value) : value
          }
          return value
        },
        replacer: (key, value) => {
          // Convert Date objects to ISO strings for storage
          if (value instanceof Date) {
            return value.toISOString()
          }
          return value
        },
      }),
      onRehydrateStorage: () => (state) => {
        // Additional processing after rehydration to ensure dates are Date objects
        if (state) {
          if (
            state.travelDetails.departureDate &&
            typeof state.travelDetails.departureDate === 'string'
          ) {
            state.travelDetails.departureDate = new Date(
              state.travelDetails.departureDate
            )
          }
          if (
            state.travelDetails.returnDate &&
            typeof state.travelDetails.returnDate === 'string'
          ) {
            state.travelDetails.returnDate = new Date(
              state.travelDetails.returnDate
            )
          }
          if (
            state.travelDetails.dateOfBirth &&
            typeof state.travelDetails.dateOfBirth === 'string'
          ) {
            state.travelDetails.dateOfBirth = new Date(
              state.travelDetails.dateOfBirth
            )
          }
          // Also handle travelers dates
          if (state.travelersInfo && Array.isArray(state.travelersInfo)) {
            state.travelersInfo.forEach((traveler) => {
              if (
                traveler.dateOfBirth &&
                typeof traveler.dateOfBirth === 'string'
              ) {
                traveler.dateOfBirth = new Date(traveler.dateOfBirth)
              }
              if (
                traveler.beneficiary?.dateOfBirth &&
                typeof traveler.beneficiary.dateOfBirth === 'string'
              ) {
                traveler.beneficiary.dateOfBirth = new Date(
                  traveler.beneficiary.dateOfBirth
                )
              }
            })
          }
        }
      },
    }
  )
)

const defaultApiResponse: FullQuoteResponse = {
  success: false,
  message: '',
  data: {
    Age: 0,
    AnnualPremium: 0,
    AutoUwResultCode: '',
    BeforeVatPremium: 0,
    BusinessCateCode: '',
    BusinessObjectId: 0,
    CarrierCode: '',
    CarrierPlanCode: '',
    CarrierProductCode: '',
    DataEntryUserId: 0,
    DataEntryUserRealName: '',
    DuePremium: 0,
    EffectiveDate: '',
    ExpiryDate: '',
    FirstDataEntryDate: '',
    GrossPremium: 0,
    IsAgent: '',
    IsPremiumCalcSuccess: '',
    IsRenewable: '',
    IsTakeUpPolicy: '',
    LGT: 0,
    NoOfAdults: 0,
    NoOfChildren: 0,
    NoOfTravellers: 0,
    OrgCode: '',
    PlanCode: '',
    PolicyCustomerList: [],
    PolicyElementId: 0,
    PolicyId: '',
    PolicyLobList: [],
    PolicyStatus: 0,
    PolicyStatusForDisplay: 0,
    PolicyType: '',
    Portal: '',
    PremCalcFactorHash: '',
    PremCalcResultHash: '',
    ProductCode: '',
    ProductId: 0,
    ProductVersion: '',
    PromoCodeList: [],
    ProposalDate: '',
    ProposalNo: '',
    ProposalStatus: '',
    QuotationDate: '',
    SchemaVersion: 0,
    SumInsured: 0,
    TechProductCode: '',
    TechProductId: 0,
    TravelDays: 0,
    TravelDetailList: [],
    TravelType: '',
    TripType: '',
    VersionSeq: 0,
  },
}

interface FullQuoteResponseState {
  apiResponse: FullQuoteResponse
}

interface FullQuoteResponseActions {
  setApiResponse: (response: FullQuoteResponse) => void
  updateApiResponse: (updates: Partial<FullQuoteResponse>) => void
  resetApiResponse: () => void
}

type FullQuoteResponseStore = FullQuoteResponseState & FullQuoteResponseActions

export const useFullQuoteResponseStore = create<FullQuoteResponseStore>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        apiResponse: defaultApiResponse,

        // Actions
        setApiResponse: (response: FullQuoteResponse) =>
          set({ apiResponse: response }),

        updateApiResponse: (updates: Partial<FullQuoteResponse>) =>
          set((state) => ({
            apiResponse: { ...state.apiResponse, ...updates },
          })),

        resetApiResponse: () => set({ apiResponse: defaultApiResponse }),
      }),
      {
        name: 'policy-storage',
        storage: createJSONStorage(() => sessionStorage),
      }
    ),
    {
      name: 'policy-store',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)

// Export types
export type {
  FullQuoteResponseStore,
  FullQuoteResponseState,
  FullQuoteResponseActions,
}
