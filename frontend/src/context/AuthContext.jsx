import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  api,
  getAccessToken,
  setTokens,
  clearTokens,
  getStoredUser,
  setStoredUser,
  isDemoToken,
  getProvisionedTeam,
} from '../services/api';
import { MOCK_EMPLOYEES } from '../services/mockData';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getAccessToken());
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Check URL params for OAuth2 redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const errorParam = params.get('error');

    if (errorParam === 'account_not_linked') {
      setAuthError('This Google account isn’t linked to an employee record. Ask your manager to add you or sign in with your work account.');
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (accessToken) {
      setTokens(accessToken, refreshToken);
      setToken(accessToken);
      window.history.replaceState({}, document.title, window.location.pathname);

      // Fetch user profile from backend
      api.getMe()
        .then((profile) => {
          setUser(profile);
          setStoredUser(profile);
        })
        .catch(() => {
          if (import.meta.env.DEV) {
            const fallback = MOCK_EMPLOYEES[0];
            setUser(fallback);
            setStoredUser(fallback);
          } else {
            clearTokens();
            setUser(null);
            setStoredUser(null);
            setAuthError('Authentication session failed. Please sign in again.');
          }
        });
    }
  }, []);

  // Listen for auth expiration
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('ams_auth_expired', handleExpired);
    return () => window.removeEventListener('ams_auth_expired', handleExpired);
  }, []);

  const loginWithCredentials = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await api.login(email, password);
      if (response && response.accessToken) {
        setTokens(response.accessToken, response.refreshToken);
        setToken(response.accessToken);
        setUser(response.user);
        setStoredUser(response.user);
        return response.user;
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        // Offline fallback for development only
        const provisioned = getProvisionedTeam();
        const allAccounts = [
          ...MOCK_EMPLOYEES,
          ...provisioned.map(m => ({
            id: m.employeeId || 'emp-' + m.email,
            fullName: m.fullName,
            email: m.email,
            role: m.role || 'EMPLOYEE',
            active: true,
          })),
        ];
        const matched = allAccounts.find(e => e.email.toLowerCase() === email.trim().toLowerCase());
        if (matched) {
          const dummyToken = 'demo-jwt-token-' + matched.id;
          setTokens(dummyToken, dummyToken);
          setToken(dummyToken);
          setUser(matched);
          setStoredUser(matched);
          return matched;
        }
      }
      const msg = err.payload?.message || err.message || 'This Google/work account is not linked to an employee record. Ask your manager to add your account.';
      setAuthError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = async (employee) => {
    setLoading(true);
    setAuthError(null);
    try {
      // 1. Attempt backend login to get a real HMAC-signed JWT if backend is reachable
      const res = await api.login(employee.email, 'demo-password');
      if (res && res.accessToken) {
        setTokens(res.accessToken, res.refreshToken);
        setToken(res.accessToken);
        setUser(res.user || employee);
        setStoredUser(res.user || employee);
        return res.user || employee;
      }
    } catch (e) {
      // Backend not running or unseeded — fall through to local demo mode
      console.info('Backend unreachable, using offline demo mode for persona:', employee.fullName);
    } finally {
      setLoading(false);
    }

    // 2. Safe demo token for offline operation
    const dummyToken = 'demo-jwt-token-' + employee.id;
    setTokens(dummyToken, dummyToken);
    setToken(dummyToken);
    setUser(employee);
    setStoredUser(employee);
    setAuthError(null);
    return employee;
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    setToken(null);
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        loading,
        authError,
        setAuthError,
        loginWithCredentials,
        loginAsDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
