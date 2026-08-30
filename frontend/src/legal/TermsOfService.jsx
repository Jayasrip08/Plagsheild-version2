import { Link } from 'react-router-dom';
import LegalLayout from './LegalLayout';

export default function TermsOfService() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="August 30, 2026">
      <p className="legal-identity">
        <strong>NovelCheckr</strong><br />
        An academic research and manuscript platform operated by{' '}
        <strong>Innolift Ventures Private Limited</strong><br />
        GSTIN: 33AAHCI9385C1ZG
      </p>

      <p>
        These Terms of Service ("Terms") govern your access to and use of NovelCheckr, an academic
        research and manuscript services platform operated by Innolift Ventures Private Limited
        ("NovelCheckr", "we", "us", or "our").
      </p>
      <p>
        By creating an account, uploading a manuscript, purchasing a service, registering for a
        conference, or otherwise using NovelCheckr, you agree to these Terms.
      </p>
      <p>If you do not agree with these Terms, please do not use the platform.</p>

      <h2>1. About NovelCheckr</h2>
      <p>NovelCheckr provides digital academic and research-related services, which may include:</p>
      <ul>
        <li>Manuscript similarity analysis</li>
        <li>Academic manuscript improvement services</li>
        <li>Research paper formatting</li>
        <li>Conference paper submission and tracking</li>
        <li>Conference registration</li>
        <li>Reviewer and editorial workflows</li>
        <li>Copyright-form collection</li>
        <li>Certificate generation and verification</li>
        <li>Academic profiles and related research services</li>
      </ul>
      <p>
        Specific services available to you may vary depending on the conference, institution, service
        package, or other offering.
      </p>

      <h2>2. Eligibility and Account</h2>
      <p>You must provide accurate and complete information when creating an account.</p>
      <p>You are responsible for:</p>
      <ul>
        <li>Maintaining the confidentiality of your login credentials.</li>
        <li>Keeping your account information accurate.</li>
        <li>All activities performed through your account.</li>
        <li>Immediately notifying us if you believe your account has been compromised.</li>
      </ul>
      <p>
        We reserve the right to suspend or terminate accounts that contain false information, are used
        fraudulently, or violate these Terms.
      </p>
      <p>
        NovelCheckr is primarily intended for users aged 18 and above. Where users under 18 are
        permitted by applicable law or through an institutionally managed program, any required
        parental or guardian authorization or consent must be obtained.
      </p>

      <h2>3. Manuscript Submission</h2>
      <p>
        You may upload research papers, manuscripts, theses, book chapters, or other permitted academic
        documents.
      </p>
      <p>You confirm that:</p>
      <ul>
        <li>You own the manuscript or have the necessary authorization to submit it.</li>
        <li>Your submission does not knowingly infringe another person's intellectual-property rights.</li>
        <li>You have obtained permission to submit any confidential or third-party material included in the document.</li>
        <li>The information you provide is accurate.</li>
      </ul>
      <p>You remain responsible for the content of your manuscript.</p>

      <h2>4. Similarity Analysis</h2>
      <p>
        NovelCheckr provides similarity-analysis services to identify textual matches or similarities
        within the scope of the applicable analysis service.
      </p>
      <p>A similarity score does not by itself establish that plagiarism has occurred.</p>
      <p>
        Similarity may result from legitimate citations, quotations, technical terminology, common
        expressions, references, previously published material, or other sources.
      </p>
      <p>
        The final academic determination should be made by the relevant author, institution, editor,
        reviewer, conference, or journal.
      </p>
      <p>NovelCheckr does not guarantee that a manuscript will achieve a particular similarity percentage.</p>

      <h2>5. Academic Improvement Services</h2>
      <p>
        Where you purchase an academic improvement or manuscript-improvement service, the service may
        include language improvement, academic writing assistance, formatting, or similarity-focused
        revision assistance depending on the package purchased.
      </p>
      <p>We do not guarantee:</p>
      <ul>
        <li>A particular similarity percentage.</li>
        <li>Acceptance by a conference or journal.</li>
        <li>Publication of a manuscript.</li>
        <li>Acceptance by a university or institution.</li>
        <li>A particular academic outcome.</li>
      </ul>
      <p>Authors remain responsible for reviewing and approving all changes before submission.</p>

      <h2>6. Conference Services</h2>
      <p>
        NovelCheckr may host conferences organized in collaboration with colleges, institutions,
        organizers, editors, or other academic partners.
      </p>
      <p>Conference-specific information may include:</p>
      <ul>
        <li>Registration fees</li>
        <li>Submission deadlines</li>
        <li>Paper requirements</li>
        <li>Review procedures</li>
        <li>Publication arrangements</li>
        <li>Conference dates</li>
        <li>Venue information</li>
        <li>Certificate eligibility</li>
        <li>Refund conditions</li>
      </ul>
      <p>
        These conditions may vary between conferences. The specific terms displayed on an individual
        conference page or during registration may apply in addition to these Terms.
      </p>
      <p>Conference organizers may make decisions regarding:</p>
      <ul>
        <li>Paper acceptance</li>
        <li>Rejection</li>
        <li>Revision</li>
        <li>Presentation</li>
        <li>Registration eligibility</li>
        <li>Certificate eligibility</li>
        <li>Publication</li>
      </ul>
      <p>
        NovelCheckr does not guarantee acceptance or publication unless expressly stated in the
        applicable conference terms.
      </p>

      <h2>7. Payments</h2>
      <p>
        Payments may be processed through third-party payment providers such as Razorpay or other
        supported payment methods. You agree to provide accurate payment information.
      </p>
      <p>For manual payments, you may be required to provide:</p>
      <ul>
        <li>Transaction/UTR number</li>
        <li>Amount</li>
        <li>Payment date</li>
        <li>Payment screenshot or other proof</li>
      </ul>
      <p>
        Uploading payment proof does not automatically constitute successful payment. Manual payments
        remain pending until verified by the authorized college or NovelCheckr administrator.
      </p>

      <h2>8. Pricing and Taxes</h2>
      <p>
        Prices displayed on NovelCheckr may include or exclude applicable taxes depending on how the
        price is presented. Where GST is included, the applicable tax component will be reflected in
        the invoice issued by Innolift Ventures Private Limited under GSTIN 33AAHCI9385C1ZG.
      </p>
      <p>Our current customer-facing services may include:</p>
      <ul>
        <li>Similarity Check — ₹99, GST included</li>
        <li>Similarity Improvement — ₹299, GST included</li>
        <li>Complete Research Paper Package — ₹549, GST included</li>
      </ul>
      <p>
        Prices may change in the future. The price applicable at the time of purchase will generally be
        the price displayed during checkout.
      </p>

      <h2>9. Refunds and Cancellations</h2>
      <p>
        Refunds are governed by our separate{' '}
        <Link to="/refund-policy">Refund &amp; Cancellation Policy</Link>.
      </p>
      <p>
        Because certain services involve immediate digital processing or work performed specifically
        for an individual manuscript, some services may become non-refundable once processing has
        begun. Please review the Refund &amp; Cancellation Policy before purchasing.
      </p>

      <h2>10. Intellectual Property</h2>
      <p>You retain ownership of your original manuscript and intellectual property.</p>
      <p>By uploading content, you grant NovelCheckr the limited permission necessary to:</p>
      <ul>
        <li>Store the submission.</li>
        <li>Process the manuscript.</li>
        <li>Perform the requested analysis.</li>
        <li>Provide the requested service.</li>
        <li>Generate and deliver reports.</li>
        <li>Provide conference or academic services requested by you.</li>
      </ul>
      <p>
        NovelCheckr does not acquire ownership of your manuscript merely because you upload it. You
        must not upload material that you are prohibited from sharing. How we handle manuscripts is
        also described in our <Link to="/privacy-policy">Privacy Policy</Link>.
      </p>

      <h2>11. Confidentiality</h2>
      <p>
        We take reasonable measures to protect submitted manuscripts and personal information. However,
        you acknowledge that no internet-based system can guarantee absolute security.
      </p>
      <p>
        Where third-party providers are required to perform a requested service, information may be
        securely transmitted to those providers in accordance with our{' '}
        <Link to="/privacy-policy">Privacy Policy</Link> and applicable agreements.
      </p>

      <h2>12. Prohibited Use</h2>
      <p>You must not use NovelCheckr to:</p>
      <ul>
        <li>Submit another person's work without authorization.</li>
        <li>Impersonate another author.</li>
        <li>Upload stolen or unlawfully obtained manuscripts.</li>
        <li>Circumvent payment systems.</li>
        <li>Submit fraudulent payment evidence.</li>
        <li>Attempt to gain unauthorized access to another account.</li>
        <li>Interfere with the platform.</li>
        <li>Upload malware or malicious files.</li>
        <li>Abuse reviewers, editors, college administrators, or support staff.</li>
        <li>Use the platform for unlawful purposes.</li>
      </ul>
      <p>We may suspend or terminate accounts involved in prohibited activity.</p>

      <h2>13. Academic Integrity</h2>
      <p>
        NovelCheckr is intended to support academic integrity. Our services must not be represented as
        a guarantee that a manuscript is free from plagiarism or will be accepted for publication.
      </p>
      <p>Users remain responsible for:</p>
      <ul>
        <li>Proper citation.</li>
        <li>Accurate attribution.</li>
        <li>Obtaining necessary permissions.</li>
        <li>Following conference or journal requirements.</li>
        <li>Maintaining academic integrity.</li>
      </ul>

      <h2>14. Third-Party Services</h2>
      <p>NovelCheckr may use third-party providers for:</p>
      <ul>
        <li>Payment processing</li>
        <li>Cloud hosting</li>
        <li>Email delivery</li>
        <li>Similarity analysis</li>
        <li>Authentication</li>
        <li>Security</li>
        <li>Other infrastructure services</li>
      </ul>
      <p>Use of those services may also be subject to their respective terms and policies.</p>

      <h2>15. Service Availability</h2>
      <p>
        We aim to keep NovelCheckr available and reliable, but we do not guarantee uninterrupted or
        error-free service.
      </p>
      <p>The platform may occasionally be unavailable because of:</p>
      <ul>
        <li>Maintenance</li>
        <li>Updates</li>
        <li>Technical problems</li>
        <li>Third-party service outages</li>
        <li>Network problems</li>
        <li>Security incidents</li>
        <li>Events beyond our reasonable control</li>
      </ul>

      <h2>16. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by applicable law, Innolift Ventures Private Limited and
        NovelCheckr shall not be responsible for indirect, incidental, consequential, or other losses
        arising from:
      </p>
      <ul>
        <li>Conference rejection</li>
        <li>Journal rejection</li>
        <li>Publication delays</li>
        <li>Academic decisions</li>
        <li>Incorrect information submitted by a user</li>
        <li>Third-party service interruptions</li>
        <li>Unauthorized access caused by circumstances outside our reasonable control</li>
      </ul>
      <p>
        Nothing in these Terms excludes liability that cannot legally be excluded under applicable law.
      </p>

      <h2>17. Account Suspension or Termination</h2>
      <p>We may suspend, restrict, or terminate access where we reasonably believe that:</p>
      <ul>
        <li>These Terms have been violated.</li>
        <li>Fraudulent activity has occurred.</li>
        <li>Payment abuse has occurred.</li>
        <li>The platform is being misused.</li>
        <li>Action is required by law or a competent authority.</li>
      </ul>
      <p>Where appropriate, we may provide notice before taking action.</p>

      <h2>18. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. When material changes are made, we may update the
        "Last updated" date and provide additional notice where appropriate.
      </p>
      <p>
        Continued use of NovelCheckr after the updated Terms become effective constitutes acceptance of
        the updated Terms to the extent permitted by applicable law.
      </p>

      <h2>19. Governing Law</h2>
      <p>
        These Terms shall be governed by the applicable laws of India. Any disputes shall be subject
        to the jurisdiction of the appropriate courts in Tamil Nadu, India, unless otherwise required
        by applicable law.
      </p>

      <h2>20. Contact</h2>
      <p>
        <strong>Innolift Ventures Private Limited</strong><br />
        Operating NovelCheckr<br />
        GSTIN: 33AAHCI9385C1ZG<br />
        Contact persons: Mr. D. Deena and P. Jayasri<br />
        Email: <a href="mailto:innoliftventures@gmail.com">innoliftventures@gmail.com</a><br />
        Address: Chromepet, Chennai, Tamil Nadu, India
      </p>
    </LegalLayout>
  );
}
