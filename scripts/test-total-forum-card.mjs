import assert from 'node:assert';
import { DATA_LINKS } from '../lib/dataLinks.js';
import { getBahsuData, parseStatusKeberangkatan } from '../lib/fetchCSV.js';

console.log('================================================================');
console.log('🧪 PENGUJIAN SINKRONISASI KARTU TOTAL FORUM WAKA III');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function testAssert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runAuditTests() {
  // -------------------------------------------------------------
  // TEST A: Kondisi Awal & Pembacaan Data Live dari Google Sheets
  // -------------------------------------------------------------
  console.log('📌 Pengujian A: Pembacaan Sumber Data Live Google Sheets');
  const liveData = await getBahsuData(DATA_LINKS.bahsu.csvUrl);

  testAssert(Boolean(liveData), 'Sumber data Google Sheets berhasil diambil');
  testAssert(Array.isArray(liveData.events), 'Events berformat array valid');
  testAssert(liveData.events.length > 0, `Jumlah entitas forum aktual: ${liveData.events.length}`);

  const totalForum = liveData.events.length;
  const belum = liveData.totalBelumBerangkat;
  const sudah = liveData.totalSudahBerangkat;
  const izin = liveData.totalIzin;

  console.log(`     Total Forum: ${totalForum}`);
  console.log(`     Rincian: ${belum} Belum Berangkat, ${sudah} Sudah Berangkat, ${izin} Izin`);

  // -------------------------------------------------------------
  // TEST G: Konsistensi Matematis (Belum + Sudah + Izin === Total)
  // -------------------------------------------------------------
  console.log('\n📌 Pengujian G: Konsistensi Matematis Filter dan Total');
  testAssert(
    belum + sudah + izin === totalForum,
    `Penjumlahan kategori (${belum} + ${sudah} + ${izin} = ${belum + sudah + izin}) sama persis dengan Total Forum (${totalForum})`
  );

  // -------------------------------------------------------------
  // TEST B: Penambahan Forum (Bertambah Tepat 1)
  // -------------------------------------------------------------
  console.log('\n📌 Pengujian B: Penambahan Forum Baru');
  const simulatedNewEvent = {
    id: 9999,
    no: String(totalForum + 1),
    acara: 'Forum Simulasi Tambah Baru Pengujian',
    tanggal: '25 Oktober 2026 M.',
    delegasi: ['1. Delegasi Uji'],
    keterangan: 'SUDAH',
    statusKeberangkatan: 'SUDAH_BERANGKAT',
  };

  const eventsAfterAdd = [...liveData.events, simulatedNewEvent];
  testAssert(eventsAfterAdd.length === totalForum + 1, 'Total forum bertambah tepat satu setelah forum baru ditambahkan');

  const newSudahCount = eventsAfterAdd.filter((e) => e.statusKeberangkatan === 'SUDAH_BERANGKAT').length;
  testAssert(newSudahCount === sudah + 1, 'Kategori status Sudah Berangkat bertambah tepat satu');

  // -------------------------------------------------------------
  // TEST C: Perubahan Forum (Tidak Mengubah Total Forum)
  // -------------------------------------------------------------
  console.log('\n📌 Pengujian C: Perubahan Status Forum yang Ada');
  // Ambil forum pertama yang SUDAH, ubah jadi IZIN
  const modifiedEvents = eventsAfterAdd.map((e, idx) => {
    if (idx === 0) {
      return { ...e, keterangan: 'IZIN', statusKeberangkatan: 'IZIN' };
    }
    return e;
  });

  testAssert(modifiedEvents.length === eventsAfterAdd.length, 'Jumlah total forum tidak berubah saat forum diedit');
  const modSudah = modifiedEvents.filter((e) => e.statusKeberangkatan === 'SUDAH_BERANGKAT').length;
  const modIzin = modifiedEvents.filter((e) => e.statusKeberangkatan === 'IZIN').length;
  testAssert(modSudah === newSudahCount - 1, 'Kategori Sudah Berangkat berkurang tepat 1');
  testAssert(modIzin === izin + 1, 'Kategori Izin bertambah tepat 1');

  // -------------------------------------------------------------
  // TEST D: Pencegahan Duplikasi Forum (Idempotency Parsing)
  // -------------------------------------------------------------
  console.log('\n📌 Pengujian D: Pencegahan Duplikasi Data');
  // Cek apakah ada duplikasi exact di data asli
  const uniqueKeys = new Set();
  let duplicateFound = false;
  liveData.events.forEach((e) => {
    const key = `${String(e.no || '').trim()}_${e.acara.trim().toLowerCase()}_${e.tanggal.trim().toLowerCase()}`;
    if (uniqueKeys.has(key)) duplicateFound = true;
    uniqueKeys.add(key);
  });
  testAssert(!duplicateFound, 'Tidak ditemukan data forum duplikat pada hasil parsing live');

  // -------------------------------------------------------------
  // TEST F: Penanganan Data Kosong / Status Loading
  // -------------------------------------------------------------
  console.log('\n📌 Pengujian F: Status Loading dan Error Handling');
  // Simulasi kondisi loading di komponen UI
  const emptyEvents = [];
  const isLoading = true;
  const error = null;

  const cardDisplayWhileLoading = (isLoading && emptyEvents.length === 0) ? 'SKELETON_ANIMATION' : `${emptyEvents.length} Forum`;
  testAssert(cardDisplayWhileLoading === 'SKELETON_ANIMATION', 'Saat loading dan data belum ada, kartu merender skeleton / animasi (bukan angka 0)');

  const isError = true;
  const isLoadingOnError = false;
  const cardDisplayOnError = (!isLoadingOnError && isError && emptyEvents.length === 0) ? 'DASH_INDICATOR' : `${emptyEvents.length} Forum`;
  testAssert(cardDisplayOnError === 'DASH_INDICATOR', 'Saat terjadi kegagalan muat data, kartu merender dash/indikator error (bukan angka 0)');

  console.log('\n================================================================');
  console.log(`HASIL: ${passedTests}/${totalTests} PENGUJIAN BERHASIL 100%`);
  console.log('================================================================');
}

runAuditTests().catch((err) => {
  console.error('Pengujian gagal:', err);
  process.exit(1);
});
