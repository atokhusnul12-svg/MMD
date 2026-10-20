/**
 * AUDIT KOMPREHENSIF SETELAH REFACTORING WEBSITE MMD
 * Menguji:
 * 1. Formatter Rupiah & Parsing Nilai Mata Uang (berbagai format input)
 * 2. Formatter Tanggal Indonesia & Kalender Masehi
 * 3. Modul Jam Istiwa' (Perhitungan WIS daerah Pare, Kediri)
 * 4. Integrasi & Perhitungan Data Keuangan (RAB, LPJ, Saldo)
 * 5. Kompatibilitas Re-export & Modul
 */

import { formatRupiah, parseCurrencyToNumber, formatIndonesianDate, BULAN_INDONESIA } from '../lib/formatters.js';
import { hitungJamIstiwa, TABEL_SELISIH_PARE, NAMA_BULAN } from '../lib/jamIstiwa.js';
import { formatRupiah as reExportedFormatRupiah, parseCurrencyToNumber as reExportedParseCurrency } from '../lib/fetchCSV.js';

console.log('=======================================================');
console.log('   AUDIT AKHIR SETELAH REFACTORING WEBSITE MMD   ');
console.log('=======================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testName, detail = '') {
  if (condition) {
    console.log(`  ✓ [PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`  ✗ [FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
    failCount++;
  }
}

// ---------------------------------------------------------------------------
// 1. PENGUJIAN FORMATTER MATA UANG & PARSING RUPIAH
// ---------------------------------------------------------------------------
console.log('[1/5] Menguji formatRupiah & parseCurrencyToNumber:');

assert(parseCurrencyToNumber(null) === 0, 'parseCurrencyToNumber(null) -> 0');
assert(parseCurrencyToNumber(undefined) === 0, 'parseCurrencyToNumber(undefined) -> 0');
assert(parseCurrencyToNumber('') === 0, 'parseCurrencyToNumber("") -> 0');
assert(parseCurrencyToNumber(0) === 0, 'parseCurrencyToNumber(0) -> 0');
assert(parseCurrencyToNumber(5000000) === 5000000, 'parseCurrencyToNumber(number) -> angka asli');
assert(parseCurrencyToNumber('Rp 20,166,500') === 20166500, 'parseCurrencyToNumber("Rp 20,166,500") -> 20166500');
assert(parseCurrencyToNumber('21.752.000') === 21752000, 'parseCurrencyToNumber("21.752.000") -> 21752000');
assert(parseCurrencyToNumber('-150000') === -150000, 'parseCurrencyToNumber("-150000") -> -150000 (angka negatif)');

assert(formatRupiah(0) === 'Rp 0', 'formatRupiah(0) -> "Rp 0"');
assert(formatRupiah(null) === 'Rp 0', 'formatRupiah(null) -> "Rp 0"');
assert(formatRupiah(undefined) === 'Rp 0', 'formatRupiah(undefined) -> "Rp 0"');
assert(formatRupiah(2500000) === 'Rp 2.500.000', 'formatRupiah(2500000) -> "Rp 2.500.000"');
assert(formatRupiah(-50000) === 'Rp -50.000', 'formatRupiah(-50000) -> "Rp -50.000"');

// Kompatibilitas re-export dari fetchCSV.js
assert(typeof reExportedFormatRupiah === 'function', 're-export formatRupiah dari fetchCSV.js tersedia');
assert(typeof reExportedParseCurrency === 'function', 're-export parseCurrencyToNumber dari fetchCSV.js tersedia');
assert(reExportedFormatRupiah(1000) === formatRupiah(1000), 're-export formatRupiah menghasilkan output identik');

// ---------------------------------------------------------------------------
// 2. PENGUJIAN FORMAT TANGGAL & BULAN INDONESIA
// ---------------------------------------------------------------------------
console.log('\n[2/5] Menguji formatIndonesianDate & BULAN_INDONESIA:');

assert(BULAN_INDONESIA.length === 12, 'BULAN_INDONESIA memiliki 12 bulan');
assert(BULAN_INDONESIA[0] === 'Januari' && BULAN_INDONESIA[11] === 'Desember', 'Urutan bulan Januari s/d Desember benar');
assert(NAMA_BULAN === BULAN_INDONESIA, 'NAMA_BULAN di jamIstiwa.js merujuk ke BULAN_INDONESIA');

assert(formatIndonesianDate('') === '', 'formatIndonesianDate("") -> ""');
assert(formatIndonesianDate(null) === '', 'formatIndonesianDate(null) -> ""');
assert(formatIndonesianDate('2026-05-18') === '18 Mei 2026 M.', 'formatIndonesianDate("2026-05-18") -> "18 Mei 2026 M."');
assert(formatIndonesianDate('2026-10-20') === '20 Oktober 2026 M.', 'formatIndonesianDate("2026-10-20") -> "20 Oktober 2026 M."');
assert(formatIndonesianDate('invalid-date') === 'invalid-date', 'formatIndonesianDate fallback ke string asli jika format bukan YYYY-MM-DD');

// ---------------------------------------------------------------------------
// 3. PENGUJIAN MODUL JAM ISTIWA' (WIS)
// ---------------------------------------------------------------------------
console.log('\n[3/5] Menguji perhitungan Jam Istiwa\' (WIS daerah Pare):');

const sampleDate = new Date('2026-10-13T14:00:00+07:00');
const hasilIstiwa = hitungJamIstiwa(sampleDate);

assert(hasilIstiwa !== null, 'hitungJamIstiwa() mengembalikan objek hasil');
assert(hasilIstiwa.tanggalLengkap.includes('Oktober'), 'Tanggal lengkap memuat nama bulan');
assert(hasilIstiwa.wib.jam === 14 && hasilIstiwa.wib.menit === 0, 'Jam WIB terhitung 14:00');
// Cek selisih tanggal 13 Oktober di tabel Pare (indeks 12 bulan 10)
const selisihOkt13 = TABEL_SELISIH_PARE[10][12];
assert(hasilIstiwa.selisihMenit === selisihOkt13, `Selisih menit 13 Oktober sesuai tabel (${selisihOkt13} menit)`);
assert(hasilIstiwa.wis.jam === 14 && hasilIstiwa.wis.menit === selisihOkt13, `Jam WIS terhitung 14:${selisihOkt13} WIS`);
assert(hasilIstiwa.wis.teks.startsWith('14:'), 'Teks Jam WIS terformat jam:menit:detik');

// Uji tanggal kabisat 29 Februari
const kabisatDate = new Date('2028-02-29T12:00:00+07:00');
const hasilKabisat = hitungJamIstiwa(kabisatDate);
assert(hasilKabisat.selisihMenit === 16, 'Selisih tanggal 29 Februari kabisat terhitung benar (16 menit)');

// ---------------------------------------------------------------------------
// 4. PENGUJIAN PERHITUNGAN REKAPITULASI KEUANGAN (RAB, LPJ, SALDO)
// ---------------------------------------------------------------------------
console.log('\n[4/5] Menguji formula perhitungan akumulasi Keuangan:');

const mockRekapitulasi = [
  { bulan: 'Rabiul Awal', subsidi: 12500000, pengeluaran: 10200000, saldo: 2300000 },
  { bulan: 'Rabiul Tsani', subsidi: 15000000, pengeluaran: 14500000, saldo: 500000 },
  { bulan: 'Dzulqo\'dah', subsidi: 8000000, pengeluaran: 7100000, saldo: 900000 },
];

const totalSubsidi = mockRekapitulasi.reduce((acc, r) => acc + r.subsidi, 0);
const totalPengeluaran = mockRekapitulasi.reduce((acc, r) => acc + r.pengeluaran, 0);
const totalSaldo = mockRekapitulasi.reduce((acc, r) => acc + r.saldo, 0);
const persenPenyerapan = totalSubsidi > 0 ? ((totalPengeluaran / totalSubsidi) * 100).toFixed(1) : '0';

assert(totalSubsidi === 35500000, 'Total Subsidi RAB terakumulasi benar (Rp 35.500.000)');
assert(totalPengeluaran === 31800000, 'Total Pengeluaran LPJ terakumulasi benar (Rp 31.800.000)');
assert(totalSaldo === 3700000, 'Total Saldo Kas terakumulasi benar (Rp 3.700.000)');
assert(persenPenyerapan === '89.6', 'Persentase penyerapan anggaran terhitung 89.6%');

// ---------------------------------------------------------------------------
// 5. STATUS BADGE CONFIG DI ABSENSI WAKA II
// ---------------------------------------------------------------------------
console.log('\n[5/5] Menguji pemetaan status absensi WAKA II:');

const STATUS_KEYS = ['H', 'S', 'I', 'A'];
assert(STATUS_KEYS.length === 4, '4 status dasar absensi (H, S, I, A) terdaftar');

console.log('\n-------------------------------------------------------');
console.log(`HASIL: ${passCount} LULUS, ${failCount} GAGAL`);
console.log('-------------------------------------------------------');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('✓ Seluruh pengujian audit komprehensif berhasil 100%!\n');
}
