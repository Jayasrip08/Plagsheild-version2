import React, { useEffect, useState, useMemo } from 'react';
import {
  LayoutDashboard,
  FilePlus2,
  History,
  LifeBuoy,
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileText,
  ScanLine,
  ExternalLink,
  RefreshCw,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import api from './api';
import { formatListDate } from './adminListHelpers';
import './user-dashboard.css';

function orderStatusPillClass(status = '') {
  const s = String(status).toLowerCase();
  if (s.includes('ready') || s.includes('completed')) return 'adm-pill tone-emerald';
  if (s.includes('process')) return 'adm-pill tone-blue';
  if (s.includes('pending')) return 'adm-pill tone-amber';
  return 'adm-pill tone-slate';
}

function similarityPillClass(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return 'adm-pill tone-slate';
  if (n < 15) return 'adm-pill tone-emerald';
  if (n <= 25) return 'adm-pill tone-amber';
  return 'adm-pill tone-rose';
}

export default function UserDashboard({
  user: initialUser,
  orders = [],
  loadingOrders = false,
  onRefresh,
  onNewCheck,
  onViewHistory,
  onSelectOrder,
  onTrackOrder,
  onEditProfile,
  onOpenSupport,
}) {
  const [profile, setProfile] = useState(initialUser || {});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setProfile(initialUser || {});
  }, [initialUser]);

  const loadProfile = async () => {
    try {
      const res = await api.get('accounts/profile/');
      if (res?.data) {
        setProfile((prev) => ({ ...prev, ...res.data }));
      }
    } catch (e) {
      console.error('Failed to reload profile in dashboard', e);
    }
  };

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        loadProfile(),
        onRefresh ? onRefresh() : Promise.resolve(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // Metrics calculations
  const metrics = useMemo(() => {
    const total = orders.length;
    const completed = orders.filter(
      (o) => o.status === 'Report Ready' || o.status === 'Completed'
    );
    const inFlight = orders.filter(
      (o) => o.status === 'Submitted' || o.status === 'Processing'
    );
    const pendingPayment = orders.filter((o) => o.status === 'Pending Payment');

    let totalWords = 0;
    let similaritySum = 0;
    let scoredCount = 0;

    orders.forEach((o) => {
      if (Number.isFinite(Number(o.word_count))) {
        totalWords += Number(o.word_count);
      }
      if (
        o.similarity_score !== null &&
        o.similarity_score !== undefined &&
        Number.isFinite(Number(o.similarity_score))
      ) {
        similaritySum += Number(o.similarity_score);
        scoredCount += 1;
      }
    });

    const avgSimilarity = scoredCount > 0 ? (similaritySum / scoredCount).toFixed(1) : null;

    // Package breakdown
    const packages = { check: 0, improve: 0, complete: 0 };
    orders.forEach((o) => {
      const pkg = String(o.package || '').toLowerCase();
      if (pkg.includes('improve')) packages.improve += 1;
      else if (pkg.includes('complete')) packages.complete += 1;
      else packages.check += 1;
    });

    // Active in-flight order spotlight
    const activeOrder = inFlight[0] || pendingPayment[0] || null;

    return {
      total,
      completedCount: completed.length,
      inFlightCount: inFlight.length,
      pendingPaymentCount: pendingPayment.length,
      avgSimilarity,
      totalWords,
      packages,
      activeOrder,
    };
  }, [orders]);

  // Chart data: up to 6 recent completed orders
  const chartData = useMemo(() => {
    const completed = orders
      .filter(
        (o) =>
          (o.status === 'Report Ready' || o.status === 'Completed') &&
          o.similarity_score !== null &&
          o.similarity_score !== undefined
      )
      .slice(0, 6)
      .reverse();

    return completed.map((o) => ({
      name: (o.paper_title || `Order #${o.id}`).slice(0, 16) + (o.paper_title?.length > 16 ? '…' : ''),
      fullTitle: o.paper_title || `Order #${o.id}`,
      score: Number(o.similarity_score) || 0,
      id: o.id,
      date: formatListDate(o.created_at),
    }));
  }, [orders]);

  // Recent 4 submissions
  const recentOrders = useMemo(() => {
    return orders.slice(0, 4);
  }, [orders]);

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();
  const displayName = fullName || profile.username || 'User';

  // Only show skeleton placeholders on the very first load — a background
  // refresh (Refresh button, polling) keeps the last known numbers visible
  // instead of flashing empty cards.
  const isInitialLoading = loadingOrders && orders.length === 0;

  const similarityBand =
    metrics.avgSimilarity === null
      ? null
      : Number(metrics.avgSimilarity) < 15
      ? 'low'
      : Number(metrics.avgSimilarity) <= 25
      ? 'moderate'
      : 'elevated';

  const similarityBarColor =
    similarityBand === 'low' ? '#16a34a' : similarityBand === 'moderate' ? '#d97706' : similarityBand === 'elevated' ? '#dc2626' : '#cbd5e1';

  const similarityBarWidth =
    metrics.avgSimilarity !== null ? `${Math.min(Math.max(Number(metrics.avgSimilarity), 2), 100)}%` : '0%';

  return (
    <div className="ud-page">
      {/* --------------------------------------------------------------------
          1. APPLICATION STANDARD PAGE HEADER
          -------------------------------------------------------------------- */}
      <div className="adm-page-head">
        <div className="adm-page-title-wrap">
          <div className="adm-page-icon">
            <LayoutDashboard size={22} />
          </div>
          <div>
            <h2>Dashboard Overview</h2>
            <p>Welcome back, {displayName} • Monitor your individual details, active scans, and manuscript reports.</p>
          </div>
        </div>
        <div className="adm-page-actions">
          <button
            type="button"
            className="adm-btn adm-btn-secondary"
            onClick={handleRefreshAll}
            disabled={refreshing || loadingOrders}
            title="Refresh dashboard stats"
          >
            <RefreshCw size={15} className={refreshing ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          2. ACTIVE IN-FLIGHT SPOTLIGHT (Application Alert Card)
          -------------------------------------------------------------------- */}
      {metrics.activeOrder && (
        <div className="ud-active-alert">
          <div className="ud-alert-left">
            <div className="ud-alert-icon">
              <ScanLine size={20} />
            </div>
            <div>
              <div className="ud-alert-title">
                {metrics.activeOrder.status === 'Pending Payment'
                  ? 'Payment Pending for Manuscript'
                  : 'Manuscript Analysis In Progress'}
              </div>
              <p className="ud-alert-desc">
                <strong>{metrics.activeOrder.paper_title || `Order #${metrics.activeOrder.id}`}</strong>
                {' • '}
                Status: <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{metrics.activeOrder.status}</span>
                {' • '}
                Submitted {formatListDate(metrics.activeOrder.created_at)}
              </p>
            </div>
          </div>
          <div>
            <button
              type="button"
              className="adm-btn adm-btn-primary"
              onClick={() => onTrackOrder && onTrackOrder(metrics.activeOrder)}
            >
              <ScanLine size={14} /> Track Live Status
            </button>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------
          4. KEY METRIC CARDS (Standard App KPI Cards)
          -------------------------------------------------------------------- */}
      <div className="ud-kpi-grid">
        <div className="ud-kpi-card">
          <div className="ud-kpi-head">
            <span className="ud-kpi-icon tone-slate">
              <Layers size={16} />
            </span>
            <span className="ud-kpi-label">Total Submissions</span>
          </div>
          {isInitialLoading ? (
            <div className="ud-skel ud-skel-number" />
          ) : (
            <div className="ud-kpi-number">{metrics.total}</div>
          )}
          <div className="ud-kpi-subtext">All-time manuscripts checked</div>
        </div>

        <div className="ud-kpi-card">
          <div className="ud-kpi-head">
            <span className="ud-kpi-icon tone-emerald">
              <CheckCircle2 size={16} />
            </span>
            <span className="ud-kpi-label">Reports Ready</span>
          </div>
          {isInitialLoading ? (
            <div className="ud-skel ud-skel-number" />
          ) : (
            <div className="ud-kpi-number tone-emerald-text">{metrics.completedCount}</div>
          )}
          <div className="ud-kpi-subtext">Verified reports available</div>
        </div>

        <div className="ud-kpi-card">
          <div className="ud-kpi-head">
            <span className="ud-kpi-icon tone-amber">
              <Clock size={16} />
            </span>
            <span className="ud-kpi-label">In Progress</span>
          </div>
          {isInitialLoading ? (
            <div className="ud-skel ud-skel-number" />
          ) : (
            <div className="ud-kpi-number tone-amber-text">
              {metrics.inFlightCount + metrics.pendingPaymentCount}
            </div>
          )}
          <div className="ud-kpi-subtext">Under review / pending</div>
        </div>

        <div className="ud-kpi-card">
          <div className="ud-kpi-head">
            <span className="ud-kpi-icon tone-blue">
              <ScanLine size={16} />
            </span>
            <span className="ud-kpi-label">Avg Similarity Rate</span>
          </div>
          {isInitialLoading ? (
            <div className="ud-skel ud-skel-number" />
          ) : (
            <div className="ud-kpi-number tone-blue-text">
              {metrics.avgSimilarity !== null ? `${metrics.avgSimilarity}%` : '—'}
            </div>
          )}
          <div className="ud-kpi-progress-track" aria-hidden="true">
            <div
              className="ud-kpi-progress-fill"
              style={{ width: isInitialLoading ? '0%' : similarityBarWidth, background: similarityBarColor }}
            />
          </div>
          <div className="ud-kpi-subtext">
            {metrics.avgSimilarity !== null ? (
              <span className={similarityPillClass(metrics.avgSimilarity)}>
                {similarityBand === 'low' ? 'Low Risk' : similarityBand === 'moderate' ? 'Moderate' : 'Elevated'}
              </span>
            ) : (
              'Pending scans'
            )}
          </div>
        </div>

        <div className="ud-kpi-card">
          <div className="ud-kpi-head">
            <span className="ud-kpi-icon tone-violet">
              <BookOpen size={16} />
            </span>
            <span className="ud-kpi-label">Words Scanned</span>
          </div>
          {isInitialLoading ? (
            <div className="ud-skel ud-skel-number" />
          ) : (
            <div className="ud-kpi-number">
              {metrics.totalWords > 0 ? metrics.totalWords.toLocaleString() : '0'}
            </div>
          )}
          <div className="ud-kpi-subtext">Total words analyzed</div>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          5. VISUAL ANALYTICS & PACKAGE BREAKDOWN
          -------------------------------------------------------------------- */}
      <div className="ud-split-row">
        {/* Similarity Score Trend Chart */}
        <div className="adm-panel">
          <div className="ud-panel-header">
            <h3>Similarity Score Trend</h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Last {chartData.length} completed checks
            </span>
          </div>

          <div className="ud-chart-container">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: 'var(--text-muted, #64748b)' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: 'var(--text-muted, #64748b)' }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    formatter={(value) => [`${value}% Similarity`, 'Score']}
                    labelFormatter={(label, items) => {
                      const item = items && items[0] ? items[0].payload : null;
                      return item ? `${item.fullTitle} (${item.date})` : label;
                    }}
                    contentStyle={{
                      backgroundColor: 'var(--bg-secondary, #ffffff)',
                      borderColor: 'var(--border-color, #e2e8f0)',
                      borderRadius: '8px',
                      color: 'var(--text-main, #0f172a)',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    }}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={45}>
                    {chartData.map((entry, index) => {
                      const color =
                        entry.score < 15
                          ? '#16a34a'
                          : entry.score <= 25
                          ? '#d97706'
                          : '#dc2626';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', textAlign: 'center' }}>
                <TrendingUp size={32} strokeWidth={1.5} style={{ marginBottom: '8px' }} />
                <p style={{ fontSize: '13px', margin: 0 }}>No completed scan scores available yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Packages Used Breakdown */}
        <div className="adm-panel">
          <div className="ud-panel-header">
            <h3>Packages Used</h3>
          </div>

          <div className="ud-pkg-list">
            <div className="ud-pkg-row">
              <div className="ud-pkg-row-left">
                <span className="ud-dot blue" />
                <span>Plagiarism Check</span>
              </div>
              <span className="ud-pkg-row-count">{metrics.packages.check}</span>
            </div>

            <div className="ud-pkg-row">
              <div className="ud-pkg-row-left">
                <span className="ud-dot violet" />
                <span>Check + Express</span>
              </div>
              <span className="ud-pkg-row-count">{metrics.packages.improve}</span>
            </div>

            <div className="ud-pkg-row">
              <div className="ud-pkg-row-left">
                <span className="ud-dot emerald" />
                <span>Complete Package</span>
              </div>
              <span className="ud-pkg-row-count">{metrics.packages.complete}</span>
            </div>

            <div style={{ marginTop: '14px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
              💡 <strong>Turnaround Guarantee:</strong> Reports delivered within 60 minutes for standard scans and 30 minutes for Express checks.
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          6. RECENT SUBMISSIONS TABLE (Application Standard Table)
          -------------------------------------------------------------------- */}
      <div className="adm-panel">
        <div className="ud-panel-header">
          <h3>Recent Submissions</h3>
          {orders.length > 0 && (
            <button
              type="button"
              className="adm-btn adm-btn-secondary"
              onClick={onViewHistory}
              style={{ height: '32px', fontSize: '12px' }}
            >
              View Full History ({orders.length}) <ArrowRight size={13} />
            </button>
          )}
        </div>

        {recentOrders.length > 0 ? (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Manuscript Title</th>
                  <th>Submitted</th>
                  <th>Package</th>
                  <th>Status</th>
                  <th>Similarity</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => {
                  const hasScore =
                    order.similarity_score !== null &&
                    order.similarity_score !== undefined &&
                    Number.isFinite(Number(order.similarity_score));

                  return (
                    <tr key={order.id}>
                      <td>
                        <div>
                          <strong className="adm-strong" style={{ maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {order.paper_title || 'Untitled Manuscript'}
                          </strong>
                          <span className="adm-muted" style={{ fontFamily: 'var(--mono, monospace)' }}>
                            Order #{order.id}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="adm-muted">{formatListDate(order.created_at)}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#334155' }}>
                          {order.package_label || order.package || 'Standard Check'}
                        </span>
                      </td>
                      <td>
                        <span className={orderStatusPillClass(order.status)}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        {hasScore ? (
                          <span className={similarityPillClass(order.similarity_score)}>
                            {order.similarity_score}%
                          </span>
                        ) : (
                          <span className="adm-muted">—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            type="button"
                            className="adm-btn adm-btn-secondary"
                            style={{ height: '32px', padding: '0 10px', fontSize: '12px' }}
                            onClick={() => onSelectOrder && onSelectOrder(order)}
                            title="View details"
                          >
                            <ExternalLink size={13} /> Details
                          </button>
                          {(order.status === 'Submitted' || order.status === 'Processing') && (
                            <button
                              type="button"
                              className="adm-btn adm-btn-secondary"
                              style={{ height: '32px', padding: '0 10px', fontSize: '12px', color: '#1570ef', borderColor: '#bfdbfe' }}
                              onClick={() => onTrackOrder && onTrackOrder(order)}
                              title="Track status"
                            >
                              <ScanLine size={13} /> Track
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '36px 20px', textAlign: 'center', color: '#94a3b8' }}>
            <FileText size={32} strokeWidth={1.5} style={{ marginBottom: '8px' }} />
            <p style={{ fontSize: '13px', margin: '0 0 12px' }}>You haven't submitted any manuscripts yet.</p>
            <button
              type="button"
              className="adm-btn adm-btn-primary"
              onClick={onNewCheck}
            >
              <FilePlus2 size={15} /> Start Your First Check
            </button>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------
          7. BOTTOM SUPPORT & ASSURANCE CARDS
          -------------------------------------------------------------------- */}
      <div className="ud-bottom-cards">
        <div className="ud-bottom-card">
          <div className="ud-bottom-icon">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h4>Confidential & Non-Repository</h4>
            <p>
              Your document is analyzed via direct licensed plagiarism databases. It is never stored in public or institutional repositories, ensuring 100% author confidentiality.
            </p>
          </div>
        </div>

        <div className="ud-bottom-card">
          <div className="ud-bottom-icon">
            <LifeBuoy size={22} />
          </div>
          <div>
            <h4>Need Help or Report Clarification?</h4>
            <p>
              Our academic verification team is here to assist with report interpretation, similarity breakdowns, and payment questions.
            </p>
            <button
              type="button"
              className="adm-btn adm-btn-secondary"
              onClick={onOpenSupport}
              style={{ height: '32px', fontSize: '12px' }}
            >
              <LifeBuoy size={14} /> Open Support Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
