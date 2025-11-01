'use client'

import { CTPL_PRODUCTS } from '@/constants/ctpl-insurance'
import ProductBanner from '@/components/product-banner'
import { Card, CardContent } from '@/components/ui/card'
import { CtplPlanCard } from '@/components/ctpl-insurance/plan-card'
import { useCtplInsuranceStateStore } from '@/store/ctpl-store'
import { CtplInsuranceProduct } from '@/types/ctpl-insurance'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { removeStorage } from '@/utils/remove-session-storage'
import { DialogFormWrapper } from '@/components/ui/dialog-form-wrapper'
import CTPLPeriodForm from '@/components/ctpl-insurance/insurance-period-form'

export default function CtplInsuranceHomePage() {
  const router = useRouter()
  const { setSelectedVehicle: setProduct, reset } = useCtplInsuranceStateStore()
  const [isPeriodFormDialogOpen, setIsPeriodFormDialogOpen] = useState(false)

  useEffect(() => {
    reset()
    removeStorage('ctpl-insurance-storage')
  }, [])

  const handleBuyNowClick = (product: CtplInsuranceProduct) => {
    setProduct(product)
    setIsPeriodFormDialogOpen(true)
  }

  return (
    <>
      <ProductBanner
        insuranceName="Compulsary Third Party Liability (CTPL) Insurance"
        tagLine="Lorem ipsum dolor sit amet consectetur, adipisicing elit. Dicta quod facilis sunt iste tenetur enim."
      />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
        <div className="space-y-1">
          <h3 className="text-base font-bold md:text-lg lg:text-xl">
            Choose Your CTPL Insurance Type
          </h3>
          <p className="max-w-3/5 text-sm text-gray-500 md:text-base dark:text-gray-400">
            Select from the available CTPL coverage options to ensure your
            vehicle is protected and compliant with legal requirements.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {CTPL_PRODUCTS.map((value, index) => (
            <CtplPlanCard
              key={index}
              ctplProduct={value}
              buyNowBtnClick={handleBuyNowClick}
            />
          ))}
        </div>

        <DialogFormWrapper
          title="Period Dialog"
          open={isPeriodFormDialogOpen}
          setOpen={setIsPeriodFormDialogOpen}
          showTrigger={false}
          contentContainerClassName="lg:max-w-xl"
        >
          <CTPLPeriodForm />
        </DialogFormWrapper>
      </div>
    </>
  )
}
