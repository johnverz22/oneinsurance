'use client'

import Link from 'next/link'
import { MoveRight } from 'lucide-react'
import { Button, ButtonProps } from '@/components/ui/button'
import { useCheckoutStore } from '@/store/checkout-store'
import { Insurance } from '@/types/insurance'
import { COMPANIES } from '@/constants/companies'

export const CheckoutRedirect = ({
  insurance,
  ...props
}: { insurance: Insurance } & ButtonProps) => {
  const { updateFormData, resetForm } = useCheckoutStore()

  const company = COMPANIES.find(
    (company) => company.id === insurance.companyId
  )

  const handleNavigate = () => {
    resetForm()
    updateFormData({
      name: insurance.title,
      insuranceId: insurance.id,
      type: insurance.categoryId as 'hmo' | 'travel' | 'general' | 'medical',
      merchant: company?.companyName,
    })
  }

  return (
    <Button
      size="lg"
      variant="outline"
      className="flex min-w-48 items-center justify-between rounded-md bg-transparent px-4 py-3 text-lg font-semibold text-white backdrop-blur-lg hover:bg-white/90 lg:h-12"
      {...props}
      onClick={handleNavigate}
      asChild
    >
      <Link href="/checkout">
        Checkout now
        <MoveRight />
      </Link>
    </Button>
  )
}
