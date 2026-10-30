// API Service with JWT authentication and resilient error handling
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

async function request(endpoint, options = {}) {
  const token = getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Session expired or unauthenticated
    if (!endpoint.includes('/auth/login') && !endpoint.includes('/me')) {
      clearTokens();
      window.dispatchEvent(new Event('ams_auth_expired'));
    }
    const err = await response.json().catch(() => ({ message: 'Unauthorized' }));
    throw new Error(err.message || 'Unauthorized');
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
    return request('/auth/demo-accounts');
  },
  getHealth: async () => {
    return request('/health');
  },

  // Attendance
  getTodayAttendance: async () => {
    return request('/attendance/today');
  },
  checkIn: async () => {
    return request('/attendance/check-in', { method: 'POST' });
  },
  startBreak: async () => {
    return request('/attendance/breaks/start', { method: 'POST' });
  },
  endBreak: async () => {
    return request('/attendance/breaks/end', { method: 'POST' });
  },
  checkOut: async () => {
    return request('/attendance/check-out', { method: 'POST' });
  },
  getAttendanceHistory: async () => {
    return request('/attendance/history');
  },

  // Admin
  getAdminTeamToday: async (dateStr) => {
    const q = dateStr ? `?date=${encodeURIComponent(dateStr)}` : '';
    return request(`/admin/attendance/today${q}`);
  },
  getAdminAttendanceList: async ({ date, employeeId, status } = {}) => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (employeeId) params.append('employeeId', employeeId);
    if (status) params.append('status', status);
    const q = params.toString() ? `?${params.toString()}` : '';
    return request(`/admin/attendance${q}`);
  },
  getAdminAttendanceDetail: async (id) => {
    return request(`/admin/attendance/${id}`);
  },
  getEmployees: async () => {
    return request('/admin/employees');
  },
  provisionEmployee: async (data) => {
    return request('/admin/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Analytics
  getYearlyOverview: async (year) => {
    const q = year ? `?year=${year}` : '';
    return request(`/analytics/yearly-overview${q}`);
  },
};
