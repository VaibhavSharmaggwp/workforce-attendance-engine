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

const AppContent = () => {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState('today');

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-warm-white)' }}>
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'team' && !isManager) return;
          setActiveTab(tab);
        }}
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
