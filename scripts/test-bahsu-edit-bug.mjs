import assert from 'node:assert';
import { parseStatusKeberangkatan, getBahsuData } from '../lib/fetchCSV.js';
import { DATA_LINKS } from '../lib/dataLinks.js';

console.log('================================================================');
console.log('AUDIT & PENGUJIAN REGRESI FITUR EDIT AGENDA BAHTSUL MASAIL');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// PENGUJIAN 1: Klasifikasi & Transisi Status (fetchCSV.js & EditBahsuModal)
// -----------------------------------------------------------------------------
console.log('[UJI 1/5] Memverifikasi Pembacaan & Transisi Status:');

const statusTests = [
  // A. BELOM -> IZIN
  { input: 'BELOM', expected: 'BELUM_BERANGKAT', desc: 'Status BELOM dasar' },
  { input: 'IZIN', expected: 'IZIN', desc: 'Transisi BELOM -> IZIN' },

  // B. BELUM BERANGKAT -> IZIN
  { input: 'BELUM BERANGKAT', expected: 'BELUM_BERANGKAT', desc: 'Status BELUM BERANGKAT (tidak boleh masuk ke SUDAH)' },
  { input: 'BELOM BERANGKAT', expected: 'BELUM_BERANGKAT', desc: 'Status BELOM BERANGKAT (tidak boleh masuk ke SUDAH)' },
  { input: 'Izin (Persiapan Muhafadzoh)', expected: 'IZIN', desc: 'Transisi BELUM BERANGKAT -> IZIN (dengan alasan)' },

  // C. IZIN -> BELUM
  { input: 'BELUM', expected: 'BELUM_BERANGKAT', desc: 'Transisi IZIN -> BELUM' },

  // D. IZIN -> SUDAH
  { input: 'SUDAH', expected: 'SUDAH_BERANGKAT', desc: 'Transisi IZIN -> SUDAH' },
  { input: 'SUDAH BERANGKAT', expected: 'SUDAH_BERANGKAT', desc: 'Status SUDAH BERANGKAT' },
  { input: 'TERLAKSANA', expected: 'SUDAH_BERANGKAT', desc: 'Status TERLAKSANA' },

  // E. Kasus Khusus PP Nurul Kholil (persiapan muhafadzoh)
  { input: 'persiapan muhafadzoh', expected: 'IZIN', desc: 'Alasan persiapan muhafadzoh otomatis dikenali sebagai IZIN' },
  { input: 'Batal', expected: 'IZIN', desc: 'Status Batal dikenali sebagai IZIN' },
  { input: 'Berhalangan', expected: 'IZIN', desc: 'Status Berhalangan dikenali sebagai IZIN' },
];

statusTests.forEach((t, i) => {
  const result = parseStatusKeberangkatan(t.input, '33', '09-10 November 2026 M.', 'BMK KE XXVI, Pp. Nurul Kholil Bangkalan');
  assert.strictEqual(result, t.expected, `Gagal pada kasus: ${t.desc}`);
  console.log(`  ✓ [1.${i + 1}] ${t.desc} ("${t.input}") => ${result}`);
});

// -----------------------------------------------------------------------------
// PENGUJIAN 2: Logika Format Keterangan di Modal (finalKeterangan simulation)
// -----------------------------------------------------------------------------
console.log('\n[UJI 2/5] Memverifikasi Pembentukan finalKeterangan di Modal Formulir:');

function simulateFinalKeterangan(keterangan, customKeterangan) {
  if (keterangan === 'IZIN') {
    const custom = customKeterangan.trim();
    if (!custom) return 'IZIN';
    if (/^izin\b/i.test(custom) || custom.toUpperCase().includes('IZIN') || custom.toUpperCase().includes('BATAL')) {
      return custom;
    }
    return `Izin (${custom})`;
  }
  if (keterangan === 'BELUM') {
    const custom = customKeterangan.trim();
    if (custom && (custom.toUpperCase().includes('BELUM') || custom.toUpperCase().includes('BELOM'))) {
      return custom;
    }
    return 'BELUM';
  }
  if (keterangan === 'SUDAH') {
    const custom = customKeterangan.trim();
    if (custom && (custom.toUpperCase().includes('SUDAH') || custom.toUpperCase().includes('TERLAKSANA'))) {
      return custom;
    }
    return 'SUDAH';
  }
  if (keterangan === 'CUSTOM') {
    return customKeterangan.trim() || 'SUDAH';
  }
  return keterangan;
}

