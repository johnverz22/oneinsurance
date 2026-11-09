import type { Metadata } from 'next'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Portal sign in · One Insurance',
}

export default function LoginPage() {
  return <LoginForm />
}
