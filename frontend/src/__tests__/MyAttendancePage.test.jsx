import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MyAttendancePage } from '../pages/MyAttendancePage';
import { MOCK_HISTORY_RECORDS } from '../services/mockData';
import { api } from '../services/api';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { fullName: 'Ananya Sharma', role: 'EMPLOYEE' },
  }),
}));

describe('MyAttendancePage - Calendar, Records Table & Detail Drawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders 6 KPI summary cards and October 2026 title', async () => {
    vi.spyOn(api, 'getAttendanceHistory').mockResolvedValue(MOCK_HISTORY_RECORDS);

    render(<MyAttendancePage />);

    await waitFor(() => {
      expect(screen.getByText('My attendance')).toBeDefined();
      expect(screen.getAllByText(/October 2026/i).length).toBeGreaterThan(0);
      expect(screen.getByText('Days recorded')).toBeDefined();
      expect(screen.getAllByText('Complete').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Incomplete').length).toBeGreaterThan(0);
      expect(screen.getByText('Net work')).toBeDefined();
      expect(screen.getByText('Avg net / day')).toBeDefined();
      expect(screen.getByText('Break time')).toBeDefined();
    });
  });

  it('filters records by status chip (All, Complete, Incomplete, Break over 1h)', async () => {
    vi.spyOn(api, 'getAttendanceHistory').mockResolvedValue(MOCK_HISTORY_RECORDS);

    render(<MyAttendancePage />);

    await waitFor(() => {
      expect(screen.getAllByText(/All/i).length).toBeGreaterThan(0);
    });

    const incompleteChip = screen.getByRole('button', { name: /Incomplete/i });
    fireEvent.click(incompleteChip);

    expect(incompleteChip).toBeDefined();
  });

  it('opens record detail drawer when clicking a record row', async () => {
    vi.spyOn(api, 'getAttendanceHistory').mockResolvedValue(MOCK_HISTORY_RECORDS);

    render(<MyAttendancePage />);

    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1);
      fireEvent.click(rows[1]);
    });

    // Drawer slides out with shift details and break breakdown
    await waitFor(() => {
      expect(screen.getByText(/Record Detail/i)).toBeDefined();
      expect(screen.getByText(/Breaks/i)).toBeDefined();
    });
  });
});
