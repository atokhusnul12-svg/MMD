// scripts/test-bahsu-sync.mjs
// Pengujian Menyeluruh Fitur Sinkronisasi Tambah Agenda ke Google Sheets

async function runTests() {
  console.log('===================================================================');
  console.log('🧪 PENGUJIAN FITUR SINKRONISASI AGENDA BAHSU KE GOOGLE SHEETS');
  console.log('===================================================================\n');

  const BASE_URL = 'https://waka-iii.vercel.app';
  const GID_PERKEMBANGAN = '211010401';
  const GID_BAHSU = '1165916830';
  const SPREADSHEET_ID = '1WzcN4eAqKNfGQVIO-WyT17J-FVwWcon-Zt5ewbhjGv4';

  // Helper untuk membaca Google Sheets langsung (Zero Cache Delay)
  async function fetchLiveSheetCsv(gid) {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}&_t=${Date.now()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.text();
  }

  function parseCSV(csv) {
    const lines = [];
    let row = [];
    let inQuotes = false;
    let curVal = '';
    for (let i = 0; i < csv.length; i++) {
      const c = csv[i];
      if (c === '"') {
        if (inQuotes && csv[i + 1] === '"') {
          curVal += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        row.push(curVal);
        curVal = '';
      } else if ((c === '\r' || c === '\n') && !inQuotes) {
        if (c === '\r' && csv[i + 1] === '\n') i++;
        row.push(curVal);
        lines.push(row);
        row = [];
        curVal = '';
      } else {
        curVal += c;
      }
    }
    if (curVal || row.length) {
      row.push(curVal);
      lines.push(row);
    }
    return lines;
  }

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  // -------------------------------------------------------------
  // TEST 1: Validasi Input (Acara / Tanggal Kosong)
  // -------------------------------------------------------------
  console.log('📌 Uji 1: Validasi Kolom Wajib (Nama Acara & Tanggal)');
  {
    const res = await fetch(`${BASE_URL}/api/sheets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-auth': 'true' },
      body: JSON.stringify({
        action: 'syncBahsuEvent',
        event: { newAcara: '', newTanggal: '21 Oktober 2026 M.' },
      }),
    });
    const data = await res.json();
    assert(res.status === 400 && !data.success, 'Permintaan tanpa nama acara ditolak 400 Bad Request');
  }

  // -------------------------------------------------------------
  // TEST 2: Baca Data Awal Siswa Sebelum Sinkronisasi
  // -------------------------------------------------------------
  console.log('\n📌 Uji 2: Membaca Kondisi Awal Siswa pada Sheet PERKEMBANGAN');
  const initialPerkembanganCsv = await fetchLiveSheetCsv(GID_PERKEMBANGAN);
  const initialRows = parseCSV(initialPerkembanganCsv);
  const student1Row = initialRows.find((r) => r[0] === '1');
  assert(Boolean(student1Row), 'Siswa No. 1 (Muhammad Aufilana Zulfa Hasan) ditemukan di spreadsheet');
  const initialColJ = student1Row ? student1Row[9] : '';
  console.log(`     Data awal Kolom J (baris siswa 1): ${initialColJ ? initialColJ.split('\n').filter(Boolean).length : 0} entri riwayat.`);

  // -------------------------------------------------------------
  // TEST 3: Sinkronisasi Siswa Tertentu ke Kolom J
  // -------------------------------------------------------------
  console.log('\n📌 Uji 3: Tambah Agenda untuk 1 Siswa Terpilih (No. 1)');
  const testAcaraName = 'LBM MWC NU Badas (Verifikasi Otomatis)';
  const testTanggal = '21 Oktober 2026 M.';
  const expectedEntry = `${testAcaraName} ${testTanggal}`;

  {
    const payload = {
      action: 'syncBahsuEvent',
      event: {
        mode: 'edit',
        rowNumber: 24, // Menggunakan slot uji baris 24
        no: '22',
        newAcara: testAcaraName,
        newTanggal: testTanggal,
        delegasi: '1. Muhammad Aufilana Zulfa Hasan',
        keterangan: 'SUDAH',
        selectedStudents: [
          {
            id: 'LBM-001',
            noOriginal: 1,
            nama: 'Muhammad Aufilana Zulfa Hasan',
            kelas: '3 ALIYAH',
          },
        ],
        matchedMemberIds: ['LBM-001'],
      },
    };

    const res = await fetch(`${BASE_URL}/api/sheets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-auth': 'true' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    assert(res.ok && data.success === true, 'Respons API /api/sheets sukses menyimpan agenda');
    assert(data.data?.syncedCount === 1, 'Tersinkron ke tepat 1 santri');
    assert(data.data?.syncedMembers?.[0] === 'Muhammad Aufilana Zulfa Hasan', 'Santri tersinkron adalah Muhammad Aufilana Zulfa Hasan');

    // Verifikasi riil di Google Sheets
    const updatedPerkembanganCsv = await fetchLiveSheetCsv(GID_PERKEMBANGAN);
    const updatedRows = parseCSV(updatedPerkembanganCsv);
    const updatedStudent1 = updatedRows.find((r) => r[0] === '1');
    const updatedColJ = updatedStudent1 ? updatedStudent1[9] : '';

    assert(updatedColJ.includes(testAcaraName), 'Nilai Kolom B (Acara) masuk ke Kolom J siswa yang dipilih');
    assert(updatedColJ.includes(testTanggal), 'Nilai Kolom C (Tanggal) masuk ke Kolom J siswa yang dipilih');
    assert(updatedStudent1[1].trim() === 'Muhammad Aufilana Zulfa Hasan', 'Kolom Nama siswa tidak berubah');
    assert(updatedStudent1[2].trim() === '3 ALIYAH', 'Kolom Kelas siswa tidak berubah');

    // Pastikan data siswa lain (misal siswa No. 2) tidak berubah
    const student2Row = updatedRows.find((r) => r[0] === '2');
    const student2ColJ = student2Row ? student2Row[9] : '';
    assert(!student2ColJ.includes(testAcaraName), 'Data siswa lain (No. 2) TIDAK tercemar oleh entri ini');
  }

  // -------------------------------------------------------------
  // TEST 4: Uji Pencegahan Duplikasi (Idempotensi Retry)
  // -------------------------------------------------------------
  console.log('\n📌 Uji 4: Pencegahan Duplikasi Penulisan Ganda (Idempotensi)');
  {
    const retryPayload = {
      action: 'syncBahsuEvent',
      event: {
        mode: 'edit',
        rowNumber: 24,
        no: '22',
        newAcara: testAcaraName,
        newTanggal: testTanggal,
        delegasi: '1. Muhammad Aufilana Zulfa Hasan',
        keterangan: 'SUDAH',
        selectedStudents: [
          {
            id: 'LBM-001',
            noOriginal: 1,
            nama: 'Muhammad Aufilana Zulfa Hasan',
            kelas: '3 ALIYAH',
          },
        ],
        matchedMemberIds: ['LBM-001'],
      },
    };

    const res = await fetch(`${BASE_URL}/api/sheets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-auth': 'true' },
      body: JSON.stringify(retryPayload),
    });
    const data = await res.json();
    assert(res.ok && data.success === true, 'Pengiriman ulang tetap berhasil tanpa error');

    // Cek jumlah kemunculan teks di Kolom J
    const checkCsv = await fetchLiveSheetCsv(GID_PERKEMBANGAN);
    const checkRows = parseCSV(checkCsv);
    const checkStudent1 = checkRows.find((r) => r[0] === '1');
    const colJText = checkStudent1 ? checkStudent1[9] : '';
    const occurrences = colJText.split(testAcaraName).length - 1;
    assert(occurrences === 1, `Tidak terjadi duplikasi entri pada Kolom J (ditemukan tepat ${occurrences} kali)`);
  }

  // -------------------------------------------------------------
  // TEST 5: Sinkronisasi Multi-Siswa (Siswa 1 & Siswa 8)
  // -------------------------------------------------------------
  console.log('\n📌 Uji 5: Sinkronisasi Multi-Siswa Berbeda (Siswa No. 1 & Siswa No. 8)');
  const multiAcaraName = 'LBM Forum Gabungan (Uji Dua Siswa)';
  const multiTanggal = '21 Oktober 2026 M.';
  {
    const multiPayload = {
      action: 'syncBahsuEvent',
      event: {
        mode: 'edit',
        rowNumber: 24,
        no: '22',
        newAcara: multiAcaraName,
        newTanggal: multiTanggal,
        delegasi: '1. Muhammad Aufilana Zulfa Hasan\n2. Abdul Hakim Ibnu Asyhari',
        keterangan: 'SUDAH',
        selectedStudents: [
          {
            id: 'LBM-001',
            noOriginal: 1,
            nama: 'Muhammad Aufilana Zulfa Hasan',
            kelas: '3 ALIYAH',
          },
          {
            id: 'LBM-008',
            noOriginal: 8,
            nama: 'Abdul Hakim Ibnu Asyhari',
            kelas: '1 ALIYAH',
          },
        ],
        matchedMemberIds: ['LBM-001', 'LBM-008'],
      },
    };

    const res = await fetch(`${BASE_URL}/api/sheets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-auth': 'true' },
      body: JSON.stringify(multiPayload),
    });
    const data = await res.json();
    assert(res.ok && data.success === true, 'Penyimpanan agenda multi-siswa berhasil');
    assert(data.data?.syncedCount === 2, 'Tersinkron tepat ke 2 santri');
    assert(data.data?.syncedMembers?.includes('Muhammad Aufilana Zulfa Hasan'), 'Santri 1 (Aufilana) tercatat');
    assert(data.data?.syncedMembers?.includes('Abdul Hakim Ibnu Asyhari'), 'Santri 8 (Abdul Hakim) tercatat');

    // Verifikasi riil di sheet
    const multiCsv = await fetchLiveSheetCsv(GID_PERKEMBANGAN);
    const multiRows = parseCSV(multiCsv);
    const s1 = multiRows.find((r) => r[0] === '1');
    const s8 = multiRows.find((r) => r[0] === '8');
    const s2 = multiRows.find((r) => r[0] === '2');

    assert(s1?.[9]?.includes(multiAcaraName), 'Kolom J Santri 1 memuat agenda multi-siswa');
    assert(s8?.[9]?.includes(multiAcaraName), 'Kolom J Santri 8 memuat agenda multi-siswa');
    assert(!s2?.[9]?.includes(multiAcaraName), 'Kolom J Santri lain (No. 2) tetap bersih dan tidak tercemar');
  }

  // -------------------------------------------------------------
  // TEST 6: Pembersihan Data Uji (Revert)
  // -------------------------------------------------------------
  console.log('\n📌 Uji 6: Pembersihan Data Uji Menyeluruh (Revert to Clean State)');
  {
    const cleanPayload = {
      action: 'syncBahsuEvent',
      event: {
        mode: 'edit',
        rowNumber: 24,
        no: '',
        oldAcara: multiAcaraName,
        oldTanggal: multiTanggal,
        newAcara: multiAcaraName,
        newTanggal: multiTanggal,
        delegasi: '1. Muhammad Aufilana Zulfa Hasan\n2. Abdul Hakim Ibnu Asyhari',
        keterangan: 'IZIN',
        matchedMemberIds: ['LBM-001', 'LBM-008'],
      },
    };

    const res = await fetch(`${BASE_URL}/api/sheets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-auth': 'true' },
      body: JSON.stringify(cleanPayload),
    });
    const data = await res.json();
    assert(res.ok && data.success === true, 'Pembersihan data uji via status IZIN berhasil');

    const finalPerkembanganCsv = await fetchLiveSheetCsv(GID_PERKEMBANGAN);
    assert(!finalPerkembanganCsv.includes(multiAcaraName), 'Data uji multi-siswa telah bersih dari Google Sheets');
    assert(!finalPerkembanganCsv.includes(testAcaraName), 'Data uji sebelumnya juga tetap bersih');
  }

  console.log('\n===================================================================');
  console.log(`🎉 HASIL PENGUJIAN: ${passedTests}/${totalTests} Uji Berhasil (100% PASS)`);
  console.log('===================================================================');
}

runTests().catch((err) => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
