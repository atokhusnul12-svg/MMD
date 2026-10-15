'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const OneSignalContext = createContext({
  isSupported: false,
  isInitialized: false,
  appIdConfigured: false,
  permission: 'default',
  isSubscribed: false,
  subscriptionId: null,
  isLoading: false,
  error: null,
  subscribe: async () => {},
  unsubscribe: async () => {},
  refreshStatus: () => {},
});

export function OneSignalProvider({ children, appId }) {
  const [isSupported, setIsSupported] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const appIdConfigured = Boolean(appId && appId.trim().length > 0);

  // Fungsi sinkronisasi status izin & langganan OneSignal
  const syncStatus = useCallback(() => {
    if (typeof window === 'undefined') return;

    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);

    if (!supported) {
      setPermission('unsupported');
      return;
    }

    setPermission(Notification.permission);

    if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async function (OneSignal) {
        try {
          setIsInitialized(true);
          const currentPermission = OneSignal.Notifications?.permission;
          const optedIn = OneSignal.User?.PushSubscription?.optedIn;
          const subId = OneSignal.User?.PushSubscription?.id;

          if (currentPermission !== undefined) {
            setPermission(Notification.permission);
          }
          setIsSubscribed(Boolean(optedIn));
          if (subId) setSubscriptionId(subId);
        } catch (e) {
          console.warn('[OneSignal] Status check error:', e);
        }
      });
    }
  }, []);

  useEffect(() => {
    syncStatus();

    // Inisialisasi OneSignal listener setelah SDK dimuat
    if (typeof window !== 'undefined') {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function (OneSignal) {
        setIsInitialized(true);
        syncStatus();

        try {
          // Listen perubahan subscription
          OneSignal.User?.PushSubscription?.addEventListener('change', (event) => {
            const optedIn = event?.current?.optedIn;
            const subId = event?.current?.id;
            setIsSubscribed(Boolean(optedIn));
            setSubscriptionId(subId || null);
            setPermission(Notification.permission);
          });

          // Listen perubahan izin notifikasi
          OneSignal.Notifications?.addEventListener('permissionChange', (isGranted) => {
            setPermission(isGranted ? 'granted' : Notification.permission);
            syncStatus();
          });
        } catch (err) {
          console.warn('[OneSignal] Event listener setup warning:', err);
        }
      });

      // Sinkron ulang saat tab aktif kembali
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          syncStatus();
        }
      };

      window.addEventListener('focus', syncStatus);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        window.removeEventListener('focus', syncStatus);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [syncStatus]);

  // Handler: Minta Izin & Aktifkan Notifikasi (Opt-In)
  const subscribe = async () => {
    if (!isSupported) {
      throw new Error('Browser Anda tidak mendukung Web Push Notification.');
    }

    if (!appIdConfigured) {
      throw new Error('OneSignal App ID belum dikonfigurasi di Environment Variable (NEXT_PUBLIC_ONESIGNAL_APP_ID).');
    }

    setIsLoading(true);
    setError(null);

    try {
      return await new Promise((resolve, reject) => {
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(async function (OneSignal) {
          try {
            // Minta izin native notifikasi ke browser
            await OneSignal.Notifications.requestPermission();
            
            // Lakukan opt-in push subscription
            await OneSignal.User.PushSubscription.optIn();

            const optedIn = OneSignal.User?.PushSubscription?.optedIn;
            const subId = OneSignal.User?.PushSubscription?.id;

            setIsSubscribed(Boolean(optedIn));
            if (subId) setSubscriptionId(subId);
            setPermission(Notification.permission);

            resolve({ optedIn, subId });
          } catch (err) {
            reject(err);
          } finally {
            setIsLoading(false);
          }
        });
      });
    } catch (err) {
      setError(err?.message || 'Gagal mengaktifkan notifikasi');
      setIsLoading(false);
      throw err;
    }
  };

  // Handler: Nonaktifkan Notifikasi (Opt-Out)
  const unsubscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      return await new Promise((resolve, reject) => {
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(async function (OneSignal) {
          try {
            await OneSignal.User.PushSubscription.optOut();
            setIsSubscribed(false);
            resolve();
          } catch (err) {
            reject(err);
          } finally {
            setIsLoading(false);
          }
        });
      });
    } catch (err) {
      setError(err?.message || 'Gagal menonaktifkan notifikasi');
      setIsLoading(false);
      throw err;
    }
  };

  return (
    <OneSignalContext.Provider
      value={{
        isSupported,
        isInitialized,
        appIdConfigured,
        permission,
        isSubscribed,
        subscriptionId,
        isLoading,
        error,
        subscribe,
        unsubscribe,
        refreshStatus: syncStatus,
      }}
    >
      {children}
    </OneSignalContext.Provider>
  );
}

export function useOneSignal() {
  const context = useContext(OneSignalContext);
  if (!context) {
    throw new Error('useOneSignal harus digunakan di dalam OneSignalProvider');
  }
  return context;
}
