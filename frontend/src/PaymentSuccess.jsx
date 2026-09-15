import { useEffect, useState } from 'react';
import { ArrowRight, FileSearch, ShieldCheck } from 'lucide-react';

const STAGES = [
  { at: 8, label: 'Payment confirmed' },
  { at: 38, label: 'Document received securely' },
  { at: 68, label: 'Queued for similarity analysis' },
  { at: 100, label: 'Processing started' },
];

export default function PaymentSuccess({ order, onContinue }) {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const started = Date.now();
    const duration = 4800;
    let frame;

    const tick = () => {
      const elapsed = Date.now() - started;
      const next = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(next);
      if (next >= 100) {
        setReady(true);
        return;
      }
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!ready) return undefined;
    const timer = window.setTimeout(() => onContinue?.(), 900);
    return () => window.clearTimeout(timer);
  }, [ready, onContinue]);

  const activeStage = [...STAGES].reverse().find((stage) => progress >= stage.at) || STAGES[0];
  const title = order?.paper_title
    || (order?.document ? String(order.document).split('?')[0].split('/').pop() : null)
    || 'Your manuscript';

  return (
    <div className="pay-success">
      <div className="pay-success-card" role="status" aria-live="polite">
        <div className="pay-success-mark" aria-hidden="true">
          <svg className="pay-success-ring" viewBox="0 0 96 96">
            <circle className="pay-success-ring-track" cx="48" cy="48" r="42" />
            <circle className="pay-success-ring-fill" cx="48" cy="48" r="42" />
          </svg>
          <span className="pay-success-check">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        </div>

        <p className="pay-success-kicker">Payment successful</p>
        <h2>Your document is being processed</h2>
        <p className="pay-success-lead">
          You will receive the similarity report in a short time. We are preparing your manuscript for licensed analysis now.
        </p>

        <div className="pay-success-meta">
          <div>
            <span>Order</span>
            <strong>#{order?.id || '—'}</strong>
          </div>
          <div>
            <span>Manuscript</span>
            <strong title={title}>{title}</strong>
          </div>
          {order?.package_label ? (
            <div>
              <span>Package</span>
              <strong>{order.package_label}</strong>
            </div>
          ) : null}
        </div>

        <div className="pay-success-progress" aria-label="Processing progress">
          <div className="pay-success-progress-head">
            <span>{activeStage.label}</span>
            <strong>{progress}%</strong>
          </div>
          <div className="pay-success-progress-track">
            <div className="pay-success-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <ul className="pay-success-stages">
            {STAGES.map((stage) => (
              <li key={stage.label} className={progress >= stage.at ? 'is-done' : ''}>
                {stage.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="pay-success-notes">
          <div>
            <ShieldCheck size={18} strokeWidth={2} />
            <span>Your file stays private and is not added to a shared repository.</span>
          </div>
          <div>
            <FileSearch size={18} strokeWidth={2} />
            <span>Track live analysis status from your account after this step.</span>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary pay-success-cta"
          onClick={() => onContinue?.()}
          disabled={!ready && progress < 70}
        >
          {ready ? 'Open status page' : 'Preparing status…'}
          <ArrowRight size={16} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
