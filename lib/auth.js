'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({
  isAdmin: false,
  login: () => false,
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cek apakah admin sudah login sebelumnya di browser ini
  useEffect(() => {
    try {
      const stored = localStorage.getItem('waka3_admin_session');
      if (stored === 'true') {
        setIsAdmin(true);
        document.cookie = 'waka3_admin_session=true; path=/; max-age=604800; SameSite=Lax';
      } else {
        document.cookie = 'waka3_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoaded(true);
  }, []);

  const login = (username, password) => {
    // Sesuai permintaan user: username = MMD, password = WAKA3
    if (username.trim().toUpperCase() === 'MMD' && password.trim() === 'WAKA3') {
      setIsAdmin(true);
      try {
        localStorage.setItem('waka3_admin_session', 'true');
        document.cookie = 'waka3_admin_session=true; path=/; max-age=604800; SameSite=Lax';
      } catch (e) {
        console.error(e);
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    try {
      localStorage.removeItem('waka3_admin_session');
      document.cookie = 'waka3_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout, isLoaded }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
