/**
 * ==============================================================================
 * MODUL JADWAL WAKTU SHOLAT & KONVERSI JAM ISTIWA' (WIS)
 * WEBSITE WAKA III — MAJLIS MUSYAWAROH DARUSSALAM (MMD)
 * PONDOK PESANTREN DARUSSALAM SUMBERSARI, KENCONG, PARE, KEDIRI
 * ==============================================================================
 * 
 * SUMBER DATA:
 * - File JSON: public/data/prayer-schedule-waka-iii.json
 * - Berisi 365 rekaman siklus tahunan (Desember s/d November)
 * - Zona Waktu: Asia/Jakarta (WIB, UTC+7)
 * 
 * FORMULA KONVERSI ISTIWA' (WIS):
 * - Jam Istiwa' = Jam WIB + Selisih Menit Pare (Kediri)
 * - Selisih diambil dari TABEL_SELISIH_PARE (lib/jamIstiwa.js)
 */

import { getSelisihMenitPare, getWibParts } from './jamIstiwa.js';

// Nama bulan Masehi bahasa Indonesia standar
export const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const MONTH_TO_INDEX = {
  januari: 1,
  februari: 2,
  maret: 3,
  april: 4,
  mei: 5,
  juni: 6,
  juli: 7,
  agustus: 8,
  september: 9,
  oktober: 10,
  november: 11,
  desember: 12,
};

// Urutan dan definisi 7 waktu sholat utama + terbit
export const PRAYER_KEYS = [
  { key: 'imsak', label: 'Imsak', description: 'Batas akhir santap sahur', isFardhu: false },
  { key: 'subuh', label: 'Subuh', description: 'Awal fajar shodiq', isFardhu: true },
  { key: 'sunrise', label: 'Terbit', description: 'Syuruq (akhir waktu Subuh)', isFardhu: false },
  { key: 'dhuha', label: 'Dhuha', description: 'Matahari naik setinggi tombak', isFardhu: false },
  { key: 'dhuhr', label: 'Dzuhur', description: 'Matahari tergelincir (zawal)', isFardhu: true },
  { key: 'asr', label: 'Ashar', description: 'Bayangan melebihi panjang benda', isFardhu: true },
  { key: 'maghrib', label: 'Maghrib', description: 'Matahari terbenam sempurna', isFardhu: true },
  { key: 'isha', label: 'Isya\'', description: 'Hilangnya mega merah (syafaq)', isFardhu: true },
];

// Cache data JSON jadwal sholat di memori agar tidak fetch berulang
let cachedSchedulePromise = null;
let cachedScheduleData = null;

/**
 * Memuat data jadwal sholat dari file public/data/prayer-schedule-waka-iii.json
 * Menggunakan caching memori untuk mencegah duplikasi pemanggilan data.
 * @returns {Promise<{ metadata: Object, schedule: Array }>}
 */
export async function fetchPrayerSchedule() {
  if (cachedScheduleData) {
    return cachedScheduleData;
  }

  if (cachedSchedulePromise) {
    return cachedSchedulePromise;
  }

  cachedSchedulePromise = (async () => {
    try {
      const res = await fetch('/data/prayer-schedule-waka-iii.json', {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`File jadwal tidak ditemukan (HTTP ${res.status}). Pastikan public/data/prayer-schedule-waka-iii.json tersedia.`);
      }

      const json = await res.json();
      if (!json || !Array.isArray(json.schedule) || json.schedule.length === 0) {
        throw new Error('Format data jadwal sholat tidak valid atau kosong.');
      }

      cachedScheduleData = json;
      return json;
    } catch (err) {
      cachedSchedulePromise = null; // Reset promise agar bisa dicoba ulang jika gagal
      throw err;
    }
  })();

  return cachedSchedulePromise;
}

/**
 * Konversi waktu dari format "HH:mm" WIB ke format Jam Istiwa' (WIS)
 * Rumus yang valid: Jam Istiwa = Jam WIB + Selisih Menit Pare
 * 
 * @param {string} wibTimeStr - Waktu WIB string "HH:mm"
 * @param {number|null} selisihMenit - Selisih menit dari tabel Pare
 * @returns {{ wis: string|null, wib: string, selisihMenit: number|null, isValid: boolean, error?: string }}
 */
