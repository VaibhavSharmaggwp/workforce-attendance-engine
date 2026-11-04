import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, Menu, LogOut } from 'lucide-react';

export const Header = ({ subtitle, onOpenMobileDrawer }) => {
  const { user, logout } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = time.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formattedDate = time.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedClock = time.toLocaleTimeString('en-GB', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const shortClock = time.toLocaleTimeString('en-GB', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        backgroundColor: 'var(--color-warm-white)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Left side: Hamburger (Mobile) + Title & Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onOpenMobileDrawer}
          className="mobile-only"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            padding: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-charcoal)',
            boxShadow: 'var(--shadow-subtle)',
          }}
          title="Open menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--color-charcoal)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            {getGreeting()}, {user?.fullName ? user.fullName.split(' ')[0] : 'there'}
          </h1>
          <div
            style={{
              fontSize: '0.78rem',
              color: 'var(--color-stone)',
              marginTop: 2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '60vw',
            }}
          >
            {subtitle || formattedDate}
          </div>
        </div>
      </div>

      {/* Right side: Live IST clock & Role badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Desktop Live IST clock */}
        <div
          className="tabular-numbers desktop-flex"
          style={{
            alignItems: 'center',
            gap: 7,
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-control)',
            padding: '6px 12px',
            fontSize: '0.86rem',
            fontWeight: 600,
            color: 'var(--color-charcoal)',
            boxShadow: 'var(--shadow-subtle)',
          }}
        >
          <Clock size={15} color="var(--color-stone)" />
          <span>{formattedClock}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-stone)', fontWeight: 500 }}>IST</span>
        </div>

        {/* Mobile Compact Time */}
        <div
          className="tabular-numbers mobile-flex"
          style={{
            alignItems: 'center',
            gap: 5,
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: 'var(--color-charcoal)',
          }}
        >
          <Clock size={13} color="var(--color-stone)" />
          <span>{shortClock}</span>
        </div>

        {/* Role badge */}
        <span
          style={{
            padding: '5px 10px',
            fontSize: '0.70rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: user?.role === 'MANAGER' ? '#FEF6EB' : '#EBF7F0',
            color: user?.role === 'MANAGER' ? '#965B0A' : '#14613B',
            border: user?.role === 'MANAGER' ? '1px solid #F8D9A8' : '1px solid #C4E8D1',
            whiteSpace: 'nowrap',
          }}
        >
          {user?.role || 'EMPLOYEE'}
        </span>

        {/* Mobile Quick Sign Out */}
        <button
          onClick={logout}
          className="mobile-only"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-stone)',
            padding: 6,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            borderRadius: 6,
          }}
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};


