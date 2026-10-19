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
  const [dataWaktu, setDataWaktu] = useState(() =>
    typeof window !== 'undefined' ? hitungJamIstiwa() : null
  );

  useEffect(() => {
    // 1. Buat interval agar jam terus berdetak setiap 1 detik (1000 milidetik)
    const intervalId = setInterval(() => {
      setDataWaktu(hitungJamIstiwa());
    }, 1000);

    // 2. Bersihkan timer jika berpindah halaman agar memori tetap hemat
    return () => clearInterval(intervalId);
  }, []);

  // Tampilan cadangan (placeholder) saat awal muat agar tidak berkedip
  if (!dataWaktu) {
    return (
      <div className="bg-white rounded-xl p-6 sm:p-7 border border-[#DCE5E0] animate-pulse">
        <div className="h-5 bg-stone-200 rounded w-48 mb-4"></div>
        <div className="h-12 bg-stone-200 rounded w-72 mb-4"></div>
        <div className="h-4 bg-stone-100 rounded w-60"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 sm:p-7 border border-[#DCE5E0] shadow-xs relative overflow-hidden">
      {/* Aksen garis emas halus di bagian atas */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1D7A6F] via-[#C6A66B] to-[#1D7A6F]" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-1">
        
        {/* ============================================================== */}
        {/* BAGIAN KIRI: JAM ISTIWA' UTAMA (BESAR & JELAS)                  */}
        {/* ============================================================== */}
        <div className="flex-1 space-y-3">
          
          {/* Header Label & Lokasi */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#1D7A6F] text-[#C6A66B] text-[11px] font-bold tracking-wider border border-[#C6A66B]/30 shadow-xs">
              <Sun className="w-3.5 h-3.5 text-[#C6A66B]" />
              <span>JAM ISTIWA&apos; (WIS)</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#E8F5F3] text-[#1D7A6F] text-[11px] font-semibold border border-[#C8E3DC]">
              <span className="w-2 h-2 rounded-full bg-[#1D7A6F] animate-pulse"></span>
              Real-time Detik
            </span>

            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-[#5C6E66]">
              <MapPin className="w-3.5 h-3.5 text-[#C6A66B]" />
              Pare, Kediri (PP. Darussalam Sumbersari)
            </span>
          </div>

          {/* Tampilan Jam Istiwa' (Font Jumbo & Monospace) */}
          <div className="flex items-baseline gap-2 sm:gap-3">
            <div className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#1D7A6F] tracking-tight font-mono">
              {dataWaktu.wis.teks}
            </div>
            <span className="text-lg sm:text-2xl font-black text-[#C6A66B] tracking-wide">
              WIS
            </span>
          </div>

          {/* Keterangan Deskriptif */}
          <p className="text-xs sm:text-sm text-[#5C6E66] leading-relaxed max-w-xl">
            Waktu Matahari Hakiki (Zawal) Pondok Pesantren Darussalam Sumbersari.
            Matahari tepat berada di titik kulminasi atas saat jam 12:00:00 WIS sebagai patokan utama waktu sholat dan kegiatan pondok.
          </p>
        </div>

        {/* ============================================================== */}
        {/* BAGIAN KANAN: DETAIL JAM WIB, SELISIH HARI INI & TANGGAL       */}
        {/* ============================================================== */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 lg:min-w-[290px]">
          
          {/* Baris 1: Jam WIB Saat Ini */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#F7F5EF] border border-[#DCE5E0]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-[#1D7A6F] border border-[#DCE5E0] shadow-xs">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-[#5C6E66] uppercase tracking-wider">
                  Waktu Indonesia Barat
                </div>
                <div className="text-sm font-bold text-[#26332E] font-mono">
                  {dataWaktu.wib.teks} WIB
                </div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-[#1D7A6F] bg-[#E8F5F3] border border-[#C8E3DC] px-2 py-0.5 rounded">
              UTC+7
            </span>
          </div>

          {/* Baris 2: Selisih Hari Ini */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#F7F5EF] border border-[#DCE5E0]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-[#1D7A6F] border border-[#DCE5E0] shadow-xs">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-[#5C6E66] uppercase tracking-wider">
                  Koreksi / Selisih Hari Ini
                </div>
                <div className="text-sm font-bold text-[#1D7A6F]">
                  {dataWaktu.selisihTeks}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-medium text-[#26332E] bg-white px-2 py-0.5 rounded border border-[#DCE5E0]" title="Rumus: Jam Istiwa = Jam WIB ditambah selisih">
              WIB + {dataWaktu.selisihMenit}m
            </span>
          </div>

          {/* Baris 3: Tanggal Hari Ini */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#F7F5EF] border border-[#DCE5E0]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-[#1D7A6F] border border-[#DCE5E0] shadow-xs">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-[#5C6E66] uppercase tracking-wider">
                  Penanggalan Masehi
                </div>
                <div className="text-xs sm:text-sm font-bold text-[#26332E]">
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

