'use client';

import { useEffect, useRef } from 'react';

export const DEFAULT_SYNC_INTERVAL_MS = 180_000;
export const DEFAULT_REFOCUS_COOLDOWN_MS = 60_000;

/**
 * Custom hook untuk sinkronisasi data latar belakang otomatis.
 *
 * Fitur:
 * 1. Menjalankan sinkronisasi berkala (interval) tanpa blocking UI.
 * 2. Memeriksa window focus & tab visibility change dengan batas pendinginan (cooldown)
 *    agar tidak melakukan spam request saat pengguna sering berpindah tab.
 * 3. Menggunakan mutable ref untuk callback sehingga tidak memicu timer re-mount
 *    saat state atau handler komponen berubah.
 * 4. Cleanup otomatis saat komponen di-unmount.
 *
 * @param {Function} onSync - Callback sinkronisasi data (menerima boolean showIndicator)
 * @param {Object} [options]
 * @param {number} [options.intervalMs=180000] - Interval polling otomatis (ms)
 * @param {number} [options.cooldownMs=60000] - Waktu jeda minimal antar fetch fokus/visibilitas (ms)
 * @param {boolean} [options.enabled=true] - Aktifkan atau nonaktifkan sync
 * @param {React.MutableRefObject<number>} [options.lastFetchRef] - Ref opsional dari komponen
 */
export function useBackgroundSync(onSync, {
  intervalMs = DEFAULT_SYNC_INTERVAL_MS,
  cooldownMs = DEFAULT_REFOCUS_COOLDOWN_MS,
  enabled = true,
  lastFetchRef: externalLastFetchRef,
} = {}) {
  const internalLastFetchRef = useRef(0);
  const lastFetchRef = externalLastFetchRef || internalLastFetchRef;
  const onSyncRef = useRef(onSync);

  useEffect(() => {
    onSyncRef.current = onSync;
  }, [onSync]);

  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      lastFetchRef.current = Date.now();
      onSyncRef.current?.(false);
    }, intervalMs);

    const throttledRefetch = () => {
      const now = Date.now();
      const elapsed = now - lastFetchRef.current;
      if (elapsed >= cooldownMs) {
        lastFetchRef.current = now;
        onSyncRef.current?.(false);
      }
    };

    const onVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        throttledRefetch();
      }
    };

    window.addEventListener('focus', throttledRefetch);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', throttledRefetch);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [intervalMs, cooldownMs, enabled, lastFetchRef]);

  return { lastFetchRef };
}
