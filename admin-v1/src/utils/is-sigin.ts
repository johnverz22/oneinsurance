import { useSignInStateStore } from '@/store/signin-store'

export function isSingedin(): boolean {
  const email = useSignInStateStore((state) => state.email)

  return email.length !== 0
}
