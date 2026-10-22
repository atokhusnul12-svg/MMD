import assert from 'node:assert';
import http from 'node:http';
import { DATA_LINKS } from '../lib/dataLinks.js';
import { fetchDetailSheetData } from '../lib/fetchCSV.js';

console.log('================================================================');
console.log('VERIFIKASI FITUR: LIHAT RINCIAN KEUANGAN (DATA ASLI SISTEM)');
console.log('================================================================\n');

async function fetchRoute(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}

async function runTests() {
  // Test 1: Route /keuangan response and HTML snippets
  console.log('[TEST 1] Memeriksa Halaman /keuangan & Tombol "Lihat Rincian":');
  const res = await fetchRoute('/keuangan');
  assert.strictEqual(res.status, 200, 'Halaman /keuangan harus merespons HTTP 200');
  console.log('  ✓ Halaman /keuangan aktif (HTTP 200)');

  assert(res.body.includes('Lihat Rincian'), 'Halaman harus memuat tombol "Lihat Rincian"');
  const rincianCount = (res.body.match(/Lihat Rincian/g) || []).length;
  console.log(`  ✓ Ditemukan ${rincianCount} kemunculan tombol "Lihat Rincian" pada halaman (di header aktif & tabel)`);

  assert(res.body.includes('Rekapitulasi Anggaran Bulanan'), 'Halaman harus memuat tabel Rekapitulasi Anggaran Bulanan');
  console.log('  ✓ Tabel "Rekapitulasi Anggaran Bulanan" terverifikasi');

  // Test 2: Verify detail sheet parsing against real Google Sheets URLs
  console.log('\n[TEST 2] Memeriksa Parser Data Asli Sheet Rincian Google Sheets:');
  const detailSheets = DATA_LINKS.keuangan.detailSheets;
  assert(detailSheets.length >= 7, 'Minimal ada 7 sheet rincian keuangan terdaftar');

  for (const sheet of detailSheets) {
    const data = await fetchDetailSheetData(sheet.csvUrl);
    assert(data.title, `Sheet ${sheet.name} harus memiliki title`);
    assert(data.sections.length > 0, `Sheet ${sheet.name} harus memiliki minimal 1 section`);
    const totalItems = data.sections.reduce((acc, s) => acc + s.items.length, 0);
    assert(totalItems > 0, `Sheet ${sheet.name} harus memiliki data item`);

    console.log(`  ✓ Sheet [${sheet.name}] -> Dokumen: "${data.title.slice(0, 40)}..." | ${data.sections.length} Kategori/Section | ${totalItems} Item Riil`);
  }

  // Test 3: Verify API Proxy /api/sheets
  console.log('\n[TEST 3] Memeriksa API Proxy /api/sheets untuk Sheet Rincian:');
  const sampleUrl = encodeURIComponent(detailSheets[0].csvUrl);
  const proxyRes = await fetchRoute(`/api/sheets?url=${sampleUrl}`);
  assert.strictEqual(proxyRes.status, 200, 'Proxy /api/sheets harus merespons HTTP 200');
  assert(proxyRes.body.length > 100, 'Respons proxy harus berisi konten CSV');
  console.log('  ✓ API Proxy /api/sheets berfungsi dengan baik untuk melayani CSV detail');

  console.log('\n================================================================');
  console.log('SELURUH PENGUJIAN FITUR LIHAT RINCIAN BERHASIL (100% PASS)');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('Pengujian gagal:', err);
  process.exit(1);
});
