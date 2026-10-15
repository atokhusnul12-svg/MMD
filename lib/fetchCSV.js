import Papa from 'papaparse';
import kalenderFallbackData from './kalenderDataFallback.js';

/**
 * Mengambil dan mem-parse teks mentah dari link CSV Google Sheets.
 * Dilengkapi fitur anti-cache agar data selalu up-to-date saat direfresh.
 */
export async function fetchRawCSV(url) {
  let lastError = null;

  // 1. Jika di browser, coba panggil internal API proxy (/api/sheets) terlebih dahulu
  //    Ini menjamin 100% bebas dari kendala CORS, preflight OPTIONS, dan redirect Google di Vercel
  if (typeof window !== 'undefined') {
    try {
      const proxyUrl = `/api/sheets?url=${encodeURIComponent(url)}&_t=${Date.now()}`;
      const proxyRes = await fetch(proxyUrl, {
        cache: 'no-store',
      });

      if (proxyRes.ok) {
        const text = await proxyRes.text();
        if (text && text.trim().length > 0 && !text.trim().startsWith('{"error"')) {
          return text;
        }
      }
    } catch (proxyErr) {
      console.warn('API proxy fetch gagal, mencoba fetch langsung ke Google Sheets:', proxyErr);
      lastError = proxyErr;
    }
  }

  // 2. Fetch langsung ke Google Sheets (digunakan di server-side SSR / SSG atau sebagai fallback browser)
  try {
    const separator = url.includes('?') ? '&' : '?';
    const targetUrl = `${url}${separator}_t=${Date.now()}`;

    // PENTING: Jangan kirim custom headers (seperti Pragma/Cache-Control) di browser
    // agar browser TIDAK memicu permintaan CORS preflight OPTIONS yang ditolak Google Sheets
    const response = await fetch(targetUrl, {
      cache: 'no-store',
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`Google Sheets mengembalikan HTTP ${response.status} (${response.statusText || 'Error'})`);
    }

    const text = await response.text();
    if (!text || text.trim().length === 0) {
      throw new Error('Data CSV dari Google Sheets kosong');
    }
    return text;
  } catch (error) {
    console.error('Error fetchRawCSV direct:', error);
    const msg = lastError
      ? `Gagal memuat CSV: ${error.message} (Proxy: ${lastError.message})`
      : `Gagal memuat CSV dari Google Sheets: ${error.message}`;
    throw new Error(msg);
  }
}

/**
 * Membersihkan format uang (misal: "Rp 20,166,500" atau "21752000") menjadi angka murni
 */
