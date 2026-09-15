import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  LayoutDashboard,
  History,
  UserRound,
  FilePlus2,
  LifeBuoy,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  ScanLine,
  FileText,
  X,
  Download,
  Search,
  RefreshCw,
  FilterX,
  Eye,
  CreditCard,
  FileDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import api, { logout } from './api';
import SectionLoader from './SectionLoader';
import ProfilePage from './ProfilePage';
import SubmitPaperForm from './SubmitPaperForm';
import HelpSupport from './HelpSupport';
import PaymentSuccess from './PaymentSuccess';
import StatusPage from './StatusPage';
import StudentOrderDetail from './StudentOrderDetail';
import UserDashboard from './UserDashboard';
import logoImage from './images/nc.png';
import { paymentOf, paymentStatusLabel } from './SubmissionRecord';
import {
  formatListDate,
  initialsOf,
  avatarTone,
  paginate,
  fileLabel,
  matchesSearch,
} from './adminListHelpers';

function orderStatusTone(status = '') {
  const s = String(status).toLowerCase();
  if (s.includes('ready') || s.includes('completed')) return 'ready';
  if (s.includes('process')) return 'process';
  if (s.includes('pending')) return 'process';
  if (s.includes('submit')) return 'submitted';
  return 'submitted';
}

export default function StudentPortal({ user, setUser }) {
  const [activeTab, setActiveTabState] = useState(() => {
    try {
      const saved = window.sessionStorage.getItem('student-portal-active-tab') || 'dashboard';
      // Never restore the transient payment success screen after a refresh.
      return saved === 'payment_success' ? 'tracking' : saved;
    } catch {
      return 'dashboard';
    }
  });

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    try {
      window.sessionStorage.setItem(
        'student-portal-active-tab',
        tab === 'payment_success' ? 'tracking' : tab,
      );
    } catch (e) {
      // ignore
    }
  };

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [formError, setFormError] = useState('');

  const [trackedOrder, setTrackedOrderState] = useState(() => {
    try {
      const saved = window.sessionStorage.getItem('student-portal-tracked-order');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setTrackedOrder = (order) => {
    setTrackedOrderState(order);
    try {
      if (order) {
        window.sessionStorage.setItem('student-portal-tracked-order', JSON.stringify(order));
      } else {
        window.sessionStorage.removeItem('student-portal-tracked-order');
      }
    } catch (e) {
      // ignore
    }
  };
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [paymentSuccessOrder, setPaymentSuccessOrder] = useState(null);
  const [statusRefreshing, setStatusRefreshing] = useState(false);
  const [downloadModalOrder, setDownloadModalOrder] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      return window.localStorage.getItem('novelcheckr-sidebar-open') !== 'false';
    } catch {
      return true;
    }
  });
  const [pricingConfig, setPricingConfig] = useState({
    per_word_rate: 99,
    express_fee: 299,
    editing_suggestions_fee: 549
  });

  useEffect(() => {
    if (!document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }

    fetchOrders();
    fetchPricingConfig();
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('novelcheckr-sidebar-open', String(sidebarOpen));
    } catch {
      /* ignore */
    }
  }, [sidebarOpen]);

  useEffect(() => {
    if (!trackedOrder || trackedOrder.status === 'Report Ready' || trackedOrder.status === 'Pending Payment') {
      return undefined;
    }
    const timer = setInterval(async () => {
      try {
        const res = await api.get(`orders/${trackedOrder.id}/`);
        setTrackedOrder(res.data);
      } catch (e) {
        console.error('Failed to refresh order status', e);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [trackedOrder?.id, trackedOrder?.status]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.get('orders/');
      const list = (Array.isArray(res.data) ? res.data : [])
        .slice()
        .sort((a, b) => {
          const tb = new Date(b.created_at || 0).getTime();
          const ta = new Date(a.created_at || 0).getTime();
          if (tb !== ta) return tb - ta;
          return (b.id || 0) - (a.id || 0);
        });
      setOrders(list);
    } catch (e) {
      console.error("Failed to load orders history:", e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchPricingConfig = async () => {
    try {
      const res = await api.get('orders/pricing/');
      const check = Number(res.data.packages?.check?.price || res.data.per_word_rate);
      const improve = Number(res.data.packages?.improve?.price || res.data.express_fee);
      const complete = Number(res.data.packages?.complete?.price || res.data.editing_suggestions_fee);
      setPricingConfig({
        ...res.data,
        per_word_rate: check >= 50 ? check : 99,
        express_fee: improve >= 50 ? improve : 299,
        editing_suggestions_fee: complete >= 50 ? complete : 549,
      });
    } catch (e) {
      console.error("Failed to fetch pricing config, using defaults", e);
    }
  };

  const handlePaperSubmit = async (payload) => {
    setSubmittingOrder(true);
    setFormError('');

    try {
      const formData = new FormData();
      formData.append('document', payload.file);
      formData.append('package', payload.package || 'check');
      formData.append('paper_title', payload.paper_title);
      formData.append('paper_type', payload.paper_type);
      formData.append('subject_area', payload.subject_area);
      formData.append('purpose', payload.purpose);
      formData.append('keywords', payload.keywords || '');
      formData.append('author_name', payload.author_name);
      formData.append('author_email', payload.author_email);
      formData.append('author_institution', payload.author_institution);
      formData.append('author_country', payload.author_country);
      formData.append('co_authors', JSON.stringify(payload.co_authors || []));

      const res = await api.post('orders/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      initiatePayment(res.data);
    } catch (e) {
      console.error("Failed to submit order", e);
      setFormError(e.response?.data?.error || "Error creating order. Please try again.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  const waitForRazorpay = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }
      let tries = 0;
      const timer = setInterval(() => {
        if (window.Razorpay) {
          clearInterval(timer);
          resolve();
        } else if (++tries > 50) {
          clearInterval(timer);
          reject(new Error('Razorpay checkout failed to load. Check your connection and try again.'));
        }
      }, 100);
    });

  const initiatePayment = async (order) => {
    try {
      const res = await api.post('payments/create/', { order_id: order.id });
      const payData = res.data;

      if (payData.is_mock) {
        handleMockCheckout(payData, order);
        return;
      }

      await waitForRazorpay();

      let checkoutCompleted = false;
      const options = {
        key: payData.key || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: payData.amount,
        currency: payData.currency || 'INR',
        name: 'NovelCheckr',
        description: `${order.package_label || 'Similarity package'} - Order #${order.id}`,
        order_id: payData.id,
        handler: async (response) => {
          checkoutCompleted = true;
          await verifyPayment({
            razorpay_order_id: payData.id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            order_id: order.id,
          });
        },
        prefill: {
          name: user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.username,
          email: user.email,
          contact: user.phone || '',
        },
        theme: { color: '#1570ef' },
        modal: {
          ondismiss: () => {
            if (!checkoutCompleted) {
              toast.warn('Payment cancelled. You can retry anytime from this page.');
            }
          },
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        const desc = response?.error?.description || 'Payment was not completed. Please try again.';
        toast.error(`Payment failed: ${desc}`);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      });
      rzp.open();
    } catch (e) {
      console.error('Payment initiation failed', e);
      const apiError = e.response?.data?.error;
      toast.error(apiError || e.message || 'Payment initiation failed. Please try again.');
    }
  };

  const handleMockCheckout = (payData, order) => {
    const confirmPay = window.confirm(
      `Confirm payment of ₹${(payData.amount / 100).toFixed(2)} for ${order.package_label || 'the selected package'}?`
    );
    if (confirmPay) {
      verifyPayment({
        razorpay_order_id: payData.id,
        razorpay_payment_id: `pay_mock_${Date.now()}`,
        razorpay_signature: `sig_mock_${Date.now()}`,
        order_id: order.id,
      });
    } else {
      toast.warn('Payment cancelled. You can retry anytime from this page.');
    }
  };

  const continueAfterPaymentSuccess = useCallback(() => {
    setPaymentSuccessOrder(null);
    setActiveTab('tracking');
    fetchOrders();
  }, []);

  const verifyPayment = async (payload) => {
    try {
      await api.post('payments/verify/', payload);
      fetchOrders();
      const res = await api.get(`orders/${payload.order_id}/`);
      setTrackedOrder(res.data);
      setPaymentSuccessOrder(res.data);
      setActiveTab('payment_success');
    } catch (e) {
      console.error("Payment validation failed", e);
      toast.error(
        `Payment verification failed. If money was deducted, contact support with Order #${payload.order_id}.`
      );
    }
  };

  const downloadInvoice = async (orderId) => {
    try {
      const res = await api.get(`orders/${orderId}/invoice/`, {
        responseType: 'blob'
      });

      if (res.headers['content-type'] && res.headers['content-type'].includes('application/pdf')) {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invoice_${orderId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result);
            alert(`Error: ${errorData.error || 'Failed to generate invoice'}`);
          } catch {
            alert("Failed to generate invoice. Please try again.");
          }
        };
        reader.readAsText(res.data);
      }
    } catch (e) {
      console.error("Failed to download invoice:", e);
      alert("Error downloading invoice. Please try again.");
    }
  };

  const documentName = (order) => {
    if (order.paper_title) return order.paper_title;
    if (!order.document) return 'Manuscript';
    return order.document.split('?')[0].split('/').pop();
  };

  const filteredHistoryOrders = orders.filter((order) => {
    if (historyStatusFilter !== 'all' && order.status !== historyStatusFilter) return false;
    const pay = paymentOf(order);
    return matchesSearch(
      historySearch,
      order.id,
      order.paper_title,
      order.document,
      order.author_name,
      order.author_email,
      order.package_label,
      order.status,
      pay?.razorpay_payment_id,
      pay?.status,
    );
  });
  const historyPageData = paginate(filteredHistoryOrders, historyPage, historyPageSize);

  return (
    <div className={`dashboard-layout has-app-sidebar ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <aside className={`sidebar app-sidebar ${sidebarOpen ? '' : 'is-collapsed'}`}>
        <div className="app-sidebar-top">
          <div className="logo">
            <span className="logo-mark">
              <img src={logoImage} alt="NovelCheckr" />
            </span>
            <span className="logo-text">NovelCheckr</span>
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

        <nav className="sidebar-nav" aria-label="Workspace">
          <button className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')} title="Dashboard">
            <span className="nav-ico"><LayoutDashboard size={18} strokeWidth={2} /></span>
            <span className="nav-label">Dashboard</span>
          </button>
          <button className={`nav-link ${activeTab === 'new_check' ? 'active' : ''}`} onClick={() => setActiveTab('new_check')} title="New Check">
            <span className="nav-ico"><FilePlus2 size={18} strokeWidth={2} /></span>
            <span className="nav-label">New Check</span>
          </button>
          <button className={`nav-link ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')} title="History">
            <span className="nav-ico"><History size={18} strokeWidth={2} /></span>
            <span className="nav-label">History</span>
          </button>
          <button className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')} title="Profile">
            <span className="nav-ico"><UserRound size={18} strokeWidth={2} /></span>
            <span className="nav-label">Profile</span>
          </button>
          <button className={`nav-link ${activeTab === 'support' ? 'active' : ''}`} onClick={() => setActiveTab('support')} title="Support">
            <span className="nav-ico"><LifeBuoy size={18} strokeWidth={2} /></span>
            <span className="nav-label">Support</span>
          </button>
          {trackedOrder && (
            <button
              className={`nav-link ${activeTab === 'tracking' || activeTab === 'payment_success' ? 'active' : ''}`}
              onClick={() => {
                if (paymentSuccessOrder) {
                  continueAfterPaymentSuccess();
                } else {
                  setActiveTab('tracking');
                }
              }}
              title="Status"
            >
              <span className="nav-ico"><ScanLine size={18} strokeWidth={2} /></span>
              <span className="nav-label">Status</span>
            </button>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="secure-card" title="Encrypted uploads and licensed analysis">
            <span className="nav-ico"><Shield size={16} strokeWidth={2} /></span>
            <div className="secure-card-copy">
              <strong>Secure</strong>
            </div>
          </div>
          <button className="sidebar-logout" onClick={logout} title="Logout">
            <span className="nav-ico"><LogOut size={18} strokeWidth={2} /></span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      <div className="workspace">
      <main className={`dashboard-main ${activeTab === 'new_check' ? 'is-submit' : ''} ${(activeTab === 'profile' || activeTab === 'support') ? 'is-flush' : ''}`}>
        {activeTab === 'dashboard' && (
          <div className="adm-page">
            <UserDashboard
              user={user}
              orders={orders}
              loadingOrders={loadingOrders}
              onRefresh={fetchOrders}
              onNewCheck={() => setActiveTab('new_check')}
              onViewHistory={() => setActiveTab('history')}
              onSelectOrder={(ord) => {
                setSelectedRecord(ord);
                setActiveTab('history');
              }}
              onTrackOrder={(ord) => {
                setTrackedOrder(ord);
                setActiveTab('tracking');
              }}
              onEditProfile={() => setActiveTab('profile')}
              onOpenSupport={() => setActiveTab('support')}
            />
          </div>
        )}

        {activeTab === 'new_check' && (
          <div className="submit-wrap">
            {formError && <div className="form-error" style={{ margin: '16px 28px 0' }}>{formError}</div>}
            <SubmitPaperForm
              user={user}
              pricingConfig={pricingConfig}
              submitting={submittingOrder}
              onSubmit={handlePaperSubmit}
            />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="adm-page">
            {selectedRecord ? (
              <StudentOrderDetail
                orderId={selectedRecord.id}
                initialOrder={selectedRecord}
                onBack={() => setSelectedRecord(null)}
                onTrack={(order) => {
                  setTrackedOrder(order);
                  setSelectedRecord(null);
                  setActiveTab('tracking');
                }}
                onPay={(order) => initiatePayment(order)}
              />
            ) : (
              <>
                <div className="adm-page-head">
                  <div className="adm-page-title-wrap">
                    <div className="adm-page-icon"><History size={22} /></div>
                    <div>
                      <h2>Your Submissions History</h2>
                      <p>Latest submissions first. Open any row for full manuscript and payment details.</p>
                    </div>
                  </div>
                  <div className="adm-page-actions">
                    <button type="button" className="adm-btn adm-btn-secondary" onClick={() => { setHistoryPage(1); fetchOrders(); }}>
                      <RefreshCw size={15} /> Refresh
                    </button>
                    <button type="button" className="adm-btn adm-btn-primary" onClick={() => setActiveTab('new_check')}>
                      <FilePlus2 size={15} /> New Check
                    </button>
                  </div>
                </div>

                <div className="adm-panel">
                  <form className="adm-filters" onSubmit={(e) => e.preventDefault()}>
                    <div className="adm-search">
                      <Search size={15} />
                      <input
                        type="search"
                        placeholder="Search by manuscript, author, payment ID, or order…"
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
                      value={historyStatusFilter}
                      onChange={(e) => {
                        setHistoryStatusFilter(e.target.value);
                        setHistoryPage(1);
                      }}
                    >
                      <option value="all">All Status</option>
                      <option value="Pending Payment">Pending Payment</option>
                      <option value="Submitted">Submitted</option>
                      <option value="Processing">Processing</option>
                      <option value="Report Ready">Report Ready</option>
                    </select>
                    <button
                      type="button"
                      className="adm-btn adm-btn-secondary"
                      onClick={() => {
                        setHistorySearch('');
                        setHistoryStatusFilter('all');
                        setHistoryPage(1);
                      }}
                    >
                      <FilterX size={15} /> Clear
                    </button>
                  </form>

                  {loadingOrders ? (
                    <SectionLoader label="Loading your submissions…" />
                  ) : historyPageData.total === 0 ? (
                    <div className="adm-empty">
                      {orders.length === 0 ? (
                        <>
                          You have not submitted any documents yet.
                          <div style={{ marginTop: 14 }}>
                            <button type="button" className="adm-btn adm-btn-primary" onClick={() => setActiveTab('new_check')}>
                              <FilePlus2 size={15} /> New Document Check
                            </button>
                          </div>
                        </>
                      ) : (
                        'No submissions match this search.'
                      )}
                    </div>
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
                              const title = order.paper_title || fileLabel(order.document) || documentName(order);
                              const author = order.author_name || user?.username || 'Author';
                              const tone = avatarTone(author + order.id);
                              const statusTone = orderStatusTone(order.status);
                              return (
                                <tr
                                  key={order.id}
                                  className={`is-clickable ${selectedRecord?.id === order.id ? 'is-selected' : ''}`}
                                  onClick={() => setSelectedRecord(order)}
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
                                      <span className={`adm-avatar tone-${tone}`}>{initialsOf(author)}</span>
                                      <div className="adm-account-text">
                                        <strong>{title}</strong>
                                        <span>
                                          {author}
                                          {order.package_label ? ` · ${order.package_label}` : ''}
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="adm-mono">{pay?.razorpay_payment_id || '—'}</td>
                                  <td><strong>₹{parseFloat(pay?.amount || order.price || 0).toFixed(2)}</strong></td>
                                  <td>
                                    <span className={`adm-status is-${statusTone}`}>
                                      <span className="adm-status-dot" />
                                      {order.status}
                                    </span>
                                    <div className="adm-muted" style={{ marginTop: 4 }}>
                                      {paymentStatusLabel(order)}
                                    </div>
                                  </td>
                                  <td onClick={(e) => e.stopPropagation()}>
                                    <div className="adm-actions">
                                      <button
                                        type="button"
                                        className="adm-icon-btn is-primary"
                                        title="View details"
                                        onClick={() => setSelectedRecord(order)}
                                      >
                                        <Eye size={15} />
                                      </button>
                                      {order.status === 'Pending Payment' ? (
                                        <button
                                          type="button"
                                          className="adm-icon-btn"
                                          title="Pay now"
                                          onClick={() => initiatePayment(order)}
                                        >
                                          <CreditCard size={15} />
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          className="adm-icon-btn"
                                          title="Track status"
                                          onClick={() => {
                                            setTrackedOrder(order);
                                            setActiveTab('tracking');
                                          }}
                                        >
                                          <ScanLine size={15} />
                                        </button>
                                      )}
                                      {!order.is_b2b && order.status !== 'Pending Payment' ? (
                                        <button
                                          type="button"
                                          className="adm-icon-btn"
                                          title="Download invoice"
                                          onClick={() => downloadInvoice(order.id)}
                                        >
                                          <FileDown size={15} />
                                        </button>
                                      ) : null}
                                      {order.status === 'Report Ready' && !order.is_expired ? (
                                        order.report_documents && order.report_documents.length > 1 ? (
                                          <button
                                            type="button"
                                            className="adm-icon-btn"
                                            title={`Download reports (${order.report_documents.length})`}
                                            onClick={() => setDownloadModalOrder(order)}
                                          >
                                            <Download size={15} />
                                          </button>
                                        ) : (
                                          <a
                                            href={order.report_documents?.[0]?.download_url || order.secure_download_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="adm-icon-btn"
                                            title="Download report"
                                          >
                                            <Download size={15} />
                                          </a>
                                        )
                                      ) : null}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="adm-footer">
                        <div className="adm-footer-meta">
                          Showing <strong>{historyPageData.start}</strong> – <strong>{historyPageData.end}</strong> of <strong>{historyPageData.total}</strong> submissions
                        </div>
                        <div className="adm-pager">
                          <label>
                            Rows per page
                            <select
                              value={historyPageSize}
                              onChange={(e) => {
                                setHistoryPageSize(Number(e.target.value));
                                setHistoryPage(1);
                              }}
                            >
                              <option value={10}>10</option>
                              <option value={25}>25</option>
                              <option value={50}>50</option>
                            </select>
                          </label>
                          <div className="adm-page-btns">
                            <button
                              type="button"
                              className="adm-page-btn"
                              disabled={historyPageData.page <= 1}
                              onClick={() => setHistoryPage(historyPageData.page - 1)}
                            >
                              <ChevronLeft size={16} />
                            </button>
                            <button type="button" className="adm-page-btn is-active">{historyPageData.page}</button>
                            <button
                              type="button"
                              className="adm-page-btn"
                              disabled={historyPageData.page >= historyPageData.pages}
                              onClick={() => setHistoryPage(historyPageData.page + 1)}
                            >
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <ProfilePage user={user} onProfileUpdate={setUser} />
        )}

        {activeTab === 'support' && (
          <HelpSupport orders={orders} />
        )}

        {activeTab === 'payment_success' && paymentSuccessOrder && (
          <PaymentSuccess
            order={paymentSuccessOrder}
            onContinue={continueAfterPaymentSuccess}
          />
        )}

        {activeTab === 'tracking' && trackedOrder && (
          <StatusPage
            order={trackedOrder}
            refreshing={statusRefreshing}
            onRefresh={async () => {
              setStatusRefreshing(true);
              try {
                const res = await api.get(`orders/${trackedOrder.id}/`);
                setTrackedOrder(res.data);
                fetchOrders();
              } finally {
                setStatusRefreshing(false);
              }
            }}
          />
        )}
      </main>
      </div>

      {/* MULTIPLE REPORTS DOWNLOAD MODAL */}
      {downloadModalOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px', width: '90%', padding: '30px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>
                Verified Documents (#{downloadModalOrder.id})
              </h3>
              <button
                type="button"
                onClick={() => setDownloadModalOrder(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              The administrator has uploaded {downloadModalOrder.report_documents?.length || 1} verification report(s) for your manuscript:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
              {(downloadModalOrder.report_documents || []).map((doc, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    <FileText size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.name}
                    </span>
                  </div>
                  <a
                    href={doc.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ padding: '6px 14px', fontSize: '12px', whiteSpace: 'nowrap' }}
                    download
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDownloadModalOrder(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
