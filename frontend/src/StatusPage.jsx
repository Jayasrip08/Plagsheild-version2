import {
  CalendarDays,
  Check,
  Download,
  FileCheck2,
  FileText,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

function formatWhen(value, withSeconds = false) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...(withSeconds ? { second: '2-digit' } : {}),
      hour12: true,
    });
  } catch {
    return String(value);
  }
}

function fileMeta(order) {
  const raw = order?.document || order?.paper_title || '';
  const name = order?.paper_title
    || (raw ? String(raw).split('?')[0].split('/').pop() : 'Manuscript');
  const ext = (String(name).split('.').pop() || '').toUpperCase();
  const looksLikeExt = ext && ext.length <= 5 && ext !== String(name).toUpperCase();
  return {
    name,
    typeLabel: looksLikeExt ? ext : (order?.paper_type || 'DOC'),
  };
}

function similarityBand(score) {
  if (score == null || Number.isNaN(Number(score))) {
    return { label: 'Pending', tone: 'muted', pill: 'Awaiting' };
  }
  const n = Number(score);
  if (n <= 15) return { label: 'Low Similarity', tone: 'good', pill: 'Low' };
  if (n <= 25) return { label: 'Moderate Similarity', tone: 'warn', pill: 'Moderate' };
  return { label: 'High Similarity', tone: 'danger', pill: 'High' };
}

function statusSummary(order) {
  if (order.status === 'Report Ready') {
    return { label: 'Completed', badge: 'Ready', tone: 'good' };
  }
  if (order.status === 'Processing') {
    return { label: 'Processing', badge: 'In progress', tone: 'info' };
  }
  if (order.status === 'Pending Payment') {
    return { label: 'Awaiting payment', badge: 'Pending', tone: 'warn' };
  }
  return { label: order.status || 'Submitted', badge: 'Active', tone: 'info' };
}

function analysisSteps(order) {
  const paid = order.status !== 'Pending Payment';
  const processing = order.status === 'Processing' || order.status === 'Report Ready';
  const ready = order.status === 'Report Ready';
  const created = formatWhen(order.created_at);
  const paidAt = formatWhen(order.payment?.paid_at || order.payment?.created_at || order.created_at);
  const reportAt = formatWhen(order.report_uploaded_at || order.created_at);

  return [
    {
      key: 'submitted',
      title: 'Paper submitted',
      detail: 'Manuscript received with complete submission details.',
      state: paid ? 'complete' : 'current',
      when: created,
    },
    {
      key: 'payment',
      title: 'Payment confirmed',
      detail: 'Similarity check fee has been recorded.',
      state: paid ? 'complete' : 'pending',
      when: paid ? paidAt : '—',
    },
    {
      key: 'processing',
      title: 'File processing',
      detail: 'Document prepared for licensed similarity analysis.',
      state: paid ? 'complete' : 'pending',
      when: paid ? paidAt : '—',
    },
    {
      key: 'analysis',
      title: 'Similarity analysis',
      detail: ready
        ? 'Analysis finished.'
        : processing
          ? 'Your manuscript is currently being analysed.'
          : 'Queued for licensed similarity checking.',
      state: ready ? 'complete' : processing ? 'current' : paid ? 'current' : 'pending',
      when: ready ? reportAt : processing ? created : '—',
    },
    {
      key: 'report',
      title: 'Report generation',
      detail: ready ? 'Detailed similarity report is available.' : 'Report will be generated after analysis.',
      state: ready ? 'complete' : processing ? 'current' : 'pending',
      when: ready ? reportAt : '—',
    },
  ];
}

