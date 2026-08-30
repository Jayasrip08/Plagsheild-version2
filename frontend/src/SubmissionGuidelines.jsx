import { useState } from 'react';
import { ArrowLeft, CircleHelp, Lock } from 'lucide-react';

const TABS = [
  { id: 'guide', label: 'Submission Guide' },
  { id: 'similarity', label: 'Similarity Explained' },
  { id: 'payment', label: 'Payment' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'faq', label: 'FAQ' },
];

function GuideSection({ kicker, title, children }) {
  return (
    <section className="guide-section">
      {kicker && <p className="guide-kicker">{kicker}</p>}
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function SubmissionGuide() {
  return (
    <>
      <GuideSection kicker="01" title="Before you submit">
        <ul className="guide-checks">
          <li>You are the author or co-author, or you have authorisation to submit this manuscript.</li>
          <li>You are uploading the latest, final version of the paper.</li>
          <li>The file opens correctly on your computer before you upload it.</li>
          <li>Previous drafts and duplicate copies have been removed from the file you intend to submit.</li>
        </ul>
      </GuideSection>

      <GuideSection kicker="02" title="Supported files">
        <p>Accepted formats are <strong>PDF</strong>, <strong>DOC</strong>, and <strong>DOCX</strong>.</p>
        <p>Maximum file size is <strong>25 MB</strong>. Password-protected documents cannot be analysed.</p>
      </GuideSection>

      <GuideSection kicker="03" title="What will be checked">
        <p>
          Your manuscript will be analysed for textual similarity against the sources available to the licensed similarity-checking service. The report identifies matching or similar text and provides source information.
        </p>
        <aside className="guide-callout">
          A similarity score is not, by itself, a determination of plagiarism. The final interpretation should be made by the author, editor, reviewer, or institution.
        </aside>
      </GuideSection>

      <GuideSection kicker="04" title="Manuscript preparation">
        <p>Recommended before upload:</p>
        <ul className="guide-checks">
          <li>Final manuscript</li>
          <li>Correct title and author information</li>
          <li>Proper citations</li>
          <li>References included</li>
          <li>Tables and figures properly labelled</li>
          <li>No password-protected document</li>
        </ul>
      </GuideSection>
    </>
  );
}

function SimilarityExplained() {
  return (
    <>
      <GuideSection kicker="Score" title="Understanding the similarity score">
        <p>
          The percentage indicates the amount of text that matches or is similar to content identified by the checking system.
        </p>
        <p>
          A similarity score is not, by itself, a determination of plagiarism. Your conference, journal, or institution may have its own acceptable similarity requirements. Please check their guidelines.
        </p>
        <aside className="guide-callout">
          NovelCheckr does not treat any percentage band as “safe” or “plagiarism”. Thresholds vary across venues and should be applied by the responsible editor, reviewer, or institution.
        </aside>
      </GuideSection>

      <GuideSection kicker="Revision" title="If similarity is high">
        <p>
          A high similarity score does not automatically mean plagiarism. Review the highlighted sections and sources carefully.
        </p>
        <p>Possible legitimate matches include:</p>
        <ul className="guide-list">
          <li>Properly quoted text</li>
          <li>References</li>
          <li>Standard terminology</li>
          <li>Methodology descriptions</li>
          <li>Common phrases</li>
          <li>The author’s previously published work</li>
        </ul>
        <p>If revision is required, use appropriate paraphrasing, quotation, and citation practices.</p>
      </GuideSection>
    </>
  );
}

function PaymentGuide() {
  return (
    <>
      <GuideSection kicker="Services" title="Assessment packages">
        <p>All listed prices include GST.</p>
        <div className="guide-price-grid">
          <article>
            <span>Check</span>
            <strong>₹99</strong>
            <p>Detailed similarity report</p>
          </article>
          <article>
            <span>Improve</span>
            <strong>₹299</strong>
            <p>Report plus language and similarity support</p>
          </article>
          <article>
            <span>Complete</span>
            <strong>₹549</strong>
            <p>Full research package, including formatting and citation checks</p>
          </article>
        </div>
      </GuideSection>

      <GuideSection kicker="Process" title="Payment and report">
        <ol className="guide-steps">
          <li>Payment</li>
          <li>File processing</li>
          <li>Similarity analysis</li>
          <li>Report</li>
        </ol>
        <p>
          After payment, the manuscript is processed and analysed. The report becomes available in your NovelCheckr account when analysis is complete.
        </p>
        <p>
          The secure report download link is valid for <strong>48 hours</strong> after the report is issued.
        </p>
      </GuideSection>
    </>
  );
}

function PrivacyGuide() {
  return (
    <>
      <GuideSection kicker="Handling" title="Manuscript privacy">
        <p>
          Your manuscript is submitted for similarity analysis and handled according to NovelCheckr’s privacy and data-handling practices. Unpublished research should be treated as confidential work.
        </p>
        <p>
          The file is stored so that the order can be processed, analysed, and the report delivered to your account. We do not claim that manuscripts are never stored.
        </p>
      </GuideSection>

      <GuideSection kicker="Access" title="Who can see your file">
        <ul className="guide-list">
          <li>You can view your own submissions and reports from your account.</li>
          <li>Authorised NovelCheckr operators process orders and issue reports.</li>
          <li>If you submit through an institutional (college) account, authorised college administrators may see submission records associated with that institution.</li>
        </ul>
      </GuideSection>

      <GuideSection kicker="Analysis" title="Third-party similarity service">
        <p>
          Textual comparison is performed using a licensed similarity-checking service. Matching text and source information in the report come from that analysis.
        </p>
        <p>
          Report files are stored with the order. Download links expire 48 hours after the report is issued.
        </p>
      </GuideSection>
    </>
  );
}

function FaqGuide() {
  return (
    <>
      <GuideSection title="Which file types can I upload?">
        <p>PDF, DOC, and DOCX, up to 25 MB. The document must open without a password.</p>
      </GuideSection>
      <GuideSection title="Does a high score mean plagiarism?">
        <p>
          No. The score reports matching or similar text. Interpretation belongs to the author, editor, reviewer, or institution, in line with that venue’s policy.
        </p>
      </GuideSection>
      <GuideSection title="When will I receive the report?">
        <p>
          After successful payment, the file is processed and analysed. The report appears in your account when analysis is complete. The download link remains valid for 48 hours after issue.
        </p>
      </GuideSection>
      <GuideSection title="Who should submit the manuscript?">
        <p>The corresponding author, a co-author, or a person with authorisation to submit the work.</p>
      </GuideSection>
      <GuideSection title="Can I submit a thesis or book chapter?">
        <p>Yes. Choose the matching paper type and purpose of submission on the form.</p>
      </GuideSection>
    </>
  );
}

const PANELS = {
  guide: SubmissionGuide,
  similarity: SimilarityExplained,
  payment: PaymentGuide,
  privacy: PrivacyGuide,
  faq: FaqGuide,
};

export function GuidelinesTrigger({ onOpen }) {
  return (
    <button type="button" className="help-link" onClick={onOpen}>
      <CircleHelp size={15} strokeWidth={2} />
      Submission Guidelines
    </button>
  );
}

export default function SubmissionGuidelinesPage({ onBack }) {
  const [tab, setTab] = useState('guide');
  const Panel = PANELS[tab];

  return (
    <div className="guide-page">
      <div className="guide-page-inner">
        <button type="button" className="guide-back" onClick={onBack}>
          <ArrowLeft size={16} />
          Back to submission
        </button>

        <header className="guide-page-header">
          <p className="guide-eyebrow">Author resources</p>
          <h1>Similarity Analysis Guidelines</h1>
          <p>
            What to prepare before you upload, how to read the similarity score, and how your manuscript is handled.
          </p>
        </header>

        <nav className="guide-tabs" role="tablist" aria-label="Guideline sections">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={`guide-tab ${tab === item.id ? 'is-active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <article className="guide-article">
          <Panel />
        </article>

        <p className="guide-footnote">
          <Lock size={13} />
          Treat unpublished manuscripts as confidential work.
        </p>
      </div>
    </div>
  );
}
