import { useEffect, useMemo, useState } from 'react';
import api from './api';

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

export default function SupportInbox({ onCountChange }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [updating, setUpdating] = useState(false);

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

  const selected = useMemo(
    () => tickets.find((item) => item.id === selectedId) || null,
    [tickets, selectedId]
  );

  const updateStatus = async (ticketId, nextStatus) => {
    setUpdating(true);
    try {
      await api.patch(`support/tickets/${ticketId}/`, { status: nextStatus });
      await fetchInbox();
    } catch (e) {
      setError(e.response?.data?.error || 'Unable to update this request.');
    } finally {
      setUpdating(false);
    }
  };

  const visible = filter === 'all' ? tickets : tickets.filter((item) => item.status === filter);

  return (
    <div className="support-inbox">
      <div className="support-inbox-head">
        <div>
          <h2>Help &amp; Support</h2>
          <p>Queries submitted by students and college admins, with full message and account details.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={fetchInbox}>
          Refresh
        </button>
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

      {error && <div className="support-banner is-error" role="alert">{error}</div>}

      {loading ? (
        <div className="spinner" />
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
                    className={selectedId === ticket.id ? 'is-selected' : ''}
                    onClick={() => setSelectedId(ticket.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>#{ticket.id}</td>
                    <td className="cell-stack">
                      <strong>{ticket.user_name || ticket.user_username}</strong>
                      <span>{ticket.user_email || ticket.user_username}</span>
                    </td>
                    <td>{ticket.category_label}</td>
                    <td>{ticket.topic}</td>
                    <td>{formatWhen(ticket.created_at)}</td>
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
                <div>
                  <dt>Message</dt>
                  <dd className="support-inbox-message">{selected.message}</dd>
                </div>
              </dl>
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
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
