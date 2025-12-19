'use client'

import { useState, useRef, KeyboardEvent, ClipboardEvent, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useVerifyOTP, useResendOTP } from '@/app/data/mutations/otp'
import { useAgentAuthStore } from '@/store/agent-auth-store'

export default function OTPPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState<string | null>(null)
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const { mutateAsync: verifyOTP } = useVerifyOTP()
  const { mutateAsync: resendOTP, isPending: isResending } = useResendOTP()
  const { isAuthenticated } = useAgentAuthStore()

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (!emailParam) {
      toast.error('Email is required for OTP verification')
      router.push('/login')
      return
    }
    setEmail(emailParam)
  }, [searchParams, router])

  useEffect(() => {
    if (isAuthenticated && email) {
      // Focus first input when component loads
      inputRefs.current[0]?.focus()
    }
  }, [isAuthenticated, email])

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Move to next input if value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').trim()
    
    // Check if pasted data is 6 digits
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('')
      setOtp(newOtp)
      inputRefs.current[5]?.focus()
    }
  }

  const handleVerify = async () => {
    const otpCode = otp.join('')
    
    if (otpCode.length !== 6) {
      toast.error('Please enter all 6 digits')
      return
    }

    if (!email) {
      toast.error('Email is missing. Please try logging in again.')
      router.push('/login')
      return
    }

    setIsVerifying(true)
    
    try {
      const response = await verifyOTP({ email, otp: otpCode })
      
      // Get pending auth data from sessionStorage
      const pendingAuthStr = sessionStorage.getItem('pending_auth')
      if (pendingAuthStr) {
        const pendingAuth = JSON.parse(pendingAuthStr)
        // Complete the login by storing auth data
        const { login } = useAgentAuthStore.getState()
        login(pendingAuth)
        // Clear pending auth
        sessionStorage.removeItem('pending_auth')
      }
      
      toast.success('OTP verified successfully!')
      router.push('/')
    } catch (error: any) {
      console.error('OTP verification error:', error)
      
      if (error?.response?.status === 422) {
        const message = error.response?.data?.message
        if (message?.includes('expired')) {
          toast.error('OTP has expired. Please request a new one.')
        } else {
          toast.error('Invalid OTP. Please try again.')
        }
      } else {
        toast.error(error.response?.data?.message || 'Verification failed. Please try again.')
      }
      
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendOTP = async () => {
    if (!email) {
      toast.error('Email is missing. Please try logging in again.')
      router.push('/login')
      return
    }
    
    try {
      await resendOTP(email)
      
      toast.success('OTP has been resent to your email')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (error: any) {
      console.error('Resend OTP error:', error)
      
      if (error?.response?.status === 404) {
        toast.error('User not found. Please contact support.')
      } else {
        toast.error(error.response?.data?.message || 'Failed to resend OTP. Please try again.')
      }
    }
  }

  if (!email) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <button
        onClick={() => router.back()}
        className="flex hover:cursor-pointer items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors w-fit"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-bold text-green-700 dark:text-green-500">
          Verify OTP
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Please enter the 6-digit code sent to your email.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {/* OTP Input Fields */}
        <div className="flex gap-2 sm:gap-3 justify-center">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-semibold border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-green-600 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-900 outline-none transition-all bg-gray-50 dark:bg-gray-800"
              disabled={isVerifying}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleResendOTP}
            disabled={isResending || isVerifying}
            className="flex-1 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 font-semibold rounded-lg py-6"
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resending...
              </>
            ) : (
              'Resend OTP'
            )}
          </Button>
          <Button
            type="button"
            onClick={handleVerify}
            disabled={isVerifying || otp.join('').length !== 6}
            className="flex-1 bg-green-700 hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-700 text-white font-semibold rounded-lg py-6"
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