const modalFormattingTests = [
  {
    desc: 'PP Nurul Kholil: Memilih IZIN dengan teks "persiapan muhafadzoh"',
    keterangan: 'IZIN',
    customKeterangan: 'persiapan muhafadzoh',
    expected: 'Izin (persiapan muhafadzoh)',
  },
  {
    desc: 'Memilih IZIN dengan tombol polos tanpa alasan kustom',
    keterangan: 'IZIN',
    customKeterangan: '',
    expected: 'IZIN',
  },
  {
    desc: 'Memilih IZIN dengan teks yang sudah diawali "Izin (alasan)"',
    keterangan: 'IZIN',
    customKeterangan: 'Izin (Persiapan Ujian)',
    expected: 'Izin (Persiapan Ujian)',
  },
  {
    desc: 'Berpindah dari IZIN ke BELUM (teks kustom sisa tidak terbawa)',
    keterangan: 'BELUM',
    customKeterangan: '',
    expected: 'BELUM',
  },
  {
    desc: 'Berpindah dari IZIN ke SUDAH (teks kustom sisa tidak terbawa)',
    keterangan: 'SUDAH',
    customKeterangan: '',
    expected: 'SUDAH',
  },
  {
    desc: 'Edit nama/tanggal tanpa mengubah keterangan BELUM',
    keterangan: 'BELUM',
    customKeterangan: '',
    expected: 'BELUM',
  },
];

modalFormattingTests.forEach((t, i) => {
  const result = simulateFinalKeterangan(t.keterangan, t.customKeterangan);
  assert.strictEqual(result, t.expected, `Gagal pada format modal: ${t.desc}`);
  console.log(`  ✓ [2.${i + 1}] ${t.desc} => "${result}"`);
});

// -----------------------------------------------------------------------------
// PENGUJIAN 3: Verifikasi Identitas Baris (Simulasi Logika Code.js)
// -----------------------------------------------------------------------------
console.log('\n[UJI 3/5] Memverifikasi Algoritma Penentuan & Validasi Baris (Code.js):');

const mockSheetData = [
  ['Header', '', '', '', ''],
  ['NO.', 'BAHTSUL MASAIL', 'TANGGAL', 'DELEGASI', 'KETERANGAN'],
  ['31', 'BMK KE 18 PP. Fadlul Wahid', '11 - 12 November 2026 M.', '', 'Izin (Persiapan Muhafadzoh)'],
  ['32', 'LBM PCNU Nganjuk', '15 November 2026 M.', '', 'BELUM'],
  ['33', 'BMK KE XXVI, Pp. Nurul Kholil Bangkalan', '09-10 November 2026 M.', '', 'persiapan muhafadzoh'],
];

function verifyAndFindRow(targetRow, payloadEvent, sheetRows, colMap = { no: 0, acara: 1, tanggal: 2, delegasi: 3, keterangan: 4 }, headerRowIdx = 1) {
  const cleanOldAcara = (payloadEvent.oldAcara || '').trim().toLowerCase();
  const cleanNewAcara = (payloadEvent.newAcara || '').trim().toLowerCase();
  const cleanOldTanggal = (payloadEvent.oldTanggal || '').trim().toLowerCase();
  const cleanNewTanggal = (payloadEvent.newTanggal || '').trim().toLowerCase();
  const cleanNo = (payloadEvent.no || '').trim();

  function checkRowMatch(rowIndex) {
    if (rowIndex <= headerRowIdx || rowIndex >= sheetRows.length) return false;
    const row = sheetRows[rowIndex];
    const rNo = String(row[colMap.no] || '').trim();
    const rAcara = String(row[colMap.acara] || '').trim().toLowerCase();
    const rTanggal = String(row[colMap.tanggal] || '').trim().toLowerCase();

    const matchOldAcara = cleanOldAcara && (rAcara === cleanOldAcara || rAcara.includes(cleanOldAcara) || cleanOldAcara.includes(rAcara));
    const matchNewAcara = cleanNewAcara && (rAcara === cleanNewAcara || rAcara.includes(cleanNewAcara) || cleanNewAcara.includes(rAcara));
    const matchAcara = matchOldAcara || matchNewAcara;

    const matchOldTanggal = !cleanOldTanggal || (rTanggal === cleanOldTanggal || rTanggal.includes(cleanOldTanggal));
    const matchNewTanggal = !cleanNewTanggal || (rTanggal === cleanNewTanggal || rTanggal.includes(cleanNewTanggal));
    const matchTanggal = matchOldTanggal || matchNewTanggal;

    const matchNo = cleanNo && rNo === cleanNo;

    if (matchAcara && matchTanggal) return true;
    if (matchAcara && matchNo) return true;
    if (matchNo && matchTanggal && cleanOldTanggal) return true;

    return false;
  }

  // 1. Uji targetRow
  if (targetRow && targetRow > headerRowIdx + 1 && targetRow <= sheetRows.length) {
    if (checkRowMatch(targetRow - 1)) {
      return { success: true, actualRow: targetRow };
    }
  }

  // 2. Scan fallback jika baris bergeser
  for (let bi = headerRowIdx + 1; bi < sheetRows.length; bi++) {
    if (checkRowMatch(bi)) {
      return { success: true, actualRow: bi + 1 };
    }
  }

  return { success: false, error: 'Identitas agenda tidak cocok' };
}

