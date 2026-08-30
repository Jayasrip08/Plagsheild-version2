import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CloudUpload,
  FileText,
  Lock,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import SubmissionGuidelinesPage, { GuidelinesTrigger } from './SubmissionGuidelines';

const MAX_FILE_MB = 25;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
const MAX_KEYWORDS = 5;
const ACCEPTED_TYPES = ['.pdf', '.doc', '.docx'];

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(0.1, bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileKind(name) {
  const lower = (name || '').toLowerCase();
  if (lower.endsWith('.pdf')) return 'PDF';
  if (lower.endsWith('.docx')) return 'DOCX';
  if (lower.endsWith('.doc')) return 'DOC';
  return 'Document';
}

const PAPER_TYPES = [
  'Research Paper',
  'Review Paper',
  'Book Chapter',
  'Thesis/Dissertation',
  'Other',
];

const SUBJECTS = [
  'Computer Science',
  'AI/ML',
  'Electronics',
  'Mechanical',
  'Management',
  'Electrical',
  'Civil',
  'Biotechnology',
  'Medicine',
  'Humanities',
  'Other',
];

const PURPOSES = [
  'General Similarity Check',
  'Conference Submission',
  'Journal Submission',
  'Book Chapter',
  'Thesis/Dissertation',
];

const COUNTRIES = [
  'India',
  'United States',
  'United Kingdom',
  'United Arab Emirates',
  'Singapore',
  'Malaysia',
  'Bangladesh',
  'Nepal',
  'Sri Lanka',
  'Australia',
  'Canada',
  'Germany',
  'Other',
];

const PACKAGE_DEFS = [
  {
    id: 'check',
    kicker: 'Check',
    name: 'Similarity Check',
    features: [
      'Detailed similarity report',
      'Similarity percentage',
      'Matching sources',
      'Highlighted matches',
      'Downloadable report',
    ],
  },
  {
    id: 'complete',
    kicker: 'Complete',
    name: 'Complete Research Package',
    popular: true,
    features: [
      'Detailed similarity report',
      'Similarity improvement',
      'Academic language check',
      'Formatting check',
      'Reference/citation check',
      'One revision',
      'Final similarity report',
    ],
  },
  {
    id: 'improve',
    kicker: 'Improve',
    name: 'Similarity Improvement',
    features: [
      'Everything in Check',
      'Academic language improvement',
      'Help addressing similarity',
      'One revision',
      'Final similarity report',
    ],
  },
];

const STEPS = [
  { key: 'paper', label: 'Manuscript', roman: 'I', hint: 'Identify the work under assessment' },
  { key: 'author', label: 'Authorship', roman: 'II', hint: 'Corresponding author and contributors' },
  { key: 'upload', label: 'Deposit', roman: 'III', hint: 'Archive the manuscript file' },
  { key: 'pricing', label: 'Assessment', roman: 'IV', hint: 'Select the similarity service' },
  { key: 'review', label: 'Certification', roman: 'V', hint: 'Review, declare, and submit' },
];

const PUBLIC_PRICES = {
  check: { price: 99, taxable: 83.90, gst: 15.10 },
  improve: { price: 299, taxable: 253.39, gst: 45.61 },
  complete: { price: 549, taxable: 465.25, gst: 83.75 },
};

function profileName(user) {
  const full = `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
  return full || user?.username || '';
}

function emptyCoAuthor() {
  return { name: '', email: '', institution: '' };
}

const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

function isValidEmail(value) {
  return EMAIL_RE.test(String(value || '').trim());
}

function validateSubmission({
  paperTitle,
  paperType,
  subjectArea,
  purpose,
  keywords,
  authorName,
  authorEmail,
  authorInstitution,
  authorCountry,
  coAuthors,
  file,
  fileReady,
  selectedPackage,
  consentAuthor,
  consentAnalytical,
  consentTerms,
}) {
  const errors = {};
  const title = paperTitle.trim();
  if (!title) errors.paperTitle = 'Paper title is required.';
  else if (title.length < 8) errors.paperTitle = 'Enter the full paper title (at least 8 characters).';
  else if (title.length > 300) errors.paperTitle = 'Paper title cannot exceed 300 characters.';

  if (!paperType) errors.paperType = 'Select a paper type.';
  if (!subjectArea) errors.subjectArea = 'Select a subject / research area.';
  if (!purpose) errors.purpose = 'Select the purpose of submission.';
  if (!keywords.length) errors.keywords = 'Add at least one keyword.';

  const name = authorName.trim();
  if (!name) errors.authorName = 'Corresponding author name is required.';
  else if (name.length < 2) errors.authorName = 'Enter a valid author name.';

  const email = authorEmail.trim();
  if (!email) errors.authorEmail = 'Email is required.';
  else if (!isValidEmail(email)) errors.authorEmail = 'Enter a valid email address.';

  const institution = authorInstitution.trim();
  if (!institution) errors.authorInstitution = 'Institution / college is required.';
  else if (institution.length < 2) errors.authorInstitution = 'Enter a valid institution name.';

  if (!authorCountry) errors.authorCountry = 'Select a country.';

  coAuthors.forEach((author, index) => {
    const coName = author.name.trim();
    const coEmail = author.email.trim();
    const coInst = author.institution.trim();
    if (!coName && !coEmail && !coInst) {
      errors[`coAuthor_${index}`] = 'Enter co-author details or remove this row.';
      return;
    }
    if (!coName) errors[`coAuthor_${index}_name`] = 'Co-author name is required.';
    if (coEmail && !isValidEmail(coEmail)) errors[`coAuthor_${index}_email`] = 'Enter a valid email address.';
  });

  if (!file) errors.file = 'Please upload your manuscript (PDF, DOC, or DOCX).';
  else if (!fileReady) errors.file = 'Please wait for the manuscript to finish uploading.';
  if (!selectedPackage) errors.package = 'Select a check option.';
  if (!consentAuthor) errors.consentAuthor = 'You must confirm authorship or authorization.';
  if (!consentAnalytical) errors.consentAnalytical = 'You must acknowledge the nature of the similarity report.';
  if (!consentTerms) errors.consentTerms = 'You must agree to the terms and privacy policy.';
  return errors;
}

function fieldStep(key) {
  if (['paperTitle', 'paperType', 'subjectArea', 'purpose', 'keywords'].includes(key)) return 0;
  if (key.startsWith('author') || key.startsWith('coAuthor_')) return 1;
  if (key === 'file') return 2;
  if (key === 'package') return 3;
  return 4;
}

function stepErrorKeys(step, errors) {
  return Object.keys(errors).filter((key) => fieldStep(key) === step);
}

function FieldError({ message }) {
  if (!message) return null;
  return <span className="field-error">{message}</span>;
}

function packageQuote(pricingConfig, id) {
  const fallback = PUBLIC_PRICES[id];
  const catalog = pricingConfig?.packages?.[id];
  const catalogPrice = Number(catalog?.price);
  if (catalogPrice >= 50) {
    return {
      price: catalogPrice,
      taxable: Number(catalog.taxable ?? fallback.taxable),
      gst: Number(catalog.gst ?? fallback.gst),
    };
  }
  const raw = id === 'improve'
    ? pricingConfig?.express_fee
    : id === 'complete'
      ? pricingConfig?.editing_suggestions_fee
      : pricingConfig?.per_word_rate;
  const parsed = Number(raw);
  if (parsed >= 50) {
    const taxable = Math.round((parsed / 1.18) * 100) / 100;
    const gst = Math.round((parsed - taxable) * 100) / 100;
    return { price: parsed, taxable, gst };
  }
  return { ...fallback };
}

export default function SubmitPaperForm({ user, pricingConfig, submitting, onSubmit }) {
  const fileInputRef = useRef(null);
  const ingestRafRef = useRef(null);
  const fileReaderRef = useRef(null);
  const dragCountRef = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState('idle');
  const [keywordDraft, setKeywordDraft] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [coupon, setCoupon] = useState('');
  const [couponMessage, setCouponMessage] = useState('');

  const [paperTitle, setPaperTitle] = useState('');
  const [paperType, setPaperType] = useState('');
  const [subjectArea, setSubjectArea] = useState('');
  const [purpose, setPurpose] = useState('');

  const [authorName, setAuthorName] = useState(profileName(user));
  const [authorEmail, setAuthorEmail] = useState(user?.email || '');
  const [authorInstitution, setAuthorInstitution] = useState(user?.college_name || '');
  const [authorCountry, setAuthorCountry] = useState('');
  const [coAuthors, setCoAuthors] = useState([]);

  const [consentAuthor, setConsentAuthor] = useState(false);
  const [consentAnalytical, setConsentAnalytical] = useState(false);
  const [consentTerms, setConsentTerms] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState('check');
  const [attempted, setAttempted] = useState(false);
  const [touched, setTouched] = useState({});
  const [step, setStep] = useState(0);
  const [maxAttemptedStep, setMaxAttemptedStep] = useState(-1);
  const [showGuidelines, setShowGuidelines] = useState(false);

  const quote = packageQuote(pricingConfig, selectedPackage);
  const fromProfile = useMemo(
    () => Boolean(user?.email || user?.first_name || user?.college_name || user?.username),
    [user]
  );
  const formValues = {
    paperTitle,
    paperType,
    subjectArea,
    purpose,
    keywords,
    authorName,
    authorEmail,
    authorInstitution,
    authorCountry,
    coAuthors,
    file,
    fileReady: uploadPhase === 'ready',
    selectedPackage,
    consentAuthor,
    consentAnalytical,
    consentTerms,
  };
  const errors = validateSubmission(formValues);
  const declarationsOk = consentAuthor && consentAnalytical && consentTerms;
  const paymentLocked = !declarationsOk;
  const isLastStep = step === STEPS.length - 1;

  const showError = (key) => Boolean((maxAttemptedStep >= fieldStep(key) || touched[key] || attempted) && errors[key]);
  const markTouched = (key) => setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  const fieldClass = (base, key) => `${base}${showError(key) ? ' is-invalid' : ''}`;

  const addKeyword = (raw) => {
    const value = raw.trim().replace(/,$/, '');
    if (!value || keywords.length >= MAX_KEYWORDS || keywords.includes(value)) return;
    setKeywords((prev) => [...prev, value]);
    setKeywordDraft('');
  };

  const cancelIngest = () => {
    if (ingestRafRef.current) {
      cancelAnimationFrame(ingestRafRef.current);
      ingestRafRef.current = null;
    }
    if (fileReaderRef.current) {
      try { fileReaderRef.current.abort(); } catch { /* ignore */ }
      fileReaderRef.current = null;
    }
  };

  useEffect(() => () => cancelIngest(), []);

  const clearFile = () => {
    cancelIngest();
    setFile(null);
    setUploadProgress(0);
    setUploadPhase('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const takeSingleFile = (fileList) => {
    if (!fileList?.length) return { selected: null, extra: false };
    return { selected: fileList[0], extra: fileList.length > 1 };
  };

  const startFileIngest = (selected) => {
    cancelIngest();
    setFile(selected);
    setUploadProgress(0);
    setUploadPhase('reading');
    markTouched('file');

    const minDuration = Math.min(1800, Math.max(700, Math.sqrt(selected.size / 1024) * 28));
    const start = performance.now();
    let readerPct = 0;

    const reader = new FileReader();
    fileReaderRef.current = reader;
    reader.onprogress = (e) => {
      if (e.lengthComputable && e.total) {
        readerPct = (e.loaded / e.total) * 100;
      }
    };
    reader.onload = () => { readerPct = 100; };
    reader.onerror = () => { readerPct = 100; };
    reader.readAsArrayBuffer(selected);

    const tick = (now) => {
      const timePct = Math.min(100, ((now - start) / minDuration) * 100);
      const combined = Math.min(99, timePct * 0.55 + readerPct * 0.45);
      const done = readerPct >= 100 && timePct >= 100;
      setUploadProgress(done ? 100 : Math.round(combined));
      if (!done) {
        ingestRafRef.current = requestAnimationFrame(tick);
        return;
      }
      ingestRafRef.current = null;
      setUploadProgress(100);
      setUploadPhase('ready');
    };
    ingestRafRef.current = requestAnimationFrame(tick);
  };

  const assignFile = (selected, extraFiles) => {
    if (!selected) return;
    const name = selected.name.toLowerCase();
    const allowed = ACCEPTED_TYPES.some((ext) => name.endsWith(ext));
    if (!allowed) {
      setError('Accepted formats are PDF, DOC, and DOCX.');
      clearFile();
      markTouched('file');
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      setError(`Maximum file size is ${MAX_FILE_MB} MB.`);
      clearFile();
      markTouched('file');
      return;
    }
    setError(extraFiles ? 'Only one manuscript can be submitted. The first file was selected.' : '');
    startFileIngest(selected);
  };

  const handleFileInputChange = (e) => {
    const { selected, extra } = takeSingleFile(e.target.files);
    assignFile(selected, extra);
    e.target.value = '';
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    dragCountRef.current = 0;
    setDragging(false);
    const { selected, extra } = takeSingleFile(e.dataTransfer.files);
    assignFile(selected, extra);
    markTouched('file');
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCountRef.current += 1;
    setDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCountRef.current = Math.max(0, dragCountRef.current - 1);
    if (dragCountRef.current === 0) setDragging(false);
  };

  const updateCoAuthor = (index, field, value) => {
    setCoAuthors((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const scrollToFirstError = (nextErrors) => {
    const firstKey = Object.keys(nextErrors)[0];
    const node = document.querySelector(`[data-field="${firstKey}"]`)
      || document.getElementById('declaration-card');
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const goToStep = (index) => {
    if (index < 0 || index > STEPS.length - 1 || index > step) return;
    setError('');
    setStep(index);
  };

  const goNext = () => {
    if (step === 2 && uploadPhase === 'reading') {
      setError('Please wait for the manuscript to finish uploading.');
      return false;
    }
    addKeyword(keywordDraft);
    const nextErrors = validateSubmission({
      ...formValues,
      keywords: keywordDraft.trim() && keywords.length < MAX_KEYWORDS && !keywords.includes(keywordDraft.trim())
        ? [...keywords, keywordDraft.trim()]
        : keywords,
    });
    const keys = stepErrorKeys(step, nextErrors);
    if (keys.length) {
      setMaxAttemptedStep((prev) => Math.max(prev, step));
      setError('Please complete the required fields to continue.');
      scrollToFirstError(Object.fromEntries(keys.map((key) => [key, nextErrors[key]])));
      return false;
    }
    setError('');
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isLastStep) {
      goNext();
      return;
    }
    setAttempted(true);
    setMaxAttemptedStep(STEPS.length - 1);
    const nextErrors = validateSubmission(formValues);
    if (!declarationsOk) {
      setError('Accept all declarations to unlock payment.');
      document.getElementById('declaration-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (Object.keys(nextErrors).length) {
      const firstStep = Math.min(...Object.keys(nextErrors).map(fieldStep));
      setStep(firstStep);
      setError('Please complete the required fields before proceeding to payment.');
      scrollToFirstError(nextErrors);
      return;
    }

    setError('');
    onSubmit({
      file,
      paper_title: paperTitle.trim(),
      paper_type: paperType,
      subject_area: subjectArea,
      purpose,
      keywords: keywords.join(', '),
      author_name: authorName.trim(),
      author_email: authorEmail.trim(),
      author_institution: authorInstitution.trim(),
      author_country: authorCountry,
      co_authors: coAuthors
        .map((item) => ({
          name: item.name.trim(),
          email: item.email.trim(),
          institution: item.institution.trim(),
        }))
        .filter((item) => item.name),
      package: selectedPackage,
    });
  };

  if (showGuidelines) {
    return <SubmissionGuidelinesPage onBack={() => setShowGuidelines(false)} />;
  }

  return (
    <form className="submit-shell" onSubmit={handleSubmit} noValidate>
      <div className="submit-scroll">
        <div className="submit-header">
          <div>
            <p className="submit-kicker">Licensed similarity assessment</p>
            <h2>Submit your manuscript</h2>
            <p>Prepare the paper as you would for a journal or thesis office — then choose the assessment service.</p>
          </div>
          <GuidelinesTrigger onOpen={() => setShowGuidelines(true)} />
        </div>

        <nav className="folio-pipeline" aria-label="Submission stages">
          <ol className="folio-track">
            {STEPS.map((item, index) => {
              const state = index === step ? 'current' : index < step ? 'done' : '';
              return (
                <li key={item.key} className={`folio-stage ${state}`}>
                  {index > 0 && <span className={`folio-leader ${index <= step ? 'done' : ''}`} aria-hidden="true" />}
                  <button
                    type="button"
                    className={`folio-node ${state}`}
                    onClick={() => goToStep(index)}
                    disabled={index > step}
                  >
                    <span className="folio-seal">
                      {index < step ? <Check size={12} strokeWidth={3} /> : item.roman}
                    </span>
                    <strong>{item.label}</strong>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {error && <div className="form-error">{error}</div>}

        <div className={`submit-grid no-rail ${step === 3 ? 'pricing-mode' : ''}`}>
          <div className="submit-form-col">
            {step === 0 && (
            <section className="form-section">
              <div className="form-section-header">
                <span className="form-section-num">I</span>
                <div>
                  <h3>Manuscript</h3>
                  <p>Identify the work being submitted for similarity assessment.</p>
                </div>
              </div>
              <div className="form-section-body">
                <div className="form-group" data-field="paperTitle">
                  <label className="form-label">Paper Title <span className="required-mark">*</span></label>
                  <div className={`input-with-status ${paperTitle.trim() && !showError('paperTitle') ? 'is-valid' : ''}`}>
                    <input
                      className={fieldClass('form-control', 'paperTitle')}
                      value={paperTitle}
                      onChange={(e) => setPaperTitle(e.target.value)}
                      onBlur={() => markTouched('paperTitle')}
                      placeholder="AI-Based Disease Detection Using Deep Learning"
                    />
                    {paperTitle.trim() && !showError('paperTitle') && <Check size={16} className="input-valid-icon" />}
                  </div>
                  <FieldError message={showError('paperTitle') ? errors.paperTitle : ''} />
                </div>
                <div className="form-grid" style={{ marginTop: '16px' }}>
                  <div className="form-group" data-field="paperType">
                    <label className="form-label">Paper Type <span className="required-mark">*</span></label>
                    <select
                      className={fieldClass('form-control', 'paperType')}
                      value={paperType}
                      onChange={(e) => setPaperType(e.target.value)}
                      onBlur={() => markTouched('paperType')}
                    >
                      <option value="">Select paper type</option>
                      {PAPER_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <FieldError message={showError('paperType') ? errors.paperType : ''} />
                  </div>
                  <div className="form-group" data-field="subjectArea">
                    <label className="form-label">Subject / Research Area <span className="required-mark">*</span></label>
                    <select
                      className={fieldClass('form-control', 'subjectArea')}
                      value={subjectArea}
                      onChange={(e) => setSubjectArea(e.target.value)}
                      onBlur={() => markTouched('subjectArea')}
                    >
                      <option value="">Select subject</option>
                      {SUBJECTS.map((subject) => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                    <FieldError message={showError('subjectArea') ? errors.subjectArea : ''} />
                  </div>
                  <div className="form-group span-2" data-field="purpose">
                    <label className="form-label">Purpose of Submission <span className="required-mark">*</span></label>
                    <select
                      className={fieldClass('form-control', 'purpose')}
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      onBlur={() => markTouched('purpose')}
                    >
                      <option value="">Select purpose</option>
                      {PURPOSES.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                    <FieldError message={showError('purpose') ? errors.purpose : ''} />
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: '16px' }} data-field="keywords">
                  <div className="label-row">
                    <label className="form-label">Keywords <span className="required-mark">*</span></label>
                    <span className="char-count">{keywords.length}/{MAX_KEYWORDS}</span>
                  </div>
                  <div className={fieldClass('keyword-box', 'keywords')}>
                    {keywords.map((tag) => (
                      <span key={tag} className="keyword-tag">
                        {tag}
                        <button type="button" onClick={() => setKeywords((prev) => prev.filter((item) => item !== tag))} aria-label={`Remove ${tag}`}>
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    {keywords.length < MAX_KEYWORDS && (
                      <input
                        value={keywordDraft}
                        onChange={(e) => setKeywordDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            addKeyword(keywordDraft);
                          }
                        }}
                        onBlur={() => {
                          addKeyword(keywordDraft);
                          markTouched('keywords');
                        }}
                        placeholder={keywords.length ? 'Add another' : 'machine learning, healthcare, CNN'}
                      />
                    )}
                  </div>
                  <FieldError message={showError('keywords') ? errors.keywords : ''} />
                </div>
              </div>
            </section>
            )}

            {step === 1 && (
            <section className="form-section">
              <div className="form-section-header">
                <span className="form-section-num">II</span>
                <div>
                  <h3>Authorship</h3>
                  <p>Corresponding author details for this manuscript.</p>
                </div>
                {fromProfile && <span className="autofill-badge">Auto-filled from your profile</span>}
              </div>
              <div className="form-section-body">
                <div className="form-grid">
                  <div className="form-group" data-field="authorName">
                    <label className="form-label">Corresponding Author Name <span className="required-mark">*</span></label>
                    <input
                      className={fieldClass('form-control', 'authorName')}
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      onBlur={() => markTouched('authorName')}
                      placeholder="Full name"
                    />
                    <FieldError message={showError('authorName') ? errors.authorName : ''} />
                  </div>
                  <div className="form-group" data-field="authorEmail">
                    <label className="form-label">Email <span className="required-mark">*</span></label>
                    <input
                      type="email"
                      className={fieldClass('form-control', 'authorEmail')}
                      value={authorEmail}
                      onChange={(e) => setAuthorEmail(e.target.value)}
                      onBlur={() => markTouched('authorEmail')}
                      placeholder="name@institution.edu"
                    />
                    <FieldError message={showError('authorEmail') ? errors.authorEmail : ''} />
                  </div>
                  <div className="form-group" data-field="authorInstitution">
                    <label className="form-label">Institution / College <span className="required-mark">*</span></label>
                    <input
                      className={fieldClass('form-control', 'authorInstitution')}
                      value={authorInstitution}
                      onChange={(e) => setAuthorInstitution(e.target.value)}
                      onBlur={() => markTouched('authorInstitution')}
                      placeholder="Institution name"
                    />
                    <FieldError message={showError('authorInstitution') ? errors.authorInstitution : ''} />
                  </div>
                  <div className="form-group" data-field="authorCountry">
                    <label className="form-label">Country <span className="required-mark">*</span></label>
                    <select
                      className={fieldClass('form-control', 'authorCountry')}
                      value={authorCountry}
                      onChange={(e) => setAuthorCountry(e.target.value)}
                      onBlur={() => markTouched('authorCountry')}
                    >
                      <option value="">Select country</option>
                      {COUNTRIES.map((country) => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                    <FieldError message={showError('authorCountry') ? errors.authorCountry : ''} />
                  </div>
                </div>

                <div className="coauthor-block">
                  <div className="label-row">
                    <label className="form-label">Co-authors</label>
                    <button type="button" className="add-link" onClick={() => setCoAuthors((prev) => [...prev, emptyCoAuthor()])}>
                      <Plus size={14} /> Add Co-author
                    </button>
                  </div>
                  <div className="coauthor-table-wrap">
                    <table className="coauthor-table">
                      <thead>
                        <tr>
                          <th>Full Name</th>
                          <th>Email (Optional)</th>
                          <th>Institution</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {coAuthors.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="empty-row">No co-authors added.</td>
                          </tr>
                        ) : coAuthors.map((author, index) => (
                          <tr key={index} data-field={`coAuthor_${index}`}>
                            <td>
                              <input
                                className={`table-input${(showError(`coAuthor_${index}_name`) || showError(`coAuthor_${index}`)) ? ' is-invalid' : ''}`}
                                value={author.name}
                                onChange={(e) => updateCoAuthor(index, 'name', e.target.value)}
                                onBlur={() => {
                                  markTouched(`coAuthor_${index}`);
                                  markTouched(`coAuthor_${index}_name`);
                                }}
                                placeholder="Full name"
                              />
                              <FieldError message={showError(`coAuthor_${index}_name`) ? errors[`coAuthor_${index}_name`] : (showError(`coAuthor_${index}`) ? errors[`coAuthor_${index}`] : '')} />
                            </td>
                            <td>
                              <input
                                className={fieldClass('table-input', `coAuthor_${index}_email`)}
                                type="email"
                                value={author.email}
                                onChange={(e) => updateCoAuthor(index, 'email', e.target.value)}
                                onBlur={() => markTouched(`coAuthor_${index}_email`)}
                                placeholder="email@institution.edu"
                              />
                              <FieldError message={showError(`coAuthor_${index}_email`) ? errors[`coAuthor_${index}_email`] : ''} />
                            </td>
                            <td>
                              <input className="table-input" value={author.institution} onChange={(e) => updateCoAuthor(index, 'institution', e.target.value)} placeholder="Institution" />
                            </td>
                            <td className="row-actions">
                              <button type="button" className="icon-btn danger" aria-label="Remove co-author" onClick={() => setCoAuthors((prev) => prev.filter((_, i) => i !== index))}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
            )}

            {step === 2 && (
            <section className="form-section">
              <div className="form-section-header">
                <span className="form-section-num">III</span>
                <div>
                  <h3>Deposit manuscript <span className="required-mark">*</span></h3>
                  <p>Archive the complete paper you want assessed. One file per submission.</p>
                </div>
              </div>
              <div className="form-section-body" data-field="file">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="manuscript-file-input"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  multiple={false}
                  onChange={handleFileInputChange}
                />

                {!file ? (
                  <div
                    className={`upload-dropzone ${dragging ? 'dragging' : ''} ${showError('file') ? 'is-invalid' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleFileDrop}
                  >
                    <CloudUpload size={32} />
                    <h4>Drag and drop your manuscript here</h4>
                    <p>One document only · PDF, DOC, or DOCX</p>
                    <span className="btn btn-secondary" style={{ pointerEvents: 'none' }}>Choose File</span>
                    <div className="upload-meta">
                      <span>Accepted formats: PDF, DOC, DOCX</span>
                      <span>Max {MAX_FILE_MB} MB · 10–300 pages</span>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`manuscript-card ${uploadPhase} ${dragging ? 'dragging' : ''} ${showError('file') ? 'is-invalid' : ''}`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleFileDrop}
                  >
                    {dragging && (
                      <div className="manuscript-replace-hint">Drop to replace this manuscript</div>
                    )}
                    <div className="manuscript-card-head">
                      <div
                        className={`manuscript-ring ${uploadPhase === 'reading' ? 'is-reading' : 'is-ready'}`}
                        style={{ '--pct': uploadProgress }}
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={uploadProgress}
                        aria-label="Manuscript upload progress"
                      >
                        {uploadPhase === 'reading' && <span className="manuscript-ring-spin" aria-hidden="true" />}
                        <span className="manuscript-ring-inner">
                          {uploadPhase === 'ready' ? <Check size={22} strokeWidth={2.6} /> : <FileText size={18} />}
                        </span>
                      </div>
                      <div className="manuscript-meta">
                        <h4 title={file.name}>{file.name}</h4>
                        <p>
                          {formatBytes(file.size)} · {fileKind(file.name)} · {uploadPhase === 'ready' ? 'Ready for assessment' : 'Preparing manuscript'}
                        </p>
                      </div>
                      <div className={`manuscript-pct ${uploadPhase === 'ready' ? 'is-complete' : ''}`}>
                        <span>{uploadProgress}</span>
                        <small>%</small>
                      </div>
                    </div>
                    <div className="manuscript-bar-track">
                      <div
                        className={`manuscript-bar-fill ${uploadPhase === 'ready' ? 'is-complete' : ''}`}
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <div className="manuscript-card-foot">
                      <span>
                        {uploadPhase === 'ready'
                          ? 'Only one manuscript per submission. Replace to change the file.'
                          : `Uploading… ${uploadProgress}%`}
                      </span>
                      <div className="manuscript-actions">
                        <button
                          type="button"
                          className="text-action danger"
                          onClick={clearFile}
                          disabled={uploadPhase === 'reading'}
                        >
                          Remove
                        </button>
                        <button
                          type="button"
                          className="text-action"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Replace
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <FieldError message={showError('file') ? errors.file : ''} />
              </div>
            </section>
            )}

            {step === 3 && (
            <section className="pricing-page" data-field="package">
              <div className="pricing-hero">
                <p className="pricing-kicker">Stage IV · Assessment</p>
                <h3>Choose your assessment</h3>
                <p>GST-inclusive services for conference, journal, and thesis submissions.</p>
              </div>
              <div className="pricing-grid">
                {PACKAGE_DEFS.map((pkg) => {
                  const pkgQuote = packageQuote(pricingConfig, pkg.id);
                  const selected = selectedPackage === pkg.id;
                  return (
                    <label
                      key={pkg.id}
                      className={`pricing-card ${selected ? 'selected' : ''} ${pkg.popular ? 'popular' : ''}`}
                    >
                      <input type="radio" name="package" checked={selected} onChange={() => setSelectedPackage(pkg.id)} />
                      {pkg.popular && <span className="pricing-badge">Most Popular</span>}
                      <span className="pricing-plan">{pkg.kicker}</span>
                      <h4>{pkg.name}</h4>
                      <div className="pricing-amount">
                        <strong>₹{pkgQuote.price}</strong>
                        <span>GST included</span>
                      </div>
                      <ul>
                        {pkg.features.map((feature) => (
                          <li key={feature}><Check size={15} strokeWidth={2.5} /> {feature}</li>
                        ))}
                      </ul>
                      <span className={`pricing-select ${selected ? 'is-on' : ''}`}>
                        {selected ? 'Selected' : 'Select this plan'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
            )}

            {step === 4 && (
            <section className="form-section">
              <div className="form-section-header">
                <span className="form-section-num">V</span>
                <div>
                  <h3>Certification</h3>
                  <p>Confirm the record, accept the declarations, and proceed to payment.</p>
                </div>
              </div>
              <div className="form-section-body">
                <dl className="review-list">
                  <div className="review-row">
                    <div>
                      <dt>Paper</dt>
                      <dd>
                        <strong>{paperTitle.trim() || '—'}</strong>
                        <span>{[paperType, subjectArea, purpose].filter(Boolean).join(' · ') || '—'}</span>
                        {keywords.length > 0 && <span>{keywords.join(', ')}</span>}
                      </dd>
                    </div>
                    <button type="button" className="review-edit" onClick={() => goToStep(0)}>Edit</button>
                  </div>
                  <div className="review-row">
                    <div>
                      <dt>Author</dt>
                      <dd>
                        <strong>{authorName.trim() || '—'}</strong>
                        <span>{[authorEmail, authorInstitution, authorCountry].filter(Boolean).join(' · ') || '—'}</span>
                        {coAuthors.some((item) => item.name.trim()) && (
                          <span>{coAuthors.filter((item) => item.name.trim()).length} co-author(s)</span>
                        )}
                      </dd>
                    </div>
                    <button type="button" className="review-edit" onClick={() => goToStep(1)}>Edit</button>
                  </div>
                  <div className="review-row">
                    <div>
                      <dt>Manuscript</dt>
                      <dd>
                        <strong>{file?.name || 'No file uploaded'}</strong>
                        {file && <span>{formatBytes(file.size)}</span>}
                      </dd>
                    </div>
                    <button type="button" className="review-edit" onClick={() => goToStep(2)}>Edit</button>
                  </div>
                  <div className="review-row">
                    <div>
                      <dt>Package</dt>
                      <dd>
                        <strong>{PACKAGE_DEFS.find((pkg) => pkg.id === selectedPackage)?.name}</strong>
                        <span>₹{quote.price} · GST included</span>
                      </dd>
                    </div>
                    <button type="button" className="review-edit" onClick={() => goToStep(3)}>Edit</button>
                  </div>
                </dl>

                <div
                  id="declaration-card"
                  className={`review-declarations ${attempted && !declarationsOk ? 'needs-consent' : ''}`}
                >
                  <h4>Declaration <span className="required-mark">*</span></h4>
                  <p className="consent-required-note">All three declarations are required to proceed to payment.</p>
                  <div className="consent-list">
                    <label className={`consent-item ${showError('consentAuthor') ? 'is-invalid' : ''}`} data-field="consentAuthor">
                      <input
                        type="checkbox"
                        checked={consentAuthor}
                        onChange={(e) => {
                          setConsentAuthor(e.target.checked);
                          markTouched('consentAuthor');
                        }}
                      />
                      <span>I confirm that I am the author/co-author or have authorization to submit this manuscript.</span>
                    </label>
                    {showError('consentAuthor') && <FieldError message={errors.consentAuthor} />}
                    <label className={`consent-item ${showError('consentAnalytical') ? 'is-invalid' : ''}`} data-field="consentAnalytical">
                      <input
                        type="checkbox"
                        checked={consentAnalytical}
                        onChange={(e) => {
                          setConsentAnalytical(e.target.checked);
                          markTouched('consentAnalytical');
                        }}
                      />
                      <span>I understand that the similarity report is an analytical report and does not by itself determine whether plagiarism has occurred.</span>
                    </label>
                    {showError('consentAnalytical') && <FieldError message={errors.consentAnalytical} />}
                    <label className={`consent-item ${showError('consentTerms') ? 'is-invalid' : ''}`} data-field="consentTerms">
                      <input
                        type="checkbox"
                        checked={consentTerms}
                        onChange={(e) => {
                          setConsentTerms(e.target.checked);
                          markTouched('consentTerms');
                        }}
                      />
                      <span>I agree to Innolift&apos;s terms and privacy policy.</span>
                    </label>
                    {showError('consentTerms') && <FieldError message={errors.consentTerms} />}
                  </div>
                </div>
              </div>
            </section>
            )}
          </div>
        </div>
      </div>

      <div className="checkout-bar">
        {isLastStep ? (
          <div className="coupon-box">
            <label>Have a coupon code?</label>
            <div className="coupon-row">
              <input className="form-control" value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Enter code" />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCouponMessage(coupon.trim() ? 'This coupon code is not valid.' : 'Enter a coupon code to apply.')}
              >
                Apply
              </button>
            </div>
            {couponMessage && <span className="coupon-msg">{couponMessage}</span>}
          </div>
        ) : (
          <div className="step-progress-copy">
            <span>Stage {STEPS[step].roman} of V</span>
            <strong>{STEPS[step].label}</strong>
            <p>
              {step === 3
                ? `${PACKAGE_DEFS.find((pkg) => pkg.id === selectedPackage)?.name} · ₹${quote.price}`
                : STEPS[step + 1] ? `Next: ${STEPS[step + 1].label}` : ''}
            </p>
          </div>
        )}
        <div className="checkout-actions">
          {isLastStep && (
            <div className="checkout-total">
              <span>Total Amount (incl. of GST)</span>
              <strong>₹{quote.price.toFixed(2)}</strong>
            </div>
          )}
          <div className="step-nav">
            {step > 0 && (
              <button type="button" className="btn btn-secondary" onClick={() => goToStep(step - 1)}>
                <ArrowLeft size={16} />
                Back
              </button>
            )}
            {isLastStep ? (
              <button
                type={paymentLocked ? 'button' : 'submit'}
                className={`btn btn-primary checkout-btn ${paymentLocked ? 'is-locked' : ''}`}
                disabled={submitting}
                aria-disabled={paymentLocked}
                onClick={() => {
                  if (paymentLocked) {
                    setAttempted(true);
                    setError('Accept all declarations to unlock payment.');
                    document.getElementById('declaration-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
              >
                {submitting ? (
                  <span className="spinner" style={{ width: 16, height: 16 }} />
                ) : (
                  <Lock size={16} />
                )}
                {submitting ? 'Creating checkout...' : 'Proceed to Payment'}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary checkout-btn"
                onClick={goNext}
                disabled={step === 2 && uploadPhase === 'reading'}
              >
                {step === 2 && uploadPhase === 'reading' ? `Uploading ${uploadProgress}%` : 'Continue'}
                {!(step === 2 && uploadPhase === 'reading') && <ArrowRight size={16} />}
              </button>
            )}
          </div>
          {isLastStep && (
            paymentLocked ? (
              <p className="checkout-lock-hint">Accept all declarations to unlock payment.</p>
            ) : (
              <p>You will be redirected to our secure payment gateway.</p>
            )
          )}
        </div>
      </div>
    </form>
  );
}
