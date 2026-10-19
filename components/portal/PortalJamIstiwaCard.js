'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Clock, Compass, Calendar, MapPin } from 'lucide-react';
import { hitungJamIstiwa } from '@/lib/jamIstiwa';

export default function PortalJamIstiwaCard() {
  const [dataWaktu, setDataWaktu] = useState(() =>
    typeof window !== 'undefined' ? hitungJamIstiwa() : null
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setDataWaktu(hitungJamIstiwa());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#124B44] via-[#1D7A6F] to-[#165E55] text-white p-6 sm:p-8 lg:p-10 shadow-lg border border-white/10">
      {/* Ornamen Latar Aksen Kaligrafi/Geometris */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 rounded-full bg-[#ECD8A5]/10 blur-xl pointer-events-none" />

      {/* Garis Aksen Emas Halus */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ECD8A5] to-transparent" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-10">
        
        {/* ============================================================== */}
        {/* BAGIAN KIRI: JAM ISTIWA' UTAMA (WIS)                           */}
        {/* ============================================================== */}
        <div className="space-y-4 flex-1">
          {/* Header Pill & Lokasi Astronomi */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF6EF]/15 backdrop-blur-md text-xs font-bold text-[#ECD8A5] border border-[#ECD8A5]/30">
              <Sun className="w-3.5 h-3.5 text-[#ECD8A5] animate-spin" style={{ animationDuration: '20s' }} />
              <span>JAM ISTIWA&apos; (WIS)</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-xs font-medium text-white/90 border border-white/15">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Real-Time Per Detik</span>
            </span>

            <span className="inline-flex items-center gap-1 text-xs text-white/80">
              <MapPin className="w-3.5 h-3.5 text-[#ECD8A5]" />
              <span>Pare, Kediri (PP. Darussalam Sumbersari)</span>
            </span>
          </div>

          {/* Jam Istiwa' Display Jumbo */}
          <div className="flex items-baseline gap-3">
            <span
              suppressHydrationWarning
              className="text-4xl sm:text-6xl lg:text-7xl font-black font-mono tracking-tight text-white drop-shadow-sm"
            >
              {dataWaktu ? dataWaktu.wis.teks : '--:--:--'}
            </span>
            <span className="text-xl sm:text-3xl font-black font-serif text-[#ECD8A5] tracking-wider">
              WIS
            </span>
          </div>

          {/* Penjelasan Filosofi Jam Istiwa' */}
          <p className="text-xs sm:text-sm text-white/85 leading-relaxed max-w-xl">
            <strong className="text-[#ECD8A5]">Waktu Matahari Hakiki (Zawal)</strong> dihitung berdasarkan posisi garis bujur astronomis lokal Pondok Pesantren Darussalam Sumbersari. Matahari tepat berada di titik kulminasi atas pada pukul <span className="font-semibold text-white">12:00:00 WIS</span> sebagai patokan utama jam ibadah &amp; kegiatan santri.
          </p>
        </div>

        {/* ============================================================== */}
        {/* BAGIAN KANAN: METRIK WAKTU PEMBANDING (WIB, SELISIH, TANGGAL)  */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3 shrink-0 lg:min-w-[320px]">
          
          {/* Card 1: Waktu Indonesia Barat (WIB) */}
          <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center text-[#ECD8A5]">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">
                  Waktu Patokan Nasional
                </div>
                <div suppressHydrationWarning className="text-base font-bold font-mono text-white">
                  {dataWaktu ? dataWaktu.wib.teks : '--:--:--'}{' '}
                  <span className="text-xs text-white/80 font-normal">WIB</span>
                </div>
              </div>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/15 text-white/90 border border-white/20">
              UTC+7
            </span>
          </div>

          {/* Card 2: Koreksi Selisih Hari Ini */}
          <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center text-[#ECD8A5]">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">
                  Selisih Koreksi Pare
                </div>
                <div suppressHydrationWarning className="text-base font-bold text-[#ECD8A5]">
                  {dataWaktu ? dataWaktu.selisihTeks : 'Menghitung...'}
                </div>
              </div>
            </div>
            <span
              suppressHydrationWarning
              className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#FAF6EF]/20 text-[#ECD8A5] border border-[#ECD8A5]/30"
            >
              {dataWaktu ? `+${dataWaktu.selisihMenit} Menit` : '+--m'}
            </span>
          </div>

          {/* Card 3: Tanggal Hari Ini */}
          <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center text-[#ECD8A5]">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">
                  Tanggal Masehi
                </div>
                <div suppressHydrationWarning className="text-xs sm:text-sm font-semibold text-white">
                  {dataWaktu ? dataWaktu.tanggalLengkap : 'Memuat tanggal...'}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
