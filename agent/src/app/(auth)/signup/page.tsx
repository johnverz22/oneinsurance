'use client'

import { useRouter } from 'next/navigation'
import { useAgentAuthStore } from '@/store/agent-auth-store'
import { useEffect } from 'react'
import BankDetailsForm from './bank-details-form'
import VerificationDocumentsForm from './verification-documents-form'
import SignupForm from './signup-form'
import { useAgentRegistrationStore } from '@/store/agent-registration-store'

export default function SignUpPage() {
  const router = useRouter()
  const { step } = useAgentRegistrationStore()
  const { isAuthenticated } = useAgentAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  const onboardingStepPages = [
    { title: 'Account Information', form: <SignupForm /> },
    { title: 'Bank Details for Commission', form: <BankDetailsForm /> },
    { title: 'Other Documents', form: <VerificationDocumentsForm /> },
  ]

  return (
    <div className="flex w-full flex-col justify-center gap-6">
      <div className="flex w-full flex-col items-center justify-center">
        <h1 className="from-primary to-lilac w-fit bg-gradient-to-r bg-clip-text py-2 text-3xl leading-tight font-black text-transparent md:text-4xl lg:text-5xl">
          Sign Up
        </h1>
        <p>Provide your details in the form to proceed</p>
      </div>
      <p className="from-primary to-lilac bg-gradient-to-r bg-clip-text text-xl font-bold tracking-wide text-transparent">
        {onboardingStepPages[step].title}
      </p>
      {onboardingStepPages[step].form}
    </div>
  )
}
