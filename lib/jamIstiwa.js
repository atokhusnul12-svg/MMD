/**
 * ==============================================================================
 * MODUL PERHITUNGAN JAM ISTIWA' (WIS - WAKTU ISTIWA' / MATAHARI SEJATI)
 * WILAYAH: PARE (KEDIRI) & SEKITARNYA
 * PONDOK PESANTREN DARUSSALAM SUMBERSARI
 * ==============================================================================
 * 
 * PENJELASAN UNTUK PEMULA:
 * ------------------------------------------------------------------------------
 * 1. Jam Istiwa' (Waktu Istiwa' / WIS) adalah waktu yang dihitung berdasarkan posisi
 *    matahari yang sesungguhnya (matahari tepat di atas kepala saat jam 12:00:00 WIS / waktu zawal).
 * 2. Jam WIB (Waktu Indonesia Barat) adalah waktu rata-rata patokan bujur 105° BT.
 * 3. Karena bumi beredar mengelilingi matahari dan porosnya miring, terdapat perbedaan waktu
 *    antara jam matahari sejati (WIS) dan jam WIB sepanjang 365 hari.
 * 4. Untuk daerah Pare (Kediri), rumusnya adalah:
 *       Jam Istiwa' = Jam WIB + Selisih Menit (pada tanggal & bulan hari ini)
 * 
 * Contoh:
 * - WIB = 14:00
 * - Selisih hari ini (13 Oktober) = 43 menit
 * - Maka Jam Istiwa' = 14:43 WIS
 */

import { BULAN_INDONESIA } from './formatters.js';

// Nama-nama bulan Masehi dalam bahasa Indonesia (merujuk ke formatters terpusat)
export const NAMA_BULAN = BULAN_INDONESIA;

// Singkatan bulan 3 huruf
export const KODE_BULAN = [
  'JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN',
  'JUL', 'AGS', 'SEP', 'OKT', 'NOV', 'DES'
];

/**
 * TABEL SELISIH WIB - WIS DAERAH PARE (DALAM MENIT)
 * Format data:
 * - Objek dengan kunci bulan (1 untuk Jan s/d 12 untuk Des)
 * - Nilai berupa array selisih untuk tanggal 1 sampai 31 (indeks 0 = tanggal 1)
 * - Tanda null artinya tanggal tersebut tidak ada (misal Feb 30 atau 31)
 */
export const TABEL_SELISIH_PARE = {
  // 1: JANUARI (31 hari)
  1: [26, 25, 25, 24, 24, 23, 23, 23, 23, 22, 21, 21, 20, 20, 20, 19, 19, 19, 18, 18, 18, 17, 17, 17, 17, 16, 16, 16, 16, 16, 16],
  
  // 2: FEBRUARI (28/29 hari, jika kabisat tgl 29 diisi 16)
  2: [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 16, 16, 16, 16, 16, null, null],
  
  // 3: MARET (31 hari)
  3: [16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 18, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 22, 22, 22, 23, 23, 23, 24, 24, 24, 25],
  
  // 4: APRIL (30 hari)
  4: [25, 25, 25, 26, 26, 26, 27, 27, 27, 28, 28, 28, 28, 29, 29, 29, 29, 30, 30, 30, 30, 30, 31, 31, 31, 31, 31, 31, 32, 32, null],
  
  // 5: MEI (31 hari)
  5: [32, 32, 32, 32, 32, 32, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 32, 32, 32, 32, 32, 32, 32, 32],
  
  // 6: JUNI (30 hari)
  6: [32, 31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30, 30, 29, 29, 28, 28, 28, 28, 28, 27, 27, 27, 27, 27, 26, 26, 26, 26, null],
  
  // 7: JULI (31 hari)
  7: [26, 25, 25, 25, 25, 25, 24, 24, 24, 24, 24, 24, 24, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23],
  
  // 8: AGUSTUS (31 hari)
  8: [23, 23, 23, 23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 25, 25, 25, 25, 25, 26, 26, 26, 26, 27, 27, 27, 27, 28, 28, 28, 28],
  
  // 9: SEPTEMBER (30 hari)
  9: [29, 29, 29, 30, 30, 30, 31, 31, 31, 32, 32, 32, 33, 33, 34, 34, 34, 35, 35, 35, 35, 36, 36, 37, 37, 37, 38, 38, 39, 39, null],
  
  // 10: OKTOBER (31 hari)
  10: [39, 39, 40, 40, 40, 40, 41, 41, 41, 42, 42, 42, 43, 43, 43, 43, 43, 44, 44, 44, 44, 44, 45, 45, 45, 45, 45, 45, 45, 45, 45],
  
  // 11: NOVEMBER (30 hari)
  11: [45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 44, 44, 44, 44, 44, 43, 43, 43, 43, 42, 42, 42, 42, 41, 41, 41, null],
  
  // 12: DESEMBER (31 hari)
  12: [40, 40, 39, 39, 38, 38, 38, 37, 37, 36, 36, 36, 35, 35, 35, 34, 33, 33, 32, 32, 31, 31, 30, 30, 29, 29, 28, 28, 27, 27, 26],
};

