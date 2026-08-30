import { Link } from 'react-router-dom';
import LegalLayout from './LegalLayout';

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="August 30, 2026">
      <p className="legal-identity">
        <strong>NovelCheckr</strong><br />
        An academic research and manuscript platform operated by{' '}
        <strong>Innolift Ventures Private Limited</strong><br />
        GSTIN: 33AAHCI9385C1ZG
      </p>

      <p>
        This Privacy Policy explains how Innolift Ventures Private Limited ("we", "us", or "our") collects,
        uses, stores, shares, and protects personal data when you use NovelCheckr at novelcheckr.com,
        including student and professor accounts, manuscript submission, payments, similarity analysis,
        conference or college workflows, and related support.
      </p>
      <p>
        NovelCheckr is intended for users in India and for researchers worldwide. This notice is prepared
        with reference to India's Digital Personal Data Protection Act, 2023 and the Digital Personal Data
        Protection Rules, 2025, as applicable from time to time. Where a requirement has not yet commenced,
        we will update this Policy as those provisions take effect.
      </p>

      <h2>1. Who We Are</h2>
      <p>
        NovelCheckr is the user-facing platform. The legal entity responsible for processing personal data
        is:
      </p>
      <p>
        <strong>Innolift Ventures Private Limited</strong><br />
        GSTIN: 33AAHCI9385C1ZG<br />
        Address: Chromepet, Chennai, Tamil Nadu, India<br />
        Email: <a href="mailto:innoliftventures@gmail.com">innoliftventures@gmail.com</a>
      </p>
      <p>
        For questions about this Policy or the processing of your personal data, contact Mr. D. Deena
        (Grievance Officer) or P. Jayasri using the details in Section 19.
      </p>

      <h2>2. Information We Collect</h2>
      <p>Depending on how you use NovelCheckr, we may collect:</p>
      <ul>
        <li>
          <strong>Account information:</strong> name, email address, username, phone or WhatsApp number
          (if provided), role (for example student, professor, college administrator, or reviewer),
          institution or college affiliation, department, and a hashed password.
        </li>
        <li>
          <strong>Manuscript and submission data:</strong> the unpublished research paper, thesis, or other
          document you upload, together with title, authorship details, keywords, abstracts, and related
          metadata.
        </li>
        <li>
          <strong>Order and service data:</strong> selected package, word count, order status, similarity
          score when generated, and report-delivery records.
        </li>
        <li>
          <strong>Payment information:</strong> processed by Razorpay. We do not store complete card, UPI,
          or bank-account credentials. We may retain payment reference IDs, amount, GST invoice details,
          and transaction status.
        </li>
        <li>
          <strong>Conference and college data:</strong> institution name, conference or event identifiers,
          registration or credit allocation status, and certificate information where those features are used.
        </li>
        <li>
          <strong>Support messages:</strong> the content of emails or in-app help requests, including any
          order IDs or files you choose to attach.
        </li>
        <li>
          <strong>Usage and security data:</strong> IP address, browser type, device information, pages
          visited, and authentication or activity logs used for security and service operation.
        </li>
      </ul>

      <h2>3. How We Use Information</h2>
      <p>We use personal data to operate NovelCheckr, including to:</p>
      <ul>
        <li>create and administer accounts for students, professors, colleges, and authorised reviewers;</li>
        <li>accept unpublished manuscripts and provide the requested similarity or academic analysis;</li>
        <li>process payments and issue GST-compliant invoices under GSTIN 33AAHCI9385C1ZG;</li>
        <li>deliver reports, certificates, and order updates;</li>
        <li>administer college, conference, or institutional workflows where those services are used;</li>
        <li>respond to support requests and grievances; and</li>
        <li>protect the platform against fraud, abuse, unauthorised access, and other security risks.</li>
      </ul>

      <h2>4. Legal Basis / Permitted Purposes</h2>
      <p>
        We process personal data for specified purposes and only as reasonably necessary for those
        purposes. Typical purposes are:
      </p>
      <div className="legal-table-wrap">
        <table className="legal-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Name and email</td>
              <td>Account creation, login, and service communication</td>
            </tr>
            <tr>
              <td>Manuscript and authorship details</td>
              <td>Similarity or related academic analysis and report delivery</td>
            </tr>
            <tr>
              <td>Payment and invoice information</td>
              <td>Payment processing, GST invoicing, accounting, and refunds</td>
            </tr>
            <tr>
              <td>Institution or college affiliation</td>
              <td>B2B credits, conference administration, and institutional services</td>
            </tr>
            <tr>
              <td>IP address and device data</td>
              <td>Security, fraud prevention, and reliable operation of the service</td>
            </tr>
            <tr>
              <td>Support messages</td>
              <td>Customer support and grievance redressal</td>
            </tr>
            <tr>
              <td>Conference and certificate data</td>
              <td>Event administration, review workflows, and issuance of certificates</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Where consent is required, we will seek it for the stated purpose. You may withdraw consent
        where applicable, without affecting processing that we must continue for legal, contractual,
        security, or other legitimate purposes permitted under applicable law.
      </p>

      <h2>5. Manuscript Confidentiality</h2>
      <p>
        Manuscripts submitted through NovelCheckr are processed to provide the requested similarity or
        academic analysis service. Where necessary, manuscripts may be securely transmitted to
        third-party service providers that perform similarity or related analysis on our behalf. We do
        not sell manuscript content or make submitted manuscripts publicly available. Manuscripts are
        handled in accordance with our agreements with service providers and applicable data-protection
        requirements.
      </p>
      <p>
        NovelCheckr is designed for unpublished research. We do not add your manuscript to a public
        plagiarism repository for others to search. Secure download links for generated reports expire
        48 hours after issue.
      </p>
      <p>
        Because similarity analysis may be performed by a specialised provider, a manuscript may leave
        NovelCheckr's systems for that limited processing step and a report may be returned to us. We
        only provide those providers with information reasonably necessary to perform the analysis.
      </p>

      <h2>6. Conference &amp; College Data</h2>
      <p>
        When you participate in a conference, college, or institutional workflow hosted through
        NovelCheckr, certain information such as your name, email address, institution, manuscript,
        registration status, and certificate information may be shared with the relevant conference
        organiser or college administrator where necessary to administer the conference or institutional
        service.
      </p>
      <p>
        If a college allocates credits or an organiser manages submissions on your behalf, that
        organisation may see submission status and related records needed to operate their programme.
        They should use that information only for those administrative purposes.
      </p>

      <h2>7. Reviewer Access</h2>
      <p>
        Conference organisers and authorised reviewers may access manuscripts and associated submission
        information where necessary to conduct peer review or manage the conference. Reviewers are
        expected to maintain confidentiality and not to copy, share, or use unpublished manuscripts
        except for the review assignment. Unauthorised disclosure of a manuscript by a reviewer is a
        breach of these expectations and of our Terms of Service.
      </p>

      <h2>8. Payment Information</h2>
      <p>
        Payment transactions are processed by Razorpay. We do not store complete card, UPI, or
        bank-account credentials. We may keep transaction references, amounts, GST invoice data, and
        refund status as required for accounting and tax compliance.
      </p>
      <p>
        Refunds and cancellations are described in our{' '}
        <Link to="/refund-policy">Refund &amp; Cancellation Policy</Link>.
      </p>

      <h2>9. Third-Party Service Providers</h2>
      <p>
        We use third-party providers to operate NovelCheckr. We only provide them with information
        reasonably necessary to provide their respective services. Categories include:
      </p>
      <ul>
        <li><strong>Payment processor</strong> — Razorpay, for checkout, payment capture, and refunds.</li>
        <li><strong>Cloud hosting and storage</strong> — infrastructure used to run the application, store uploaded files, and deliver reports.</li>
        <li><strong>Email provider</strong> — to send account, order, and support messages.</li>
        <li><strong>Similarity-analysis provider</strong> — specialised processors that analyse manuscripts and return similarity or related results on our behalf. We do not publicly name a specific engine unless we are using that provider in production and are permitted to describe the relationship.</li>
        <li><strong>Analytics or security providers</strong> — only if enabled to protect the service or understand basic operational performance. We do not use third-party advertising trackers.</li>
      </ul>
      <p>
        These providers process data under their own terms and our arrangements with them. They may not
        use manuscript content for their own unrelated products except as required to perform the
        contracted analysis or as required by law.
      </p>

      <h2>10. International Data Processing</h2>
      <p>
        NovelCheckr is operated from India. Some of our service providers (for example cloud hosting,
        email, payment, or similarity-analysis providers) may process or store information on servers
        located outside India. Where that occurs, personal data may be transferred outside India for the
        purposes described in this Policy.
      </p>
      <p>
        We do not claim that all data is stored only in India. If you use NovelCheckr from another
        country, or if a conference involves organisers or reviewers outside India, relevant information
        may be accessed from those locations as needed to provide the service.
      </p>

      <h2>11. Cookies &amp; Local Storage</h2>
      <p>
        NovelCheckr uses essential cookies and browser local storage to keep you signed in and remember
        interface preferences required for the service to function. We do not use third-party advertising
        cookies. You can clear cookies and local storage in your browser; doing so may sign you out.
      </p>

      <h2>12. Data Security</h2>
      <p>
        We use reasonable technical and organisational safeguards designed to protect personal
        information against unauthorised access, alteration, disclosure, loss, or destruction. These
        measures may include encryption in transit, access controls, authentication mechanisms, secure
        cloud infrastructure, and activity logging.
      </p>
      <p>
        No method of transmission or storage is completely secure. We do not promise that information
        will be 100% secure, and you should avoid submitting highly sensitive personal data in a
        manuscript unless it is necessary for the work being assessed.
      </p>

      <h2>13. Data Retention &amp; Deletion</h2>
      <p>
        As a business rule, we retain uploaded manuscripts and generated reports in active storage for
        <strong> 90 days</strong>, after which they are deleted from active storage, except where a
        longer period is required for legal, tax, accounting, security, or dispute-resolution purposes
        (for example GST invoice records).
      </p>
      <p>
        You may request earlier deletion of your manuscript by emailing{' '}
        <a href="mailto:innoliftventures@gmail.com">innoliftventures@gmail.com</a>, subject to legal,
        accounting, security, dispute-resolution, or other legitimate retention requirements.
      </p>
      <p>
        Where our hosting infrastructure uses encrypted backups, deletion from active storage may not
        immediately remove data from those backups. Backup copies, if any, are retained only for a
        limited period before being automatically overwritten in the ordinary backup cycle.
      </p>
      <p>
        Report download links expire 48 hours after issue, independent of the 90-day active-storage
        period.
      </p>

      <h2>14. Your Privacy Rights</h2>
      <p>
        Subject to applicable law, you may contact us to:
      </p>
      <ul>
        <li>access the personal data we hold about you;</li>
        <li>correct inaccurate or incomplete personal data;</li>
        <li>request deletion of personal data or a manuscript;</li>
        <li>withdraw consent where processing is based on consent;</li>
        <li>ask questions about how we process your personal data; and</li>
        <li>raise a complaint or grievance about our handling of your data.</li>
      </ul>
      <p>
        Send requests to <a href="mailto:innoliftventures@gmail.com">innoliftventures@gmail.com</a> with
        enough detail for us to identify your account (for example your registered email and order ID).
        We will acknowledge rights and grievance requests within 48 hours and aim to respond within 30
        days, or within such other period as applicable law may prescribe. We may need to verify your
        identity before acting on a request.
      </p>

      <h2>15. Account Deletion</h2>
      <p>
        You may request deletion of your NovelCheckr account by emailing{' '}
        <a href="mailto:innoliftventures@gmail.com">innoliftventures@gmail.com</a> from your registered
        email address. Upon account deletion, personal information and manuscripts will be deleted or
        anonymised where reasonably possible, subject to information that must be retained for legal,
        tax, accounting, fraud-prevention, security, or dispute-resolution purposes.
      </p>
      <p>
        Deleting an account does not automatically cancel an in-progress paid analysis. Refund
        eligibility, if any, is governed by the{' '}
        <Link to="/refund-policy">Refund &amp; Cancellation Policy</Link>.
      </p>

      <h2>16. Children's Privacy</h2>
      <p>
        Under India's Digital Personal Data Protection Act, a child is an individual under 18 years of
        age, and processing a child's personal data is subject to additional requirements, including
        verifiable parental or guardian consent where those provisions apply.
      </p>
      <p>
        NovelCheckr is intended for users aged <strong>18 and above</strong>. We do not knowingly permit
        individuals under 18 to create accounts or submit manuscripts without appropriate authorisation
        and consent where legally required. If you believe a child has provided personal data to us,
        contact <a href="mailto:innoliftventures@gmail.com">innoliftventures@gmail.com</a> and we will
        take reasonable steps to delete the information.
      </p>

      <h2>17. Grievance / Contact</h2>
      <p>
        If you have a complaint about how NovelCheckr handles your personal data, write to our Grievance
        Officer. We will acknowledge the grievance within 48 hours and work to resolve it within 30 days
        or such period as applicable law requires.
      </p>
      <p>
        <strong>Grievance Officer:</strong> Mr. D. Deena<br />
        <strong>Additional contact person:</strong> P. Jayasri<br />
        Email: <a href="mailto:innoliftventures@gmail.com">innoliftventures@gmail.com</a><br />
        Address: Chromepet, Chennai, Tamil Nadu, India
      </p>

      <h2>18. Changes to This Privacy Policy</h2>
      <p>
        We may update this Privacy Policy to reflect changes in NovelCheckr, our providers, or applicable
        law, including commencement of further DPDP requirements. Material changes will be shown by
        updating the "Last updated" date above. Continued use of NovelCheckr after an update constitutes
        notice of the revised Policy, except where applicable law requires a different form of notice or
        consent.
      </p>

      <h2>19. Contact Us</h2>
      <p>
        <strong>Innolift Ventures Private Limited</strong><br />
        Operating NovelCheckr<br />
        GSTIN: 33AAHCI9385C1ZG<br />
        Grievance Officer: Mr. D. Deena<br />
        Additional contact person: P. Jayasri<br />
        Email: <a href="mailto:innoliftventures@gmail.com">innoliftventures@gmail.com</a><br />
        Address: Chromepet, Chennai, Tamil Nadu, India
      </p>
    </LegalLayout>
  );
}