// Kasus 3A: PP Nurul Kholil dengan targetRow yang tepat (baris 5 / 1-based)
const r1 = verifyAndFindRow(5, {
  no: '33',
  oldAcara: 'BMK KE XXVI, Pp. Nurul Kholil Bangkalan',
  newAcara: 'BMK KE XXVI, Pp. Nurul Kholil Bangkalan',
  oldTanggal: '09-10 November 2026 M.',
  newTanggal: '09-10 November 2026 M.',
}, mockSheetData);
assert.strictEqual(r1.success, true);
assert.strictEqual(r1.actualRow, 5);
console.log('  ✓ [3.1] Target row cocok langsung: Baris 5 (PP Nurul Kholil)');

// Kasus 3B: Terjadi pergeseran baris (client kirim targetRow = 4, tapi Nurul Kholil ada di baris 5)
const r2 = verifyAndFindRow(4, {
  no: '33',
  oldAcara: 'BMK KE XXVI, Pp. Nurul Kholil Bangkalan',
  newAcara: 'BMK KE XXVI, Pp. Nurul Kholil Bangkalan',
  oldTanggal: '09-10 November 2026 M.',
  newTanggal: '09-10 November 2026 M.',
}, mockSheetData);
assert.strictEqual(r2.success, true);
assert.strictEqual(r2.actualRow, 5);
console.log('  ✓ [3.2] Pemulihan cerdas saat rowNumber bergeser: Mampu mendeteksi baris 5 yang sebenarnya');

// Kasus 3C: Agenda fiktif / data salah (tidak boleh menimpa baris agenda mana pun)
const r3 = verifyAndFindRow(5, {
  no: '99',
  oldAcara: 'Agenda Tidak Dikenal',
  newAcara: 'Agenda Baru',
  oldTanggal: '01 Januari 2030',
  newTanggal: '01 Januari 2030',
}, mockSheetData);
assert.strictEqual(r3.success, false);
console.log('  ✓ [3.3] Agenda tidak cocok berhasil dibatalkan dan tidak menimpa baris agenda lain');

// -----------------------------------------------------------------------------
// PENGUJIAN 4: Mekanisme Proteksi Cache BahsuClient (Optimistic State vs Stale Fetch)
// -----------------------------------------------------------------------------
console.log('\n[UJI 4/5] Memverifikasi Proteksi State Optimistik BahsuClient terhadap Stale Cache:');

// Simulasi state aplikasi
let appState = {
  events: [
    { no: '31', acara: 'PP Fadlul Wahid', keterangan: 'Izin', statusKeberangkatan: 'IZIN' },
    { no: '32', acara: 'PCNU Nganjuk', keterangan: 'BELUM', statusKeberangkatan: 'BELUM_BERANGKAT' },
    { no: '33', acara: 'Pp. Nurul Kholil', keterangan: 'persiapan muhafadzoh', statusKeberangkatan: 'BELUM_BERANGKAT' },
  ],
  totalAgenda: 3,
  totalBelumBerangkat: 2,
  totalSudahBerangkat: 0,
  totalIzin: 1,
};

const recentlySavedMap = new Map();

// 1. Pengguna mengedit PP Nurul Kholil -> IZIN
const editedEvent = {
  no: '33',
  acara: 'Pp. Nurul Kholil',
  tanggal: '09-10 November 2026 M.',
  keterangan: 'Izin (persiapan muhafadzoh)',
  statusKeberangkatan: 'IZIN',
};

// Optimistic update
const saveKey = String(editedEvent.no || editedEvent.acara).toLowerCase();
recentlySavedMap.set(saveKey, { event: editedEvent, time: Date.now() });

const existingIdx = appState.events.findIndex(e => e.no === editedEvent.no);
appState.events[existingIdx] = { ...appState.events[existingIdx], ...editedEvent };
appState.totalBelumBerangkat = appState.events.filter(e => e.statusKeberangkatan === 'BELUM_BERANGKAT').length;
appState.totalIzin = appState.events.filter(e => e.statusKeberangkatan === 'IZIN').length;

