import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Download,
  FileText,
  Mail,
  Phone,
  UserRound,
  CreditCard,
  Clock3,
  ShieldCheck,
  CalendarDays,
  CircleDot,
} from 'lucide-react';
import api from './api';
import SectionLoader from './SectionLoader';
import { paymentOf, paymentStatusLabel, coAuthorLine } from './SubmissionRecord';

function value(text, fallback = '—') {
  if (text === 0) return '0';
  if (text === false) return 'No';
  if (text === true) return 'Yes';
  return text || fallback;
}

function money(amount) {
  const n = Number(amount);
  return Number.isFinite(n) ? `₹${n.toFixed(2)}` : '—';
}

function when(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return iso;
  }
}

function fileName(path) {
  if (!path) return 'Document';
  try {
    return decodeURIComponent(String(path).split('?')[0].split('/').pop());
  } catch {
    return String(path).split('?')[0].split('/').pop() || 'Document';
  }
}

async function downloadBlob(urlPath, fallbackName) {
  const res = await api.get(urlPath, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fallbackName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function Field({ label, children }) {
  return (
    <div className="zb2-field">
      <span className="zb2-field-label">{label}</span>
      <div className="zb2-field-value">{children}</div>
    </div>
  );
}

export default function AdminOrderDetail({ orderId, initialOrder = null, onBack }) {
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(!initialOrder);
  const [error, setError] = useState('');
  const [busyDoc, setBusyDoc] = useState(false);
  const [busyInvoice, setBusyInvoice] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`orders/${orderId}/`);
        if (!cancelled) setOrder(res.data);
      } catch (e) {
        if (!cancelled) {
          setError(e?.response?.data?.detail || e?.response?.data?.error || 'Failed to load order details.');
          if (initialOrder) setOrder(initialOrder);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [orderId]);

  const handleDownloadDocument = async () => {
    if (!order?.id) return;
    setBusyDoc(true);
    try {
      await downloadBlob(
        `orders/${order.id}/download-document/`,
        fileName(order.document) || `order-${order.id}-manuscript`
      );
    } catch (e) {
      console.error(e);
      alert('Could not download the submitted manuscript.');
    } finally {
      setBusyDoc(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order?.id) return;
    setBusyInvoice(true);
    try {
      await downloadBlob(`orders/${order.id}/invoice/`, `invoice-order-${order.id}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Could not download the invoice.');
    } finally {
      setBusyInvoice(false);
    }
  };

  if (loading && !order) {
    return (
      <div className="zb2-page">
        <button type="button" className="zb2-back" onClick={onBack}>
          <ArrowLeft size={16} strokeWidth={2.25} /> Back to History
        </button>
        <SectionLoader label="Loading order details…" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="zb2-page">
        <button type="button" className="zb2-back" onClick={onBack}>
          <ArrowLeft size={16} strokeWidth={2.25} /> Back to History
        </button>
        <div className="zb2-card zb2-empty">
          <FileText size={36} strokeWidth={1.5} />
          <p>{error || 'Order not found.'}</p>
        </div>
      </div>
    );
  }

  const pay = paymentOf(order);
  const reports = Array.isArray(order.report_documents) ? order.report_documents : [];
  const accountName = [
    order.user_details?.first_name,
    order.user_details?.last_name,
  ].filter(Boolean).join(' ') || order.user_details?.username || '—';
  const email = order.user_details?.email || order.author_email || pay?.payer_email || '—';
  const phone = order.user_details?.phone || pay?.payer_contact || '—';
  const manuscriptLabel = order.paper_title || fileName(order.document);
  const statusClass = String(order.status || '').toLowerCase().includes('ready')
    ? 'is-success'
    : String(order.status || '').toLowerCase().includes('process')
      ? 'is-warn'
      : 'is-neutral';

  return (
    <div className="zb2-page">
      <div className="zb2-toolbar">
        <button type="button" className="zb2-back" onClick={onBack}>
          <ArrowLeft size={16} strokeWidth={2.25} /> Back to History
        </button>
        <div className="zb2-toolbar-actions">
          <button
            type="button"
            className="zb2-btn zb2-btn-primary"
            onClick={handleDownloadDocument}
            disabled={busyDoc || !order.document}
          >
            <Download size={15} />
            {busyDoc ? 'Downloading…' : 'Download Manuscript'}
          </button>
          <button
            type="button"
            className="zb2-btn zb2-btn-ghost"
            onClick={handleDownloadInvoice}
            disabled={busyInvoice}
          >
            <FileText size={15} />
            {busyInvoice ? 'Downloading…' : 'Invoice'}
          </button>
        </div>
      </div>

      {error ? <div className="form-error" style={{ marginBottom: 16 }}>{error}</div> : null}

      <section className="zb2-card zb2-hero">
        <div className="zb2-hero-top">
          <div className="zb2-hero-identity">
            <div className="zb2-avatar zb2-avatar-lg" aria-hidden="true">
              <FileText size={28} strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="zb2-hero-title">{manuscriptLabel}</h1>
              <p className="zb2-hero-sub">Order Detail · Licensed Similarity Assessment</p>
            </div>
          </div>
          <div className="zb2-hero-aside">
            <span className={`zb2-pill ${statusClass}`}>
              <span className="zb2-pill-dot" />
              {order.status}
            </span>
            <span className="zb2-ref-id">ORD-{String(order.id).padStart(5, '0')}</span>
          </div>
        </div>

        <div className="zb2-metrics">
          <div className="zb2-metric">
            <span className="zb2-metric-label"><Clock3 size={14} /> Submitted</span>
            <strong>{when(order.created_at)}</strong>
          </div>
          <div className="zb2-metric">
            <span className="zb2-metric-label"><ShieldCheck size={14} /> Report ready</span>
            <strong>{when(order.report_uploaded_at)}</strong>
          </div>
          <div className="zb2-metric">
            <span className="zb2-metric-label"><CreditCard size={14} /> Amount</span>
            <strong>{money(pay?.amount || order.price)}</strong>
          </div>
          <div className="zb2-metric">
            <span className="zb2-metric-label"><CircleDot size={14} /> Similarity</span>
            <strong>{order.similarity_score != null ? `${order.similarity_score}%` : '—'}</strong>
          </div>
        </div>
      </section>

      <div className="zb2-grid-2">
        <section className="zb2-card">
          <h2 className="zb2-card-title"><UserRound size={16} /> Customer</h2>
          <div className="zb2-fields">
            <Field label="Account name">{accountName}</Field>
            <Field label="Username">@{value(order.user_details?.username)}</Field>
            <Field label="Email">{email}</Field>
            <Field label="Mobile">{phone}</Field>
            <Field label="Role">{value(String(order.user_details?.role || '').replace(/_/g, ' ').toUpperCase())}</Field>
            <Field label="College">{value(order.college_name)}</Field>
          </div>
        </section>

        <section className="zb2-card">
          <h2 className="zb2-card-title"><UserRound size={16} /> Author on Manuscript</h2>
          <div className="zb2-fields">
            <Field label="Corresponding author">{value(order.author_name)}</Field>
            <Field label="Author email">{value(order.author_email)}</Field>
            <Field label="Institution">{value(order.author_institution)}</Field>
            <Field label="Country">{value(order.author_country)}</Field>
            <Field label="Co-authors">{coAuthorLine(order)}</Field>
          </div>
        </section>
      </div>

      <div className="zb2-grid-2">
        <section className="zb2-card">
          <h2 className="zb2-card-title"><FileText size={16} /> Manuscript</h2>
          <div className="zb2-fields">
            <Field label="Title">{value(manuscriptLabel)}</Field>
            <Field label="Paper type">{value(order.paper_type)}</Field>
            <Field label="Subject / research area">{value(order.subject_area)}</Field>
            <Field label="Purpose">{value(order.purpose)}</Field>
            <Field label="Package">{value(order.package_label)}</Field>
            <Field label="Word count">{value(order.word_count)}</Field>
            {order.keywords ? <Field label="Keywords">{order.keywords}</Field> : null}
            <Field label="Submitted file">
              <div className="zb2-inline-file">
                <span className="mono-id">{fileName(order.document)}</span>
                <button
                  type="button"
                  className="zb2-btn zb2-btn-ghost zb2-btn-sm"
                  onClick={handleDownloadDocument}
                  disabled={busyDoc || !order.document}
                >
                  <Download size={13} /> Download
                </button>
              </div>
            </Field>
          </div>
        </section>

        <section className="zb2-card">
          <h2 className="zb2-card-title"><CreditCard size={16} /> Payment</h2>
          <div className="zb2-fields">
            <Field label="Payment status">{paymentStatusLabel(order)}</Field>
            <Field label="Amount paid">{money(pay?.amount || order.price)}</Field>
            <Field label="Razorpay payment ID"><span className="mono-id">{value(pay?.razorpay_payment_id)}</span></Field>
            <Field label="Razorpay order ID"><span className="mono-id">{value(pay?.razorpay_order_id)}</span></Field>
            <Field label="Transaction ID"><span className="mono-id">{value(pay?.transaction_id)}</span></Field>
            <Field label="Method">{value(pay?.method)}</Field>
            {pay?.vpa ? <Field label="UPI VPA">{pay.vpa}</Field> : null}
            {pay?.bank ? <Field label="Bank">{pay.bank}</Field> : null}
            <Field label="Payer email">{value(pay?.payer_email)}</Field>
            <Field label="Payer mobile">{value(pay?.payer_contact)}</Field>
            <Field label="Paid at">{when(pay?.paid_at)}</Field>
          </div>
        </section>
      </div>

      <section className="zb2-card">
        <h2 className="zb2-card-title"><ShieldCheck size={16} /> Reports Submitted by Admin</h2>
        {reports.length === 0 ? (
          <div className="zb2-empty">
            <FileText size={36} strokeWidth={1.5} />
            <p>No report files attached to this order.</p>
          </div>
        ) : (
          <div className="zb2-file-list">
            {reports.map((doc) => (
              <div key={doc.id || doc.name} className="zb2-file-row">
                <div>
                  <strong>{doc.name}</strong>
                  <span>Verification / similarity report · Uploaded {when(order.report_uploaded_at)}</span>
                </div>
                <a
                  href={doc.download_url || doc.direct_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="zb2-btn zb2-btn-primary zb2-btn-sm"
                >
                  <Download size={14} /> Download
                </a>
              </div>
            ))}
          </div>
        )}
        <div className="zb2-submission-grid" style={{ marginTop: 16 }}>
          <Field label="Report uploaded at">{when(order.report_uploaded_at)}</Field>
          <Field label="Similarity score">{order.similarity_score != null ? `${order.similarity_score}%` : '—'}</Field>
        </div>
      </section>

      <footer className="zb2-page-footer">
        <span><CalendarDays size={14} /> Order created {when(order.created_at)}</span>
        <span>Internal reference · Ord #{order.id}</span>
      </footer>
    </div>
  );
}
