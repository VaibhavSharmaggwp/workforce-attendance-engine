import React, { useState, useEffect } from 'react';
import { api, buildTeamDashboard, getProvisionedTeam, clearProvisionedTeam } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Search,
  UserPlus,
  RefreshCw,
  AlertTriangle,
  Clock,
  X,
  CheckCircle2,
  Calendar,
  Filter,
  FileSpreadsheet,
  Copy,
  Check,
  Mail,
  Bell,
  BellOff,
  Zap,
  Users,
  RotateCcw,
} from 'lucide-react';

export const TeamAttendancePage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [dashboard, setDashboard] = useState(() => buildTeamDashboard(getProvisionedTeam()));
  const [teamEngagement, setTeamEngagement] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // Manager Email Alert Settings
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [togglingAlerts, setTogglingAlerts] = useState(false);
  const [runningScan, setRunningScan] = useState(false);

  // Form states for provisioning employee
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('EMPLOYEE');
  const [isProvisioning, setIsProvisioning] = useState(false);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminTeamToday();
      if (res && Array.isArray(res.members)) {
        setDashboard(res);
      } else {
        setDashboard(buildTeamDashboard(getProvisionedTeam()));
      }
      const eng = await api.getTeamEngagement();
      if (eng) setTeamEngagement(eng);

      const alertSettings = await api.getAlertSettings();
      if (alertSettings && typeof alertSettings.emailAlertsEnabled === 'boolean') {
        setEmailAlertsEnabled(alertSettings.emailAlertsEnabled);
      }
    } catch (err) {
      setDashboard(buildTeamDashboard(getProvisionedTeam()));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAlerts = async () => {
    try {
      setTogglingAlerts(true);
      const res = await api.toggleAlertSettings();
      setEmailAlertsEnabled(res.emailAlertsEnabled);
      addToast({
        type: 'success',
        title: res.emailAlertsEnabled ? 'Email Alerts Enabled' : 'Email Alerts Disabled',
        message: res.emailAlertsEnabled
          ? 'Managers will receive at most 1 email/day per employee when 2h+ inactivity is detected.'
          : 'Inactivity email alerts have been paused for managers.',
      });
    } catch (e) {
      addToast({ type: 'error', title: 'Error', message: e.message });
    } finally {
      setTogglingAlerts(false);
    }
  };

  const handleTriggerScan = async () => {
    try {
      setRunningScan(true);
      const res = await api.triggerInactivityScan();
      addToast({
        type: 'success',
        title: 'Kafka Scan Executed',
        message: res.message || 'Inactivity scan complete.',
      });
    } catch (e) {
      addToast({ type: 'error', title: 'Scan Error', message: e.message });
    } finally {
      setRunningScan(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!newFullName || !newEmail) {
      addToast({ type: 'error', title: 'Missing fields', message: 'Please provide full name and work email.' });
      return;
    }

    setIsProvisioning(true);
    try {
      await api.provisionEmployee({
        fullName: newFullName.trim(),
        email: newEmail.trim().toLowerCase(),
        role: newRole,
      });
      addToast({
        type: 'success',
        title: 'Employee provisioned',
        message: `${newFullName} (${newEmail}) has been provisioned. They can now sign in to record attendance.`,
      });
      setShowAddModal(false);
      setNewFullName('');
      setNewEmail('');
      await fetchTeamData();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Provisioning error',
        message: err.message || 'Failed to provision employee.',
      });
    } finally {
      setIsProvisioning(false);
    }
  };

  const formatTimeOnly = (isoString) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  // Filter members by search and status chip
  const filteredMembers = (dashboard.members || []).filter((m) => {
    const matchesSearch =
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'WORKING') return m.status === 'WORKING';
    if (statusFilter === 'ON_BREAK') return m.status === 'ON_BREAK';
    if (statusFilter === 'CHECKED_OUT') return m.status === 'COMPLETED';
    if (statusFilter === 'NOT_CHECKED_IN') return m.status === 'NOT_CHECKED_IN';
    if (statusFilter === 'INCOMPLETE') return m.status === 'INCOMPLETE' || m.breakOverOneHour;
    return true;
  });

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div style={{ padding: '28px 32px 56px', maxWidth: 1280, margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.38rem', fontWeight: 800, color: 'var(--color-charcoal)', letterSpacing: '-0.02em' }}>
            Team attendance
          </h2>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-stone)', marginTop: 2 }}>
            Thursday, 22 October 2026 · live as of {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Search box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-control)',
              padding: '7px 12px',
              boxShadow: 'var(--shadow-subtle)',
            }}
          >
            <Search size={15} color="var(--color-stone)" />
            <input
              type="text"
              placeholder="Search employee"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.84rem',
                color: 'var(--color-charcoal)',
                width: 160,
              }}
            />
          </div>

          {/* Sales Tracker Script Button */}
          <button
            onClick={() => setShowScriptModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#EBF7F0',
              color: '#1D8350',
              border: '1px solid #C4E8D1',
              borderRadius: 'var(--radius-control)',
              padding: '8px 14px',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#DCF2E4')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#EBF7F0')}
          >
            <FileSpreadsheet size={15} />
            <span>Sales Sheets Hook</span>
          </button>

          {/* Clear Test Roster Button (Allows manager to test from zero employees) */}
          {dashboard.members && dashboard.members.length > 0 && (
            <button
              onClick={() => {
                clearProvisionedTeam();
                setDashboard(buildTeamDashboard([]));
                addToast({
                  type: 'info',
                  title: 'Roster Reset',
                  message: 'Team roster cleared. You can now provision fresh test employees from scratch.',
                });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'transparent',
                color: 'var(--color-stone)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-control)',
                padding: '8px 12px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              title="Clear roster to test adding from scratch"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F7F3EE')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <RotateCcw size={14} />
              <span>Clear roster</span>
            </button>
          )}

          {/* Provision Employee Button */}
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: 'var(--color-coral)',
              color: '#FFFEFC',
              border: 'none',
              borderRadius: 'var(--radius-control)',
              padding: '8px 14px',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(217, 80, 42, 0.2)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-coral-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-coral)')}
          >
            <UserPlus size={15} />
            <span>Provision employee</span>
          </button>
        </div>
      </div>

      {/* Inactivity Email Notifications Bar */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          padding: '12px 18px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              backgroundColor: emailAlertsEnabled ? '#EBF7F0' : '#F0ECE4',
              color: emailAlertsEnabled ? '#1D8350' : '#8E857C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Mail size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>
              Inactivity Email Alerts
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--color-stone)' }}>
              Notify manager when an employee is checked in but idle for over 2 hours (max 1 email per day).
            </div>
          </div>
        </div>

        <div>
          {/* Simple ON / OFF Button */}
          <button
            onClick={handleToggleAlerts}
            disabled={togglingAlerts}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: emailAlertsEnabled ? '#1D8350' : '#6B635B',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 'var(--radius-control)',
              padding: '6px 14px',
              fontSize: '0.80rem',
              fontWeight: 600,
              cursor: togglingAlerts ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            {emailAlertsEnabled ? <Bell size={13} /> : <BellOff size={13} />}
            <span>{emailAlertsEnabled ? 'Alerts ON' : 'Alerts OFF'}</span>
          </button>
        </div>
      </div>

      {/* Live Counts Top Cards (PRD UI Page 13) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 26,
        }}
        className="tabular-numbers"
      >
        {/* Working */}
        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: '16px 18px', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: '#14613B', fontWeight: 600 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#1D8350' }} />
            Working
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-charcoal)', marginTop: 4 }}>
            {dashboard.workingCount}/{dashboard.totalEmployees}
          </div>
        </div>

        {/* On break */}
        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: '16px 18px', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: '#965B0A', fontWeight: 600 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#EFA537' }} />
            On break
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-charcoal)', marginTop: 4 }}>
            {dashboard.onBreakCount}/{dashboard.totalEmployees}
          </div>
        </div>

        {/* Checked out */}
        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: '16px 18px', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: 'var(--color-stone)', fontWeight: 600 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#8E857C' }} />
            Checked out
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-charcoal)', marginTop: 4 }}>
            {dashboard.checkedOutCount}/{dashboard.totalEmployees}
          </div>
        </div>

        {/* Not checked in */}
        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: '16px 18px', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: 'var(--color-stone)', fontWeight: 600 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#C4BCB0' }} />
            Not checked in
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-charcoal)', marginTop: 4 }}>
            {dashboard.notCheckedInCount}/{dashboard.totalEmployees}
          </div>
        </div>

        {/* Needs review (Alert Box, Page 13) */}
        <div
          style={{
            backgroundColor: '#FCECEF',
            border: '1px solid #F4BDC5',
            borderRadius: 'var(--radius-card)',
            padding: '16px 18px',
            boxShadow: 'var(--shadow-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: '#8E2030', fontWeight: 700 }}>
            <AlertTriangle size={14} color="#BF3A4C" />
            Needs review
          </div>
          <div style={{ fontSize: '0.78rem', color: '#8E2030', marginTop: 4, lineHeight: 1.4 }}>
            <div>1 incomplete day yesterday</div>
            <div>{dashboard.overBreakCount} break over 1h today</div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-border)',
          padding: '24px 26px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* Filter Chips Bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All' },
            { id: 'WORKING', label: 'Working' },
            { id: 'ON_BREAK', label: 'On break' },
            { id: 'CHECKED_OUT', label: 'Checked out' },
            { id: 'NOT_CHECKED_IN', label: 'Not checked in' },
            { id: 'INCOMPLETE', label: 'Incomplete' },
          ].map(chip => (
            <button
              key={chip.id}
              onClick={() => setStatusFilter(chip.id)}
              style={{
                padding: '5px 12px',
                borderRadius: 9999,
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: statusFilter === chip.id ? '1px solid var(--color-charcoal)' : '1px solid var(--color-border)',
                backgroundColor: statusFilter === chip.id ? 'var(--color-charcoal)' : '#FFFEFC',
                color: statusFilter === chip.id ? '#FFFEFC' : 'var(--color-stone)',
                transition: 'all 0.15s ease',
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Team Table (Page 13) */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }} className="tabular-numbers">
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)', color: 'var(--color-stone)' }}>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>EMPLOYEE</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>CHECK-IN</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>BREAKS</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>NET SO FAR</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>EXCEL PROOF</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>STATUS</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '54px 20px', color: 'var(--color-stone)' }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: '#F0ECE4',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-stone)',
                        marginBottom: 12,
                      }}
                    >
                      <Users size={24} />
                    </div>
                    <div style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--color-charcoal)', marginBottom: 4 }}>
                      No employees in team roster yet
                    </div>
                    <p style={{ fontSize: '0.84rem', color: '#8E857C', maxWidth: 420, margin: '0 auto 18px', lineHeight: 1.45 }}>
                      {searchQuery || statusFilter !== 'ALL'
                        ? 'No team members match your current filter.'
                        : 'Your team roster is clean. Click "Provision employee" above to register your first team member with their corporate email.'}
                    </p>
                    {statusFilter === 'ALL' && !searchQuery && (
                      <button
                        onClick={() => setShowAddModal(true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          backgroundColor: 'var(--color-coral)',
                          color: '#FFFEFC',
                          border: 'none',
                          borderRadius: 'var(--radius-control)',
                          padding: '9px 18px',
                          fontSize: '0.84rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(217, 80, 42, 0.2)',
                        }}
                      >
                        <UserPlus size={15} />
                        <span>Provision first employee</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => (
                <tr
                  key={m.employeeId}
                  style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAF7F2')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {/* Employee Info with Avatar initials */}
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: '#F0ECE4',
                          color: 'var(--color-charcoal)',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {getInitials(m.fullName)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-charcoal)' }}>{m.fullName}</div>
                        <div style={{ fontSize: '0.72rem', color: '#8E857C' }}>{m.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Check-In */}
                  <td style={{ padding: '12px', color: 'var(--color-stone)' }}>
                    {formatTimeOnly(m.checkInAt)}
                  </td>

                  {/* Breaks */}
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'var(--color-stone)' }}>
                        {m.breakCount > 0
                          ? `${m.breakCount} - ${m.hasActiveBreak ? `open ${m.activeBreakMinutes}m` : `${m.totalBreakMinutes}m`}`
                          : '—'}
                      </span>
                      {m.breakOverOneHour && (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            backgroundColor: '#FEF6EB',
                            color: '#965B0A',
                            border: '1px solid #F8D9A8',
                            borderRadius: 4,
                            padding: '1px 5px',
                          }}
                        >
                          Break over 1h
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Net so far */}
                  <td style={{ padding: '12px', fontWeight: 700, color: m.netWorkMinutes > 0 ? '#1D8350' : '#8E857C' }}>
                    {m.netWorkFormatted || '—'}
                  </td>

                  {/* Excel Proof Column */}
                  <td style={{ padding: '12px' }}>
                    {(() => {
                      const eng = teamEngagement.find((e) => e.employeeId === m.employeeId || e.employeeEmail === m.email);
                      if (m.status === 'NOT_CHECKED_IN') {
                        return <span style={{ color: '#8E857C', fontSize: '0.78rem' }}>—</span>;
                      }
                      if (eng) {
                        const isHigh = eng.verificationLevel === 'HIGH' || eng.engagementPercentage >= 70;
                        const isMod = eng.verificationLevel === 'MODERATE' || (eng.engagementPercentage >= 40 && eng.engagementPercentage < 70);
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '2px 7px',
                                borderRadius: 4,
                                width: 'fit-content',
                                backgroundColor: isHigh ? '#EBF7F0' : isMod ? '#EFF6FF' : '#FEF6EB',
                                color: isHigh ? '#1D8350' : isMod ? '#1D4ED8' : '#965B0A',
                                border: `1px solid ${isHigh ? '#C4E8D1' : isMod ? '#BFDBFE' : '#F8D9A8'}`,
                              }}
                              title={`${eng.totalEditsCount} verified edits in ${eng.activeWorkbook || 'Sales Sheet'}`}
                            >
                              <FileSpreadsheet size={12} />
                              <span>{eng.engagementPercentage}% Active</span>
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#8E857C' }}>
                              {eng.totalEditsCount} verified edits
                            </span>
                          </div>
                        );
                      }
                      return <span style={{ color: '#8E857C', fontSize: '0.78rem' }}>Pending pulse</span>;
                    })()}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '12px' }}>
                    <StatusBadge
                      status={m.status}
                      text={
                        m.status === 'COMPLETED' && m.checkOutAt
                          ? `Checked out at ${formatTimeOnly(m.checkOutAt)}`
                          : undefined
                      }
                      size="sm"
                    />
                  </td>

                  {/* Action */}
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button
                      onClick={() => setSelectedMember(m)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-coral)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      View
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>

        {/* Table footer with refresh */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, fontSize: '0.78rem', color: '#8E857C' }}>
          <span>{filteredMembers.length} employees · updated {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
          <button
            onClick={fetchTeamData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              color: 'var(--color-stone)',
              cursor: 'pointer',
              fontSize: '0.78rem',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Member Day Detail Modal */}
      {selectedMember && (
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
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-card)',
              maxWidth: 480,
              width: '100%',
              padding: '28px 26px',
              boxShadow: 'var(--shadow-modal)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#F0ECE4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                  {getInitials(selectedMember.fullName)}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
                    {selectedMember.fullName}
                  </h3>
                  <div style={{ fontSize: '0.74rem', color: 'var(--color-stone)' }}>{selectedMember.email}</div>
                </div>
              </div>
              <button onClick={() => setSelectedMember(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-stone)' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: 18 }}>
              <StatusBadge status={selectedMember.status} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, backgroundColor: '#F7F3EE', borderRadius: 8, padding: '12px 14px', marginBottom: 20 }} className="tabular-numbers">
              <div>
                <div style={{ fontSize: '0.7rem', color: '#8E857C' }}>Check In</div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', marginTop: 2 }}>{formatTimeOnly(selectedMember.checkInAt)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#8E857C' }}>Breaks</div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', marginTop: 2 }}>{selectedMember.totalBreakMinutes}m</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#8E857C' }}>Net Work</div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1D8350', marginTop: 2 }}>{selectedMember.netWorkFormatted}</div>
              </div>
            </div>

            {selectedMember.breakOverOneHour && (
              <div style={{ backgroundColor: '#FEF6EB', border: '1px solid #F8D9A8', borderRadius: 8, padding: '10px 12px', fontSize: '0.78rem', color: '#965B0A', marginBottom: 16 }}>
                ⚠️ <strong>Flagged:</strong> This employee has exceeded the 1-hour daily break policy ({selectedMember.totalBreakMinutes}m recorded).
              </div>
            )}

            <button
              onClick={() => setSelectedMember(null)}
              style={{
                width: '100%',
                backgroundColor: 'var(--color-charcoal)',
                color: '#FFFEFC',
                border: 'none',
                borderRadius: 'var(--radius-control)',
                padding: '10px',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Provision Employee Modal */}
      {showAddModal && (
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
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="animate-fade-in"
            onClick={(e) => e.stopPropagation()}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.14rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
                Provision New Employee
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-stone)' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--color-stone)', marginBottom: 18, lineHeight: 1.45 }}>
              Register an employee using their <strong>Gmail address</strong>. When the employee clicks <em>"Continue with Google"</em>, they must sign in with this exact Gmail account.
            </p>

            <form onSubmit={handleAddEmployee}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: 4 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Patel"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-control)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.86rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: 4 }}>
                  Google / Gmail Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. maya.patel@gmail.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-control)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.86rem',
                  }}
                />
                <div style={{ fontSize: '0.72rem', color: '#8E857C', marginTop: 4 }}>
                  ⓘ No corporate email needed. Any personal or work Gmail (@gmail.com) works 100% free with Google SSO.
                </div>
              </div>

              <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: 4 }}>
                  System Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-control)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.86rem',
                    backgroundColor: '#FFFEFC',
                  }}
                >
                  <option value="EMPLOYEE">Employee (Check-in, Breaks, Personal History)</option>
                  <option value="MANAGER">Manager (Team Attendance, Provisioning)</option>
                  <option value="ADMIN">Admin (Full System Permissions)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--color-charcoal)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-control)',
                    padding: '9px 16px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProvisioning}
                  style={{
                    backgroundColor: 'var(--color-coral)',
                    color: '#FFFEFC',
                    border: 'none',
                    borderRadius: 'var(--radius-control)',
                    padding: '9px 18px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: isProvisioning ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isProvisioning ? 'Saving...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sales Spreadsheet Tracker Hook Modal */}
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
              maxWidth: 600,
              width: '100%',
              padding: '26px 30px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#EBF7F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D8350' }}>
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.08rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
                    Sales Spreadsheet Proof of Work
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-stone)' }}>
                    Google Sheets & Excel Online Hook · 100% Free
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
              Instruct your sales reps to add this lightweight Apps Script to their sales workbooks. It logs active cell edits to the Attendance Engine, calculating real engagement percentages and flagging inactive ghost sessions.
            </p>

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
{`var ATTENDANCE_API_URL = "${window.location.origin}/api/v1/activity/pulse";

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
}`}
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`var ATTENDANCE_API_URL = "${window.location.origin}/api/v1/activity/pulse";\n\nfunction onEdit(e) {\n  try {\n    var email = Session.getActiveUser().getEmail();\n    var sheet = SpreadsheetApp.getActiveSpreadsheet();\n    var range = e ? e.range.getA1Notation() : "A1";\n\n    UrlFetchApp.fetch(ATTENDANCE_API_URL, {\n      method: "post",\n      contentType: "application/json",\n      payload: JSON.stringify({\n        employeeEmail: email,\n        workbookName: sheet.getName(),\n        sheetName: e ? e.range.getSheet().getName() : "Sheet1",\n        cellRange: range,\n        activityType: "CELL_EDIT",\n        details: "Cell edited by " + email,\n        loggedAt: new Date().toISOString()\n      }),\n      muteHttpExceptions: true\n    });\n  } catch (err) {\n    Logger.log("Pulse error: " + err);\n  }\n}`);
                  setCopiedScript(true);
                  addToast({ type: 'success', title: 'Script Copied', message: 'Apps Script code copied to clipboard!' });
                  setTimeout(() => setCopiedScript(false), 2500);
                }}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

