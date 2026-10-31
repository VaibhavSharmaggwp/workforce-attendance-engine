import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TodayDashboardPage } from '../pages/TodayDashboardPage';
import { ToastProvider } from '../context/ToastContext';
import { api } from '../services/api';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { fullName: 'Ananya Sharma', role: 'EMPLOYEE' },
  }),
}));

describe('TodayDashboardPage - 4 Reactive States & Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders State A (Not checked in) when no attendance record exists', async () => {
    vi.spyOn(api, 'getTodayAttendance').mockResolvedValue(null);

    render(
      <ToastProvider>
        <TodayDashboardPage onNavigateToHistory={vi.fn()} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Not checked in/i).length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: /Check in/i })).toBeDefined();
    });
  });

  it('renders State B (Working) when checked in with ticking timer', async () => {
    const now = new Date();
    vi.spyOn(api, 'getTodayAttendance').mockResolvedValue({
      id: 'test-att-1',
      workDate: now.toISOString().split('T')[0],
      status: 'WORKING',
      checkInAt: new Date(now.getTime() - 3600000).toISOString(), // 1 hr ago
      checkOutAt: null,
      elapsedMinutes: 60,
      breakMinutes: 0,
      netWorkMinutes: 60,
      breaks: [],
    });

    render(
      <ToastProvider>
        <TodayDashboardPage onNavigateToHistory={vi.fn()} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Start break')).toBeDefined();
      expect(screen.getByText('Check out')).toBeDefined();
    });
  });

  it('renders State C (On break) with 1-hour allowance progress bar', async () => {
    const now = new Date();
    vi.spyOn(api, 'getTodayAttendance').mockResolvedValue({
      id: 'test-att-2',
      workDate: now.toISOString().split('T')[0],
      status: 'ON_BREAK',
      checkInAt: new Date(now.getTime() - 7200000).toISOString(),
      checkOutAt: null,
      elapsedMinutes: 120,
      breakMinutes: 30,
      netWorkMinutes: 90,
      breaks: [
        { id: 'b1', startedAt: new Date(now.getTime() - 1800000).toISOString(), endedAt: null, durationMinutes: 30 }
      ],
    });

    render(
      <ToastProvider>
        <TodayDashboardPage onNavigateToHistory={vi.fn()} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/On break/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/End break & resume work/i)).toBeDefined();
      expect(screen.getAllByText(/Break allowance/i).length).toBeGreaterThan(0);
    });
  });

  it('renders State D (Checked out) with daily totals', async () => {
    const now = new Date();
    vi.spyOn(api, 'getTodayAttendance').mockResolvedValue({
      id: 'test-att-3',
      workDate: now.toISOString().split('T')[0],
      status: 'COMPLETED',
      checkInAt: new Date(now.getTime() - 28800000).toISOString(), // 8 hrs ago
      checkOutAt: now.toISOString(),
      elapsedMinutes: 480,
      breakMinutes: 45,
      netWorkMinutes: 435,
      breaks: [],
    });

    render(
      <ToastProvider>
        <TodayDashboardPage onNavigateToHistory={vi.fn()} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Checked out/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Today's attendance is complete/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/7h 15m/i).length).toBeGreaterThan(0);
    });
  });
});
