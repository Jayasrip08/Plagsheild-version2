import React from 'react';
import {
  ShieldCheck,
  FileCheck2,
  Zap,
  Lock,
  Award,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  FileText,
  Clock,
  UserCheck
} from 'lucide-react';

export default function LandingPage({ onNavigateToAuth }) {
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

  return (
    <div className="landing-page">
      {/* Top Navbar */}
      <header className="landing-navbar">
        <div className="landing-nav-container container">
          <div className="landing-brand">
            <div className="brand-icon">
              <ShieldCheck size={22} color="#0c2340" />
            </div>
            <span className="brand-name">Innoresearx</span>
          </div>

          <nav className="landing-nav-links">
            <button type="button" onClick={() => scrollToSection('features')} className="nav-item">Features</button>
            <button type="button" onClick={() => scrollToSection('how-it-works')} className="nav-item">How It Works</button>
            <button type="button" onClick={() => scrollToSection('pricing')} className="nav-item">Pricing</button>
            <button type="button" onClick={() => scrollToSection('security')} className="nav-item">Security</button>
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
      <section className="landing-hero">
        <div className="landing-hero-overlay"></div>
        <div className="container landing-hero-content">
          <div className="hero-badge">
            <Sparkles size={14} className="badge-ico" />
            <span>Academic Integrity & Verification Intelligence</span>
          </div>

          <h1 className="hero-title">
            Verify Manuscript Similarity & Academic Integrity with Precision
          </h1>

          <p className="hero-subtitle">
            Licensed similarity scanning, instant Turnitin-grade PDF audit reports, and AI content analysis designed for individual researchers, students, and academic institutions.
          </p>

          <div className="hero-actions">
            <button type="button" className="btn-hero-primary" onClick={() => handleNavClick('register')}>
              <span>Check Your Document Now</span>
              <ArrowRight size={18} />
            </button>
            <button type="button" className="btn-hero-secondary" onClick={() => scrollToSection('pricing')}>
              View Pricing Packages
            </button>
          </div>

          {/* Hero Metrics Bar */}
          <div className="hero-metrics-grid">
            <div className="metric-item">
              <div className="metric-num">99.8%</div>
              <div className="metric-label">Scan Accuracy</div>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-item">
              <div className="metric-num">&lt; 15m</div>
              <div className="metric-label">Average Delivery</div>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-item">
              <div className="metric-num">50,000+</div>
              <div className="metric-label">Papers Checked</div>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-item">
              <div className="metric-num">100%</div>
              <div className="metric-label">Data Privacy Shield</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="landing-section">
        <div className="container">
          <div className="section-header">
            <span className="section-kicker">Engineered For Excellence</span>
            <h2 className="section-title">Comprehensive Verification Tools</h2>
            <p className="section-desc">
              Everything you need to ensure original research content and meet institutional publication standards.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <FileCheck2 size={24} />
              </div>
              <h3>Turnitin-Licensed Scanning</h3>
              <p>Deep manuscript database cross-matching across billions of web pages, journals, books, and repository publications.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Zap size={24} />
              </div>
              <h3>Express Report Delivery</h3>
              <p>Automated priority queue processing delivers downloadable PDF reports directly to your account in minutes.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Lock size={24} />
              </div>
              <h3>Zero Repository Storage</h3>
              <p>Your document is never added to public databases. 100% confidential check guarantees your copyright safety.</p>
            </div>

            <div className="feature-card">
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
      <section id="how-it-works" className="landing-section section-alt">
        <div className="container">
          <div className="section-header">
            <span className="section-kicker">Simple 3-Step Process</span>
            <h2 className="section-title">How Innoresearx Works</h2>
            <p className="section-desc">Upload your manuscript and receive verified similarity results in three straightforward steps.</p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <h3>Upload Manuscript</h3>
              <p>Upload your research paper, thesis, or essay in DOCX, PDF, or TXT format with your author details.</p>
            </div>

            <div className="step-card">
              <div className="step-number">02</div>
              <h3>Automated Analysis</h3>
              <p>Our licensed intelligence engines analyze word structures, cross-match sources, and generate similarity scores.</p>
            </div>

            <div className="step-card">
              <div className="step-number">03</div>
              <h3>Download PDF Audit</h3>
              <p>Receive an encrypted link to download your detailed similarity report with highlighted matches and source breakdowns.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="landing-section">
        <div className="container">
          <div className="section-header">
            <span className="section-kicker">Transparent Pricing</span>
            <h2 className="section-title">Simple, All-Inclusive Packages</h2>
            <p className="section-desc">No hidden subscriptions. Pay only for what you check with GST-inclusive pricing.</p>
          </div>

          <div className="landing-pricing-grid">
            {/* Package 1 */}
            <div className="landing-price-card">
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
            <div className="landing-price-card price-popular">
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
            <div className="landing-price-card">
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

      {/* Security & Confidentiality */}
      <section id="security" className="landing-section section-alt">
        <div className="container">
          <div className="security-banner">
            <div className="security-content">
              <div className="security-badge">
                <ShieldCheck size={20} />
                <span>100% Confidentiality Guarantee</span>
              </div>
              <h2>Your Research Paper Remains 100% Private</h2>
              <p>
                Unlike standard free plagiarism checkers, Innoresearx ensures your submitted papers are never added to repository databases or shared with third parties. Your research stays completely your property.
              </p>
              <div className="security-checks">
                <span><CheckCircle2 size={16} color="#c5a572" /> End-to-End SSL Encryption</span>
                <span><CheckCircle2 size={16} color="#c5a572" /> Auto Expiring Secure Links</span>
                <span><CheckCircle2 size={16} color="#c5a572" /> GST Verified Tax Compliance</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="landing-cta-banner">
        <div className="container cta-container">
          <h2>Ready to Verify Your Research Paper?</h2>
          <p>Join thousands of researchers and students using Innoresearx for trusted, fast similarity reports.</p>
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
              <div className="brand-icon">
                <ShieldCheck size={20} color="#0c2340" />
              </div>
              <span className="brand-name" style={{ color: '#ffffff' }}>Innoresearx</span>
            </div>
            <p className="footer-tagline">Academic Integrity & Verification Intelligence Platform.</p>
          </div>

          <div className="footer-links">
            <div className="footer-col">
              <h4>Platform</h4>
              <button type="button" onClick={() => scrollToSection('features')}>Features</button>
              <button type="button" onClick={() => scrollToSection('pricing')}>Pricing</button>
              <button type="button" onClick={() => scrollToSection('how-it-works')}>How It Works</button>
            </div>
            <div className="footer-col">
              <h4>Account</h4>
              <button type="button" onClick={() => handleNavClick('login')}>Sign In</button>
              <button type="button" onClick={() => handleNavClick('register')}>Register</button>
            </div>
          </div>
        </div>
        <div className="footer-bottom container">
          <p>© {new Date().getFullYear()} Innoresearx Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