export function parseCurrencyToNumber(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[^0-9.-]+/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format angka ke format Rupiah standar Indonesia
 */
export function formatRupiah(number) {
  if (number === null || number === undefined || isNaN(number)) return 'Rp 0';
  return 'Rp ' + Math.round(number).toLocaleString('id-ID');
}

/**
 * PARSER DATA ANGGOTA LBM
 */
export async function getAnggotaData(csvUrl) {
  const csvText = await fetchRawCSV(csvUrl);

  const parsed = Papa.parse(csvText, {
    header: false,
    skipEmptyLines: true,
  });

  const rows = parsed.data;
  const anggotaList = [];

  let headerRowIndex = -1;
  let colIndex = {
    no: 0,
    nama: 1,
    kelas: 2,
    perkembangan: 4,
    ttl: 5,
    alamat: 6,
    domisili: 7,
    ayahIbu: 8,
    bahtsu: 9,
  };

  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const rawRow = rows[i] || [];
    const normalized = rawRow.map((cell) => String(cell || '').trim().toUpperCase());
    const namaIdx = normalized.findIndex((c) => c === 'NAMA' || c.includes('NAMA'));
    if (namaIdx !== -1) {
      headerRowIndex = i;
      colIndex.nama = namaIdx;
      
      const noIdx = normalized.findIndex((c) => c === 'NO.' || c === 'NO' || c.includes('NO.'));
      if (noIdx !== -1) colIndex.no = noIdx;

      const kelasIdx = normalized.findIndex((c) => c.includes('KELAS'));
      if (kelasIdx !== -1) colIndex.kelas = kelasIdx;

      const perkIdx = normalized.findIndex((c) => c.includes('PERKEMBANGAN') || c.includes('STATUS'));
      if (perkIdx !== -1) colIndex.perkembangan = perkIdx;

      const ttlIdx = normalized.findIndex((c) => c.includes('TTL') || c.includes('LAHIR'));
      if (ttlIdx !== -1) colIndex.ttl = ttlIdx;

      const alamatIdx = normalized.findIndex((c) => c.includes('ALAMAT'));
      if (alamatIdx !== -1) colIndex.alamat = alamatIdx;

      const domIdx = normalized.findIndex((c) => c.includes('DOMISILI'));
      if (domIdx !== -1) colIndex.domisili = domIdx;

      const ayahIbuIdx = normalized.findIndex((c) => c.includes('AYAH') || c.includes('IBU') || c.includes('ORANG TUA'));
      if (ayahIbuIdx !== -1) colIndex.ayahIbu = ayahIbuIdx;

      const bahtsuIdx = normalized.findIndex((c) => c.includes('BAHTSU') || c.includes('BAHSU') || c.includes('DIDATANGI'));
      if (bahtsuIdx !== -1) colIndex.bahtsu = bahtsuIdx;

      break;
    }
  }

  const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 1;

  let currentNo = 1;
  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const rawNama = row[colIndex.nama !== -1 ? colIndex.nama : 1];
    const nama = rawNama ? String(rawNama).trim() : '';

    if (!nama || nama.toLowerCase() === 'nama' || nama.startsWith('---')) continue;

    const rawNo = colIndex.no !== -1 ? row[colIndex.no] : '';
    const no = rawNo && !isNaN(parseInt(rawNo)) ? parseInt(rawNo) : currentNo;

    const rawKelas = colIndex.kelas !== -1 ? row[colIndex.kelas] : '';
    const kelas = rawKelas && String(rawKelas).trim() ? String(rawKelas).trim() : '-';

    const rawPerkembangan = colIndex.perkembangan !== -1 ? row[colIndex.perkembangan] : '';
    const perkembangan = rawPerkembangan && String(rawPerkembangan).trim()
      ? String(rawPerkembangan).trim()
      : 'Belum Ada Status';

    const rawTtl = colIndex.ttl !== -1 ? row[colIndex.ttl] : '';
    const ttl = rawTtl && String(rawTtl).trim() ? String(rawTtl).trim() : '-';

    const rawAlamat = colIndex.alamat !== -1 ? row[colIndex.alamat] : '';
    const alamat = rawAlamat && String(rawAlamat).trim() ? String(rawAlamat).trim() : '-';

    const rawDomisili = colIndex.domisili !== -1 ? row[colIndex.domisili] : '';
    const domisili = rawDomisili && String(rawDomisili).trim() ? String(rawDomisili).trim() : '-';

    const rawAyahIbu = colIndex.ayahIbu !== -1 ? row[colIndex.ayahIbu] : '';
    const ayahIbu = rawAyahIbu && String(rawAyahIbu).trim() ? String(rawAyahIbu).trim() : '-';

    const rawBahtsu = colIndex.bahtsu !== -1 ? row[colIndex.bahtsu] : '';
    const bahtsuList = rawBahtsu
      ? String(rawBahtsu)
          .split(/\r?\n/)
          .map((s) => s.replace(/\t+/g, ' ').replace(/\s{2,}/g, ' ').trim())
          .filter(Boolean)
      : [];

    anggotaList.push({
      id: `anggota-${i}-${nama.replace(/\s+/g, '-').toLowerCase()}`,
      urutan: currentNo,
      noOriginal: no,
      nama,
      kelas,
      status: perkembangan,
      perkembangan,
      ttl,
      alamat,
      domisili,
      ayahIbu,
      bahtsuList,
    });

    currentNo++;
  }

  const statusCounts = {};
  anggotaList.forEach((a) => {
    const st = a.perkembangan;
    statusCounts[st] = (statusCounts[st] || 0) + 1;
  });

  return {
    anggota: anggotaList,
    total: anggotaList.length,
    statusCounts,
  };
}

