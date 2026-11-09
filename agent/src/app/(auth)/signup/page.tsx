import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Loader2 } from 'lucide-react'
import SignupForm from './signup-form'

export const metadata: Metadata = {
  title: 'One Insurance | Agent Sign Up',
  description: 'Complete your agent account registration.',
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center gap-2 text-sm text-[#5b6e61] dark:text-[#c4c7c5]">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span>Loading…</span>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  )
}