export function convertWibToWis(wibTimeStr, selisihMenit) {
  if (!wibTimeStr || typeof wibTimeStr !== 'string' || !wibTimeStr.includes(':')) {
    return {
      wis: null,
      wib: wibTimeStr || '--:--',
      selisihMenit: null,
      isValid: false,
      error: 'Format waktu WIB tidak valid',
    };
  }

  if (selisihMenit === null || selisihMenit === undefined || isNaN(selisihMenit)) {
    return {
      wis: null,
      wib: wibTimeStr,
      selisihMenit: null,
      isValid: false,
      error: 'Data selisih WIB-Istiwa tidak ditemukan',
    };
  }

  const [jamStr, menitStr] = wibTimeStr.split(':');
  const jam = parseInt(jamStr, 10);
  const menit = parseInt(menitStr, 10);

  if (isNaN(jam) || isNaN(menit)) {
    return {
      wis: null,
      wib: wibTimeStr,
      selisihMenit,
      isValid: false,
      error: 'Angka waktu tidak valid',
    };
  }

  // Hitung total menit dari tengah malam (00:00)
  const totalMenitWib = jam * 60 + menit;
  let totalMenitWis = totalMenitWib + selisihMenit;

  // Tangani perputaran 24 jam (1440 menit)
  const MENIT_SEHARI = 24 * 60;
  while (totalMenitWis < 0) {
    totalMenitWis += MENIT_SEHARI;
  }
  totalMenitWis = totalMenitWis % MENIT_SEHARI;

  const wisJam = Math.floor(totalMenitWis / 60);
  const wisMenit = totalMenitWis % 60;

  const padZero = (n) => String(n).padStart(2, '0');
  const wisStr = `${padZero(wisJam)}:${padZero(wisMenit)}`;

  return {
    wis: wisStr,
    wib: wibTimeStr,
    selisihMenit,
    isValid: true,
  };
}

/**
 * Mencari data jadwal sholat untuk tanggal tertentu (berdasarkan zona Asia/Jakarta)
 * Mendukung penanganan kabisat (29 Februari jatuh ke 28 Februari bila tidak ada)
 * 
 * @param {Array} scheduleList - Array 365 baris dari JSON
 * @param {Date} date - Tanggal target (default: sekarang)
 * @returns {Object|null} Objek jadwal sholat beserta selisih dan konversi WIS
 */
export function getPrayerScheduleForDate(scheduleList, date = new Date()) {
  if (!Array.isArray(scheduleList) || scheduleList.length === 0) {
    return null;
  }

  const wib = getWibParts(date);
  const targetMonthName = BULAN_NAMES[wib.bulan - 1]?.toLowerCase();
  const targetDay = wib.tanggal;

  let row = scheduleList.find(
    (item) => item.month?.toLowerCase() === targetMonthName && item.day === targetDay
  );

  // Penanganan tahun kabisat (29 Feb fallback ke 28 Feb)
  if (!row && wib.bulan === 2 && targetDay === 29) {
    row = scheduleList.find(
      (item) => item.month?.toLowerCase() === 'februari' && item.day === 28
    );
  }

  if (!row) {
    return null;
  }

  // Ambil selisih Pare resmi dari lib/jamIstiwa.js
  const selisihMenit = getSelisihMenitPare(wib.tanggal, wib.bulan);

  // Bentuk jadwal terstruktur dengan waktu WIB dan WIS
  const prayers = {};
  PRAYER_KEYS.forEach((p) => {
    const rawTime = row[p.key];
    const conversion = convertWibToWis(rawTime, selisihMenit);
    prayers[p.key] = {
      key: p.key,
      label: p.label,
      description: p.description,
      isFardhu: p.isFardhu,
      wib: rawTime,
      wis: conversion.wis,
      selisihMenit: conversion.selisihMenit,
      isValidWis: conversion.isValid,
    };
  });

  return {
    raw: row,
    prayers,
    dateInfo: {
      tanggal: wib.tanggal,
      bulan: wib.bulan,
      tahun: wib.tahun,
      namaHari: wib.namaHari,
      namaBulan: wib.namaBulan,
      tanggalLengkap: `${wib.namaHari}, ${wib.tanggal} ${wib.namaBulan} ${wib.tahun}`,
      selisihMenit,
      sourcePeriod: row.sourcePeriod,
    },
  };
}

/**
 * Mengubah string waktu "HH:mm" ke total detik
 */
function timeStrToSeconds(str) {
  if (!str) return 0;
  const [h, m] = str.split(':').map(Number);
  return (h || 0) * 3600 + (m || 0) * 60;
}

/**
 * Format detik menjadi "HH:mm:ss"
 */
