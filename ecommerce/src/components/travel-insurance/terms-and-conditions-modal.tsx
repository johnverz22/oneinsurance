'use client'

import { ScrollableModal } from '@/components/ui/scrollable-modal'

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: 'Online Booking Terms and Conditions',
    body: 'You agree to provide accurate and complete information during the booking process. All bookings are subject to availability and confirmation. You are responsible for ensuring that all traveler information is correct before submission.',
  },
  {
    title: 'Conditions of Carriage',
    body: 'Travel is subject to the conditions of carriage of the respective carriers. These conditions may limit or exclude liability for death, injury, delay, loss, or damage to baggage.',
  },
  {
    title: 'Out-of-Sequence Policy',
    body: 'Tickets must be used in the sequence shown on the itinerary. Failure to use any portion of the ticket in sequence may result in the cancellation of remaining segments without refund.',
  },
  {
    title: 'Fare Rules and Most Restrictive Fare Rule',
    body: 'All fares are subject to specific rules and restrictions including, but not limited to, advance purchase requirements, minimum and maximum stay requirements, and change/cancellation penalties. The most restrictive fare rule applies when multiple fare types are combined.',
  },
  {
    title: 'Travel Insurance',
    body: 'Travel insurance coverage is provided as per the selected plan. Coverage includes medical expenses, trip cancellations, delays, and other benefits as specified in your policy document. Please review your policy carefully to understand coverage limits and exclusions.',
  },
  {
    title: 'Cancellation and Refund Policy',
    body: 'Cancellations must be submitted in accordance with the terms of your insurance policy. Refunds, if applicable, will be processed according to the policy terms and may be subject to administrative fees. Refund requests must be submitted within the timeframe specified in your policy.',
  },
  {
    title: 'Prohibition on Hazardous Materials',
    body: 'You agree not to carry or attempt to carry any hazardous materials, dangerous goods, or prohibited items as defined by international aviation regulations and local laws. Violation of this prohibition may result in legal action and denial of coverage.',
  },
  {
    title: 'Data Privacy Policy',
    body: (
      <>
        <p>
          We are committed to protecting your personal information in accordance with the Data
          Privacy Act of 2012 (Republic Act No. 10173). By agreeing to these terms, you confirm
          that you have read and understood our Data Privacy Policy and give your consent to the
          collection, use, monitoring, recording, and disclosure or transfer of your Personal
          Information for the following purposes:
        </p>
        <ul className="ml-4 mt-2 list-inside list-disc space-y-2">
          <li>Processing your insurance application and policy</li>
          <li>Providing customer service and support</li>
          <li>Complying with legal and regulatory requirements</li>
          <li>Improving our services and products</li>
          <li>Communicating with you about your policy and related services</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Third-Party Booking Authorization',
    body: 'If you are booking for third parties and/or co-passengers, you attest that you have the authority to disclose and share their Personal Information to us and our service providers in accordance with our Data Privacy Policy. You confirm that you have obtained the necessary consent from all travelers to share their information for the purposes of processing their travel insurance.',
  },
  {
    title: 'Payment Terms',
    body: 'By utilizing the IFRC Digitech Online Payment Gateway, you agree to adhere to the payment terms and conditions. This service facilitates the remittance of insurance premiums through secure electronic payment methodologies. All payments are processed in accordance with our payment gateway terms and conditions.',
  },
  {
    title: 'Contact Information',
    body: (
      <>
        <p>For any inquiries or concerns regarding these terms and conditions, please contact us:</p>
        <ul className="ml-4 mt-2 list-none space-y-2">
          <li>
            <strong>Email:</strong> concierge@ifrcinsurance.com
          </li>
          <li>
            <strong>Phone:</strong> +632 8633 5681
          </li>
          <li>
            <strong>Address:</strong> 6th Floor Padilla Building, F. Ortigas Jr. Road, Ortigas
            Center, Pasig City
          </li>
        </ul>
      </>
    ),
  },
]

interface TermsAndConditionsModalProps {
  open: boolean
  onClose: () => void
}

export function TermsAndConditionsModal({ open, onClose }: TermsAndConditionsModalProps) {
  return (
    <ScrollableModal
      open={open}
      onClose={onClose}
      eyebrow="One Insurance · Travel"
      title="Travel Insurance Terms &amp; Conditions"
      titleId="tc-modal-title"
      descriptionId="tc-modal-desc"
      closeLabel="Close Terms and Conditions"
    >
      <p className="text-sm leading-6 text-[#333333] dark:text-[#c4c7c5]">
        By clicking the agreement checkbox, you acknowledge and agree to the following terms
        and conditions:
      </p>

      <div className="mt-6 space-y-8 text-justify text-sm leading-7 text-[#333333] dark:text-[#c4c7c5] sm:text-base">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h3 className="text-base font-semibold text-[#183d2c] dark:text-[#f4f5f2] sm:text-lg">
              {s.title}
            </h3>
            <div className="mt-2 space-y-3">{s.body}</div>
          </section>
        ))}

        <p className="border-t border-[#dfe7df] pt-6 text-sm text-[#808080] dark:border-[#3d4140] dark:text-[#b2b7b4]">
          These Terms and Conditions shall be construed and governed in accordance with the
          laws of the Republic of the Philippines. We reserve the right to amend these terms
          at any time, and all revisions shall be communicated through our official channels.
        </p>
      </div>

      {/* Close CTA at bottom */}
      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#006838] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#00552e] active:bg-[#004525] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838]"
        >
          Close
        </button>
      </div>
    </ScrollableModal>
  )
}
