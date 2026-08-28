import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  CreditCard,
  FileText,
  Headphones,
  MessageCircle,
  ScanSearch,
  Send,
} from 'lucide-react';
import api from './api';

export const SUPPORT_CATEGORIES = [
  {
    id: 'general',
    title: 'General Query',
    blurb: 'Questions about submitting, timelines, and how InnoresearX works.',
    icon: MessageCircle,
    examples: [
      'How do I submit a paper?',
      'When will my report arrive?',
      'How do I register for a conference?',
    ],
    topics: [
      'How do I submit a paper?',
      'When will my report arrive?',
      'How do I register for a conference?',
      'Other general question',
    ],
  },
  {
    id: 'payment',
    title: 'Payment Issue',
    blurb: 'Checkout, deductions, incorrect charges, and refunds.',
    icon: CreditCard,
    examples: [
      'Payment failed',
      'Amount deducted but status pending',
      'Wrong payment',
      'Refund request',
    ],
    topics: [
      'Payment failed',
      'Amount deducted but status pending',
      'Wrong payment',
      'Refund request',
    ],
  },
  {
    id: 'submission',
    title: 'Paper / Submission Issue',
    blurb: 'Uploads, the wrong file, status, and revisions.',
    icon: FileText,
    examples: [
      'Upload problem',
      'Wrong file submitted',
      'Paper status issue',
      'Revision problem',
    ],
    topics: [
      'Upload problem',
      'Wrong file submitted',
      'Paper status issue',
      'Revision problem',
    ],
  },
  {
    id: 'report',
    title: 'Similarity Report Issue',
    blurb: 'Missing reports, downloads, and questions about results.',
    icon: ScanSearch,
    examples: [
      'Report not generated',
      'Report cannot be downloaded',
      'Report-related questions',
    ],
    topics: [
      'Report not generated',
      'Report cannot be downloaded',
      'Report-related question',
    ],
  },
];

const STATUS_CLASS = {
  open: 'is-open',
  in_review: 'is-review',
  resolved: 'is-resolved',
};

function formatWhen(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

export default function HelpSupport({ orders = [] }) {
  const [categoryId, setCategoryId] = useState('general');
  const [topic, setTopic] = useState(SUPPORT_CATEGORIES[0].topics[0]);
  const [orderId, setOrderId] = useState('');
  const [message, setMessage] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const category = useMemo(
    () => SUPPORT_CATEGORIES.find((item) => item.id === categoryId) || SUPPORT_CATEGORIES[0],
    [categoryId]
  );

  const fetchTickets = async () => {
    try {
      const res = await api.get('support/tickets/');
      setTickets(res.data || []);
    } catch (e) {
      console.error('Unable to load support requests', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const selectCategory = (id) => {
    const next = SUPPORT_CATEGORIES.find((item) => item.id === id);
    setCategoryId(id);
    setTopic(next?.topics[0] || '');
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!message.trim() || message.trim().length < 12) {
      setError('Please add a short description so the desk can help you.');
      return;
    }
    setSending(true);
    try {
      await api.post('support/tickets/', {
        category: categoryId,
        topic,
        message: message.trim(),
        order: orderId ? Number(orderId) : null,
      });
      setMessage('');
      setOrderId('');
      setSuccess('Your request has been sent. The InnoresearX desk will follow up.');
      fetchTickets();
    } catch (err) {
      const data = err.response?.data;
      const first = data && typeof data === 'object'
        ? Object.values(data).flat()[0]
        : null;
      setError(first || data?.error || 'Unable to send your request. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="support-shell">
      <div className="support-scroll">
        <header className="support-masthead">
          <div className="support-identity">
            <span className="support-mark" aria-hidden="true">
              <Headphones size={22} strokeWidth={1.8} />
            </span>
            <div>
              <p className="support-kicker">InnoresearX desk</p>
              <h2>Help &amp; Support</h2>
              <p>
                Ask about submissions, payments, papers, or similarity reports. Choose a category so the right team can respond.
              </p>
            </div>
          </div>
          <div className="support-contact">
            <span>Direct line</span>
            <strong>support@innoresearx.com</strong>
          </div>
        </header>

        <section className="support-cats" aria-label="Request categories">
          {SUPPORT_CATEGORIES.map((item) => {
            const Icon = item.icon;
            const selected = item.id === categoryId;
            return (
              <button
                key={item.id}
                type="button"
                className={`support-cat ${selected ? 'is-selected' : ''}`}
                onClick={() => selectCategory(item.id)}
              >
                <span className="support-cat-icon"><Icon size={18} strokeWidth={1.9} /></span>
                <h3>{item.title}</h3>
                <p>{item.blurb}</p>
                <ul>
                  {item.examples.slice(0, 3).map((example) => (
                    <li key={example}>{example}</li>
                  ))}
                </ul>
              </button>
            );
          })}
        </section>

        <div className="support-work">
          <form className="support-form" onSubmit={handleSubmit} noValidate>
            <div className="support-form-head">
              <h3>Send a {category.title.toLowerCase()}</h3>
              <p>Tell us what happened. Include an order if this is about a specific paper or payment.</p>
            </div>

            {success && (
              <div className="support-banner is-success" role="status">
                <Check size={16} strokeWidth={2.4} />
                {success}
              </div>
            )}
            {error && <div className="support-banner is-error" role="alert">{error}</div>}

            <label className="support-field">
              <span>Topic</span>
              <select className="form-control" value={topic} onChange={(e) => setTopic(e.target.value)}>
                {category.topics.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="support-field">
              <span>Related submission <em>(optional)</em></span>
              <select className="form-control" value={orderId} onChange={(e) => setOrderId(e.target.value)}>
                <option value="">No linked submission</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    #{order.id} · {order.paper_title || 'Manuscript'} · {order.status}
                  </option>
                ))}
              </select>
            </label>

            <label className="support-field">
              <span>How can we help?</span>
              <textarea
                className="form-control"
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share the details, including dates, payment references, or file names if relevant."
              />
            </label>

            <button type="submit" className="btn btn-primary support-send" disabled={sending}>
              <Send size={15} />
              {sending ? 'Sending…' : 'Send request'}
            </button>
          </form>

          <aside className="support-history">
            <div className="support-form-head">
              <h3>Your requests</h3>
              <p>Open items stay with the desk until they are resolved.</p>
            </div>
            {loading ? (
              <div className="support-empty">Loading your requests…</div>
            ) : tickets.length === 0 ? (
              <div className="support-empty">You have not sent a request yet.</div>
            ) : (
              <ul className="support-ticket-list">
                {tickets.map((ticket) => (
                  <li key={ticket.id}>
                    <div>
                      <strong>{ticket.topic}</strong>
                      <span>{ticket.category_label}{ticket.order_title ? ` · ${ticket.order_title}` : ''}</span>
                      <small>{formatWhen(ticket.created_at)}</small>
                    </div>
                    <em className={`support-status ${STATUS_CLASS[ticket.status] || ''}`}>
                      {ticket.status_label}
                    </em>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
