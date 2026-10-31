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
});
