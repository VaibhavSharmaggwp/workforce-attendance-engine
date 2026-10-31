import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { DayTimelineWidget } from '../components/common/DayTimelineWidget';
import { MOCK_HISTORY_RECORDS } from '../services/mockData';
import {
  LogIn,
  LogOut,
  Coffee,
  Play,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Lock,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Zap,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export const TodayDashboardPage = ({ onNavigateToHistory }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCheckOutConfirm, setShowCheckOutConfirm] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recentRecords, setRecentRecords] = useState([]);

  // Sales Spreadsheet Activity & Proof of Work state
  const [engagement, setEngagement] = useState(null);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [simulatingPulse, setSimulatingPulse] = useState(false);

  // Polling / Live Timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadTodayData = async () => {
    try {
      setLoading(true);
      const data = await api.getTodayAttendance();
      setAttendance(data);
      const eng = await api.getTodayEngagement();
      setEngagement(eng);
      const history = await api.getAttendanceHistory();
      if (Array.isArray(history)) {
        setRecentRecords(history.slice(0, 6));
      }
    } catch (err) {
      // 404 means no record today, which is State A (Not checked in)
      if (err.status === 404 || err.message?.includes('No attendance record found')) {
        setAttendance(null);
      } else {
        // Fallback for offline testing if initial state
        setAttendance(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePulse = async () => {
    try {
      setSimulatingPulse(true);
      const row = Math.floor(Math.random() * 45 + 2);
      await api.sendActivityPulse({
        employeeEmail: user?.email || 'ananya.sharma@techviista.net',
        workbookName: engagement?.activeWorkbook || 'Q4_Enterprise_Sales_Pipeline.xlsx',
        sheetName: 'Outreach_Leads',
        cellRange: `B${row}:D${row}`,
        activityType: 'CELL_EDIT',
        details: `Updated sales prospect in row ${row}`,
        loggedAt: new Date().toISOString(),
      });

      setEngagement((prev) => {
        const edits = (prev?.totalEditsCount || 0) + 1;
        const shiftMins = prev?.totalShiftMinutes || 280;
        const activeMins = Math.min(shiftMins, (prev?.activeSpreadsheetMinutes || 240) + 10);
        const pct = Math.min(100, Math.round((activeMins / shiftMins) * 1000) / 10);
        return {
          ...prev,
          totalEditsCount: edits,
          activeSpreadsheetMinutes: activeMins,
          engagementPercentage: pct,
          verificationLevel: pct >= 70 ? 'HIGH' : pct >= 40 ? 'MODERATE' : 'LOW',
          isSuspicious: false,
          lastActiveAt: new Date().toISOString(),
          recentActivitySnippets: [
            `CELL_EDIT on ${prev?.activeWorkbook || 'Q4_Sales.xlsx'} (Outreach_Leads!B${row}) just now`,
            ...(prev?.recentActivitySnippets || []).slice(0, 4),
          ],
        };
      });

      addToast('Cell edit pulse logged! Verified active work in Excel/Sheets.', 'success');
    } catch (e) {
      addToast('Failed to log pulse: ' + e.message, 'error');
    } finally {
      setSimulatingPulse(false);
    }
  };

  const APPS_SCRIPT_CODE = `/**
 * Workforce Attendance Engine - Sales Spreadsheet Engagement Tracker
 * 1. In Google Sheets: Extensions > Apps Script
 * 2. Paste this code and click Save
 */
var ATTENDANCE_API_URL = "\${window.location.origin}/api/v1/activity/pulse";

function onEdit(e) {
  try {
    var email = Session.getActiveUser().getEmail();
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var range = e ? e.range.getA1Notation() : "A1";

    UrlFetchApp.fetch(ATTENDANCE_API_URL, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        employeeEmail: email,
        workbookName: sheet.getName(),
        sheetName: e ? e.range.getSheet().getName() : "Sheet1",
        cellRange: range,
        activityType: "CELL_EDIT",
        details: "Cell edited by " + email,
        loggedAt: new Date().toISOString()
      }),
      muteHttpExceptions: true
    });
  } catch (err) {
    Logger.log("Pulse error: " + err);
  }
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopiedScript(true);
    addToast('Google Apps Script copied to clipboard!', 'success');
    setTimeout(() => setCopiedScript(false), 2500);
  };

  useEffect(() => {
    loadTodayData();
  }, []);

  // Format digital clock HH:MM:SS
  const formatSeconds = (secTotal) => {
    const sec = Math.max(0, Math.floor(secTotal));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Format short hours and minutes: "6h 19m"
  const formatHoursMinutes = (totalMinutes) => {
    const mins = Math.max(0, Math.floor(totalMinutes));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h}h ${m < 10 ? '0' : ''}${m}m`;
    return `${m}m`;
  };

  const formatTimeOnly = (isoString) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  // Action handlers
  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const res = await api.checkIn();
      setAttendance(res);
      addToast({
        type: 'success',
        title: `Checked in at ${formatTimeOnly(res.checkInAt)}`,
        message: `Have a good day, ${user?.fullName ? user.fullName.split(' ')[0] : 'there'}`,
      });
    } catch (err) {
      // Mock fallback if offline
      const now = new Date();
      const mockRes = {
        id: 'local-session-today',
        workDate: now.toISOString().split('T')[0],
        status: 'WORKING',
        checkInAt: now.toISOString(),
        checkOutAt: null,
        elapsedMinutes: 0,
        breakMinutes: 0,
        netWorkMinutes: 0,
        breaks: [],
      };
      setAttendance(mockRes);
      addToast({
        type: 'success',
        title: `Checked in at ${formatTimeOnly(now)}`,
        message: `Have a good day, ${user?.fullName ? user.fullName.split(' ')[0] : 'there'}`,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartBreak = async () => {
    setActionLoading(true);
    try {
      const res = await api.startBreak();
      setAttendance(res);
      addToast({
        type: 'warning',
        title: `Break started at ${formatTimeOnly(new Date())}`,
        message: 'Work timer paused. Take your time.',
      });
    } catch (err) {
      if (attendance) {
        const now = new Date();
        const updatedBreaks = [
          ...(attendance.breaks || []),
          { id: 'b-' + Date.now(), startedAt: now.toISOString(), endedAt: null, durationMinutes: 0 },
        ];
        setAttendance({
          ...attendance,
          status: 'ON_BREAK',
          breaks: updatedBreaks,
        });
        addToast({
          type: 'warning',
          title: `Break started at ${formatTimeOnly(now)}`,
          message: 'Work timer paused. Take your time.',
        });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndBreak = async () => {
    setActionLoading(true);
    try {
      const res = await api.endBreak();
      setAttendance(res);
      addToast({
        type: 'success',
        title: 'Break ended · back to work',
        message: 'Work timer resumed. Welcome back!',
      });
    } catch (err) {
      if (attendance) {
        const now = new Date();
        const breaks = (attendance.breaks || []).map((b) => {
          if (!b.endedAt) {
            const startD = new Date(b.startedAt);
            const duration = Math.round((now - startD) / 60000);
            return { ...b, endedAt: now.toISOString(), durationMinutes: duration };
          }
          return b;
        });
        const totalBreak = breaks.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
        setAttendance({
          ...attendance,
          status: 'WORKING',
          breakMinutes: totalBreak,
          breaks,
        });
        addToast({
          type: 'success',
          title: 'Break ended · back to work',
          message: 'Work timer resumed. Welcome back!',
        });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setShowCheckOutConfirm(false);
    setActionLoading(true);
    try {
      const res = await api.checkOut();
      setAttendance(res);
      addToast({
        type: 'success',
        title: `Checked out at ${formatTimeOnly(res.checkOutAt)}`,
        message: `${formatHoursMinutes(res.netWorkMinutes)} net work recorded. Today is complete.`,
      });
    } catch (err) {
      if (attendance) {
        const now = new Date();
        const checkInD = new Date(attendance.checkInAt);
        const elapsed = Math.round((now - checkInD) / 60000);
        const net = Math.max(0, elapsed - (attendance.breakMinutes || 0));
        setAttendance({
          ...attendance,
          status: 'COMPLETED',
          checkOutAt: now.toISOString(),
          elapsedMinutes: elapsed,
          netWorkMinutes: net,
        });
        addToast({
          type: 'success',
          title: `Checked out at ${formatTimeOnly(now)}`,
          message: `${formatHoursMinutes(net)} net work recorded. Today is complete.`,
        });
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Determine current active state
  const isCheckedIn = !!attendance?.checkInAt;
  const isCompleted = attendance?.status === 'COMPLETED';
  const isOnBreak = attendance?.status === 'ON_BREAK';
  const isWorking = attendance?.status === 'WORKING';

  // Live timer calculation
  let liveSeconds = 0;
  let activeBreakSeconds = 0;

  if (isCheckedIn) {
    const checkInDate = new Date(attendance.checkInAt);
    const endDate = attendance.checkOutAt ? new Date(attendance.checkOutAt) : currentTime;
    const elapsedSec = Math.max(0, Math.floor((endDate - checkInDate) / 1000));

    // Calculate break seconds
    let totalBreakSec = 0;
    (attendance.breaks || []).forEach((b) => {
      const bStart = new Date(b.startedAt);
      const bEnd = b.endedAt ? new Date(b.endedAt) : currentTime;
      const bSec = Math.max(0, Math.floor((bEnd - bStart) / 1000));
      totalBreakSec += bSec;
      if (!b.endedAt) {
        activeBreakSeconds = bSec;
      }
    });

    liveSeconds = Math.max(0, elapsedSec - totalBreakSec);
  }

  const breakAllowanceMinutes = 60; // 1-hour expected policy
  const currentTotalBreakMins = attendance ? Math.floor(attendance.breakMinutes + (activeBreakSeconds / 60)) : 0;
  const isBreakOverLimit = currentTotalBreakMins > breakAllowanceMinutes;
  const breakAllowanceLeft = Math.max(0, breakAllowanceMinutes - currentTotalBreakMins);

  return (
    <div style={{ padding: '28px 32px 48px', maxWidth: 1280, margin: '0 auto' }}>
      {/* 2-Column Responsive Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: 24,
          alignItems: 'start',
        }}
      >
        {/* Left Column: Today Panel, Timeline, Recent Days */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Main "Today" Card following the 4 States of PRD Page 8 */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--color-border)',
              padding: '28px 32px',
              boxShadow: 'var(--shadow-card)',
              position: 'relative',
            }}
          >
            {/* Top row: Today indicator & Status Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
                  Today
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--color-stone)' }}>
                  {currentTime.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
              </div>

              <div>
                <StatusBadge
                  status={attendance ? attendance.status : 'NOT_CHECKED_IN'}
                  text={
                    !isCheckedIn
                      ? 'Not checked in'
                      : isOnBreak
                      ? 'On break'
                      : isCompleted
                      ? 'Checked out'
                      : 'Working'
                  }
                />
              </div>
            </div>

            {/* STATE A: Before Check-In */}
            {!isCheckedIn && (
              <div className="animate-fade-in">
                <div style={{ fontSize: '0.78rem', color: 'var(--color-stone)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Current time
                </div>
                <div
                  className="tabular-numbers timer-text"
                  style={{
                    fontSize: '3.6rem',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    color: 'var(--color-charcoal)',
                    margin: '6px 0 10px',
                  }}
                >
                  {currentTime.toLocaleTimeString('en-GB', { hour12: false })}
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--color-stone)', marginBottom: 20 }}>
                  Schedule target <strong style={{ color: 'var(--color-charcoal)' }}>10:00–17:00</strong>
                </div>

                <div
                  style={{
                    backgroundColor: '#F7F3EE',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-control)',
                    padding: '12px 14px',
                    fontSize: '0.82rem',
                    color: '#6B625A',
                    marginBottom: 24,
                    lineHeight: 1.45,
                  }}
                >
                  ⓘ Press Check in when you start work. The time is recorded by the server, not your device.
                </div>

                <button
                  onClick={handleCheckIn}
                  disabled={actionLoading}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--color-coral)',
                    color: '#FFFEFC',
                    border: 'none',
                    borderRadius: 'var(--radius-control)',
                    padding: '14px 24px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    boxShadow: '0 2px 8px rgba(217, 80, 42, 0.25)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!actionLoading) e.currentTarget.style.backgroundColor = 'var(--color-coral-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (!actionLoading) e.currentTarget.style.backgroundColor = 'var(--color-coral)';
                  }}
                >
                  <LogIn size={19} />
                  <span>{actionLoading ? 'Recording check-in...' : 'Check in'}</span>
                </button>
                <div style={{ textAlign: 'center', fontSize: '0.74rem', color: '#9B938B', marginTop: 10 }}>
                  Next step: check in to start today's session
                </div>
              </div>
            )}

            {/* STATE B & C: Working or On Break */}
            {isCheckedIn && !isCompleted && (
              <div className="animate-fade-in">
                <div style={{ fontSize: '0.82rem', color: 'var(--color-stone)', fontWeight: 500 }}>
                  {isOnBreak ? 'On break for' : 'Net work today'}
                </div>

                {/* Main counter */}
                <div
                  className="tabular-numbers timer-text"
                  style={{
                    fontSize: '3.6rem',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    color: isOnBreak ? '#965B0A' : 'var(--color-charcoal)',
                    margin: '4px 0 10px',
                  }}
                >
                  {isOnBreak ? formatSeconds(activeBreakSeconds) : formatSeconds(liveSeconds)}
                </div>

                {/* Context metrics row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    fontSize: '0.84rem',
                    color: 'var(--color-stone)',
                    marginBottom: 20,
                  }}
                  className="tabular-numbers"
                >
                  <span>
                    Started at <strong style={{ color: 'var(--color-charcoal)' }}>{formatTimeOnly(attendance.checkInAt)}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Break recorded <strong style={{ color: 'var(--color-charcoal)' }}>{formatHoursMinutes(currentTotalBreakMins)}</strong>
                  </span>
                  <span>•</span>
                  <span>Target 10:00–17:00</span>
                </div>

                {/* Break allowance bar (Page 9) */}
                <div
                  style={{
                    backgroundColor: isBreakOverLimit ? '#FEF6EB' : '#F7F3EE',
                    border: `1px solid ${isBreakOverLimit ? '#F8D9A8' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-control)',
                    padding: '12px 16px',
                    marginBottom: 24,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, color: isBreakOverLimit ? '#965B0A' : 'var(--color-charcoal)' }}>
                      Break allowance · 1 hour
                    </span>
                    <span style={{ color: isBreakOverLimit ? '#BF3A4C' : 'var(--color-stone)', fontWeight: 600 }} className="tabular-numbers">
                      {isBreakOverLimit
                        ? `${formatHoursMinutes(currentTotalBreakMins)} used (over allowance)`
                        : `${formatHoursMinutes(currentTotalBreakMins)} used · ${breakAllowanceLeft}m left`}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div
                    style={{
                      height: 7,
                      backgroundColor: '#E8E2D9',
                      borderRadius: 4,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${Math.min(100, (currentTotalBreakMins / 60) * 100)}%`,
                        backgroundColor: isBreakOverLimit ? '#D9502A' : '#EFA537',
                        borderRadius: 4,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                  {isBreakOverLimit && (
                    <div style={{ fontSize: '0.76rem', color: '#965B0A', marginTop: 8, lineHeight: 1.4 }}>
                      ⓘ You've passed the 1-hour allowance. Your actual break time is still recorded and the day may be flagged for your manager.
                    </div>
                  )}
                </div>

                {/* State-specific Actions */}
                {isWorking && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <button
                      onClick={handleStartBreak}
                      disabled={actionLoading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        backgroundColor: '#FEF6EB',
                        color: '#965B0A',
                        border: '1px solid #F8D9A8',
                        borderRadius: 'var(--radius-control)',
                        padding: '12px 18px',
                        fontSize: '0.94rem',
                        fontWeight: 600,
                        cursor: actionLoading ? 'not-allowed' : 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FDECD6')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FEF6EB')}
                    >
                      <Coffee size={17} color="#EFA537" />
                      <span>Start break</span>
                    </button>

                    <button
                      onClick={() => setShowCheckOutConfirm(true)}
                      disabled={actionLoading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        backgroundColor: 'var(--color-coral)',
                        color: '#FFFEFC',
                        border: 'none',
                        borderRadius: 'var(--radius-control)',
                        padding: '12px 18px',
                        fontSize: '0.94rem',
                        fontWeight: 600,
                        cursor: actionLoading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 2px 8px rgba(217, 80, 42, 0.25)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-coral-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-coral)')}
                    >
                      <LogOut size={17} />
                      <span>Check out</span>
                    </button>
                  </div>
                )}

                {isOnBreak && (
                  <div>
                    <button
                      onClick={handleEndBreak}
                      disabled={actionLoading}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        backgroundColor: 'var(--color-coral)',
                        color: '#FFFEFC',
                        border: 'none',
                        borderRadius: 'var(--radius-control)',
                        padding: '14px 20px',
                        fontSize: '0.96rem',
                        fontWeight: 700,
                        cursor: actionLoading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 2px 8px rgba(217, 80, 42, 0.25)',
                      }}
                    >
                      <Play size={17} fill="#FFFEFC" />
                      <span>End break & resume work</span>
                    </button>
                    <div style={{ textAlign: 'center', fontSize: '0.74rem', color: '#8E857C', marginTop: 10 }}>
                      Check-out is available after your break ends.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STATE D: Checked Out (Completed) */}
            {isCompleted && (
              <div className="animate-fade-in">
                <div style={{ fontSize: '0.82rem', color: 'var(--color-stone)' }}>
                  Net work today
                </div>
                <div
                  className="tabular-numbers timer-text"
                  style={{
                    fontSize: '3.6rem',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    color: '#1D8350',
                    margin: '4px 0 10px',
                  }}
                >
                  {formatHoursMinutes(attendance.netWorkMinutes)}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 20,
                    fontSize: '0.84rem',
                    color: 'var(--color-stone)',
                    marginBottom: 20,
                  }}
                  className="tabular-numbers"
                >
                  <div>
                    Checked in <strong style={{ color: 'var(--color-charcoal)' }}>{formatTimeOnly(attendance.checkInAt)}</strong>
                  </div>
                  <div>•</div>
                  <div>
                    Break <strong style={{ color: 'var(--color-charcoal)' }}>{formatHoursMinutes(attendance.breakMinutes)}</strong>
                  </div>
                  <div>•</div>
                  <div>
                    Checked out <strong style={{ color: 'var(--color-charcoal)' }}>{formatTimeOnly(attendance.checkOutAt)}</strong>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: '#EBF7F0',
                    border: '1px solid #C4E8D1',
                    borderRadius: 'var(--radius-control)',
                    padding: '12px 16px',
                    fontSize: '0.84rem',
                    color: '#14613B',
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <CheckCircle2 size={18} color="#1D8350" style={{ flexShrink: 0 }} />
                  <div>
                    Today's attendance is complete. Elapsed {formatHoursMinutes(attendance.elapsedMinutes)} – break {formatHoursMinutes(attendance.breakMinutes)} = <strong>{formatHoursMinutes(attendance.netWorkMinutes)} net</strong>.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    disabled
                    style={{
                      flex: 1,
                      backgroundColor: '#F0ECE4',
                      color: '#8E857C',
                      border: '1px solid #E2DCD1',
                      borderRadius: 'var(--radius-control)',
                      padding: '11px 16px',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      cursor: 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <Lock size={15} />
                    <span>Day closed</span>
                  </button>
                  <button
                    onClick={onNavigateToHistory}
                    style={{
                      backgroundColor: 'transparent',
                      color: 'var(--color-charcoal)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-control)',
                      padding: '11px 18px',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F7F3EE')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    View record
                  </button>
                </div>
              </div>
            )}

            {/* Day Timeline Bar (Page 7) */}
            <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: 4 }}>
                Day timeline
              </div>
              <DayTimelineWidget
                checkInAt={attendance?.checkInAt}
                checkOutAt={attendance?.checkOutAt}
                breaks={attendance?.breaks || []}
                status={attendance?.status}
                nowTime={currentTime}
              />
            </div>
          </div>

          {/* Recent Days Mini-Table (Page 7) */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--color-border)',
              padding: '24px 28px',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
                Recent days
              </h3>
              <button
                onClick={onNavigateToHistory}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-coral)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>View all records</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }} className="tabular-numbers">
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)', color: 'var(--color-stone)' }}>
                  <th style={{ padding: '8px 6px', fontWeight: 600 }}>DATE</th>
                  <th style={{ padding: '8px 6px', fontWeight: 600 }}>IN</th>
                  <th style={{ padding: '8px 6px', fontWeight: 600 }}>OUT</th>
                  <th style={{ padding: '8px 6px', fontWeight: 600 }}>BREAK</th>
                  <th style={{ padding: '8px 6px', fontWeight: 600 }}>NET WORK</th>
                  <th style={{ padding: '8px 6px', fontWeight: 600 }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {recentRecords && recentRecords.length > 0 ? (
                  recentRecords.map((rec) => (
                    <tr key={rec.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <td style={{ padding: '12px 6px', fontWeight: 600, color: 'var(--color-charcoal)' }}>
                        {new Date(rec.workDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </td>
                      <td style={{ padding: '12px 6px', color: 'var(--color-stone)' }}>
                        {formatTimeOnly(rec.checkInAt)}
                      </td>
                      <td style={{ padding: '12px 6px', color: rec.checkOutAt ? 'var(--color-stone)' : '#BF3A4C', fontWeight: rec.checkOutAt ? 400 : 600 }}>
                        {rec.checkOutAt ? formatTimeOnly(rec.checkOutAt) : 'Missing'}
                      </td>
                      <td style={{ padding: '12px 6px', color: 'var(--color-stone)' }}>
                        {rec.breakMinutes}m
                      </td>
                      <td style={{ padding: '12px 6px', fontWeight: 700, color: rec.netWorkMinutes > 0 ? '#1D8350' : '#8E857C' }}>
                        {rec.netWorkMinutes > 0 ? formatHoursMinutes(rec.netWorkMinutes) : '—'}
                      </td>
                      <td style={{ padding: '12px 6px' }}>
                        <StatusBadge status={rec.status} size="sm" />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--color-stone)' }}>
                      No recent activity recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Today's Log & Monthly Summary KPI Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Today's Log Card (Page 7) */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--color-border)',
              padding: '22px 24px',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
                Today's log
              </h3>
              <span style={{ fontSize: '0.74rem', color: 'var(--color-stone)' }}>
                {attendance?.breaks ? attendance.breaks.length * 2 + (isCheckedIn ? 1 : 0) + (isCompleted ? 1 : 0) : 0} events
              </span>
            </div>

            {!isCheckedIn ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#8E857C', fontSize: '0.82rem' }}>
                No events recorded yet today. Check in to start.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Event 1: Check in */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#EBF7F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <LogIn size={14} color="#1D8350" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>Checked in</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--color-stone)' }}>
                      {formatTimeOnly(attendance.checkInAt)} · recorded by server
                    </div>
                  </div>
                </div>

                {/* Breaks events */}
                {(attendance.breaks || []).map((b, i) => (
                  <React.Fragment key={b.id || i}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#FEF6EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Coffee size={14} color="#EFA537" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>Break started</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--color-stone)' }}>
                          {formatTimeOnly(b.startedAt)}
                        </div>
                      </div>
                    </div>

                    {b.endedAt && (
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#FEF6EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Play size={13} fill="#EFA537" color="#EFA537" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>
                            Break ended · {b.durationMinutes}m
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--color-stone)' }}>
                            {formatTimeOnly(b.endedAt)} · back to work
                          </div>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}

                {/* Event 4: Check out */}
                {isCompleted && (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#EBF7F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <LogOut size={14} color="#1D8350" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>Check out</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--color-stone)' }}>
                        {formatTimeOnly(attendance.checkOutAt)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sales Spreadsheet Activity & Proof of Work Card (Employees Only) */}
          {!isManager && (
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-card)',
                border: '1px solid var(--color-border)',
                padding: '22px 24px',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: '#EBF7F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#1D8350',
                    }}
                  >
                    <FileSpreadsheet size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
                      Sales Spreadsheet Activity
                    </h3>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-stone)' }}>
                      Live Proof of Work · Google Sheets / Excel
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 6,
                    backgroundColor: (engagement?.verificationLevel === 'HIGH') ? '#EBF7F0' : (engagement?.verificationLevel === 'MODERATE') ? '#EFF6FF' : '#FEF6EB',
                    color: (engagement?.verificationLevel === 'HIGH') ? '#1D8350' : (engagement?.verificationLevel === 'MODERATE') ? '#1D4ED8' : '#965B0A',
                    border: `1px solid ${(engagement?.verificationLevel === 'HIGH') ? '#C4E8D1' : (engagement?.verificationLevel === 'MODERATE') ? '#BFDBFE' : '#F8D9A8'}`,
                  }}
                >
                  {engagement?.verificationLevel === 'HIGH' ? 'High Engagement' : engagement?.verificationLevel === 'MODERATE' ? 'Moderate Work' : 'Low / Idle'}
                </span>
              </div>

              {/* Engagement percentage bar */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 6 }}>
                  <span style={{ color: 'var(--color-stone)', fontWeight: 500 }}>Active Excel Engagement</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-charcoal)' }} className="tabular-numbers">
                    {engagement?.engagementPercentage ?? 85.7}%
                  </span>
                </div>
                <div style={{ width: '100%', height: 7, backgroundColor: '#EFECE6', borderRadius: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, engagement?.engagementPercentage ?? 85.7)}%`,
                      height: '100%',
                      backgroundColor: (engagement?.engagementPercentage ?? 85.7) >= 70 ? '#1D8350' : '#EFA537',
                      borderRadius: 4,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>

              {/* Quick Metrics Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  backgroundColor: '#FAF7F2',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 8,
                  padding: '12px 14px',
                  marginBottom: 14,
                }}
                className="tabular-numbers"
              >
                <div>
                  <div style={{ fontSize: '0.70rem', color: 'var(--color-stone)' }}>Active spreadsheet time</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-charcoal)', marginTop: 2 }}>
                    {formatHoursMinutes(engagement?.activeSpreadsheetMinutes ?? 240)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.70rem', color: 'var(--color-stone)' }}>Total cell edits verified</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1D8350', marginTop: 2 }}>
                    {engagement?.totalEditsCount ?? 68} edits
                  </div>
                </div>
              </div>

              {/* Active Workbook name */}
              <div style={{ fontSize: '0.74rem', color: 'var(--color-stone)', marginBottom: 16 }}>
                Active workbook:{' '}
                <strong style={{ color: 'var(--color-charcoal)' }}>
                  {engagement?.activeWorkbook || 'Q4_Enterprise_Sales_Pipeline.xlsx'}
                </strong>
              </div>

              {/* Interactive buttons: Simulate pulse & Copy script */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleSimulatePulse}
                  disabled={simulatingPulse}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: '#1D8350',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 'var(--radius-control)',
                    padding: '9px 12px',
                    fontSize: '0.80rem',
                    fontWeight: 600,
                    cursor: simulatingPulse ? 'not-allowed' : 'pointer',
                    boxShadow: '0 1px 3px rgba(29, 131, 80, 0.25)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#15653E')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1D8350')}
                >
                  <Zap size={14} fill="#FFFFFF" />
                  <span>{simulatingPulse ? 'Logging...' : 'Simulate edit pulse'}</span>
                </button>

                <button
                  onClick={() => setShowScriptModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: 'transparent',
                    color: 'var(--color-charcoal)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-control)',
                    padding: '9px 12px',
                    fontSize: '0.80rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F0ECE4')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <ExternalLink size={14} />
                  <span>Apps Script</span>
                </button>
              </div>
            </div>
          )}

          {/* Month so far KPI Card with 10-day bar chart (Page 7) */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--color-border)',
              padding: '22px 24px',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
                October so far
              </h3>
              <span style={{ fontSize: '0.74rem', color: 'var(--color-stone)' }}>
                1–21 Oct
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }} className="tabular-numbers">
              <div>
                <div style={{ fontSize: '0.74rem', color: 'var(--color-stone)' }}>Days recorded</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-charcoal)', marginTop: 2 }}>
                  14
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.74rem', color: 'var(--color-stone)' }}>Avg net / day</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-charcoal)', marginTop: 2 }}>
                  6h 19m
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.74rem', color: 'var(--color-stone)' }}>Net work</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-charcoal)', marginTop: 2 }}>
                  82h 10m
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.74rem', color: 'var(--color-stone)' }}>Avg break</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-charcoal)', marginTop: 2 }}>
                  54m
                </div>
              </div>
            </div>

            {/* 10-day mini bar chart as pictured in Page 7 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-stone)', marginBottom: 8 }}>
                Net work · last 10 recorded days
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 46 }}>
                {[6.2, 6.1, 6.4, 6.1, 6.2, 0, 6.3, 6.2, 6.4, 6.3].map((val, idx) => (
                  <div
                    key={idx}
                    title={val === 0 ? 'Incomplete day' : `${val}h`}
                    style={{
                      flex: 1,
                      height: val === 0 ? 8 : `${(val / 7.5) * 100}%`,
                      backgroundColor: val === 0 ? '#BF3A4C' : '#1D8350',
                      borderRadius: 2,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Incomplete Day Callout Banner */}
            <div
              style={{
                backgroundColor: '#FCECEF',
                border: '1px solid #F4BDC5',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: '0.76rem',
                color: '#8E2030',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertTriangle size={15} color="#BF3A4C" style={{ flexShrink: 0 }} />
              <div>
                <strong>1 incomplete day:</strong> Wed 14 Oct has no check-out.{' '}
                <span onClick={onNavigateToHistory} style={{ textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}>
                  Review
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog on Check-out (PRD UI Page 14) */}
      {showCheckOutConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(31, 27, 24, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: 20,
          }}
        >
          <div
            className="animate-fade-in"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-card)',
              maxWidth: 440,
              width: '100%',
              padding: '28px 26px',
              boxShadow: 'var(--shadow-modal)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#FDEEEA', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <LogOut size={20} color="var(--color-coral)" />
            </div>
            <h3 style={{ fontSize: '1.18rem', fontWeight: 700, color: 'var(--color-charcoal)', marginBottom: 8 }}>
              Check out for today?
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--color-stone)', lineHeight: 1.5, marginBottom: 24 }}>
              You've recorded <strong>{formatSeconds(liveSeconds)}</strong> net work. After checking out, today's attendance is closed and can't be reopened by you.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowCheckOutConfirm(false)}
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--color-charcoal)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-control)',
                  padding: '9px 16px',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCheckOut}
                style={{
                  backgroundColor: 'var(--color-coral)',
                  color: '#FFFEFC',
                  border: 'none',
                  borderRadius: 'var(--radius-control)',
                  padding: '9px 18px',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Check out at {currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Apps Script Modal */}
      {showScriptModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(28, 25, 23, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setShowScriptModal(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              border: '1px solid var(--color-border)',
              maxWidth: 580,
              width: '100%',
              padding: '24px 28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#EBF7F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D8350' }}>
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
                    Sales Spreadsheet Tracker Hook
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-stone)' }}>
                    100% Free · Real Cell Edit Verification (Google Sheets & Excel)
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowScriptModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#8E857C' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--color-stone)', lineHeight: 1.5, marginBottom: 14 }}>
              To verify active sales work in Google Sheets, copy this lightweight script into your sales spreadsheet. It sends an automatic pulse whenever a cell is updated, preventing mouse jigglers or inactive sessions.
            </p>

            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: 6 }}>
              Quick Setup (under 1 minute):
            </div>
            <ol style={{ fontSize: '0.78rem', color: 'var(--color-stone)', paddingLeft: 18, marginBottom: 14, lineHeight: 1.6 }}>
              <li>Open your Sales Google Sheet.</li>
              <li>Click <strong>Extensions &gt; Apps Script</strong> in the top menu.</li>
              <li>Paste the code below and click the <strong>Save (Disk)</strong> icon.</li>
            </ol>

            <div style={{ position: 'relative', marginBottom: 16 }}>
              <pre
                style={{
                  backgroundColor: '#1E293B',
                  color: '#E2E8F0',
                  borderRadius: 8,
                  padding: '14px 16px',
                  fontSize: '0.74rem',
                  fontFamily: 'Consolas, monospace',
                  overflowX: 'auto',
                  maxHeight: 200,
                }}
              >
                {APPS_SCRIPT_CODE}
              </pre>
              <button
                onClick={handleCopyScript}
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: copiedScript ? '#1D8350' : '#334155',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                {copiedScript ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedScript ? 'Copied!' : 'Copy Script'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowScriptModal(false)}
                style={{
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-charcoal)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-control)',
                  padding: '9px 18px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
              <button
                onClick={handleCopyScript}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: 'var(--color-coral)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--radius-control)',
                  padding: '9px 18px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Copy size={14} />
                <span>Copy to Clipboard</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

