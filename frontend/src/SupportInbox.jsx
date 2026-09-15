import { useEffect, useMemo, useState } from 'react';
import { Search, Send } from 'lucide-react';
import api from './api';
import SectionLoader from './SectionLoader';
import { matchesSearch } from './adminListHelpers';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'in_review', label: 'In review' },
  { id: 'resolved', label: 'Resolved' },
];

const ROLE_LABELS = {
  b2c_student: 'Independent researcher',
  b2b_student: 'Institutional student',
  college_admin: 'College administrator',
  super_admin: 'Administrator',
};

function asTicketList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function formatWhen(value) {
  if (!value) return '—';
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

function threadMessages(ticket) {
  if (Array.isArray(ticket?.messages) && ticket.messages.length > 0) {
    return ticket.messages;
  }
  if (ticket?.message) {
    return [{
      id: `seed-${ticket.id}`,
      sender_role: 'user',
      sender_name: ticket.user_name || ticket.user_username || 'User',
      body: ticket.message,
      created_at: ticket.created_at,
    }];
  }
  return [];
}

export default function SupportInbox({ onCountChange }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const fetchInbox = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('support/inbox/');
      const list = asTicketList(res.data);
      setTickets(list);
      if (onCountChange) {
        onCountChange(list.filter((item) => item.status !== 'resolved').length);
      }
      setSelectedId((current) => {
        if (current && list.some((item) => item.id === current)) return current;
        return list[0]?.id || null;
      });
    } catch (e) {
      console.error('Failed to load support inbox', e);
      setTickets([]);
      setSelectedId(null);
      const statusCode = e.response?.status;
      setError(
        statusCode === 403
          ? 'This account cannot open the support inbox. Sign in as Super Admin.'
          : (e.response?.data?.error || 'Unable to load Help & Support queries.')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setReply('');
  }, [selectedId]);

  const visible = useMemo(() => {
    return tickets.filter((item) => {
      if (filter !== 'all' && item.status !== filter) return false;
      return matchesSearch(
        search,
        item.id,
        item.topic,
        item.message,
        item.category_label,
        item.status_label,
        item.user_name,
        item.user_username,
        item.user_email,
        item.user_phone,
        item.order_title,
        item.order,
      );
    });
  }, [tickets, filter, search]);

  const selected = useMemo(
    () => visible.find((item) => item.id === selectedId) || visible[0] || null,
    [visible, selectedId]
  );

  useEffect(() => {
    if (!selected) {
      setSelectedId(null);
      return;
    }
    if (selectedId !== selected.id) setSelectedId(selected.id);
  }, [selected, selectedId]);

  const updateStatus = async (ticketId, nextStatus) => {
    setUpdating(true);
    try {
      const res = await api.patch(`support/tickets/${ticketId}/`, { status: nextStatus });
      setTickets((prev) => prev.map((item) => (item.id === ticketId ? res.data : item)));
      if (onCountChange) {
        const next = tickets.map((item) => (item.id === ticketId ? res.data : item));
        onCountChange(next.filter((item) => item.status !== 'resolved').length);
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Unable to update this request.');
    } finally {
      setUpdating(false);
    }
  };

  const sendReply = async (e) => {
    e.preventDefault();
    if (!selected || !reply.trim()) return;
    setSending(true);
    setError('');
    try {
      const res = await api.post(`support/tickets/${selected.id}/messages/`, { body: reply.trim() });
      const updated = res.data?.ticket || res.data;
      setTickets((prev) => prev.map((item) => (item.id === selected.id ? updated : item)));
      setReply('');
      if (onCountChange) {
        const next = tickets.map((item) => (item.id === selected.id ? updated : item));
        onCountChange(next.filter((item) => item.status !== 'resolved').length);
      }
    } catch (err) {
      const data = err.response?.data;
      const first = data && typeof data === 'object' ? Object.values(data).flat()[0] : null;
      setError(first || data?.error || 'Unable to send reply.');
    } finally {
      setSending(false);
    }
  };

  const messages = threadMessages(selected);

  return (
    <div className="support-inbox">
      <div className="support-inbox-head">
        <div>
          <h2>Help &amp; Support</h2>
          <p>Reply to student and college queries in a live conversation thread.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={fetchInbox}>
          Refresh
        </button>
      </div>

      <div className="support-inbox-toolbar">
        <div className="support-inbox-search">
          <Search size={15} />
          <input
            type="search"
            placeholder="Search by topic, user, email, or request ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="support-inbox-filters">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={filter === item.id ? 'is-active' : ''}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
              {item.id === 'all' ? ` (${tickets.length})` : ''}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="support-banner is-error" role="alert">{error}</div>}

      {loading ? (
        <SectionLoader label="Loading support tickets…" />
      ) : visible.length === 0 ? (
        <div className="glass-card">No Help & Support queries in this view yet.</div>
      ) : (
        <div className="support-inbox-layout">
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>From</th>
                  <th>Category</th>
                  <th>Topic</th>
                  <th>Submitted</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className={selected?.id === ticket.id ? 'is-selected' : ''}
                    onClick={() => setSelectedId(ticket.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>#{ticket.id}</td>
                    <td className="cell-stack">
                      <strong>{ticket.user_name || ticket.user_username}</strong>
                      <span>{ticket.user_email || ticket.user_username}</span>
                    </td>
                    <td>{ticket.category_label}</td>
                    <td>
                      <div className="cell-stack">
                        <strong>{ticket.topic}</strong>
                        <span>{ticket.message_count || 1} message{(ticket.message_count || 1) === 1 ? '' : 's'}</span>
                      </div>
                    </td>
                    <td>{formatWhen(ticket.last_message_at || ticket.created_at)}</td>
                    <td>
                      <em className={`support-status ${ticket.status === 'in_review' ? 'is-review' : `is-${ticket.status}`}`}>
                        {ticket.status_label}
                      </em>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selected && (
            <aside className="support-inbox-detail">
              <p className="support-kicker">Request #{selected.id}</p>
              <h3>{selected.topic}</h3>
              <p className="support-inbox-meta">
                {selected.category_label} · {formatWhen(selected.created_at)}
              </p>
              <dl>
                <div>
                  <dt>Submitted by</dt>
                  <dd>
                    {selected.user_name || selected.user_username}
                    <small>
                      @{selected.user_username} · {ROLE_LABELS[selected.user_role] || selected.user_role || 'User'}
                    </small>
                    <small>{selected.user_email || 'No email'}</small>
                    {selected.user_phone ? <small>{selected.user_phone}</small> : null}
                  </dd>
                </div>
                <div>
                  <dt>Linked submission</dt>
                  <dd>{selected.order_title || (selected.order ? `Order #${selected.order}` : 'None')}</dd>
                </div>
              </dl>

              <div className="support-thread">
                <h4>Conversation</h4>
                <div className="support-thread-list">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`support-bubble ${msg.sender_role === 'admin' ? 'is-admin' : 'is-user'}`}
                    >
                      <div className="support-bubble-meta">
                        <strong>{msg.sender_role === 'admin' ? 'NovelCheckr Support' : (msg.sender_name || 'User')}</strong>
                        <span>{formatWhen(msg.created_at)}</span>
                      </div>
                      <p>{msg.body}</p>
                    </div>
                  ))}
                </div>

                <form className="support-reply" onSubmit={sendReply}>
                  <label>
                    <span>Reply to user</span>
                    <textarea
                      rows={4}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Write a clear reply the user will see in their Support page…"
                    />
                  </label>
                  <button type="submit" className="btn btn-primary" disabled={sending || !reply.trim()}>
                    <Send size={14} />
                    {sending ? 'Sending…' : 'Send reply'}
                  </button>
                </form>
              </div>

              <div className="support-inbox-actions">
                {selected.status === 'open' && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={updating}
                    onClick={() => updateStatus(selected.id, 'in_review')}
                  >
                    Mark in review
                  </button>
                )}
                {selected.status !== 'resolved' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={updating}
                    onClick={() => updateStatus(selected.id, 'resolved')}
                  >
                    Resolve
                  </button>
                )}
                {selected.status === 'resolved' && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={updating}
                    onClick={() => updateStatus(selected.id, 'open')}
                  >
                    Reopen
                  </button>
                )}
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
