import { FAQs } from '@/types/faq'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion'

interface FAQsSectionProps {
  faqs: FAQs[]
  insuranceType: string
}

export function FAQsSection({ faqs, insuranceType }: FAQsSectionProps) {
  return (
    <section className="mx-auto grid h-full max-w-7xl items-center gap-4 px-4 py-16">
      <div className="grid md:grid-cols-3 md:gap-6">
        <div className="space-y-2 pb-4">
          <div className="text-muted-foreground flex items-center gap-3">
            <h5>FAQs</h5>
          </div>
          <h2 className="text-lilac max-w-4/5 text-4xl font-bold lg:max-w-full">
            Frequently Asked Questions
          </h2>
          <p className="font-normal">
            Find quick answers to common questions about our {insuranceType}.
          </p>
        </div>

        <Accordion
          type="single"
          collapsible
          className="grid w-full gap-4 py-4 md:col-span-2"
          defaultValue="item-1"
        >
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index + 1}`}
              className="bg-muted-foreground/10 w-full gap-3 rounded-lg border px-4 py-4"
              defaultChecked={index === 0}
            >
              <AccordionTrigger className="font-bold">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4 text-balance">
                {faq.answers.map((answer, index) => (
                  <p key={index} className="font-light">
                    {answer}
                  </p>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