/**
 * PARSER DATA PEMBERANGKATAN & DELEGASI BAHTSUL MASAIL (LBM)
 * Dilengkapi deteksi status mana yang BELUM BERANGKAT
 */
export async function getBahsuData(csvUrl) {
  const csvText = await fetchRawCSV(csvUrl);

  const parsed = Papa.parse(csvText, {
    header: false,
    skipEmptyLines: true,
  });

  const rows = parsed.data;
  let title = "JADWAL & DELEGASI BAHTSUL MASAIL (LBM) 2026";
  const events = [];

  let headerRowIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const firstCell = String(row[0] || '').trim().toUpperCase();
    if (firstCell.includes('JADWAL') || firstCell.includes('BAHTSUL MASAIL')) {
      title = String(row[0] || '').trim();
    }
    if (row.some(cell => String(cell || '').trim().toUpperCase() === 'BAHTSUL MASAIL')) {
      headerRowIndex = i;
      break;
    }
  }

  const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 1;
  let currentEvent = null;

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const rawNo = String(row[0] || '').trim();
    const rawAcara = String(row[1] || '').trim();
    const rawTanggal = String(row[2] || '').trim();
    const rawDelegasi = String(row[3] || '').trim();
    const rawKet = String(row[4] || '').trim();

    if (rawAcara || (rawNo && !isNaN(parseInt(rawNo)))) {
      if (currentEvent) {
        events.push(currentEvent);
      }

      const delegasiLines = rawDelegasi
        ? rawDelegasi.split('\n').map(s => s.trim()).filter(Boolean)
        : [];

      const rawKetUpper = rawKet.toUpperCase();
      let statusKeberangkatan = 'SUDAH_BERANGKAT';

      // Prioritas 1: Baca langsung isi kolom Keterangan yang diketik di Google Sheets
      // Khusus PP. Haji Ya'qub Lirboyo (7-8 Oktober 2026): sudah terlaksana di No. 19
      const isHajiYaqub = rawAcara.toLowerCase().includes("ya'qub") || rawAcara.toLowerCase().includes("ya’qub");

      if (isHajiYaqub) {
        statusKeberangkatan = 'SUDAH_BERANGKAT';
      } else if (rawKetUpper.includes('SUDAH') || rawKetUpper.includes('BERANGKAT') || rawKetUpper.includes('TERLAKSANA')) {
        statusKeberangkatan = 'SUDAH_BERANGKAT';
      } else if (rawKetUpper.includes('IZIN')) {
        statusKeberangkatan = 'IZIN';
      } else if (rawKetUpper.includes('BELOM') || rawKetUpper.includes('BELUM')) {
        statusKeberangkatan = 'BELUM_BERANGKAT';
      } else {
        // Fallback otomatis jika kolom Keterangan di spreadsheet masih kosong
        const noInt = parseInt(rawNo);
        const tanggalLower = rawTanggal.toLowerCase();
        const isBelum = (!isNaN(noInt) && noInt >= 20) ||
          tanggalLower.includes('november') ||
          rawTanggal === 'Menunggu Jadwal';
        statusKeberangkatan = isBelum ? 'BELUM_BERANGKAT' : 'SUDAH_BERANGKAT';
      }

      const isBelumBerangkat = (statusKeberangkatan === 'BELUM_BERANGKAT');

      currentEvent = {
        id: i,
        no: rawNo || String(events.length + 1),
        acara: rawAcara || `Forum Bahsul Masail #${events.length + 1}`,
        tanggal: rawTanggal || 'Menunggu Jadwal',
        delegasi: delegasiLines,
        keterangan: isHajiYaqub ? 'SUDAH' : (rawKet || (delegasiLines.length > 0 ? 'Delegasi' : 'Terjadwal')),
        isBelumBerangkat,
        statusKeberangkatan,
      };
    } else if (currentEvent) {
      if (rawDelegasi) {
        currentEvent.delegasi.push(rawDelegasi);
      }
      if (rawKet && !currentEvent.keterangan) {
        currentEvent.keterangan = rawKet;
      }
    }
  }

  if (currentEvent) {
    events.push(currentEvent);
  }

  const totalAgenda = events.length;
  const totalBelumBerangkat = events.filter(e => e.statusKeberangkatan === 'BELUM_BERANGKAT').length;
  const totalSudahBerangkat = events.filter(e => e.statusKeberangkatan === 'SUDAH_BERANGKAT').length;
  const totalIzin = events.filter(e => e.statusKeberangkatan === 'IZIN').length;

  return {
    title,
    events,
    totalAgenda,
    totalBelumBerangkat,
    totalSudahBerangkat,
    totalIzin,
  };
}

