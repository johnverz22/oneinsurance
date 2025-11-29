import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getInsuranceById } from '@/components/checkout/helpers'
import { EditProductForm } from './edit-form'
import { DeleteProductForm } from './delete-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Users, FileText, HelpCircle } from 'lucide-react'

export default async function Page({
  params,
}: {
  params: Promise<{ productId: string }>
}) {
  const { productId } = await params
  const insurance = getInsuranceById(productId)

  if (!insurance) redirect('/product-management')

  return (
    <div className="relative grid h-full w-full gap-4 lg:grid-cols-3">
      <div className="sticky h-max space-y-4 self-start lg:top-28">
        <div className="rounded-xl border px-4">
          <Image
            src={insurance.image || '/placeholder.svg'}
            alt={insurance.title}
            className="mx-auto h-64 w-11/12 object-contain object-center"
            width={480}
            height={480}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <DeleteProductForm productId={insurance.id} />
          <EditProductForm product={insurance} />
        </div>
      </div>

      <div className="bg-muted-foreground/10 min-h-[80vh] rounded-xl px-6 py-8 lg:col-span-2">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900 lg:text-2xl dark:text-gray-100">
                {insurance.title}
              </h2>
              {insurance.tag && (
                <Badge className="text-white">{insurance.tag}</Badge>
              )}
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {insurance.description}
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <FileText className="h-5 w-5" />
              Overview
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {insurance.more.overview}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Explanation</h3>
            <p className="text-muted-foreground leading-relaxed">
              {insurance.more.explanation}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Users className="h-5 w-5" />
              Eligible Age
            </h3>
            <p className="text-muted-foreground">
              {insurance.more.eligibleAge}
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Available Plans</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {insurance.plans.map((plan, index) => (
                <Card key={index} className="relative">
                  <CardHeader>
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    <div className="text-2xl font-bold text-green-600">
                      PHP {plan.price.toLocaleString()}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      MBL: {plan.mbl}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="mb-2 font-medium">Coverage</h4>
                      <ul className="space-y-1">
                        {plan.coverage.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm"
                          >
                            <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="mb-2 font-medium">Benefits</h4>
                      <ul className="space-y-1">
                        {plan.benefits.map((benefit, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm"
                          >
                            <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {insurance.more.notes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Important Notes</h3>
              <ul className="space-y-2">
                {insurance.more.notes.map((note, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="bg-muted-foreground mt-2 h-2 w-2 flex-shrink-0 rounded-full" />
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {note}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insurance.more.faqs.length > 0 && (
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <HelpCircle className="h-5 w-5" />
                Frequently Asked Questions
              </h3>
              <Accordion type="single" collapsible className="w-full">
                {insurance.more.faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
