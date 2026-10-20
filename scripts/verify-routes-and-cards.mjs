import assert from 'node:assert';
import http from 'node:http';

console.log('================================================================');
console.log('VERIFIKASI SISTEM: PENGUJIAN ROUTE, KARTU, DAN KEAMANAN API');
console.log('================================================================\n');

async function fetchRoute(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      `http://localhost:3000${path}`,
      {
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          resolve({ status: res.statusCode, headers: res.headers, body });
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

// -----------------------------------------------------------------------------
// PENGUJIAN 1: Ketersediaan Rute & Komponen Kartu di Server Lokal
// -----------------------------------------------------------------------------
console.log('[TEST 1] Menguji Seluruh Halaman Utama & Elemen Visual Kartu:');

const routes = [
  { path: '/', name: 'Portal Utama (Beranda)', expectedSnippets: ['WAKA I', 'WAKA II', 'WAKA III', 'Istiwa'] },
  { path: '/waka-iii', name: 'Dashboard WAKA III', expectedSnippets: ['Total Anggota LBM', 'Forum Bahtsul Masail', 'Delegasi Selesai', 'Delegasi Mendatang'] },
  { path: '/bahsu', name: 'Pemberangkatan & Delegasi Bahsu', expectedSnippets: ['Total Forum Bahsu', 'Belum Berangkat', 'Sudah Berangkat'] },
  { path: '/anggota', name: 'Database Santri LBM', expectedSnippets: ['Anggota', 'Santri'] },
  { path: '/waka-i', name: 'WAKA I (Santri & Takziran)', expectedSnippets: ['Data Santri dan Takziran', 'MMD'] },
  { path: '/waka-ii', name: 'WAKA II (Akademik & Kesiswaan)', expectedSnippets: ['Pemantauan Akademik', 'WAKA II'] },
  { path: '/keuangan', name: 'Laporan Keuangan', expectedSnippets: ['RAB', 'LPJ', 'Saldo'] },
  { path: '/kalender-mmd', name: 'Kalender MMD', expectedSnippets: ['Kalender', 'MMD'] },
];

for (const r of routes) {
  try {
    const res = await fetchRoute(r.path);
    assert.strictEqual(res.status, 200, `Rute ${r.path} harus merespons HTTP 200`);
    for (const snip of r.expectedSnippets) {
      assert(res.body.includes(snip), `Rute ${r.path} harus memuat konten "${snip}"`);
    }
    console.log(`  ✓ [Route] ${r.name} (${r.path}) -> HTTP 200 (Konten Terverifikasi)`);
  } catch (err) {
    console.error(`  ✗ [Route] Gagal pada ${r.path}:`, err.message);
    process.exit(1);
  }
}

// -----------------------------------------------------------------------------
// PENGUJIAN 2: Keamanan Endpoint API Google Sheets (/api/sheets)
// -----------------------------------------------------------------------------
console.log('\n[TEST 2] Menguji Keamanan & Kontrak API /api/sheets:');

// 2.1 Akses Diagnostik tanpa izin Admin harus ditolak 403
const diagAnon = await fetchRoute('/api/sheets?action=diagnose');
assert.strictEqual(diagAnon.status, 403, 'Akses diagnostik anonim harus ditolak 403');
console.log('  ✓ [Security] Diagnostik anonim ditolak dengan status 403 Forbidden');

// 2.2 POST tanpa otorisasi harus ditolak 403
const postAnon = await fetchRoute('/api/sheets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'syncBahsuEvent' }),
});
assert.strictEqual(postAnon.status, 403, 'POST anonim harus ditolak 403');
console.log('  ✓ [Security] POST anonim ke /api/sheets ditolak dengan status 403 Forbidden');

// 2.3 POST dengan otorisasi admin tetapi mencoba mengubah biodata santri harus ditolak 403
const postBiodata = await fetchRoute('/api/sheets', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-auth': 'true',
  },
  body: JSON.stringify({ action: 'updateSantri', id: '123' }),
});
assert.strictEqual(postBiodata.status, 403, 'Pembaruan biodata harus ditolak 403');
const biodataResJson = JSON.parse(postBiodata.body);
assert(biodataResJson.error.includes('dinonaktifkan') || biodataResJson.error.includes('read-only'), 'Pesan error harus menyatakan fitur biodata read-only');
console.log('  ✓ [Security] Upaya edit biodata santri ditolak (Kebijakan Read-Only PERKEMBANGAN)');

// 2.4 POST syncBahsuEvent tanpa nama acara harus ditolak 400 (Bad Request)
const postEmptyEvent = await fetchRoute('/api/sheets', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-auth': 'true',
  },
  body: JSON.stringify({
    action: 'syncBahsuEvent',
    event: { newAcara: '', newTanggal: '' },
  }),
});
assert.strictEqual(postEmptyEvent.status, 400, 'Event kosong harus ditolak 400');
console.log('  ✓ [Validation] Payload event tanpa nama agenda ditolak dengan status 400 Bad Request');

// 2.5 GET proxy CSV Google Sheets domain whitelist
const getInvalidDomain = await fetchRoute('/api/sheets?url=https://malicious-site.com/data.csv');
assert.strictEqual(getInvalidDomain.status, 400, 'Domain non-Google harus ditolak 400');
console.log('  ✓ [Security] Domain proxy dibatasi ketat hanya untuk docs.google.com');

console.log('\n================================================================');
console.log('HASIL: SELURUH PENGUJIAN ROUTE, KARTU, DAN KEAMANAN SELESAI (100% PASS)');
console.log('================================================================\n');