/**
 * PARSER KALENDER KERJA MMD
 */
export async function getKalenderData(csvUrl) {
  let csvText = '';
  try {
    csvText = await fetchRawCSV(csvUrl);
  } catch (err) {
    console.warn('Gagal memuat CSV kalender dari jaringan, memuat data lokal fallback:', err);
    return kalenderFallbackData;
  }

  const parsed = Papa.parse(csvText, {
    header: false,
    skipEmptyLines: false,
  });

  const rows = parsed.data || [];

  // Cek apakah CSV menggunakan format baru 5 kolom (Tanggal Lengkap, Waktu, Hari, Kegiatan, Kordinator)
  let headerIndex = -1;
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const row = rows[i] || [];
    const firstCell = String(row[0] || '').toLowerCase().trim();
    if (firstCell === 'tanggal lengkap' || row.some(c => String(c).toLowerCase().trim() === 'tanggal lengkap')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex !== -1) {
    const bulanMap = new Map();
    const allActivities = [];
    let lastDate = '';
    let lastHari = '';

    for (let i = headerIndex + 1; i < rows.length; i++) {
      const row = rows[i] || [];
      const cell0 = String(row[0] || '').trim();
      const cell1 = String(row[1] || '').trim();
      const cell2 = String(row[2] || '').trim();
      const cell3 = String(row[3] || '').trim();
      const cell4 = String(row[4] || '').trim();

      let tglLengkap = cell0 || lastDate;
      if (cell0) lastDate = cell0;

      let hari = cell2 || lastHari;
      if (cell2) lastHari = cell2;

      const waktu = cell1;
      const kegiatan = cell3;
      const kordinator = cell4 || 'MMD';

      // Abaikan baris tanpa kegiatan
      if (!kegiatan) continue;

      let tglM = '-';
      let tglH = '-';
      let bulanNama = 'Lainnya';

      const parts = tglLengkap.split('/');
      if (parts.length > 0) {
        const masehiPart = parts[0].trim();
        const mTokens = masehiPart.split(' ');
        tglM = mTokens[0] || '-';
      }
      if (parts.length > 1) {
        const hijriPart = parts[1].trim();
        const hTokens = hijriPart.split(' ');
        tglH = hTokens[0] || '-';
        const hijriMonth = hTokens.slice(1, -1).join(' ') || hTokens[1] || '';
        const hijriYear = hTokens[hTokens.length - 1] || '1447';
        bulanNama = `Bulan ${hijriMonth} ${hijriYear} H`;
      }

      const item = {
        id: `kegiatan-${i}-${allActivities.length}`,
        bulan: bulanNama,
        tanggalLengkap: tglLengkap,
        tglM,
        tglH,
        hari: hari || '-',
        waktu: waktu || '-',
        kegiatan,
        kordinator,
      };

      allActivities.push(item);

      if (!bulanMap.has(bulanNama)) {
        bulanMap.set(bulanNama, { nama: bulanNama, kegiatan: [] });
      }
      bulanMap.get(bulanNama).kegiatan.push(item);
    }

    const bulanList = Array.from(bulanMap.values());
    const kegiatanWaka3 = allActivities.filter(a => a.kordinator.toUpperCase().includes('WAKA III'));

    const kordinatorSet = new Set();
    allActivities.forEach(a => {
      if (a.kordinator && a.kordinator !== '-') kordinatorSet.add(a.kordinator.trim());
    });

    if (allActivities.length > 0) {
      return {
        bulanList,
        allActivities,
        totalKegiatan: allActivities.length,
        totalWaka3: kegiatanWaka3.length,
        kordinatorList: Array.from(kordinatorSet).sort(),
      };
    }
  }

  // Fallback ke parser 6 kolom klasik jika format lama
  const bulanList = [];
  let currentBulan = null;
  let currentTglM = '';
  let currentTglH = '';
  let currentHari = '';
  let currentWaktu = '';
  let allActivities = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    const cell0 = String(row[0] || '').trim();
    const cell1 = String(row[1] || '').trim();
    const cell2 = String(row[2] || '').trim();
    const cell3 = String(row[3] || '').trim();
    const cell4 = String(row[4] || '').trim();
    const cell5 = String(row[5] || '').trim();

    const fullRowText = row.join(' ').trim();
    if (fullRowText.toLowerCase().includes('bulan ')) {
      const namaBulan = fullRowText;
      currentBulan = {
        nama: namaBulan,
        kegiatan: [],
      };
      bulanList.push(currentBulan);
      currentTglM = '';
      currentTglH = '';
      currentHari = '';
      currentWaktu = '';
      continue;
    }

    if (cell0.toLowerCase() === 'tgl' || cell0.toLowerCase() === 'm' || cell2.toLowerCase() === 'waktu') {
      continue;
    }

    if (cell0 !== '' && !isNaN(parseInt(cell0))) {
      currentTglM = cell0;
    }
    if (cell1 !== '' && !isNaN(parseInt(cell1))) {
      currentTglH = cell1;
    }
    if (cell3 !== '') {
      currentHari = cell3;
    }
    if (cell2 !== '') {
      currentWaktu = cell2;
    }

    const kegiatan = cell4;
    const kordinator = cell5;

    if (kegiatan) {
      const item = {
        id: `${i}-${currentTglM}-${currentTglH}`,
        bulan: currentBulan ? currentBulan.nama : 'Lainnya',
        tanggalLengkap: `${currentHari}, ${currentTglM} M / ${currentTglH} H`,
        tglM: currentTglM || '-',
        tglH: currentTglH || '-',
        hari: currentHari || '-',
        waktu: cell2 || currentWaktu || '-',
        kegiatan: kegiatan,
        kordinator: kordinator || 'MMD',
      };

      if (currentBulan) {
        currentBulan.kegiatan.push(item);
      }
      allActivities.push(item);
    }
  }

  if (allActivities.length === 0) {
    return kalenderFallbackData;
  }

  const totalKegiatan = allActivities.length;
  const kegiatanWaka3 = allActivities.filter(a => a.kordinator.toUpperCase().includes('WAKA III'));
  const kordinatorSet = new Set();
  allActivities.forEach(a => {
    if (a.kordinator && a.kordinator !== '-') kordinatorSet.add(a.kordinator.trim());
  });

  return {
    bulanList,
    allActivities,
    totalKegiatan,
    totalWaka3: kegiatanWaka3.length,
    kordinatorList: Array.from(kordinatorSet).sort(),
  };
}

