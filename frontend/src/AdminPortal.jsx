import React, { useState, useEffect } from 'react';
import api, { logout } from './api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Download,
  FileText,
  Upload,
  CheckCircle2,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  Clock,
  History,
  Users,
  BadgeIndianRupee,
  LifeBuoy,
  Shield,
  LogOut
} from 'lucide-react';
import SubmissionRecord, { paymentOf, paymentStatusLabel } from './SubmissionRecord';
import SupportInbox from './SupportInbox';
import logoImage from './images/nc.png';

export default function AdminPortal({ user }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      return window.localStorage.getItem('novelcheckr-admin-sidebar-open') !== 'false';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('novelcheckr-admin-sidebar-open', String(sidebarOpen));
    } catch {
      /* ignore */
    }
  }, [sidebarOpen]);

  // Pending queue
  const [queue, setQueue] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [completeForm, setCompleteForm] = useState({ similarity_score: '', report_file: null });
  const [updatingOrder, setUpdatingOrder] = useState(false);

  // College management
  const [colleges, setColleges] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [collegeSubTab, setCollegeSubTab] = useState('list'); // 'list', 'create', 'allocate'
  const [newCollege, setNewCollege] = useState({ college_name: '', credits: 100, contact_email: '', admin_username: '', admin_password: '' });
  const [addingCollege, setAddingCollege] = useState(false);
  const [allocateData, setAllocateData] = useState({ college_id: '', credits: '', admin_username: '', admin_email: '', admin_password: '' });
  const [allocatingCredits, setAllocatingCredits] = useState(false);

  // User management
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState(null);

  // Pricing configs
  const [pricing, setPricing] = useState({ per_word_rate: '', express_fee: '', editing_suggestions_fee: '' });
  const [updatingPricing, setUpdatingPricing] = useState(false);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [supportTickets, setSupportTickets] = useState([]);
  const [loadingSupport, setLoadingSupport] = useState(false);
  const [supportOpenCount, setSupportOpenCount] = useState(0);

  useEffect(() => {
    fetchStats();
    fetchQueue();
    fetchColleges();
    fetchUsers();
    fetchPricing();
    fetchSupportInbox();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.get('analytics/dashboard/');
      setStats(res.data);
    } catch (e) {
      console.error("Failed to load superadmin stats", e);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchQueue = async () => {
    setLoadingQueue(true);
    try {
      const res = await api.get('orders/super/queue/');
      setQueue(res.data);
    } catch (e) {
      console.error("Failed to fetch pending queue", e);
    } finally {
      setLoadingQueue(false);
    }
  };

  const fetchColleges = async () => {
    setLoadingColleges(true);
    try {
      const res = await api.get('colleges/');
      setColleges(res.data);
    } catch (e) {
      console.error("Failed to load colleges list", e);
    } finally {
      setLoadingColleges(false);
    }
  };

  const fetchUsers = async (search = '') => {
    setLoadingUsers(true);
    try {
      const res = await api.get('accounts/super/users/', {
        params: search ? { search } : {}
      });
      setUsers(res.data);
    } catch (e) {
      console.error("Failed to search users list", e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchPricing = async () => {
    try {
      const res = await api.get('orders/pricing/');
      setPricing(res.data);
    } catch (e) {
      console.error("Failed to fetch pricing config", e);
    }
  };

  const fetchHistory = async (query = historySearch.trim()) => {
    setLoadingHistory(true);
    try {
      const params = {};
      if (query) params.search = query;
      const res = await api.get('orders/', { params });
      setHistoryOrders(res.data);
      setSelectedHistoryOrder(null);
    } catch (e) {
      console.error("Failed to load order history", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleHistorySearchSubmit = (e) => {
    e.preventDefault();
    fetchHistory(historySearch.trim());
  };

  const fetchSupportInbox = async () => {
    setLoadingSupport(true);
    try {
      const res = await api.get('support/inbox/');
      const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      setSupportTickets(list);
      setSupportOpenCount(list.filter((item) => item.status !== 'resolved').length);
    } catch (e) {
      console.error('Failed to load support inbox', e);
    } finally {
      setLoadingSupport(false);
    }
  };

  const updateSupportStatus = async (ticketId, nextStatus) => {
    try {
      await api.patch(`support/tickets/${ticketId}/`, { status: nextStatus });
      fetchSupportInbox();
    } catch (e) {
      console.error('Failed to update support request', e);
      alert('Unable to update this request.');
    }
  };

  const handleStartProcessing = async (orderId) => {
    try {
      await api.post(`orders/super/${orderId}/update/`, { action: 'start_processing' });
      alert("Order status changed to Processing.");
      fetchQueue();
    } catch (e) {
      console.error("Failed to change status", e);
    }
  };

  const handleCompleteOrderSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !completeForm.report_file) return;
    setUpdatingOrder(true);

    const formData = new FormData();
    formData.append('action', 'complete');
    formData.append('similarity_score', completeForm.similarity_score);
    formData.append('report_file', completeForm.report_file);

    try {
      await api.post(`orders/super/${selectedOrder.id}/update/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(`Order #${selectedOrder.id} completed. Notifications sent successfully.`);
      setSelectedOrder(null);
      setCompleteForm({ similarity_score: '', report_file: null });
      fetchQueue();
      fetchStats();
    } catch (e) {
      console.error("Failed to complete check", e);
      alert("Error completing check. Check values.");
    } finally {
      setUpdatingOrder(false);
    }
  };

  const handleCreateCollege = async (e) => {
    e.preventDefault();
    setAddingCollege(true);
    try {
      const colRes = await api.post('colleges/', {
        college_name: newCollege.college_name,
        credits: newCollege.credits,
        contact_email: newCollege.contact_email
      });
      
      // If admin username specified, allocate admin
      if (newCollege.admin_username && colRes.data.id) {
        await api.post(`colleges/${colRes.data.id}/allocate-credits/`, {
          credits: 0,
          admin_username: newCollege.admin_username,
          admin_email: newCollege.contact_email,
          admin_password: newCollege.admin_password
        });
      }

      alert(`College '${newCollege.college_name}' registered successfully!`);
      setNewCollege({ college_name: '', credits: 100, contact_email: '', admin_username: '', admin_password: '' });
      fetchColleges();
      fetchStats();
    } catch (e) {
      console.error("Failed to register college", e);
      alert("Error creating college.");
    } finally {
      setAddingCollege(false);
    }
  };

  const handleAllocateCredits = async (e) => {
    e.preventDefault();
    if (!allocateData.college_id || !allocateData.credits) return;
    setAllocatingCredits(true);
    try {
      await api.post(`colleges/${allocateData.college_id}/allocate-credits/`, {
        credits: allocateData.credits,
        admin_username: allocateData.admin_username,
        admin_email: allocateData.admin_email,
        admin_password: allocateData.admin_password
      });
      alert("Allocated credits successfully!");
      setAllocateData({ college_id: '', credits: '', admin_username: '', admin_email: '', admin_password: '' });
      fetchColleges();
      fetchStats();
    } catch (e) {
      console.error("Failed to allocate credits", e);
      alert("Error allocating credits.");
    } finally {
      setAllocatingCredits(false);
    }
  };

  const handleToggleUserBlock = async (userId) => {
    try {
      const res = await api.post(`accounts/super/users/${userId}/block/`);
      alert(res.data.message);
      fetchUsers(searchUser);
    } catch (e) {
      console.error("Failed to toggle block status", e);
      alert("Cannot block superadmin user.");
    }
  };

  const handlePricingSubmit = async (e) => {
    e.preventDefault();
    setUpdatingPricing(true);
    try {
      await api.post('orders/pricing/', pricing);
      alert("Pricing configuration saved successfully!");
      fetchPricing();
    } catch (e) {
      console.error("Failed to save pricing configuration", e);
      alert("Failed to save. Check fields.");
    } finally {
      setUpdatingPricing(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(searchUser);
  };

  return (
    <div className={`dashboard-layout has-app-sidebar ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      {/* Sidebar Navigation */}
      <aside className={`sidebar app-sidebar ${sidebarOpen ? '' : 'is-collapsed'}`}>
        <div className="app-sidebar-top">
          <div className="logo">
            <span className="logo-mark">
              <img src={logoImage} alt="NovelCheckr" />
            </span>
            <div className="logo-copy">
              <span className="logo-text">NovelCheckr</span>
              <span className="logo-sub">Super Admin</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            title={sidebarOpen ? 'Collapse' : 'Expand'}
          >
            {sidebarOpen ? <PanelLeftClose size={16} strokeWidth={2} /> : <PanelLeftOpen size={16} strokeWidth={2} />}
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Admin">
          <button className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')} title="Dashboard">
            <span className="nav-ico"><LayoutDashboard size={18} strokeWidth={2} /></span>
            <span className="nav-label">Dashboard</span>
          </button>
          <button className={`nav-link ${activeTab === 'queue' ? 'active' : ''}`} onClick={() => { setActiveTab('queue'); fetchQueue(); }} title="Queue">
            <span className="nav-ico"><Clock size={18} strokeWidth={2} /></span>
            <span className="nav-label">Queue</span>
            {queue.length > 0 && <span className="nav-badge">{queue.length}</span>}
          </button>
          <button className={`nav-link ${activeTab === 'history' ? 'active' : ''}`} onClick={() => { setActiveTab('history'); fetchHistory(); }} title="History">
            <span className="nav-ico"><History size={18} strokeWidth={2} /></span>
            <span className="nav-label">History</span>
          </button>
          <button className={`nav-link ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')} title="Users">
            <span className="nav-ico"><Users size={18} strokeWidth={2} /></span>
            <span className="nav-label">Users</span>
          </button>
          <button className={`nav-link ${activeTab === 'pricing' ? 'active' : ''}`} onClick={() => setActiveTab('pricing')} title="Pricing">
            <span className="nav-ico"><BadgeIndianRupee size={18} strokeWidth={2} /></span>
            <span className="nav-label">Pricing</span>
          </button>
          <button className={`nav-link ${activeTab === 'support' ? 'active' : ''}`} onClick={() => { setActiveTab('support'); fetchSupportInbox(); }} title="Support">
            <span className="nav-ico"><LifeBuoy size={18} strokeWidth={2} /></span>
            <span className="nav-label">Support</span>
            {(supportOpenCount || supportTickets.filter((t) => t.status !== 'resolved').length) > 0 && (
              <span className="nav-badge">{supportOpenCount || supportTickets.filter((t) => t.status !== 'resolved').length}</span>
            )}
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="secure-card" title="Admin console">
            <span className="nav-ico"><Shield size={16} strokeWidth={2} /></span>
            <div className="secure-card-copy">
              <strong>Admin</strong>
            </div>
          </div>
          <button className="sidebar-logout" onClick={logout} title="Logout">
            <span className="nav-ico"><LogOut size={18} strokeWidth={2} /></span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="workspace">
      <main className="dashboard-main">
        
        {/* TAB 1: BI DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 style={{ fontSize: '30px', marginBottom: '6px' }}>Business Intelligence</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
              Real-time transactional revenue performance, operational queues sizes, and growths.
            </p>

            {loadingStats ? (
              <div className="spinner"></div>
            ) : stats && (
              <div>
                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                  
                  <div className="glass-card">
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Today's Orders
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.today_orders}</div>
                    <div style={{ color: 'var(--secondary)', fontSize: '12px', marginTop: '6px' }}>New submissions</div>
                  </div>

                  <div className="glass-card">
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Total Revenue
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--success)' }}>
                      ₹{stats.total_revenue.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      Individual Orders
                    </div>
                  </div>

                  <div className="glass-card">
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Pending Queue Checks
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--warning)' }}>{stats.pending_checks}</div>
                    <div style={{ color: 'var(--warning)', fontSize: '12px', marginTop: '6px' }}>Needs Turnitin upload</div>
                  </div>

                  <div className="glass-card">
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Registered Users
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                      {stats.total_registered_users}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '6px' }}>Total client accounts</div>
                  </div>
                </div>

                {/* Revenue Charts and Spenders */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px' }}>
                  
                  {/* Revenue Growth Trend */}
                  <div className="glass-card" style={{ minHeight: '350px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '18px' }}>Revenue Chart</h3>
                      <div style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                        MoM Growth: {stats.mom_growth_percent}%
                      </div>
                    </div>
                    <div style={{ width: '100%', height: '260px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.monthly_trends}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="month" stroke="var(--text-muted)" />
                          <YAxis stroke="var(--text-muted)" unit="₹" />
                          <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} />
                          <Legend />
                          <Bar dataKey="B2C" name="Total Revenue" fill="var(--primary)" stackId="a" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Top Spenders */}
                  <div className="glass-card" style={{ minHeight: '350px' }}>
                    <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Top Spenders</h3>
                    {stats.top_spenders.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)' }}>No spending accounts recorded.</p>
                    ) : (
                      <div className="table-container">
                        <table className="custom-table" style={{ fontSize: '13px' }}>
                          <thead>
                            <tr>
                              <th>User</th>
                              <th>Total Spent</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.top_spenders.map(spender => (
                              <tr key={spender.id}>
                                <td>
                                  <strong>{spender.username}</strong>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{spender.email}</div>
                                </td>
                                <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>
                                  ₹{spender.total_spend.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PENDING QUEUE */}
        {activeTab === 'queue' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '26px' }}>Pending Checks Queue</h2>
              <button className="btn btn-secondary" onClick={fetchQueue}>
                Refresh Queue
              </button>
            </div>

            {loadingQueue ? (
              <div className="spinner"></div>
            ) : queue.length === 0 ? (
              <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                🎉 Great! The verification queue is currently empty.
              </div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Queue priority</th>
                      <th>Order ID</th>
                      <th>Manuscript</th>
                      <th>Author</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Document</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.map(order => {
                      const pay = paymentOf(order);
                      return (
                      <tr 
                        key={order.id}
                        style={{
                          backgroundColor: order.is_express ? 'rgba(6, 182, 212, 0.03)' : 'inherit'
                        }}
                      >
                        <td>
                          {order.package_tier === 'complete' || order.has_editing_suggestions ? (
                            <span style={{ fontSize: '11px', padding: '4px 10px', background: '#eff6ff', color: '#1570ef', border: '1px solid #93c5fd', borderRadius: '4px', fontWeight: '700', whiteSpace: 'nowrap', display: 'inline-block' }}>
                              COMPLETE
                            </span>
                          ) : order.package_tier === 'improve' || order.is_express ? (
                            <span style={{ fontSize: '11px', padding: '4px 10px', background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', borderRadius: '4px', fontWeight: '700', whiteSpace: 'nowrap', display: 'inline-block' }}>
                              IMPROVE
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500' }}>Check</span>
                          )}
                        </td>
                        <td>#{order.id}</td>
                        <td className="cell-stack">
                          <strong>{order.paper_title || order.document?.split('/').pop()}</strong>
                          <span>{order.user_details?.username} · {order.user_details?.email}</span>
                        </td>
                        <td className="cell-stack">
                          <strong>{order.author_name || '—'}</strong>
                          <span>{order.author_email || order.author_institution || ''}</span>
                        </td>
                        <td className="cell-stack">
                          <strong>{paymentStatusLabel(order)}</strong>
                          <span className="mono-id">{pay?.razorpay_payment_id || pay?.razorpay_order_id || '—'}</span>
                        </td>
                        <td>
                          <span className={`badge badge-${order.status.toLowerCase().replace(' ', '-')}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={async () => {
                              try {
                                const response = await api.get(order.document, { responseType: 'blob' });
                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', order.document.split('/').pop());
                                document.body.appendChild(link);
                                link.click();
                                link.remove();
                              } catch (err) {
                                window.open(order.document, '_blank');
                              }
                            }}
                          >
                            <Download size={14} /> Download
                          </button>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {order.status === 'Submitted' && (
                              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleStartProcessing(order.id)}>
                                Start Processing
                              </button>
                            )}
                            <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setSelectedOrder(order)}>
                              Complete
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ORDER HISTORY */}
        {activeTab === 'history' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ minWidth: '280px', flex: '1 1 360px' }}>
                <h2 style={{ fontSize: '26px' }}>Order History</h2>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', width: '100%', maxWidth: '520px' }}>
                <form onSubmit={handleHistorySearchSubmit} style={{ display: 'flex', flex: '1 1 260px', gap: '10px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search document name or user ID"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" style={{ minWidth: '120px' }}>
                    Search
                  </button>
                </form>
                <button className="btn btn-secondary" onClick={() => { setHistorySearch(''); fetchHistory(); }}>
                  Refresh
                </button>
              </div>
            </div>

            {loadingHistory ? (
              <div className="spinner"></div>
            ) : (
              <div style={{ marginBottom: '20px', color: 'var(--text-muted)', fontSize: '14px' }}>
                Showing <strong>{historyOrders.length}</strong> orders{historySearch ? ` · Search: "${historySearch}"` : ''}
              </div>
            )}
            {loadingHistory ? null : historyOrders.length === 0 ? (
              <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No order history is available yet.
              </div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Manuscript</th>
                      <th>Author</th>
                      <th>Razorpay payment ID</th>
                      <th>Transaction ID</th>
                      <th>Payment</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyOrders.map(order => {
                      const pay = paymentOf(order);
                      return (
                      <tr
                        key={order.id}
                        className={`table-row-clickable ${selectedHistoryOrder?.id === order.id ? 'selected is-selected' : ''}`}
                        onClick={() => setSelectedHistoryOrder(order)}
                      >
                        <td>#{order.id}</td>
                        <td className="cell-stack">
                          <strong>{order.paper_title || order.document?.split('/').pop() || 'N/A'}</strong>
                          <span>{order.user_details?.username || order.user} · {order.package_label || 'Check'}</span>
                        </td>
                        <td className="cell-stack">
                          <strong>{order.author_name || '—'}</strong>
                          <span>{order.author_email || ''}</span>
                        </td>
                        <td className="mono-id">{pay?.razorpay_payment_id || '—'}</td>
                        <td className="mono-id">{pay?.transaction_id || '—'}</td>
                        <td>{paymentStatusLabel(order)}</td>
                        <td>₹{parseFloat(order.price || 0).toFixed(2)}</td>
                        <td>
                          <span className={`badge badge-${order.status.toLowerCase().replace(' ', '-')}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {selectedHistoryOrder && (
              <div className="record-card">
                <div className="record-card-head">
                  <div>
                    <h3>Order #{selectedHistoryOrder.id}</h3>
                    <p>Full manuscript, author, and Razorpay transaction record.</p>
                  </div>
                  <button className="btn btn-secondary" onClick={() => setSelectedHistoryOrder(null)}>
                    Clear Selection
                  </button>
                </div>
                <SubmissionRecord order={selectedHistoryOrder} variant="admin" />
              </div>
            )}
          </div>
        )}

        {/* TAB 4: COLLEGES MANAGER */}
        {activeTab === 'colleges' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '26px' }}>Colleges Management</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                Manage registered institutional accounts, allocate B2B credits, and create college admins.
              </p>
            </div>

            {/* Sub-tab 1: Directory List */}
            {collegeSubTab === 'list' && (
              <div className="glass-card">
                <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Registered Institutional Accounts</h3>
                {loadingColleges ? (
                  <div className="spinner"></div>
                ) : colleges.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No colleges registered yet. Click "Register College" to add one.
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Institution Name</th>
                          <th>Billing Contact</th>
                          <th>Credit Balance</th>
                          <th>Admin Account</th>
                          <th>Registered Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {colleges.map(c => (
                          <tr key={c.id}>
                            <td>#{c.id}</td>
                            <td>
                              <strong>{c.college_name}</strong>
                            </td>
                            <td>{c.contact_email}</td>
                            <td>
                              <strong style={{ fontSize: '15px', color: 'var(--primary)' }}>{c.credits} Credits</strong>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Allocated: {c.allocated_credits}</div>
                            </td>
                            <td>
                              {c.admin_username ? (
                                <div>
                                  <strong>@{c.admin_username}</strong>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.admin_email}</div>
                                </div>
                              ) : (
                                <span style={{ color: 'var(--danger)', fontSize: '12px' }}>Unassigned</span>
                              )}
                            </td>
                            <td>{new Date(c.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Sub-tab 2: Register New College Form */}
            {collegeSubTab === 'create' && (
              <div className="glass-card">
                <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Register New Institutional Account</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
                  Add a new college or university to issue B2B verification credits.
                </p>
                <form onSubmit={async (e) => { await handleCreateCollege(e); setCollegeSubTab('list'); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label">College / Institution Name</label>
                    <input type="text" placeholder="e.g. Stanford University" className="form-control" required value={newCollege.college_name} onChange={(e) => setNewCollege({ ...newCollege, college_name: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label">Billing / Contact Email</label>
                    <input type="email" placeholder="admin@stanford.edu" className="form-control" required value={newCollege.contact_email} onChange={(e) => setNewCollege({ ...newCollege, contact_email: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label">Initial Credits Allocation</label>
                    <input type="number" placeholder="100" className="form-control" required value={newCollege.credits} onChange={(e) => setNewCollege({ ...newCollege, credits: e.target.value })} />
                  </div>
                  
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '4px' }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '10px' }}>College Admin Credentials (Optional)</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label">Admin Username</label>
                        <input type="text" placeholder="stanford_admin" className="form-control" value={newCollege.admin_username} onChange={(e) => setNewCollege({ ...newCollege, admin_username: e.target.value })} />
                      </div>
                      <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label">Admin Password</label>
                        <input type="password" placeholder="••••••••" className="form-control" value={newCollege.admin_password} onChange={(e) => setNewCollege({ ...newCollege, admin_password: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setCollegeSubTab('list')}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={addingCollege}>
                      {addingCollege ? "Registering..." : "Create College Account"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Sub-tab 3: Allocate Credits Form */}
            {collegeSubTab === 'allocate' && (
              <div className="glass-card">
                <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Allocate Credits & Update Admin</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
                  Refill B2B verification credits or update college administrator details.
                </p>
                <form onSubmit={async (e) => { await handleAllocateCredits(e); setCollegeSubTab('list'); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label">Select Institution</label>
                    <select className="form-control" required value={allocateData.college_id} onChange={(e) => setAllocateData({ ...allocateData, college_id: e.target.value })}>
                      <option value="">-- Choose College --</option>
                      {colleges.map(c => <option key={c.id} value={c.id}>{c.college_name} (Current Balance: {c.credits} Credits)</option>)}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label">Additional Credits to Add</label>
                    <input type="number" placeholder="e.g. 50" className="form-control" required value={allocateData.credits} onChange={(e) => setAllocateData({ ...allocateData, credits: e.target.value })} />
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '4px' }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '10px' }}>Update Admin Credentials (Optional)</p>
                    <div className="form-group">
                      <label className="form-label">Admin Username</label>
                      <input type="text" placeholder="Username" className="form-control" value={allocateData.admin_username} onChange={(e) => setAllocateData({ ...allocateData, admin_username: e.target.value })} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label">Admin Email</label>
                        <input type="email" placeholder="admin@email.com" className="form-control" value={allocateData.admin_email} onChange={(e) => setAllocateData({ ...allocateData, admin_email: e.target.value })} />
                      </div>
                      <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label">Admin Password</label>
                        <input type="password" placeholder="••••••••" className="form-control" value={allocateData.admin_password} onChange={(e) => setAllocateData({ ...allocateData, admin_password: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setCollegeSubTab('list')}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={allocatingCredits}>
                      {allocatingCredits ? "Allocating..." : "Allocate Credits"}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        )}

        {/* TAB 4: USER LOCKOUT TOOL */}
        {activeTab === 'users' && (
          <div>
            <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>User Account Management</h2>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', marginBottom: '24px', maxWidth: '500px' }}>
              <input type="text" placeholder="Search user by username or email..." className="form-control" value={searchUser} onChange={(e) => setSearchUser(e.target.value)} />
              <button type="submit" className="btn btn-primary">Search</button>
            </form>

            {loadingUsers ? (
              <div className="spinner"></div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Account Info</th>
                      <th>Role</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>#{u.id}</td>
                        <td>
                          <strong>{u.first_name} {u.last_name}</strong>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>@{u.username} • {u.email}</div>
                        </td>
                        <td>
                          <span style={{ padding: '2px 8px', background: 'var(--bg-tertiary)', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                            {u.role.toUpperCase()}
                          </span>
                          {u.college_name && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.college_name}</div>}
                        </td>
                        <td>{u.phone || 'N/A'}</td>
                        <td>
                          <span className={`badge badge-${u.is_active ? 'ready' : 'submitted'}`}>
                            {u.is_active ? 'Active' : 'Blocked'}
                          </span>
                        </td>
                        <td>
                          {u.role !== 'super_admin' ? (
                            <button 
                              className={`btn ${u.is_active ? 'btn-danger' : 'btn-accent'}`} 
                              style={{ padding: '6px 12px', fontSize: '12px', color: u.is_active ? '#fff' : 'var(--bg-primary)' }}
                              onClick={() => handleToggleUserBlock(u.id)}
                            >
                              {u.is_active ? 'Block Account' : 'Unblock Account'}
                            </button>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>System Administrator</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PRICING CONFIGURATION */}
        {activeTab === 'pricing' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '26px' }}>Pricing Configuration Table</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                  Directly edit rate values, surcharges, and bonus credits in the interactive table below.
                </p>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={handlePricingSubmit}
                disabled={updatingPricing}
                style={{ minWidth: '160px' }}
              >
                {updatingPricing ? "Saving changes..." : "Save All Changes"}
              </button>
            </div>

            {/* EDITABLE PRICING TABLE */}
            <form onSubmit={handlePricingSubmit}>
              <div className="glass-card" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Live Platform Rates & Addons</h3>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Setting Parameter</th>
                        <th>Description</th>
                        <th style={{ width: '220px' }}>Current Value (₹)</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <strong>Check — Similarity Check</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>GST-inclusive customer price</div>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                          Customer pays ₹99 (taxable ₹83.90 + GST 18% ₹15.10).
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>₹</span>
                            <input 
                              type="number" 
                              step="0.01" 
                              className="form-control" 
                              required 
                              value={pricing.per_word_rate} 
                              onChange={(e) => setPricing({ ...pricing, per_word_rate: e.target.value })} 
                              style={{ padding: '6px 10px', fontSize: '14px', fontWeight: '600' }}
                            />
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-ready">Active</span>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <strong>Improve — Similarity Improvement</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>GST-inclusive customer price</div>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                          Customer pays ₹299 (taxable ₹253.39 + GST 18% ₹45.61).
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>₹</span>
                            <input 
                              type="number" 
                              step="1" 
                              className="form-control" 
                              required 
                              value={pricing.express_fee} 
                              onChange={(e) => setPricing({ ...pricing, express_fee: e.target.value })} 
                              style={{ padding: '6px 10px', fontSize: '14px', fontWeight: '600' }}
                            />
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-ready">Active</span>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <strong>Complete — Research Paper Package</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>GST-inclusive customer price</div>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                          Customer pays ₹549 (taxable ₹465.25 + GST 18% ₹83.75).
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>₹</span>
                            <input 
                              type="number" 
                              step="1" 
                              className="form-control" 
                              required 
                              value={pricing.editing_suggestions_fee} 
                              onChange={(e) => setPricing({ ...pricing, editing_suggestions_fee: e.target.value })} 
                              style={{ padding: '6px 10px', fontSize: '14px', fontWeight: '600' }}
                            />
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-ready">Active</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </form>

          </div>
        )}

        {activeTab === 'support' && (
          <SupportInbox onCountChange={setSupportOpenCount} />
        )}

      </main>
      </div>

      {/* COMPLETE ORDER DIALOG MODAL */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px', width: '90%', minHeight: '440px', padding: '40px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>
                Complete Order #{selectedOrder.id}
              </h3>
              <button 
                type="button"
                onClick={() => setSelectedOrder(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCompleteOrderSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, justifyContent: 'space-between' }}>
              
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                File: <strong style={{ color: 'var(--text-main)' }}>{selectedOrder.document.split('/').pop()}</strong>
              </div>

              {/* Similarity Score */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Similarity Score (%)</label>
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  className="form-control" 
                  placeholder="e.g. 12" 
                  required 
                  value={completeForm.similarity_score}
                  onChange={(e) => setCompleteForm({ ...completeForm, similarity_score: e.target.value })}
                />
              </div>

              {/* Upload Report PDF Input */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Verified PDF Report</label>
                <div 
                  className="dropzone"
                  style={{ padding: '24px 16px', backgroundColor: completeForm.report_file ? '#f0f9ff' : '#ffffff', borderColor: completeForm.report_file ? 'var(--primary)' : 'var(--border-color)', borderRadius: '8px' }}
                  onClick={() => document.getElementById('admin-report-pdf-input').click()}
                >
                  <input 
                    id="admin-report-pdf-input"
                    type="file" 
                    accept=".pdf" 
                    style={{ display: 'none' }}
                    onChange={(e) => setCompleteForm({ ...completeForm, report_file: e.target.files[0] })}
                  />
                  <Upload size={24} color="var(--primary)" style={{ marginBottom: '8px' }} />
                  {completeForm.report_file ? (
                    <div>
                      <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '14px', marginBottom: '2px' }}>
                        {completeForm.report_file.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {(completeForm.report_file.size / 1024).toFixed(1)} KB • Click to change file
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '2px' }}>
                        Drag & Drop or Click to Upload
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Supports PDF report formats (Max 20MB)
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={updatingOrder}>
                  {updatingOrder ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="spinner" style={{ width: '14px', height: '14px' }}></div>
                      Dispatching...
                    </div>
                  ) : (
                    "Submit Done"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
