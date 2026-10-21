'use client';

import React from 'react';
import { Sun, Clock, MapPin, Calendar } from 'lucide-react';
import { useJamIstiwa } from '@/lib/useJamIstiwa';

/**
 * ==============================================================================
 * KOMPONEN: JAM ISTIWA' TOPBAR (TAMPIL DI SELURUH HALAMAN)
 * ==============================================================================
 * Ditampilkan di bagian paling atas aplikasi (di dalam Header Navigasi).
 * Memastikan Jam Istiwa' (WIS) selalu terlihat real-time di halaman manapun:
 * Dashboard, Anggota, Bahsu, Kalender, Keuangan, maupun Login.
 */
export default function JamIstiwaTopBar() {
  const dataWaktu = useJamIstiwa();

  return (
    <div className="bg-[#155D54] text-white py-1.5 px-3.5 sm:px-6 lg:px-8 border-b border-[#0F433C] text-xs shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        
        {/* SISI KIRI: JAM ISTIWA' REAL-TIME & JAM WIB */}
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden min-w-0">
          
          {/* Jam Istiwa' (Jumbo & Monospace) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Sun className="w-3.5 h-3.5 text-[#C6A66B] shrink-0" />
            <span className="text-[#C6A66B] uppercase text-[9px] sm:text-xs tracking-wider font-semibold">
              WIS:
            </span>
            <span className="font-mono text-[11px] sm:text-sm font-bold bg-black/25 text-white px-1.5 sm:px-2 py-0.5 rounded-md tracking-wider border border-white/10 shadow-2xs tabular-nums [font-variant-numeric:tabular-nums]">
              {dataWaktu ? `${dataWaktu.wis.teks} WIS` : '--:--:-- WIS'}
            </span>
          </div>

          {/* Jam WIB & Selisih */}
          <div className="flex items-center gap-1 sm:gap-1.5 text-white/80 border-l border-white/15 pl-2 sm:pl-3 shrink-0">
            <Clock className="w-3 h-3 text-white/60 hidden xs:inline" />
            <span className="text-[9px] sm:text-xs text-white/70">WIB:</span>
            <span className="font-mono font-bold text-white text-[10px] sm:text-xs tabular-nums [font-variant-numeric:tabular-nums]">
              {dataWaktu ? dataWaktu.wib.teks : '--:--:--'}
            </span>
            <span className="bg-[#0F433C] text-[#C6A66B] text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-xs font-semibold border border-[#C6A66B]/30">
              {dataWaktu ? dataWaktu.selisihTeks : '+--m'}
            </span>
          </div>

        </div>

        {/* SISI KANAN: LOKASI & TANGGAL MASEHI */}
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-white/80 shrink-0">
          <span className="hidden md:inline-flex items-center gap-1 text-[#C6A66B]">
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
