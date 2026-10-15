'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { VAPID_KEYS, urlBase64ToUint8Array } from '@/lib/vapidKeys';

const NotificationContext = createContext({
  isSupported: false,
  permission: 'default',
  isSubscribed: false,
  subscription: null,
  subscriberCount: 0,
  isLoading: false,
  error: null,
  subscribe: async () => {},
  unsubscribe: async () => {},
  sendNotification: async () => {},
  refreshStatus: () => {},
});

export function NotificationProvider({ children }) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Ambil jumlah total subscriber dari server
  const fetchSubscriberCount = useCallback(async () => {
    try {
      const res = await fetch('/api/push/subscribe');
      if (res.ok) {
        const data = await res.json();
        setSubscriberCount(data.count || 0);
      }
    } catch {
      // Non-fatal
    }
  }, []);

  // Periksa status izin notifikasi dan pendaftaran Service Worker
  const checkStatus = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    setIsSupported(supported);

    if (!supported) {
      setPermission('unsupported');
      return;
    }

    setPermission(Notification.permission);

    if (Notification.permission === 'granted') {
      try {
        const reg = await navigator.serviceWorker.getRegistration('/sw.js');
        if (reg) {
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            setIsSubscribed(true);
            setSubscription(sub.toJSON());
            // Sinkronkan kembali ke server agar selalu aktif
            fetch('/api/push/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subscription: sub.toJSON(), action: 'subscribe' }),
            }).catch(() => {});
          } else {
            setIsSubscribed(false);
            setSubscription(null);
          }
        }
      } catch (err) {
        console.warn('[NotificationProvider] Status check warning:', err);
      }
    } else {
      setIsSubscribed(false);
      setSubscription(null);
    }

    fetchSubscriberCount();
  }, [fetchSubscriberCount]);

  useEffect(() => {
    checkStatus();

    // Mendaftarkan service worker di latar belakang jika browser mendukung
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // Service worker terdaftar
          checkStatus();
        })
        .catch((err) => {
          console.warn('[SW Registration]', err);
        });
    }

    const handleFocus = () => checkStatus();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkStatus]);

  // Handler: Aktifkan Notifikasi (Opt-In)
  const subscribe = async () => {
    if (!isSupported) {
      throw new Error('Browser Anda tidak mendukung Web Push Notification.');
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Minta izin native ke browser
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        throw new Error(
          perm === 'denied'
            ? 'Izin notifikasi ditolak di browser. Silakan izinkan melalui ikon gembok pada URL bar browser.'
            : 'Izin notifikasi belum diberikan.'
        );
      }

      // 2. Pastikan Service Worker aktif
      let reg = await navigator.serviceWorker.getRegistration('/sw.js');
      if (!reg) {
        reg = await navigator.serviceWorker.register('/sw.js');
      }
      await navigator.serviceWorker.ready;

      // 3. Daftarkan Push Subscription menggunakan VAPID Public Key
      const applicationServerKey = urlBase64ToUint8Array(VAPID_KEYS.publicKey);
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const subJSON = sub.toJSON();
      setSubscription(subJSON);
      setIsSubscribed(true);

      // 4. Simpan subscription ke server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subJSON, action: 'subscribe' }),
      });

      fetchSubscriberCount();

      // 5. Tampilkan notifikasi selamat datang instan di sistem
      reg.showNotification('🔔 Notifikasi WAKA III MMD Aktif!', {
        body: 'Perangkat Anda berhasil terhubung. Anda akan menerima notifikasi agenda, keuangan, dan kegiatan LBM.',
        icon: '/icon.png',
        badge: '/icon.png',
        data: { url: '/' },
      });

      return subJSON;
    } catch (err) {
      setError(err?.message || 'Gagal mengaktifkan notifikasi');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Matikan Notifikasi (Opt-Out)
  const unsubscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          const subJSON = sub.toJSON();
          await sub.unsubscribe();

          // Beritahu server untuk menghapus subscription ini
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription: subJSON, action: 'unsubscribe' }),
          }).catch(() => {});
        }
      }

      setIsSubscribed(false);
      setSubscription(null);
      fetchSubscriberCount();
    } catch (err) {
      setError(err?.message || 'Gagal menonaktifkan notifikasi');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Kirim Notifikasi via Server API
  const sendNotification = async ({ title, message, url, type, targetCurrentDevice = false }) => {
    const res = await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        message,
        url,
        type,
        targetSubscription: targetCurrentDevice ? subscription : null,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal mengirim notifikasi.');
    }
    return data;
  };

  return (
    <NotificationContext.Provider
      value={{
        isSupported,
        permission,
        isSubscribed,
        subscription,
        subscriberCount,
        isLoading,
        error,
        subscribe,
        unsubscribe,
        sendNotification,
        refreshStatus: checkStatus,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification harus digunakan di dalam NotificationProvider');
  }
  return context;
}
