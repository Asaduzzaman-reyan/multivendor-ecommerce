import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { fetchCurrentUser, loginUser, registerUser } from '../api/authApi';

const AuthContext = createContext(null);

function saveSession(token, user) {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_user', JSON.stringify(user));
}

function removeSession() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}

function getStoredUser() {
  const storedUser = localStorage.getItem('auth_user');

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem('auth_user');
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [isLoading, setIsLoading] = useState(Boolean(localStorage.getItem('auth_token')));

  useEffect(() => {
    const token = localStorage.getItem('auth_token');

    if (!token) {
      setIsLoading(false);
      return undefined;
    }

    fetchCurrentUser()
      .then(({ user: currentUser }) => {
        setUser(currentUser);
        localStorage.setItem('auth_user', JSON.stringify(currentUser));
      })
      .catch(() => {
        removeSession();
        setUser(null);
      })
      .finally(() => setIsLoading(false));

    return undefined;
  }, []);

  async function register(payload) {
    const response = await registerUser(payload);
    return response;
  }

  async function login(payload) {
    const response = await loginUser(payload);
    saveSession(response.token, response.user);
    setUser(response.user);
    return response;
  }

  function logout() {
    removeSession();
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user && localStorage.getItem('auth_token')),
      register,
      login,
      logout,
    }),
    [isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }

  return context;
}
