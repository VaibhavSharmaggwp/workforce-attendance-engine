import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { YearlyOverviewPage } from '../pages/YearlyOverviewPage';

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { fullName: 'Ananya Sharma', role: 'EMPLOYEE' },
  }),
}));

describe('YearlyOverviewPage - LeetCode Style Activity Histogram & Calendar Heatmap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page header, Annual Analytics badge, and KPI summary cards', async () => {
    render(<YearlyOverviewPage />);

    expect(screen.getByText('Yearly overview')).toBeDefined();
    expect(screen.getByText('Annual Analytics')).toBeDefined();
    expect(screen.getByText('Days recorded')).toBeDefined();
    expect(screen.getByText('Complete days')).toBeDefined();
    expect(screen.getAllByText(/Incomplete/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Net work')).toBeDefined();
    expect(screen.getByText('Avg net / day')).toBeDefined();
  });

  it('renders the Monthly Net Work Hours Histogram with 120h target line', async () => {
    render(<YearlyOverviewPage />);

    expect(screen.getByText(/Net work hours by month \(Histogram\)/i)).toBeDefined();
    expect(screen.getByText('120h target')).toBeDefined();
    expect(screen.getByText('* Oct in progress')).toBeDefined();
  });

  it('renders the 52-week LeetCode-style activity matrix with month headers and day labels', async () => {
    render(<YearlyOverviewPage />);

    expect(screen.getByText('Daily pattern')).toBeDefined();
    expect(screen.getByText('(52-Week LeetCode-style activity matrix)')).toBeDefined();

    // Verify row labels
    expect(screen.getByText('Mon')).toBeDefined();
    expect(screen.getByText('Wed')).toBeDefined();
    expect(screen.getByText('Fri')).toBeDefined();

    // Verify month labels exist in the matrix
    expect(screen.getAllByText('Jan').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Oct').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Dec').length).toBeGreaterThan(0);

    // Verify streak stats
    expect(screen.getByText(/Current streak:/i)).toBeDefined();
    expect(screen.getByText(/Longest streak:/i)).toBeDefined();
  });

  it('allows switching year from the year dropdown', async () => {
    render(<YearlyOverviewPage />);

    const yearBtn = screen.getByRole('button', { name: /2026/i });
    expect(yearBtn).toBeDefined();

    fireEvent.click(yearBtn);

    // Dropdown shows options 2025 and 2024
    const opt2025 = screen.getByRole('button', { name: /2025/i });
    expect(opt2025).toBeDefined();

    fireEvent.click(opt2025);

    await waitFor(() => {
      expect(screen.getByText('No data available for 2025')).toBeDefined();
    });

    // Test clicking Switch back to 2026 Overview
    const switchBackBtn = screen.getByRole('button', { name: /Switch to 2026 Overview/i });
    expect(switchBackBtn).toBeDefined();
    fireEvent.click(switchBackBtn);

    await waitFor(() => {
      expect(screen.getByText(/Net work hours by month \(Histogram\)/i)).toBeDefined();
    });
  });
});
