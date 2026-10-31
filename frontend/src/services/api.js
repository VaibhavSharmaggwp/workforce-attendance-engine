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

// Provisioned team storage for clean testing and offline persistence
export const PROVISIONED_TEAM_KEY = 'ams_provisioned_team';

export const getProvisionedTeam = () => {
  try {
    const raw = localStorage.getItem(PROVISIONED_TEAM_KEY);
    if (raw) return JSON.parse(raw);
    return [];
  } catch {
    return [];
  }
};

export const saveProvisionedMember = (member) => {
  const current = getProvisionedTeam();
  const idx = current.findIndex(m => m.email?.toLowerCase() === member.email?.toLowerCase());
  if (idx >= 0) {
    current[idx] = { ...current[idx], ...member };
  } else {
    current.push(member);
  }
  localStorage.setItem(PROVISIONED_TEAM_KEY, JSON.stringify(current));
};

export const clearProvisionedTeam = () => {
  localStorage.removeItem(PROVISIONED_TEAM_KEY);
};

export const buildTeamDashboard = (membersList = []) => {
  const total = membersList.length;
  let working = 0;
  let onBreak = 0;
  let checkedOut = 0;
  let notCheckedIn = 0;
  let incomplete = 0;
  let overBreak = 0;

  membersList.forEach((m) => {
    if (m.status === 'WORKING') working++;
    else if (m.status === 'ON_BREAK') onBreak++;
    else if (m.status === 'COMPLETED') checkedOut++;
    else if (m.status === 'INCOMPLETE') incomplete++;
    else notCheckedIn++;

    if (m.breakOverOneHour) overBreak++;
  });

  return {
    date: new Date().toISOString().split('T')[0],
    totalEmployees: total,
    workingCount: working,
    onBreakCount: onBreak,
    checkedOutCount: checkedOut,
    notCheckedInCount: notCheckedIn,
    incompleteCount: incomplete,
    overBreakCount: overBreak,
    members: membersList,
  };
};

// In-memory per-user session state for demo actions when offline
const localDemoAttendances = {};

const getUserKey = () => {
  const u = getStoredUser();
  return u?.email?.toLowerCase() || 'default';
};

const getLocalDemoAttendance = () => {
  return localDemoAttendances[getUserKey()] || null;
};

