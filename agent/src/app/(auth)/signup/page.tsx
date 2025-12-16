'use client'

import { useRouter } from 'next/navigation'
import { useAgentAuthStore } from '@/store/agent-auth-store'
import { useEffect } from 'react'
// import BankDetailsForm from './bank-details-form'
// import VerificationDocumentsForm from './verification-documents-form'
import SignupForm from './signup-form'
// import { useAgentRegistrationStore } from '@/store/agent-registration-store'

export default function SignUpPage() {
  const router = useRouter()
  const { isAuthenticated } = useAgentAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  // Comment out multi-step forms for now - simplified to single step
  // const onboardingStepPages = [
  //   { title: 'Account Information', form: <SignupForm /> },
  //   { title: 'Bank Details for Commission', form: <BankDetailsForm /> },
  //   { title: 'Other Documents', form: <VerificationDocumentsForm /> },
  // ]

  return (
    <div className="flex w-full flex-col justify-center gap-6">
      <div className="flex w-full flex-col items-center justify-center">
        <h1 className="from-primary to-lilac w-fit bg-gradient-to-r bg-clip-text py-2 text-3xl leading-tight font-black text-transparent md:text-4xl lg:text-5xl">
          Sign Up
        </h1>
        <p>Complete your account registration</p>
      </div>
      <SignupForm />
    </div>
  )
}
