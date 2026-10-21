'use client';

import React from 'react';
import { MotionConfig } from 'framer-motion';

/**
 * MotionProvider — Mengonfigurasi framer-motion secara global di tingkat aplikasi
 * - reducedMotion="user": Menghormati pengaturan prefers-reduced-motion OS pengguna.
 *   Saat aktif di Windows/macOS, semua animasi framer-motion otomatis dinonaktifkan (instan tanpa gerak).
 */
export default function MotionProvider({ children }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
    </MotionConfig>
  );
}
