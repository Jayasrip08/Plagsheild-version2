import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  FileCheck2,
  Zap,
  Lock,
  Award,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
  Clock,
  UserCheck,
  ChevronDown,
  CreditCard,
  Globe2,
  X
} from 'lucide-react';
import heroTeamImage from './images/hero-team.jpg';
import reportReviewImage from './images/report-review.jpg';
import securityReviewImage from './images/img.jpg';
import logoImage from './images/nc.png';

const COMPARISON_ROWS = [
  { feature: 'Direct individual access', free: true, turnitin: false, novelcheckr: true },
  { feature: 'Transparent, pay-per-check pricing', free: true, turnitin: false, novelcheckr: true },
  { feature: 'Deep database (journals, books, web)', free: false, turnitin: true, novelcheckr: true },
  { feature: 'AI-generated content detection', free: false, turnitin: false, novelcheckr: true },
  { feature: 'Document never added to a public repository', free: false, turnitin: false, novelcheckr: true },
  { feature: 'Digitally signed PDF certificate', free: false, turnitin: true, novelcheckr: true },
  { feature: 'Delivery under 15 minutes (express)', free: true, turnitin: false, novelcheckr: true },
];

const PROMO_STORAGE_KEY = 'nc_landing_promo';
const PROMO_DAILY_LIMIT = 2;

function localDateKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function readPromoRecord() {
  try {
    const raw = window.localStorage.getItem(PROMO_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (!data || data.date !== localDateKey()) {
      return { date: localDateKey(), count: 0 };
    }
    return { date: data.date, count: Number(data.count) || 0 };
  } catch {
    return { date: localDateKey(), count: 0 };
  }
}

function writePromoRecord(record) {
  try {
    window.localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* ignore quota / private mode */
  }
}

const FAQ_ITEMS = [
  {
    q: 'What is NovelCheckr?',
    a: 'NovelCheckr is an online plagiarism checker and academic integrity platform that provides Turnitin-grade similarity scanning, AI content detection, and instant downloadable PDF reports for students, researchers, and colleges in India and worldwide.'
  },
  {
    q: 'Is NovelCheckr accurate compared to Turnitin?',
    a: 'Yes. NovelCheckr uses licensed similarity-detection engines that cross-match your document against billions of web pages, journals, books, and repository publications, delivering Turnitin-grade accuracy with a 99.8% scan accuracy rate.'
  },
  {
    q: 'How much does a plagiarism check cost in India?',
    a: 'NovelCheckr plagiarism checks start at ₹99 per document, GST inclusive, with an express ₹299 plan and a complete ₹549 research paper package that includes citation and editing review.'
  },
  {
    q: 'Is my document kept private and confidential?',
    a: 'Yes. NovelCheckr never adds your document to a public or shared repository database. Every check is encrypted end-to-end, and download links expire automatically after 48 hours.'
  },
  {
    q: 'Can I use NovelCheckr for UGC, journal, or thesis submission?',
    a: 'Yes. NovelCheckr generates a digitally signed PDF similarity certificate accepted for thesis submission, journal peer review, and UGC or institutional academic integrity requirements.'
  },
  {
    q: 'Does NovelCheckr detect AI-generated content?',
    a: "Yes. In addition to similarity scanning, NovelCheckr's Similarity Improvement and Research Paper packages include AI content and paraphrase detection insights."
  },
  {
    q: 'How long does it take to get my plagiarism report?',
    a: 'Standard reports are delivered through the queue within minutes, and Priority Express orders are typically delivered in under 15 minutes.'
  }
];

export default function LandingPage({ onNavigateToAuth }) {
  const [openFaq, setOpenFaq] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [reportLive, setReportLive] = useState(false);
  const [scoreDisplay, setScoreDisplay] = useState(14);
  const [showPromo, setShowPromo] = useState(false);
  const reportStageRef = useRef(null);

  const handleNavClick = (tab = 'login') => {
    if (onNavigateToAuth) {
      onNavigateToAuth(tab);
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const record = readPromoRecord();
    if (record.count >= PROMO_DAILY_LIMIT) return undefined;

    const timer = window.setTimeout(() => {
      writePromoRecord({ date: localDateKey(), count: record.count + 1 });
      setShowPromo(true);
    }, 1100);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showPromo) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event) => {
      if (event.key === 'Escape') setShowPromo(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [showPromo]);

  const closePromo = () => setShowPromo(false);

  const openPromoCta = (tab) => {
    closePromo();
    handleNavClick(tab);
  };

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      setShowBackToTop(window.scrollY > 700);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('.reveal'));
    nodes.forEach((el) => el.classList.add('reveal-pending'));

    if (typeof IntersectionObserver === 'undefined') {
      nodes.forEach((el) => el.classList.add('reveal-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: '120px 0px' }
    );
    nodes.forEach((el) => observer.observe(el));

    const failsafe = window.setTimeout(() => {
      nodes.forEach((el) => el.classList.add('reveal-visible'));
    }, 700);

    return () => {
      window.clearTimeout(failsafe);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const stage = reportStageRef.current;
    if (!stage) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setReportLive(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(stage);

    if (reduceMotion || coarsePointer) {
      return () => io.disconnect();
    }

    const onMove = (event) => {
      const rect = stage.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      stage.style.setProperty('--tilt-x', `${(-y * 11).toFixed(2)}deg`);
      stage.style.setProperty('--tilt-y', `${(x * 16).toFixed(2)}deg`);
      stage.style.setProperty('--glare-x', `${50 + x * 46}%`);
      stage.style.setProperty('--glare-y', `${32 + y * 40}%`);
      stage.classList.add('is-tilting');
    };
    const onLeave = () => {
      stage.style.setProperty('--tilt-x', '7deg');
      stage.style.setProperty('--tilt-y', '-9deg');
      stage.classList.remove('is-tilting');
    };

    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerleave', onLeave);
    return () => {
      io.disconnect();
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  useEffect(() => {
    if (!reportLive) return undefined;
    let value = 0;
    setScoreDisplay(0);
    const timer = window.setInterval(() => {
      value += 1;
      setScoreDisplay(value);
      if (value >= 14) window.clearInterval(timer);
    }, 50);
    return () => window.clearInterval(timer);
  }, [reportLive]);

  return (
    <div className="landing-page">
      {/* Top Navbar */}
      <header className={`landing-navbar${scrolled ? ' landing-navbar-scrolled' : ''}`}>
        <div className="landing-nav-container container">
          <div className="landing-brand">
            <img src={logoImage} alt="NovelCheckr" className="brand-logo-img" />
            <span className="brand-name">NovelCheckr</span>
          </div>

          <nav className="landing-nav-links">
            <button type="button" onClick={() => scrollToSection('features')} className="nav-item">Features</button>
            <button type="button" onClick={() => scrollToSection('how-it-works')} className="nav-item">How It Works</button>
            <button type="button" onClick={() => scrollToSection('sample-report')} className="nav-item">Sample Report</button>
            <button type="button" onClick={() => scrollToSection('pricing')} className="nav-item">Pricing</button>
            <button type="button" onClick={() => scrollToSection('security')} className="nav-item">Security</button>
            <button type="button" onClick={() => scrollToSection('faq')} className="nav-item">FAQ</button>
          </nav>

          <div className="landing-nav-actions">
            <button type="button" className="btn btn-secondary nav-btn" onClick={() => handleNavClick('login')}>
              Sign In
            </button>
            <button type="button" className="btn btn-primary nav-btn-cta" onClick={() => handleNavClick('register')}>
              Register Free
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero-light">
        <div className="container landing-hero-content">
          <div className="hero-columns">
            <div className="hero-text-col">
              <div className="hero-badge reveal">
                <Sparkles size={14} className="badge-ico" />
                <span>India's Trusted Plagiarism Checker &mdash; Now Serving Researchers Worldwide</span>
              </div>

              <h1 className="hero-title reveal">
                Online Plagiarism Checker & AI Content Detector for Students and Researchers
              </h1>

              <p className="hero-subtitle reveal">
                NovelCheckr delivers Turnitin-grade similarity scanning, instant PDF audit reports, and AI content detection for theses, research papers, and journal submissions &mdash; trusted by students, researchers, and colleges across India, now available worldwide.
              </p>

              <div className="hero-actions reveal">
                <button type="button" className="btn-hero-primary" onClick={() => handleNavClick('register')}>
                  <span>Check Your Document Now</span>
                  <ArrowRight size={18} />
                </button>
                <button type="button" className="btn-hero-secondary-light" onClick={() => scrollToSection('pricing')}>
                  View Pricing Packages
                </button>
              </div>
            </div>

            <div className="hero-visual-col reveal">
              <div className="hero-mockup">
                <div className="report-mock-card hero-mockup-card">
                  <div className="report-mock-header">
                    <span className="report-mock-brand">NOVELCHECKR</span>
                    <span className="report-mock-tag">LIVE REPORT</span>
                  </div>
                  <div className="report-mock-body">
                    <div className="report-mock-gauge">
                      <div className="gauge-ring">
                        <span className="gauge-value">8%</span>
                      </div>
                      <span className="gauge-label">Similarity Index</span>
                    </div>
                    <div className="report-mock-details">
                      <div className="report-mock-row">
                        <span>Word Count</span>
                        <strong>4,850</strong>
                      </div>
                      <div className="report-mock-row">
                        <span>Matched Sources</span>
                        <strong>3</strong>
                      </div>
                      <div className="report-mock-row">
                        <span>AI Content</span>
                        <strong>Not Detected</strong>
                      </div>
                    </div>
                  </div>
                  <div className="report-mock-footer">
                    <ShieldCheck size={14} />
                    <span>Digitally Signed &amp; Verified</span>
                  </div>
                </div>

                <div className="hero-float-pill hero-float-pill-1">
                  <Zap size={14} />
                  <span>&lt; 15 min Delivery</span>
                </div>
                <div className="hero-float-pill hero-float-pill-2">
                  <Lock size={14} />
                  <span>100% Confidential</span>
                </div>
                <div className="hero-float-pill hero-float-pill-3">
                  <Award size={14} />
                  <span>UGC Ready Certificate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="landing-section tinted-section tint-orange">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-kicker">Numbers That Reflect Our Accuracy</span>
            <h2 className="section-title">Trusted for Thousands of Academic Submissions</h2>
          </div>
          <div className="stats-grid">
            <div className="stat-card reveal">
              <div className="stat-num">99.8%</div>
              <div className="stat-label">Scan Accuracy</div>
            </div>
            <div className="stat-card reveal">
              <div className="stat-num">&lt; 15m</div>
              <div className="stat-label">Average Delivery</div>
            </div>
            <div className="stat-card reveal">
              <div className="stat-num">50,000+</div>
              <div className="stat-label">Papers Checked</div>
            </div>
            <div className="stat-card reveal">
              <div className="stat-num">100%</div>
              <div className="stat-label">Data Privacy Shield</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security Strip */}
      <div className="trust-strip">
        <div className="container trust-strip-inner">
          <div className="trust-item">
            <Lock size={16} />
            <span>256-bit SSL Encrypted</span>
          </div>
          <div className="trust-item">
            <CreditCard size={16} />
            <span>Payments Secured by Razorpay</span>
          </div>
          <div className="trust-item">
            <FileCheck2 size={16} />
            <span>GST Compliant Invoicing</span>
          </div>
          <div className="trust-item">
            <Globe2 size={16} />
            <span>Serving India & Worldwide</span>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <section id="features" className="landing-section tinted-section tint-blue">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-kicker">Engineered For Excellence</span>
            <h2 className="section-title">Comprehensive Verification Tools</h2>
            <p className="section-desc">
              Everything you need to ensure original research content and meet institutional publication standards.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card reveal">
              <div className="feature-icon">
                <FileCheck2 size={24} />
              </div>
              <h3>Turnitin-Licensed Scanning</h3>
              <p>Deep manuscript database cross-matching across billions of web pages, journals, books, and repository publications.</p>
            </div>

            <div className="feature-card reveal">
              <div className="feature-icon">
                <Zap size={24} />
              </div>
              <h3>Express Report Delivery</h3>
              <p>Automated priority queue processing delivers downloadable PDF reports directly to your account in minutes.</p>
            </div>

            <div className="feature-card reveal">
              <div className="feature-icon">
                <Lock size={24} />
              </div>
              <h3>Zero Repository Storage</h3>
              <p>Your document is never added to public databases. 100% confidential check guarantees your copyright safety.</p>
            </div>

            <div className="feature-card reveal">
              <div className="feature-icon">
                <Award size={24} />
              </div>
              <h3>Digital Signed Certificates</h3>
              <p>Official verified PDF summary certificates ready for thesis submission, journal reviewers, and academic advisors.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="landing-section tinted-section tint-orange">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-kicker">Simple 3-Step Process</span>
            <h2 className="section-title">How NovelCheckr Works</h2>
            <p className="section-desc">Upload your manuscript and receive verified similarity results in three straightforward steps.</p>
          </div>

          <div className="how-it-works-grid">
            <div className="how-it-works-image reveal">
              <img
                src={heroTeamImage}
                alt="NovelCheckr team reviewing a document analysis workflow"
                loading="lazy"
              />
            </div>

            <div className="steps-list">
              <div className="step-card reveal">
                <div className="step-number">01</div>
                <h3>Upload Manuscript</h3>
                <p>Upload your research paper, thesis, or essay in DOCX, PDF, or TXT format with your author details.</p>
              </div>

              <div className="step-card reveal">
                <div className="step-number">02</div>
                <h3>Automated Analysis</h3>
                <p>Our licensed intelligence engines analyze word structures, cross-match sources, and generate similarity scores.</p>
              </div>

              <div className="step-card reveal">
                <div className="step-number">03</div>
                <h3>Download PDF Audit</h3>
                <p>Receive an encrypted link to download your detailed similarity report with highlighted matches and source breakdowns.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Report Preview */}
      <section id="sample-report" className="landing-section">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-kicker">See Before You Buy</span>
            <h2 className="section-title">A Real Similarity Report — Not a Marketing Card</h2>
            <p className="section-desc">
              Scroll the sample below. This is the same layout you download after a paid check: overall index,
              source-by-source matches, highlighted passages, and a digitally signed footer.
            </p>
          </div>

          <div
            className={`sample-report-stage reveal${reportLive ? ' is-live' : ''}`}
            ref={reportStageRef}
          >
            <div className="sample-report-scene">
              <div className="sample-report-layer layer-back" aria-hidden="true" />
              <div className="sample-report-layer layer-mid" aria-hidden="true" />
              <article
                className="sample-report-paper"
                aria-label="Sample NovelCheckr similarity report"
              >
              <div className="sample-report-watermark" aria-hidden="true">SAMPLE</div>
              <header className="sample-report-bar">
                <div>
                  <strong>NOVELCHECKR</strong>
                  <span>Academic integrity · Similarity audit</span>
                </div>
                <div className="sample-report-bar-meta">
                  <em>Sample report</em>
                  <span>NC-SAMPLE-88421</span>
                  <span>18 March 2026, 14:32 IST</span>
                </div>
              </header>

              <h3 className="sample-report-doc-title">Originality / Similarity Report</h3>
              <p className="sample-report-doc-lead">
                Fictional manuscript used only to show the live report format. Names and scores are illustrative.
              </p>

              <dl className="sample-report-meta">
                <div>
                  <dt>Document title</dt>
                  <dd>Rainwater Harvesting Efficiency in Semi-Arid Rajasthan</dd>
                </div>
                <div>
                  <dt>Corresponding author</dt>
                  <dd>Ananya Sharma (sample)</dd>
                </div>
                <div>
                  <dt>File</dt>
                  <dd>rainwater-harvesting-study.docx</dd>
                </div>
                <div>
                  <dt>Word count</dt>
                  <dd>4,218 words · 12 pages</dd>
                </div>
                <div>
                  <dt>Package</dt>
                  <dd>Complete Research Package</dd>
                </div>
                <div>
                  <dt>AI-generated content</dt>
                  <dd>Not detected</dd>
                </div>
              </dl>

              <div className="sample-report-score-row">
                <div className="sample-report-score">
                  <div
                    className="sample-report-gauge"
                    style={{ '--score': `${scoreDisplay}%` }}
                  >
                    <div className="sample-report-gauge-inner">
                      <strong>{scoreDisplay}%</strong>
                    </div>
                  </div>
                  <span>Overall similarity index</span>
                </div>
                <ul className="sample-report-breakdown">
                  <li><span>Internet sources</span><b>11%</b></li>
                  <li><span>Publications</span><b>8%</b></li>
                  <li><span>Student papers</span><b>2%</b></li>
                  <li><span>Matched sources</span><b>4 listed</b></li>
                </ul>
              </div>

              <h4>Matched sources</h4>
              <table className="sample-report-sources">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>%</th>
                    <th>Source</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="src-1">
                    <td>1</td>
                    <td>6.2%</td>
                    <td>
                      <b>SpringerLink — Assessment of rooftop rainwater harvesting in semi-arid India</b>
                      <small>link.springer.com · Journal of Water Resources</small>
                    </td>
                    <td>Publication</td>
                  </tr>
                  <tr className="src-2">
                    <td>2</td>
                    <td>4.1%</td>
                    <td>
                      <b>ScienceDirect — Agricultural Water Management, Vol. 248</b>
                      <small>sciencedirect.com · peer-reviewed journal</small>
                    </td>
                    <td>Publication</td>
                  </tr>
                  <tr className="src-3">
                    <td>3</td>
                    <td>2.8%</td>
                    <td>
                      <b>Wikipedia — Rainwater harvesting</b>
                      <small>en.wikipedia.org/wiki/Rainwater_harvesting</small>
                    </td>
                    <td>Internet</td>
                  </tr>
                  <tr>
                    <td>4</td>
                    <td>0.9%</td>
                    <td>
                      <b>Other web sources (3 minor matches under 1% each)</b>
                      <small>institutional pages and news summaries</small>
                    </td>
                    <td>Internet</td>
                  </tr>
                </tbody>
              </table>

              <h4>Highlighted matches from the manuscript</h4>
              <figure className="sample-excerpt mark-1">
                <figcaption>Source 1 · 6.2%</figcaption>
                <p>“Rainwater harvesting is the collection and storage of rain from rooftops and catchment surfaces for later domestic or agricultural use.”</p>
              </figure>
              <figure className="sample-excerpt mark-2">
                <figcaption>Source 2 · 4.1%</figcaption>
                <p>“In semi-arid districts of Rajasthan, mean annual rainfall typically ranges between 300 and 550 mm, with high inter-annual variability.”</p>
              </figure>
              <figure className="sample-excerpt mark-3">
                <figcaption>Source 3 · 2.8%</figcaption>
                <p>“A typical system comprises a catchment surface, conveyance, first-flush diverter, storage tank, and a simple filtration unit.”</p>
              </figure>

              <p className="sample-report-note">
                A 14% raw index is generally treated as low once quotations and the reference list are considered.
                Institutions set their own thresholds. This report documents overlap — it does not accept or reject a paper.
              </p>

              <footer className="sample-report-signed">
                <ShieldCheck size={16} />
                <div>
                  <strong>Digitally signed and verified</strong>
                  <span>Hash 7f3a9c21e · NovelCheckr Academic Integrity Platform</span>
                </div>
              </footer>
            </article>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="landing-section tinted-section tint-blue">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-kicker">Why NovelCheckr</span>
            <h2 className="section-title">NovelCheckr vs. Free Checkers vs. Turnitin</h2>
            <p className="section-desc">
              A transparent, individually accessible alternative for students and researchers who don't have
              institutional Turnitin access.
            </p>
          </div>

          <div className="compare-table-wrap reveal">
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Free Online Checkers</th>
                  <th>Turnitin</th>
                  <th className="compare-highlight-col">NovelCheckr</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature}>
                    <td>{row.feature}</td>
                    <td>{row.free ? <CheckCircle2 size={18} className="compare-yes" /> : <XCircle size={18} className="compare-no" />}</td>
                    <td>{row.turnitin ? <CheckCircle2 size={18} className="compare-yes" /> : <XCircle size={18} className="compare-no" />}</td>
                    <td className="compare-highlight-col">{row.novelcheckr ? <CheckCircle2 size={18} className="compare-yes" /> : <XCircle size={18} className="compare-no" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="compare-footnote">
            Turnitin is typically available only through an institution's existing license. Free checkers
            often use shallow databases and may not guarantee document confidentiality.
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="landing-section">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-kicker">Transparent Pricing</span>
            <h2 className="section-title">Simple, All-Inclusive Packages</h2>
            <p className="section-desc">No hidden subscriptions. Pay only for what you check with GST-inclusive pricing.</p>
          </div>

          <div className="landing-pricing-grid">
            {/* Package 1 */}
            <div className="landing-price-card reveal">
              <div className="price-kicker">CHECK</div>
              <h3 className="price-name">Similarity Check</h3>
              <div className="price-val">₹99 <span className="price-period">/ check</span></div>
              <p className="price-sub">Includes GST & Instant Download</p>
              
              <ul className="price-features">
                <li><CheckCircle2 size={16} /> Licensed Similarity Analysis</li>
                <li><CheckCircle2 size={16} /> Detailed PDF Audit Report</li>
                <li><CheckCircle2 size={16} /> Standard Queue Delivery</li>
                <li><CheckCircle2 size={16} /> 48-Hour Secure Link Access</li>
              </ul>

              <button type="button" className="btn-price-action" onClick={() => handleNavClick('register')}>
                Choose Check Plan
              </button>
            </div>

            {/* Package 2 */}
            <div className="landing-price-card price-popular reveal">
              <div className="popular-badge">MOST POPULAR</div>
              <div className="price-kicker">IMPROVE</div>
              <h3 className="price-name">Similarity Improvement</h3>
              <div className="price-val">₹299 <span className="price-period">/ check</span></div>
              <p className="price-sub">Includes GST & Express Delivery</p>
              
              <ul className="price-features">
                <li><CheckCircle2 size={16} /> Everything in Check plan</li>
                <li><CheckCircle2 size={16} /> Priority Express Queue (&lt; 15 mins)</li>
                <li><CheckCircle2 size={16} /> AI Content & Paraphrase Insights</li>
                <li><CheckCircle2 size={16} /> Email & WhatsApp Report Dispatch</li>
              </ul>

              <button type="button" className="btn-price-action btn-price-popular" onClick={() => handleNavClick('register')}>
                Choose Improve Plan
              </button>
            </div>

            {/* Package 3 */}
            <div className="landing-price-card reveal">
              <div className="price-kicker">COMPLETE</div>
              <h3 className="price-name">Research Paper Package</h3>
              <div className="price-val">₹549 <span className="price-period">/ check</span></div>
              <p className="price-sub">Includes GST & Editing Suggestions</p>
              
              <ul className="price-features">
                <li><CheckCircle2 size={16} /> Everything in Improve plan</li>
                <li><CheckCircle2 size={16} /> Line-by-Line Editing Suggestions</li>
                <li><CheckCircle2 size={16} /> Citation & Reference Audit</li>
                <li><CheckCircle2 size={16} /> Dedicated Customer Support</li>
              </ul>

              <button type="button" className="btn-price-action" onClick={() => handleNavClick('register')}>
                Choose Complete Plan
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Upgrade Plans Spotlight */}
      <section className="landing-section tinted-section tint-orange">
        <div className="container">
          <div className="upgrade-grid">
            <div className="upgrade-image reveal">
              <img
                src={reportReviewImage}
                alt="NovelCheckr review team analyzing a similarity and editing report"
                loading="lazy"
              />
            </div>

            <div className="upgrade-copy reveal">
              <span className="section-kicker">Beyond the Basic Check</span>
              <h2 className="section-title">Get More Than a Score &mdash; Get Actionable Insights</h2>
              <p className="section-desc">
                For work headed to a journal, thesis committee, or UGC review, our two upgraded plans go
                further than a plain similarity number.
              </p>

              <div className="upgrade-block">
                <div className="upgrade-block-head">
                  <Zap size={18} />
                  <h3>Similarity Improvement &mdash; &#8377;299</h3>
                </div>
                <ul>
                  <li><CheckCircle2 size={15} /> AI content &amp; paraphrase detection insights</li>
                  <li><CheckCircle2 size={15} /> Priority express delivery, under 15 minutes</li>
                  <li><CheckCircle2 size={15} /> Report dispatch by email &amp; WhatsApp</li>
                </ul>
              </div>

              <div className="upgrade-block">
                <div className="upgrade-block-head">
                  <Award size={18} />
                  <h3>Research Paper Package &mdash; &#8377;549</h3>
                </div>
                <ul>
                  <li><CheckCircle2 size={15} /> Everything in Similarity Improvement</li>
                  <li><CheckCircle2 size={15} /> Line-by-line editing suggestions</li>
                  <li><CheckCircle2 size={15} /> Citation &amp; reference audit, plus dedicated support</li>
                </ul>
              </div>

              <button type="button" className="btn-hero-secondary upgrade-cta" onClick={() => scrollToSection('pricing')}>
                Compare All Plans
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Confidentiality */}
      <section id="security" className="landing-security">
        <div className="container security-grid">
          <div className="security-content reveal">
            <div className="security-badge">
              <ShieldCheck size={20} />
              <span>100% Confidentiality Guarantee</span>
            </div>
            <h2>Your Research Paper Remains 100% Private</h2>
            <p>
              Unlike standard free plagiarism checkers, NovelCheckr ensures your submitted papers are never added to repository databases or shared with third parties. Your research stays completely your property.
            </p>
            <div className="security-checks">
              <span><CheckCircle2 size={16} color="#16a34a" /> End-to-End SSL Encryption</span>
              <span><CheckCircle2 size={16} color="#16a34a" /> Auto Expiring Secure Links</span>
              <span><CheckCircle2 size={16} color="#16a34a" /> GST Verified Tax Compliance</span>
            </div>
          </div>

          <div className="security-visual reveal">
            <img
              src={securityReviewImage}
              alt="Researchers reviewing a confidential analysis report together"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="landing-section">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-kicker">Frequently Asked Questions</span>
            <h2 className="section-title">Everything You Need to Know About NovelCheckr</h2>
            <p className="section-desc">
              Answers to common questions about plagiarism checking, pricing, and privacy in India and worldwide.
            </p>
          </div>

          <div className="faq-list">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={item.q} className={`faq-item${isOpen ? ' faq-item-open' : ''}`}>
                  <button
                    type="button"
                    className="faq-question"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                  >
                    <span>{item.q}</span>
                    <ChevronDown size={18} className="faq-chevron" />
                  </button>
                  {isOpen && <p className="faq-answer">{item.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="landing-cta-banner">
        <div className="container cta-container">
          <h2>Ready to Verify Your Research Paper?</h2>
          <p>Join thousands of researchers and students in India and worldwide using NovelCheckr for trusted, fast similarity reports.</p>
          <div className="cta-buttons">
            <button type="button" className="btn-hero-primary" onClick={() => handleNavClick('register')}>
              <span>Get Started Now</span>
              <ArrowRight size={18} />
            </button>
            <button type="button" className="btn-hero-secondary" onClick={() => handleNavClick('login')}>
              Sign In to Your Account
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container footer-container">
          <div className="footer-brand">
            <div className="landing-brand">
              <img src={logoImage} alt="NovelCheckr" className="brand-logo-img" />
              <span className="brand-name">NovelCheckr</span>
            </div>
            <p className="footer-tagline">Academic Integrity & Verification Intelligence Platform, serving India and worldwide.</p>
          </div>

          <div className="footer-links">
            <div className="footer-col">
              <h4>Platform</h4>
              <button type="button" onClick={() => scrollToSection('features')}>Features</button>
              <button type="button" onClick={() => scrollToSection('pricing')}>Pricing</button>
              <button type="button" onClick={() => scrollToSection('how-it-works')}>How It Works</button>
              <button type="button" onClick={() => scrollToSection('sample-report')}>Sample Report</button>
              <button type="button" onClick={() => scrollToSection('faq')}>FAQ</button>
            </div>
            <div className="footer-col">
              <h4>Account</h4>
              <button type="button" onClick={() => handleNavClick('login')}>Sign In</button>
              <button type="button" onClick={() => handleNavClick('register')}>Register</button>
            </div>
            <div className="footer-col">
              <h4>Contact</h4>
              <a href="mailto:innoliftventures@gmail.com">innoliftventures@gmail.com</a>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <Link to="/privacy-policy">Privacy Policy</Link>
              <Link to="/terms-of-service">Terms of Service</Link>
              <Link to="/refund-policy">Refund Policy</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom container">
          <p>© {new Date().getFullYear()} NovelCheckr Platform. All rights reserved.</p>
        </div>
      </footer>

      {showBackToTop && (
        <button type="button" className="back-to-top" onClick={scrollToTop} aria-label="Back to top">
          <ChevronDown size={18} style={{ transform: 'rotate(180deg)' }} />
        </button>
      )}

      {showPromo && (
        <div className="promo-overlay" role="dialog" aria-modal="true" aria-labelledby="promo-title">
          <button type="button" className="promo-backdrop" onClick={closePromo} aria-label="Close announcement" />
          <div className="promo-card">
            <button type="button" className="promo-close" onClick={closePromo} aria-label="Close">
              <X size={18} />
            </button>
            <div className="promo-card-visual">
              <img src={logoImage} alt="" className="promo-logo" />
              <p className="promo-kicker">NovelCheckr · Innolift Ventures</p>
              <h2 id="promo-title">Check your research before you submit</h2>
              <p>
                Confidential similarity analysis for theses, journal papers, and conference manuscripts —
                starting at ₹99, GST included.
              </p>
            </div>
            <div className="promo-card-body">
              <ul className="promo-points">
                <li><CheckCircle2 size={16} /> Digitally signed PDF report</li>
                <li><Lock size={16} /> Manuscript not added to a public repository</li>
                <li><Zap size={16} /> Express delivery available</li>
              </ul>
              <div className="promo-prices">
                <span>₹99 Check</span>
                <span>₹299 Improve</span>
                <span>₹549 Complete</span>
              </div>
              <div className="promo-actions">
                <button type="button" className="btn-hero-primary" onClick={() => openPromoCta('register')}>
                  <span>Get started</span>
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  className="btn-hero-secondary-light"
                  onClick={() => {
                    closePromo();
                    scrollToSection('pricing');
                  }}
                >
                  View pricing
                </button>
              </div>
              <p className="promo-note">A product of Innolift Ventures Private Limited</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