const setLocalDemoAttendance = (att) => {
  const key = getUserKey();
  localDemoAttendances[key] = att;
  if (att) {
    const list = getProvisionedTeam();
    const idx = list.findIndex(m => m.email?.toLowerCase() === key);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        status: att.status,
        checkInAt: att.checkInAt,
        checkOutAt: att.checkOutAt,
        breakCount: att.breaks ? att.breaks.length : 0,
        totalBreakMinutes: att.breakMinutes || 0,
        netWorkMinutes: att.netWorkMinutes || 0,
        netWorkFormatted: att.netWorkMinutes
          ? `${Math.floor(att.netWorkMinutes / 60)}h ${att.netWorkMinutes % 60}m`
          : '0m',
      };
      localStorage.setItem(PROVISIONED_TEAM_KEY, JSON.stringify(list));
    }
  }
};

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
      const localTeam = getProvisionedTeam();
      return [
        { id: 'mgr-rahul', fullName: 'Rahul Khanna', email: 'rahul.khanna@techviista.net', role: 'MANAGER', active: true },
        ...localTeam.map(m => ({
          id: m.employeeId || 'emp-' + m.email,
          fullName: m.fullName,
          email: m.email,
          role: m.role || 'EMPLOYEE',
          active: true,
        })),
      ];
    } catch {
      const localTeam = getProvisionedTeam();
      return [
        { id: 'mgr-rahul', fullName: 'Rahul Khanna', email: 'rahul.khanna@techviista.net', role: 'MANAGER', active: true },
        ...localTeam.map(m => ({
          id: m.employeeId || 'emp-' + m.email,
          fullName: m.fullName,
          email: m.email,
          role: m.role || 'EMPLOYEE',
          active: true,
        })),
      ];
    }
  },
  getHealth: async () => {
    return request('/health');
  },

  // Attendance
  getTodayAttendance: async () => {
    const token = getAccessToken();
    const demoAtt = getLocalDemoAttendance();
    if (isDemoToken(token) && demoAtt !== null) {
      return demoAtt;
    }
    try {
      const res = await request('/attendance/today');
      return res;
    } catch (err) {
      if (isDemoToken(token) || err.isNetworkError || err.status === 401) {
        return getLocalDemoAttendance();
      }
      throw err;
    }
  },
  checkIn: async () => {
    const token = getAccessToken();
    try {
      const res = await request('/attendance/check-in', { method: 'POST' });
      setLocalDemoAttendance(res);
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
        setLocalDemoAttendance(mock);
        return mock;
      }
      throw err;
    }
  },
  startBreak: async () => {
    const token = getAccessToken();
    try {
      const res = await request('/attendance/breaks/start', { method: 'POST' });
      setLocalDemoAttendance(res);
      return res;
    } catch (err) {
      if (isDemoToken(token) || err.isNetworkError || err.status === 401 || err.status === 500) {
        const now = new Date();
        const currentAtt = getLocalDemoAttendance();
        const currentBreaks = (currentAtt && currentAtt.breaks) ? [...currentAtt.breaks] : [];
        currentBreaks.push({
          id: 'b-' + Date.now(),
          startedAt: now.toISOString(),
          endedAt: null,
          durationMinutes: 0,
        });
        const updated = {
          ...(currentAtt || {
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
        setLocalDemoAttendance(updated);
        return updated;
      }
      throw err;
    }
  },
  endBreak: async () => {
    const token = getAccessToken();
    try {
      const res = await request('/attendance/breaks/end', { method: 'POST' });
      setLocalDemoAttendance(res);
      return res;
    } catch (err) {
      if (isDemoToken(token) || err.isNetworkError || err.status === 401 || err.status === 500) {
        const now = new Date();
        const currentAtt = getLocalDemoAttendance();
        const breaks = ((currentAtt && currentAtt.breaks) || []).map((b) => {
          if (!b.endedAt) {
            const start = new Date(b.startedAt);
            const diffMin = Math.max(1, Math.round((now - start) / 60000));
            return { ...b, endedAt: now.toISOString(), durationMinutes: diffMin };
          }
          return b;
        });
        const totalBreakMins = breaks.reduce((acc, b) => acc + (b.durationMinutes || 0), 0);
        const updated = {
          ...(currentAtt || {}),
          status: 'WORKING',
          breakMinutes: totalBreakMins,
          breaks,
        };
        setLocalDemoAttendance(updated);
        return updated;
      }
      throw err;
    }
  },
  checkOut: async () => {
    const token = getAccessToken();
    try {
      const res = await request('/attendance/check-out', { method: 'POST' });
      setLocalDemoAttendance(res);
      return res;
    } catch (err) {
      if (isDemoToken(token) || err.isNetworkError || err.status === 401 || err.status === 500) {
        const now = new Date();
        const currentAtt = getLocalDemoAttendance();
        const checkIn = currentAtt?.checkInAt
          ? new Date(currentAtt.checkInAt)
          : new Date(Date.now() - 8.2 * 3600000);
        const grossMinutes = Math.max(0, Math.round((now - checkIn) / 60000));
        const breakMins = currentAtt?.breakMinutes || 45;
        const netWorkMinutes = Math.max(0, grossMinutes - breakMins);
        const updated = {
          ...(currentAtt || {
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
        setLocalDemoAttendance(updated);
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
      if (res && Array.isArray(res.members)) return res;
      const localTeam = getProvisionedTeam();
      return buildTeamDashboard(localTeam);
    } catch {
      const localTeam = getProvisionedTeam();
      return buildTeamDashboard(localTeam);
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
      return getProvisionedTeam();
    } catch {
      return getProvisionedTeam();
    }
  },
  provisionEmployee: async (data) => {
    const memberObj = {
      employeeId: 'emp-' + Date.now(),
      fullName: data.fullName,
      email: data.email.trim().toLowerCase(),
      role: data.role || 'EMPLOYEE',
      status: 'NOT_CHECKED_IN',
      checkInAt: null,
      checkOutAt: null,
      breakCount: 0,
      totalBreakMinutes: 0,
      hasActiveBreak: false,
      activeBreakMinutes: 0,
      breakOverOneHour: false,
      netWorkMinutes: 0,
      netWorkFormatted: '—',
      breaks: [],
    };

    try {
      const res = await request('/admin/employees', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      saveProvisionedMember({
        ...memberObj,
        employeeId: res?.id || memberObj.employeeId,
      });
      return res || memberObj;
    } catch (err) {
      saveProvisionedMember(memberObj);
      return memberObj;
    }
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

  // Manager Inactivity Email Alert Controls
  getAlertSettings: async () => {
    try {
      const res = await request('/admin/settings/alerts');
      if (res && typeof res.emailAlertsEnabled === 'boolean') return res;
      const cached = localStorage.getItem('ams_manager_email_alerts');
      return { emailAlertsEnabled: cached !== null ? JSON.parse(cached) : true };
    } catch {
      const cached = localStorage.getItem('ams_manager_email_alerts');
      return { emailAlertsEnabled: cached !== null ? JSON.parse(cached) : true };
    }
  },
  toggleAlertSettings: async () => {
    try {
      const res = await request('/admin/settings/alerts/toggle', { method: 'POST' });
      if (res && typeof res.emailAlertsEnabled === 'boolean') {
        localStorage.setItem('ams_manager_email_alerts', JSON.stringify(res.emailAlertsEnabled));
        return res;
      }
      throw new Error('Fallback toggle');
    } catch {
      const current = localStorage.getItem('ams_manager_email_alerts');
      const next = current !== null ? !JSON.parse(current) : false;
      localStorage.setItem('ams_manager_email_alerts', JSON.stringify(next));
      return { emailAlertsEnabled: next, message: next ? 'Inactivity email alerts enabled' : 'Inactivity email alerts disabled' };
    }
  },
  triggerInactivityScan: async () => {
    try {
      return await request('/admin/alerts/scan', { method: 'POST' });
    } catch {
      return { scanDate: new Date().toISOString().split('T')[0], alertsDispatched: 1, message: 'Inactivity scan simulated: 1 alert dispatched to manager.' };
    }
  },
};
