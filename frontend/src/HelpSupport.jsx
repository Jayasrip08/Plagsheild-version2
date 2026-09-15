import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CreditCard,
  FileText,
  LifeBuoy,
  MessageCircle,
  Plus,
  RefreshCw,
  ScanSearch,
  Send,
} from 'lucide-react';
import api from './api';

export const SUPPORT_CATEGORIES = [
  {
    id: 'general',
    title: 'General Query',
    blurb: 'Questions about submitting, timelines, and how NovelCheckr works.',
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

function asTicketList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function threadMessages(ticket) {
  if (!ticket) return [];
  if (Array.isArray(ticket.messages) && ticket.messages.length > 0) {
    return ticket.messages;
  }
  if (ticket.message) {
    return [{
      id: `seed-${ticket.id}`,
      sender_role: 'user',
      sender_name: 'You',
      body: ticket.message,
      created_at: ticket.created_at,
    }];
  }
  return [];
}

function lastPreview(ticket) {
  const msgs = threadMessages(ticket);
  if (!msgs.length) return ticket.message || 'No messages yet';
  const last = msgs[msgs.length - 1];
  const who = last.sender_role === 'admin' ? 'Support: ' : 'You: ';
  return `${who}${last.body}`;
}

function hasAdminReply(ticket) {
  return threadMessages(ticket).some((msg) => msg.sender_role === 'admin');
}

export default function HelpSupport({ orders = [] }) {
  const [mode, setMode] = useState('inbox'); // inbox | compose
  const [categoryId, setCategoryId] = useState('general');
  const [topic, setTopic] = useState(SUPPORT_CATEGORIES[0].topics[0]);
  const [orderId, setOrderId] = useState('');
  const [message, setMessage] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const chatEndRef = useRef(null);
  const composerRef = useRef(null);

  const category = useMemo(
    () => SUPPORT_CATEGORIES.find((item) => item.id === categoryId) || SUPPORT_CATEGORIES[0],
    [categoryId]
  );

  const activeTicket = useMemo(
    () => tickets.find((item) => item.id === activeTicketId) || null,
    [tickets, activeTicketId]
  );

  const activeMessages = useMemo(() => threadMessages(activeTicket), [activeTicket]);

  const fetchTickets = async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await api.get('support/tickets/');
      const list = asTicketList(res.data);
      setTickets(list);
      setActiveTicketId((current) => {
        if (current && list.some((item) => item.id === current)) return current;
        return list[0]?.id || null;
      });
    } catch (e) {
      console.error('Unable to load support requests', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshActiveTicket = async () => {
    if (!activeTicketId) return;
    try {
      const res = await api.get(`support/tickets/${activeTicketId}/`);
      setTickets((prev) => {
        const exists = prev.some((item) => item.id === res.data.id);
        if (!exists) return [res.data, ...prev];
        return prev.map((item) => (item.id === res.data.id ? res.data : item));
      });
    } catch (e) {
      // Keep list state if detail refresh fails.
      console.error('Unable to refresh conversation', e);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Poll for admin replies while viewing inbox.
  useEffect(() => {
    if (mode !== 'inbox') return undefined;
    const timer = setInterval(() => {
      if (activeTicketId) refreshActiveTicket();
      else fetchTickets({ quiet: true });
    }, 8000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, activeTicketId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [activeTicketId, activeMessages.length]);

  useEffect(() => {
    setReplyText('');
    setReplyError('');
  }, [activeTicketId]);

  const selectCategory = (id) => {
    const next = SUPPORT_CATEGORIES.find((item) => item.id === id);
    setCategoryId(id);
    setTopic(next?.topics[0] || '');
    setError('');
    setSuccess('');
  };

  const openCompose = () => {
    setMode('compose');
    setError('');
    setSuccess('');
  };

  const backToInbox = () => {
    setMode('inbox');
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
      const res = await api.post('support/tickets/', {
        category: categoryId,
        topic,
        message: message.trim(),
        order: orderId ? Number(orderId) : null,
      });
      setMessage('');
      setOrderId('');
      setSuccess('Your request has been sent. You can continue the conversation when the desk replies.');
      const created = res.data;
      if (created?.id) {
        setTickets((prev) => [created, ...prev.filter((item) => item.id !== created.id)]);
        setActiveTicketId(created.id);
      } else {
        await fetchTickets();
      }
      setMode('inbox');
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

  const handleReply = async (e) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;
    setReplyError('');
    setReplying(true);
    try {
      const res = await api.post(`support/tickets/${activeTicket.id}/messages/`, {
        body: replyText.trim(),
      });
      const updated = res.data?.ticket;
      if (updated) {
        setTickets((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        await refreshActiveTicket();
      }
      setReplyText('');
      composerRef.current?.focus();
    } catch (err) {
      const data = err.response?.data;
      const first = data && typeof data === 'object' ? Object.values(data).flat()[0] : null;
      setReplyError(first || data?.error || 'Unable to send your reply.');
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="support-shell">
      <div className="support-scroll">
        <header className="adm-page-head support-page-head">
          <div className="adm-page-title-wrap">
            <div className="adm-page-icon"><LifeBuoy size={22} /></div>
            <div>
              <h2>Help &amp; Support</h2>
              <p>
                Message NovelCheckr Support in a live conversation. Admin replies appear here instantly.
              </p>
            </div>
          </div>
          <div className="adm-page-actions">
            {mode === 'inbox' ? (
              <>
                <button
                  type="button"
                  className="adm-btn adm-btn-secondary"
                  onClick={() => fetchTickets()}
                  disabled={loading || refreshing}
                >
                  <RefreshCw size={15} className={refreshing ? 'is-spin' : ''} />
                  Refresh
                </button>
                <button type="button" className="adm-btn adm-btn-primary" onClick={openCompose}>
                  <Plus size={15} />
                  New request
                </button>
              </>
            ) : (
              <button type="button" className="adm-btn adm-btn-secondary" onClick={backToInbox}>
                <ArrowLeft size={15} />
                Back to inbox
              </button>
            )}
          </div>
        </header>

        {mode === 'compose' ? (
          <div className="hs-compose">
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
                  </button>
                );
              })}
            </section>

            <form className="support-form hs-compose-form" onSubmit={handleSubmit} noValidate>
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
          </div>
        ) : (
          <div className="hs-chat">
            <aside className="hs-chat-list">
              <div className="hs-chat-list-head">
                <strong>Your conversations</strong>
                <span>{tickets.length}</span>
              </div>
              {loading ? (
                <div className="support-empty">Loading conversations…</div>
              ) : tickets.length === 0 ? (
                <div className="hs-empty-card">
                  <p>No support conversations yet.</p>
                  <button type="button" className="adm-btn adm-btn-primary" onClick={openCompose}>
                    <Plus size={15} /> Start a request
                  </button>
                </div>
              ) : (
                <ul className="hs-ticket-list">
                  {tickets.map((ticket) => {
                    const adminReplied = hasAdminReply(ticket);
                    return (
                      <li key={ticket.id}>
                        <button
                          type="button"
                          className={`hs-ticket ${activeTicketId === ticket.id ? 'is-active' : ''}`}
                          onClick={() => setActiveTicketId(ticket.id)}
                        >
                          <div className="hs-ticket-top">
                            <strong>{ticket.topic}</strong>
                            <em className={`support-status ${STATUS_CLASS[ticket.status] || ''}`}>
                              {ticket.status_label}
                            </em>
                          </div>
                          <span className="hs-ticket-preview">{lastPreview(ticket)}</span>
                          <div className="hs-ticket-meta">
                            <small>{formatWhen(ticket.last_message_at || ticket.created_at)}</small>
                            {adminReplied ? <small className="hs-admin-badge">Desk replied</small> : null}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </aside>

            <section className="hs-chat-pane">
              {!activeTicket ? (
                <div className="hs-chat-blank">
                  <LifeBuoy size={28} strokeWidth={1.6} />
                  <h3>Select a conversation</h3>
                  <p>Open a request on the left to read NovelCheckr Support replies and send your own messages.</p>
                </div>
              ) : (
                <>
                  <div className="hs-chat-pane-head">
                    <div>
                      <p className="hs-kicker">Request #{activeTicket.id}</p>
                      <h3>{activeTicket.topic}</h3>
                      <p>
                        {activeTicket.category_label}
                        {activeTicket.order_title ? ` · ${activeTicket.order_title}` : ''}
                        {' · '}
                        <em className={`support-status ${STATUS_CLASS[activeTicket.status] || ''}`}>
                          {activeTicket.status_label}
                        </em>
                      </p>
                    </div>
                  </div>

                  <div className="hs-chat-stream" role="log" aria-live="polite">
                    {activeMessages.map((msg) => {
                      const isAdmin = msg.sender_role === 'admin';
                      return (
                        <div
                          key={msg.id}
                          className={`hs-msg ${isAdmin ? 'is-admin' : 'is-user'}`}
                        >
                          <div className={`hs-msg-avatar ${isAdmin ? 'is-admin' : 'is-user'}`} aria-hidden="true">
                            {isAdmin ? 'NC' : 'You'}
                          </div>
                          <div className="hs-msg-bubble">
                            <div className="hs-msg-meta">
                              <strong>{isAdmin ? 'NovelCheckr Support' : 'You'}</strong>
                              <span>{formatWhen(msg.created_at)}</span>
                            </div>
                            <p>{msg.body}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>

                  {activeTicket.status === 'resolved' ? (
                    <div className="hs-composer is-locked">
                      <p>This request is resolved. Start a new request if you still need help.</p>
                      <button type="button" className="adm-btn adm-btn-primary" onClick={openCompose}>
                        <Plus size={15} /> New request
                      </button>
                    </div>
                  ) : (
                    <form className="hs-composer" onSubmit={handleReply}>
                      {replyError ? <div className="support-banner is-error" role="alert">{replyError}</div> : null}
                      <div className="hs-composer-row">
                        <textarea
                          ref={composerRef}
                          rows={2}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a reply to NovelCheckr Support…"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (replyText.trim() && !replying) {
                                handleReply(e);
                              }
                            }
                          }}
                        />
                        <button
                          type="submit"
                          className="btn btn-primary hs-send-btn"
                          disabled={replying || !replyText.trim()}
                        >
                          <Send size={15} />
                          {replying ? 'Sending…' : 'Send'}
                        </button>
                      </div>
                      <small>Press Enter to send · Shift+Enter for a new line</small>
                    </form>
                  )}
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
