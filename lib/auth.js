'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({
  isAdmin: false,
  isLoaded: false,
  login: async () => ({ success: false }),
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Bersihkan sisa token/cookie plaintext lama jika ada di browser
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('waka3_admin_session');
      }
    } catch {}

    let isMounted = true;

    async function syncSession() {
      try {
        const res = await fetch('/api/auth/session', {
          cache: 'no-store',
          credentials: 'same-origin',
        });
        const data = await res.json();
        if (isMounted) {
          setIsAdmin(Boolean(data?.authenticated));
        }
      } catch {
        if (isMounted) {
          setIsAdmin(false);
        }
      } finally {
        if (isMounted) {
          setIsLoaded(true);
        }
      }
    }

    syncSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (username, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsAdmin(true);
        return { success: true };
      }

      return {
        success: false,
        error: data.error || 'Username atau password salah.',
      };
    } catch (err) {
      return {
        success: false,
        error: `Gagal terhubung ke server: ${err.message}`,
      };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } catch (err) {
      console.warn('Gagal memanggil API logout:', err);
    } finally {
      setIsAdmin(false);
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
