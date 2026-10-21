'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Sun,
  Clock,
  Compass,
  Calendar,
  MapPin,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useJamIstiwa } from '@/lib/useJamIstiwa';
import { getWibParts, getSelisihMenitPare } from '@/lib/jamIstiwa';
import Collapsible from '@/components/motion/Collapsible';
import staticPrayerSchedule from '@/public/data/prayer-schedule-waka-iii.json';

// Urutan 8 waktu sholat falakiyah persis seperti referensi visual (Dimulai dari Zawal / Dhuhur)
const PRAYER_ROWS = [
  { key: 'dhuhr', label: 'Dhuhur', fullLabel: 'Dzuhur' },
  { key: 'asr', label: 'Ashar', fullLabel: 'Ashar' },
  { key: 'maghrib', label: 'Maghrib', fullLabel: 'Maghrib' },
  { key: 'isha', label: "Isya'", fullLabel: "Isya'" },
  { key: 'imsak', label: 'Imsak', fullLabel: 'Imsak' },
  { key: 'subuh', label: 'Shubuh', fullLabel: 'Subuh' },
  { key: 'sunrise', label: "Thulu'", fullLabel: 'Terbit' },
  { key: 'dhuha', label: 'Dhuha', fullLabel: 'Dhuha' },
];

/**
 * Konversi waktu WIB string "HH:mm" ke Jam Istiwa' (WIS) format 12 jam (01-12)
 * Sesuai dial jam matahari / bencet tradisional di pesantren
 */
function formatWis12(wibStr, selisih) {
  if (!wibStr || typeof wibStr !== 'string' || !wibStr.includes(':')) {
    return '--:-- WIS';
  }
  const [h, m] = wibStr.split(':').map(Number);
  const totalMin = (h * 60 + m + (selisih || 0)) % 1440;
  let wisH = Math.floor(totalMin / 60);
  const wisM = totalMin % 60;
  if (wisH > 12) wisH -= 12;
  if (wisH === 0) wisH = 12;
  return `${String(wisH).padStart(2, '0')}:${String(wisM).padStart(2, '0')} WIS`;
}

function timeStrToSeconds(str) {
  if (!str) return 0;
  const [h, m] = str.split(':').map(Number);
  return (h || 0) * 3600 + (m || 0) * 60;
}

