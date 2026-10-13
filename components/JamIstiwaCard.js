'use client';

import React, { useState, useEffect } from 'react';
import { Compass, Clock, Calendar, Sun, Sparkles, MapPin } from 'lucide-react';
import { hitungJamIstiwa } from '@/lib/jamIstiwa';

/**
 * ==============================================================================
 * KOMPONEN: KARTU JAM ISTIWA' (WIS) REAL-TIME
 * ==============================================================================
 * Komponen ini menampilkan jam Istiwa' (Waktu Matahari Hakiki) untuk wilayah Pare
 * (Kediri) dan sekitarnya yang diperbarui setiap detik.
 *
 * Cara kerjanya:
 * 1. Saat halaman dibuka, browser menjalankan timer (setInterval) tiap 1000ms (1 detik).
 * 2. Fungsi `hitungJamIstiwa()` dipanggil untuk mengambil jam WIB saat ini.
 * 3. Nilai selisih dicari otomatis dari tabel berdasarkan tanggal & bulan hari ini.
 * 4. Jam Istiwa' dihitung: WIB ditambah selisih.
 * 5. Tampilan jam, detik, dan tanggal diperbarui secara otomatis.
 */
export default function JamIstiwaCard() {
  // State untuk menyimpan hasil perhitungan waktu
  const [dataWaktu, setDataWaktu] = useState(null);

  useEffect(() => {
    // 1. Hitung langsung saat komponen pertama kali dimuat di browser
    setDataWaktu(hitungJamIstiwa());

    // 2. Buat interval agar jam terus berdetak setiap 1 detik (1000 milidetik)
    const intervalId = setInterval(() => {
      setDataWaktu(hitungJamIstiwa());
    }, 1000);

    // 3. Bersihkan timer jika berpindah halaman agar memori tetap hemat
    return () => clearInterval(intervalId);
  }, []);

  // Tampilan cadangan (placeholder) saat awal muat agar tidak berkedip
  if (!dataWaktu) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#2A9D8F]/20 animate-pulse">
        <div className="h-6 bg-gray-200 rounded-md w-48 mb-4"></div>
        <div className="h-12 bg-gray-200 rounded-md w-72 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded-md w-60"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#2A9D8F]/20 relative overflow-hidden transition-all duration-200">
      
      {/* Aksen Latar Belakang Lingkaran Halus (Tosca & Cream) */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#E8F5F3] rounded-full blur-3xl opacity-70 pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-[#FDF6E3] rounded-full blur-3xl opacity-70 pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* ============================================================== */}
        {/* BAGIAN KIRI: JAM ISTIWA' UTAMA (BESAR & JELAS)                  */}
        {/* ============================================================== */}
        <div className="flex-1 space-y-3">
          
          {/* Header Label & Lokasi */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5F3] text-[#1D7A6F] text-xs font-bold border border-[#2A9D8F]/25 shadow-xs">
              <Sun className="w-3.5 h-3.5 text-[#2A9D8F] animate-spin-slow" />
              <span>JAM ISTIWA&apos; (WIS)</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Real-time Detik
            </span>

            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-[#636E72]">
              <MapPin className="w-3 h-3 text-[#2A9D8F]" />
              Wilayah Pare, Kediri
            </span>
          </div>

          {/* Tampilan Jam Istiwa' (Font Jumbo & Font Monospace agar angka detik tidak goyang) */}
          <div className="flex items-baseline gap-3">
            <div className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#1D7A6F] tracking-tight font-mono drop-shadow-xs">
              {dataWaktu.wis.teks}
            </div>
            <span className="text-lg sm:text-2xl font-extrabold text-[#2A9D8F]">
              WIS
            </span>
          </div>

          {/* Keterangan Deskriptif */}
          <p className="text-xs sm:text-sm text-[#636E72] leading-relaxed max-w-xl">
            Waktu Matahari Hakiki (Zawal) Pondok Pesantren Darussalam Sumbersari.
            Matahari tepat berada di titik kulminasi atas saat jam 12:00:00 WIS.
          </p>
        </div>

        {/* ============================================================== */}
        {/* BAGIAN KANAN: DETAIL JAM WIB, SELISIH HARI INI & TANGGAL       */}
        {/* ============================================================== */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:min-w-[280px]">
          
          {/* Baris 1: Jam WIB Saat Ini */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FDF6E3] border border-[#2A9D8F]/15">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#2A9D8F] shadow-xs border border-[#2A9D8F]/10">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[#636E72] uppercase tracking-wider">
                  Waktu WIB
                </div>
                <div className="text-sm font-bold text-[#2D3436] font-mono">
                  {dataWaktu.wib.teks} WIB
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#1D7A6F] bg-[#E8F5F3] px-2 py-0.5 rounded-md">
              UTC+7
            </span>
          </div>

          {/* Baris 2: Selisih Hari Ini */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FDF6E3] border border-[#2A9D8F]/15">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#2A9D8F] shadow-xs border border-[#2A9D8F]/10">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[#636E72] uppercase tracking-wider">
                  Selisih Hari Ini
                </div>
                <div className="text-sm font-extrabold text-[#1D7A6F]">
                  {dataWaktu.selisihTeks}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-medium text-[#636E72] bg-white px-2 py-0.5 rounded-md border border-gray-200" title="Rumus: Jam Istiwa = Jam WIB ditambah selisih">
              WIB + {dataWaktu.selisihMenit}m
            </span>
          </div>

          {/* Baris 3: Tanggal Hari Ini */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FDF6E3] border border-[#2A9D8F]/15">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#2A9D8F] shadow-xs border border-[#2A9D8F]/10">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[#636E72] uppercase tracking-wider">
                  Tanggal Masehi
                </div>
                <div className="text-xs sm:text-sm font-bold text-[#2D3436]">
                  {dataWaktu.tanggalLengkap}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