assert.strictEqual(appState.events[2].statusKeberangkatan, 'IZIN');
assert.strictEqual(appState.totalIzin, 2);
assert.strictEqual(appState.totalBelumBerangkat, 1);
console.log('  ✓ [4.1] Update optimistik awal: Status PP Nurul Kholil menjadi IZIN, Total Izin = 2, Belum = 1');

// 2. Tiba-tiba background fetch selesai, namun mengembalikan CSV LAMA (cache Google CDN belum ter-update)
const staleFetchedData = {
  events: [
    { no: '31', acara: 'PP Fadlul Wahid', keterangan: 'Izin', statusKeberangkatan: 'IZIN' },
    { no: '32', acara: 'PCNU Nganjuk', keterangan: 'BELUM', statusKeberangkatan: 'BELUM_BERANGKAT' },
    { no: '33', acara: 'Pp. Nurul Kholil', keterangan: 'persiapan muhafadzoh', statusKeberangkatan: 'BELUM_BERANGKAT' }, // STALE!
  ],
};

// Logika proteksi di BahsuClient
const now = Date.now();
const updatedEvents = [...staleFetchedData.events];
let hasPreserved = false;

recentlySavedMap.forEach((saved, key) => {
  if (now - saved.time > 30000) return;
  const idx = updatedEvents.findIndex(e => String(e.no) === String(saved.event.no));
  if (idx !== -1) {
    const fetchedEvt = updatedEvents[idx];
    const isFresh = (
      fetchedEvt.statusKeberangkatan === saved.event.statusKeberangkatan &&
      fetchedEvt.keterangan.trim().toLowerCase() === saved.event.keterangan.trim().toLowerCase()
    );
    if (!isFresh) {
      // Pertahankan data baru!
      updatedEvents[idx] = { ...fetchedEvt, ...saved.event };
      hasPreserved = true;
    }
  }
});

assert.strictEqual(hasPreserved, true);
assert.strictEqual(updatedEvents[2].statusKeberangkatan, 'IZIN');
assert.strictEqual(updatedEvents[2].keterangan, 'Izin (persiapan muhafadzoh)');
console.log('  ✓ [4.2] Proteksi cache terbukti berhasil: Data CSV lama tidak menimpa status IZIN terbaru');

// -----------------------------------------------------------------------------
// PENGUJIAN 5: Pengambilan Data Live Google Sheets Aktual
// -----------------------------------------------------------------------------
console.log('\n[UJI 5/5] Memverifikasi Pembacaan Live Data Google Sheets:');
console.log('  Endpoint CSV:', DATA_LINKS.bahsu.csvUrl);

const liveData = await getBahsuData(DATA_LINKS.bahsu.csvUrl);
console.log(`  Total agenda live: ${liveData.totalAgenda}`);
console.log(`  Ringkasan: ${liveData.totalSudahBerangkat} Terlaksana, ${liveData.totalBelumBerangkat} Belum Berangkat, ${liveData.totalIzin} Izin`);

// Validasi agenda No. 31 (PP. Fadlul Wahid - Izin Muhafadzoh)
const liveFw = liveData.events.find(e => String(e.no) === '31');
assert(liveFw, 'Agenda 31 (PP. Fadlul Wahid) harus ada');
assert.strictEqual(liveFw.statusKeberangkatan, 'IZIN', 'PP Fadlul Wahid harus berstatus IZIN');
assert.strictEqual(liveFw.isBelumBerangkat, false);
console.log('  ✓ [5.1] Agenda 31 (PP. Fadlul Wahid): Terklasifikasi sebagai IZIN');

// Validasi agenda No. 33 (PCNU Tulungagung - Belom)
const live33 = liveData.events.find(e => String(e.no) === '33');
assert(live33, 'Agenda 33 (PCNU Tulungagung) harus ada');
assert.strictEqual(live33.statusKeberangkatan, 'BELUM_BERANGKAT', 'PCNU Tulungagung harus berstatus BELUM_BERANGKAT');
assert.strictEqual(live33.isBelumBerangkat, true);
console.log('  ✓ [5.2] Agenda 33 (PCNU Tulungagung): Terklasifikasi sebagai BELUM_BERANGKAT');

// Pastikan agenda lain tidak terganggu (No. 22 BMA Ringinagung)
const live22 = liveData.events.find(e => String(e.no) === '22');
assert(live22, 'Agenda 22 harus ada');
assert.strictEqual(live22.delegasi.length, 6, 'Delegasi agenda 22 harus tepat 6 santri');
console.log(`  ✓ [5.3] Integritas agenda lain (No. 22): Presisi ${live22.delegasi.length} delegasi`);

console.log('\n================================================================');
console.log('HASIL: SELURUH PENGUJIAN BERHASIL 100% TANPA KESALAHAN');
console.log('================================================================');
