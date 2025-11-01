'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Clock, CheckCircle, ArrowLeft, Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAgentRegistrationStore } from '@/store/agent-registration-store'

export default function VerifyEmailPage() {
  const router = useRouter()

  const { credentials, registrationResult, clearRegistrationResult } =
    useAgentRegistrationStore()

  // Check if user has registration data, redirect if not
  useEffect(() => {
    if (!credentials.email || !registrationResult) {
      router.push('/signup')
    }
  }, [credentials.email, registrationResult, router])

  const handleBackToSignup = () => {
    clearRegistrationResult()
    router.push('/signup')
  }

  if (!credentials.email || !registrationResult) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4">
      <div className="flex w-fit max-w-lg flex-col items-center gap-8 rounded-2xl bg-white p-10 shadow-lg">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-blue-50 p-4">
            <Clock className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold md:text-3xl">
            Account Under Review
          </h1>
          <p className="text-gray-600 md:text-lg">
            Your registration has been submitted successfully!
          </p>
        </div>

        {/* Success Message */}
        <div className="w-full space-y-4 text-center">
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium">
              Registration completed successfully!
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="w-full space-y-4 text-center">
          <div className="rounded-lg border bg-gray-50 p-6">
            <Mail className="mx-auto mb-4 h-8 w-8 text-blue-600" />
            <h3 className="mb-3 text-lg font-semibold">What happens next?</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                Please wait for an admin to review and verify your account. You
                will receive an email notification at:
              </p>
              <p className="rounded border bg-white p-2 font-semibold text-gray-900">
                {credentials.email}
              </p>
              <p>
                Once your account is approved, you'll be able to access the
                agent platform and start managing your clients.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex w-full flex-col gap-3">
          <Button
            onClick={handleBackToSignup}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Submit Another Application
          </Button>

          <Link href="/" className="w-full">
            <Button variant="ghost" className="w-full">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
