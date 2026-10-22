'use client';

import { useSyncExternalStore } from 'react';
import { hitungJamIstiwa } from './jamIstiwa';

// State global & daftar pendengar agar semua komponen berdetik serempak
let sharedDataWaktu = null;
const listeners = new Set();
let globalTimer = null;

function updateGlobalTime() {
  sharedDataWaktu = hitungJamIstiwa();
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {}
  });
}

function subscribe(callback) {
  listeners.add(callback);
  if (!globalTimer && typeof window !== 'undefined') {
    if (!sharedDataWaktu) {
      sharedDataWaktu = hitungJamIstiwa();
    }
    globalTimer = setInterval(updateGlobalTime, 1000);
  }

  return () => {
    listeners.delete(callback);
    if (listeners.size === 0 && globalTimer) {
      clearInterval(globalTimer);
      globalTimer = null;
    }
  };
}

function getSnapshot() {
  if (!sharedDataWaktu && typeof window !== 'undefined') {
    sharedDataWaktu = hitungJamIstiwa();
  }
  return sharedDataWaktu;
}

function getServerSnapshot() {
  return null;
}

/**
 * Hook kustom untuk memantau Jam Istiwa' (WIS) secara real-time setiap detik.
 * Menggunakan timer global tunggal (useSyncExternalStore) agar seluruh komponen
 * berganti angka di detik yang persis sama tanpa jeda milidetik.
 */
export function useJamIstiwa() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}


