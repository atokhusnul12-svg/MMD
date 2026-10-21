'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useInViewOnce } from '@/lib/useInViewOnce';

/**
 * Format angka ribuan dengan titik (contoh: 1098 -> "1.098")
 * Tanpa mengubah desimal titik menjadi koma (misal: 77.8 tetap 77.8)
 */
export function formatIndonesiaNumber(num, decimals = 0, formatThousand = true) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  if (decimals > 0) {
    const fixed = Number(num).toFixed(decimals);
    const [intPart, decPart] = fixed.split('.');
    const formattedInt = formatThousand
      ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      : intPart;
    return `${formattedInt}.${decPart}`;
  }
  const intVal = Math.round(Number(num));
  return formatThousand
    ? intVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    : intVal.toString();
}

/**
 * CountUp Component
 * - Menghitung angka dari 0 ke target menggunakan requestAnimationFrame.
 * - Easing: easeOutCubic (lembut dan tenang).
 * - Durasi default: 1000ms (atau 400ms saat nilai berubah).
 * - Hanya berjalan 1 kali saat 60% elemen angka terlihat (threshold: 0.6).
 * - Bebas kilatan: tidak melompat dari target ke 0. Tampilan visual dimulai dari 0 dan naik ke target.
 * - Untuk mode cetak dan pembaca layar (screen reader): nilai final persis selalu dirender langsung.
 * - Menghormati prefers-reduced-motion: jika aktif, nilai langsung target final tanpa animasi.
 */
export default function CountUp({
  target = 0,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 1000,
  threshold = 0.6,
  formatThousand = true,
  className = '',
  style = {},
}) {
  // Ref diletakkan langsung pada elemen angka berukuran inline-block agar threshold 0.6 pas di 375px
  const [containerRef, isInView] = useInViewOnce({ threshold });
  
  // Nilai visual dimulai dari 0 (atau langsung target jika reduced motion aktif) agar bebas kilatan
  const [displayValue, setDisplayValue] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return target;
    }
    return 0;
  });

  const prevTargetRef = useRef(target);
  const hasAnimatedRef = useRef(false);

  // Nilai string akhir untuk cetak dan screen reader (aksesibilitas)
  const finalFormatted = `${prefix}${formatIndonesiaNumber(target, decimals, formatThousand)}${suffix}`;

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const timer = setTimeout(() => setDisplayValue(target), 0);
      return () => clearTimeout(timer);
    }

    if (!isInView) return;

    let startVal = 0;
    let animDuration = duration;

    if (hasAnimatedRef.current) {
      // Jika data diperbarui via refresh, hanya geser jika target berubah
      if (prevTargetRef.current === target) {
        return;
      }
      startVal = prevTargetRef.current;
      animDuration = 400; // Transisi cepat 400ms saat update nilai
    } else {
      hasAnimatedRef.current = true;
      startVal = 0;
      animDuration = duration;
    }

    prevTargetRef.current = target;

    const startTime = performance.now();
    let animationFrameId;

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animDuration, 1);
      
      // Easing easeOutCubic: 1 - Math.pow(1 - progress, 3)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = startVal + (target - startVal) * easeProgress;

      setDisplayValue(currentVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(target);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isInView, target, duration, decimals]);

  const currentFormatted = `${prefix}${formatIndonesiaNumber(displayValue, decimals, formatThousand)}${suffix}`;

  return (
    <span
      ref={containerRef}
      className={`inline-block tabular-nums [font-variant-numeric:tabular-nums] ${className}`}
      style={style}
    >
      {/* 1. Aksesibilitas Screen Reader, Mode Cetak (Print / PDF), & Reduced Motion: Nilai final persis instan */}
      <span className="sr-only print:inline motion-reduce:not-sr-only motion-reduce:inline">{finalFormatted}</span>

      {/* 2. Tampilan Visual di Layar: Angka teranimasi mulus tanpa kedip (tersembunyi saat reduced motion atau print) */}
      <span aria-hidden="true" className="print:hidden motion-reduce:hidden" suppressHydrationWarning>
        {currentFormatted}
      </span>
    </span>
  );
}
