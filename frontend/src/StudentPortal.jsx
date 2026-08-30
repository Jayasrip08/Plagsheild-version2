import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  History,
  UserRound,
  FilePlus2,
  LifeBuoy,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  ScanLine,
} from 'lucide-react';
import api, { logout } from './api';
import ProfilePage from './ProfilePage';
import SubmitPaperForm from './SubmitPaperForm';
import HelpSupport from './HelpSupport';
import logoImage from './images/nc.png';
import SubmissionRecord, { paymentOf, paymentStatusLabel } from './SubmissionRecord';

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function analysisSteps(order) {
  const paid = order.status !== 'Pending Payment';
  const processing = order.status === 'Processing' || order.status === 'Report Ready';
  const ready = order.status === 'Report Ready';

  return [
    {
      key: 'submitted',
      title: 'Paper submitted',
      detail: 'Manuscript received with complete submission details.',
      state: paid ? 'complete' : 'current',
    },
    {
      key: 'payment',
      title: 'Payment confirmed',
      detail: 'Similarity check fee has been recorded.',
      state: paid ? 'complete' : 'pending',
    },
    {
      key: 'processing',
      title: 'File processing',
      detail: 'Document prepared for licensed similarity analysis.',
      state: paid ? 'complete' : 'pending',
    },
    {
      key: 'analysis',
      title: 'Similarity analysis',
      detail: ready
        ? 'Analysis finished.'
        : processing
          ? 'Your manuscript is currently being analysed.'
          : 'Queued for licensed similarity checking.',
      state: ready ? 'complete' : processing ? 'current' : paid ? 'current' : 'pending',
    },
    {
      key: 'report',
      title: 'Report generation',
      detail: ready ? 'Detailed similarity report is available.' : 'Report will be generated after analysis.',
      state: ready ? 'complete' : processing ? 'current' : 'pending',
    },
  ];
}

