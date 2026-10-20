import { Card, CardContent } from './ui/card'

export function PlanHighlightsSection() {
  return (
    <section className="mx-auto grid h-full max-w-7xl items-center gap-4 px-4 py-16">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <h2 className="text-lilac text-4xl font-bold">
            Plan Highlights & Features
          </h2>
          <p className="font-normal">
            Trusted by more than 1 million Filipinos, We offer a wide selection
            of general insurance products you can choose from.
          </p>
        </div>
      </div>

      <div className="grid gap-8 py-4 md:grid-cols-4">
        <Card>
          <CardContent>
            <h3 className="text-lg font-bold">Emergency Medical Assistance</h3>
            <p className="text-muted-foreground text-sm">
              Up to $1M coverage for medical bills abroad.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h3 className="text-lg font-bold">Trip Cancellation Protection</h3>
            <p className="text-muted-foreground text-sm">
              Reimbursement for canceled trips due to emergencies.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h3 className="text-lg font-bold">Lost Baggage Reimbursement</h3>
            <p className="text-muted-foreground text-sm">
              Get paid for lost, stolen, or delayed bags.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h3 className="text-lg font-bold">24/7 Global Support</h3>
            <p className="text-muted-foreground text-sm">
              Our team is here for you—anytime, anywhere.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
