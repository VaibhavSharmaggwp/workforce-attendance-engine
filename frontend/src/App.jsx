import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { LoginPage } from './pages/LoginPage';
import { TodayDashboardPage } from './pages/TodayDashboardPage';
import { MyAttendancePage } from './pages/MyAttendancePage';
import { YearlyOverviewPage } from './pages/YearlyOverviewPage';
import { TeamAttendancePage } from './pages/TeamAttendancePage';
import { Clock, Calendar, BarChart2, Users } from 'lucide-react';

const AppContent = () => {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState('today');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  const bottomNavItems = [
    { id: 'today', label: 'Today', icon: Clock },
    { id: 'history', label: 'History', icon: Calendar },
    { id: 'yearly', label: 'Yearly', icon: BarChart2 },
  ];

  if (isManager) {
    bottomNavItems.push({ id: 'team', label: 'Team', icon: Users });
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-warm-white)' }}>
      {/* Sidebar Navigation (Desktop Persistent + Mobile Slide Drawer) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'team' && !isManager) return;
          setActiveTab(tab);
        }}
        isDrawerOpen={isMobileDrawerOpen}
        onCloseDrawer={() => setIsMobileDrawerOpen(false)}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Header
          subtitle={
            activeTab === 'today'
              ? null
              : activeTab === 'history'
              ? 'Personal shift history and monthly records'
              : activeTab === 'yearly'
              ? 'Long-term trends and working-time aggregations'
              : 'Team attendance and live floor oversight'
          }
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
        />

        <main style={{ flex: 1, minWidth: 0 }}>
          {activeTab === 'today' && (
            <TodayDashboardPage onNavigateToHistory={() => setActiveTab('history')} />
          )}
          {activeTab === 'history' && <MyAttendancePage />}
          {activeTab === 'yearly' && <YearlyOverviewPage />}
          {activeTab === 'team' && isManager && <TeamAttendancePage />}
        </main>
      </div>

      {/* Modern Executive Mobile Bottom Navigation Bar */}
      <nav
        className="mobile-flex"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 'calc(62px + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          backgroundColor: 'rgba(31, 27, 24, 0.96)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.22)',
          zIndex: 900,
          alignItems: 'center',
          justifyContent: 'space-around',
        }}
      >
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                background: 'none',
                border: 'none',
                color: isActive ? '#D9502A' : '#9B938B',
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: 8,
                flex: 1,
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ position: 'relative' }}>
                <Icon size={20} color={isActive ? '#D9502A' : '#9B938B'} />
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -3,
                      right: -3,
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      backgroundColor: '#D9502A',
                    }}
                  />
                )}
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: isActive ? 700 : 500 }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

