'use client'

import { Header } from '@/components/layout/header'
import SignatureForm from '@/components/onboarding/advisor-signature-form'
import CommissionPaymentReferenceForm from '@/components/onboarding/commission-payment-reference-form'
import CompanyDetailsForm from '@/components/onboarding/company-details-form'
import { AgentOnboardingSuccess } from '@/components/onboarding/completed'
import ContactPersonDetailsForm from '@/components/onboarding/contact-person-details-form'
import BusinessInterestForm from '@/components/onboarding/line-of-busines-interest-form'
import ValidIdForm from '@/components/onboarding/upload-valid-id-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  useOnboardingStateStore,
  useOnboardingStepStateStore,
} from '@/store/onboarding-store'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Link from 'next/link'

export default function OnboardingPage() {
  const { step } = useOnboardingStepStateStore()
  const { firstName, lastName, email, designation, companyName, dateOfBirth } =
    useOnboardingStateStore()

  const agent = {
    firstName: firstName,
    lastName: lastName,
    designation: designation,
    companyName: companyName,
    dateOfBirth: dateOfBirth,
    email: email,
  }

  const stepForm = [
    {
      title: 'Company Detials',
      form: <CompanyDetailsForm />,
    },
    {
      title: 'Authorized Contact Person Details',
      form: <ContactPersonDetailsForm />,
    },
    {
      title: 'Line of Busines Interest',
      form: <BusinessInterestForm />,
    },
    {
      title: 'Commission Payment Reference',
      form: <CommissionPaymentReferenceForm />,
    },
    {
      title: 'Upload Two Valid Government ID',
      form: <ValidIdForm />,
    },
    {
      title: 'Signature',
      form: <SignatureForm />,
    },
    {
      title: 'Congratulations!',
      form: <></>,
    },
  ]

  const queryClient = new QueryClient()

  return (
    <div className="relative h-full min-h-screen w-full">
      <Header isNavigationVisible={false} className="absolute w-full" />

      <div className="mt-26 w-full px-4 sm:px-10 md:px-[10%] lg:px-[20%]">
        {step === 5 ? (
          <AgentOnboardingSuccess agent={agent} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{stepForm[step].title}</CardTitle>
            </CardHeader>
            <CardContent>{stepForm[step].form}</CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
