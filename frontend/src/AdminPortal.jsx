import React, { useState, useEffect } from 'react';
import api, { logout } from './api';
import SectionLoader from './SectionLoader';
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
  LogOut,
  Search,
  Eye,
  Pencil,
  MoreHorizontal,
  RefreshCw,
  FilterX,
  UserCog,
  ListOrdered,
  Inbox,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { paymentOf, paymentStatusLabel } from './SubmissionRecord';
import AdminOrderDetail from './AdminOrderDetail';
import AdminUserDetail from './AdminUserDetail';
import SupportInbox from './SupportInbox';
import logoImage from './images/nc.png';
import {
  formatListDate,
  initialsOf,
  matchesSearch,
  avatarTone,
  roleTone,
  paginate,
  fileLabel,
  downloadCsv,
  historyDateRange,
  orderInDateRange,
} from './adminListHelpers';

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
  const [completeForm, setCompleteForm] = useState({ similarity_score: '', report_files: [] });
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
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);
  const [openUserMenu, setOpenUserMenu] = useState(null);
  const [historySearch, setHistorySearch] = useState('');
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const [historyDatePreset, setHistoryDatePreset] = useState('all');
  const [historyDateExact, setHistoryDateExact] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');
  const [queueSearch, setQueueSearch] = useState('');
  const [queueStatusFilter, setQueueStatusFilter] = useState('all');
  const [queuePage, setQueuePage] = useState(1);
  const [queuePageSize, setQueuePageSize] = useState(10);
  const [openQueueMenu, setOpenQueueMenu] = useState(null);

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

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get('accounts/super/users/');
      const list = (Array.isArray(res.data) ? res.data : [])
        .slice()
        .sort((a, b) => {
          const tb = new Date(b.date_joined || 0).getTime();
          const ta = new Date(a.date_joined || 0).getTime();
          if (tb !== ta) return tb - ta;
          return (b.id || 0) - (a.id || 0);
        });
      setUsers(list);
      setSelectedUser((prev) => {
        if (!prev) return null;
        return list.find((u) => u.id === prev.id) || null;
      });
    } catch (e) {
      console.error("Failed to load users list", e);
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

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('orders/', { params: { status: 'Report Ready' } });
      const completedOnly = (Array.isArray(res.data) ? res.data : [])
        .filter((o) => o.status === 'Report Ready' || o.status === 'Completed')
        .sort((a, b) => {
          const tb = new Date(b.created_at || 0).getTime();
          const ta = new Date(a.created_at || 0).getTime();
          if (tb !== ta) return tb - ta;
          return (b.id || 0) - (a.id || 0);
        });
      setHistoryOrders(completedOnly);
      setSelectedHistoryOrder(null);
    } catch (e) {
      console.error("Failed to load order history", e);
    } finally {
      setLoadingHistory(false);
    }
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
    const files = completeForm.report_files || [];
    if (!selectedOrder || files.length === 0) {
      alert("Please select at least one verified report document to upload.");
      return;
    }
    setUpdatingOrder(true);

    const formData = new FormData();
    formData.append('action', 'complete');
    formData.append('similarity_score', completeForm.similarity_score);
    // Append each document to report_files
    files.forEach((file) => {
      formData.append('report_files', file);
    });
    // For legacy backend compatibility
    formData.append('report_file', files[0]);

    try {
      await api.post(`orders/super/${selectedOrder.id}/update/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(`Order #${selectedOrder.id} completed with ${files.length} document(s). Notifications sent successfully.`);
      setSelectedOrder(null);
      setCompleteForm({ similarity_score: '', report_files: [] });
      fetchQueue();
      fetchStats();
      fetchHistory();
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
      await fetchUsers();
    } catch (e) {
      console.error("Failed to toggle block status", e);
      alert("Cannot block superadmin user.");
    }
  };

  const handleDeleteUser = async (userId, userLabel) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete user #${userId} (${userLabel})?\n\nThis will remove this user account from the system.`
    );
    if (!confirmDelete) return;

    try {
      const res = await api.delete(`accounts/super/users/${userId}/delete/`);
      alert(res.data.message || "User deleted successfully.");
      setSelectedUser(null);
      await fetchUsers();
    } catch (e) {
      console.error("Failed to delete user", e);
      alert(e.response?.data?.error || "Failed to delete user.");
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

  const filteredUsers = users.filter((u) => {
    if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;
    if (userStatusFilter === 'active' && !u.is_active) return false;
    if (userStatusFilter === 'blocked' && u.is_active) return false;
    if (!matchesSearch(
      searchUser,
      u.id,
      u.username,
      u.email,
      u.first_name,
      u.last_name,
      u.phone,
      u.role,
      `${u.first_name || ''} ${u.last_name || ''}`,
    )) return false;
    return true;
  });
  const usersPageData = paginate(filteredUsers, userPage, userPageSize);

  const filteredQueue = queue.filter((order) => {
    if (queueStatusFilter !== 'all' && order.status !== queueStatusFilter) return false;
    const pay = paymentOf(order);
    return matchesSearch(
      queueSearch,
      order.id,
      order.paper_title,
      order.document,
      order.author_name,
      order.author_email,
      order.user_details?.username,
      order.user_details?.email,
      order.status,
      pay?.razorpay_payment_id,
      pay?.razorpay_order_id,
      pay?.transaction_id,
    );
  });
  const queuePageData = paginate(filteredQueue, queuePage, queuePageSize);
  const historyDateBounds = historyDateRange(historyDatePreset, {
    date: historyDateExact,
    from: historyDateFrom,
    to: historyDateTo,
  });
  const filteredHistoryOrders = historyOrders.filter((order) => {
    if (!orderInDateRange(order, historyDateBounds)) return false;
    const pay = paymentOf(order);
    return matchesSearch(
      historySearch,
      order.id,
      order.paper_title,
      order.document,
      order.author_name,
      order.author_email,
      order.user_details?.username,
      order.user_details?.email,
      order.user_details?.id,
      order.status,
      pay?.razorpay_payment_id,
      pay?.razorpay_order_id,
      pay?.transaction_id,
    );
  });
  const historyPageData = paginate(filteredHistoryOrders, historyPage, historyPageSize);

  const downloadQueueDocument = async (order) => {
    const docUrl = order.document;
    if (!docUrl) {
      alert('No document attached to this order.');
      return;
    }
    const cleanFileName = fileLabel(docUrl);
    try {
      if (docUrl.startsWith('http://') || docUrl.startsWith('https://')) {
        const resp = await fetch(docUrl);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const blob = await resp.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', cleanFileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
        return;
      }
      const response = await api.get(docUrl, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', cleanFileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      try {
        const res = await api.get(`orders/${order.id}/download-document/`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', cleanFileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch {
        alert('Could not download this manuscript.');
      }
    }
  };

  const exportUsersCsv = () => {
    downloadCsv('novelcheckr-users.csv', [
      ['User ID', 'Joined', 'Name', 'Username', 'Email', 'Role', 'Phone', 'Status'],
      ...filteredUsers.map((u) => [
        u.id,
        u.date_joined || '',
        `${u.first_name || ''} ${u.last_name || ''}`.trim(),
        u.username,
        u.email,
        u.role,
        u.phone || '',
        u.is_active ? 'Active' : 'Blocked',
      ]),
    ]);
  };

  const exportHistoryCsv = () => {
    downloadCsv('novelcheckr-order-history.csv', [
      ['Order ID', 'Submitted', 'Manuscript', 'Author', 'Email', 'Payment ID', 'Transaction ID', 'Amount', 'Status'],
      ...filteredHistoryOrders.map((o) => {
        const pay = paymentOf(o);
        return [
          o.id,
          o.created_at || '',
          o.paper_title || fileLabel(o.document),
          o.author_name || '',
          o.author_email || o.user_details?.email || '',
          pay?.razorpay_payment_id || '',
          pay?.transaction_id || '',
          pay?.amount || o.price || '',
          o.status || '',
        ];
      }),
    ]);
  };

  const renderPager = (pageData, setPage, pageSize, setPageSize, noun) => (
    <div className="adm-footer">
      <div className="adm-footer-meta">
        Showing <strong>{pageData.start}</strong> – <strong>{pageData.end}</strong> of <strong>{pageData.total}</strong> {noun}
      </div>
      <div className="adm-pager">
        <label>
          Rows per page
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </label>
        <div className="adm-page-btns">
          <button type="button" className="adm-page-btn" disabled={pageData.page <= 1} onClick={() => setPage(pageData.page - 1)}>
            <ChevronLeft size={16} />
          </button>
          <button type="button" className="adm-page-btn is-active">{pageData.page}</button>
          <button type="button" className="adm-page-btn" disabled={pageData.page >= pageData.pages} onClick={() => setPage(pageData.page + 1)}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );

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
          <button className={`nav-link ${activeTab === 'users' ? 'active' : ''}`} onClick={() => { setActiveTab('users'); setSelectedUser(null); fetchUsers(); }} title="Users">
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
              <SectionLoader label="Loading dashboard…" />
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
          <div className="adm-page">
            <div className="adm-page-head">
              <div className="adm-page-title-wrap">
                <div className="adm-page-icon"><Inbox size={22} /></div>
                <div>
                  <h2>Pending Checks Queue</h2>
                  <p>Review incoming manuscripts, download files, and complete similarity reports.</p>
                </div>
              </div>
              <div className="adm-page-actions">
                <button type="button" className="adm-btn adm-btn-secondary" onClick={() => { setQueuePage(1); fetchQueue(); }}>
                  <RefreshCw size={15} /> Refresh
                </button>
              </div>
            </div>

            <div className="adm-panel">
              <div className="adm-filters">
                <div className="adm-search">
                  <Search size={15} />
                  <input
                    type="search"
                    placeholder="Search by manuscript, author, email, or order ID..."
                    value={queueSearch}
                    onChange={(e) => { setQueueSearch(e.target.value); setQueuePage(1); }}
                    autoComplete="off"
                  />
                </div>
                <select className="adm-select" value={queueStatusFilter} onChange={(e) => { setQueueStatusFilter(e.target.value); setQueuePage(1); }}>
                  <option value="all">All Status</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Processing">Processing</option>
                </select>
                <button
                  type="button"
                  className="adm-btn adm-btn-secondary"
                  onClick={() => { setQueueSearch(''); setQueueStatusFilter('all'); setQueuePage(1); }}
                >
                  <FilterX size={15} /> Clear
                </button>
              </div>

              {loadingQueue ? (
                <SectionLoader label="Loading pending queue…" />
              ) : queuePageData.total === 0 ? (
                <div className="adm-empty">The verification queue is currently empty.</div>
              ) : (
                <>
                  <div className="adm-table-wrap">
                    <table className="adm-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Order ID</th>
                          <th>Submitted</th>
                          <th>Manuscript</th>
                          <th>Package</th>
                          <th>Payment</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {queuePageData.items.map((order, idx) => {
                          const pay = paymentOf(order);
                          const when = formatListDate(order.created_at);
                          const title = order.paper_title || fileLabel(order.document);
                          const account = order.user_details?.username || order.author_name || 'User';
                          const tone = avatarTone(account);
                          const statusKey = String(order.status || '').toLowerCase().includes('process')
                            ? 'process'
                            : 'submitted';
                          return (
                            <tr key={order.id}>
                              <td className="adm-muted">{queuePageData.start + idx}</td>
                              <td><strong>#{order.id}</strong></td>
                              <td>
                                <div className="adm-datetime">
                                  <strong>{when.date}</strong>
                                  <span>{when.time}</span>
                                </div>
                              </td>
                              <td>
                                <div className="adm-account">
                                  <span className={`adm-avatar tone-${tone}`}>{initialsOf(account)}</span>
                                  <div className="adm-account-text">
                                    <strong>{title}</strong>
                                    <span>{order.author_name || account} · {order.user_details?.email || order.author_email || '—'}</span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className={`adm-pill tone-${order.package_tier === 'complete' ? 'blue' : order.package_tier === 'improve' || order.is_express ? 'amber' : 'slate'}`}>
                                  {order.package_label || (order.is_express ? 'Improve' : 'Check')}
                                </span>
                              </td>
                              <td>
                                <div className="adm-strong">₹{parseFloat(pay?.amount || order.price || 0).toFixed(2)}</div>
                                <div className="adm-mono">{pay?.razorpay_payment_id || paymentStatusLabel(order)}</div>
                              </td>
                              <td>
                                <span className={`adm-status is-${statusKey}`}>
                                  <span className="adm-status-dot" />
                                  {order.status}
                                </span>
                              </td>
                              <td onClick={(e) => e.stopPropagation()}>
                                <div className="adm-actions">
                                  <button type="button" className="adm-icon-btn" title="Download manuscript" onClick={() => downloadQueueDocument(order)}>
                                    <Download size={15} />
                                  </button>
                                  <button type="button" className="adm-icon-btn is-primary" title="Complete order" onClick={() => setSelectedOrder(order)}>
                                    <CheckCircle2 size={15} />
                                  </button>
                                  <div className="adm-menu">
                                    <button
                                      type="button"
                                      className="adm-icon-btn"
                                      title="More"
                                      onClick={() => setOpenQueueMenu(openQueueMenu === order.id ? null : order.id)}
                                    >
                                      <MoreHorizontal size={15} />
                                    </button>
                                    {openQueueMenu === order.id ? (
                                      <div className="adm-menu-pop">
                                        {order.status === 'Submitted' ? (
                                          <button type="button" onClick={() => { setOpenQueueMenu(null); handleStartProcessing(order.id); }}>
                                            Start Processing
                                          </button>
                                        ) : null}
                                        <button type="button" onClick={() => { setOpenQueueMenu(null); setSelectedOrder(order); }}>
                                          Complete Report
                                        </button>
                                        <button type="button" onClick={() => { setOpenQueueMenu(null); downloadQueueDocument(order); }}>
                                          Download File
                                        </button>
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {renderPager(queuePageData, setQueuePage, queuePageSize, setQueuePageSize, 'orders')}
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ORDER HISTORY */}
        {activeTab === 'history' && (
          <div>
            {selectedHistoryOrder ? (
              <AdminOrderDetail
                orderId={selectedHistoryOrder.id}
                initialOrder={selectedHistoryOrder}
                onBack={() => setSelectedHistoryOrder(null)}
              />
            ) : (
              <div className="adm-page">
                <div className="adm-page-head">
                  <div className="adm-page-title-wrap">
                    <div className="adm-page-icon"><ListOrdered size={22} /></div>
                    <div>
                      <h2>Order History</h2>
                      <p>Latest completed orders first. Open any row to view the full Zoho-style order record.</p>
                    </div>
                  </div>
                  <div className="adm-page-actions">
                    <button type="button" className="adm-btn adm-btn-secondary" onClick={exportHistoryCsv}>
                      <Download size={15} /> Export
                    </button>
                    <button type="button" className="adm-btn adm-btn-primary" onClick={() => { setHistorySearch(''); setHistoryPage(1); fetchHistory(); }}>
                      <RefreshCw size={15} /> Refresh
                    </button>
                  </div>
                </div>

                <div className="adm-panel">
                  <form
                    className="adm-filters"
                    onSubmit={(e) => e.preventDefault()}
                  >
                    <div className="adm-search">
                      <Search size={15} />
                      <input
                        type="search"
                        placeholder="Search by manuscript, author, payment ID, or user..."
                        value={historySearch}
                        onChange={(e) => {
                          setHistorySearch(e.target.value);
                          setHistoryPage(1);
                        }}
                        autoComplete="off"
                      />
                    </div>
                    <select
                      className="adm-select"
                      value={historyDatePreset}
                      onChange={(e) => {
                        setHistoryDatePreset(e.target.value);
                        setHistoryPage(1);
                      }}
                      title="Filter by period"
                    >
                      <option value="all">All time</option>
                      <option value="today">Today</option>
                      <option value="week">This week</option>
                      <option value="month">This month</option>
                      <option value="date">Specific date</option>
                      <option value="custom">Custom range</option>
                    </select>
                    {historyDatePreset === 'date' ? (
                      <input
                        type="date"
                        className="adm-select"
                        value={historyDateExact}
                        onChange={(e) => {
                          setHistoryDateExact(e.target.value);
                          setHistoryPage(1);
                        }}
                        aria-label="Filter by date"
                      />
                    ) : null}
                    {historyDatePreset === 'custom' ? (
                      <>
                        <input
                          type="date"
                          className="adm-select"
                          value={historyDateFrom}
                          onChange={(e) => {
                            setHistoryDateFrom(e.target.value);
                            setHistoryPage(1);
                          }}
                          aria-label="From date"
                        />
                        <input
                          type="date"
                          className="adm-select"
                          value={historyDateTo}
                          onChange={(e) => {
                            setHistoryDateTo(e.target.value);
                            setHistoryPage(1);
                          }}
                          aria-label="To date"
                        />
                      </>
                    ) : null}
                    <button
                      type="button"
                      className="adm-btn adm-btn-secondary"
                      onClick={() => {
                        setHistorySearch('');
                        setHistoryDatePreset('all');
                        setHistoryDateExact('');
                        setHistoryDateFrom('');
                        setHistoryDateTo('');
                        setHistoryPage(1);
                      }}
                    >
                      <FilterX size={15} /> Clear
                    </button>
                  </form>

                  {loadingHistory ? (
                    <SectionLoader label="Loading order history…" />
                  ) : historyPageData.total === 0 ? (
                    <div className="adm-empty">No order history is available yet.</div>
                  ) : (
                    <>
                      <div className="adm-table-wrap">
                        <table className="adm-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Order ID</th>
                              <th>Submitted</th>
                              <th>Manuscript</th>
                              <th>Payment ID</th>
                              <th>Amount</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {historyPageData.items.map((order, idx) => {
                              const pay = paymentOf(order);
                              const when = formatListDate(order.created_at);
                              const title = order.paper_title || fileLabel(order.document);
                              const account = order.author_name || order.user_details?.username || 'User';
                              const tone = avatarTone(account + order.id);
                              return (
                                <tr
                                  key={order.id}
                                  className="is-clickable"
                                  onClick={() => setSelectedHistoryOrder(order)}
                                >
                                  <td className="adm-muted">{historyPageData.start + idx}</td>
                                  <td><strong>#{order.id}</strong></td>
                                  <td>
                                    <div className="adm-datetime">
                                      <strong>{when.date}</strong>
                                      <span>{when.time}</span>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="adm-account">
                                      <span className={`adm-avatar tone-${tone}`}>{initialsOf(account)}</span>
                                      <div className="adm-account-text">
                                        <strong>{title}</strong>
                                        <span>{account} · {order.author_email || order.user_details?.email || '—'}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="adm-mono">{pay?.razorpay_payment_id || '—'}</td>
                                  <td><strong>₹{parseFloat(pay?.amount || order.price || 0).toFixed(2)}</strong></td>
                                  <td>
                                    <span className="adm-status is-ready">
                                      <span className="adm-status-dot" />
                                      {order.status}
                                    </span>
                                  </td>
                                  <td onClick={(e) => e.stopPropagation()}>
                                    <div className="adm-actions">
                                      <button
                                        type="button"
                                        className="adm-icon-btn is-primary"
                                        title="View details"
                                        onClick={() => setSelectedHistoryOrder(order)}
                                      >
                                        <Eye size={15} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {renderPager(historyPageData, setHistoryPage, historyPageSize, setHistoryPageSize, 'orders')}
                    </>
                  )}
                </div>
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
                  <SectionLoader label="Loading institutional accounts…" />
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
            {selectedUser ? (
              <AdminUserDetail
                user={selectedUser}
                onBack={() => setSelectedUser(null)}
                onToggleBlock={handleToggleUserBlock}
                onDelete={handleDeleteUser}
              />
            ) : (
              <div className="adm-page">
                <div className="adm-page-head">
                  <div className="adm-page-title-wrap">
                    <div className="adm-page-icon"><UserCog size={22} /></div>
                    <div>
                      <h2>User Account Management</h2>
                      <p>Manage registered users, view their details, and control account access.</p>
                    </div>
                  </div>
                  <div className="adm-page-actions">
                    <button type="button" className="adm-btn adm-btn-secondary" onClick={exportUsersCsv}>
                      <Download size={15} /> Export
                    </button>
                    <button type="button" className="adm-btn adm-btn-primary" onClick={() => { setUserPage(1); fetchUsers(); }}>
                      <RefreshCw size={15} /> Refresh
                    </button>
                  </div>
                </div>

                <div className="adm-panel">
                  <form className="adm-filters" onSubmit={(e) => e.preventDefault()}>
                    <div className="adm-search">
                      <Search size={15} />
                      <input
                        type="search"
                        placeholder="Search by name, username, email, phone, or ID..."
                        value={searchUser}
                        onChange={(e) => {
                          setSearchUser(e.target.value);
                          setUserPage(1);
                        }}
                        autoComplete="off"
                      />
                    </div>
                    <select
                      className="adm-select"
                      value={userRoleFilter}
                      onChange={(e) => { setUserRoleFilter(e.target.value); setUserPage(1); }}
                    >
                      <option value="all">All Roles</option>
                      <option value="b2c_student">B2C Student</option>
                      <option value="b2b_student">B2B Student</option>
                      <option value="college_admin">College Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                    <select
                      className="adm-select"
                      value={userStatusFilter}
                      onChange={(e) => { setUserStatusFilter(e.target.value); setUserPage(1); }}
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="blocked">Blocked</option>
                    </select>
                    <button
                      type="button"
                      className="adm-btn adm-btn-secondary"
                      onClick={() => {
                        setSearchUser('');
                        setUserRoleFilter('all');
                        setUserStatusFilter('all');
                        setUserPage(1);
                      }}
                    >
                      <FilterX size={15} /> Clear
                    </button>
                  </form>

                  {loadingUsers ? (
                    <SectionLoader label="Loading users…" />
                  ) : usersPageData.total === 0 ? (
                    <div className="adm-empty">No users found.</div>
                  ) : (
                    <>
                      <div className="adm-table-wrap">
                        <table className="adm-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>User ID</th>
                              <th>Joined</th>
                              <th>Account Info</th>
                              <th>Role</th>
                              <th>Phone</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {usersPageData.items.map((u, idx) => {
                              const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username;
                              const when = formatListDate(u.date_joined);
                              const tone = avatarTone(u.username || u.email || u.id);
                              return (
                                <tr
                                  key={u.id}
                                  className="is-clickable"
                                  onClick={() => setSelectedUser(u)}
                                >
                                  <td className="adm-muted">{usersPageData.start + idx}</td>
                                  <td><strong>#{u.id}</strong></td>
                                  <td>
                                    <div className="adm-datetime">
                                      <strong>{when.date}</strong>
                                      <span>{when.time}</span>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="adm-account">
                                      <span className={`adm-avatar tone-${tone}`}>{initialsOf(name)}</span>
                                      <div className="adm-account-text">
                                        <strong>{name}</strong>
                                        <span>{u.email || `@${u.username}`}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <span className={`adm-pill tone-${roleTone(u.role)}`}>
                                      {String(u.role || '').toUpperCase()}
                                    </span>
                                  </td>
                                  <td>{u.phone || '—'}</td>
                                  <td>
                                    <span className={`adm-status ${u.is_active ? 'is-active' : 'is-blocked'}`}>
                                      <span className="adm-status-dot" />
                                      {u.is_active ? 'Active' : 'Blocked'}
                                    </span>
                                  </td>
                                  <td onClick={(e) => e.stopPropagation()}>
                                    <div className="adm-actions">
                                      <button
                                        type="button"
                                        className="adm-icon-btn is-primary"
                                        title="View"
                                        onClick={() => setSelectedUser(u)}
                                      >
                                        <Eye size={15} />
                                      </button>
                                      <button
                                        type="button"
                                        className="adm-icon-btn"
                                        title="Open profile actions"
                                        onClick={() => setSelectedUser(u)}
                                      >
                                        <Pencil size={15} />
                                      </button>
                                      {u.role !== 'super_admin' ? (
                                        <div className="adm-menu">
                                          <button
                                            type="button"
                                            className="adm-icon-btn"
                                            title="More"
                                            onClick={() => setOpenUserMenu(openUserMenu === u.id ? null : u.id)}
                                          >
                                            <MoreHorizontal size={15} />
                                          </button>
                                          {openUserMenu === u.id ? (
                                            <div className="adm-menu-pop">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setOpenUserMenu(null);
                                                  handleToggleUserBlock(u.id);
                                                }}
                                              >
                                                {u.is_active ? 'Block Account' : 'Unblock Account'}
                                              </button>
                                              <button
                                                type="button"
                                                className="is-danger"
                                                onClick={() => {
                                                  setOpenUserMenu(null);
                                                  handleDeleteUser(u.id, u.email || u.username);
                                                }}
                                              >
                                                Delete User
                                              </button>
                                            </div>
                                          ) : null}
                                        </div>
                                      ) : null}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {renderPager(usersPageData, setUserPage, userPageSize, setUserPageSize, 'users')}
                    </>
                  )}
                </div>
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
                File: <strong style={{ color: 'var(--text-main)' }}>{selectedOrder.document?.split('?')[0].split('/').pop()}</strong>
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

              {/* Upload Multiple Report Documents */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    Verified Report Documents {completeForm.report_files.length > 0 && `(${completeForm.report_files.length})`}
                  </label>
                  {completeForm.report_files.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '3px 8px', fontSize: '11px' }}
                      onClick={() => document.getElementById('admin-report-pdf-input').click()}
                    >
                      + Add More Files
                    </button>
                  )}
                </div>

                <input 
                  id="admin-report-pdf-input"
                  type="file" 
                  multiple
                  accept=".pdf,.doc,.docx" 
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const newFiles = Array.from(e.target.files || []);
                    if (newFiles.length > 0) {
                      setCompleteForm((prev) => ({
                        ...prev,
                        report_files: [...prev.report_files, ...newFiles]
                      }));
                    }
                    e.target.value = '';
                  }}
                />

                {completeForm.report_files.length === 0 ? (
                  <div 
                    className="dropzone"
                    style={{ padding: '24px 16px', backgroundColor: '#ffffff', borderColor: 'var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}
                    onClick={() => document.getElementById('admin-report-pdf-input').click()}
                  >
                    <Upload size={24} color="var(--primary)" style={{ marginBottom: '8px' }} />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '2px' }}>
                        Drag &amp; Drop or Click to Upload Documents
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Select one or multiple files: Similarity Report, Certificate, AI Scan (.pdf, .doc, .docx)
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                    {completeForm.report_files.map((file, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                          <FileText size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                              {file.name}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              {(file.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCompleteForm((prev) => ({
                              ...prev,
                              report_files: prev.report_files.filter((_, i) => i !== idx)
                            }));
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--danger)',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Remove file"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
