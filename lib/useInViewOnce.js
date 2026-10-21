'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * useInViewOnce — Hook ringan berbasis IntersectionObserver
 * - Hanya terpicu satu kali (once: true).
 * - Threshold default 0.6 (sesuai instruksi: aktif saat 60% elemen terlihat).
 * - Menghormati prefers-reduced-motion (langsung true jika user memilih reduced motion).
 */
export function useInViewOnce(options = {}) {
  const { threshold = 0.6, rootMargin = '0px' } = options;
  const ref = useRef(null);

  // Inisialisasi state: jika reduced-motion aktif, langsung true tanpa trigger setState di effect
  const [isInView, setIsInView] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || isInView) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const timer = setTimeout(() => setIsInView(true), 0);
      return () => clearTimeout(timer);
    }

    const el = ref.current;
    if (!el) return;

    if (!('IntersectionObserver' in window)) {
      const timer = setTimeout(() => setIsInView(true), 0);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [threshold, rootMargin, isInView]);

  return [ref, isInView];
}
