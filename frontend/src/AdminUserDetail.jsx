import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Download,
  FileText,
  Mail,
  Phone,
  UserRound,
  Clock3,
  ShieldCheck,
  History,
  Lock,
  LockOpen,
  Trash2,
  CalendarDays,
  CircleDot,
} from 'lucide-react';
import api from './api';
import SectionLoader from './SectionLoader';
import { paymentOf, paymentStatusLabel } from './SubmissionRecord';

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

function displayName(user) {
  const full = `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
  return full || user?.username || 'User';
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

export default function AdminUserDetail({
  user: initialUser,
  onBack,
  onToggleBlock,
  onDelete,
}) {
  const [user, setUser] = useState(initialUser);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [busyKey, setBusyKey] = useState('');

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user?.id) return;
      setLoadingOrders(true);
      setOrdersError('');
      try {
        const res = await api.get('orders/', {
          params: { status: 'all', user_id: user.id },
        });
        const list = (Array.isArray(res.data) ? res.data : [])
          .filter((o) => String(o.user) === String(user.id) || o.user_details?.id === user.id)
          .sort((a, b) => {
            const tb = new Date(b.created_at || 0).getTime();
            const ta = new Date(a.created_at || 0).getTime();
            if (tb !== ta) return tb - ta;
            return (b.id || 0) - (a.id || 0);
          });
        if (!cancelled) setOrders(list);
      } catch (e) {
        console.error(e);
        if (!cancelled) setOrdersError('Could not load submission history for this user.');
      } finally {
        if (!cancelled) setLoadingOrders(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  const handleDownloadDocument = async (order) => {
    const key = `doc-${order.id}`;
    setBusyKey(key);
    try {
      await downloadBlob(
        `orders/${order.id}/download-document/`,
        fileName(order.document) || `order-${order.id}-manuscript`
      );
    } catch (e) {
      console.error(e);
      alert('Could not download the submitted manuscript.');
    } finally {
      setBusyKey('');
    }
  };

  const handleDownloadInvoice = async (order) => {
    const key = `inv-${order.id}`;
    setBusyKey(key);
    try {
      await downloadBlob(`orders/${order.id}/invoice/`, `invoice-order-${order.id}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Could not download the invoice.');
    } finally {
      setBusyKey('');
    }
  };

  if (!user) return null;

  const roleLabel = String(user.role || '').replace(/_/g, ' ').toUpperCase();
  const name = displayName(user);

  return (
    <div className="zb2-page">
      <div className="zb2-toolbar">
        <button type="button" className="zb2-back" onClick={onBack}>
          <ArrowLeft size={16} strokeWidth={2.25} /> Back to Users
        </button>
        {user.role !== 'super_admin' ? (
          <div className="zb2-toolbar-actions">
            <button
              type="button"
              className="zb2-btn zb2-btn-primary"
              onClick={() => onToggleBlock?.(user.id)}
            >
              {user.is_active ? <Lock size={15} /> : <LockOpen size={15} />}
              {user.is_active ? 'Block Account' : 'Unblock Account'}
            </button>
            <button
              type="button"
              className="zb2-btn zb2-btn-ghost"
              onClick={() => onDelete?.(user.id, user.email || user.username)}
            >
              <Trash2 size={15} /> Delete
            </button>
          </div>
        ) : null}
      </div>

      <section className="zb2-card zb2-hero">
        <div className="zb2-hero-top">
          <div className="zb2-hero-identity">
            <div className="zb2-avatar zb2-avatar-lg" aria-hidden="true">
              <UserRound size={28} strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="zb2-hero-title">{name}</h1>
              <p className="zb2-hero-sub">Customer Profile · Account &amp; Submission Record</p>
            </div>
          </div>
          <div className="zb2-hero-aside">
            <span className={`zb2-pill ${user.is_active ? 'is-success' : 'is-danger'}`}>
              <span className="zb2-pill-dot" />
              {user.is_active ? 'Active' : 'Blocked'}
            </span>
            <span className="zb2-ref-id">USR-{String(user.id).padStart(5, '0')}</span>
          </div>
        </div>

        <div className="zb2-metrics">
          <div className="zb2-metric">
            <span className="zb2-metric-label"><UserRound size={14} /> Account</span>
            <strong>{value(user.username)}</strong>
          </div>
          <div className="zb2-metric">
            <span className="zb2-metric-label"><Mail size={14} /> Email</span>
            <strong>{value(user.email)}</strong>
          </div>
          <div className="zb2-metric">
            <span className="zb2-metric-label"><Phone size={14} /> Mobile</span>
            <strong>{value(user.phone)}</strong>
          </div>
          <div className="zb2-metric">
            <span className="zb2-metric-label"><Clock3 size={14} /> Joined</span>
            <strong>{when(user.date_joined)}</strong>
          </div>
        </div>
      </section>

      <div className="zb2-grid-2">
        <section className="zb2-card">
          <h2 className="zb2-card-title"><UserRound size={16} /> Profile</h2>
          <div className="zb2-fields">
            <Field label="Full name">{name}</Field>
            <Field label="Username">@{value(user.username)}</Field>
            <Field label="Email">{value(user.email)}</Field>
            <Field label="Mobile">{value(user.phone)}</Field>
            <Field label="Role">{roleLabel}</Field>
            <Field label="Status">
              <span className={`zb2-pill ${user.is_active ? 'is-success' : 'is-danger'}`}>
                <span className="zb2-pill-dot" />
                {user.is_active ? 'Active' : 'Blocked'}
              </span>
            </Field>
          </div>
        </section>

        <section className="zb2-card">
          <h2 className="zb2-card-title"><Clock3 size={16} /> Account Activity</h2>
          <div className="zb2-fields">
            <Field label="Registered at">{when(user.date_joined)}</Field>
            <Field label="Last login">{when(user.last_login)}</Field>
            <Field label="College">{value(user.college_name)}</Field>
            <Field label="Department">{value(user.department)}</Field>
            <Field label="Total submissions">{loadingOrders ? '…' : orders.length}</Field>
          </div>
        </section>
      </div>

      <section className="zb2-card">
        <h2 className="zb2-card-title"><History size={16} /> Previous Submission History</h2>

        {loadingOrders ? (
          <SectionLoader label="Loading submission history…" />
        ) : ordersError ? (
          <div className="zb2-empty">
            <FileText size={36} strokeWidth={1.5} />
            <p>{ordersError}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="zb2-empty">
            <FileText size={36} strokeWidth={1.5} />
            <p>No submissions yet for this user.</p>
          </div>
        ) : (
          <div className="zb2-submissions">
            {orders.map((order) => {
              const pay = paymentOf(order);
              const reports = Array.isArray(order.report_documents) ? order.report_documents : [];
              return (
                <div key={order.id} className="zb2-submission">
                  <div className="zb2-submission-top">
                    <div>
                      <strong>ORD-{String(order.id).padStart(5, '0')}</strong>
                      <span>{order.paper_title || fileName(order.document)}</span>
                    </div>
                    <span className="zb2-pill is-neutral">
                      <CircleDot size={12} /> {order.status}
                    </span>
                  </div>

                  <div className="zb2-submission-grid">
                    <Field label="Submitted">{when(order.created_at)}</Field>
                    <Field label="Package">{value(order.package_label)}</Field>
                    <Field label="Payment">{paymentStatusLabel(order)} · {money(pay?.amount || order.price)}</Field>
                    <Field label="Similarity">{order.similarity_score != null ? `${order.similarity_score}%` : '—'}</Field>
                    <Field label="Payment ID"><span className="mono-id">{value(pay?.razorpay_payment_id)}</span></Field>
                    <Field label="Transaction ID"><span className="mono-id">{value(pay?.transaction_id)}</span></Field>
                  </div>

                  <div className="zb2-file-actions">
                    <button
                      type="button"
                      className="zb2-btn zb2-btn-ghost zb2-btn-sm"
                      disabled={!order.document || busyKey === `doc-${order.id}`}
                      onClick={() => handleDownloadDocument(order)}
                    >
                      <Download size={14} />
                      {busyKey === `doc-${order.id}` ? 'Downloading…' : 'Manuscript'}
                    </button>
                    {reports.map((doc) => (
                      <a
                        key={doc.id || doc.name}
                        href={doc.download_url || doc.direct_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="zb2-btn zb2-btn-primary zb2-btn-sm"
                      >
                        <ShieldCheck size={14} /> {doc.name || 'Report'}
                      </a>
                    ))}
                    <button
                      type="button"
                      className="zb2-btn zb2-btn-ghost zb2-btn-sm"
                      disabled={busyKey === `inv-${order.id}`}
                      onClick={() => handleDownloadInvoice(order)}
                    >
                      <Download size={14} />
                      {busyKey === `inv-${order.id}` ? 'Downloading…' : 'Invoice'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <footer className="zb2-page-footer">
        <span><CalendarDays size={14} /> Account created {when(user.date_joined)}</span>
        <span>Internal reference · Usr #{user.id}</span>
      </footer>
    </div>
  );
}
