
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertCircle, ArrowRight, Shield, User, LogIn, X, Lock, HelpCircle, ShieldCheck } from 'lucide-react';

export const LoginPage = () => {
  const { loginWithCredentials, authError, setAuthError } = useAuth();
  const [selectedRole, setSelectedRole] = useState('MANAGER'); // default to Manager for easy admin access
  const [email, setEmail] = useState('techviista53@gmail.com');
  const [showDirectLogin, setShowDirectLogin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleRedirecting, setIsGoogleRedirecting] = useState(false);
  const [infoModal, setInfoModal] = useState(null); // 'PRIVACY' | 'HELP' | 'SECURITY' | null

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setAuthError(null);
    if (role === 'MANAGER') {
      setEmail('techviista53@gmail.com');
    } else {
      setEmail('');
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
      setAuthError('Please enter your registered Gmail address.');
      return;
    }
    setIsSubmitting(true);
    setAuthError(null);
    try {
      await loginWithCredentials(targetEmail, 'sso-session');
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

            {/* Error & Authorization Alert Card */}
            {authError && (
              <div
                className="animate-fade-in"
                style={{
                  marginTop: 18,
                  backgroundColor: '#FEF2F2',
                  border: '1.5px solid #FCA5A5',
                  borderRadius: 12,
                  padding: '14px 16px',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.08)',
                }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      backgroundColor: '#FEE2E2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <AlertCircle size={18} color="#DC2626" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#991B1B' }}>
                      Account Not Linked / Access Denied
                    </div>
                    <div style={{ fontSize: '0.80rem', color: '#7F1D1D', marginTop: 3, lineHeight: 1.45 }}>
                      {typeof authError === 'string' ? authError : authError.message}
                    </div>

                    <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <a
                        href="mailto:techviista53@gmail.com?subject=Attendance%20Portal%20Access%20Request"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          backgroundColor: '#DC2626',
                          color: '#FFFFFF',
                          padding: '5px 12px',
                          borderRadius: 6,
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        ✉️ Contact Mayank Verma
                      </a>
                      <button
                        type="button"
                        onClick={() => setAuthError(null)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#991B1B',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: 0,
                        }}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Primary Google Sign-in Button */}
            {/* Primary Action: Google Single Sign-On Button */}
            <div style={{ marginTop: 22 }}>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleRedirecting}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  backgroundColor: 'var(--color-coral)',
                  color: '#FFFEFC',
                  border: 'none',
                  borderRadius: 'var(--radius-control)',
                  padding: '13px 18px',
                  fontSize: '0.94rem',
                  fontWeight: 600,
                  cursor: isGoogleRedirecting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 10px rgba(217, 80, 42, 0.28)',
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#FFFFFF"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#FFFFFF"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FFFFFF"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#FFFFFF"/>
                    </svg>
                    <span>
                      {isManager
                        ? 'Continue with Google as Manager'
                        : 'Continue with Google'}
                    </span>
                  </>
                )}
              </button>
              <div style={{ marginTop: 10, textAlign: 'center', fontSize: '0.74rem', color: '#8E857C' }}>
                {isManager
                  ? 'Sign in using primary manager account: techviista53@gmail.com'
                  : 'Sign in with the personal or work Gmail provisioned by your manager.'}
              </div>
            </div>

            {/* Direct Email Access (Offline / Local Dev Mode) */}
            <div style={{ marginTop: 22, borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setShowDirectLogin(!showDirectLogin)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: showDirectLogin ? 'var(--color-charcoal)' : 'var(--color-stone)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>{showDirectLogin ? '▾' : '▸'}</span>
                  <span>Direct Email Access (Offline / Dev Mode)</span>
                </button>
                <span
                  onClick={() => setInfoModal('HELP')}
                  style={{ color: 'var(--color-stone)', cursor: 'pointer', fontSize: '0.74rem' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-charcoal)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-stone)')}
                >
                  Need access?
                </span>
              </div>

              {showDirectLogin && (
                <form onSubmit={handleEmailSubmit} style={{ marginTop: 12 }}>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: 4 }}>
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
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-control)',
                        border: '1px solid var(--color-border)',
                        fontSize: '0.84rem',
                        color: 'var(--color-charcoal)',
                        backgroundColor: '#FFFEFC',
                      }}
                    />
                  </div>

                  <div style={{ fontSize: '0.70rem', color: '#8E857C', marginBottom: 10, lineHeight: 1.35 }}>
                    * Direct login verifies that this email address is already provisioned in the roster. No local application password is required.
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
                      padding: '9px 14px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <LogIn size={14} />
                    <span>
                      {isSubmitting
                        ? 'Verifying...'
                        : isManager
                        ? 'Sign In Directly as Manager'
                        : 'Sign In Directly as Employee'}
                    </span>
                  </button>
                </form>
              )}
            </div>
          </div>

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#9B938B' }}>
            <span
              onClick={() => setInfoModal('SECURITY')}
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-charcoal)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#9B938B')}
            >
              🔒 Secure company sign-in
            </span>
            <div style={{ display: 'flex', gap: 14 }}>
              <span
                onClick={() => setInfoModal('PRIVACY')}
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-charcoal)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#9B938B')}
              >
                Privacy notice
              </span>
              <span
                onClick={() => setInfoModal('HELP')}
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-charcoal)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#9B938B')}
              >
                Need help?
              </span>
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

      {/* Information Modals (Privacy, Help, Security) */}
      {infoModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(28, 25, 23, 0.55)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setInfoModal(null)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              border: '1px solid var(--color-border)',
              maxWidth: 540,
              width: '100%',
              padding: '28px 30px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.22)',
              position: 'relative',
              animation: 'fadeIn 0.15s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: infoModal === 'PRIVACY' ? '#EBF7F0' : infoModal === 'HELP' ? '#EFF6FF' : '#FEF6EB',
                    color: infoModal === 'PRIVACY' ? '#1D8350' : infoModal === 'HELP' ? '#2563EB' : '#D9502A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {infoModal === 'PRIVACY' && <ShieldCheck size={22} />}
                  {infoModal === 'HELP' && <HelpCircle size={22} />}
                  {infoModal === 'SECURITY' && <Lock size={22} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-charcoal)', letterSpacing: '-0.01em' }}>
                    {infoModal === 'PRIVACY' && 'Privacy & Compliance Notice'}
                    {infoModal === 'HELP' && 'Attendance Portal Help & Access'}
                    {infoModal === 'SECURITY' && 'Enterprise Security Standards'}
                  </h3>
                  <div style={{ fontSize: '0.74rem', color: 'var(--color-stone)', marginTop: 2 }}>
                    Eduqynt Techviista Pvt. Ltd. · Workforce Attendance Engine
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-stone)',
                  padding: 4,
                  borderRadius: 6,
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ fontSize: '0.84rem', color: '#4A423B', lineHeight: 1.55 }}>
              {infoModal === 'PRIVACY' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <strong style={{ color: 'var(--color-charcoal)' }}>Purpose of Data Collection:</strong>
                    <div style={{ color: 'var(--color-stone)', marginTop: 2 }}>
                      Timestamps (check-in, break start/finish, check-out) are recorded exclusively for work-hour calculation, shift management, and compliance with statutory labour standards.
                    </div>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--color-charcoal)' }}>No Invasive Monitoring:</strong>
                    <div style={{ color: 'var(--color-stone)', marginTop: 2 }}>
                      The system strictly tracks self-recorded time intervals. It does NOT record background screen video, audio, keystrokes, webcam feeds, or personal browser activity.
                    </div>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--color-charcoal)' }}>Data Ownership & Security:</strong>
                    <div style={{ color: 'var(--color-stone)', marginTop: 2 }}>
                      All attendance logs remain the confidential property of Eduqynt Techviista Pvt. Ltd. and are encrypted both in transit (TLS 1.3) and at rest.
                    </div>
                  </div>
                </div>
              )}

              {infoModal === 'HELP' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ backgroundColor: '#F7F3EE', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                    <strong style={{ color: 'var(--color-charcoal)' }}>Seeing "Account Not Linked"?</strong>
                    <div style={{ color: 'var(--color-stone)', marginTop: 4, fontSize: '0.80rem' }}>
                      To protect company data, self-registration is closed. Your manager must provision your Gmail ID in the system before your first sign-in.
                    </div>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--color-charcoal)' }}>Primary Manager:</strong>
                    <div style={{ color: 'var(--color-stone)', marginTop: 2 }}>
                      Mayank Verma · <a href="mailto:techviista53@gmail.com" style={{ color: '#2563EB', textDecoration: 'none' }}>techviista53@gmail.com</a>
                    </div>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--color-charcoal)' }}>IT & Technical Support:</strong>
                    <div style={{ color: 'var(--color-stone)', marginTop: 2 }}>
                      Email: <a href="mailto:support@techviista.com" style={{ color: '#2563EB', textDecoration: 'none' }}>support@techviista.com</a>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#8E857C', marginTop: 2 }}>
                      Operating Hours: Mon – Fri, 9:00 AM – 6:00 PM IST
                    </div>
                  </div>
                </div>
              )}

              {infoModal === 'SECURITY' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <strong style={{ color: 'var(--color-charcoal)' }}>Google OAuth 2.0:</strong>
                    <div style={{ color: 'var(--color-stone)', marginTop: 2 }}>
                      Single sign-on uses industry-standard OAuth 2.0 PKCE protocol. User passwords never traverse our application layer.
                    </div>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--color-charcoal)' }}>Cryptographic JWT Sessions:</strong>
                    <div style={{ color: 'var(--color-stone)', marginTop: 2 }}>
                      Sessions use HMAC-SHA256 signed JSON Web Tokens with 15-minute access lifetimes and secure token rotation.
                    </div>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--color-charcoal)' }}>Role-Based Access Control (RBAC):</strong>
                    <div style={{ color: 'var(--color-stone)', marginTop: 2 }}>
                      Manager administrative capabilities (team attendance, employee provisioning, audit logs) are strictly protected by server-side spring security method authorization.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Close Button */}
            <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                style={{
                  backgroundColor: 'var(--color-charcoal)',
                  color: '#FFFEFC',
                  border: 'none',
                  borderRadius: 'var(--radius-control)',
                  padding: '9px 18px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