export default function PortalJamIstiwaCard() {
  const shouldReduceMotion = useReducedMotion();
  const dataWaktu = useJamIstiwa();
  const [dayOffset, setDayOffset] = useState(0);
  const [showWibDetails, setShowWibDetails] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [tafawutHeight, setTafawutHeight] = useState(0);
  const tafawutRef = useRef(null);
  const activePrayerRef = useRef(null);

  // Ukur tinggi aktual kartu Tafawut secara dinamis menggunakan ResizeObserver
  useEffect(() => {
    if (!tafawutRef.current) return;
    const el = tafawutRef.current;

    const updateHeight = () => {
      const h = el.offsetHeight || el.getBoundingClientRect().height;
      if (h > 0) {
        setTafawutHeight(Math.round(h));
      }
    };

    updateHeight();

    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        updateHeight();
      });
      ro.observe(el);
    }

    el.addEventListener('transitionend', updateHeight);
    window.addEventListener('resize', updateHeight);

    return () => {
      if (ro) ro.disconnect();
      el.removeEventListener('transitionend', updateHeight);
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  // Hitung batas tinggi panel jadwal sholat saat dibuka:
  // - Bila kartu Tafawut dibuka & ukurannya membesar (misal 180-240px+), panel jadwal dapat menyesuaikan.
  // - Bila kartu Tafawut tertutup (~44px), panel jadwal saat dibuka TIDAK BOLEH ikut gepeng ke 44px.
  //   Gunakan batas proporsional (225px) agar header tanggal, daftar waktu sholat yang bisa di-scroll,
  //   dan footer tetap tampil utuh & serasi dengan kolom kiri.
  const openPanelHeight = useMemo(() => {
    const baseHeight = 225;
    if (!tafawutHeight || tafawutHeight <= baseHeight) {
      return baseHeight;
    }
    return Math.min(tafawutHeight, 320);
  }, [tafawutHeight]);

  // Otomatis scroll ke sholat yang sedang aktif saat panel dibuka
  useEffect(() => {
    if (isExpanded && activePrayerRef.current) {
      activePrayerRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isExpanded, dayOffset]);

  // Informasi tanggal terpilih (berdasarkan zona Asia/Jakarta, dinamis sesuai offset)
  const selectedDateInfo = useMemo(() => {
    const d = new Date();
    if (dayOffset !== 0) {
      d.setDate(d.getDate() + dayOffset);
    }
    return getWibParts(d);
  }, [dayOffset, dataWaktu?.tanggal]);

  // Selisih menit Pare dinamis untuk tanggal terpilih
  const selectedSelisih = useMemo(() => {
    return getSelisihMenitPare(selectedDateInfo.tanggal, selectedDateInfo.bulan);
  }, [selectedDateInfo]);

  // Data jadwal sholat untuk tanggal terpilih dari JSON 365 hari
  const selectedRow = useMemo(() => {
    if (!staticPrayerSchedule?.schedule) return null;
    const monthNames = [
      'januari', 'februari', 'maret', 'april', 'mei', 'juni',
      'juli', 'agustus', 'september', 'oktober', 'november', 'desember',
    ];
    const targetMonth = monthNames[selectedDateInfo.bulan - 1];
    let row = staticPrayerSchedule.schedule.find(
      (s) => s.month?.toLowerCase() === targetMonth && s.day === selectedDateInfo.tanggal
    );
    if (!row && selectedDateInfo.bulan === 2 && selectedDateInfo.tanggal === 29) {
      row = staticPrayerSchedule.schedule.find(
        (s) => s.month?.toLowerCase() === 'februari' && s.day === 28
      );
    }
    return row;
  }, [selectedDateInfo]);

  // Data jadwal sholat hari ini aktual (untuk perhitungan real-time & hitung mundur)
  const todayRow = useMemo(() => {
    if (!staticPrayerSchedule?.schedule || !dataWaktu) return null;
    const monthNames = [
      'januari', 'februari', 'maret', 'april', 'mei', 'juni',
      'juli', 'agustus', 'september', 'oktober', 'november', 'desember',
    ];
    const targetMonth = monthNames[dataWaktu.bulan - 1];
    let row = staticPrayerSchedule.schedule.find(
      (s) => s.month?.toLowerCase() === targetMonth && s.day === dataWaktu.tanggal
    );
    if (!row && dataWaktu.bulan === 2 && dataWaktu.tanggal === 29) {
      row = staticPrayerSchedule.schedule.find(
        (s) => s.month?.toLowerCase() === 'februari' && s.day === 28
      );
    }
    return row;
  }, [dataWaktu]);

  // Data jadwal sholat besok aktual (untuk transisi malam hari)
  const tomorrowRow = useMemo(() => {
    if (!staticPrayerSchedule?.schedule || !dataWaktu) return null;
    const now = new Date();
    now.setDate(now.getDate() + 1);
    const tomWib = getWibParts(now);
    const monthNames = [
      'januari', 'februari', 'maret', 'april', 'mei', 'juni',
      'juli', 'agustus', 'september', 'oktober', 'november', 'desember',
    ];
    const targetMonth = monthNames[tomWib.bulan - 1];
    let row = staticPrayerSchedule.schedule.find(
      (s) => s.month?.toLowerCase() === targetMonth && s.day === tomWib.tanggal
    );
    if (!row && tomWib.bulan === 2 && tomWib.tanggal === 29) {
      row = staticPrayerSchedule.schedule.find(
        (s) => s.month?.toLowerCase() === 'februari' && s.day === 28
      );
    }
    return row;
  }, [dataWaktu]);

  // Kalkulasi target sholat berikutnya dan hitung mundur aktual hari ini
  const nextPrayerInfo = useMemo(() => {
    if (!todayRow || !dataWaktu) return null;
    const nowSec = dataWaktu.wib.jam * 3600 + dataWaktu.wib.menit * 60 + dataWaktu.wib.detik;

    const chronological = [
      { key: 'imsak', label: 'Imsak' },
      { key: 'subuh', label: 'Shubuh' },
      { key: 'sunrise', label: "Thulu'" },
      { key: 'dhuha', label: 'Dhuha' },
      { key: 'dhuhr', label: 'Dhuhur' },
      { key: 'asr', label: 'Ashar' },
      { key: 'maghrib', label: 'Maghrib' },
      { key: 'isha', label: "Isya'" },
    ];

    let nextP = null;
    let diffSec = 0;

    for (const p of chronological) {
      const pSec = timeStrToSeconds(todayRow[p.key]);
      if (pSec > nowSec) {
        nextP = p;
        diffSec = pSec - nowSec;
        break;
      }
    }

    if (!nextP) {
      nextP = chronological[0]; // Imsak besok
      const tomSec = tomorrowRow ? timeStrToSeconds(tomorrowRow[nextP.key]) : timeStrToSeconds(todayRow[nextP.key]);
      diffSec = 86400 - nowSec + tomSec;
    }

    const remH = Math.floor(diffSec / 3600);
    const remM = Math.floor((diffSec % 3600) / 60);

    const pad = (n) => String(n).padStart(2, '0');
    return {
      key: nextP.key,
      label: nextP.label,
      countdownShort: `-${pad(remH)}:${pad(remM)}`,
    };
  }, [todayRow, tomorrowRow, dataWaktu]);

  // Status tampilan countdown / footer berdasarkan tanggal yang sedang dipilih
  const countdownDisplay = useMemo(() => {
    const pad = (n) => String(n).padStart(2, '0');

    if (dayOffset === 0) {
      return nextPrayerInfo
        ? `${nextPrayerInfo.label} ${nextPrayerInfo.countdownShort}`
        : 'Memuat...';
    }

    if (dayOffset > 0) {
      // Tanggal mendatang: hitung mundur dari waktu saat ini ke waktu Imsak tanggal tersebut
      if (!selectedRow || !dataWaktu) return 'Mendatang';
      const nowSec = dataWaktu.wib.jam * 3600 + dataWaktu.wib.menit * 60 + dataWaktu.wib.detik;
      const imsakSec = timeStrToSeconds(selectedRow.imsak);
      const totalDiffSec = (86400 - nowSec) + ((dayOffset - 1) * 86400) + imsakSec;

      const remH = Math.floor(totalDiffSec / 3600);
      const remM = Math.floor((totalDiffSec % 3600) / 60);

      const label = dayOffset === 1 ? 'Imsak Besok' : 'Imsak';
      return `${label} -${pad(remH)}:${pad(remM)}`;
    }

    // Tanggal kemarin / lampau
    return dayOffset === -1 ? 'Jadwal Kemarin' : 'Hari Berlalu';
  }, [dayOffset, nextPrayerInfo, selectedRow, dataWaktu]);

  // Sholat yang menjadi fokus saat panel dalam kondisi ringkas (collapsed ~75-85px)
  const currentFocusPrayer = useMemo(() => {
    if (dayOffset === 0 && nextPrayerInfo) {
      const rawWib = selectedRow ? selectedRow[nextPrayerInfo.key] : '';
      const wis = selectedRow ? formatWis12(rawWib, selectedSelisih) : '--:-- WIS';
      return {
        key: nextPrayerInfo.key,
        label: nextPrayerInfo.label,
        wis: wis,
        wib: rawWib,
      };
    }

    if (selectedRow) {
      const rawWib = selectedRow.imsak || '';
      const wis = formatWis12(rawWib, selectedSelisih);
      const label = dayOffset === 1 ? 'Imsak Besok' : dayOffset === -1 ? 'Imsak Kemarin' : 'Imsak';
      return {
        key: 'imsak',
        label: label,
        wis: wis,
        wib: rawWib,
      };
    }

    return {
      key: '',
      label: 'Sholat',
      wis: '--:-- WIS',
      wib: '',
    };
  }, [dayOffset, nextPrayerInfo, selectedRow, selectedSelisih]);

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={
        shouldReduceMotion ? { duration: 0 } : { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
      }
      className="relative rounded-2xl bg-gradient-to-br from-[#124B44] via-[#1D7A6F] to-[#165E55] text-white p-3.5 sm:p-4 lg:p-5 shadow-md hover:shadow-lg transition-shadow duration-300 border border-white/10 z-20"
    >
      {/* Ornamen Latar Aksen Kaligrafi/Geometris (di-clip terpisah agar popover dropdown bebas melayang) */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-40 h-40 rounded-full bg-[#ECD8A5]/10 blur-xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ECD8A5] to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row items-start justify-between gap-4 lg:gap-6">
        
        {/* ============================================================== */}
        {/* KOLOM KIRI: JAM ISTIWA' UTAMA (WIS) & INFORMASI LOKASI        */}
        {/* ============================================================== */}
        <div className="flex-1 min-w-0 space-y-3 sm:space-y-3.5">
          {/* 1. Header Badges: Jam Istiwa' (WIS), status real-time, dan lokasi */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF6EF]/15 backdrop-blur-md text-[10px] sm:text-[11px] font-bold text-[#ECD8A5] border border-[#ECD8A5]/30">
              <Sun className="w-3 h-3 text-[#ECD8A5] shrink-0" />
              <span>JAM ISTIWA&apos; (WIS)</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-medium text-white/90 border border-white/15">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>Real-Time Detik</span>
            </span>

            <span className="inline-flex items-center gap-1 text-[11px] text-white/80">
              <MapPin className="w-3 h-3 text-[#ECD8A5]" />
              <span>Pare, Kediri (PP. Darussalam Sumbersari)</span>
            </span>
          </div>

          {/* 2. Jam digital WIS sebagai elemen terbesar */}
          <div className="flex items-baseline gap-2 sm:gap-3 py-0.5">
            <span
              suppressHydrationWarning
              className="text-4xl sm:text-5xl lg:text-5xl font-black font-mono tracking-tight text-white drop-shadow-xs tabular-nums [font-variant-numeric:tabular-nums]"
            >
              {dataWaktu ? dataWaktu.wis.teks : '--:--:--'}
            </span>
            <span className="text-xl sm:text-2xl font-black font-serif text-[#ECD8A5] tracking-wider">
              WIS
            </span>
          </div>

          {/* 3. Dua informasi ringkas: Waktu Patokan Nasional (WIB) dan Tanggal Masehi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg">
            <div className="p-2 sm:p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-[#ECD8A5] shrink-0">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] font-semibold text-white/70 uppercase tracking-wider truncate">
                  Waktu Patokan Nasional
                </div>
                <div suppressHydrationWarning className="text-xs sm:text-sm font-bold font-mono text-white tabular-nums truncate">
                  {dataWaktu ? dataWaktu.wib.teks : '--:--:--'}{' '}
                  <span className="text-[10px] text-white/80 font-normal">WIB</span>
                </div>
              </div>
            </div>

            <div className="p-2 sm:p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-[#ECD8A5] shrink-0">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] font-semibold text-white/70 uppercase tracking-wider truncate">
                  Tanggal Masehi
                </div>
                <div suppressHydrationWarning className="text-[11px] sm:text-xs font-semibold text-white truncate">
                  {dataWaktu ? dataWaktu.tanggalLengkap : 'Memuat...'}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Kartu Waktu Istiwa' (WIS) Tafawut (Tepat setelah informasi utama) */}
          <div ref={tafawutRef} className="max-w-lg">
            <Collapsible
              title="Waktu Istiwa' (WIS) Tafawut"
              icon={Compass}
              badge={`Tafawut +${selectedSelisih}m`}
              className="w-full text-xs bg-white/5 border border-white/15 rounded-xl shadow-xs"
              headerClassName="p-3 sm:p-3.5 text-xs sm:text-sm"
              contentClassName="p-3 sm:p-3.5 pt-1 text-[11px] sm:text-xs"
            >
              <p className="text-[11px] sm:text-xs text-white/90 leading-relaxed">
                <strong className="text-[#ECD8A5]">Waktu Istiwa&apos; Sumbersari (WIS) Tafawut</strong> dihitung menurut koordinat falakiyah Pondok Pesantren Darussalam Sumbersari (Kencong, Kepung, Pare, Kediri: 7°42&apos; LS, 112°11&apos; BT) berpatokan pada posisi matahari lokal (zawal haqiqi = 12:00:00 WIS). Selisih hari ini ({selectedDateInfo.tanggal} {selectedDateInfo.namaBulan}): <strong className="text-[#ECD8A5]">+{selectedSelisih} menit</strong> terhadap waktu patokan nasional (WIB).
              </p>
            </Collapsible>
          </div>
        </div>

        {/* ============================================================== */}
        {/* KOLOM KANAN: KARTU COMPACT & PANEL JADWAL SHOLAT BER-SCROLL    */}
        {/* ============================================================== */}
        <div className="w-full lg:w-[330px] xl:w-[350px] shrink-0">
          {!isExpanded ? (
            /* SAAT TERTUTUP: KARTU COMPACT HORIZONTAL (~70-80px) */
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              aria-expanded={false}
              aria-label="Buka seluruh jadwal sholat"
              className="w-full text-left p-3 sm:p-3.5 rounded-2xl bg-black/15 hover:bg-black/25 backdrop-blur-sm border border-white/15 shadow-inner transition-all duration-200 cursor-pointer select-none group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#ECD8A5]"
              style={{ minHeight: '74px' }}
            >
              {/* Baris Atas: Label & Tombol Buka */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-5 h-5 rounded-md bg-[#ECD8A5]/20 flex items-center justify-center text-[#ECD8A5] shrink-0">
                    <Sun className="w-3 h-3" />
                  </div>
                  <span className="text-[11px] font-bold text-[#ECD8A5] uppercase tracking-wider truncate">
                    {dayOffset === 0
                      ? 'Jadwal Sholat'
                      : `Jadwal ${dayOffset === 1 ? 'Besok' : dayOffset === -1 ? 'Kemarin' : `${selectedDateInfo.tanggal} ${selectedDateInfo.namaBulan}`}`}
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-white/10 text-white/90 shrink-0">
                    {dayOffset === 0
                      ? 'Hari Ini'
                      : dayOffset === 1
                      ? 'Besok'
                      : dayOffset === -1
                      ? 'Kemarin'
                      : `${dayOffset > 0 ? `+${dayOffset}` : dayOffset} hr`}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0 text-[#ECD8A5]/90 group-hover:text-[#ECD8A5] transition-colors">
                  <span className="text-[11px] font-semibold">Lihat Jadwal</span>
                  <ChevronDown className="w-4 h-4 text-[#ECD8A5]" />
                </div>
              </div>

              {/* Baris Bawah: Sholat Aktif, Countdown, Jam WIS */}
              <div className="flex items-baseline justify-between gap-2 pt-2">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="text-[15px] sm:text-[16px] font-bold text-white tracking-wide truncate">
                    {currentFocusPrayer.label}
                  </span>
                  <span className="text-[11px] sm:text-xs font-semibold text-[#ECD8A5] font-mono tabular-nums truncate">
                    ({countdownDisplay})
                  </span>
                </div>

                <div className="flex items-baseline gap-1 shrink-0 text-right font-mono tabular-nums">
                  <span
                    suppressHydrationWarning
                    className="text-[15px] sm:text-[16px] font-black text-[#ECD8A5]"
                  >
                    {currentFocusPrayer.wis}
                  </span>
                </div>
              </div>
            </button>
          ) : (
            /* SAAT DIBUKA: PANEL DENGAN TINGGI PROPORSIONAL & SEIMBANG DENGAN KOLOM KIRI */
            <div
              className="w-full rounded-2xl bg-black/20 backdrop-blur-sm border border-white/15 p-2.5 sm:p-3 flex flex-col overflow-hidden transition-all duration-200 shadow-inner"
              style={{
                height: `${openPanelHeight}px`,
                maxHeight: `${openPanelHeight}px`,
              }}
            >
              {/* 1. Header Tanggal Ringkas (Tetap Terlihat, Fixed / shrink-0) */}
              <div className="shrink-0 pb-1.5 mb-1 border-b border-white/10 space-y-1">
                {/* Baris 1: Panah Kiri, Label Tanggal Aktif, Panah Kanan, & Tombol Tutup */}
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => setDayOffset((prev) => prev - 1)}
                    aria-label="Tanggal sebelumnya"
                    title="Lihat hari sebelumnya"
                    className="p-1 rounded-md bg-white/10 hover:bg-white/20 active:scale-95 text-[#ECD8A5] hover:text-white transition-all cursor-pointer shrink-0"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <div className="text-center min-w-0 px-1 truncate flex items-center justify-center gap-1.5">
                    <span
                      className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider shrink-0 ${
                        dayOffset === 0
                          ? 'bg-[#ECD8A5]/25 text-[#ECD8A5] border border-[#ECD8A5]/40'
                          : dayOffset === 1
                          ? 'bg-emerald-400/25 text-emerald-300 border border-emerald-400/40'
                          : dayOffset === -1
                          ? 'bg-amber-400/25 text-amber-300 border border-amber-400/40'
                          : 'bg-white/15 text-white/90 border border-white/20'
                      }`}
                    >
                      {dayOffset === 0
                        ? 'Hari Ini'
                        : dayOffset === 1
                        ? 'Besok'
                        : dayOffset === -1
                        ? 'Kemarin'
                        : `${dayOffset > 0 ? `+${dayOffset}` : dayOffset} hr`}
                    </span>
                    <span className="text-xs sm:text-[13px] font-bold text-white tracking-wide truncate">
                      {selectedDateInfo.namaHari}, {selectedDateInfo.tanggal} {selectedDateInfo.namaBulan}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDayOffset((prev) => prev + 1)}
                      aria-label="Tanggal berikutnya"
                      title="Lihat hari berikutnya"
                      className="p-1 rounded-md bg-white/10 hover:bg-white/20 active:scale-95 text-[#ECD8A5] hover:text-white transition-all cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsExpanded(false)}
                      aria-label="Tutup daftar jadwal"
                      title="Tutup daftar jadwal"
                      className="p-1 rounded-md bg-white/10 hover:bg-white/20 active:scale-95 text-[#ECD8A5] hover:text-white transition-all cursor-pointer ml-0.5"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Baris 2: Tombol Cepat: Kemarin | Hari Ini | Besok */}
                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDayOffset(-1)}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all cursor-pointer ${
                      dayOffset === -1
                        ? 'bg-[#ECD8A5] text-[#124B44] shadow-xs'
                        : 'bg-white/10 text-white/80 hover:bg-white/15 hover:text-white'
                    }`}
                  >
                    Kemarin
                  </button>
                  <button
                    type="button"
                    onClick={() => setDayOffset(0)}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all cursor-pointer ${
                      dayOffset === 0
                        ? 'bg-[#ECD8A5] text-[#124B44] shadow-xs'
                        : 'bg-white/10 text-white/80 hover:bg-white/15 hover:text-white'
                    }`}
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setDayOffset(1)}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all cursor-pointer ${
                      dayOffset === 1
                        ? 'bg-[#ECD8A5] text-[#124B44] shadow-xs'
                        : 'bg-white/10 text-white/80 hover:bg-white/15 hover:text-white'
                    }`}
                  >
                    Besok
                  </button>
                </div>
              </div>

              {/* 2. Daftar 8 Waktu Sholat (Area Scroll Internal Vertikal: flex-1 min-h-0 overflow-y-auto) */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(236,216,165,0.4)_transparent]">
                {PRAYER_ROWS.map((item) => {
                  const rawWib = selectedRow ? selectedRow[item.key] : '';
                  const wisTime = selectedRow
                    ? formatWis12(rawWib, selectedSelisih)
                    : '--:-- WIS';
                  const isHighlighted = dayOffset === 0 && nextPrayerInfo?.key === item.key;

                  return (
                    <div
                      key={item.key}
                      ref={isHighlighted ? activePrayerRef : null}
                      className={`h-[34px] min-h-[34px] px-2.5 sm:px-3 rounded-lg flex items-center justify-between transition-all duration-150 shrink-0 ${
                        isHighlighted
                          ? 'relative bg-[#ECD8A5]/25 text-[#ECD8A5] shadow-xs'
                          : 'text-white/85 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {/* Indikator Garis Vertikal di Sebelah Kiri untuk Highlight */}
                      {isHighlighted && (
                        <span className="absolute left-1.5 top-1.5 bottom-1.5 w-1 rounded-full bg-[#ECD8A5]" />
                      )}

                      {/* Nama Sholat (14-15px, medium/semibold) */}
                      <span
                        className={`text-[14px] sm:text-[15px] leading-none ${
                          isHighlighted
                            ? 'font-semibold text-[#ECD8A5] pl-2'
                            : 'font-medium text-white/90'
                        }`}
                      >
                        {item.label}
                      </span>

                      {/* Jam WIS Rata Kanan (13-14px, semibold/bold tabular) */}
                      <div className="flex items-center gap-1.5 text-right font-mono tabular-nums leading-none">
                        <span
                          suppressHydrationWarning
                          className={`text-[13px] sm:text-[14px] ${
                            isHighlighted
                              ? 'font-bold text-[#ECD8A5]'
                              : 'font-semibold text-white/85'
                          }`}
                        >
                          {wisTime}
                        </span>

                        {/* Padanan Waktu WIB (Jika Detail Dibuka) */}
                        {showWibDetails && rawWib && (
                          <span className="text-[10px] text-white/60 font-sans">
                            ({rawWib})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 3. Footer Ringkas (Tetap Terlihat, Fixed / shrink-0) */}
              <div className="shrink-0 pt-1.5 mt-1 border-t border-white/10">
                <div className="flex items-center justify-between px-1 text-xs font-semibold text-[#ECD8A5]">
                  {/* Koreksi Ke WIB */}
                  <span suppressHydrationWarning className="text-[11px] sm:text-xs truncate">
                    Ke WIB -00.{String(selectedSelisih).padStart(2, '0')}
                  </span>

                  {/* Ikon Panah untuk Menutup Panel Kembali ke Ringkas */}
                  <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    aria-label="Tutup panel jadwal"
                    title="Tutup jadwal sholat"
                    className="p-1 rounded-md text-[#ECD8A5]/80 hover:text-[#ECD8A5] hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>

                  {/* Countdown Target Sholat & Toggle WIB */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span suppressHydrationWarning className="text-[11px] sm:text-xs font-semibold font-mono tabular-nums truncate">
                      {countdownDisplay}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowWibDetails(!showWibDetails)}
                      aria-label="Tampilkan detail padanan WIB"
                      title={showWibDetails ? 'Sembunyikan jam WIB' : 'Tampilkan padanan jam WIB'}
                      className="text-[9px] px-1 py-0.2 rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-[#ECD8A5] transition-colors cursor-pointer"
                    >
                      {showWibDetails ? 'WIS' : 'WIB'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}
