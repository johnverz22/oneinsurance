'use client'

import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'

export default function TravelInsuranceTermsPage() {
  return (
    <div>
      <Header isNavigationVisible={false} />
      <div className="flex flex-col items-center justify-center space-y-6 px-4 py-10 pt-30 sm:px-10 md:px-[10%] lg:px-[20%]">
        <h1 className="text-xl font-black md:text-3xl">Travel Insurance Terms and Conditions</h1>
        <div className="px-4 text-justify text-sm md:max-w-2xl md:text-base space-y-4">
          <p>
            By clicking the agreement checkbox, you acknowledge and agree to the following terms and conditions:
          </p>

          <h2 className="text-lg font-bold mt-6">Online Booking Terms and Conditions</h2>
          <p>
            You agree to provide accurate and complete information during the booking process. All bookings are subject to availability and confirmation. You are responsible for ensuring that all traveler information is correct before submission.
          </p>

          <h2 className="text-lg font-bold mt-6">Conditions of Carriage</h2>
          <p>
            Travel is subject to the conditions of carriage of the respective carriers. These conditions may limit or exclude liability for death, injury, delay, loss, or damage to baggage.
          </p>

          <h2 className="text-lg font-bold mt-6">Out-of-Sequence Policy</h2>
          <p>
            Tickets must be used in the sequence shown on the itinerary. Failure to use any portion of the ticket in sequence may result in the cancellation of remaining segments without refund.
          </p>

          <h2 className="text-lg font-bold mt-6">Fare Rules and Most Restrictive Fare Rule</h2>
          <p>
            All fares are subject to specific rules and restrictions including, but not limited to, advance purchase requirements, minimum and maximum stay requirements, and change/cancellation penalties. The most restrictive fare rule applies when multiple fare types are combined.
          </p>

          <h2 className="text-lg font-bold mt-6">Travel Insurance</h2>
          <p>
            Travel insurance coverage is provided as per the selected plan. Coverage includes medical expenses, trip cancellations, delays, and other benefits as specified in your policy document. Please review your policy carefully to understand coverage limits and exclusions.
          </p>

          <h2 className="text-lg font-bold mt-6">Cancellation and Refund Policy</h2>
          <p>
            Cancellations must be submitted in accordance with the terms of your insurance policy. Refunds, if applicable, will be processed according to the policy terms and may be subject to administrative fees. Refund requests must be submitted within the timeframe specified in your policy.
          </p>

          <h2 className="text-lg font-bold mt-6">Prohibition on Hazardous Materials</h2>
          <p>
            You agree not to carry or attempt to carry any hazardous materials, dangerous goods, or prohibited items as defined by international aviation regulations and local laws. Violation of this prohibition may result in legal action and denial of coverage.
          </p>

          <h2 className="text-lg font-bold mt-6">Data Privacy Policy</h2>
          <p>
            We are committed to protecting your personal information in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173). By agreeing to these terms, you confirm that you have read and understood our Data Privacy Policy and give your consent to the collection, use, monitoring, recording, and disclosure or transfer of your Personal Information for the following purposes:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>Processing your insurance application and policy</li>
            <li>Providing customer service and support</li>
            <li>Complying with legal and regulatory requirements</li>
            <li>Improving our services and products</li>
            <li>Communicating with you about your policy and related services</li>
          </ul>

          <h2 className="text-lg font-bold mt-6">Third-Party Booking Authorization</h2>
          <p>
            If you are booking for third parties and/or co-passengers, you attest that you have the authority to disclose and share their Personal Information to us and our service providers in accordance with our Data Privacy Policy. You confirm that you have obtained the necessary consent from all travelers to share their information for the purposes of processing their travel insurance.
          </p>

          <h2 className="text-lg font-bold mt-6">Payment Terms</h2>
          <p>
            By utilizing the IFRC Digitech Online Payment Gateway, you agree to adhere to the payment terms and conditions. This service facilitates the remittance of insurance premiums through secure electronic payment methodologies. All payments are processed in accordance with our payment gateway terms and conditions.
          </p>

          <h2 className="text-lg font-bold mt-6">Contact Information</h2>
          <p>
            For any inquiries or concerns regarding these terms and conditions, please contact us:
          </p>
          <ul className="list-none ml-4 space-y-2">
            <li><strong>Email:</strong> concierge@ifrcinsurance.com</li>
            <li><strong>Phone:</strong> +632 8633 5681</li>
            <li><strong>Address:</strong> 6th Floor Padilla Building, F. Ortigas Jr. Road, Ortigas Center, Pasig City</li>
          </ul>

          <p className="mt-6 text-sm text-gray-600">
            These Terms and Conditions shall be construed and governed in accordance with the laws of the Republic of the Philippines. We reserve the right to amend these terms at any time, and all revisions shall be communicated through our official channels.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  )
}