/**
 * PARSER DATA KEUANGAN (RAB & LPJ)
 * Termasuk menyertakan data R. AWWAL dan R. TSANI secara otomatis
 */
export async function getKeuanganData(csvUrl) {
  const csvText = await fetchRawCSV(csvUrl);

  const parsed = Papa.parse(csvText, {
    header: false,
    skipEmptyLines: false,
  });

  const rows = parsed.data;

  let title = "RINGKASAN RAB & LPJ MMD - MADRASAH ISLAMIYAH DARUSSALAMAH";
  let subtitle = "Pondok Pesantren Darussalam Sumbersari";
  const rekapitulasi = [];
  let totalData = null;
  const catatanBerikutnya = [];
  const strukturFile = [];

  let currentSection = 'HEADER';

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    const firstCell = String(row[0] || '').trim();

    if (firstCell.includes('RINGKASAN RAB & LPJ')) {
      title = firstCell;
      if (rows[i + 1] && rows[i + 1][0]) {
        subtitle = String(rows[i + 1][0]).trim();
      }
      continue;
    }

    if (firstCell.toUpperCase().includes('REKAPITULASI SUBSIDI')) {
      currentSection = 'REKAP';
      continue;
    }
    if (firstCell.toUpperCase().includes('CATATAN BULAN BERIKUTNYA')) {
      currentSection = 'CATATAN';
      continue;
    }
    if (firstCell.toUpperCase().includes('STRUKTUR FILE')) {
      currentSection = 'STRUKTUR';
      continue;
    }

    if (firstCell.toLowerCase() === 'bulan') {
      continue;
    }

    if (currentSection === 'REKAP') {
      if (!firstCell) continue;

      const bulan = firstCell;
      const rawSubsidi = row[1];
      const rawPengeluaran = row[2];
      const rawSaldo = row[3];
      const keterangan = row[4] ? String(row[4]).trim() : '';

      const item = {
        bulan,
        subsidi: parseCurrencyToNumber(rawSubsidi),
        pengeluaran: parseCurrencyToNumber(rawPengeluaran),
        saldo: parseCurrencyToNumber(rawSaldo),
        keterangan,
      };

      if (!bulan.toUpperCase().includes('TOTAL')) {
        rekapitulasi.push(item);
      }
    } else if (currentSection === 'CATATAN') {
      if (firstCell) {
        catatanBerikutnya.push(firstCell);
      }
    } else if (currentSection === 'STRUKTUR') {
      if (firstCell) {
        strukturFile.push(firstCell);
      }
    }
  }

  // Tambahkan R. Awwal dan R. Tsani ke daftar periode jika belum ada di tabel rekapitulasi
  const hasRAwwal = rekapitulasi.some(r => r.bulan.toLowerCase().includes('awwal'));
  if (!hasRAwwal) {
    // Data riil dari sheet RAwwal (Putra + Putri):
    // RAB: Rp 8.246.000 + Rp 6.202.000 = Rp 14.448.000
    // Realisasi: Rp 6.269.000 + Rp 6.139.000 = Rp 12.408.000
    // Saldo: Rp 1.977.000 + Rp 63.000 = Rp 2.040.000
    rekapitulasi.push({
      bulan: "Rabiul Awal (R. Awwal)",
      subsidi: 14448000,
      pengeluaran: 12408000,
      saldo: 2040000,
      keterangan: "Realisasi Putra & Putri",
    });
  }

  const hasRTsani = rekapitulasi.some(r => r.bulan.toLowerCase().includes('tsani'));
  if (!hasRTsani) {
    // Data riil dari sheet RTsani (Putra + Putri):
    // RAB: Rp 3.289.000 + Rp 2.368.000 = Rp 5.657.000
    // Realisasi: Rp 3.289.000 + Rp 2.331.000 = Rp 5.620.000
    // Saldo: Rp 0 + Rp 37.000 = Rp 37.000
    rekapitulasi.push({
      bulan: "Rabiul Tsani (R. Tsani)",
      subsidi: 5657000,
      pengeluaran: 5620000,
      saldo: 37000,
      keterangan: "Realisasi Putra & Putri",
    });
  }

  // Hitung ulang Grand TOTAL Akumulasi Keseluruhan Periode (Syawal, Dzulhijjah, Muharrom, R. Awwal, R. Tsani)
  const totalSubsidi = rekapitulasi.reduce((acc, curr) => acc + curr.subsidi, 0);
  const totalPengeluaran = rekapitulasi.reduce((acc, curr) => acc + curr.pengeluaran, 0);
  const totalSaldo = totalSubsidi - totalPengeluaran;

  totalData = {
    bulan: 'TOTAL',
    subsidi: totalSubsidi,
    pengeluaran: totalPengeluaran,
    saldo: totalSaldo,
    keterangan: `Akumulasi Seluruh ${rekapitulasi.length} Periode`,
  };

  return {
    title,
    subtitle,
    rekapitulasi,
    total: totalData,
    catatanBerikutnya,
    strukturFile,
  };
}

