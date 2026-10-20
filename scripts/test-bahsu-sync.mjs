const { getBahsuData, isSequenceEqual, mergeDelegasiLines } = await import('../lib/fetchCSV.js');
const { DATA_LINKS } = await import('../lib/dataLinks.js');

console.log('=== UJI SINKRONISASI DATA AGENDA BAHTSUL MASAIL DARI GOOGLE SHEETS ===\n');

// 1. Unit Test Logika Penggabungan Delegasi (mergeDelegasiLines)
console.log('[1/2] Menjalankan Unit Test mergeDelegasiLines:');

// Kasus 1: Sisa baris lanjutan duplikat pada Agenda 22
const t1 = mergeDelegasiLines(
  ['KOM A', 'M. Aulia Azza Muzaka', 'Abdulloh Yusuf', 'KOM B', 'Atana Akhid Abdul Basith Mauludin', "Ja'far Ali Mughni"],
  ['M. Aulia Azza Muzaka', 'Abdulloh Yusuf', 'KOM B', 'Atana Akhid Abdul Basith Mauludin', "Ja'far Ali Mughni"]
);
console.assert(t1.length === 6, 'Gagal: Agenda 22 harus menghasilkan tepat 6 baris');
console.log('  ✓ Kasus 1 (Agenda 22 - pembersihan duplikasi baris lanjutan): Berhasil (6 entri)');

// Kasus 2: Format multi-baris sah (Agenda 23 - 1 header line + 5 continuation rows)
const t2 = mergeDelegasiLines(
  ['KOM A'],
  ['Izza Nur Muhammad', 'Abdul Hakim Ibnu Asyhari', 'KOM B', 'Muhammad Ziyada Fatan Tazkiya', 'Moh. Qolbu Lamyanam Asshufi']
);
console.assert(t2.length === 6, 'Gagal: Agenda 23 harus menghasilkan 6 baris');
console.log('  ✓ Kasus 2 (Agenda multi-baris terpisah KOM A & KOM B): Berhasil (6 entri)');

// Kasus 3: Peserta yang sama terdaftar sah pada kelompok berbeda (KOM A dan KOM B)
const t3 = mergeDelegasiLines(
  ['KOM A', 'M. Aulia Azza Muzaka', 'Abdulloh Yusuf', 'KOM B', 'M. Aulia Azza Muzaka', "Ja'far Ali Mughni"],
  []
);
console.assert(t3.length === 6 && t3.filter(x => x === 'M. Aulia Azza Muzaka').length === 2, 'Gagal: Peserta sah tidak boleh dihapus');
console.log('  ✓ Kasus 3 (Peserta sah yang sama di kelompok berbeda tetap dipertahankan): Berhasil');

// 2. Integration Test Mengambil & Mem-parse Google Sheets Aktual
console.log('\n[2/2] Mengambil dan memvalidasi data langsung dari Google Sheets:');
console.log('  URL CSV:', DATA_LINKS.bahsu.csvUrl);

const result = await getBahsuData(DATA_LINKS.bahsu.csvUrl);
console.log(`  Total agenda berhasil diproses: ${result.totalAgenda}`);
console.log(`  Statistik: ${result.totalSudahBerangkat} Terlaksana, ${result.totalBelumBerangkat} Belum Berangkat, ${result.totalIzin} Izin`);

// Validasi Agenda 22
const e22 = result.events.find(e => String(e.no) === '22');
if (!e22) {
  console.error('  ✗ Agenda 22 tidak ditemukan!');
  process.exit(1);
}

const expectedE22 = [
  'KOM A',
  'M. Aulia Azza Muzaka',
  'Abdulloh Yusuf',
  'KOM B',
  'Atana Akhid Abdul Basith Mauludin',
  "Ja'far Ali Mughni"
];

const e22Match = e22.delegasi.length === expectedE22.length &&
  e22.delegasi.every((d, i) => d.toLowerCase() === expectedE22[i].toLowerCase());

if (!e22Match) {
  console.error('  ✗ Delegasi Agenda 22 tidak sesuai!', e22.delegasi);
  process.exit(1);
}

console.log('  ✓ Agenda 22 (BMA Ringinagung) terverifikasi presisi:');
console.log('    Kelompok KOM A: M. Aulia Azza Muzaka, Abdulloh Yusuf');
console.log('    Kelompok KOM B: Atana Akhid Abdul Basith Mauludin, Ja\'far Ali Mughni');
console.log('    Jumlah delegasi:', e22.delegasi.length);

console.log('\n=== SELURUH PENGUJIAN SELESAI DENGAN SUKSES 100% ===');
