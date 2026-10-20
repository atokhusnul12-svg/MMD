'use client';

import { useState, useEffect } from 'react';
import { hitungJamIstiwa } from './jamIstiwa';

/**
 * Hook kustom untuk memantau Jam Istiwa' (WIS) secara real-time setiap detik.
 * Menghindari duplikasi timer `setInterval(1000)` dan boilerplate effect di berbagai komponen.
 */
export function useJamIstiwa() {
  const [dataWaktu, setDataWaktu] = useState(() =>
    typeof window !== 'undefined' ? hitungJamIstiwa() : null
  );

  useEffect(() => {
    // Jalankan timer per detik (1000ms)
    const intervalId = setInterval(() => {
      setDataWaktu(hitungJamIstiwa());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return dataWaktu;
}