/**
 * Mengambil nilai selisih dalam menit untuk tanggal dan bulan tertentu
 * @param {number} tanggal (1 - 31)
 * @param {number} bulan (1 - 12)
 * @returns {number} Nilai selisih dalam menit (misal: 43)
 */
export function getSelisihMenitPare(tanggal, bulan) {
  const bulanKey = Math.min(Math.max(bulan, 1), 12);
  const barisBulan = TABEL_SELISIH_PARE[bulanKey];
  
  if (!barisBulan) return 0;
  
  const index = Math.min(Math.max(tanggal - 1, 0), 30);
  const nilai = barisBulan[index];
  
  // Jika bernilai null (misal tgl 31 pada bulan yg cuma 30 hari), ambil nilai hari sebelumnya
  if (nilai === null || nilai === undefined) {
    for (let i = index - 1; i >= 0; i--) {
      if (barisBulan[i] !== null && barisBulan[i] !== undefined) {
        return barisBulan[i];
      }
    }
    return 0;
  }
  
  return nilai;
}

/**
 * Format angka 2 digit (misal: 5 jadi '05')
 */
function padZero(num) {
  return String(num).padStart(2, '0');
}

/**
 * Ambil waktu saat ini dalam zona WIB (Asia/Jakarta, UTC+7)
 * Memastikan akurat meskipun komputer/HP pengguna berada di zona waktu lain.
 */
export function getWibParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const map = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }

  const tanggal = parseInt(map.day, 10);
  const bulan = parseInt(map.month, 10);
  const tahun = parseInt(map.year, 10);
  let jam = parseInt(map.hour, 10);
  if (jam === 24) jam = 0; // standardisasi tengah malam
  const menit = parseInt(map.minute, 10);
  const detik = parseInt(map.second, 10);
  const namaHari = map.weekday || '';

  return {
    tanggal,
    bulan,
    tahun,
    jam,
    menit,
    detik,
    namaHari,
    namaBulan: NAMA_BULAN[bulan - 1] || '',
  };
}

/**
 * Menghitung Jam Istiwa' (WIS) secara lengkap berdasarkan waktu WIB
 * Rumus yang BENAR:
 *   Jam Istiwa' = Jam WIB + Selisih Menit
 * 
 * @param {Date} date - Objek Date waktu saat ini (default: waktu sekarang)
 * @returns {Object} Data lengkap jam WIB, jam Istiwa', selisih, dan tanggal
 */
export function hitungJamIstiwa(date = new Date()) {
  const wib = getWibParts(date);
  const selisihMenit = getSelisihMenitPare(wib.tanggal, wib.bulan);

  // Ubah waktu WIB ke total detik dari jam 00:00:00
  const totalDetikWib = (wib.jam * 3600) + (wib.menit * 60) + wib.detik;
  
  // Hitung selisih dalam detik
  const selisihDetik = selisihMenit * 60;
  
  // Rumus yang BENAR: Jam Istiwa = Jam WIB + Selisih
  let totalDetikIstiwa = totalDetikWib + selisihDetik;

  // Tangani jika melebihi 24 jam (masuk ke hari berikutnya)
  const DETIK_SEHARI = 24 * 3600;
  while (totalDetikIstiwa < 0) {
    totalDetikIstiwa += DETIK_SEHARI;
  }
  totalDetikIstiwa = totalDetikIstiwa % DETIK_SEHARI;

  // Konversi kembali dari detik ke jam, menit, detik
  const jamIstiwa = Math.floor(totalDetikIstiwa / 3600);
  const sisaDetik = totalDetikIstiwa % 3600;
  const menitIstiwa = Math.floor(sisaDetik / 60);
  const detikIstiwa = sisaDetik % 60;

  // Teks yang diformat rapi
  const wibString = `${padZero(wib.jam)}:${padZero(wib.menit)}:${padZero(wib.detik)}`;
  const wisString = `${padZero(jamIstiwa)}:${padZero(menitIstiwa)}:${padZero(detikIstiwa)}`;
  const tanggalLengkap = `${wib.namaHari}, ${wib.tanggal} ${wib.namaBulan} ${wib.tahun}`;

  return {
    // Waktu WIB
    wib: {
      jam: wib.jam,
      menit: wib.menit,
      detik: wib.detik,
      teks: wibString,
    },
    // Waktu Istiwa' (WIS)
    wis: {
      jam: jamIstiwa,
      menit: menitIstiwa,
      detik: detikIstiwa,
      teks: wisString,
    },
    // Data Selisih
    selisihMenit: selisihMenit,
    selisihTeks: `+${selisihMenit} menit`,
    
    // Data Tanggal
    tanggal: wib.tanggal,
    bulan: wib.bulan,
    tahun: wib.tahun,
    namaHari: wib.namaHari,
    namaBulan: wib.namaBulan,
    tanggalLengkap: tanggalLengkap,
  };
}
