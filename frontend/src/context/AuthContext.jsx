import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAccessToken, setTokens, clearTokens, getStoredUser, setStoredUser } from '../services/api';
import { MOCK_EMPLOYEES } from '../services/mockData';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser() || MOCK_EMPLOYEES[0]); // Default to Ananya Sharma
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
          // Fallback to default employee
          setUser(MOCK_EMPLOYEES[0]);
          setStoredUser(MOCK_EMPLOYEES[0]);
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
      // Offline fallback: check mock accounts
      const matched = MOCK_EMPLOYEES.find(e => e.email.toLowerCase() === email.trim().toLowerCase());
      if (matched) {
        const dummyToken = 'mock-jwt-token-' + matched.id;
        setTokens(dummyToken, dummyToken);
        setToken(dummyToken);
        setUser(matched);
        setStoredUser(matched);
        return matched;
      }
      const msg = err.payload?.message || err.message || 'Login failed. Account not linked to an employee record.';
      setAuthError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = (employee) => {
    const dummyToken = 'demo-jwt-token-' + employee.id;
    setTokens(dummyToken, dummyToken);
    setToken(dummyToken);
    setUser(employee);
    setStoredUser(employee);
    setAuthError(null);
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
        isAuthenticated: !!user,
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
