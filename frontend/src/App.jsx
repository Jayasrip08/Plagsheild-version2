import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react'
import api, { getUserProfile, loginUser, registerUser, googleLoginUser } from './api'
import StudentPortal from './StudentPortal'
import AdminPortal from './AdminPortal'
import LandingPage from './LandingPage'
import logoImage from './images/nc.png'

const AuthAnimation = lazy(() => import('./AuthAnimation'))

const DEMO_ADMIN = {
  email: 'admin@novelcheckr.com',
  password: 'Demo@123',
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [viewMode, setViewMode] = useState('landing'); // 'landing' | 'auth'
  
  // Colleges list for B2B dropdown
  const [collegesList, setCollegesList] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(false);

  // Auth Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('b2c_student');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [departmentOption, setDepartmentOption] = useState('Computer Science');
  const [authError, setAuthError] = useState('');
  const [submittingAuth, setSubmittingAuth] = useState(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1079783815723-m3660oi8tl5v2igiljnkjk41339nf6bg.apps.googleusercontent.com';
  const [googleSdkLoaded, setGoogleSdkLoaded] = useState(false);
  const [showGoogleRoleModal, setShowGoogleRoleModal] = useState(false);
  const [googleRoleForSignup, setGoogleRoleForSignup] = useState('b2c_student');
  const [googleCollegeIdForSignup, setGoogleCollegeIdForSignup] = useState('');
  const [googleDepartmentForSignup, setGoogleDepartmentForSignup] = useState('');
  const [googleAdminSecretForSignup, setGoogleAdminSecretForSignup] = useState('');
  const googleRoleRef = useRef(googleRoleForSignup);
  const googleCollegeIdRef = useRef(googleCollegeIdForSignup);
  const googleDepartmentRef = useRef(googleDepartmentForSignup);
  const googleAdminSecretRef = useRef(googleAdminSecretForSignup);

  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    setLoadingColleges(true);
    try {
      const res = await api.get('colleges/');
      const list = res.data.results || res.data || [];
      setCollegesList(list);
      if (list.length > 0) {
        setCollegeId(list[0].id);
        setGoogleCollegeIdForSignup(list[0].id);
        googleCollegeIdRef.current = list[0].id;
      }
    } catch (e) {
      console.error("Failed to fetch colleges", e);
    } finally {
      setLoadingColleges(false);
    }
  };

  useEffect(() => {
    if (role !== 'b2b_student' && role !== 'college_admin') {
      setCollegeId('');
    } else if (collegesList.length > 0 && !collegeId) {
      setCollegeId(collegesList[0].id);
    }
    if (role !== 'b2b_student') {
      setDepartment('');
    }
    if (role !== 'super_admin') {
      setAdminSecret('');
    }
  }, [role, collegesList]);

  useEffect(() => {
    // Check local storage for existing session
    const currentUser = getUserProfile();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const decodeGoogleJwt = (token) => {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      const json = decodeURIComponent(decoded.split('').map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`).join(''));
      return JSON.parse(json);
    } catch (error) {
      return null;
    }
  };

  const validateGmail = (value) => /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(value);
  const validateName = (value) => /^[A-Za-z]+$/.test(value);
  const validatePhone = (value) => /^\d{10}$/.test(value);
  const validatePassword = (value) => /^(?=.{8}$)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])[A-Z][A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{7}$/.test(value);

  const extractApiErrorMessage = (error) => {
    const data = error?.response?.data;
    if (!data) {
      return error?.message || 'Invalid credentials or registration error. Please check values.';
    }
    if (typeof data === 'string') {
      return data;
    }
    if (data.detail) {
      return data.detail;
    }
    if (data.error) {
      return data.error;
    }

    const messages = [];
    const addValue = (value) => {
      if (Array.isArray(value)) {
        messages.push(value.join(' '));
      } else if (typeof value === 'string') {
        messages.push(value);
      } else if (typeof value === 'object' && value !== null) {
        Object.values(value).forEach(addValue);
      }
    };

    addValue(data);
    return messages.filter(Boolean).join(' ') || 'Invalid credentials or registration error. Please check values.';
  };

  const [googleAuthPayload, setGoogleAuthPayload] = useState(null);
  const [googleWhatsApp, setGoogleWhatsApp] = useState('');
  const [showGooglePhoneModal, setShowGooglePhoneModal] = useState(false);

  const handleGoogleCredentialResponse = useCallback(async (credentialResponse) => {
    setAuthError('');

    try {
      const payload = decodeGoogleJwt(credentialResponse.credential);
      if (!payload?.email) {
        throw new Error('Unable to read Google account email.');
      }

      setGoogleAuthPayload(payload);
      setShowGooglePhoneModal(true);
    } catch (e) {
      console.error('Google login failed', e);
      setAuthError(extractApiErrorMessage(e) || e.message || 'Google OAuth login failed.');
    }
  }, []);

  const confirmGoogleLoginWithWhatsApp = async (e) => {
    e.preventDefault();
    if (!googleWhatsApp.trim()) {
      setAuthError('Please enter your WhatsApp mobile number.');
      return;
    }

    setSubmittingAuth(true);
    setAuthError('');

    try {
      const loggedInUser = await googleLoginUser({
        email: googleAuthPayload.email,
        name: googleAuthPayload.name || googleAuthPayload.given_name || '',
        phone: googleWhatsApp,
        mode: isLogin ? 'login' : 'register',
      });

      setUser(loggedInUser);
      setShowGooglePhoneModal(false);
      setGoogleWhatsApp('');
    } catch (e) {
      console.error('Google login failed', e);
      setAuthError(extractApiErrorMessage(e) || e.message || 'Google OAuth login failed.');
    } finally {
      setSubmittingAuth(false);
    }
  };

  const isGoogleInitialized = useRef(false);

  useEffect(() => {
    if (!googleClientId || isGoogleInitialized.current) {
      return;
    }

    let intervalId;
    const initGoogleSdk = () => {
      if (!window.google?.accounts?.id || isGoogleInitialized.current) {
        return isGoogleInitialized.current;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
          ux_mode: 'popup',
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false,
        });
        isGoogleInitialized.current = true;
        setGoogleSdkLoaded(true);
        if (intervalId) clearInterval(intervalId);

        // Render official Google button into container if present
        setTimeout(() => {
          const container = document.getElementById('google-btn-container');
          if (container && window.google?.accounts?.id) {
            container.innerHTML = '';
            window.google.accounts.id.renderButton(container, {
              theme: 'outline',
              size: 'large',
              width: '100%',
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left',
            });
          }
        }, 100);

        return true;
      } catch (err) {
        console.error("Google SDK init error", err);
        return false;
      }
    };

    if (window.google?.accounts?.id) {
      initGoogleSdk();
      return;
    }

    intervalId = setInterval(() => {
      if (initGoogleSdk()) {
        clearInterval(intervalId);
      }
    }, 500);

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener('load', initGoogleSdk);
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogleSdk;
      document.body.appendChild(script);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [googleClientId, handleGoogleCredentialResponse]);

  const handleDemoAdminLogin = async () => {
    setIsLogin(true);
    setUsername(DEMO_ADMIN.email);
    setPassword(DEMO_ADMIN.password);
    setAuthError('');
    setSubmittingAuth(true);
    try {
      const loggedInUser = await loginUser(DEMO_ADMIN.email, DEMO_ADMIN.password);
      setUser(loggedInUser);
    } catch (e) {
      console.error('Demo admin login failed', e);
      setAuthError('Demo admin login failed. Ask someone to run python seed_db.py.');
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setSubmittingAuth(true);

    try {
      if (isLogin) {
        const loggedInUser = await loginUser(username, password);
        setUser(loggedInUser);
      } else {
        if (!validateGmail(email)) {
          setAuthError('Please enter a valid Gmail address ending with @gmail.com.');
          setSubmittingAuth(false);
          return;
        }
        if (!validatePassword(password)) {
          setAuthError('Password must be exactly 8 characters, start with an uppercase letter, and include at least one special character.');
          setSubmittingAuth(false);
          return;
        }
        if (password !== confirmPassword) {
          setAuthError('Password and Confirm Password do not match.');
          setSubmittingAuth(false);
          return;
        }
        if (firstName && !validateName(firstName)) {
          setAuthError('First name may only contain letters.');
          setSubmittingAuth(false);
          return;
        }
        if (lastName && !validateName(lastName)) {
          setAuthError('Last name may only contain letters.');
          setSubmittingAuth(false);
          return;
        }
        if (phone && !validatePhone(phone)) {
          setAuthError('Phone number must be exactly 10 digits.');
          setSubmittingAuth(false);
          return;
        }
        if (role === 'b2b_student' && departmentOption === 'Others' && !department) {
          setAuthError('Please enter your department when selecting Others.');
          setSubmittingAuth(false);
          return;
        }

        const payload = {
          username,
          email,
          password,
          phone: phone ? `+91${phone}` : undefined,
          role,
          first_name: firstName,
          last_name: lastName,
        };

        if (role === 'college_admin' || role === 'b2b_student') {
          payload.college_id = collegeId || undefined;
        }
        if (role === 'b2b_student') {
          payload.department = department || undefined;
        }
        if (role === 'super_admin') {
          payload.admin_secret = adminSecret || undefined;
        }

        await registerUser(payload);
        alert("Registration successful! Please login with your credentials.");
        setIsLogin(true);
        setPassword('');
        setRole('b2c_student');
        setFirstName('');
        setLastName('');
        setCollegeId('');
        setAdminSecret('');
        setDepartment('');
      }
    } catch (e) {
      console.error("Authentication failed", e);
      setAuthError(extractApiErrorMessage(e));
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleGoogleLogin = () => {
    setAuthError('');
    if (!googleClientId) {
      setAuthError('Google OAuth is not configured. Set VITE_GOOGLE_CLIENT_ID in frontend/.env.');
      return;
    }

    if (!window.google?.accounts?.id) {
      setAuthError('Google OAuth SDK is still loading. Refresh the page and try again.');
      return;
    }

    googleRoleRef.current = 'b2c_student';
    
    // Try Google One Tap prompt with fallback to rendered button iframe click
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment() || notification.isDismissedMoment()) {
        const btnIframe = document.querySelector('#google-btn-container iframe') || document.querySelector('#google-btn-container div[role="button"]');
        if (btnIframe) {
          btnIframe.click();
        }
      }
    });

    // Also trigger iframe directly if available
    const btnIframe = document.querySelector('#google-btn-container iframe') || document.querySelector('#google-btn-container div[role="button"]');
    if (btnIframe) {
      btnIframe.click();
    }
  };

  const handleGoogleRoleConfirm = () => {
    if (!window.google?.accounts?.id) {
      setAuthError('Google OAuth SDK is still loading.');
      return;
    }

    window.google.accounts.id.prompt();
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading NovelCheckr Platform...</p>
      </div>
    );
  }

  // Render Portal according to role (Super Admin or User)
  if (user) {
    if (user.role === 'super_admin') {
      return <AdminPortal user={user} setUser={setUser} />;
    } else {
      return <StudentPortal user={user} setUser={setUser} />;
    }
  }

  if (viewMode === 'landing') {
    return (
      <LandingPage
        onNavigateToAuth={(tab) => {
          if (tab === 'register') {
            setIsLogin(false);
          } else {
            setIsLogin(true);
          }
          setAuthError('');
          setViewMode('auth');
        }}
      />
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-layout-wrapper">
        <div className="auth-hero-panel">
          <div className="auth-hero-bg">
            <div className="auth-blob auth-blob-orange"></div>
            <div className="auth-blob auth-blob-light"></div>
            <div className="auth-grid-overlay"></div>
          </div>

          <div className="auth-hero-inner">
            <div className="auth-hero-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '22px', fontWeight: '800', cursor: 'pointer' }} onClick={() => setViewMode('landing')}>
              <img src={logoImage} alt="NovelCheckr" style={{ width: 28, height: 28 }} />
              NovelCheckr
            </div>

            <div className="auth-hero-visual">
              <Suspense fallback={<div className="auth-hero-lottie-placeholder" />}>
                <AuthAnimation isLogin={isLogin} />
              </Suspense>
            </div>

            <div className="auth-hero-content">
              <h2>{isLogin ? 'Welcome Back' : 'Join NovelCheckr'}</h2>
              <p>
                {isLogin
                  ? 'Sign in to check your manuscripts, track reports, and manage your academic integrity dashboard.'
                  : 'Create your account to start verifying originality with Turnitin-grade similarity scoring and instant audit reports.'}
              </p>
            </div>

            <div className="auth-hero-footer" style={{ fontSize: '13px', opacity: 0.8 }}>
              © {new Date().getFullYear()} NovelCheckr Platform. All rights reserved.
            </div>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-container">
            <button
              type="button"
              className="auth-back-btn"
              onClick={() => setViewMode('landing')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                color: 'var(--secondary)',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                marginBottom: '16px',
                padding: '0'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back to Home
            </button>

            <div className="auth-intro">
              <h1>Welcome to NovelCheckr</h1>
              <p className="auth-subtitle">
                Sign in to your account or register for access.
              </p>
            </div>

        <div className="auth-card glass-card">
          <div className="auth-tab-group">
            <button
              type="button"
              className={isLogin ? 'active' : ''}
              onClick={() => { setIsLogin(true); setAuthError(''); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={!isLogin ? 'active' : ''}
              onClick={() => { setIsLogin(false); setAuthError(''); }}
            >
              Register
            </button>
          </div>



          <form onSubmit={handleAuthSubmit} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {authError && (
              <div className="auth-alert">
                {authError}
              </div>
            )}

            {isLogin ? (
              /* LOGIN FORM: Clean Email and Password */
              <>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    required 
                    placeholder="Enter your email address"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      className="form-control" 
                      required 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  className="demo-admin-login"
                  onClick={handleDemoAdminLogin}
                  disabled={submittingAuth}
                >
                  <span>Demo Super Admin</span>
                  <strong>{DEMO_ADMIN.email}</strong>
                  <em>Sign in to the admin panel</em>
                </button>
              </>
            ) : (
              /* REGISTER FORM: First Name -> Last Name -> Email -> Password -> Confirm Password -> WhatsApp Number */
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value.replace(/[^A-Za-z]/g, ''))}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value.replace(/[^A-Za-z]/g, ''))}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    required 
                    placeholder="name@gmail.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (!username) setUsername(e.target.value.split('@')[0]);
                    }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      className="form-control" 
                      required 
                      placeholder="••••••••"
                      value={password}
                      maxLength={8}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      className="form-control" 
                      required 
                      placeholder="••••••••"
                      value={confirmPassword}
                      maxLength={8}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">WhatsApp Number</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '42px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px', padding: '0 12px' }}>
                      +91
                    </span>
                    <input 
                      type="tel" 
                      className="form-control" 
                      placeholder="10-digit WhatsApp number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary auth-btn-full" style={{ marginTop: '8px' }} disabled={submittingAuth}>
              {submittingAuth ? (
                <div className="btn-loading">
                  <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                  Authenticating...
                </div>
              ) : (
                isLogin ? "Sign In" : "Register Account"
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <div 
            id="google-btn-container" 
            className="google-btn-wrapper"
          >
            <button 
              type="button" 
              className="btn-google-custom" 
              onClick={handleGoogleLogin}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>

          {(!googleClientId || !googleSdkLoaded) && (
            <p className="auth-hint">
              {!googleClientId
                ? <>Google OAuth is unavailable until you set <code>VITE_GOOGLE_CLIENT_ID</code> in <code>frontend/.env</code> and reload.</>
                : 'Loading Google OAuth SDK... Please wait a moment or click the Google button above.'
              }
            </p>
          )}

          <p className="auth-footer">
            {isLogin ? (
              <>New here? <button type="button" onClick={() => { setIsLogin(false); setAuthError(''); }}>Create an account</button></>
            ) : (
              <>Already registered? <button type="button" onClick={() => { setIsLogin(true); setAuthError(''); }}>Sign in instead</button></>
            )}
          </p>
        </div>
      </div>
    </div>
      {/* Google Sign In WhatsApp Number Modal */}
      {showGooglePhoneModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-card" style={{
            maxWidth: '440px',
            width: '100%',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--secondary)'
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Google Sign-In</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>WhatsApp Number Required</p>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.5' }}>
              Welcome <strong>{googleAuthPayload?.name || 'User'}</strong>! Please provide your WhatsApp number for order notifications and report delivery updates.
            </p>

            {authError && (
              <div className="auth-error-banner" style={{ marginBottom: '16px' }}>
                {authError}
              </div>
            )}

            <form onSubmit={confirmGoogleLoginWithWhatsApp}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">WhatsApp Mobile Number</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="+91 98765 43210"
                  value={googleWhatsApp}
                  onChange={(e) => setGoogleWhatsApp(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setShowGooglePhoneModal(false);
                    setAuthError('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1.5 }}
                  disabled={submittingAuth}
                >
                  {submittingAuth ? 'Signing in...' : 'Confirm & Sign In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}

export default App
