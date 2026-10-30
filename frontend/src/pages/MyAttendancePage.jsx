import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { MOCK_HISTORY_RECORDS } from '../services/mockData';
import {
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
} from 'lucide-react';

export const MyAttendancePage = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('October 2026');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await api.getAttendanceHistory();
        if (data && data.length > 0) {
          setRecords(data);
        } else {
          setRecords(MOCK_HISTORY_RECORDS);
        }
      } catch (err) {
        setRecords(MOCK_HISTORY_RECORDS);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatHoursMinutes = (totalMinutes) => {
    if (!totalMinutes || totalMinutes <= 0) return '—';
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h > 0) return `${h}h ${m < 10 ? '0' : ''}${m}m`;
    return `${m}m`;
  };

  const formatTimeOnly = (isoString) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  // KPI Calculations for October 2026 (strictly matching Page 10)
  const totalDays = records.length;
  const completeDays = records.filter(r => r.status === 'COMPLETED').length;
  const incompleteDays = records.filter(r => r.status === 'INCOMPLETE').length;
  const breakOver1hCount = records.filter(r => r.breakMinutes > 60).length;

  const totalNetMins = records.reduce((acc, r) => acc + (r.netWorkMinutes || 0), 0);
  const totalBreakMins = records.reduce((acc, r) => acc + (r.breakMinutes || 0), 0);
  const avgNetMins = completeDays > 0 ? Math.round(totalNetMins / completeDays) : 0;

  // Filter chips logic
  const filteredRecords = records.filter((rec) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'COMPLETE') return rec.status === 'COMPLETED' && rec.breakMinutes <= 60;
    if (selectedFilter === 'INCOMPLETE') return rec.status === 'INCOMPLETE';
    if (selectedFilter === 'BREAK_OVER_1H') return rec.breakMinutes > 60;
    return true;
  });

  // CSV Export Functionality
  const handleExportCSV = () => {
    const headers = ['Date', 'Check In', 'Check Out', 'Break (minutes)', 'Net Work (minutes)', 'Status'];
    const rows = records.map(r => [
      r.workDate,
      r.checkInAt || '',
      r.checkOutAt || '',
      r.breakMinutes,
      r.netWorkMinutes,
      r.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Report_${selectedMonth.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calendar Day Mock Data for October 2026
  // October 2026 starts on Thursday (day index 3 for Monday-based week)
  const calendarDays = [];
  // 3 empty placeholders for Mon, Tue, Wed before Oct 1st
  for (let i = 0; i < 3; i++) calendarDays.push({ empty: true });

  for (let day = 1; day <= 31; day++) {
    const dateStr = `2026-10-${day < 10 ? '0' : ''}${day}`;
    const dayOfWeek = (day + 2) % 7; // 0=Mon, 6=Sun
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
    const match = records.find(r => r.workDate === dateStr);

    let cellType = 'empty';
    let label = '';

    if (day === 22) {
      cellType = 'today';
      label = 'Today';
    } else if (match) {
      if (match.status === 'INCOMPLETE') {
        cellType = 'incomplete';
        label = '▲ Incomplete';
      } else if (match.breakMinutes > 60) {
        cellType = 'break-over';
        label = `• ${formatHoursMinutes(match.netWorkMinutes)}`;
      } else {
        cellType = 'complete';
        label = `• ${formatHoursMinutes(match.netWorkMinutes)}`;
      }
    } else if (isWeekend) {
      cellType = 'weekend';
      label = '';
    } else if (day < 22) {
      cellType = 'no-record';
      label = '• No record';
    }

    calendarDays.push({
      day,
      dateStr,
      cellType,
      label,
      record: match,
    });
  }

  return (
    <div style={{ padding: '28px 32px 56px', maxWidth: 1280, margin: '0 auto' }}>
      {/* Header bar: Title & Month navigation + Export CSV */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.38rem', fontWeight: 800, color: 'var(--color-charcoal)', letterSpacing: '-0.02em' }}>
            My attendance
          </h2>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-stone)', marginTop: 2 }}>
            Your records calculated from recorded check-in, break and check-out times
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Month selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-control)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-subtle)',
            }}
          >
            <button
              style={{ padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-stone)' }}
            >
              <ChevronLeft size={16} />
            </button>
            <div style={{ padding: '8px 12px', fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-charcoal)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CalendarIcon size={14} color="var(--color-stone)" />
              <span>{selectedMonth}</span>
            </div>
            <button
              style={{ padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-stone)' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Export CSV button */}
          <button
            onClick={handleExportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-charcoal)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-control)',
              padding: '8px 14px',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-subtle)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F7F3EE')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface)')}
          >
            <Download size={15} color="var(--color-stone)" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 6 Top KPI Summary Cards (PRD UI Page 10) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 28,
        }}
        className="tabular-numbers"
      >
        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: '16px 18px', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--color-stone)', fontWeight: 500 }}>Days recorded</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-charcoal)', marginTop: 4 }}>{totalDays}</div>
          <div style={{ fontSize: '0.72rem', color: '#8E857C', marginTop: 2 }}>of 15 weekdays so far</div>
        </div>

        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: '16px 18px', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--color-stone)', fontWeight: 500 }}>Complete</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1D8350', marginTop: 4 }}>{completeDays}</div>
          <div style={{ fontSize: '0.72rem', color: '#8E857C', marginTop: 2 }}>check-in & check-out</div>
        </div>

        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: '16px 18px', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--color-stone)', fontWeight: 500 }}>Incomplete</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#BF3A4C', marginTop: 4 }}>{incompleteDays}</div>
          <div style={{ fontSize: '0.72rem', color: '#BF3A4C', marginTop: 2 }}>missing check-out</div>
        </div>

        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: '16px 18px', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--color-stone)', fontWeight: 500 }}>Net work</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-charcoal)', marginTop: 4 }}>{formatHoursMinutes(totalNetMins)}</div>
          <div style={{ fontSize: '0.72rem', color: '#8E857C', marginTop: 2 }}>complete days only</div>
        </div>

        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: '16px 18px', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--color-stone)', fontWeight: 500 }}>Avg net / day</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-charcoal)', marginTop: 4 }}>{formatHoursMinutes(avgNetMins)}</div>
          <div style={{ fontSize: '0.72rem', color: '#8E857C', marginTop: 2 }}>target day = 6h net</div>
        </div>

        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: '16px 18px', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--color-stone)', fontWeight: 500 }}>Break time</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-charcoal)', marginTop: 4 }}>{formatHoursMinutes(totalBreakMins)}</div>
          <div style={{ fontSize: '0.72rem', color: breakOver1hCount > 0 ? '#965B0A' : '#8E857C', marginTop: 2 }}>
            {breakOver1hCount} day over 1h
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Calm Calendar & Records Table */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 460px) minmax(0, 1fr)',
          gap: 24,
          alignItems: 'start',
        }}
      >
        {/* Left: Monthly Calendar (Page 10) */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-border)',
            padding: '24px 22px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--color-charcoal)', marginBottom: 16 }}>
            Calendar
          </div>

          {/* Weekday headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              textAlign: 'center',
              fontSize: '0.74rem',
              fontWeight: 600,
              color: 'var(--color-stone)',
              marginBottom: 10,
            }}
          >
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(w => (
              <div key={w} style={{ padding: '4px 0' }}>{w}</div>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 4,
            }}
          >
            {calendarDays.map((c, i) => {
              if (c.empty) {
                return <div key={`empty-${i}`} style={{ height: 58 }} />;
              }

              let bg = '#FFFEFC';
              let border = '1px solid #ECE7DF';
              let textColor = 'var(--color-charcoal)';
              let labelColor = '#1D8350';

              if (c.cellType === 'incomplete') {
                bg = '#FDF0F2';
                border = '1px solid #F4BDC5';
                labelColor = '#BF3A4C';
              } else if (c.cellType === 'today') {
                border = '2px solid var(--color-coral)';
                bg = '#FFF8F6';
                labelColor = 'var(--color-coral)';
              } else if (c.cellType === 'break-over') {
                bg = '#FFFDF7';
                labelColor = '#965B0A';
              } else if (c.cellType === 'weekend') {
                bg = '#F7F3EE';
                textColor = '#B8B0A6';
              }

              return (
                <div
                  key={c.day}
                  onClick={() => {
                    if (c.record) setSelectedRecord(c.record);
                  }}
                  style={{
                    height: 58,
                    borderRadius: 6,
                    backgroundColor: bg,
                    border,
                    padding: '4px 6px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: c.record ? 'pointer' : 'default',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (c.record) e.currentTarget.style.borderColor = 'var(--color-coral)';
                  }}
                  onMouseLeave={(e) => {
                    if (c.record) e.currentTarget.style.borderColor = border.split(' ')[2] || '#ECE7DF';
                  }}
                >
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: textColor }} className="tabular-numbers">
                    {c.day}
                  </div>
                  {c.label && (
                    <div style={{ fontSize: '0.66rem', fontWeight: 600, color: labelColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div
            style={{
              marginTop: 18,
              paddingTop: 14,
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              fontSize: '0.7rem',
              color: 'var(--color-stone)',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#1D8350' }} />
              Complete
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#BF3A4C' }} />
              Incomplete
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#EFA537' }} />
              Break over 1h
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#B8B0A6' }} />
              No record
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--color-coral)' }} />
              Today
            </span>
          </div>
        </div>

        {/* Right: Records Table with Filter Chips (Page 10, 12) */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-border)',
            padding: '24px 26px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {/* Filter Chips Bar with item counts */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: `All ${records.length}` },
              { id: 'COMPLETE', label: `Complete ${completeDays - breakOver1hCount}` },
              { id: 'INCOMPLETE', label: `Incomplete ${incompleteDays}` },
              { id: 'BREAK_OVER_1H', label: `Break over 1h ${breakOver1hCount}` },
            ].map(chip => (
              <button
                key={chip.id}
                onClick={() => setSelectedFilter(chip.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 9999,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: selectedFilter === chip.id ? '1px solid var(--color-charcoal)' : '1px solid var(--color-border)',
                  backgroundColor: selectedFilter === chip.id ? 'var(--color-charcoal)' : '#FFFEFC',
                  color: selectedFilter === chip.id ? '#FFFEFC' : 'var(--color-stone)',
                  transition: 'all 0.15s ease',
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }} className="tabular-numbers">
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)', color: 'var(--color-stone)' }}>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>DATE</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>IN</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>OUT</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>BREAKS</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>NET</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((rec) => {
                  const isBreakOver = rec.breakMinutes > 60;
                  return (
                    <tr
                      key={rec.id}
                      onClick={() => setSelectedRecord(rec)}
                      style={{
                        borderBottom: '1px solid var(--color-border-subtle)',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAF7F2')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--color-charcoal)' }}>
                        {new Date(rec.workDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </td>
                      <td style={{ padding: '12px 10px', color: 'var(--color-stone)' }}>
                        {formatTimeOnly(rec.checkInAt)}
                      </td>
                      <td style={{ padding: '12px 10px', color: rec.checkOutAt ? 'var(--color-stone)' : '#BF3A4C', fontWeight: rec.checkOutAt ? 400 : 600 }}>
                        {rec.checkOutAt ? formatTimeOnly(rec.checkOutAt) : 'Missing'}
                      </td>
                      <td style={{ padding: '12px 10px', color: isBreakOver ? '#965B0A' : 'var(--color-stone)', fontWeight: isBreakOver ? 600 : 400 }}>
                        {isBreakOver ? `${formatHoursMinutes(rec.breakMinutes)}` : `${rec.breakMinutes}m`}
                      </td>
                      <td style={{ padding: '12px 10px', fontWeight: 700, color: rec.netWorkMinutes > 0 ? '#1D8350' : '#8E857C' }}>
                        {rec.netWorkMinutes > 0 ? formatHoursMinutes(rec.netWorkMinutes) : '—'}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        {isBreakOver ? (
                          <StatusBadge status="BREAK_OVER_1H" size="sm" />
                        ) : (
                          <StatusBadge status={rec.status} size="sm" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Record Detail Slide-Over / Modal (PRD UI Page 12) */}
      {selectedRecord && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: 'rgba(31, 27, 24, 0.4)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 999,
          }}
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 440,
              maxWidth: '90vw',
              height: '100%',
              backgroundColor: 'var(--color-surface)',
              boxShadow: 'var(--shadow-modal)',
              borderLeft: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '32px 28px',
              overflowY: 'auto',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--color-stone)', fontWeight: 600 }}>
                  Record Detail
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-stone)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <h3 style={{ fontSize: '1.24rem', fontWeight: 800, color: 'var(--color-charcoal)', marginBottom: 12 }}>
                {new Date(selectedRecord.workDate).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </h3>

              <div style={{ marginBottom: 24 }}>
                <StatusBadge status={selectedRecord.status} />
              </div>

              {/* Summary Stats */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 10,
                  backgroundColor: '#F7F3EE',
                  borderRadius: 8,
                  padding: '14px 16px',
                  marginBottom: 28,
                }}
                className="tabular-numbers"
              >
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#8E857C' }}>Elapsed</div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--color-charcoal)', marginTop: 2 }}>
                    {selectedRecord.elapsedMinutes > 0 ? formatHoursMinutes(selectedRecord.elapsedMinutes) : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#8E857C' }}>Break</div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--color-charcoal)', marginTop: 2 }}>
                    {formatHoursMinutes(selectedRecord.breakMinutes)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#8E857C' }}>Net work</div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 700, color: selectedRecord.netWorkMinutes > 0 ? '#1D8350' : '#8E857C', marginTop: 2 }}>
                    {selectedRecord.netWorkMinutes > 0 ? formatHoursMinutes(selectedRecord.netWorkMinutes) : '—'}
                  </div>
                </div>
              </div>

              {/* Timeline per day (Page 12) */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-stone)', letterSpacing: '0.04em', marginBottom: 16 }}>
                  Timeline
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: '#EBF7F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckCircle2 size={14} color="#1D8350" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>
                        Checked in · {formatTimeOnly(selectedRecord.checkInAt)}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--color-stone)' }}>
                        Server time, IST
                      </div>
                    </div>
                  </div>

                  {(selectedRecord.breaks || []).map((b, i) => (
                    <div key={b.id || i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: '#FEF6EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Clock size={14} color="#EFA537" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>
                          Break · {formatTimeOnly(b.startedAt)} → {formatTimeOnly(b.endedAt)}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--color-stone)' }}>
                          {b.durationMinutes} minutes
                        </div>
                      </div>
                    </div>
                  ))}

                  {selectedRecord.checkOutAt ? (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: '#EBF7F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CheckCircle2 size={14} color="#1D8350" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>
                          Checked out · {formatTimeOnly(selectedRecord.checkOutAt)}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--color-stone)' }}>
                          Session successfully closed
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: '#FCECEF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AlertTriangle size={14} color="#BF3A4C" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#BF3A4C' }}>
                          No check-out recorded
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--color-stone)' }}>
                          The session was not closed on this day
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footnote as strictly requested on Page 12 */}
            <div
              style={{
                backgroundColor: '#F7F3EE',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                padding: '12px 14px',
                fontSize: '0.74rem',
                color: 'var(--color-stone)',
                lineHeight: 1.45,
              }}
            >
              ⓘ Times are never filled in automatically. Totals for this day stay blank until the record is corrected. Only a manager can correct records, where corrections are enabled.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
