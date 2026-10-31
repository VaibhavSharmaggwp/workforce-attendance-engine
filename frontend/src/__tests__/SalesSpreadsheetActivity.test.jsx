import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TodayDashboardPage } from '../pages/TodayDashboardPage';
import { TeamAttendancePage } from '../pages/TeamAttendancePage';
import { ToastProvider } from '../context/ToastContext';

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      fullName: 'Ananya Sharma',
      email: 'ananya.sharma@techviista.net',
      role: 'EMPLOYEE',
    },
  }),
}));

describe('Sales Spreadsheet Activity & Proof-of-Work Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem(
      'ams_provisioned_team',
      JSON.stringify([
        {
          employeeId: 'emp-ananya',
          fullName: 'Ananya Sharma',
          email: 'ananya.sharma@techviista.net',
          role: 'EMPLOYEE',
          status: 'WORKING',
          checkInAt: '2026-10-31T09:30:00+05:30',
          checkOutAt: null,
          breakCount: 1,
          totalBreakMinutes: 45,
          netWorkMinutes: 280,
          netWorkFormatted: '4h 40m',
          breaks: [],
        },
      ])
    );
  });

  it('renders the Sales Spreadsheet Activity card with engagement percentage and active workbook', async () => {
    render(
      <ToastProvider>
        <TodayDashboardPage onNavigateToHistory={() => {}} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Sales Spreadsheet Activity/i)).toBeDefined();
      expect(screen.getByText(/Live Proof of Work/i)).toBeDefined();
      expect(screen.getByText(/85.7%/i)).toBeDefined();
      expect(screen.getByText(/Q4_Enterprise_Sales_Pipeline.xlsx/i)).toBeDefined();
    });
  });

  it('opens Google Apps Script modal when clicking Apps Script button', async () => {
    render(
      <ToastProvider>
        <TodayDashboardPage onNavigateToHistory={() => {}} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Apps Script/i)).toBeDefined();
    });

    const scriptBtn = screen.getByRole('button', { name: /Apps Script/i });
    fireEvent.click(scriptBtn);

    await waitFor(() => {
      expect(screen.getByText(/Sales Spreadsheet Tracker Hook/i)).toBeDefined();
      expect(screen.getByText(/100% Free · Real Cell Edit Verification/i)).toBeDefined();
      expect(screen.getByText(/Copy Script/i)).toBeDefined();
    });
  });

  it('renders the EXCEL PROOF column with activity percentages in TeamAttendancePage', async () => {
    render(
      <ToastProvider>
        <TeamAttendancePage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/EXCEL PROOF/i)).toBeDefined();
      expect(screen.getByText(/Sales Sheets Hook/i)).toBeDefined();
      expect(screen.getAllByText(/85.7% Active/i).length).toBeGreaterThan(0);
    });
  });

  it('renders the Manager Inactivity Email Alerts toggle card and allows turning alerts on and off', async () => {
    render(
      <ToastProvider>
        <TeamAttendancePage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Inactivity Email Alerts/i)).toBeDefined();
      expect(screen.getByText(/Alerts ON/i)).toBeDefined();
    });

    const toggleBtn = screen.getByRole('button', { name: /Alerts ON/i });
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(screen.getByText(/Alerts OFF/i)).toBeDefined();
    });
  });

  it('allows manager to provision a new employee and displays them as NOT_CHECKED_IN', async () => {
    localStorage.removeItem('ams_provisioned_team');
    render(
      <ToastProvider>
        <TeamAttendancePage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/No employees in team roster yet/i)).toBeDefined();
    });

    const addBtn = screen.getByRole('button', { name: /Provision first employee/i });
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByText(/Provision New Employee/i)).toBeDefined();
    });

    const nameInput = screen.getByPlaceholderText(/Maya Patel/i);
    const emailInput = screen.getByPlaceholderText(/maya.patel@gmail.com/i);
    fireEvent.change(nameInput, { target: { value: 'Pooja Sharma' } });
    fireEvent.change(emailInput, { target: { value: 'pooja.sharma@gmail.com' } });

    const submitBtn = screen.getByRole('button', { name: /Add Employee/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Pooja Sharma')).toBeDefined();
      expect(screen.getByText('pooja.sharma@gmail.com')).toBeDefined();
    });
  });
});
