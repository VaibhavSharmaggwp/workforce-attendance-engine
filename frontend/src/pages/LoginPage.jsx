import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertCircle, ArrowRight, Shield, User, LogIn } from 'lucide-react';

export const LoginPage = () => {
  const { loginWithCredentials, authError, setAuthError } = useAuth();
  const [selectedRole, setSelectedRole] = useState('MANAGER'); // default to Manager for easy admin access
  const [email, setEmail] = useState('techviista53@gmail.com');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleRedirecting, setIsGoogleRedirecting] = useState(false);

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setAuthError(null);
    if (role === 'MANAGER') {
      setEmail('techviista53@gmail.com');
      setPassword('password');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleRedirecting(true);
    setAuthError(null);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      await fetch(`${backendUrl}/api/v1/auth/health`, { signal: controller.signal, mode: 'no-cors' });
      clearTimeout(timeoutId);
      window.location.href = `${backendUrl}/oauth2/authorization/google`;
    } catch {
      setIsGoogleRedirecting(false);
      setAuthError(
        'Backend server (http://localhost:8080) is not currently running. To use Google Sign-in, please start the Spring Boot backend. In the meantime, use the direct Sign In button below.'
      );
    }
  };

  const handleEmailSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const targetEmail = email.trim();
    if (!targetEmail) {
      setAuthError('Please enter your Gmail / work email address.');
      return;
    }
    setIsSubmitting(true);
    setAuthError(null);
    try {
      await loginWithCredentials(targetEmail, password || 'password');
    } catch (err) {
      // error handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const isManager = selectedRole === 'MANAGER';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-warm-white)',
        padding: '24px',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 480px) minmax(320px, 420px)',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 16,
          boxShadow: '0 12px 40px rgba(31, 27, 24, 0.09)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
          width: '100%',
          maxWidth: 960,
        }}
      >
        {/* Left: Sign-in Form */}
        <div style={{ padding: '44px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Company Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <img
                src="/logo.jpg"
                alt="Eduqynt Techviista Pvt. Ltd."
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1.5px solid #2563EB',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)',
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.96rem', color: 'var(--color-charcoal)', letterSpacing: '-0.01em' }}>
                  Attendance Portal
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-stone)', marginTop: -1 }}>
                  Eduqynt Techviista Pvt. Ltd.
                </div>
              </div>
            </div>

            {/* Portal Role Switcher: Manager vs Employee */}
            <div
              style={{
                display: 'flex',
                backgroundColor: '#F3EFE9',
                borderRadius: 10,
                padding: 4,
                marginBottom: 22,
                border: '1px solid var(--color-border)',
              }}
            >
              <button
                type="button"
                onClick={() => handleRoleChange('MANAGER')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '9px 12px',
                  borderRadius: 7,
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: isManager ? '#FFFEFC' : 'transparent',
                  color: isManager ? 'var(--color-charcoal)' : 'var(--color-stone)',
                  boxShadow: isManager ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Shield size={15} color={isManager ? '#D9502A' : '#8E857C'} />
                <span>Manager Sign-In</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('EMPLOYEE')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '9px 12px',
                  borderRadius: 7,
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: !isManager ? '#FFFEFC' : 'transparent',
                  color: !isManager ? 'var(--color-charcoal)' : 'var(--color-stone)',
                  boxShadow: !isManager ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <User size={15} color={!isManager ? '#1D8350' : '#8E857C'} />
                <span>Employee Sign-In</span>
              </button>
            </div>

            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: isManager ? '#D9502A' : '#1D8350', fontWeight: 700 }}>
              {isManager ? 'Manager Portal' : 'Employee Portal'}
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-charcoal)', marginTop: 4, letterSpacing: '-0.02em' }}>
              {isManager ? 'Welcome, Manager' : 'Welcome back'}
            </h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--color-stone)', marginTop: 6, lineHeight: 1.45 }}>
              {isManager
                ? 'Sign in as Mayank Verma to manage team attendance, review hours, and register employees.'
                : 'Sign in with your registered Gmail to record check-in, breaks, and daily attendance.'}
            </p>

            {/* Error Banner */}
            {authError && (
              <div
                className="animate-fade-in"
                style={{
                  marginTop: 18,
                  backgroundColor: '#FCECEF',
                  border: '1px solid #F4BDC5',
                  borderRadius: 'var(--radius-control)',
                  padding: '12px 14px',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <AlertCircle size={18} color="#BF3A4C" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: '0.82rem', color: '#8E2030', lineHeight: 1.4 }}>
                  <div style={{ fontWeight: 600 }}>Notice</div>
                  {authError}
                  <div style={{ marginTop: 6 }}>
                    <button
                      onClick={() => setAuthError(null)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#BF3A4C',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline',
                        fontSize: '0.78rem',
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Primary Google Sign-in Button */}
            <div style={{ marginTop: 22 }}>
              <button
                onClick={handleGoogleSignIn}
                disabled={isGoogleRedirecting}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  backgroundColor: 'var(--color-coral)',
                  color: '#FFFEFC',
                  border: 'none',
                  borderRadius: 'var(--radius-control)',
                  padding: '12px 18px',
                  fontSize: '0.94rem',
                  fontWeight: 600,
                  cursor: isGoogleRedirecting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(217, 80, 42, 0.25)',
                  transition: 'background 0.15s, transform 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (!isGoogleRedirecting) e.currentTarget.style.backgroundColor = 'var(--color-coral-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isGoogleRedirecting) e.currentTarget.style.backgroundColor = 'var(--color-coral)';
                }}
              >
                {isGoogleRedirecting ? (
                  <span>Connecting to Google...</span>
                ) : (
                  <>
                    <ArrowRight size={17} />
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginTop: 8 }}>
                <span style={{ fontSize: '0.73rem', color: '#8E857C', lineHeight: 1.4 }}>
                  {isManager
                    ? 'ⓘ Signs in directly with techviista53@gmail.com once backend is running.'
                    : 'ⓘ Sign in with the Gmail registered by your manager.'}
                </span>
              </div>
            </div>

            {/* Direct Email / Password Sign-in Form */}
            <div style={{ marginTop: 20, borderTop: '1px solid var(--color-border)', paddingTop: 18 }}>
              <form onSubmit={handleEmailSubmit}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: 4 }}>
                    {isManager ? 'Manager Gmail Address' : 'Registered Employee Gmail'}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder={isManager ? 'techviista53@gmail.com' : 'e.g. employee@gmail.com'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-control)',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.86rem',
                      color: 'var(--color-charcoal)',
                      backgroundColor: '#FFFEFC',
                    }}
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-stone)',
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-control)',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.86rem',
                      color: 'var(--color-charcoal)',
                      backgroundColor: '#FFFEFC',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, fontSize: '0.78rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-stone)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    Remember me
                  </label>
                  <span style={{ color: 'var(--color-stone)', cursor: 'pointer' }}>
                    Need access?
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--color-charcoal)',
                    color: '#FFFEFC',
                    border: 'none',
                    borderRadius: 'var(--radius-control)',
                    padding: '10px 14px',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <LogIn size={15} />
                  <span>
                    {isSubmitting
                      ? 'Authenticating...'
                      : isManager
                      ? 'Sign In as Manager (Mayank Verma)'
                      : 'Sign In as Employee'}
                  </span>
                </button>
              </form>
            </div>
          </div>

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#9B938B' }}>
            <span>🔒 Secure company sign-in</span>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ cursor: 'pointer' }}>Privacy notice</span>
              <span style={{ cursor: 'pointer' }}>Need help?</span>
            </div>
          </div>
        </div>

        {/* Right: Brand Visual Panel (Page 5) */}
        <div
          style={{
            backgroundColor: '#1F1B18',
            color: '#FFFEFC',
            padding: '48px 36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
              <img
                src="/logo.jpg"
                alt="Eduqynt Techviista"
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #2563EB',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#FFFEFC', letterSpacing: '-0.01em' }}>
                  Eduqynt Techviista
                </div>
                <div style={{ fontSize: '0.74rem', color: '#B8B0A6' }}>
                  Workforce Attendance Engine
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, lineHeight: 1.3, letterSpacing: '-0.02em', color: '#FFFEFC' }}>
              Check in, take your break, check out.
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#B8B0A6', marginTop: 10, lineHeight: 1.5 }}>
              Your working time is calculated from recorded times — no manual totals.
            </p>

            {/* A Typical Day Preview Card (Page 5) */}
            <div
              style={{
                marginTop: 36,
                backgroundColor: '#28231E',
                border: '1px solid #3D352E',
                borderRadius: 'var(--radius-card)',
                padding: '18px 20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#D9D2C7' }}>
                  A typical day
                </span>
                <span
                  style={{
                    backgroundColor: '#1D3B2B',
                    color: '#4ADE80',
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: 9999,
                    fontWeight: 600,
                  }}
                >
                  ✓ Checked out
                </span>
              </div>

              {/* Mini timeline bar */}
              <div
                style={{
                  height: 10,
                  backgroundColor: '#38302A',
                  borderRadius: 6,
                  overflow: 'hidden',
                  position: 'relative',
                  marginBottom: 14,
                }}
              >
                <div style={{ position: 'absolute', left: '10%', width: '80%', height: '100%', backgroundColor: '#1D8350' }} />
                <div style={{ position: 'absolute', left: '46%', width: '12%', height: '100%', backgroundColor: '#EFA537' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, fontSize: '0.74rem' }} className="tabular-numbers">
                <div>
                  <div style={{ color: '#8E857C' }}>Checked in</div>
                  <div style={{ fontWeight: 600, color: '#FFFEFC', marginTop: 2 }}>09:52</div>
                </div>
                <div>
                  <div style={{ color: '#8E857C' }}>Break</div>
                  <div style={{ fontWeight: 600, color: '#EFA537', marginTop: 2 }}>53m</div>
                </div>
                <div>
                  <div style={{ color: '#8E857C' }}>Checked out</div>
                  <div style={{ fontWeight: 600, color: '#FFFEFC', marginTop: 2 }}>17:04</div>
                </div>
                <div>
                  <div style={{ color: '#8E857C' }}>Net work</div>
                  <div style={{ fontWeight: 700, color: '#4ADE80', marginTop: 2 }}>6h 19m</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.72rem', color: '#8E857C', lineHeight: 1.4 }}>
            Enterprise workforce attendance engine developed by Eduqynt Techviista Pvt. Ltd.
          </div>
        </div>
      </div>
    </div>
  );
};

