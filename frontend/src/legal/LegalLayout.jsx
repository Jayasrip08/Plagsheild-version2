import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import logoImage from '../images/nc.png';

export default function LegalLayout({ title, lastUpdated, children }) {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <div className="container legal-header-inner">
          <Link to="/" className="landing-brand">
            <img src={logoImage} alt="NovelCheckr" className="brand-logo-img" />
            <span className="brand-name">NovelCheckr</span>
          </Link>
          <Link to="/" className="legal-back-link">
            <ArrowLeft size={15} />
            <span>Back to NovelCheckr</span>
          </Link>
        </div>
      </header>

      <main className="container legal-main">
        <div className="legal-doc-header">
          <h1>{title}</h1>
          <p className="legal-updated">Last updated: {lastUpdated}</p>
        </div>

        <article className="legal-content">
          {children}
        </article>
      </main>

      <footer className="legal-footer">
        <div className="container">
          <p>© {new Date().getFullYear()} Innolift Ventures Private Limited. NovelCheckr is a product of Innolift Ventures Private Limited. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
