import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MOCK_EMPLOYEES } from '../services/mockData';
import { Eye, EyeOff, AlertCircle, ArrowRight, UserCheck, Shield } from 'lucide-react';

export const LoginPage = () => {
  const { loginWithCredentials, loginAsDemo, authError, setAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [isGoogleRedirecting, setIsGoogleRedirecting] = useState(false);

  const handleGoogleSignIn = () => {
    setIsGoogleRedirecting(true);
    // In production with Spring Boot OAuth2 client configured, redirect to backend:
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setAuthError('Please enter your work email address.');
      return;
    }
    setIsSubmitting(true);
    try {
      await loginWithCredentials(email, password);
    } catch (err) {
      // error handled in auth context
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
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

            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-stone)', fontWeight: 600 }}>
              Employee Sign-In
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-charcoal)', marginTop: 4, letterSpacing: '-0.02em' }}>
              Welcome back
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-stone)', marginTop: 6, lineHeight: 1.45 }}>
              Sign in with your company Google account to record today's attendance.
            </p>

            {/* Error Banner (Account not linked state as per UI Page 6) */}
            {authError && (
              <div
                className="animate-fade-in"
                style={{
                  marginTop: 20,
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
                  <div style={{ fontWeight: 600 }}>Account Not Linked</div>
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
                      Use a different account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Primary Google Sign-in Button */}
            <div style={{ marginTop: 26 }}>
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
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginTop: 10 }}>
                <span style={{ fontSize: '0.74rem', color: '#8E857C', lineHeight: 1.4 }}>
                  ⓘ Use your work account. If you're new, your manager adds you to the system before your first sign-in.
                </span>
              </div>
            </div>

            {/* Optional Password Flow Toggle */}
            <div style={{ marginTop: 24, borderTop: '1px solid var(--color-border)', paddingTop: 18 }}>
              {!showPasswordFields ? (
                <button
                  type="button"
                  onClick={() => setShowPasswordFields(true)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-control)',
                    width: '100%',
                    padding: '9px 14px',
                    color: 'var(--color-charcoal)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F7F3EE')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  Sign in with email and password
                </button>
              ) : (
                <form onSubmit={handlePasswordSubmit} className="animate-fade-in">
                  <div style={{ fontSize: '0.74rem', color: 'var(--color-stone)', marginBottom: 12 }}>
                    Password sign-in: only if enabled for your account
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: 4 }}>
                      Work email
                    </label>
                    <input
                      type="email"
                      placeholder="ananya.sharma@techviista.net"
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
                      Forgot password?
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
                    }}
                  >
                    {isSubmitting ? 'Authenticating...' : 'Sign in'}
                  </button>
                </form>
              )}
            </div>

            {/* Instant Demo Switcher / Benchmark controls */}
            <div style={{ marginTop: 24, padding: '14px 16px', backgroundColor: '#F7F3EE', borderRadius: 10, border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-stone)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={14} color="var(--color-coral)" />
                Quick Test Accounts (One-Click Sign-in)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  type="button"
                  onClick={async () => {
                    await loginAsDemo(MOCK_EMPLOYEES[0]);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1.5px solid #D6CEBE',
                    backgroundColor: '#FFFEFC',
                    color: 'var(--color-charcoal)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-coral)';
                    e.currentTarget.style.backgroundColor = '#FFF8F5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#D6CEBE';
                    e.currentTarget.style.backgroundColor = '#FFFEFC';
                  }}
                >
                  <UserCheck size={16} color="#1D8350" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-charcoal)' }}>Ananya Sharma</div>
                    <div style={{ fontSize: '0.68rem', color: '#8E857C', fontWeight: 500 }}>Employee</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await loginAsDemo(MOCK_EMPLOYEES[1]);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1.5px solid #D6CEBE',
                    backgroundColor: '#FFFEFC',
                    color: 'var(--color-charcoal)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-amber)';
                    e.currentTarget.style.backgroundColor = '#FFFDF5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#D6CEBE';
                    e.currentTarget.style.backgroundColor = '#FFFEFC';
                  }}
                >
                  <Shield size={16} color="#EFA537" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-charcoal)' }}>Rahul Khanna</div>
                    <div style={{ fontSize: '0.68rem', color: '#8E857C', fontWeight: 500 }}>Manager</div>
                  </div>
                </button>
              </div>
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

