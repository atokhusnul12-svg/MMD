'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { smartScrollTo } from '@/lib/scrollTo';

export default function AutoScrollManager() {
  const pathname = usePathname();

  useEffect(() => {
    // Tangani navigasi anchor (#hash) jika ada saat halaman dimuat / berpindah
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash;
      // Berikan jeda frame agar komponen halaman selesai me-render DOM
      const timer = setTimeout(() => {
        smartScrollTo(hash, { force: true });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return null;
}
