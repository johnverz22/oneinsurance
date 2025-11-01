'use client'

import { format } from 'date-fns'
import { useTravelInsuranceStore } from '@/store/travel-insurance-store'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'

export function TravelDetailsSummary() {
  const { travelDetails } = useTravelInsuranceStore()

  return (
    <Card className="bg-background overflow-hidden p-0 shadow-none">
      <CardHeader className="flex items-center justify-between -space-y-2 pt-6">
        <h2 className="text-primary text-2xl font-bold">Your Travel Details</h2>
        <CheckCircle className="text-primary dark:text-accent" />
      </CardHeader>
      <CardContent className="grid gap-8 px-6 pb-6 lg:grid-cols-3">
        <div className="space-y-4">
          <div className="space-y-2 py-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              From
            </p>
            <p className="text-primary dark:text-accent text-base font-bold whitespace-nowrap">
              {travelDetails.travelDetailList[0].PlaceOfOrgin}
            </p>
          </div>
          <div className="space-y-2 py-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              To
            </p>
            {travelDetails.travelDetailList.map((detail) => (
              <div
                key={detail.TravelCountry}
                className="flex items-center gap-2"
              >
                <div className="bg-primary/30 dark:bg-accent/30 flex size-6 items-center justify-center rounded-full text-center text-sm">
                  {detail.DisplaySequence}
                </div>
                <p className="text-primary dark:text-accent text-base font-bold whitespace-nowrap">
                  {detail.TravelCountry}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2 py-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Departure Date
            </p>
            <p className="text-primary dark:text-accent text-base font-bold whitespace-nowrap">
              {format(travelDetails.departureDate, 'PP')}
            </p>
          </div>
          <div className="space-y-2 py-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Return Date
            </p>
            <p className="text-primary dark:text-accent text-base font-bold whitespace-nowrap">
              {format(travelDetails.returnDate!, 'PP')}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2 py-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              No. Of Travellers
            </p>
            <p className="text-primary dark:text-accent text-base font-bold whitespace-nowrap">
              {travelDetails.noOfAdults} Adults, {travelDetails.noOfChildren}{' '}
              Children
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
