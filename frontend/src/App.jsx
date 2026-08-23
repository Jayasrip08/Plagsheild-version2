import { useState, useEffect, useCallback, useRef } from 'react'
import api, { getUserProfile, loginUser, registerUser, googleLoginUser } from './api'
import StudentPortal from './StudentPortal'
import CollegePortal from './CollegePortal'
import AdminPortal from './AdminPortal'

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  
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

  const handleGoogleCredentialResponse = useCallback(async (credentialResponse) => {
    setAuthError('');
    setSubmittingAuth(true);

    try {
      const payload = decodeGoogleJwt(credentialResponse.credential);
      if (!payload?.email) {
        throw new Error('Unable to read Google account email.');
      }

      const loggedInUser = await googleLoginUser({
        email: payload.email,
        name: payload.name || payload.given_name || '',
        mode: isLogin ? 'login' : 'register',
        role: isLogin ? undefined : googleRoleRef.current,
        college_id: !isLogin && (googleRoleRef.current === 'b2b_student' || googleRoleRef.current === 'college_admin') ? googleCollegeIdRef.current || undefined : undefined,
        department: !isLogin && googleRoleRef.current === 'b2b_student' ? googleDepartmentRef.current || undefined : undefined,
        admin_secret: !isLogin && googleRoleRef.current === 'super_admin' ? googleAdminSecretRef.current || undefined : undefined,
      });
      setUser(loggedInUser);
      setShowGoogleRoleModal(false);
    } catch (e) {
      console.error('Google login failed', e);
      setAuthError(extractApiErrorMessage(e) || e.message || 'Google OAuth login failed.');
    } finally {
      setSubmittingAuth(false);
    }
  }, [isLogin]);

  useEffect(() => {
    if (!googleClientId) {
      return;
    }

    let intervalId;
    const initGoogleSdk = () => {
      if (!window.google?.accounts?.id) {
        return false;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
          ux_mode: 'popup',
          cancel_on_tap_outside: true,
        });
        setGoogleSdkLoaded(true);
        if (intervalId) clearInterval(intervalId);
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

    if (isLogin) {
      // On login, just sign in with the Google account and redirect to the existing role portal.
      window.google.accounts.id.prompt();
    } else {
      // On registration, allow selecting a role first.
      setShowGoogleRoleModal(true);
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
        <p>Loading PlagShield Platform...</p>
      </div>
    );
  }

  // Render Portal according to role
  if (user) {
    if (user.role === 'super_admin') {
      return <AdminPortal user={user} setUser={setUser} />;
    } else if (user.role === 'college_admin') {
      return <CollegePortal user={user} setUser={setUser} />;
    } else {
      return <StudentPortal user={user} setUser={setUser} />;
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-layout-wrapper">
        <div className="auth-hero-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '22px', fontWeight: '800' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            PlagShield
          </div>
          <div className="auth-hero-content">
            <h2>Academic Integrity & Plagiarism Intelligence</h2>
            <p>Institutional verification platform with automated Turnitin similarity scoring, signed digital audit reports, and B2B credit allocation.</p>
          </div>
          <div style={{ fontSize: '13px', opacity: 0.8 }}>
            © {new Date().getFullYear()} PlagShield Platform. All rights reserved.
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-container">
            <div className="auth-intro">
              <h1>Welcome to PlagShield</h1>
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

          <button 
            type="button" 
            className="btn btn-secondary auth-btn-full oauth-btn" 
            onClick={handleGoogleLogin}
            disabled={submittingAuth || !googleClientId || !googleSdkLoaded}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.24 10.285V13.4h6.887c-.648 2.41-2.519 4.155-5.267 4.155-3.327 0-6.027-2.7-6.027-6.027s2.7-6.027 6.027-6.027c1.554 0 2.946.586 4.009 1.545l2.427-2.427C18.663 3.036 15.655 2 12.24 2 6.584 2 2 6.584 2 12.24s4.584 10.24 10.24 10.24c5.795 0 10.254-4.074 10.254-10.24 0-.695-.081-1.355-.223-1.955H12.24z"/>
            </svg>
            Continue with Google OAuth
          </button>
          {(!googleClientId || !googleSdkLoaded) && (
            <p className="auth-hint">
              {!googleClientId
                ? <>Google OAuth is unavailable until you set <code>VITE_GOOGLE_CLIENT_ID</code> in <code>frontend/.env</code> and reload.</>
                : 'Loading Google OAuth SDK... Please wait a moment or refresh the page if it does not appear.'
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

        {/* Google Role Selection Modal */}
        {showGoogleRoleModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '400px',
              width: '100%',
              border: '1px solid var(--border-color)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}>
              <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
                Continue with Google
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Select the role for this Google sign-in. If an account already exists for this email, the existing profile will be used.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                    Select Role
                  </label>
                  <select
                    value={googleRoleForSignup}
                    onChange={(e) => {
                      setGoogleRoleForSignup(e.target.value);
                      googleRoleRef.current = e.target.value;
                      setGoogleCollegeIdForSignup('');
                      googleCollegeIdRef.current = '';
                      setGoogleDepartmentForSignup('');
                      googleDepartmentRef.current = '';
                      setGoogleAdminSecretForSignup('');
                      googleAdminSecretRef.current = '';
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="b2c_student">B2C Student</option>
                    <option value="b2b_student">B2B Student</option>
                    <option value="college_admin">College Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                {(googleRoleForSignup === 'college_admin' || googleRoleForSignup === 'super_admin' || googleRoleForSignup === 'b2b_student') && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                      {googleRoleForSignup === 'super_admin' ? 'Admin Secret' : 'Select College'}
                    </label>
                    {googleRoleForSignup === 'super_admin' ? (
                      <input
                        type="password"
                        value={googleAdminSecretForSignup}
                        onChange={(e) => {
                          setGoogleAdminSecretForSignup(e.target.value);
                          googleAdminSecretRef.current = e.target.value;
                        }}
                        placeholder="Enter admin secret"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          fontSize: '14px'
                        }}
                      />
                    ) : (
                      <select
                        value={googleCollegeIdForSignup}
                        onChange={(e) => {
                          setGoogleCollegeIdForSignup(e.target.value);
                          googleCollegeIdRef.current = e.target.value;
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          fontSize: '14px'
                        }}
                      >
                        {collegesList.length === 0 ? (
                          <option value="">No colleges registered yet</option>
                        ) : (
                          collegesList.map((col) => (
                            <option key={col.id} value={col.id}>
                              {col.college_name}
                            </option>
                          ))
                        )}
                      </select>
                    )}
                  </div>
                )}

                {googleRoleForSignup === 'b2b_student' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                      Department
                    </label>
                    <select
                      value={googleDepartmentForSignup || 'Computer Science'}
                      onChange={(e) => {
                        setGoogleDepartmentForSignup(e.target.value);
                        googleDepartmentRef.current = e.target.value;
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="Electrical and Electronics">Electrical and Electronics</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                )}

                {authError && (
                  <div className="auth-alert" style={{ marginBottom: '10px' }}>
                    {authError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowGoogleRoleModal(false)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '14px'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleGoogleRoleConfirm}
                    disabled={submittingAuth || ((googleRoleForSignup === 'college_admin' || googleRoleForSignup === 'b2b_student') && !googleCollegeIdForSignup) || (googleRoleForSignup === 'super_admin' && !googleAdminSecretForSignup)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'var(--primary)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '14px',
                      opacity: (submittingAuth || (googleRoleForSignup !== 'b2c_student' && !googleCollegeIdForSignup)) ? 0.6 : 1
                    }}
                  >
                    {submittingAuth ? 'Authenticating...' : 'Continue with Google'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App
