'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle,
  XCircle,
  ArrowLeft,
  Mail,
  AlertTriangle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

function EmailVerificationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [verificationStatus, setVerificationStatus] = useState<
    'loading' | 'success' | 'error'
  >('loading')

  const code = searchParams.get('code')
  const message = searchParams.get('message')

  useEffect(() => {
    // Determine verification status based on HTTP status code
    if (code) {
      const statusCode = parseInt(code, 10)

      // 2xx status codes indicate success
      if (statusCode >= 200 && statusCode < 300) {
        setVerificationStatus('success')
      }
      // 4xx and 5xx status codes indicate errors
      else if (statusCode >= 400) {
        setVerificationStatus('error')
      }
      // Any other codes default to error
      else {
        setVerificationStatus('error')
      }
    } else {
      // No code provided, default to error
      setVerificationStatus('error')
    }
  }, [code, message])

  const handleBackToLogin = () => {
    router.push('/login')
  }

  const handleBackToSignup = () => {
    router.push('/signup')
  }

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-600" />
      case 'error':
        return <XCircle className="h-12 w-12 text-red-600" />
      default:
        return <AlertTriangle className="h-12 w-12 text-yellow-600" />
    }
  }

  const getStatusBgColor = () => {
    switch (verificationStatus) {
      case 'success':
        return 'bg-green-50'
      case 'error':
        return 'bg-red-50'
      default:
        return 'bg-yellow-50'
    }
  }

  const getStatusTitle = () => {
    switch (verificationStatus) {
      case 'success':
        return 'Email Verified Successfully!'
      case 'error':
        return 'Email Verification Failed'
      default:
        return 'Verifying Email...'
    }
  }

  const getStatusMessage = () => {
    if (message) {
      return message
    }

    switch (verificationStatus) {
      case 'success':
        return 'Your email has been verified successfully. You can now proceed to login.'
      case 'error':
        return 'The verification link is invalid or has expired. Please try registering again.'
      default:
        return 'Please wait while we verify your email address.'
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4">
      <div className="flex w-fit max-w-lg flex-col items-center gap-8 rounded-2xl bg-white p-10 shadow-lg">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className={`rounded-full p-4 ${getStatusBgColor()}`}>
            {getStatusIcon()}
          </div>
          <h1 className="text-2xl font-bold md:text-3xl">{getStatusTitle()}</h1>
          <p className="text-gray-600 md:text-lg">{getStatusMessage()}</p>
        </div>

        {/* Status Message */}
        <div className="w-full space-y-4 text-center">
          <div
            className={`flex items-center gap-2 rounded-lg border p-4 ${
              verificationStatus === 'success'
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {verificationStatus === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <span className="text-sm font-medium">
              {verificationStatus === 'success'
                ? 'Verification completed successfully!'
                : 'Verification failed. Please try again.'}
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="w-full space-y-4 text-center">
          <div className="rounded-lg border bg-gray-50 p-6">
            <Mail className="mx-auto mb-4 h-8 w-8 text-blue-600" />
            <h3 className="mb-3 text-lg font-semibold">What happens next?</h3>
            <div className="space-y-3 text-sm text-gray-600">
              {verificationStatus === 'success' ? (
                <>
                  <p>
                    Your email address has been successfully verified. You can
                    now:
                  </p>
                  <ul className="space-y-1">
                    <li>• Access the agent login page</li>
                    <li>• Start managing your clients</li>
                    <li>• Use all platform features</li>
                  </ul>
                </>
              ) : (
                <>
                  <p>
                    Email verification was unsuccessful. This could be because:
                  </p>
                  <ul className="space-y-1 text-left">
                    <li>• The verification link has expired</li>
                    <li>• The link has already been used</li>
                    <li>• There was a technical issue</li>
                  </ul>
                  <p>
                    Please try registering again or contact support if the
                    problem persists.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex w-full flex-col gap-3">
          {verificationStatus === 'success' ? (
            <>
              <Button onClick={handleBackToLogin} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Proceed to Login
              </Button>
              <Link href="/" className="w-full">
                <Button variant="ghost" className="w-full">
                  Return to Home
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Button onClick={handleBackToSignup} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Try Registration Again
              </Button>
              <Link href="/" className="w-full">
                <Button variant="ghost" className="w-full">
                  Return to Home
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function EmailVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center px-4">
          <div className="flex w-fit max-w-lg flex-col items-center gap-8 rounded-2xl bg-white p-10 shadow-lg">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-blue-50 p-4">
                <AlertTriangle className="h-12 w-12 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold md:text-3xl">
                Loading verification...
              </h1>
              <p className="text-gray-600 md:text-lg">
                Please wait while we verify your email address.
              </p>
            </div>
          </div>
        </div>
      }
    >
      <EmailVerificationContent />
    </Suspense>
  )
}