export default function StudentPortal({ user, setUser }) {
  const [activeTab, setActiveTab] = useState('new_check');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [formError, setFormError] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
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
      setOrders(res.data);
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

  const verifyPayment = async (payload) => {
    try {
      await api.post('payments/verify/', payload);
      toast.success('Payment successful! Your document has been submitted for analysis.');
      fetchOrders();
      const res = await api.get(`orders/${payload.order_id}/`);
      setTrackedOrder(res.data);
      setActiveTab('tracking');
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
    return order.document.split('/').pop();
  };

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

        <button
          className={`sidebar-cta ${activeTab === 'new_check' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('new_check')}
          title="New Check"
        >
          <span className="nav-ico"><FilePlus2 size={18} strokeWidth={2} /></span>
          <span className="nav-label">New Check</span>
        </button>

        <nav className="sidebar-nav" aria-label="Workspace">
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
            <button className={`nav-link ${activeTab === 'tracking' ? 'active' : ''}`} onClick={() => setActiveTab('tracking')} title="Status">
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
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '28px' }}>Your Submissions History</h2>
              <button className="btn btn-secondary" onClick={fetchOrders}>
                Refresh List
              </button>
            </div>

            {loadingOrders ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                <div className="spinner"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>You have not submitted any documents yet.</p>
                <button className="btn btn-primary" onClick={() => setActiveTab('new_check')}>
                  New Document Check
                </button>
              </div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Manuscript</th>
                      <th>Author</th>
                      <th>Payment ID</th>
                      <th>Payment</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => {
                      const pay = paymentOf(o);
                      return (
                      <tr
                        key={o.id}
                        className={selectedRecord?.id === o.id ? 'is-selected' : ''}
                        onClick={() => setSelectedRecord(o)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>#{o.id}</td>
                        <td className="cell-stack">
                          <strong>{documentName(o)}</strong>
                          <span>{o.paper_type || 'Manuscript'} · {o.package_label || 'Check'}</span>
                        </td>
                        <td className="cell-stack">
                          <strong>{o.author_name || '—'}</strong>
                          <span>{o.author_email || o.author_institution || ''}</span>
                        </td>
                        <td className="mono-id">{pay?.razorpay_payment_id || '—'}</td>
                        <td>
                          <span className={`badge ${paymentStatusLabel(o) === 'Paid' ? 'badge-ready' : ''}`}>
                            {paymentStatusLabel(o)}
                          </span>
                        </td>
                        <td>₹{parseFloat(o.price).toFixed(2)}</td>
                        <td>
                          <span className={`badge badge-${o.status.toLowerCase().replace(/\s+/g, '-')}`} style={
                            o.status === 'Pending Payment' ? { backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#eab308', border: '1px solid #eab308' } : {}
                          }>
                            {o.status}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {o.status === 'Pending Payment' ? (
                              <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => initiatePayment(o)}>
                                Pay Now
                              </button>
                            ) : (
                              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => { setTrackedOrder(o); setActiveTab('tracking'); }}>
                                Track
                              </button>
                            )}

                            {!o.is_b2b && o.status !== 'Pending Payment' && (
                              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => downloadInvoice(o.id)}>
                                Invoice
                              </button>
                            )}

                            {o.status === 'Report Ready' && (
                              o.is_expired ? (
                                <span style={{ color: 'var(--danger)', fontSize: '11px', alignSelf: 'center' }}>Link Expired</span>
                              ) : (
                                <a
                                  href={o.secure_download_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-accent"
                                  style={{ padding: '6px 12px', fontSize: '12px', color: '#ffffff' }}
                                >
                                  Download
                                </a>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {selectedRecord && (
              <div className="record-card">
                <div className="record-card-head">
                  <div>
                    <h3>Submission #{selectedRecord.id}</h3>
                    <p>Manuscript, author, and Razorpay payment details for this document.</p>
                  </div>
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedRecord(null)}>Close</button>
                </div>
                <SubmissionRecord order={selectedRecord} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <ProfilePage user={user} onProfileUpdate={setUser} />
        )}

        {activeTab === 'support' && (
          <HelpSupport orders={orders} />
        )}

        {activeTab === 'tracking' && trackedOrder && (
          <div className="submit-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '24px', marginBottom: '4px' }}>
                  {trackedOrder.status === 'Report Ready' ? 'Report Ready' : 'Analysis in Progress'}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                  {documentName(trackedOrder)}
                  {trackedOrder.paper_type ? ` · ${trackedOrder.paper_type}` : ''}
                </p>
              </div>
              <button
                className="btn btn-secondary"
                onClick={async () => {
                  const res = await api.get(`orders/${trackedOrder.id}/`);
                  setTrackedOrder(res.data);
                  fetchOrders();
                }}
              >
                Refresh Status
              </button>
            </div>

            <div className="form-section analysis-card" style={{ padding: '8px 20px 12px' }}>
              <div className="analysis-steps">
                {analysisSteps(trackedOrder).map((step) => (
                  <div key={step.key} className={`analysis-step ${step.state}`}>
                    <div className="analysis-marker">
                      {step.state === 'complete' ? (
                        <CheckIcon />
                      ) : step.state === 'current' ? (
                        <span className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }} />
                      ) : null}
                    </div>
                    <div className="analysis-step-copy">
                      <strong>{step.title}</strong>
                      <span>{step.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {trackedOrder.status === 'Report Ready' && (
              <div className="report-ready-panel">
                <div className="report-score-label">Similarity Score</div>
                <div
                  className="report-score"
                  style={{ color: trackedOrder.similarity_score > 25 ? 'var(--danger)' : 'var(--success)' }}
                >
                  {trackedOrder.similarity_score}%
                </div>
                {trackedOrder.is_expired ? (
                  <p style={{ color: 'var(--danger)', fontWeight: 600 }}>
                    This report download link has expired (48-hour validity).
                  </p>
                ) : (
                  <div className="report-actions">
                    <a
                      href={trackedOrder.secure_download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                    >
                      View Detailed Report
                    </a>
                    <a
                      href={trackedOrder.secure_download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      download
                    >
                      Download Report
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
      </div>
    </div>
  );
}
