'use client';

import React from 'react';
import { Sun, MapPin, Calendar } from 'lucide-react';
import { useJamIstiwa } from '@/lib/useJamIstiwa';
import { getUnifiedNextPrayerInfo } from '@/lib/prayerSchedule';

/**
 * ==============================================================================
 * KOMPONEN: JAM ISTIWA' TOPBAR (TAMPIL DI SELURUH HALAMAN)
 * ==============================================================================
 * Ditampilkan di bagian paling atas aplikasi (di dalam Header Navigasi).
 * Memastikan Jam Istiwa' (WIS) dan waktu sholat berikutnya selalu terlihat
 * real-time di HP maupun Komputer.
 */
export default function JamIstiwaTopBar() {
  const dataWaktu = useJamIstiwa();
  const nextPrayer = getUnifiedNextPrayerInfo(dataWaktu);

  return (
    <div className="bg-[#155D54] text-white py-1.5 px-3.5 sm:px-6 lg:px-8 border-b border-[#0F433C] text-xs shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        
        {/* SISI KIRI (HP: MELEBAR PENUH DENGAN JARAK KIRI-KANAN; DESKTOP: MERAPAT KE KIRI) */}
        <div className="flex items-center justify-between md:justify-start gap-2 sm:gap-4 w-full md:w-auto">
          
          {/* Jam Istiwa' (WIS) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Sun className="w-3.5 h-3.5 text-[#C6A66B] shrink-0" />
            <span className="text-[#C6A66B] uppercase text-[9px] sm:text-xs tracking-wider font-semibold">
              WIS:
            </span>
            <span suppressHydrationWarning className="font-mono text-[11px] sm:text-sm font-bold bg-black/25 text-white px-1.5 sm:px-2 py-0.5 rounded-md tracking-wider border border-white/10 shadow-2xs tabular-nums [font-variant-numeric:tabular-nums]">
              {dataWaktu ? `${dataWaktu.wis.teks} WIS` : '--:--:-- WIS'}
            </span>
          </div>

          {/* Waktu Sholat Berikutnya (Contoh: Ashar 03:13 Wis (- 02:12)) */}
          <div suppressHydrationWarning className="flex items-center shrink-0 md:border-l md:border-white/15 md:pl-3">
            <span className="text-[10px] sm:text-xs font-medium tracking-tight whitespace-nowrap bg-black/20 md:bg-transparent px-2 py-0.5 md:px-0 md:py-0 rounded-md border border-white/10 md:border-0 text-white/95 tabular-nums [font-variant-numeric:tabular-nums]">
              {nextPrayer ? nextPrayer.topBarText : '--:-- Wis'}
            </span>
          </div>

        </div>

        {/* SISI KANAN: LOKASI & TANGGAL MASEHI (KHUSUS LAYAR SEDANG/BESAR) */}
        <div className="hidden md:flex items-center gap-3 text-[11px] text-white/80 shrink-0">
          <span className="hidden lg:inline-flex items-center gap-1 text-[#C6A66B]">
            <MapPin className="w-3 h-3" />
            Pare, Kediri
          </span>
          <span className="border-l border-white/15 pl-3 flex items-center gap-1 text-white/90">
            <Calendar className="w-3 h-3 text-[#C6A66B] hidden lg:inline" />
            {dataWaktu?.tanggalLengkap || 'Memuat tanggal...'}
          </span>
        </div>

      </div>
    </div>
  );
}