/**
 * PARSER DETAIL SHEET RAB / LPJ (Itemized)
 */
export async function fetchDetailSheetData(csvUrl) {
  const csvText = await fetchRawCSV(csvUrl);

  const parsed = Papa.parse(csvText, {
    header: false,
    skipEmptyLines: false,
  });

  const rows = parsed.data;
  let title = "RINCIAN ANGGARAN & BELANJA";
  let docNumber = "";
  const sections = [];
  let currentSection = null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    const cell0 = String(row[0] || '').trim();
    const cell1 = String(row[1] || '').trim();
    const cell2 = String(row[2] || '').trim();
    const cell3 = String(row[3] || '').trim();
    const cell4 = String(row[4] || '').trim();
    const cell5 = String(row[5] || '').trim();

    if (i < 3) {
      if (cell0.toUpperCase().includes('RAB') || cell0.toUpperCase().includes('LPJ')) {
        title = cell0;
        continue;
      }
      if (cell0.toLowerCase().includes('nomor:')) {
        docNumber = cell0;
        continue;
      }
    }

    const isSectionHeader =
      /^[A-Z]\.\s+/.test(cell0) ||
      cell0.toLowerCase().startsWith('rincian belanja') ||
      cell0.toLowerCase().startsWith('kegiatan mubahitsat') ||
      cell0.toLowerCase().startsWith('pembukaan mubahitsat');

    if (isSectionHeader) {
      currentSection = {
        title: cell0,
        items: [],
      };
      sections.push(currentSection);
      continue;
    }

    if (
      cell0.toLowerCase() === 'no' ||
      cell1.toLowerCase() === 'uraian' ||
      cell0.toLowerCase() === 'kategori' ||
      cell0.toLowerCase() === 'kode'
    ) {
      continue;
    }

    const fullRow = row.join(' ').toLowerCase();
    const isTotal = fullRow.includes('total') || fullRow.includes('subtotal') || fullRow.includes('saldo');

    const uraian = cell1 || (isTotal ? cell0 : '');
    if (uraian || (isTotal && (cell4 || cell5 || cell3 || cell2))) {
      const item = {
        no: cell0,
        uraian: cell1 || cell0,
        jumlah: cell2 || '-',
        hargaSatuan: cell3 || '-',
        anggaran: cell4 || cell3 || cell2 || '-',
        kenyataan: cell5 || cell4 || cell3 || '-',
        saldo: row[6] || '-',
        isTotal,
      };

      if (!currentSection) {
        currentSection = {
          title: 'Rincian',
          items: [],
        };
        sections.push(currentSection);
      }

      currentSection.items.push(item);
    }
  }

  return {
    title,
    docNumber,
    sections,
  };
}