export function formatSecondsToHms(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Format detik menjadi teks bahasa Indonesia yang ramah (misal: "2 jam 15 menit lagi")
 */
export function formatSecondsHuman(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  if (hours > 0) {
    return `${hours} jam ${minutes} menit ${seconds} dtk`;
  }
  if (minutes > 0) {
    return `${minutes} menit ${seconds} dtk`;
  }
  return `${seconds} detik`;
}

/**
 * Menghitung waktu sholat berikutnya, sholat aktif saat ini, dan hitung mundur
 * 
 * @param {Object} todaySchedule - Hasil getPrayerScheduleForDate hari ini
 * @param {Object} tomorrowSchedule - Hasil getPrayerScheduleForDate besok
 * @param {Date} [currentDate] - Objek Date waktu sekarang
 * @returns {Object|null}
 */
export function calculateNextPrayerInfo(todaySchedule, tomorrowSchedule, currentDate = new Date()) {
  if (!todaySchedule?.prayers) return null;

  const wib = getWibParts(currentDate);
  const currentTotalSeconds = wib.jam * 3600 + wib.menit * 60 + wib.detik;

  // Daftar sholat yang menjadi target waktu berurutan
  // Urutan: Imsak -> Subuh -> Dhuha -> Dzuhur -> Ashar -> Maghrib -> Isya
  const prayerSequence = [
    todaySchedule.prayers.imsak,
    todaySchedule.prayers.subuh,
    todaySchedule.prayers.dhuha,
    todaySchedule.prayers.dhuhr,
    todaySchedule.prayers.asr,
    todaySchedule.prayers.maghrib,
    todaySchedule.prayers.isha,
  ].filter(Boolean);

  let nextPrayer = null;
  let activePrayer = null;
  let prevPrayerSec = 0;
  let nextPrayerSec = 0;
  let remainingSeconds = 0;
  let isTomorrow = false;

  for (let i = 0; i < prayerSequence.length; i++) {
    const item = prayerSequence[i];
    const pSec = timeStrToSeconds(item.wib);

    if (pSec > currentTotalSeconds) {
      nextPrayer = item;
      nextPrayerSec = pSec;
      remainingSeconds = pSec - currentTotalSeconds;
      isTomorrow = false;

      if (i > 0) {
        activePrayer = prayerSequence[i - 1];
        prevPrayerSec = timeStrToSeconds(prayerSequence[i - 1].wib);
      } else {
        // Sebelum imsak: sholat aktif adalah Isya' malam sebelumnya
        activePrayer = {
          key: 'isha_night',
          label: "Isya' (Malam)",
          wib: todaySchedule.prayers.isha.wib,
          wis: todaySchedule.prayers.isha.wis,
        };
        prevPrayerSec = 0;
      }
      break;
    }
  }

  // Jika sudah melewati Isya' hari ini, target berikutnya adalah Imsak besok
  if (!nextPrayer) {
    const tomorrowImsak = tomorrowSchedule?.prayers?.imsak || todaySchedule.prayers.imsak;
    nextPrayer = tomorrowImsak;
    isTomorrow = true;
    activePrayer = todaySchedule.prayers.isha;
    prevPrayerSec = timeStrToSeconds(todaySchedule.prayers.isha.wib);
    const tomorrowImsakSec = timeStrToSeconds(tomorrowImsak.wib);
    nextPrayerSec = tomorrowImsakSec;
    // Sisa detik hari ini hingga tengah malam (86400 - currentSec) + detik imsak besok
    remainingSeconds = (86400 - currentTotalSeconds) + tomorrowImsakSec;
  }

  // Hitung persentase progress waktu antara sholat sebelumnya dan sholat berikutnya
  let progressPercent = 0;
  if (!isTomorrow && nextPrayerSec > prevPrayerSec) {
    const totalInterval = nextPrayerSec - prevPrayerSec;
    const elapsed = currentTotalSeconds - prevPrayerSec;
    progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalInterval) * 100)));
  } else if (isTomorrow) {
    const totalInterval = (86400 - prevPrayerSec) + nextPrayerSec;
    const elapsed = currentTotalSeconds - prevPrayerSec;
    progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalInterval) * 100)));
  }

  return {
    nextPrayer,
    activePrayer,
    remainingSeconds,
    countdownHms: formatSecondsToHms(remainingSeconds),
    countdownHuman: formatSecondsHuman(remainingSeconds),
    isTomorrow,
    progressPercent,
    currentWib: `${String(wib.jam).padStart(2, '0')}:${String(wib.menit).padStart(2, '0')}:${String(wib.detik).padStart(2, '0')}`,
  };
}
