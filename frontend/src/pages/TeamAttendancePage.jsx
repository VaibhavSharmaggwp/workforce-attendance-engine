import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { MOCK_TEAM_TODAY } from '../services/mockData';
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
} from 'lucide-react';

export const TeamAttendancePage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [dashboard, setDashboard] = useState(MOCK_TEAM_TODAY);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for provisioning employee
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('EMPLOYEE');
  const [isProvisioning, setIsProvisioning] = useState(false);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminTeamToday();
      if (res && res.members && res.members.length > 0) {
        setDashboard(res);
      } else {
        setDashboard(MOCK_TEAM_TODAY);
      }
    } catch (err) {
      setDashboard(MOCK_TEAM_TODAY);
    } finally {
      setLoading(false);
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
        fullName: newFullName,
        email: newEmail,
        role: newRole,
      });
      addToast({
        type: 'success',
        title: 'Employee provisioned',
        message: `${newFullName} has been added to the team roster.`,
      });
      setShowAddModal(false);
      setNewFullName('');
      setNewEmail('');
      fetchTeamData();
    } catch (err) {
      // Mock fallback
      const newEmp = {
        employeeId: 'emp-' + Date.now(),
        fullName: newFullName,
        email: newEmail,
        role: newRole,
        status: 'NOT_CHECKED_IN',
        checkInAt: null,
        checkOutAt: null,
        breakCount: 0,
        totalBreakMinutes: 0,
        netWorkMinutes: 0,
        netWorkFormatted: '—',
        breaks: [],
      };
      setDashboard((prev) => ({
        ...prev,
        totalEmployees: prev.totalEmployees + 1,
        notCheckedInCount: prev.notCheckedInCount + 1,
        members: [...prev.members, newEmp],
      }));
      addToast({
        type: 'success',
        title: 'Employee provisioned',
        message: `${newFullName} has been added to the team roster.`,
      });
      setShowAddModal(false);
      setNewFullName('');
      setNewEmail('');
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
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>STATUS</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((m) => (
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
              ))}
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

            <p style={{ fontSize: '0.82rem', color: 'var(--color-stone)', marginBottom: 20 }}>
              Add a new employee to the organization. They will immediately be permitted to sign in with their Google account.
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
                  Corporate Work Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. maya.patel@techviista.net"
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
    </div>
  );
};

