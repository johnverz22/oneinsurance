'use client'

import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'

export default function DataSharingConsentPage() {
  return (
    <div>
      <Header isNavigationVisible={false} />
      <div className="flex flex-col items-center justify-center space-y-6 px-4 py-10 pt-30 sm:px-10 md:px-[10%] lg:px-[20%]">
        <h1 className="text-xl font-black md:text-3xl">Data Sharing Consent Agreement</h1>
        <div className="px-4 text-justify text-sm md:max-w-2xl md:text-base space-y-4">
          <p className="text-foreground">
            This Data Sharing Consent Agreement ("Agreement") outlines how your personal information will be collected, used, shared, and protected in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173) and its implementing rules and regulations.
          </p>

          <h2 className="text-lg font-bold mt-6">1. Purpose of Data Collection</h2>
          <p>
            We collect and process your personal information for the following purposes:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>Processing your travel insurance application and policy issuance</li>
            <li>Verifying your identity and eligibility for insurance coverage</li>
            <li>Assessing and managing insurance risks</li>
            <li>Processing claims and providing customer support</li>
            <li>Complying with legal, regulatory, and contractual obligations</li>
            <li>Preventing fraud and ensuring security of transactions</li>
            <li>Improving our products, services, and customer experience</li>
            <li>Sending policy updates, renewal notices, and relevant communications</li>
          </ul>

          <h2 className="text-lg font-bold mt-6">2. Types of Personal Information Collected</h2>
          <p>
            We may collect and process the following categories of personal information:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li><strong>Personal Identification:</strong> Full name, date of birth, gender, nationality, government-issued ID numbers</li>
            <li><strong>Contact Information:</strong> Email address, mobile number, residential address</li>
            <li><strong>Travel Information:</strong> Travel dates, destinations, itinerary details, passport information</li>
            <li><strong>Financial Information:</strong> Payment details, billing information (processed securely through our payment gateway)</li>
            <li><strong>Health Information:</strong> Medical conditions, pre-existing conditions (if applicable for coverage assessment)</li>
            <li><strong>Beneficiary Information:</strong> Details of designated beneficiaries (if provided)</li>
          </ul>

          <h2 className="text-lg font-bold mt-6">3. Data Sharing and Disclosure</h2>
          <p>
            Your personal information may be shared with the following parties for legitimate business purposes:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li><strong>Insurance Carriers:</strong> To underwrite policies and process claims</li>
            <li><strong>Service Providers:</strong> Third-party vendors who assist in policy administration, payment processing, and customer support</li>
            <li><strong>Regulatory Authorities:</strong> Government agencies and regulatory bodies as required by law</li>
            <li><strong>Medical Providers:</strong> Healthcare facilities and professionals for claims verification and medical assistance services</li>
            <li><strong>Reinsurers:</strong> Companies that provide reinsurance coverage for our policies</li>
            <li><strong>Legal Advisors:</strong> Lawyers and consultants for legal compliance and dispute resolution</li>
            <li><strong>Business Partners:</strong> Authorized agents and distributors who facilitate insurance services</li>
          </ul>

          <h2 className="text-lg font-bold mt-6">4. International Data Transfers</h2>
          <p>
            In certain circumstances, your personal information may be transferred to and processed in countries outside the Philippines, including but not limited to:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>Insurance carriers and reinsurers with international operations</li>
            <li>Global service providers for data storage and processing</li>
            <li>Medical assistance networks operating in your travel destinations</li>
          </ul>
          <p className="mt-2">
            We ensure that such transfers comply with applicable data protection laws and that adequate safeguards are in place to protect your information.
          </p>

          <h2 className="text-lg font-bold mt-6">5. Data Security Measures</h2>
          <p>
            We implement appropriate technical and organizational security measures to protect your personal information, including:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>Encryption of sensitive data during transmission and storage</li>
            <li>Access controls and authentication mechanisms</li>
            <li>Regular security assessments and audits</li>
            <li>Employee training on data protection and confidentiality</li>
            <li>Secure disposal of personal information when no longer needed</li>
          </ul>

          <h2 className="text-lg font-bold mt-6">6. Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to fulfill the purposes outlined in this Agreement, including:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>Duration of your insurance policy and any active claims</li>
            <li>Period required by law, regulation, or contractual obligation (typically 5-10 years after policy expiration)</li>
            <li>Time needed to resolve disputes or enforce our rights</li>
          </ul>
          <p className="mt-2">
            After the retention period, your personal information will be securely deleted or anonymized.
          </p>

          <h2 className="text-lg font-bold mt-6">7. Your Rights as a Data Subject</h2>
          <p>
            Under the Data Privacy Act of 2012, you have the following rights:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li><strong>Right to be Informed:</strong> You have the right to know how your personal information is being processed</li>
            <li><strong>Right to Access:</strong> You may request access to your personal information in our possession</li>
            <li><strong>Right to Rectification:</strong> You may request correction of inaccurate or incomplete information</li>
            <li><strong>Right to Erasure:</strong> You may request deletion of your personal information under certain circumstances</li>
            <li><strong>Right to Object:</strong> You may object to the processing of your personal information for direct marketing purposes</li>
            <li><strong>Right to Data Portability:</strong> You may request a copy of your personal information in a structured, commonly used format</li>
            <li><strong>Right to Lodge a Complaint:</strong> You may file a complaint with the National Privacy Commission if you believe your rights have been violated</li>
          </ul>

          <h2 className="text-lg font-bold mt-6">8. Third-Party Authorization</h2>
          <p>
            If you are providing personal information on behalf of other travelers (co-passengers, family members, or beneficiaries), you hereby confirm and warrant that:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>You have obtained their explicit consent to share their personal information</li>
            <li>You have informed them about this Data Sharing Consent Agreement</li>
            <li>You have the legal authority to act on their behalf</li>
            <li>They understand how their information will be used and shared</li>
          </ul>

          <h2 className="text-lg font-bold mt-6">9. Cookies and Tracking Technologies</h2>
          <p>
            Our website uses cookies and similar tracking technologies to enhance your browsing experience, analyze website traffic, and personalize content. You can manage your cookie preferences through your browser settings. For more information, please refer to our Cookie Policy.
          </p>

          <h2 className="text-lg font-bold mt-6">10. Marketing Communications</h2>
          <p>
            With your consent, we may send you marketing communications about our products, services, promotions, and special offers. You can opt out of receiving marketing communications at any time by:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>Clicking the "unsubscribe" link in our emails</li>
            <li>Contacting our customer service team</li>
            <li>Updating your communication preferences in your account settings</li>
          </ul>

          <h2 className="text-lg font-bold mt-6">11. Changes to This Agreement</h2>
          <p>
            We reserve the right to update or modify this Data Sharing Consent Agreement at any time. Any changes will be posted on our website with an updated effective date. We encourage you to review this Agreement periodically. Your continued use of our services after any modifications constitutes your acceptance of the updated Agreement.
          </p>

          <h2 className="text-lg font-bold mt-6">12. Contact Information</h2>
          <p>
            If you have any questions, concerns, or requests regarding this Data Sharing Consent Agreement or the processing of your personal information, please contact our Data Protection Officer:
          </p>
          <ul className="list-none ml-4 space-y-2">
            <li><strong>Data Protection Officer</strong></li>
            <li><strong>Email:</strong> dpo@ifrcinsurance.com</li>
            <li><strong>Phone:</strong> +632 8633 5681</li>
            <li><strong>Address:</strong> 6th Floor Padilla Building, F. Ortigas Jr. Road, Ortigas Center, Pasig City, Philippines</li>
          </ul>

          <h2 className="text-lg font-bold mt-6">13. Consent</h2>
          <p className="font-semibold">
            By checking the Data Sharing Consent Agreement checkbox during the insurance application process, you acknowledge that:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>You have read and understood this Data Sharing Consent Agreement</li>
            <li>You freely and voluntarily give your consent to the collection, use, processing, sharing, and disclosure of your personal information as described in this Agreement</li>
            <li>You understand your rights as a data subject under the Data Privacy Act of 2012</li>
            <li>You acknowledge that your consent is required for the processing of your insurance application</li>
          </ul>

          <h2 className="text-lg font-bold mt-6">14. Withdrawal of Consent</h2>
          <p>
            You may withdraw your consent at any time by contacting our Data Protection Officer. However, please note that:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>Withdrawal of consent may affect our ability to provide insurance services to you</li>
            <li>We may still retain certain information as required by law or for legitimate business purposes</li>
            <li>Withdrawal does not affect the lawfulness of processing based on consent before its withdrawal</li>
          </ul>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Important Notice:</strong> This is a legally binding agreement. Please read it carefully before providing your consent. If you do not agree with any part of this Agreement, please do not proceed with your insurance application.
            </p>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            <strong>Effective Date:</strong> January 1, 2024<br />
            <strong>Last Updated:</strong> January 1, 2024
          </p>

          <p className="mt-4 text-sm text-muted-foreground">
            This Data Sharing Consent Agreement is governed by and construed in accordance with the laws of the Republic of the Philippines, particularly the Data Privacy Act of 2012 (Republic Act No. 10173) and its implementing rules and regulations.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  )
}
