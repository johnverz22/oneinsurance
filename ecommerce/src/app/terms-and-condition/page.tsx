'use client'

import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export default function TermsAndConditionPage() {
  return (
    <div>
      <Header isNavigationVisible={false} />
      <div className="flex flex-col items-center justify-center space-y-6 px-4 py-10 pt-30 sm:px-10 md:px-[10%] lg:px-[20%]">
        <h1 className="text-xl font-black md:text-3xl">Terms and Condition</h1>
        <p className="px-4 text-justify text-sm md:max-w-2xl md:text-base">
          By utilizing the IFRC Digitech Online Payment Gateway, you hereby
          agree to adhere to the subsequent Terms and Conditions. This service
          facilitates the remittance of insurance premiums and associated
          services through secure electronic payment methodologies, encompassing
          credit/debit cards, bank transfers, and e-wallets. You affirm that you
          are the legitimate proprietor of the payment instrument employed and
          that you have attained the age of eighteen (18) years. Payments are
          processed contemporaneously; however, occasional delays may transpire
          attributable to third-party providers or technical impediments beyond
          our purview. All applicable fees and charges shall be delineated prior
          to the finalization of your transaction. Payments are generally
          non-refundable, except in instances of verified system error or
          overpayment, in which case, refund requests must be submitted within
          five (5) business days. Policy cancellations remain subject to the
          stipulations of the original insurance contract.
          <br />
          <br />
          We are dedicated to safeguarding your data in strict accordance with
          the Data Privacy Act of 2012 (Republic Act No. 10173) and our internal
          Privacy Policy, employing secure SSL encryption and verified payment
          channels. It is incumbent upon you to preserve the confidentiality of
          your payment information and to promptly report any unauthorized
          usage. The deployment of this platform for fraudulent activities,
          money laundering, or any unauthorized purpose is unequivocally
          prohibited. We shall not be held accountable for indirect or
          consequential damages arising from your utilization of this service,
          and our maximum liability shall not exceed the amount pertinent to the
          disputed transaction. We reserve the unequivocal right to unilaterally
          amend these Terms at any juncture, and all revisions shall be
          disseminated via our official channels. Continued engagement with the
          payment gateway signifies your assent to any such revisions.
          <br />
          <br />
          These Terms and Conditions shall be construed and governed in
          accordance with the laws of the Republic of the Philippines. For any
          inquiries or concerns, kindly reach out to us via email at{' '}
          <strong>concierge@ifrcinsurance.com</strong> , by telephone at{' '}
          <strong>+632 8633 5681</strong>, or visit our corporate premises at{' '}
          <strong>
            6th Floor Padilla Building, F. Ortigas Jr. Road, Ortigas Center,
            Pasig City.
          </strong>
        </p>
      </div>
      <Footer />
    </div>
  )
}
