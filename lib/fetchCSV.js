import Papa from 'papaparse';

/**
 * Mengambil dan mem-parse teks mentah dari link CSV Google Sheets.
 * Dilengkapi fitur anti-cache agar data selalu up-to-date saat direfresh.
 */
export async function fetchRawCSV(url, options = {}) {
  let lastError = null;
  const normalizedUrl = String(url || '').replace(/\/2PACx-/g, '/2PACX-');

  // 1. Jika di browser, coba panggil internal API proxy (/api/sheets) terlebih dahulu
  //    Ini menjamin 100% bebas dari kendala CORS, preflight OPTIONS, dan redirect Google di Vercel
  if (typeof window !== 'undefined') {
    try {
      const proxyUrl = `/api/sheets?url=${encodeURIComponent(normalizedUrl)}&_t=${Date.now()}`;
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
    const isServer = typeof window === 'undefined';
    let targetUrl = normalizedUrl;
    const fetchConfig = {
      headers: {
        'User-Agent': 'WAKA3-Server/1.0',
        Accept: 'text/csv,text/plain,*/*',
      },
    };

    if (isServer && options.revalidate) {
      // ISR di server Next.js: gunakan revalidate bawaan tanpa query parameter dinamis agar cache terindeks stabil
      fetchConfig.next = { revalidate: options.revalidate };
    } else {
      const separator = url.includes('?') ? '&' : '?';
      targetUrl = `${url}${separator}_t=${Date.now()}`;
      fetchConfig.cache = 'no-store';
      if (!isServer) {
        fetchConfig.mode = 'cors';
      }
    }

    const response = await fetch(targetUrl, fetchConfig);

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

// Import & re-export utility formatters terpusat untuk fetchCSV dan seluruh pemanggil
import { formatRupiah, parseCurrencyToNumber } from './formatters.js';
export { formatRupiah, parseCurrencyToNumber };

/**
 * PARSER DATA ANGGOTA LBM
 */
export async function getAnggotaData(csvUrl, options = {}) {
  const csvText = await fetchRawCSV(csvUrl, options);

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
    id: -1,
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

      const idIdx = normalized.findIndex((c) => c === 'ID' || c === 'ID_ANGGOTA' || c === 'ID ANGGOTA');
      if (idIdx !== -1) colIndex.id = idIdx;
      else if (rawRow.length > 3 && !rawRow[3]) colIndex.id = 3; // Kolom D jika kosong

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

    const rawId = colIndex.id !== -1 ? row[colIndex.id] : '';
    const stableId = (rawId && String(rawId).trim())
      ? String(rawId).trim().toUpperCase()
      : `LBM-${String(no).padStart(3, '0')}`;

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
      id: stableId,
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
 * Membersihkan nama dari nomor urut, gelar, dan tanda baca untuk pencocokan akurat
 */
export function cleanMemberName(raw) {
  if (!raw) return '';
  return String(raw)
    .replace(/^(\d+[\.\)]|\-|\•)\s*/, '')
    .replace(/^(bpk\.|bapak|ust\.|ustadz|gus)\s+/i, '')
    .replace(/[''’`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Mencocokkan delegasi bahtsu dengan data profil anggota LBM
 */
export function findAnggotaByDelegasiName(delegasiLine, anggotaList = []) {
  if (!delegasiLine || !anggotaList || anggotaList.length === 0) return null;
  const target = cleanMemberName(delegasiLine);
  if (!target || target.startsWith('komisi') || target.startsWith('kom ') || target === '-' || target.includes('semua anggota')) {
    return null;
  }

  // 1. Cek exact match nama yang sudah dibersihkan
  for (const a of anggotaList) {
    const aClean = cleanMemberName(a.nama);
    if (aClean === target) return a;
  }

  // 2. Cek apakah satu nama mengandung nama lainnya (misal: "Muhammad Thohir" vs "Thohir")
  for (const a of anggotaList) {
    const aClean = cleanMemberName(a.nama);
    if (aClean.length > 5 && (aClean.includes(target) || target.includes(aClean))) {
      return a;
    }
  }

  return null;
}


/**
 * Memeriksa kesamaan urutan isi baris delegasi (case-insensitive & whitespace-trimmed)
 */
export function isSequenceEqual(arr1 = [], arr2 = []) {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((val, i) => String(val || '').trim().toLowerCase() === String(arr2[i] || '').trim().toLowerCase());
}

/**
 * Menggabungkan delegasi baris utama dengan baris lanjutan (continuation rows) secara cerdas.
 * Mencegah duplikasi data akibat sisa baris lama spreadsheet saat agenda diedit,
 * namun tetap menjaga keaslian peserta yang terdaftar sah di beberapa kelompok/baris.
 */
export function mergeDelegasiLines(headerLines = [], continuationLines = []) {
  if (!headerLines || headerLines.length === 0) {
    return continuationLines || [];
  }
  if (!continuationLines || continuationLines.length === 0) {
    return headerLines || [];
  }

  // Jika header hanya 1 baris (misal hanya berisi 'KOM A' atau nama delegasi pertama),
  // baris-baris lanjutan adalah kelanjutan sah delegasi agenda tersebut.
  if (headerLines.length === 1) {
    if (continuationLines.length > 0 && continuationLines[0].trim().toLowerCase() === headerLines[0].trim().toLowerCase()) {
      return continuationLines;
    }
    return [...headerLines, ...continuationLines];
  }

  // Jika header sudah memuat banyak baris (daftar delegasi lengkap tersimpan di satu sel):
  // 1. Cek apakah continuationLines identik seluruhnya dengan headerLines
  if (isSequenceEqual(headerLines, continuationLines)) {
    return headerLines;
  }

  // 2. Cek apakah continuationLines merupakan suffix dari headerLines
  // (misal header diawali nama kelompok seperti 'KOM A', lalu continuationLines berisi anggota-anggotanya)
  if (continuationLines.length <= headerLines.length) {
    const headerSuffix = headerLines.slice(headerLines.length - continuationLines.length);
    if (isSequenceEqual(headerSuffix, continuationLines)) {
      return headerLines;
    }
    const headerFrom1 = headerLines.slice(1);
    if (headerFrom1.length === continuationLines.length && isSequenceEqual(headerFrom1, continuationLines)) {
      return headerLines;
    }
  }

  // 3. Cek apakah seluruh baris di continuationLines secara berurutan sudah termuat dalam headerLines
  let allContinuationAlreadyInHeader = true;
  let searchIdx = 0;
  for (const cLine of continuationLines) {
    const foundIdx = headerLines.slice(searchIdx).findIndex(h => h.trim().toLowerCase() === cLine.trim().toLowerCase());
    if (foundIdx === -1) {
      allContinuationAlreadyInHeader = false;
      break;
    }
    searchIdx += foundIdx + 1;
  }

  if (allContinuationAlreadyInHeader && searchIdx === headerLines.length) {
    return headerLines;
  }

  // Jika memang ada baris lanjutan tambahan yang sah dan belum ada di header, gabungkan
  return [...headerLines, ...continuationLines];
}

/**
 * Helper terpadu penentuan status keberangkatan Bahtsul Masail:
 * Mengikuti urutan evaluasi prioritas tinggi:
 * 1. Pengecualian khusus (misal PP Haji Ya'qub terlaksana)
 * 2. BELOM / BELUM: memastikan "BELUM BERANGKAT" TIDAK PERNAH masuk ke SUDAH_BERANGKAT
 * 3. IZIN / BATAL / MUHAFADZOH / BERHALANGAN: status tidak hadir / izin resmi
 * 4. SUDAH / BERANGKAT / TERLAKSANA: status telah terlaksana
 * 5. Fallback nomor agenda & tanggal jika keterangan kosong
 */
export function parseStatusKeberangkatan(rawKet = '', effectiveNo = '', rawTanggal = '', effectiveAcara = '') {
  const acaraLower = String(effectiveAcara || '').toLowerCase();
  const isHajiYaqub = acaraLower.includes("ya'qub") || acaraLower.includes("ya’qub");
  if (isHajiYaqub) return 'SUDAH_BERANGKAT';

  const rawKetUpper = String(rawKet || '').toUpperCase();
  if (rawKetUpper.includes('BELOM') || rawKetUpper.includes('BELUM')) {
    return 'BELUM_BERANGKAT';
  }
  if (
    rawKetUpper.includes('IZIN') ||
    rawKetUpper.includes('BATAL') ||
    rawKetUpper.includes('MUHAFADZOH') ||
    rawKetUpper.includes('MUHAFAZOH') ||
    rawKetUpper.includes('BERHALANGAN')
  ) {
    return 'IZIN';
  }
  if (
    rawKetUpper.includes('SUDAH') ||
    rawKetUpper.includes('TERLAKSANA') ||
    rawKetUpper.includes('BERANGKAT')
  ) {
    return 'SUDAH_BERANGKAT';
  }

  const noInt = parseInt(effectiveNo, 10);
  const tanggalLower = String(rawTanggal || '').toLowerCase();
  const isBelum = (!isNaN(noInt) && noInt >= 20) ||
    tanggalLower.includes('november') ||
    rawTanggal === 'Menunggu Jadwal';
  return isBelum ? 'BELUM_BERANGKAT' : 'SUDAH_BERANGKAT';
}

/**
 * PARSER DATA PEMBERANGKATAN & DELEGASI BAHTSUL MASAIL (LBM)
 * Dilengkapi deteksi status mana yang BELUM BERANGKAT
 */
export async function getBahsuData(csvUrl, options = {}) {
  const csvText = await fetchRawCSV(csvUrl, options);

  const parsed = Papa.parse(csvText, {
    header: false,
    skipEmptyLines: false,
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

  const finalizeEvent = (evt) => {
    if (!evt) return;
    evt.delegasi = mergeDelegasiLines(evt.headerLines, evt.continuationLines);
    delete evt.headerLines;
    delete evt.continuationLines;

    // Validasi entitas forum: abaikan jika nama acara kosong atau baris header yang tersasar
    const cleanAcara = String(evt.acara || '').trim();
    if (!cleanAcara || cleanAcara.toLowerCase() === 'bahtsul masail' || cleanAcara.toLowerCase() === 'acara') {
      return;
    }

    // Cegah duplikasi data entitas forum yang identik persis
    const isDuplicate = events.some((existing) => {
      const matchNo = existing.no && evt.no && String(existing.no).trim() === String(evt.no).trim();
      const matchAcara = existing.acara && evt.acara && existing.acara.trim().toLowerCase() === evt.acara.trim().toLowerCase();
      const matchTanggal = existing.tanggal && evt.tanggal && existing.tanggal.trim().toLowerCase() === evt.tanggal.trim().toLowerCase();
      return (matchNo && matchAcara && matchTanggal) || (matchAcara && matchTanggal && cleanAcara.length >= 5);
    });

    if (!isDuplicate) {
      events.push(evt);
    }
  };

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) {
      if (currentEvent) {
        finalizeEvent(currentEvent);
        currentEvent = null;
      }
      continue;
    }

    const rawNo = String(row[0] || '').trim();
    const rawAcara = String(row[1] || '').trim();
    const rawTanggal = String(row[2] || '').trim();
    const rawDelegasi = String(row[3] || '').trim();
    const rawKet = String(row[4] || '').trim();

    // Deteksi baris kosong sepenuhnya di spreadsheet
    const isRowBlank = !rawNo && !rawAcara && !rawTanggal && !rawDelegasi && !rawKet;
    if (isRowBlank) {
      if (currentEvent) {
        finalizeEvent(currentEvent);
        currentEvent = null;
      }
      continue;
    }

    let effectiveNo = rawNo;
    let effectiveAcara = rawAcara;
    // Pemulihan cerdas untuk baris agenda yang bergeser kolom akibat bug Apps Script lama
    // (nama acara masuk ke kolom No. dan kolom Acara kosong)
    if (!effectiveAcara && effectiveNo && isNaN(parseInt(effectiveNo, 10)) && (rawTanggal || rawDelegasi || rawKet)) {
      effectiveAcara = effectiveNo;
      const prevNo = currentEvent ? parseInt(currentEvent.no, 10) : (events.length > 0 ? parseInt(events[events.length - 1].no, 10) : 0);
      effectiveNo = String((!isNaN(prevNo) && prevNo > 0) ? prevNo + 1 : events.length + 1);
    }

    if (effectiveAcara || (effectiveNo && !isNaN(parseInt(effectiveNo)))) {
      if (currentEvent) {
        finalizeEvent(currentEvent);
      }

      const delegasiLines = rawDelegasi
        ? rawDelegasi.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
        : [];

      const statusKeberangkatan = parseStatusKeberangkatan(rawKet, effectiveNo, rawTanggal, effectiveAcara);
      const isBelumBerangkat = (statusKeberangkatan === 'BELUM_BERANGKAT');
      const isHajiYaqub = effectiveAcara.toLowerCase().includes("ya'qub") || effectiveAcara.toLowerCase().includes("ya’qub");

      currentEvent = {
        id: i,
        no: effectiveNo || String(events.length + 1),
        acara: effectiveAcara || `Forum Bahsul Masail #${events.length + 1}`,
        tanggal: rawTanggal || 'Menunggu Jadwal',
        headerLines: delegasiLines,
        continuationLines: [],
        delegasi: delegasiLines,
        keterangan: isHajiYaqub ? 'SUDAH' : (rawKet || (delegasiLines.length > 0 ? 'Delegasi' : 'Terjadwal')),
        isBelumBerangkat,
        statusKeberangkatan,
      };
    } else if (currentEvent) {
      // Jika baris lanjutan memiliki tanggal tersendiri yang berbeda dengan agenda aktif,
      // jangan masukkan ke delegasi event sebelumnya karena merupakan draf/agenda terpisah
      if (rawTanggal && currentEvent.tanggal && rawTanggal !== currentEvent.tanggal) {
        finalizeEvent(currentEvent);
        currentEvent = null;
        continue;
      }

      if (rawDelegasi) {
        const splitLines = rawDelegasi.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
        currentEvent.continuationLines.push(...splitLines);
      }
      if (rawKet && !currentEvent.keterangan) {
        currentEvent.keterangan = rawKet;
      }
    }
  }

  if (currentEvent) {
    finalizeEvent(currentEvent);
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
export async function getKalenderData(csvUrl, options = {}) {
  const csvText = await fetchRawCSV(csvUrl, options);

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
    throw new Error('Data kalender kegiatan tidak ditemukan atau format kolom spreadsheet tidak sesuai.');
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
export async function getKeuanganData(csvUrl, options = {}) {
  const csvText = await fetchRawCSV(csvUrl, options);

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
 * Mendeteksi susunan kolom secara dinamis agar seluruh rincian (uraian, kategori, jumlah, harga satuan, nominal RAB, dan realisasi LPJ) terbaca akurat sesuai spreadsheet asli.
 */
export async function fetchDetailSheetData(csvUrl, options = {}) {
  const csvText = await fetchRawCSV(csvUrl, options);

  const parsed = Papa.parse(csvText, {
    header: false,
    skipEmptyLines: false,
  });

  const rows = parsed.data || [];
  let title = "RINCIAN ANGGARAN & BELANJA";
  let docNumber = "";
  const sections = [];
  let currentSection = null;
  let currentColMap = {
    no: 0,
    uraian: 1,
    kategori: -1,
    jumlah: -1,
    hargaSatuan: -1,
    anggaran: -1,
    kenyataan: -1,
    saldo: -1,
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    const cell0 = String(row[0] || '').trim();
    const cell1 = String(row[1] || '').trim();

    if (i < 4) {
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
      cell0.toLowerCase().startsWith('rincian anggaran') ||
      cell0.toLowerCase().startsWith('kegiatan mubahitsat') ||
      cell0.toLowerCase().startsWith('pembukaan mubahitsat');

    if (isSectionHeader) {
      currentSection = {
        title: cell0,
        items: [],
      };
      sections.push(currentSection);
      currentColMap = {
        no: 0,
        uraian: 1,
        kategori: -1,
        jumlah: -1,
        hargaSatuan: -1,
        anggaran: -1,
        kenyataan: -1,
        saldo: -1,
      };
      continue;
    }

    // Deteksi baris header kolom
    const rowLower = row.map((c) => String(c || '').trim().toLowerCase());
    const hasUraian = rowLower.some((c) => c === 'uraian' || c === 'rincian');
    const hasNominal = rowLower.some(
      (c) => c.includes('anggaran') || c.includes('rab') || c.includes('kenyataan')
    );

    if (hasUraian || (rowLower.includes('no') && hasNominal)) {
      currentColMap = {
        no: -1,
        uraian: -1,
        kategori: -1,
        jumlah: -1,
        hargaSatuan: -1,
        anggaran: -1,
        kenyataan: -1,
        saldo: -1,
      };
      rowLower.forEach((c, idx) => {
        if (c === 'no' || c === 'no.' || c === 'kode') currentColMap.no = idx;
        else if (c === 'uraian' || c === 'rincian') currentColMap.uraian = idx;
        else if (c === 'kategori') currentColMap.kategori = idx;
        else if (c === 'jumlah' || c === 'kebutuhan' || c === 'vol' || c === 'qty')
          currentColMap.jumlah = idx;
        else if (c.includes('harga') || c === 'satuan') currentColMap.hargaSatuan = idx;
        else if (c.includes('anggaran') || c === 'rab') currentColMap.anggaran = idx;
        else if (c.includes('kenyataan') || c.includes('realisasi'))
          currentColMap.kenyataan = idx;
        else if (c.includes('saldo') || c.includes('sisa')) currentColMap.saldo = idx;
      });
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
    const isTotal =
      fullRow.includes('total') || fullRow.includes('subtotal') || fullRow.includes('saldo');

    const uIdx = currentColMap.uraian !== -1 ? currentColMap.uraian : 1;
    const uraian = row[uIdx] ? String(row[uIdx]).trim() : isTotal ? cell0 : '';

    if (uraian || isTotal) {
      const getVal = (idx) => (idx !== -1 && row[idx] ? String(row[idx]).trim() : '-');
      const item = {
        no: getVal(currentColMap.no !== -1 ? currentColMap.no : 0),
        uraian: uraian || cell0,
        kategori:
          currentColMap.kategori !== -1 && row[currentColMap.kategori]
            ? String(row[currentColMap.kategori]).trim()
            : currentSection?.title || '-',
        jumlah: getVal(currentColMap.jumlah),
        hargaSatuan: getVal(currentColMap.hargaSatuan),
        anggaran: getVal(currentColMap.anggaran),
        kenyataan: getVal(currentColMap.kenyataan),
        saldo: getVal(currentColMap.saldo),
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
