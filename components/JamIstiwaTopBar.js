'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Clock, MapPin, Calendar } from 'lucide-react';
import { hitungJamIstiwa } from '@/lib/jamIstiwa';

/**
 * ==============================================================================
 * KOMPONEN: JAM ISTIWA' TOPBAR (TAMPIL DI SELURUH HALAMAN)
 * ==============================================================================
 * Ditampilkan di bagian paling atas aplikasi (di dalam Header Navigasi).
 * Memastikan Jam Istiwa' (WIS) selalu terlihat real-time di halaman manapun:
 * Dashboard, Anggota, Bahsu, Kalender, Keuangan, maupun Login.
 */
export default function JamIstiwaTopBar() {
  const [dataWaktu, setDataWaktu] = useState(null);

  useEffect(() => {
    // Jalankan pertama kali saat dibuka di browser
    setDataWaktu(hitungJamIstiwa());

    // Perbarui otomatis setiap 1 detik
    const timer = setInterval(() => {
      setDataWaktu(hitungJamIstiwa());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-[#2A9D8F] text-white py-1.5 px-4 sm:px-6 lg:px-8 border-b border-[#238276] text-xs shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        {/* SISI KIRI: JAM ISTIWA' REAL-TIME & JAM WIB */}
        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
          
          {/* Jam Istiwa' (Jumbo & Monospace) */}
          <div className="flex items-center gap-1.5 font-bold shrink-0">
            <Sun className="w-3.5 h-3.5 text-amber-300 shrink-0 animate-spin-slow" />
            <span className="text-teal-100 uppercase text-[10px] sm:text-xs tracking-wider">
              WIS:
            </span>
            <span className="font-mono text-xs sm:text-sm font-black bg-black/20 text-white px-2 py-0.5 rounded-md tracking-wider shadow-inner">
              {dataWaktu ? `${dataWaktu.wis.teks} WIS` : '--:--:-- WIS'}
            </span>
          </div>

          {/* Jam WIB & Selisih */}
          <div className="flex items-center gap-1.5 text-teal-100 border-l border-teal-500/40 pl-3 shrink-0">
            <Clock className="w-3 h-3 text-teal-200 hidden xs:inline" />
            <span className="text-[10px] sm:text-xs text-teal-200">WIB:</span>
            <span className="font-mono font-bold text-white text-[11px] sm:text-xs">
              {dataWaktu ? dataWaktu.wib.teks : '--:--:--'}
            </span>
            <span className="bg-[#1D7A6F] text-teal-100 text-[10px] px-1.5 py-0.2 rounded-sm font-semibold border border-teal-400/30">
              {dataWaktu ? dataWaktu.selisihTeks : '+--m'}
            </span>
          </div>

        </div>

        {/* SISI KANAN: LOKASI & TANGGAL MASEHI */}
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-teal-100 shrink-0">
          <span className="hidden md:inline-flex items-center gap-1 text-teal-200">
            <MapPin className="w-3 h-3 text-teal-300" />
            Pare, Kediri
          </span>
          <span className="border-l border-teal-500/40 pl-3 flex items-center gap-1 text-teal-100">
            <Calendar className="w-3 h-3 text-teal-300 hidden lg:inline" />
            {dataWaktu?.tanggalLengkap || 'Memuat tanggal...'}
          </span>
        </div>

      </div>
    </div>
  );
}