function ScoreRing({ score, tone }) {
  const value = score == null || Number.isNaN(Number(score)) ? 0 : Math.max(0, Math.min(100, Number(score)));
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const stroke = tone === 'danger' ? '#dc2626' : tone === 'warn' ? '#d97706' : '#16a34a';

  return (
    <div className="st-ring" aria-hidden="true">
      <svg viewBox="0 0 128 128">
        <circle className="st-ring-track" cx="64" cy="64" r={r} />
        <circle
          className="st-ring-fill"
          cx="64"
          cy="64"
          r={r}
          stroke={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="st-ring-label">
        <strong style={{ color: stroke }}>{score == null ? '—' : `${Number(score)}%`}</strong>
      </div>
    </div>
  );
}

export default function StatusPage({ order, onRefresh, refreshing = false }) {
  const ready = order.status === 'Report Ready';
  const file = fileMeta(order);
  const score = order.similarity_score;
  const band = similarityBand(score);
  const summary = statusSummary(order);
  const steps = analysisSteps(order);
  const words = Number(order.word_count) || 0;
  const matched = score != null && words > 0
    ? Math.round((Number(score) / 100) * words)
    : null;
  const docs = Array.isArray(order.report_documents) ? order.report_documents : [];
  const hasDownloads = ready && !order.is_expired && (docs.length > 0 || order.secure_download_url);

  return (
    <div className="st-page">
      <div className="st-head">
        <div className="st-title-wrap">
          <div className={`st-title-icon ${ready ? 'is-ready' : ''}`}>
            <FileCheck2 size={22} strokeWidth={2} />
          </div>
          <div>
            <h2>{ready ? 'Report Ready' : 'Analysis in Progress'}</h2>
            <p>
              {order.paper_title || file.name}
              {order.paper_type ? ` · ${order.paper_type}` : ''}
            </p>
          </div>
        </div>
        <button type="button" className="st-refresh" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw size={15} className={refreshing ? 'is-spin' : ''} />
          Refresh Status
        </button>
      </div>

      <div className="st-summary">
        <div className="st-summary-card">
          <div className={`st-ico is-${summary.tone}`}>
            <Check size={16} strokeWidth={2.5} />
          </div>
          <div className="st-summary-copy">
            <span>Status</span>
            <strong>{summary.label}</strong>
          </div>
          <em className={`st-pill is-${summary.tone}`}>{summary.badge}</em>
        </div>

        <div className="st-summary-card">
          <div className="st-ico is-info">
            <FileText size={16} strokeWidth={2.2} />
          </div>
          <div className="st-summary-copy">
            <span>File Name</span>
            <strong title={file.name}>{file.name}</strong>
            <small>{file.typeLabel}{words ? ` · ${words.toLocaleString('en-IN')} words` : ''}</small>
          </div>
        </div>

        <div className="st-summary-card">
          <div className="st-ico is-info">
            <CalendarDays size={16} strokeWidth={2.2} />
          </div>
          <div className="st-summary-copy">
            <span>Submitted On</span>
            <strong>{formatWhen(order.created_at, true)}</strong>
          </div>
        </div>

        <div className="st-summary-card">
          <div className={`st-ico is-${band.tone}`}>
            <ShieldCheck size={16} strokeWidth={2.2} />
          </div>
          <div className="st-summary-copy">
            <span>Similarity Score</span>
            <strong className={`is-${band.tone}`}>
              {score == null ? '—' : `${Number(score)}%`}
            </strong>
          </div>
          {score != null ? <em className={`st-pill is-${band.tone}`}>{band.pill}</em> : null}
        </div>
      </div>

      <div className="st-grid">
        <section className="st-panel">
          <div className="st-panel-head">
            <h3>Process Status</h3>
            <p>
              {ready
                ? 'Your manuscript has been analysed successfully. Here’s the detailed progress.'
                : 'We’re processing your manuscript. This timeline updates as each step completes.'}
            </p>
          </div>
          <ol className="st-timeline">
            {steps.map((step) => (
              <li key={step.key} className={`st-step is-${step.state}`}>
                <div className="st-step-marker">
                  {step.state === 'complete' ? (
                    <Check size={12} strokeWidth={3} />
                  ) : step.state === 'current' ? (
                    <span className="st-pulse" />
                  ) : null}
                </div>
                <div className="st-step-body">
                  <div className="st-step-top">
                    <strong>{step.title}</strong>
                    <time>{step.when}</time>
                  </div>
                  <span>{step.detail}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <aside className={`st-score-card is-${band.tone}`}>
          <div className="st-score-head">
            <h3>Similarity Score</h3>
            {ready ? <Check size={16} className="st-score-check" /> : null}
          </div>

          <ScoreRing score={score} tone={band.tone} />
          <em className={`st-pill is-${band.tone} st-score-pill`}>
            {ready ? band.label : 'Analysis in progress'}
          </em>

          <div className="st-stats">
            <div>
              <span>Total Words</span>
              <strong>{words ? words.toLocaleString('en-IN') : '—'}</strong>
            </div>
            <div>
              <span>Matched Words</span>
              <strong>{matched != null ? matched.toLocaleString('en-IN') : '—'}</strong>
            </div>
            <div>
              <span>Order</span>
              <strong>#{order.id}</strong>
            </div>
          </div>

          <div className="st-docs">
            <div className="st-docs-head">
              Verified Documents &amp; Reports ({docs.length || (order.secure_download_url ? 1 : 0)})
            </div>

            {order.is_expired ? (
              <p className="st-expired">This report download link has expired (48-hour validity).</p>
            ) : hasDownloads ? (
              <div className="st-doc-list">
                {docs.length > 0 ? docs.map((doc) => (
                  <div key={doc.id || doc.name} className="st-doc-row">
                    <div className="st-doc-info">
                      <FileText size={18} />
                      <div>
                        <strong title={doc.name}>{doc.name}</strong>
                        <small>PDF report</small>
                      </div>
                    </div>
                    <a
                      href={doc.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="st-download"
                      download
                    >
                      <Download size={14} />
                      Download
                    </a>
                  </div>
                )) : (
                  <div className="st-doc-row">
                    <div className="st-doc-info">
                      <FileText size={18} />
                      <div>
                        <strong>Similarity report</strong>
                        <small>Secure download · valid 48 hours</small>
                      </div>
                    </div>
                    <a
                      href={order.secure_download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="st-download"
                      download
                    >
                      <Download size={14} />
                      Download
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <p className="st-docs-empty">
                {ready
                  ? 'Report files will appear here once available.'
                  : 'Downloads unlock when your similarity report is ready.'}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
