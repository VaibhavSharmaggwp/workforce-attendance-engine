import React from 'react';
import { Clock, Calendar, BarChart2, Users, LogOut, ArrowLeftRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MOCK_EMPLOYEES } from '../../services/mockData';

export const Sidebar = ({ activeTab, onSelectTab }) => {
  const { user, logout, loginAsDemo } = useAuth();
  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  const navItems = [
    { id: 'today', label: 'Today', icon: Clock },
    { id: 'history', label: 'My attendance', icon: Calendar },
    { id: 'yearly', label: 'Yearly overview', icon: BarChart2, tag: 'Phase 2' },
  ];

  if (isManager) {
    navItems.push({ id: 'team', label: 'Team attendance', icon: Users });
  }

  // Switch between Ananya and Rahul for instantaneous testing
  const handleToggleDemoRole = () => {
    if (user?.role === 'MANAGER') {
      const emp = MOCK_EMPLOYEES.find(e => e.role === 'EMPLOYEE') || MOCK_EMPLOYEES[0];
      loginAsDemo(emp);
    } else {
      const mgr = MOCK_EMPLOYEES.find(e => e.role === 'MANAGER') || MOCK_EMPLOYEES[1];
      loginAsDemo(mgr);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <aside
      style={{
        width: 260,
        backgroundColor: '#1F1B18',
        color: '#FFFEFC',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 16px',
        flexShrink: 0,
        minHeight: '100vh',
      }}
    >
      <div>
        {/* Brand header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 8px 24px', borderBottom: '1px solid #302A25' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              backgroundColor: '#0F172A',
              border: '1.5px solid #2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 6L12 2L20 6V18L12 22L4 18V6Z" stroke="#2563EB" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M8 10L12 7L16 10V15L12 17L8 15V10Z" fill="#38BDF8"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.98rem', letterSpacing: '-0.01em', color: '#FFFEFC' }}>
              Attendance
            </div>
            <div style={{ fontSize: '0.72rem', color: '#9B938B', marginTop: -2 }}>
              Eduqynt Techviista
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: isActive ? '#2E2823' : 'transparent',
                  color: isActive ? '#FFFEFC' : '#B8B0A6',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'background 0.15s ease, color 0.15s ease',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = '#28231E';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <Icon size={18} color={isActive ? '#D9502A' : '#9B938B'} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.tag && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      backgroundColor: '#3D352E',
                      color: '#EFA537',
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    {item.tag}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom section: Demo switch + User profile */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16, borderTop: '1px solid #302A25' }}>
        {/* Quick Demo Switcher */}
        <button
          onClick={handleToggleDemoRole}
          title="Toggle between Employee and Manager view"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            width: '100%',
            padding: '7px 10px',
            borderRadius: 6,
            background: '#2B2520',
            border: '1px solid #3D352E',
            color: '#D9D2C7',
            fontSize: '0.74rem',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#362E27')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#2B2520')}
        >
          <ArrowLeftRight size={13} color="#EFA537" />
          <span>Switch to {user?.role === 'MANAGER' ? 'Employee' : 'Manager'} view</span>
        </button>

        {/* Current user card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 10px',
            backgroundColor: '#26201B',
            borderRadius: 8,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              backgroundColor: user?.role === 'MANAGER' ? '#EFA537' : '#D9502A',
              color: '#1F1B18',
              fontWeight: 700,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {getInitials(user?.fullName)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#FFFEFC',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.fullName || 'User'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#9B938B', textTransform: 'capitalize' }}>
              {user?.role ? user.role.toLowerCase() : 'Employee'}
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9B938B',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              borderRadius: 4,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#BF3A4C')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#9B938B')}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
