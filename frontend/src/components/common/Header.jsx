import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock } from 'lucide-react';

export const Header = ({ subtitle }) => {
  const { user } = useAuth();
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

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 32px 16px',
        backgroundColor: 'var(--color-warm-white)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div>
        <h1 style={{ fontSize: '1.42rem', fontWeight: 700, color: 'var(--color-charcoal)', letterSpacing: '-0.02em' }}>
          {getGreeting()}, {user?.fullName ? user.fullName.split(' ')[0] : 'there'}
        </h1>
        <div style={{ fontSize: '0.82rem', color: 'var(--color-stone)', marginTop: 2 }}>
          {subtitle || formattedDate}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Live IST clock */}
        <div
          className="tabular-numbers"
          style={{
            display: 'flex',
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

        {/* Role badge */}
        <span
          style={{
            padding: '5px 10px',
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: user?.role === 'MANAGER' ? '#FEF6EB' : '#EBF7F0',
            color: user?.role === 'MANAGER' ? '#965B0A' : '#14613B',
            border: user?.role === 'MANAGER' ? '1px solid #F8D9A8' : '1px solid #C4E8D1',
          }}
        >
          {user?.role || 'EMPLOYEE'}
        </span>
      </div>
    </header>
  );
};

