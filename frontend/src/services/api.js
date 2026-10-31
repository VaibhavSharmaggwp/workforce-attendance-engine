// API Service with JWT authentication, resilient fallback, and seamless demo mode
import { MOCK_EMPLOYEES, MOCK_HISTORY_RECORDS, MOCK_TEAM_TODAY, MOCK_YEARLY_OVERVIEW, MOCK_ENGAGEMENT_TODAY, MOCK_TEAM_ENGAGEMENT } from './mockData';

const API_BASE = '/api/v1';

export const getAccessToken = () => localStorage.getItem('ams_access_token');
export const setTokens = (accessToken, refreshToken) => {
  if (accessToken) localStorage.setItem('ams_access_token', accessToken);
  if (refreshToken) localStorage.setItem('ams_refresh_token', refreshToken);
};
export const clearTokens = () => {
  localStorage.removeItem('ams_access_token');
  localStorage.removeItem('ams_refresh_token');
  localStorage.removeItem('ams_user');
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('ams_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (user) localStorage.setItem('ams_user', JSON.stringify(user));
};

export const isDemoToken = (token) => {
  return !token || token.startsWith('demo-') || token.startsWith('mock-');
};

// In-memory session state for demo actions when offline
let localDemoAttendance = null;

async function request(endpoint, options = {}) {
  const token = getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (netErr) {
    const err = new Error('Network error: backend service unreachable');
    err.isNetworkError = true;
    throw err;
  }

  if (response.status === 401) {
    const isDemo = isDemoToken(token);
    // Never expire session if user is in demo mode or calling auth endpoints
    if (!isDemo && !endpoint.includes('/auth/login') && !endpoint.includes('/me')) {
      clearTokens();
      window.dispatchEvent(new Event('ams_auth_expired'));
    }
    const err = await response.json().catch(() => ({ message: 'Unauthorized' }));
    const error = new Error(err.message || 'Unauthorized');
    error.status = 401;
    throw error;
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.message || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = errorBody;
    throw error;
  }

  // Handle empty responses
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  // Auth
  login: async (email, password) => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  getMe: async () => {
    return request('/me');
  },
  getDemoAccounts: async () => {
    try {
      const res = await request('/auth/demo-accounts');
      if (res && res.length > 0) return res;
      return MOCK_EMPLOYEES;
    } catch {
      return MOCK_EMPLOYEES;
    }
  },
  getHealth: async () => {
    return request('/health');
  },

  // Attendance
  getTodayAttendance: async () => {
    const token = getAccessToken();
    if (isDemoToken(token) && localDemoAttendance !== null) {
      return localDemoAttendance;
    }
    try {
      const res = await request('/attendance/today');
      return res;
    } catch (err) {
      if (isDemoToken(token) || err.isNetworkError || err.status === 401) {
        return localDemoAttendance;
      }
      throw err;
    }
  },
  checkIn: async () => {
    const token = getAccessToken();
    try {
      const res = await request('/attendance/check-in', { method: 'POST' });
      localDemoAttendance = res;
      return res;
    } catch (err) {
      if (isDemoToken(token) || err.isNetworkError || err.status === 401 || err.status === 500) {
        const now = new Date();
        const mock = {
          id: 'demo-att-' + Date.now(),
          workDate: now.toISOString().split('T')[0],
          status: 'WORKING',
          checkInAt: now.toISOString(),
          checkOutAt: null,
          elapsedMinutes: 0,
          breakMinutes: 0,
          netWorkMinutes: 0,
          breaks: [],
        };
        localDemoAttendance = mock;
        return mock;
      }
      throw err;
    }
  },
  startBreak: async () => {
    const token = getAccessToken();
    try {
      const res = await request('/attendance/breaks/start', { method: 'POST' });
      localDemoAttendance = res;
      return res;
    } catch (err) {
      if (isDemoToken(token) || err.isNetworkError || err.status === 401 || err.status === 500) {
        const now = new Date();
        const currentBreaks = (localDemoAttendance && localDemoAttendance.breaks) ? [...localDemoAttendance.breaks] : [];
        currentBreaks.push({
          id: 'b-' + Date.now(),
          startedAt: now.toISOString(),
          endedAt: null,
          durationMinutes: 0,
        });
        const updated = {
          ...(localDemoAttendance || {
            id: 'demo-att-' + Date.now(),
            workDate: now.toISOString().split('T')[0],
            checkInAt: now.toISOString(),
            elapsedMinutes: 0,
            breakMinutes: 0,
            netWorkMinutes: 0,
          }),
          status: 'ON_BREAK',
          breaks: currentBreaks,
        };
        localDemoAttendance = updated;
        return updated;
      }
      throw err;
    }
  },
  endBreak: async () => {
    const token = getAccessToken();
    try {
      const res = await request('/attendance/breaks/end', { method: 'POST' });
      localDemoAttendance = res;
      return res;
    } catch (err) {
      if (isDemoToken(token) || err.isNetworkError || err.status === 401 || err.status === 500) {
        const now = new Date();
        const breaks = ((localDemoAttendance && localDemoAttendance.breaks) || []).map((b) => {
          if (!b.endedAt) {
            const start = new Date(b.startedAt);
            const diffMin = Math.max(1, Math.round((now - start) / 60000));
            return { ...b, endedAt: now.toISOString(), durationMinutes: diffMin };
          }
          return b;
        });
        const totalBreakMins = breaks.reduce((acc, b) => acc + (b.durationMinutes || 0), 0);
        const updated = {
          ...(localDemoAttendance || {}),
          status: 'WORKING',
          breakMinutes: totalBreakMins,
          breaks,
        };
        localDemoAttendance = updated;
        return updated;
      }
      throw err;
    }
  },
  checkOut: async () => {
    const token = getAccessToken();
    try {
      const res = await request('/attendance/check-out', { method: 'POST' });
      localDemoAttendance = res;
      return res;
    } catch (err) {
      if (isDemoToken(token) || err.isNetworkError || err.status === 401 || err.status === 500) {
        const now = new Date();
        const checkIn = localDemoAttendance?.checkInAt
          ? new Date(localDemoAttendance.checkInAt)
          : new Date(Date.now() - 8.2 * 3600000);
        const grossMinutes = Math.max(0, Math.round((now - checkIn) / 60000));
        const breakMins = localDemoAttendance?.breakMinutes || 45;
        const netWorkMinutes = Math.max(0, grossMinutes - breakMins);
        const updated = {
          ...(localDemoAttendance || {
            id: 'demo-att-' + Date.now(),
            workDate: now.toISOString().split('T')[0],
            checkInAt: checkIn.toISOString(),
            breaks: [],
          }),
          status: 'COMPLETED',
          checkOutAt: now.toISOString(),
          elapsedMinutes: grossMinutes,
          breakMinutes: breakMins,
          netWorkMinutes,
        };
        localDemoAttendance = updated;
        return updated;
      }
      throw err;
    }
  },
  getAttendanceHistory: async () => {
    try {
      const res = await request('/attendance/history');
      if (res && res.length > 0) return res;
      return MOCK_HISTORY_RECORDS;
    } catch {
      return MOCK_HISTORY_RECORDS;
    }
  },

  // Admin
  getAdminTeamToday: async (dateStr) => {
    try {
      const q = dateStr ? `?date=${encodeURIComponent(dateStr)}` : '';
      const res = await request(`/admin/attendance/today${q}`);
      if (res && res.roster) return res;
      return MOCK_TEAM_TODAY;
    } catch {
      return MOCK_TEAM_TODAY;
    }
  },
  getAdminAttendanceList: async ({ date, employeeId, status } = {}) => {
    try {
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      if (employeeId) params.append('employeeId', employeeId);
      if (status) params.append('status', status);
      const q = params.toString() ? `?${params.toString()}` : '';
      const res = await request(`/admin/attendance${q}`);
      if (res && res.length > 0) return res;
      return MOCK_HISTORY_RECORDS;
    } catch {
      return MOCK_HISTORY_RECORDS;
    }
  },
  getAdminAttendanceDetail: async (id) => {
    try {
      return await request(`/admin/attendance/${id}`);
    } catch {
      const rec = MOCK_HISTORY_RECORDS.find(r => r.id === id) || MOCK_HISTORY_RECORDS[0];
      return rec;
    }
  },
  getEmployees: async () => {
    try {
      const res = await request('/admin/employees');
      if (res && res.length > 0) return res;
      return MOCK_EMPLOYEES;
    } catch {
      return MOCK_EMPLOYEES;
    }
  },
  provisionEmployee: async (data) => {
    return request('/admin/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Analytics
  getYearlyOverview: async (year) => {
    try {
      const q = year ? `?year=${year}` : '';
      const res = await request(`/analytics/yearly-overview${q}`);
      if (res && res.months) return res;
      return MOCK_YEARLY_OVERVIEW;
    } catch {
      return MOCK_YEARLY_OVERVIEW;
    }
  },

  // Sales Spreadsheet Activity & Proof of Work
  sendActivityPulse: async (pulseData) => {
    try {
      return await request('/activity/pulse', {
        method: 'POST',
        body: JSON.stringify(pulseData),
      });
    } catch (err) {
      return { status: 'SUCCESS', message: 'Simulated activity pulse logged', logId: 'sim-' + Date.now() };
    }
  },
  getTodayEngagement: async () => {
    try {
      const res = await request('/activity/today');
      if (res && res.employeeName) return res;
      return MOCK_ENGAGEMENT_TODAY;
    } catch {
      return MOCK_ENGAGEMENT_TODAY;
    }
  },
  getTeamEngagement: async (date) => {
    try {
      const q = date ? `?date=${date}` : '';
      const res = await request(`/activity/team${q}`);
      if (res && Array.isArray(res) && res.length > 0) return res;
      return MOCK_TEAM_ENGAGEMENT;
    } catch {
      return MOCK_TEAM_ENGAGEMENT;
    }
  },
};
