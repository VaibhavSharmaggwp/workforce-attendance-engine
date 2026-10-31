import React from 'react';
import { AlertTriangle, Clock, Check } from 'lucide-react';

export const StatusBadge = ({ status, text, size = 'md' }) => {
  const normStatus = (status || '').toUpperCase();
  const padding = size === 'sm' ? '3px 8px' : '4px 10px';
  const fontSize = size === 'sm' ? '0.75rem' : '0.82rem';

  if (normStatus === 'WORKING') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          backgroundColor: '#EBF7F0',
          color: '#14613B',
          border: '1px solid #C4E8D1',
          borderRadius: 9999,
          padding,
          fontSize,
          fontWeight: 600,
        }}
      >
        <span
          className="pulse-dot"
          style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#1D8350' }}
        />
        {text || 'Working'}
      </span>
    );
  }

  if (normStatus === 'ON_BREAK' || normStatus === 'BREAK') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          backgroundColor: '#FEF6EB',
          color: '#965B0A',
          border: '1px solid #F8D9A8',
          borderRadius: 9999,
          padding,
          fontSize,
          fontWeight: 600,
        }}
      >
        <span
          className="pulse-dot"
          style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#EFA537' }}
        />
        {text || 'On break'}
      </span>
    );
  }

  if (normStatus === 'COMPLETED' || normStatus === 'CHECKED_OUT' || normStatus === 'COMPLETE') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          backgroundColor: '#EBF7F0',
          color: '#14613B',
          border: '1px solid #C4E8D1',
          borderRadius: 9999,
          padding,
          fontSize,
          fontWeight: 600,
        }}
      >
        <Check size={13} strokeWidth={2.5} color="#1D8350" />
        {text || (normStatus === 'CHECKED_OUT' ? 'Checked out' : 'Complete')}
      </span>
    );
  }

  if (normStatus === 'INCOMPLETE') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          backgroundColor: '#FCECEF',
          color: '#8E2030',
          border: '1px solid #F4BDC5',
          borderRadius: 9999,
          padding,
          fontSize,
          fontWeight: 600,
        }}
      >
        <AlertTriangle size={13} strokeWidth={2.5} color="#BF3A4C" />
        {text || 'Incomplete'}
      </span>
    );
  }

  if (normStatus === 'BREAK_OVER_1H') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          backgroundColor: '#FEF6EB',
          color: '#965B0A',
          border: '1px solid #F8D9A8',
          borderRadius: 9999,
          padding,
          fontSize,
          fontWeight: 600,
        }}
      >
        <Clock size={13} strokeWidth={2.5} color="#EFA537" />
        {text || 'Break over 1h'}
      </span>
    );
  }

  // NOT_CHECKED_IN or Default
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F0ECE4',
        color: '#6B625A',
        border: '1px solid #E2DCD1',
        borderRadius: 9999,
        padding,
        fontSize,
        fontWeight: 500,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#9B938B' }} />
      {text || 'Not checked in'}
    </span>
  );
};

