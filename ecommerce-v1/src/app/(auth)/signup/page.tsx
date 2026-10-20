'use client'

import { useEffect, useState } from 'react'
import AccountCredentialForm from '@/components/signup/account-credential-form'
import PersonalInformationForm from '@/components/signup/personal-information-form'
import ContactDetailsForm from '@/components/signup/contact-details-form'
import EmploymentForm from '@/components/signup/employment-form'
import { useSignUpStepStateStore } from '@/store/signup-store'
import TermsPoliciesForm from '@/components/signup/terms-policies-from'
import Link from 'next/link'

// Prevent static generation for this page
export const dynamic = 'force-dynamic'

export default function SignUpPage() {
  const [isClient, setIsClient] = useState(false)
  const step = useSignUpStepStateStore((state) => state.step)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const stepPage = [
    <AccountCredentialForm key={0} />,
    <PersonalInformationForm key={1} />,
    <ContactDetailsForm key={2} />,
    <EmploymentForm key={3} />,
    <TermsPoliciesForm key={4} />,
    <p key={5}>Next Page</p>,
  ]

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center px-4 sm:px-[10%] md:px-[20%]">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center px-4 sm:px-[10%] md:px-[20%]">
      {stepPage[step]}

      <div className="relative flex items-center justify-center py-8">
        <p className="text-muted-foreground text-sm">
          Already have an account?{' '}
          <Link href="/sign-in" className="underline underline-offset-8">
            Sign in now!
          </Link>
        </p>
      </div>
    </div>
  )
}
